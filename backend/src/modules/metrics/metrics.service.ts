import { Errors } from '../../http/api-error.js'
import { ApiError } from '../../lib/http/api-error.js'
import { metricsRepository } from './metrics.repository.js'
import type { MetricsCsvRow, MetricsFilters, MetricsSummary } from './metrics.types.js'

function csvEscape(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n') || value.includes('\r')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

function toCsvLine(row: MetricsCsvRow): string {
  const values = [
    row.id,
    row.title,
    row.status,
    row.priority,
    row.is_blocked ? 'true' : 'false',
    row.created_at,
    row.updated_at,
    row.archived_at ?? '',
  ]

  return `${values.map((value) => csvEscape(String(value))).join(',')}\r\n`
}

export class MetricsService {
  async getSummary(filters: MetricsFilters): Promise<MetricsSummary> {
    try {
      return await metricsRepository.getSummary(filters)
    } catch (error) {
      if (error instanceof ApiError) throw error
      console.error('[MetricsService.getSummary]', error)
      throw Errors.INTERNAL_ERROR('Error al obtener métricas')
    }
  }

  async streamCsv(
    filters: MetricsFilters,
    writeLine: (line: string) => void,
  ): Promise<void> {
    try {
      writeLine('id,title,status,priority,is_blocked,created_at,updated_at,archived_at\r\n')

      const chunkSize = 500
      let skip = 0

      while (true) {
        const rows = await metricsRepository.listCsvChunk(filters, skip, chunkSize)
        if (rows.length === 0) break

        for (const row of rows) {
          writeLine(toCsvLine(row))
        }

        skip += rows.length
      }
    } catch (error) {
      if (error instanceof ApiError) throw error
      console.error('[MetricsService.streamCsv]', error)
      throw Errors.INTERNAL_ERROR('Error al exportar métricas CSV')
    }
  }
}

export const metricsService = new MetricsService()
