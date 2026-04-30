import { 
  pgTable, 
  uuid, 
  varchar, 
  text, 
  integer, 
  boolean, 
  timestamp,
  pgEnum,
  primaryKey,
  foreignKey,
  uniqueIndex,
  index,
  check,
  jsonb
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

/**
 * ============================================================
 * ENUMS
 * ============================================================
 */

export const userRoleEnum = pgEnum('user_role', ['admin', 'member']);
export const ticketStatusEnum = pgEnum('ticket_status', ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE']);
export const ticketPriorityEnum = pgEnum('ticket_priority', ['LOW', 'MEDIUM', 'HIGH']);
export const projectStatusEnum = pgEnum('project_status', ['ACTIVE', 'ARCHIVED']);
export const sessionStatusEnum = pgEnum('session_status', ['ACTIVE', 'EXPIRED', 'REVOKED']);
export const notificationTypeEnum = pgEnum('notification_type', ['TICKET_ASSIGNED', 'COMMENT_ADDED', 'COMMENT_MENTION']);
export const notificationStatusEnum = pgEnum('notification_status', ['PENDING', 'SENT', 'CANCELLED', 'FAILED']);

/**
 * ============================================================
 * TABLES
 * ============================================================
 */

/**
 * users — Usuarios aprovisionados por admin y autenticados vía Google Workspace
 */
export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    name: varchar('name', { length: 255 }).notNull(),
    handle: varchar('handle', { length: 80 }).notNull().unique(),
    role: userRoleEnum('role').notNull().default('member'),
    is_active: boolean('is_active').notNull().default(true),
    google_subject: varchar('google_subject', { length: 255 }).unique(),
    avatar_url: text('avatar_url'),
    last_login_at: timestamp('last_login_at', { precision: 3, withTimezone: true }),
    created_at: timestamp('created_at', { precision: 3, withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp('updated_at', { precision: 3, withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    roleIdx: index('idx_users_role').on(table.role),
    isActiveIdx: index('idx_users_is_active').on(table.is_active),
    emailNotBlankCk: check('ck_users_email_not_blank', sql`btrim(email) <> ''`),
    nameNotBlankCk: check('ck_users_name_not_blank', sql`btrim(name) <> ''`),
    handleNotBlankCk: check('ck_users_handle_not_blank', sql`btrim(handle) <> ''`),
  })
);

/**
 * auth_sessions — Sesiones web persistidas para cookie HttpOnly
 */
export const authSessions = pgTable(
  'auth_sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    user_id: uuid('user_id').notNull(),
    session_token: varchar('session_token', { length: 255 }).notNull().unique(),
    status: sessionStatusEnum('status').notNull().default('ACTIVE'),
    ip_address: varchar('ip_address', { length: 64 }),
    user_agent: text('user_agent'),
    expires_at: timestamp('expires_at', { precision: 3, withTimezone: true }).notNull(),
    last_seen_at: timestamp('last_seen_at', { precision: 3, withTimezone: true }),
    created_at: timestamp('created_at', { precision: 3, withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp('updated_at', { precision: 3, withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index('idx_auth_sessions_user_id').on(table.user_id),
    statusIdx: index('idx_auth_sessions_status').on(table.status),
    expiresAtIdx: index('idx_auth_sessions_expires_at').on(table.expires_at),
    userIdFk: foreignKey({ columns: [table.user_id], foreignColumns: [users.id], name: 'fk_auth_sessions_user_id' }).onDelete('cascade'),
  })
);

/**
 * oauth_states — Estados temporales del flujo OAuth para protección CSRF
 */
export const oauthStates = pgTable(
  'oauth_states',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    state: varchar('state', { length: 255 }).notNull().unique(),
    provider: varchar('provider', { length: 50 }).notNull().default('google'),
    redirect_uri: text('redirect_uri'),
    expires_at: timestamp('expires_at', { precision: 3, withTimezone: true }).notNull(),
    consumed_at: timestamp('consumed_at', { precision: 3, withTimezone: true }),
    created_at: timestamp('created_at', { precision: 3, withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    expiresAtIdx: index('idx_oauth_states_expires_at').on(table.expires_at),
  })
);

/**
 * projects — Proyectos para agrupar tareas/tickets
 */
export const projects = pgTable(
  'projects',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 120 }).notNull(),
    key: varchar('key', { length: 32 }).notNull().unique(),
    description: text('description'),
    status: projectStatusEnum('status').notNull().default('ACTIVE'),
    owner_id: uuid('owner_id').notNull(),
    archived_at: timestamp('archived_at', { precision: 3, withTimezone: true }),
    created_at: timestamp('created_at', { precision: 3, withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp('updated_at', { precision: 3, withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    nameIdx: index('idx_projects_name').on(table.name),
    statusIdx: index('idx_projects_status').on(table.status),
    ownerIdx: index('idx_projects_owner_id').on(table.owner_id),
    archivedAtIdx: index('idx_projects_archived_at').on(table.archived_at),
    ownerIdFk: foreignKey({ columns: [table.owner_id], foreignColumns: [users.id], name: 'fk_projects_owner_id' }).onDelete('restrict'),
    nameNotBlankCk: check('ck_projects_name_not_blank', sql`btrim(name) <> ''`),
    keyNotBlankCk: check('ck_projects_key_not_blank', sql`btrim(key) <> ''`),
  })
);

/**
 * tickets — Tickets activos o archivados del tablero Kanban
 */
export const tickets = pgTable(
  'tickets',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    title: varchar('title', { length: 120 }).notNull(),
    description: text('description'),
    status: ticketStatusEnum('status').notNull().default('TODO'),
    priority: ticketPriorityEnum('priority').notNull(),
    is_blocked: boolean('is_blocked').notNull().default(false),
    version: integer('version').notNull().default(1),
    created_by: uuid('created_by').notNull(),
    project_id: uuid('project_id'),
    archived_at: timestamp('archived_at', { precision: 3, withTimezone: true }),
    created_at: timestamp('created_at', { precision: 3, withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp('updated_at', { precision: 3, withTimezone: true }).notNull().defaultNow(),
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
    titleNotBlankCk: check('ck_tickets_title_not_blank', sql`btrim(title) <> ''`),
    versionPositiveCk: check('ck_tickets_version_positive', sql`version >= 1`),
  })
);

/**
 * ticket_assignees — Relación N:N entre tickets y usuarios asignados
 */
export const ticketAssignees = pgTable(
  'ticket_assignees',
  {
    ticket_id: uuid('ticket_id').notNull(),
    user_id: uuid('user_id').notNull(),
    assigned_at: timestamp('assigned_at', { precision: 3, withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.ticket_id, table.user_id], name: 'pk_ticket_assignees' }),
    userIdIdx: index('idx_ticket_assignees_user_id').on(table.user_id),
    ticketIdFk: foreignKey({ columns: [table.ticket_id], foreignColumns: [tickets.id], name: 'fk_ticket_assignees_ticket_id' }).onDelete('cascade'),
    userIdFk: foreignKey({ columns: [table.user_id], foreignColumns: [users.id], name: 'fk_ticket_assignees_user_id' }).onDelete('cascade'),
  })
);

/**
 * ticket_labels — Etiquetas libres por ticket
 */
export const ticketLabels = pgTable(
  'ticket_labels',
  {
    ticket_id: uuid('ticket_id').notNull(),
    label: varchar('label', { length: 100 }).notNull(),
    created_at: timestamp('created_at', { precision: 3, withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.ticket_id, table.label], name: 'pk_ticket_labels' }),
    ticketIdFk: foreignKey({ columns: [table.ticket_id], foreignColumns: [tickets.id], name: 'fk_ticket_labels_ticket_id' }).onDelete('cascade'),
    labelNotBlankCk: check('ck_ticket_labels_not_blank', sql`btrim(label) <> ''`),
  })
);

/**
 * comments — Comentarios editables en Markdown asociados a tickets
 */
export const comments = pgTable(
  'comments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ticket_id: uuid('ticket_id').notNull(),
    author_id: uuid('author_id').notNull(),
    body: text('body').notNull(),
    archived_at: timestamp('archived_at', { precision: 3, withTimezone: true }),
    created_at: timestamp('created_at', { precision: 3, withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp('updated_at', { precision: 3, withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    ticketIdIdx: index('idx_comments_ticket_id').on(table.ticket_id),
    authorIdIdx: index('idx_comments_author_id').on(table.author_id),
    archivedAtIdx: index('idx_comments_archived_at').on(table.archived_at),
    ticketIdFk: foreignKey({ columns: [table.ticket_id], foreignColumns: [tickets.id], name: 'fk_comments_ticket_id' }).onDelete('cascade'),
    authorIdFk: foreignKey({ columns: [table.author_id], foreignColumns: [users.id], name: 'fk_comments_author_id' }).onDelete('restrict'),
    bodyNotBlankCk: check('ck_comments_body_not_blank', sql`btrim(body) <> ''`),
  })
);

/**
 * comment_mentions — Menciones resueltas a partir de @handle dentro de comentarios
 */
export const commentMentions = pgTable(
  'comment_mentions',
  {
    comment_id: uuid('comment_id').notNull(),
    mentioned_user_id: uuid('mentioned_user_id').notNull(),
    created_at: timestamp('created_at', { precision: 3, withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.comment_id, table.mentioned_user_id], name: 'pk_comment_mentions' }),
    mentionedUserIdIdx: index('idx_comment_mentions_mentioned_user_id').on(table.mentioned_user_id),
    commentIdFk: foreignKey({ columns: [table.comment_id], foreignColumns: [comments.id], name: 'fk_comment_mentions_comment_id' }).onDelete('cascade'),
    mentionedUserIdFk: foreignKey({ columns: [table.mentioned_user_id], foreignColumns: [users.id], name: 'fk_comment_mentions_mentioned_user_id' }).onDelete('cascade'),
  })
);

/**
 * email_notifications — Cola y estado de notificaciones por email
 */
export const emailNotifications = pgTable(
  'email_notifications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    type: notificationTypeEnum('type').notNull(),
    status: notificationStatusEnum('status').notNull().default('PENDING'),
    recipient_user_id: uuid('recipient_user_id').notNull(),
    ticket_id: uuid('ticket_id'),
    comment_id: uuid('comment_id'),
    payload_json: jsonb('payload_json'),
    error_message: text('error_message'),
    scheduled_for: timestamp('scheduled_for', { precision: 3, withTimezone: true }),
    sent_at: timestamp('sent_at', { precision: 3, withTimezone: true }),
    cancelled_at: timestamp('cancelled_at', { precision: 3, withTimezone: true }),
    failed_at: timestamp('failed_at', { precision: 3, withTimezone: true }),
    created_at: timestamp('created_at', { precision: 3, withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp('updated_at', { precision: 3, withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    recipientUserIdIdx: index('idx_email_notifications_recipient_user_id').on(table.recipient_user_id),
    statusIdx: index('idx_email_notifications_status').on(table.status),
    typeIdx: index('idx_email_notifications_type').on(table.type),
    scheduledForIdx: index('idx_email_notifications_scheduled_for').on(table.scheduled_for),
    ticketIdIdx: index('idx_email_notifications_ticket_id').on(table.ticket_id),
    commentIdIdx: index('idx_email_notifications_comment_id').on(table.comment_id),
    recipientUserIdFk: foreignKey({ columns: [table.recipient_user_id], foreignColumns: [users.id], name: 'fk_email_notifications_recipient_user_id' }).onDelete('cascade'),
    ticketIdFk: foreignKey({ columns: [table.ticket_id], foreignColumns: [tickets.id], name: 'fk_email_notifications_ticket_id' }).onDelete('cascade'),
    commentIdFk: foreignKey({ columns: [table.comment_id], foreignColumns: [comments.id], name: 'fk_email_notifications_comment_id' }).onDelete('cascade'),
  })
);

/**
 * ============================================================
 * RELATIONS
 * ============================================================
 */

export const usersRelations = relations(users, ({ many, one }) => ({
  authSessions: many(authSessions),
  ownedProjects: many(projects),
  createdTickets: many(tickets, { relationName: 'created_by' }),
  assignedTickets: many(ticketAssignees),
  createdComments: many(comments, { relationName: 'author' }),
  mentionedInComments: many(commentMentions, { relationName: 'mentioned_user' }),
  emailNotifications: many(emailNotifications),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  owner: one(users, { fields: [projects.owner_id], references: [users.id] }),
  tickets: many(tickets),
}));

export const authSessionsRelations = relations(authSessions, ({ one }) => ({
  user: one(users, { fields: [authSessions.user_id], references: [users.id] }),
}));

export const ticketsRelations = relations(tickets, ({ one, many }) => ({
  createdBy: one(users, { fields: [tickets.created_by], references: [users.id], relationName: 'created_by' }),
  project: one(projects, { fields: [tickets.project_id], references: [projects.id] }),
  assignees: many(ticketAssignees),
  labels: many(ticketLabels),
  comments: many(comments),
  emailNotifications: many(emailNotifications),
}));

export const ticketAssigneesRelations = relations(ticketAssignees, ({ one }) => ({
  ticket: one(tickets, { fields: [ticketAssignees.ticket_id], references: [tickets.id] }),
  user: one(users, { fields: [ticketAssignees.user_id], references: [users.id] }),
}));

export const ticketLabelsRelations = relations(ticketLabels, ({ one }) => ({
  ticket: one(tickets, { fields: [ticketLabels.ticket_id], references: [tickets.id] }),
}));

export const commentsRelations = relations(comments, ({ one, many }) => ({
  ticket: one(tickets, { fields: [comments.ticket_id], references: [tickets.id] }),
  author: one(users, { fields: [comments.author_id], references: [users.id], relationName: 'author' }),
  mentions: many(commentMentions),
  emailNotifications: many(emailNotifications),
}));

export const commentMentionsRelations = relations(commentMentions, ({ one }) => ({
  comment: one(comments, { fields: [commentMentions.comment_id], references: [comments.id] }),
  mentionedUser: one(users, { fields: [commentMentions.mentioned_user_id], references: [users.id], relationName: 'mentioned_user' }),
}));

export const emailNotificationsRelations = relations(emailNotifications, ({ one }) => ({
  recipientUser: one(users, { fields: [emailNotifications.recipient_user_id], references: [users.id] }),
  ticket: one(tickets, { fields: [emailNotifications.ticket_id], references: [tickets.id] }),
  comment: one(comments, { fields: [emailNotifications.comment_id], references: [comments.id] }),
}));

/**
 * ============================================================
 * TYPES (Exported for use in application code)
 * ============================================================
 */

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type AuthSession = typeof authSessions.$inferSelect;
export type NewAuthSession = typeof authSessions.$inferInsert;

export type OAuthState = typeof oauthStates.$inferSelect;
export type NewOAuthState = typeof oauthStates.$inferInsert;

export type Ticket = typeof tickets.$inferSelect;
export type NewTicket = typeof tickets.$inferInsert;

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;

export type TicketAssignee = typeof ticketAssignees.$inferSelect;
export type NewTicketAssignee = typeof ticketAssignees.$inferInsert;

export type TicketLabel = typeof ticketLabels.$inferSelect;
export type NewTicketLabel = typeof ticketLabels.$inferInsert;

export type Comment = typeof comments.$inferSelect;
export type NewComment = typeof comments.$inferInsert;

export type CommentMention = typeof commentMentions.$inferSelect;
export type NewCommentMention = typeof commentMentions.$inferInsert;

export type EmailNotification = typeof emailNotifications.$inferSelect;
export type NewEmailNotification = typeof emailNotifications.$inferInsert;
