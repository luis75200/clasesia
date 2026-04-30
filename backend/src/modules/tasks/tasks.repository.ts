import { and, count as sqlCount, eq, gt, inArray, isNull, like, lt, sql } from 'drizzle-orm';
import { db } from '../../db/client.js';
import { ticketAssignees, ticketLabels, tickets, users } from '../../db/schema.js';
import { generateId } from '../../lib/utils/ids.js';
import { CreateTaskInput, ListTasksFilters, TaskAuthor, TaskDetails } from './tasks.types.js';

export class TasksRepository {
  async listTaskIds(filters: ListTasksFilters): Promise<{ ids: string[]; total: number }> {
    const conditions = [isNull(tickets.archived_at)];

    if (filters.status) conditions.push(eq(tickets.status, filters.status));
    if (filters.priority) conditions.push(eq(tickets.priority, filters.priority));
    if (filters.from_date) conditions.push(gt(tickets.created_at, filters.from_date));
    if (filters.to_date) conditions.push(lt(tickets.created_at, filters.to_date));

    const [{ total }] = await db
      .select({ total: sqlCount() })
      .from(tickets)
      .where(and(...conditions));

    let query = db.select({ id: tickets.id }).from(tickets).where(and(...conditions));

    if (filters.assignee_id) {
      query = db
        .selectDistinct({ id: tickets.id })
        .from(tickets)
        .innerJoin(ticketAssignees, eq(tickets.id, ticketAssignees.ticket_id))
        .where(and(...conditions, eq(ticketAssignees.user_id, filters.assignee_id)));
    }

    if (filters.label) {
      query = db
        .selectDistinct({ id: tickets.id })
        .from(tickets)
        .innerJoin(ticketLabels, eq(tickets.id, ticketLabels.ticket_id))
        .where(and(...conditions, like(ticketLabels.label, `%${filters.label}%`)));
    }

    const pageRows = await query.limit(filters.take).offset(filters.skip);

    return { ids: pageRows.map((row) => row.id), total: Number(total) || 0 };
  }

  async getTaskDetails(taskId: string): Promise<TaskDetails | null> {
    const ticketRow = await db
      .select()
      .from(tickets)
      .where(eq(tickets.id, taskId))
      .then((rows) => rows[0] ?? null);

    if (!ticketRow) return null;

    const [assigneeRows, labelRows, creatorRow] = await Promise.all([
      db
        .select({ id: users.id, name: users.name, handle: users.handle })
        .from(ticketAssignees)
        .innerJoin(users, eq(ticketAssignees.user_id, users.id))
        .where(eq(ticketAssignees.ticket_id, taskId)),
      db.select({ label: ticketLabels.label }).from(ticketLabels).where(eq(ticketLabels.ticket_id, taskId)),
      db
        .select({ id: users.id, name: users.name, handle: users.handle })
        .from(users)
        .where(eq(users.id, ticketRow.created_by))
        .then((rows) => rows[0] ?? null),
    ]);

    if (!creatorRow) return null;

    const author: TaskAuthor = {
      id: creatorRow.id,
      name: creatorRow.name,
      handle: creatorRow.handle,
    };

    return {
      id: ticketRow.id,
      title: ticketRow.title,
      description: ticketRow.description,
      status: ticketRow.status,
      priority: ticketRow.priority,
      project_id: ticketRow.project_id,
      is_blocked: ticketRow.is_blocked,
      version: ticketRow.version,
      created_by: author,
      assignees: assigneeRows.map((row) => ({ id: row.id, name: row.name, handle: row.handle })),
      labels: labelRows.map((row) => row.label),
      created_at: ticketRow.created_at,
      updated_at: ticketRow.updated_at,
      archived_at: ticketRow.archived_at,
    };
  }

  async createTask(input: CreateTaskInput, userId: string): Promise<string> {
    const taskId = generateId();

    await db.insert(tickets).values({
      id: taskId,
      title: input.title,
      description: input.description ?? null,
      priority: input.priority,
      status: 'TODO',
      created_by: userId,
      project_id: input.project_id ?? null,
    });

    return taskId;
  }

  async validateAssignees(userIds: string[]): Promise<boolean> {
    if (userIds.length === 0) return true;
    const rows = await db
      .select({ id: users.id })
      .from(users)
      .where(and(inArray(users.id, userIds), eq(users.is_active, true)));
    return rows.length === userIds.length;
  }

  async attachAssignees(taskId: string, assignees: string[]): Promise<void> {
    if (assignees.length === 0) return;
    await Promise.all(
      assignees.map((userId) =>
        db
          .insert(ticketAssignees)
          .values({ ticket_id: taskId, user_id: userId })
          .onConflictDoNothing()
      )
    );
  }

  async attachLabels(taskId: string, labels: string[]): Promise<void> {
    if (labels.length === 0) return;
    const normalizedLabels = [...new Set(labels.map((label) => label.trim()).filter(Boolean))];

    await Promise.all(
      normalizedLabels.map((label) =>
        db
          .insert(ticketLabels)
          .values({ ticket_id: taskId, label })
          .onConflictDoNothing()
      )
    );
  }

  async assignProject(taskId: string, projectId: string): Promise<void> {
    await db
      .update(tickets)
      .set({
        project_id: projectId,
        updated_at: new Date().toISOString(),
        version: sql`${tickets.version} + 1`,
      })
      .where(eq(tickets.id, taskId));
  }
}

export const tasksRepository = new TasksRepository();
