import { and, count as sqlCount, eq, gte, lte, sql } from 'drizzle-orm'
import { db } from '../../db/client.js'
import { tickets } from '../../db/schema.js'
import type { MetricsCsvRow, MetricsFilters, MetricsSummary } from './metrics.types.js'

export class MetricsRepository {
  private buildConditions(filters: MetricsFilters) {
    const conditions = []

    if (filters.from_date) {
      conditions.push(gte(tickets.created_at, filters.from_date))
    }

    if (filters.to_date) {
      conditions.push(lte(tickets.created_at, filters.to_date))
    }

    return conditions
  }

  async getSummary(filters: MetricsFilters): Promise<MetricsSummary> {
    const conditions = this.buildConditions(filters)
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    const [totalRow, blockedRow, highPriorityRow] = await Promise.all([
      db.select({ count: sqlCount() }).from(tickets).where(whereClause),
      db.select({ count: sqlCount() }).from(tickets).where(whereClause ? and(whereClause, eq(tickets.is_blocked, true)) : eq(tickets.is_blocked, true)),
      db.select({ count: sqlCount() }).from(tickets).where(whereClause ? and(whereClause, eq(tickets.priority, 'HIGH')) : eq(tickets.priority, 'HIGH')),
    ])

    const groupedRows = await db
      .select({
        status: tickets.status,
        count: sql<number>`count(*)`,
      })
      .from(tickets)
      .where(whereClause)
      .groupBy(tickets.status)

    const byStatus = {
      TODO: 0,
      IN_PROGRESS: 0,
      REVIEW: 0,
      DONE: 0,
    }

    for (const row of groupedRows) {
      byStatus[row.status] = Number(row.count) || 0
    }

    return {
      total: Number(totalRow[0]?.count ?? 0),
      blocked: Number(blockedRow[0]?.count ?? 0),
      high_priority: Number(highPriorityRow[0]?.count ?? 0),
      by_status: byStatus,
    }
  }

  async listCsvChunk(filters: MetricsFilters, skip: number, take: number): Promise<MetricsCsvRow[]> {
    const conditions = this.buildConditions(filters)
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    return db
      .select({
        id: tickets.id,
        title: tickets.title,
        status: tickets.status,
        priority: tickets.priority,
        is_blocked: tickets.is_blocked,
        created_at: tickets.created_at,
        updated_at: tickets.updated_at,
        archived_at: tickets.archived_at,
      })
      .from(tickets)
      .where(whereClause)
      .orderBy(tickets.created_at)
      .offset(skip)
      .limit(take)
  }
}

export const metricsRepository = new MetricsRepository()
