import { and, eq, inArray, isNull } from 'drizzle-orm'
import { db } from '../../db/client.js'
import { comments, notifications, ticketAssignees, tickets, users } from '../../db/schema.js'
import { generateId } from '../../lib/utils/ids.js'
import type { CommentDto, CreateCommentInput } from './comments.types.js'

export class CommentsRepository {
  async listByTicket(ticketId: string): Promise<CommentDto[]> {
    const rows = await db
      .select({
        id: comments.id,
        ticket_id: comments.ticket_id,
        body: comments.body,
        created_at: comments.created_at,
        archived_at: comments.archived_at,
        author_id: users.id,
        author_name: users.name,
        author_handle: users.handle,
      })
      .from(comments)
      .innerJoin(users, eq(comments.author_id, users.id))
      .where(and(eq(comments.ticket_id, ticketId), isNull(comments.archived_at)))

    return rows.map((row) => ({
      id: row.id,
      ticket_id: row.ticket_id,
      author: {
        id: row.author_id,
        name: row.author_name,
        handle: row.author_handle,
      },
      body: row.body,
      mentions: extractMentions(row.body),
      created_at: row.created_at,
      archived_at: row.archived_at,
    }))
  }

  async createComment(input: CreateCommentInput, authorId: string): Promise<string> {
    const id = generateId()

    await db.insert(comments).values({
      id,
      ticket_id: input.ticket_id,
      author_id: authorId,
      body: input.body,
    })

    return id
  }

  async getComment(commentId: string): Promise<CommentDto | null> {
    const row = await db
      .select({
        id: comments.id,
        ticket_id: comments.ticket_id,
        body: comments.body,
        created_at: comments.created_at,
        archived_at: comments.archived_at,
        author_id: users.id,
        author_name: users.name,
        author_handle: users.handle,
      })
      .from(comments)
      .innerJoin(users, eq(comments.author_id, users.id))
      .where(eq(comments.id, commentId))
      .then((rows) => rows[0] ?? null)

    if (!row) return null

    return {
      id: row.id,
      ticket_id: row.ticket_id,
      author: {
        id: row.author_id,
        name: row.author_name,
        handle: row.author_handle,
      },
      body: row.body,
      mentions: extractMentions(row.body),
      created_at: row.created_at,
      archived_at: row.archived_at,
    }
  }

  async archiveComment(commentId: string): Promise<number> {
    const result = await db
      .update(comments)
      .set({
        archived_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .where(and(eq(comments.id, commentId), isNull(comments.archived_at)))

    if (result && typeof result === 'object' && 'changes' in result) {
      return Number((result as { changes?: number }).changes ?? 0)
    }

    return 0
  }

  async getTicketAssigneeIds(ticketId: string): Promise<string[]> {
    const rows = await db
      .select({ user_id: ticketAssignees.user_id })
      .from(ticketAssignees)
      .innerJoin(tickets, eq(ticketAssignees.ticket_id, tickets.id))
      .where(and(eq(ticketAssignees.ticket_id, ticketId), isNull(tickets.archived_at)))

    return rows.map((row) => row.user_id)
  }

  async getUserIdsByHandles(handles: string[]): Promise<string[]> {
    if (handles.length === 0) return []

    const rows = await db
      .select({ id: users.id })
      .from(users)
      .where(inArray(users.handle, handles))

    return rows.map((row) => row.id)
  }

  async createNotifications(commentId: string, ticketId: string, recipientIds: string[]): Promise<void> {
    if (recipientIds.length === 0) return

    await Promise.all(
      recipientIds.map((recipientId) =>
        db.insert(notifications).values({
          id: generateId(),
          recipient_id: recipientId,
          ticket_id: ticketId,
          comment_id: commentId,
          type: 'COMMENT_ADDED',
          status: 'PENDING',
          message: 'Nuevo comentario en ticket asignado',
        }),
      ),
    )
  }

  async markNotificationsSent(commentId: string): Promise<void> {
    await db
      .update(notifications)
      .set({
        status: 'SENT',
        dispatched_at: new Date().toISOString(),
      })
      .where(and(eq(notifications.comment_id, commentId), eq(notifications.status, 'PENDING')))
  }

  async cancelNotifications(commentId: string): Promise<void> {
    await db
      .update(notifications)
      .set({
        status: 'CANCELLED',
      })
      .where(and(eq(notifications.comment_id, commentId), eq(notifications.status, 'PENDING')))
  }
}

function extractMentions(body: string): string[] {
  const regex = /@([a-zA-Z0-9._-]+)/g
  const mentions = new Set<string>()
  let match: RegExpExecArray | null = regex.exec(body)

  while (match) {
    mentions.add(match[1])
    match = regex.exec(body)
  }

  return [...mentions]
}

export const commentsRepository = new CommentsRepository()
