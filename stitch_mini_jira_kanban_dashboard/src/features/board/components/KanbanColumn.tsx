import { Draggable, Droppable } from '@hello-pangea/dnd'
import { TaskCard } from './TaskCard'
import type { BoardColumnView } from '../types/board.types'

interface KanbanColumnProps {
  column: BoardColumnView
  taskSyncStatus: Record<string, 'idle' | 'pending' | 'error'>
  taskErrors: Record<string, string | undefined>
}

const dotClasses: Record<BoardColumnView['id'], string> = {
  TODO: 'bg-outline_variant',
  IN_PROGRESS: 'bg-primary',
  REVIEW: 'bg-outline_variant',
  DONE: 'bg-tertiary_container',
}

const countPillClasses: Record<BoardColumnView['id'], string> = {
  TODO: 'bg-surface_container_high text-outline_variant',
  IN_PROGRESS: 'bg-primary_container text-on_primary_fixed',
  REVIEW: 'bg-surface_container_high text-outline_variant',
  DONE: 'bg-tertiary_container text-on_tertiary_fixed',
}

export function KanbanColumn({
  column,
  taskSyncStatus,
  taskErrors,
}: KanbanColumnProps) {
  return (
    <section className="flex min-h-[500px] w-full flex-col gap-4">
      <header className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <span
            className={`h-1.5 w-1.5 rounded-full ${dotClasses[column.id]}`}
          />
          <h3 className="text-xs font-bold uppercase tracking-wider text-outline_variant">
            {column.title}
          </h3>
          <span
            className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${countPillClasses[column.id]}`}
          >
            {column.items.length}
          </span>
        </div>
        <button className="text-outline_variant transition-colors hover:text-inverse_surface">
          <span className="text-[18px] leading-none">…</span>
        </button>
      </header>

      <Droppable droppableId={column.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex min-h-40 flex-1 flex-col gap-4 ${
              snapshot.isDraggingOver ? 'rounded-xl bg-surface_container_highest p-2' : ''
            }`}
          >
            {column.items.map((task, index) => (
              <Draggable key={task.id} draggableId={task.id} index={index}>
                {(draggableProvided) => (
                  <div
                    ref={draggableProvided.innerRef}
                    {...draggableProvided.draggableProps}
                    {...draggableProvided.dragHandleProps}
                  >
                    <TaskCard
                      task={task}
                      isPending={taskSyncStatus[task.id] === 'pending'}
                      errorMessage={taskErrors[task.id]}
                    />
                  </div>
                )}
              </Draggable>
            ))}

            {column.items.length === 0 ? (
              <div className="flex h-32 flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-outline_variant/20 text-outline_variant/70">
                <div className="text-[20px] leading-none">⬇</div>
                <span className="text-[11px] font-semibold">Drop items here</span>
              </div>
            ) : null}

            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </section>
  )
}
