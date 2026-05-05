import { KanbanBoard } from '../features/board/components'
import { useBoardDndController } from '../features/board/hooks/useBoardDndController'
import { Sidebar } from '../shared/ui/Sidebar'
import { Topbar } from '../shared/ui/Topbar'
import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { archiveTicket, createTask, getSession, getTasks, updateTicket } from '../lib/api'
import { useBoardStore } from '../features/board/store/board.store'

export function BoardPage() {
  const queryClient = useQueryClient()
  const { columns, taskSyncStatus, taskErrors, isSyncing, lastError, onDragEnd } =
    useBoardDndController()
  const hydrateFromApi = useBoardStore((state) => state.hydrateFromApi)
  const [search, setSearch] = useState('')
  const [newTitle, setNewTitle] = useState('')
  const [newPriority, setNewPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM')

  const tasksQuery = useQuery({
    queryKey: ['board', 'tasks'],
    queryFn: () => getTasks({ take: 500 }),
  })

  const sessionQuery = useQuery({
    queryKey: ['auth', 'session'],
    queryFn: () => getSession(),
    retry: false,
  })

  const createMutation = useMutation({
    mutationFn: () =>
      createTask({
        title: newTitle.trim(),
        priority: newPriority,
        assignees: [],
        labels: [],
      }),
    onSuccess: async () => {
      setNewTitle('')
      await queryClient.invalidateQueries({ queryKey: ['board', 'tasks'] })
    },
  })

  const updateMutation = useMutation({
    mutationFn: (payload: { id: string; version: number; is_blocked: boolean }) =>
      updateTicket(payload.id, {
        is_blocked: payload.is_blocked,
        version: payload.version,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['board', 'tasks'] })
    },
  })

  const archiveMutation = useMutation({
    mutationFn: (ticketId: string) => archiveTicket(ticketId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['board', 'tasks'] })
    },
  })

  const tasksById = useMemo(() => {
    const map = new Map<string, (typeof tasksQuery.data.data)[number]>()
    for (const task of tasksQuery.data?.data ?? []) {
      map.set(task.id, task)
    }
    return map
  }, [tasksQuery.data?.data])

  useEffect(() => {
    if (!tasksQuery.data) return

    const normalizedSearch = search.trim().toLowerCase()
    const sourceTasks = normalizedSearch
      ? tasksQuery.data.data.filter((task) => {
          return (
            task.title.toLowerCase().includes(normalizedSearch) ||
            task.labels.some((label) => label.toLowerCase().includes(normalizedSearch))
          )
        })
      : tasksQuery.data.data

    hydrateFromApi(
      sourceTasks.map((task) => ({
        id: task.id,
        title: task.title,
        priority: task.priority,
        version: task.version,
        createdById: task.created_by.id,
        isBlocked: task.is_blocked,
        labels: task.labels,
        assignees: task.assignees.map((assignee) => ({
          id: assignee.id,
          name: assignee.name,
          avatarUrl: assignee.avatarUrl,
        })),
        updatedAt: task.updated_at,
        status: task.status,
      })),
    )
  }, [hydrateFromApi, tasksQuery.data, search])

  const onToggleBlocked = (taskId: string) => {
    const task = tasksById.get(taskId)
    if (!task) return

    updateMutation.mutate({
      id: task.id,
      version: task.version,
      is_blocked: !task.is_blocked,
    })
  }

  const onArchive = (taskId: string) => {
    archiveMutation.mutate(taskId)
  }

  const canArchive = (taskId: string) => {
    const task = tasksById.get(taskId)
    const me = sessionQuery.data?.data.user
    if (!task || !me) return false
    return me.role === 'admin' || task.created_by.id === me.id
  }

  const mutationError = createMutation.error ?? updateMutation.error ?? archiveMutation.error

  return (
    <div className="min-h-screen bg-surface text-inverse_surface">
      <Sidebar />
      <main className="ml-64 flex min-h-screen flex-col">
        <Topbar />

        <section className="flex flex-1 flex-col gap-8 p-8">
          <div className="flex items-end justify-between">
            <div className="space-y-1">
              <nav className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.1em] text-outline_variant">
                <span>Projects</span>
                <span className="text-[14px] leading-none">›</span>
                <span>Alpha</span>
              </nav>
              <h1 className="text-[2.75rem] font-bold tracking-[-0.02em] text-inverse_surface">
                Sprint Board
              </h1>
              <p className="text-sm text-outline_variant">
                Tablero Kanban conectado a API con control de concurrencia.
              </p>
              {isSyncing ? (
                <p className="text-xs text-primary">Sincronizando cambios...</p>
              ) : null}
              {lastError ? (
                <p className="mt-2 w-fit rounded-xl bg-error_container px-3 py-2 text-xs text-on_error_container shadow-air">
                  Error de sincronización: {lastError}
                </p>
              ) : null}
              {tasksQuery.isLoading ? (
                <p className="text-xs text-outline_variant">Cargando tickets del tablero...</p>
              ) : null}
              {tasksQuery.error instanceof Error ? (
                <p className="mt-2 w-fit rounded-xl bg-error_container px-3 py-2 text-xs text-on_error_container shadow-air">
                  No se pudo cargar el tablero: {tasksQuery.error.message}
                </p>
              ) : null}
              {mutationError instanceof Error ? (
                <p className="mt-2 w-fit rounded-xl bg-error_container px-3 py-2 text-xs text-on_error_container shadow-air">
                  {mutationError.message}
                </p>
              ) : null}
            </div>

            <div className="flex items-center gap-3 pb-2">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar ticket o etiqueta"
                className="w-64 rounded-xl bg-surface_container_low px-4 py-2 text-sm outline-none ring-primary/20 focus:ring-2"
              />
            </div>
          </div>

          <section className="rounded-2xl bg-surface_container_low p-4 shadow-air">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-outline_variant">Crear ticket</h2>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
              <input
                value={newTitle}
                onChange={(event) => setNewTitle(event.target.value)}
                placeholder="Titulo del ticket"
                className="rounded-xl bg-surface px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2"
              />
              <select
                value={newPriority}
                onChange={(event) => setNewPriority(event.target.value as 'LOW' | 'MEDIUM' | 'HIGH')}
                className="rounded-xl bg-surface px-3 py-2 text-sm outline-none ring-primary/20 focus:ring-2"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
              <div className="md:col-span-2">
                <button
                  type="button"
                  onClick={() => createMutation.mutate()}
                  disabled={createMutation.isPending || !newTitle.trim()}
                  className="rounded-xl bg-gradient-to-br from-primary to-primary_dim px-4 py-2 text-sm font-semibold text-surface_container_lowest disabled:opacity-50"
                >
                  {createMutation.isPending ? 'Creando...' : 'Crear ticket'}
                </button>
              </div>
            </div>
          </section>

          <KanbanBoard
            columns={columns}
            taskSyncStatus={taskSyncStatus}
            taskErrors={taskErrors}
            onDragEnd={onDragEnd}
            onToggleBlocked={onToggleBlocked}
            onArchive={(taskId) => {
              if (canArchive(taskId)) {
                onArchive(taskId)
              }
            }}
          />
        </section>
      </main>
    </div>
  )
}
