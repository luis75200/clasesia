import { sqliteTable, text, integer, primaryKey, foreignKey, uniqueIndex, index, check } from 'drizzle-orm/sqlite-core'
import { relations, sql } from 'drizzle-orm'

/**
 * ============================================================
 * TABLES (SQLite)
 * ============================================================
 */

/**
 * users — Usuarios aprovisionados por admin y autenticados vía Google Workspace
 */
export const users = sqliteTable(
  'users',
  {
    id: text('id').primaryKey(),
    email: text('email').notNull().unique(),
    name: text('name').notNull(),
    handle: text('handle').notNull().unique(),
    role: text('role', { enum: ['admin', 'member'] }).notNull().default('member'),
    is_active: integer('is_active', { mode: 'boolean' }).notNull().default(true),
    google_subject: text('google_subject').unique(),
    avatar_url: text('avatar_url'),
    last_login_at: text('last_login_at'),
    created_at: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
    updated_at: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    roleIdx: index('idx_users_role').on(table.role),
    isActiveIdx: index('idx_users_is_active').on(table.is_active),
    emailNotBlankCk: check('ck_users_email_not_blank', sql`trim(email) <> ''`),
    nameNotBlankCk: check('ck_users_name_not_blank', sql`trim(name) <> ''`),
    handleNotBlankCk: check('ck_users_handle_not_blank', sql`trim(handle) <> ''`),
  })
)

/**
 * auth_sessions — Sesiones web persistidas para cookie HttpOnly
 */
export const authSessions = sqliteTable(
  'auth_sessions',
  {
    id: text('id').primaryKey(),
    user_id: text('user_id').notNull(),
    session_token: text('session_token').notNull().unique(),
    status: text('status', { enum: ['ACTIVE', 'EXPIRED', 'REVOKED'] }).notNull().default('ACTIVE'),
    ip_address: text('ip_address'),
    user_agent: text('user_agent'),
    expires_at: text('expires_at').notNull(),
    last_seen_at: text('last_seen_at'),
    created_at: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
    updated_at: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    userIdIdx: index('idx_auth_sessions_user_id').on(table.user_id),
    statusIdx: index('idx_auth_sessions_status').on(table.status),
    userIdFk: foreignKey({ columns: [table.user_id], foreignColumns: [users.id], name: 'fk_auth_sessions_user_id' }).onDelete('cascade'),
  })
)

/**
 * projects — Proyectos para agrupar tareas/tickets
 */
export const projects = sqliteTable(
  'projects',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    key: text('key').notNull().unique(),
    description: text('description'),
    status: text('status', { enum: ['ACTIVE', 'ARCHIVED'] }).notNull().default('ACTIVE'),
    owner_id: text('owner_id').notNull(),
    archived_at: text('archived_at'),
    created_at: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
    updated_at: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    nameIdx: index('idx_projects_name').on(table.name),
    statusIdx: index('idx_projects_status').on(table.status),
    ownerIdx: index('idx_projects_owner_id').on(table.owner_id),
    archivedAtIdx: index('idx_projects_archived_at').on(table.archived_at),
    ownerIdFk: foreignKey({ columns: [table.owner_id], foreignColumns: [users.id], name: 'fk_projects_owner_id' }).onDelete('restrict'),
    nameNotBlankCk: check('ck_projects_name_not_blank', sql`trim(name) <> ''`),
    keyNotBlankCk: check('ck_projects_key_not_blank', sql`trim(key) <> ''`),
  })
)

/**
 * tickets — Tickets activos o archivados del tablero Kanban
 */
export const tickets = sqliteTable(
  'tickets',
  {
    id: text('id').primaryKey(),
    title: text('title').notNull(),
    description: text('description'),
    status: text('status', { enum: ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'] }).notNull().default('TODO'),
    priority: text('priority', { enum: ['LOW', 'MEDIUM', 'HIGH'] }).notNull(),
    is_blocked: integer('is_blocked', { mode: 'boolean' }).notNull().default(false),
    version: integer('version').notNull().default(1),
    created_by: text('created_by').notNull(),
    project_id: text('project_id'),
    archived_at: text('archived_at'),
    created_at: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
    updated_at: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    createdByIdx: index('idx_tickets_created_by').on(table.created_by),
    statusIdx: index('idx_tickets_status').on(table.status),
    priorityIdx: index('idx_tickets_priority').on(table.priority),
    createdAtIdx: index('idx_tickets_created_at').on(table.created_at),
    archivedAtIdx: index('idx_tickets_archived_at').on(table.archived_at),
    projectIdIdx: index('idx_tickets_project_id').on(table.project_id),
    createdByFk: foreignKey({ columns: [table.created_by], foreignColumns: [users.id], name: 'fk_tickets_created_by' }).onDelete('restrict'),
    projectIdFk: foreignKey({ columns: [table.project_id], foreignColumns: [projects.id], name: 'fk_tickets_project_id' }).onDelete('set null'),
    titleNotBlankCk: check('ck_tickets_title_not_blank', sql`trim(title) <> ''`),
    versionPositiveCk: check('ck_tickets_version_positive', sql`version >= 1`),
  })
)

/**
 * ticket_assignees — Relación N:N entre tickets y usuarios asignados
 */
export const ticketAssignees = sqliteTable(
  'ticket_assignees',
  {
    ticket_id: text('ticket_id').notNull(),
    user_id: text('user_id').notNull(),
    assigned_at: text('assigned_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.ticket_id, table.user_id], name: 'pk_ticket_assignees' }),
    userIdIdx: index('idx_ticket_assignees_user_id').on(table.user_id),
    ticketIdFk: foreignKey({ columns: [table.ticket_id], foreignColumns: [tickets.id], name: 'fk_ticket_assignees_ticket_id' }).onDelete('cascade'),
    userIdFk: foreignKey({ columns: [table.user_id], foreignColumns: [users.id], name: 'fk_ticket_assignees_user_id' }).onDelete('cascade'),
  })
)

/**
 * ticket_labels — Etiquetas libres por ticket
 */
export const ticketLabels = sqliteTable(
  'ticket_labels',
  {
    ticket_id: text('ticket_id').notNull(),
    label: text('label').notNull(),
    created_at: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.ticket_id, table.label], name: 'pk_ticket_labels' }),
    ticketIdFk: foreignKey({ columns: [table.ticket_id], foreignColumns: [tickets.id], name: 'fk_ticket_labels_ticket_id' }).onDelete('cascade'),
    labelNotBlankCk: check('ck_ticket_labels_not_blank', sql`trim(label) <> ''`),
  })
)

/**
 * comments — Comentarios editables en Markdown asociados a tickets
 */
export const comments = sqliteTable(
  'comments',
  {
    id: text('id').primaryKey(),
    ticket_id: text('ticket_id').notNull(),
    author_id: text('author_id').notNull(),
    body: text('body').notNull(),
    archived_at: text('archived_at'),
    created_at: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
    updated_at: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    ticketIdIdx: index('idx_comments_ticket_id').on(table.ticket_id),
    authorIdIdx: index('idx_comments_author_id').on(table.author_id),
    archivedAtIdx: index('idx_comments_archived_at').on(table.archived_at),
    ticketIdFk: foreignKey({ columns: [table.ticket_id], foreignColumns: [tickets.id], name: 'fk_comments_ticket_id' }).onDelete('cascade'),
    authorIdFk: foreignKey({ columns: [table.author_id], foreignColumns: [users.id], name: 'fk_comments_author_id' }).onDelete('restrict'),
    bodyNotBlankCk: check('ck_comments_body_not_blank', sql`trim(body) <> ''`),
  })
)

/**
 * comment_mentions — Menciones resueltas a partir de @handle dentro de comentarios
 */
export const commentMentions = sqliteTable(
  'comment_mentions',
  {
    comment_id: text('comment_id').notNull(),
    mentioned_user_id: text('mentioned_user_id').notNull(),
    created_at: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.comment_id, table.mentioned_user_id], name: 'pk_comment_mentions' }),
    commentIdFk: foreignKey({ columns: [table.comment_id], foreignColumns: [comments.id], name: 'fk_comment_mentions_comment_id' }).onDelete('cascade'),
    mentionedUserIdFk: foreignKey({ columns: [table.mentioned_user_id], foreignColumns: [users.id], name: 'fk_comment_mentions_user_id' }).onDelete('cascade'),
  })
)

/**
 * notifications — Notificaciones sobre cambios de tickets
 */
export const notifications = sqliteTable(
  'notifications',
  {
    id: text('id').primaryKey(),
    recipient_id: text('recipient_id').notNull(),
    ticket_id: text('ticket_id'),
    comment_id: text('comment_id'),
    type: text('type', { enum: ['TICKET_ASSIGNED', 'COMMENT_ADDED', 'COMMENT_MENTION'] }).notNull(),
    status: text('status', { enum: ['PENDING', 'SENT', 'CANCELLED', 'FAILED'] }).notNull().default('PENDING'),
    message: text('message').notNull(),
    dispatched_at: text('dispatched_at'),
    created_at: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    recipientIdIdx: index('idx_notifications_recipient_id').on(table.recipient_id),
    ticketIdIdx: index('idx_notifications_ticket_id').on(table.ticket_id),
    statusIdx: index('idx_notifications_status').on(table.status),
    recipientIdFk: foreignKey({ columns: [table.recipient_id], foreignColumns: [users.id], name: 'fk_notifications_recipient_id' }).onDelete('cascade'),
    ticketIdFk: foreignKey({ columns: [table.ticket_id], foreignColumns: [tickets.id], name: 'fk_notifications_ticket_id' }).onDelete('cascade'),
    commentIdFk: foreignKey({ columns: [table.comment_id], foreignColumns: [comments.id], name: 'fk_notifications_comment_id' }).onDelete('cascade'),
  })
)

/**
 * ============================================================
 * RELATIONS
 * ============================================================
 */

export const usersRelations = relations(users, ({ many }) => ({
  projects: many(projects),
  createdTickets: many(tickets),
  assignees: many(ticketAssignees),
  comments: many(comments),
  mentions: many(commentMentions),
  notifications: many(notifications),
  sessions: many(authSessions),
}))

export const projectsRelations = relations(projects, ({ one, many }) => ({
  owner: one(users, { fields: [projects.owner_id], references: [users.id] }),
  tickets: many(tickets),
}))

export const ticketsRelations = relations(tickets, ({ one, many }) => ({
  project: one(projects, { fields: [tickets.project_id], references: [projects.id] }),
  creator: one(users, { fields: [tickets.created_by], references: [users.id] }),
  assignees: many(ticketAssignees),
  labels: many(ticketLabels),
  comments: many(comments),
  notifications: many(notifications),
}))

export const ticketAssigneesRelations = relations(ticketAssignees, ({ one }) => ({
  ticket: one(tickets, { fields: [ticketAssignees.ticket_id], references: [tickets.id] }),
  user: one(users, { fields: [ticketAssignees.user_id], references: [users.id] }),
}))

export const ticketLabelsRelations = relations(ticketLabels, ({ one }) => ({
  ticket: one(tickets, { fields: [ticketLabels.ticket_id], references: [tickets.id] }),
}))

export const commentsRelations = relations(comments, ({ one, many }) => ({
  ticket: one(tickets, { fields: [comments.ticket_id], references: [tickets.id] }),
  author: one(users, { fields: [comments.author_id], references: [users.id] }),
  mentions: many(commentMentions),
  notifications: many(notifications),
}))

export const commentMentionsRelations = relations(commentMentions, ({ one }) => ({
  comment: one(comments, { fields: [commentMentions.comment_id], references: [comments.id] }),
  mentionedUser: one(users, { fields: [commentMentions.mentioned_user_id], references: [users.id] }),
}))

export const notificationsRelations = relations(notifications, ({ one }) => ({
  recipient: one(users, { fields: [notifications.recipient_id], references: [users.id] }),
  ticket: one(tickets, { fields: [notifications.ticket_id], references: [tickets.id] }),
  comment: one(comments, { fields: [notifications.comment_id], references: [comments.id] }),
}))

export const authSessionsRelations = relations(authSessions, ({ one }) => ({
  user: one(users, { fields: [authSessions.user_id], references: [users.id] }),
}))

/**
 * Exported types
 */
export type User = typeof users.$inferSelect
export type UserInsert = typeof users.$inferInsert

export type AuthSession = typeof authSessions.$inferSelect
export type AuthSessionInsert = typeof authSessions.$inferInsert

export type Project = typeof projects.$inferSelect
export type ProjectInsert = typeof projects.$inferInsert

export type Ticket = typeof tickets.$inferSelect
export type TicketInsert = typeof tickets.$inferInsert

export type Notification = typeof notifications.$inferSelect
export type NotificationInsert = typeof notifications.$inferInsert

export type Comment = typeof comments.$inferSelect
export type CommentInsert = typeof comments.$inferInsert
