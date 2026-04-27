export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH'

export type ColumnId = 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE'

export interface Assignee {
  id: string
  name: string
  avatarUrl?: string
}

export interface Task {
  id: string
  title: string
  priority: TaskPriority
  isBlocked?: boolean
  labels?: string[]
  assignees?: Assignee[]
  updatedAt: string
}

export interface Column {
  id: ColumnId
  title: string
  taskIds: string[]
}

export interface BoardState {
  columnsById: Record<ColumnId, Column>
  columnOrder: ColumnId[]
  tasksById: Record<string, Task>
}

export interface MovePayload {
  taskId: string
  fromColumnId: ColumnId
  toColumnId: ColumnId
  fromIndex: number
  toIndex: number
}

export interface PendingMoveOp {
  opId: string
  move: MovePayload
  inverseMove: MovePayload
  taskId: string
  status: 'pending' | 'resolved' | 'failed'
  error?: string
}

export interface BoardColumnView {
  id: ColumnId
  title: string
  items: Task[]
}
