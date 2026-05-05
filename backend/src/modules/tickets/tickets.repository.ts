/**
 * Repository de tickets con acceso a Drizzle
 * Contiene toda la lógica de acceso a datos
 */

import { db } from '../../db/client.js';
import {
  tickets,
  ticketAssignees,
  ticketLabels,
  users,
} from '../../db/schema.js';
import { eq, and, lt, gt, inArray, isNull, like, count as sqlCount, sql } from 'drizzle-orm';
import { CreateTicketInput, ListTicketsFilters, TicketWithDetails, UpdateTicketInput } from './tickets.types.js';
import { generateId } from '../../lib/utils/ids.js';

export class TicketsRepository {
  /**
   * Obtiene lista paginada de tickets con filtros
   */
  async listTickets(filters: ListTicketsFilters): Promise<{
    tickets: Array<{ id: string }>;
    total: number;
  }> {
    const {
      skip,
      take,
      status,
      priority,
      assignee_id,
      label,
      from_date,
      to_date,
    } = filters;

    // Construir condiciones WHERE
    const conditions = [isNull(tickets.archived_at)]; // Solo tickets activos

    if (status) conditions.push(eq(tickets.status, status));
    if (priority) conditions.push(eq(tickets.priority, priority));

    if (from_date) {
      conditions.push(gt(tickets.created_at, from_date));
    }
    if (to_date) {
      conditions.push(lt(tickets.created_at, to_date));
    }

    // Query base
    const baseQuery = db
      .select({ id: tickets.id })
      .from(tickets)
      .where(and(...conditions));

    // Si hay filtro por assignee, inner join con ticketAssignees
    let query = baseQuery;
    if (assignee_id) {
      query = db
        .selectDistinct({ id: tickets.id })
        .from(tickets)
        .innerJoin(
          ticketAssignees,
          eq(tickets.id, ticketAssignees.ticket_id)
        )
        .where(
          and(...conditions, eq(ticketAssignees.user_id, assignee_id))
        );
    }

    // Si hay filtro por label, inner join con ticketLabels
    if (label) {
      query = db
        .selectDistinct({ id: tickets.id })
        .from(tickets)
        .innerJoin(ticketLabels, eq(tickets.id, ticketLabels.ticket_id))
        .where(
          and(...conditions, like(ticketLabels.label, `%${label}%`))
        );
    }

    // Contar total con filtros aplicados
    const [{ count }] = await db
      .select({ count: sqlCount() })
      .from(tickets)
      .where(and(...conditions));

    // Obtener IDs paginados
    const ticketIds = await query.limit(take).offset(skip);

    if (ticketIds.length === 0) {
      return { tickets: [], total: Number(count) || 0 };
    }

    // Obtener detalles completos de tickets
    const ticketRecords = await db
      .select()
      .from(tickets)
      .where(inArray(tickets.id, ticketIds.map((t: { id: string }) => t.id)));

    return {
      tickets: ticketRecords,
      total: Number(count) || 0,
    };
  }

  /**
   * Obtiene ticket completo con assignees y labels
   * Usa Promise.all para paralelismo
   */
  async getTicketWithDetails(ticketId: string): Promise<TicketWithDetails | null> {
    const ticket = await db
      .select()
      .from(tickets)
      .where(eq(tickets.id, ticketId))
      .then((results: Array<typeof tickets.$inferSelect>) => results[0] || null);

    if (!ticket) return null;

    // Obtener assignees y labels en paralelo
    const [assigneeRecords, labelRecords, creatorRecord] = await Promise.all([
      db
        .select({
          user_id: ticketAssignees.user_id,
          name: users.name,
          handle: users.handle,
          id: users.id,
        })
        .from(ticketAssignees)
        .innerJoin(users, eq(ticketAssignees.user_id, users.id))
        .where(eq(ticketAssignees.ticket_id, ticketId)),

      db
        .select({ label: ticketLabels.label })
        .from(ticketLabels)
        .where(eq(ticketLabels.ticket_id, ticketId)),

      db
        .select({
          id: users.id,
          name: users.name,
          handle: users.handle,
        })
        .from(users)
        .where(eq(users.id, ticket.created_by))
        .then((results: Array<{ id: string; name: string; handle: string }>) => results[0] || null),
    ]);

    if (!creatorRecord) return null;

    return {
      id: ticket.id,
      title: ticket.title,
      description: ticket.description,
      status: ticket.status as any,
      priority: ticket.priority as any,
      is_blocked: ticket.is_blocked,
      version: ticket.version,
      created_by: creatorRecord,
      assignees: assigneeRecords.map((a: { id: string; name: string; handle: string }) => ({
        id: a.id,
        name: a.name,
        handle: a.handle,
      })),
      labels: labelRecords.map((l: { label: string }) => l.label),
      created_at: ticket.created_at || '',
      updated_at: ticket.updated_at || '',
      archived_at: ticket.archived_at || null,
    };
  }

  /**
   * Crea nuevo ticket
   */
  async createTicket(
    input: CreateTicketInput,
    userId: string
  ): Promise<string> {
    const ticketId = generateId();

    await db.insert(tickets).values({
      id: ticketId,
      title: input.title,
      description: input.description || null,
      priority: input.priority,
      created_by: userId,
      status: 'TODO',
    });

    return ticketId;
  }

  /**
   * Asigna múltiples usuarios a un ticket
   * Usa Promise.all para paralelismo
   */
  async assignUsersToTicket(
    ticketId: string,
    userIds: string[]
  ): Promise<void> {
    if (userIds.length === 0) return;

    const assignments = userIds.map((userId) => ({
      ticket_id: ticketId,
      user_id: userId,
    }));

    // Usar Promise.all para insertar en paralelo
    await Promise.all(
      assignments.map((assignment) =>
        db
          .insert(ticketAssignees)
          .values(assignment)
          .onConflictDoNothing() // Ignorar duplicados
      )
    );
  }

  /**
   * Agrega etiquetas a un ticket
   * Usa Promise.all para paralelismo
   */
  async addLabelsToTicket(ticketId: string, labels: string[]): Promise<void> {
    if (labels.length === 0) return;

    const labelRecords = labels.map((label) => ({
      ticket_id: ticketId,
      label,
    }));

    // Usar Promise.all para insertar en paralelo
    await Promise.all(
      labelRecords.map((record) =>
        db
          .insert(ticketLabels)
          .values(record)
          .onConflictDoNothing() // Ignorar duplicados
      )
    );
  }

  /**
   * Valida que todos los usuarios asignados existan y estén activos
   */
  async validateAssignees(userIds: string[]): Promise<boolean> {
    if (userIds.length === 0) return true;

    const activeUsers = await db
      .select({ id: users.id })
      .from(users)
      .where(inArray(users.id, userIds));

    return activeUsers.length === userIds.length;
  }

  async updateStatusWithVersion(
    ticketId: string,
    status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE',
    version: number
  ): Promise<number> {
    const result = await db
      .update(tickets)
      .set({
        status,
        version: sql`${tickets.version} + 1`,
        updated_at: new Date().toISOString(),
      })
      .where(and(eq(tickets.id, ticketId), eq(tickets.version, version)));

    if (result && typeof result === 'object' && 'changes' in result) {
      const changes = Number((result as { changes?: number }).changes ?? 0);
      return Number.isFinite(changes) ? changes : 0;
    }

    return 0;
  }

  async updateWithVersion(
    ticketId: string,
    input: UpdateTicketInput
  ): Promise<number> {
    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
      version: sql`${tickets.version} + 1`,
    };

    if (typeof input.title === 'string') updates.title = input.title;
    if (typeof input.description !== 'undefined') updates.description = input.description;
    if (typeof input.status !== 'undefined') updates.status = input.status;
    if (typeof input.priority !== 'undefined') updates.priority = input.priority;
    if (typeof input.is_blocked !== 'undefined') updates.is_blocked = input.is_blocked;

    const result = await db
      .update(tickets)
      .set(updates)
      .where(and(eq(tickets.id, ticketId), eq(tickets.version, input.version), isNull(tickets.archived_at)));

    if (result && typeof result === 'object' && 'changes' in result) {
      const changes = Number((result as { changes?: number }).changes ?? 0);
      return Number.isFinite(changes) ? changes : 0;
    }

    return 0;
  }

  async archiveTicket(ticketId: string): Promise<number> {
    const result = await db
      .update(tickets)
      .set({
        archived_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        version: sql`${tickets.version} + 1`,
      })
      .where(and(eq(tickets.id, ticketId), isNull(tickets.archived_at)));

    if (result && typeof result === 'object' && 'changes' in result) {
      const changes = Number((result as { changes?: number }).changes ?? 0);
      return Number.isFinite(changes) ? changes : 0;
    }

    return 0;
  }
}

export const ticketsRepository = new TicketsRepository();
