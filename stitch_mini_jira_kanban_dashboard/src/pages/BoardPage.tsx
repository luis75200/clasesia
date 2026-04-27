import { KanbanBoard } from '../features/board/components'
import { useBoardDndController } from '../features/board/hooks/useBoardDndController'
import { Sidebar } from '../shared/ui/Sidebar'
import { Topbar } from '../shared/ui/Topbar'
import { Filter, Share2 } from 'lucide-react'

export function BoardPage() {
  const { columns, taskSyncStatus, taskErrors, isSyncing, lastError, onDragEnd } =
    useBoardDndController()

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
                Drag & drop optimista con rollback simulado (backend lento).
              </p>
              {isSyncing ? (
                <p className="text-xs text-primary">Sincronizando cambios...</p>
              ) : null}
              {lastError ? (
                <p className="mt-2 w-fit rounded-xl bg-error_container px-3 py-2 text-xs text-on_error_container shadow-air">
                  Error de sincronización: {lastError}. Se aplicó rollback local.
                </p>
              ) : null}
            </div>

            <div className="flex items-center gap-3 pb-2">
              <div className="mr-4 flex -space-x-2">
                <div className="h-8 w-8 rounded-full border-2 border-surface bg-surface_container_high" />
                <div className="h-8 w-8 rounded-full border-2 border-surface bg-surface_container_high" />
                <div className="h-8 w-8 rounded-full border-2 border-surface bg-surface_container_high" />
                <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-surface bg-surface_container_low text-[10px] font-bold text-outline_variant">
                  +4
                </div>
              </div>

              <button className="flex items-center gap-2 rounded-xl bg-surface_container_low px-4 py-2 text-sm font-medium transition-colors hover:bg-surface_container_high">
                <Filter className="h-[18px] w-[18px]" />
                Filter
              </button>
              <button className="flex items-center gap-2 rounded-xl bg-surface_container_low px-4 py-2 text-sm font-medium transition-colors hover:bg-surface_container_high">
                <Share2 className="h-[18px] w-[18px]" />
                Share
              </button>
            </div>
          </div>

          <KanbanBoard
            columns={columns}
            taskSyncStatus={taskSyncStatus}
            taskErrors={taskErrors}
            onDragEnd={onDragEnd}
          />
        </section>
      </main>
    </div>
  )
}
