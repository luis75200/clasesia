import { Errors } from '../../http/api-error.js'
import { ApiError } from '../../lib/http/api-error.js'
import { commentsRepository } from './comments.repository.js'
import type { CommentDto, CreateCommentInput, ListCommentsQuery } from './comments.types.js'

const DISPATCH_DELAY_MS = 1200

export class CommentsService {
  async listComments(query: ListCommentsQuery): Promise<CommentDto[]> {
    try {
      return await commentsRepository.listByTicket(query.ticket_id)
    } catch (error) {
      if (error instanceof ApiError) throw error
      console.error('[CommentsService.listComments]', error)
      throw Errors.INTERNAL_ERROR('Error al listar comentarios')
    }
  }

  async createComment(input: CreateCommentInput, author: { id: string }): Promise<CommentDto> {
    try {
      const commentId = await commentsRepository.createComment(input, author.id)
      const created = await commentsRepository.getComment(commentId)

      if (!created) {
        throw Errors.INTERNAL_ERROR('No se pudo recuperar comentario creado')
      }

      const assigneeIds = await commentsRepository.getTicketAssigneeIds(input.ticket_id)
      const mentionIds = await commentsRepository.getUserIdsByHandles(created.mentions)

      const recipientIds = [...new Set([...assigneeIds, ...mentionIds])].filter((id) => id !== author.id)
      await commentsRepository.createNotifications(created.id, created.ticket_id, recipientIds)

      setTimeout(() => {
        void this.dispatchNotifications(created.id)
      }, DISPATCH_DELAY_MS)

      return created
    } catch (error) {
      if (error instanceof ApiError) throw error
      console.error('[CommentsService.createComment]', error)
      throw Errors.INTERNAL_ERROR('Error al crear comentario')
    }
  }

  async archiveComment(commentId: string, actor: { id: string; role: 'admin' | 'member' }): Promise<void> {
    try {
      const comment = await commentsRepository.getComment(commentId)
      if (!comment || comment.archived_at) {
        throw Errors.NOT_FOUND('Comentario')
      }

      if (actor.role === 'member' && comment.author.id !== actor.id) {
        throw Errors.FORBIDDEN('No puedes archivar comentarios de otros usuarios')
      }

      const rows = await commentsRepository.archiveComment(commentId)
      if (rows === 0) {
        throw Errors.NOT_FOUND('Comentario')
      }

      await commentsRepository.cancelNotifications(commentId)
    } catch (error) {
      if (error instanceof ApiError) throw error
      console.error('[CommentsService.archiveComment]', error)
      throw Errors.INTERNAL_ERROR('Error al archivar comentario')
    }
  }

  private async dispatchNotifications(commentId: string): Promise<void> {
    const comment = await commentsRepository.getComment(commentId)

    if (!comment || comment.archived_at) {
      await commentsRepository.cancelNotifications(commentId)
      return
    }

    await commentsRepository.markNotificationsSent(commentId)
  }
}

export const commentsService = new CommentsService()
