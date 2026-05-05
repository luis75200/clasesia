/**
 * Service de tickets
 * Contiene lógica de negocio y orquestación
 */

import { ticketsRepository } from './tickets.repository.js';
import {
  ChangeTicketStatusInput,
  CreateTicketInput,
  ListTicketsFilters,
  ListTicketsResult,
  TicketWithDetails,
  UpdateTicketInput,
} from './tickets.types.js';
import { Errors } from '../../lib/http/api-error.js';
import { validateDateRange } from './tickets.validation.js';

export class TicketsService {
  private assertCanEditTicket(
    actor: { id: string; role: 'admin' | 'member' },
    ticket: TicketWithDetails
  ) {
    if (actor.role === 'member' && ticket.created_by.id !== actor.id) {
      throw Errors.FORBIDDEN('No puedes editar tickets creados por otro usuario');
    }
  }

  /**
   * Lista tickets con filtros y paginación
   * Try-catch interno sin exponer trazas
   */
  async listTickets(
    filters: ListTicketsFilters
  ): Promise<ListTicketsResult> {
    try {
      // Validar rango de fechas si se proporcionan
      if (filters.from_date && filters.to_date) {
        if (!validateDateRange(filters.from_date, filters.to_date)) {
          throw Errors.BAD_REQUEST(
            'from_date debe ser anterior o igual a to_date'
          );
        }
      }

      const { tickets: ticketRecords, total } =
        await ticketsRepository.listTickets(filters);

      // Obtener detalles completos de tickets en paralelo
      const ticketDetails = await Promise.all(
        ticketRecords.map((ticket: { id: string }) =>
          ticketsRepository.getTicketWithDetails(ticket.id)
        )
      );

      // Filtrar nulls
      const validTickets = ticketDetails.filter(
        (t: TicketWithDetails | null): t is TicketWithDetails => t !== null
      ) as TicketWithDetails[];

      return {
        data: validTickets,
        total,
        skip: filters.skip,
        take: filters.take,
      };
    } catch (error) {
      // Si es ApiError, relanzar
      if (error instanceof Error && error.name === 'ApiError') {
        throw error;
      }

      // Log de error interno (no exponer al cliente)
      console.error('[TicketsService.listTickets]', error);

      throw Errors.INTERNAL_ERROR(
        'Error al obtener lista de tickets',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Obtiene un ticket por ID
   */
  async getTicketById(ticketId: string): Promise<TicketWithDetails> {
    try {
      const ticket = await ticketsRepository.getTicketWithDetails(ticketId);

      if (!ticket) {
        throw Errors.NOT_FOUND('Ticket');
      }

      return ticket;
    } catch (error) {
      if (error instanceof Error && error.name === 'ApiError') {
        throw error;
      }

      console.error('[TicketsService.getTicketById]', error);
      throw Errors.INTERNAL_ERROR('Error al obtener ticket', error instanceof Error ? error : undefined);
    }
  }

  /**
   * Crea nuevo ticket
   * Try-catch interno con validación de asignados
   */
  async createTicket(
    input: CreateTicketInput,
    userId: string
  ): Promise<TicketWithDetails> {
    try {
      // Validar que los usuarios asignados existan
      if (input.assignees && input.assignees.length > 0) {
        const allExist = await ticketsRepository.validateAssignees(
          input.assignees
        );

        if (!allExist) {
          throw Errors.BAD_REQUEST(
            'Uno o más usuarios asignados no existen o no están activos'
          );
        }
      }

      // Crear ticket
      const ticketId = await ticketsRepository.createTicket(input, userId);

      // Asignar usuarios y agregar etiquetas en paralelo
      await Promise.all([
        input.assignees && input.assignees.length > 0
          ? ticketsRepository.assignUsersToTicket(ticketId, input.assignees)
          : Promise.resolve(),

        input.labels && input.labels.length > 0
          ? ticketsRepository.addLabelsToTicket(ticketId, input.labels)
          : Promise.resolve(),
      ]);

      // Obtener ticket completo recién creado
      const newTicket = await ticketsRepository.getTicketWithDetails(ticketId);

      if (!newTicket) {
        throw Errors.INTERNAL_ERROR('No se pudo recuperar ticket recién creado');
      }

      return newTicket;
    } catch (error) {
      if (error instanceof Error && error.name === 'ApiError') {
        throw error;
      }

      console.error('[TicketsService.createTicket]', error);
      throw Errors.INTERNAL_ERROR(
        'Error al crear ticket',
        error instanceof Error ? error : undefined
      );
    }
  }

  async changeTicketStatus(
    ticketId: string,
    input: ChangeTicketStatusInput,
    actor: { id: string; role: 'admin' | 'member' }
  ): Promise<TicketWithDetails> {
    try {
      const existing = await ticketsRepository.getTicketWithDetails(ticketId);
      if (!existing || existing.archived_at) {
        throw Errors.NOT_FOUND('Ticket');
      }

      this.assertCanEditTicket(actor, existing);

      const updatedRows = await ticketsRepository.updateStatusWithVersion(
        ticketId,
        input.status,
        input.version
      );

      if (updatedRows === 0) {
        throw Errors.CONFLICT('Conflicto de versión. El ticket fue modificado por otro usuario.');
      }

      const updated = await ticketsRepository.getTicketWithDetails(ticketId);
      if (!updated) {
        throw Errors.INTERNAL_ERROR('No se pudo recuperar ticket actualizado');
      }

      return updated;
    } catch (error) {
      if (error instanceof Error && error.name === 'ApiError') {
        throw error;
      }

      console.error('[TicketsService.changeTicketStatus]', error);
      throw Errors.INTERNAL_ERROR(
        'Error al cambiar estado de ticket',
        error instanceof Error ? error : undefined
      );
    }
  }

  async updateTicket(
    ticketId: string,
    input: UpdateTicketInput,
    actor: { id: string; role: 'admin' | 'member' }
  ): Promise<TicketWithDetails> {
    try {
      const existing = await ticketsRepository.getTicketWithDetails(ticketId);
      if (!existing || existing.archived_at) {
        throw Errors.NOT_FOUND('Ticket');
      }

      this.assertCanEditTicket(actor, existing);

      const updatedRows = await ticketsRepository.updateWithVersion(ticketId, input);
      if (updatedRows === 0) {
        throw Errors.CONFLICT('Conflicto de versión. El ticket fue modificado por otro usuario.');
      }

      const updated = await ticketsRepository.getTicketWithDetails(ticketId);
      if (!updated) {
        throw Errors.INTERNAL_ERROR('No se pudo recuperar ticket actualizado');
      }

      return updated;
    } catch (error) {
      if (error instanceof Error && error.name === 'ApiError') {
        throw error;
      }

      console.error('[TicketsService.updateTicket]', error);
      throw Errors.INTERNAL_ERROR(
        'Error al actualizar ticket',
        error instanceof Error ? error : undefined
      );
    }
  }

  async archiveTicket(
    ticketId: string,
    actor: { id: string; role: 'admin' | 'member' }
  ): Promise<void> {
    try {
      const existing = await ticketsRepository.getTicketWithDetails(ticketId);
      if (!existing || existing.archived_at) {
        throw Errors.NOT_FOUND('Ticket');
      }

      this.assertCanEditTicket(actor, existing);

      const updatedRows = await ticketsRepository.archiveTicket(ticketId);
      if (updatedRows === 0) {
        throw Errors.NOT_FOUND('Ticket');
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'ApiError') {
        throw error;
      }

      console.error('[TicketsService.archiveTicket]', error);
      throw Errors.INTERNAL_ERROR(
        'Error al archivar ticket',
        error instanceof Error ? error : undefined
      );
    }
  }
}

export const ticketsService = new TicketsService();
