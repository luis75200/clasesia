import { DragDropContext, type DropResult } from '@hello-pangea/dnd'
import { KanbanColumn } from './KanbanColumn'
import type { BoardColumnView } from '../types/board.types'

interface KanbanBoardProps {
  columns: BoardColumnView[]
  taskSyncStatus: Record<string, 'idle' | 'pending' | 'error'>
  taskErrors: Record<string, string | undefined>
  onDragEnd: (result: DropResult) => void | Promise<void>
  onToggleBlocked: (taskId: string) => void
  onArchive: (taskId: string) => void
}

export function KanbanBoard({
  columns,
  taskSyncStatus,
  taskErrors,
  onDragEnd,
  onToggleBlocked,
  onArchive,
}: KanbanBoardProps) {
  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        {columns.map((column) => (
          <KanbanColumn
            key={column.id}
            column={column}
            taskSyncStatus={taskSyncStatus}
            taskErrors={taskErrors}
            onToggleBlocked={onToggleBlocked}
            onArchive={onArchive}
          />
        ))}
      </div>
    </DragDropContext>
  )
}
