export interface ListCommentsQuery {
  ticket_id: string
}

export interface CreateCommentInput {
  ticket_id: string
  body: string
}

export interface CommentDto {
  id: string
  ticket_id: string
  author: {
    id: string
    name: string
    handle: string
  }
  body: string
  mentions: string[]
  created_at: string
  archived_at: string | null
}
