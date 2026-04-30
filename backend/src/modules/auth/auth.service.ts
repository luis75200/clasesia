import { and, eq, gt, sql } from 'drizzle-orm'
import { db } from '../../db/client.js'
import { authSessions, users } from '../../db/schema.js'
import { generateId } from '../../lib/utils/ids.js'
import { ApiError, Errors } from '../../http/api-error.js'
import type { LoginBody } from './auth.validation.js'

interface DatabaseErrorLike {
  code?: string
  errno?: number
  message?: string
}

function mapDatabaseError(error: unknown): ApiError {
  const dbError = error as DatabaseErrorLike
  const message = dbError?.message ?? ''

  if (dbError?.code === 'ECONNREFUSED' || dbError?.errno === -4078) {
    return Errors.INTERNAL_ERROR('Base de datos no disponible')
  }

  if (dbError?.code === '23505') {
    return Errors.CONFLICT('El usuario o sesión ya existe, intenta nuevamente')
  }

  if (message.includes('connect ECONNREFUSED')) {
    return Errors.INTERNAL_ERROR('Base de datos no disponible')
  }

  return Errors.INTERNAL_ERROR('Error en login local')
}

function buildHandle(email: string): string {
  const local = email.split('@')[0] || 'user'
  const normalized = local.toLowerCase().replace(/[^a-z0-9._-]/g, '-')
  const suffix = Math.floor(Math.random() * 10000)
  return `${normalized}-${suffix}`
}

export class AuthService {
  async login(input: LoginBody, meta: { ip?: string; userAgent?: string }) {
    try {
      let user = await db
        .select()
        .from(users)
        .where(eq(users.email, input.email))
        .then((rows) => rows[0] ?? null)

      if (!user) {
        const userId = generateId()
        await db.insert(users).values({
          id: userId,
          email: input.email,
          name: input.name ?? input.email,
          handle: buildHandle(input.email),
          role: 'member',
          is_active: true,
        })

        user = await db
          .select()
          .from(users)
          .where(eq(users.id, userId))
          .then((rows) => rows[0] ?? null)
      }

      if (!user) throw Errors.INTERNAL_ERROR('No se pudo crear/obtener usuario')
      if (!user.is_active) throw Errors.FORBIDDEN('Usuario desactivado')

      const sessionId = generateId()
      const sessionToken = generateId()
      const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString()

      await db.insert(authSessions).values({
        id: sessionId,
        user_id: user.id,
        session_token: sessionToken,
        status: 'ACTIVE',
        ip_address: meta.ip ?? null,
        user_agent: meta.userAgent ?? null,
        expires_at: expiresAt,
      })

      await db
        .update(users)
        .set({
          last_login_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .where(eq(users.id, user.id))

      return { user, sessionToken }
    } catch (error) {
      if (error instanceof ApiError) throw error
      console.error('[AuthService.login]', error)
      throw mapDatabaseError(error)
    }
  }

  async getSessionUser(sessionToken: string) {
    const now = new Date().toISOString()
    return db
      .select({ user: users })
      .from(authSessions)
      .innerJoin(users, eq(authSessions.user_id, users.id))
      .where(
        and(
          eq(authSessions.session_token, sessionToken),
          eq(authSessions.status, 'ACTIVE'),
          gt(authSessions.expires_at, sql`datetime('now')`),
          eq(users.is_active, true),
        ),
      )
      .then((rows) => rows[0]?.user ?? null)
  }

  async logout(sessionToken: string) {
    await db
      .update(authSessions)
      .set({
        status: 'REVOKED',
        updated_at: new Date().toISOString(),
      })
      .where(eq(authSessions.session_token, sessionToken))
  }
}

export const authService = new AuthService()
