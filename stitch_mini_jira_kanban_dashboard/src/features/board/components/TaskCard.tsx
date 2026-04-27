import type { Task } from '../types/board.types'

interface TaskCardProps {
  task: Task
  isPending?: boolean
  errorMessage?: string
}

const priorityClasses: Record<Task['priority'], string> = {
  LOW: 'bg-surface_container_high text-inverse_surface',
  MEDIUM: 'bg-primary_container text-on_primary_fixed',
  HIGH: 'bg-error_container/20 text-on_error_container',
}

export function TaskCard({ task, isPending, errorMessage }: TaskCardProps) {
  return (
    <article
      className={`cursor-grab rounded-xl bg-surface_container_lowest p-5 shadow-air transition-all active:cursor-grabbing ${
        task.isBlocked ? 'border-l-4 border-error_container' : ''
      }`}
      aria-busy={isPending}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold leading-snug text-inverse_surface">
          {task.title}
        </h3>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${priorityClasses[task.priority]}`}
        >
          {task.priority === 'HIGH'
            ? 'High Priority'
            : task.priority === 'MEDIUM'
              ? 'Medium'
              : 'Low Priority'}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-outline_variant">
        {task.isBlocked ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-error_container px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-on_error_container">
            <span className="text-[12px] leading-none">⛔</span> BLOCKED
          </span>
        ) : null}
        {task.labels?.map((label) => (
          <span
            key={label}
            className="rounded px-1.5 py-0.5 text-[10px] font-bold bg-surface_container_high text-outline_variant"
          >
            #{label}
          </span>
        ))}
      </div>

      {isPending ? (
        <p className="mt-3 text-[11px] font-medium text-primary">
          Sincronizando movimiento...
        </p>
      ) : null}
      {errorMessage ? (
        <p className="mt-2 text-[11px] font-medium text-on_error_container">
          {errorMessage}
        </p>
      ) : null}
    </article>
  )
}
