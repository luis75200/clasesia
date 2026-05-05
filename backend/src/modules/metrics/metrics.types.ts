export interface MetricsFilters {
  from_date?: string
  to_date?: string
}

export interface MetricsSummary {
  total: number
  blocked: number
  high_priority: number
  by_status: {
    TODO: number
    IN_PROGRESS: number
    REVIEW: number
    DONE: number
  }
}

export interface MetricsCsvRow {
  id: string
  title: string
  status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE'
  priority: 'LOW' | 'MEDIUM' | 'HIGH'
  is_blocked: boolean
  created_at: string
  updated_at: string
  archived_at: string | null
}
