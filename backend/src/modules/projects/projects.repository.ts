import { and, count as sqlCount, eq, ilike, isNull, or } from 'drizzle-orm'
import { db } from '../../db/client.js'
import { projects, users } from '../../db/schema.js'
import { generateId } from '../../lib/utils/ids.js'
import type { CreateProjectInput, ListProjectsQuery, UpdateProjectInput } from './projects.types.js'

export class ProjectsRepository {
  async listProjects(query: ListProjectsQuery): Promise<{ ids: string[]; total: number }> {
    const conditions = [isNull(projects.archived_at)]

    if (query.status) {
      conditions.push(eq(projects.status, query.status))
    }

    if (query.search) {
      conditions.push(or(ilike(projects.name, `%${query.search}%`), ilike(projects.key, `%${query.search}%`))!)
    }

    const [{ total }] = await db
      .select({ total: sqlCount() })
      .from(projects)
      .where(and(...conditions))

    const rows = await db
      .select({ id: projects.id })
      .from(projects)
      .where(and(...conditions))
      .limit(query.take)
      .offset(query.skip)

    return { ids: rows.map((row) => row.id), total: Number(total) || 0 }
  }

  async getProjectById(projectId: string) {
    const row = await db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId))
      .then((rows) => rows[0] ?? null)

    if (!row) return null

    const owner = await db
      .select({ id: users.id, name: users.name, handle: users.handle })
      .from(users)
      .where(eq(users.id, row.owner_id))
      .then((rows) => rows[0] ?? null)

    if (!owner) return null

    return {
      ...row,
      owner,
    }
  }

  async createProject(input: CreateProjectInput, ownerId: string): Promise<string> {
    const id = generateId()

    await db.insert(projects).values({
      id,
      name: input.name,
      key: input.key,
      description: input.description ?? null,
      owner_id: ownerId,
      status: 'ACTIVE',
    })

    return id
  }

  async updateProject(projectId: string, input: UpdateProjectInput): Promise<void> {
    await db
      .update(projects)
      .set({
        ...input,
        updated_at: new Date().toISOString(),
      })
      .where(eq(projects.id, projectId))
  }

  async archiveProject(projectId: string): Promise<void> {
    await db
      .update(projects)
      .set({
        status: 'ARCHIVED',
        archived_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .where(eq(projects.id, projectId))
  }

  async restoreProject(projectId: string): Promise<void> {
    await db
      .update(projects)
      .set({
        status: 'ACTIVE',
        archived_at: null,
        updated_at: new Date().toISOString(),
      })
      .where(eq(projects.id, projectId))
  }

  async existsByKey(key: string, excludingId?: string): Promise<boolean> {
    const rows = await db
      .select({ id: projects.id })
      .from(projects)
      .where(eq(projects.key, key))

    if (!excludingId) return rows.length > 0
    return rows.some((row) => row.id !== excludingId)
  }
}

export const projectsRepository = new ProjectsRepository()
