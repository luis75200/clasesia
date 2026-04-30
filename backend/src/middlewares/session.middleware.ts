import type { NextFunction, Request, Response } from 'express'
import { and, eq, gt, sql } from 'drizzle-orm'
import { db } from '../db/client.js'
import { authSessions, users } from '../db/schema.js'
import { CONSTANTS } from '../app/constants.js'

export async function sessionMiddleware(req: Request, _res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.[CONSTANTS.SESSION_COOKIE_NAME]
    if (!token) return next()

    const now = new Date().toISOString()

    const row = await db
      .select({
        sessionId: authSessions.id,
        user: users,
      })
      .from(authSessions)
      .innerJoin(users, eq(authSessions.user_id, users.id))
      .where(
        and(
          eq(authSessions.session_token, token),
          eq(authSessions.status, 'ACTIVE'),
          gt(authSessions.expires_at, sql`datetime('now')`),
          eq(users.is_active, true),
        ),
      )
      .then((rows) => rows[0] ?? null)

    if (!row) return next()

    req.sessionId = row.sessionId
    req.user = row.user
    return next()
  } catch {
    return next()
  }
}
