import { useMemo } from 'react'
import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { ApiClientError, exportMetricsCsv, getMetricsSummary, getProjects } from '../lib/api'
import { Sidebar } from '../shared/ui/Sidebar'
import { Topbar } from '../shared/ui/Topbar'
import { useNavigate } from 'react-router-dom'

export function DashboardPage() {
  const navigate = useNavigate()
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  const filters = useMemo(() => {
    const next: { from_date?: string; to_date?: string } = {}

    if (fromDate) {
      next.from_date = new Date(`${fromDate}T00:00:00.000Z`).toISOString()
    }

    if (toDate) {
      next.to_date = new Date(`${toDate}T23:59:59.999Z`).toISOString()
    }

    return next
  }, [fromDate, toDate])

  const projectsQuery = useQuery({
    queryKey: ['dashboard', 'projects'],
    queryFn: () => getProjects({ take: 500 }),
  })

  const metricsQuery = useQuery({
    queryKey: ['dashboard', 'metrics', filters.from_date ?? '', filters.to_date ?? ''],
    queryFn: () => getMetricsSummary(filters),
  })

  const exportMutation = useMutation({
    mutationFn: () => exportMetricsCsv(filters),
    onSuccess: (blob) => {
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `metrics-${Date.now()}.csv`
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      URL.revokeObjectURL(url)
    },
    onError: (error) => {
      if (error instanceof ApiClientError && error.status === 401) {
        navigate('/login', { replace: true })
      }
    },
  })

  const metrics = useMemo(() => {
    const projects = projectsQuery.data?.data ?? []
    const summary = metricsQuery.data?.data

    return {
      activeProjects: projects.filter((project) => project.status === 'ACTIVE').length,
      archivedProjects: projects.filter((project) => project.status === 'ARCHIVED').length,
      totalTasks: summary?.total ?? 0,
      todo: summary?.by_status.TODO ?? 0,
      inProgress: summary?.by_status.IN_PROGRESS ?? 0,
      review: summary?.by_status.REVIEW ?? 0,
      done: summary?.by_status.DONE ?? 0,
      blocked: summary?.blocked ?? 0,
      highPriority: summary?.high_priority ?? 0,
    }
  }, [projectsQuery.data?.data, metricsQuery.data?.data])

  const error = projectsQuery.error ?? metricsQuery.error ?? exportMutation.error
  const exportDisabled = metrics.totalTasks === 0 || exportMutation.isPending
  const exportTitle = metrics.totalTasks === 0 ? 'No hay datos para el rango seleccionado' : 'Exportar métricas CSV'

  return (
    <div className="min-h-screen bg-surface text-inverse_surface">
      <Sidebar />
      <main className="ml-64 flex min-h-screen flex-col">
        <Topbar />

        <section className="flex flex-1 flex-col gap-6 p-8">
          <header>
            <h1 className="text-[2.2rem] font-bold tracking-[-0.02em]">Metrics Dashboard</h1>
            <p className="text-sm text-outline_variant">Resumen operativo consumiendo datos reales del backend.</p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <input
                type="date"
                value={fromDate}
                onChange={(event) => setFromDate(event.target.value)}
                className="rounded-xl bg-surface_container_low px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2"
              />
              <input
                type="date"
                value={toDate}
                onChange={(event) => setToDate(event.target.value)}
                className="rounded-xl bg-surface_container_low px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2"
              />
              <button
                type="button"
                disabled={exportDisabled}
                title={exportTitle}
                onClick={() => exportMutation.mutate()}
                className="rounded-xl bg-gradient-to-br from-primary to-primary_dim px-4 py-2 text-sm font-semibold text-surface_container_lowest disabled:opacity-50"
              >
                {exportMutation.isPending ? 'Exportando...' : 'Exportar CSV'}
              </button>
            </div>
          </header>

          {projectsQuery.isLoading || metricsQuery.isLoading ? (
            <p className="text-sm text-outline_variant">Cargando metricas...</p>
          ) : null}

          {error instanceof Error ? (
            <p className="rounded-xl bg-error_container px-3 py-2 text-sm text-on_error_container">
              {error.message}
            </p>
          ) : null}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-2xl bg-surface_container_low p-4 shadow-air">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-outline_variant">Proyectos activos</h2>
              <p className="mt-2 text-3xl font-bold">{metrics.activeProjects}</p>
              <p className="mt-2 text-xs text-outline_variant">Archivados: {metrics.archivedProjects}</p>
            </article>

            <article className="rounded-2xl bg-surface_container_low p-4 shadow-air">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-outline_variant">Total tickets</h2>
              <p className="mt-2 text-3xl font-bold">{metrics.totalTasks}</p>
              <p className="mt-2 text-xs text-outline_variant">Alta prioridad: {metrics.highPriority}</p>
            </article>

            <article className="rounded-2xl bg-surface_container_low p-4 shadow-air">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-outline_variant">En flujo</h2>
              <p className="mt-2 text-3xl font-bold">{metrics.inProgress + metrics.review}</p>
              <p className="mt-2 text-xs text-outline_variant">In progress: {metrics.inProgress} | Review: {metrics.review}</p>
            </article>

            <article className="rounded-2xl bg-surface_container_low p-4 shadow-air">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-outline_variant">Riesgos</h2>
              <p className="mt-2 text-3xl font-bold">{metrics.blocked}</p>
              <p className="mt-2 text-xs text-outline_variant">Bloqueados sobre total: {metrics.totalTasks === 0 ? '0%' : `${Math.round((metrics.blocked / metrics.totalTasks) * 100)}%`}</p>
            </article>
          </div>

          <section className="rounded-2xl bg-surface_container_low p-4 shadow-air">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-outline_variant">Distribucion Kanban</h2>
            <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
              <div className="rounded-xl bg-surface_container_lowest p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-outline_variant">Todo</p>
                <p className="mt-1 text-2xl font-bold">{metrics.todo}</p>
              </div>
              <div className="rounded-xl bg-surface_container_lowest p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-outline_variant">In Progress</p>
                <p className="mt-1 text-2xl font-bold">{metrics.inProgress}</p>
              </div>
              <div className="rounded-xl bg-surface_container_lowest p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-outline_variant">Review</p>
                <p className="mt-1 text-2xl font-bold">{metrics.review}</p>
              </div>
              <div className="rounded-xl bg-surface_container_lowest p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-outline_variant">Done</p>
                <p className="mt-1 text-2xl font-bold">{metrics.done}</p>
              </div>
            </div>
          </section>
        </section>
      </main>
    </div>
  )
}
