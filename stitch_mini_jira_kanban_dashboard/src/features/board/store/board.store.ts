import { create } from 'zustand'
import { applyMove } from '../lib/move.utils'
import type {
  BoardState,
  ColumnId,
  MovePayload,
  PendingMoveOp,
  Task,
} from '../types/board.types'

interface BoardStore extends BoardState {
  pendingOps: Record<string, PendingMoveOp>
  taskSyncStatus: Record<string, 'idle' | 'pending' | 'error'>
  taskErrors: Record<string, string | undefined>
  isSyncing: boolean
  lastError?: string
  hydrateFromApi: (tasks: Array<Task & { status: ColumnId }>) => void
  applyMoveLocal: (move: MovePayload) => void
  syncTaskVersion: (taskId: string, version: number) => void
  revertMoveLocal: (inverseMove: MovePayload) => void
  markOpPending: (op: PendingMoveOp) => void
  markOpResolved: (opId: string) => void
  markOpFailed: (opId: string, error: string) => void
}

const createInitialColumns = (): Record<ColumnId, { id: ColumnId; title: string; taskIds: string[] }> => ({
  TODO: { id: 'TODO', title: 'Por hacer', taskIds: [] },
  IN_PROGRESS: { id: 'IN_PROGRESS', title: 'En progreso', taskIds: [] },
  REVIEW: { id: 'REVIEW', title: 'Review', taskIds: [] },
  DONE: { id: 'DONE', title: 'Listo', taskIds: [] },
})

function buildColumnsFromTasks(tasks: Array<Task & { status: ColumnId }>) {
  const columns = createInitialColumns()

  for (const task of tasks) {
    columns[task.status].taskIds.push(task.id)
  }

  return columns
}

function buildTasksById(tasks: Array<Task & { status: ColumnId }>) {
  return tasks.reduce<Record<string, Task>>((acc, task) => {
    const { status: _status, ...taskWithoutStatus } = task
    acc[task.id] = taskWithoutStatus
    return acc
  }, {})
}

export const useBoardStore = create<BoardStore>((set) => ({
  columnsById: createInitialColumns(),
  columnOrder: ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'],
  tasksById: {},
  pendingOps: {},
  taskSyncStatus: {},
  taskErrors: {},
  isSyncing: false,
  hydrateFromApi: (tasks) =>
    set(() => ({
      columnsById: buildColumnsFromTasks(tasks),
      tasksById: buildTasksById(tasks),
      pendingOps: {},
      taskSyncStatus: {},
      taskErrors: {},
      isSyncing: false,
      lastError: undefined,
    })),
  applyMoveLocal: (move) =>
    set((state) => {
      const nextState = applyMove(state, move)
      const currentVersion = nextState.tasksById[move.taskId]?.version ?? 1
      return {
        ...nextState,
        tasksById: {
          ...nextState.tasksById,
          [move.taskId]: {
            ...nextState.tasksById[move.taskId],
            version: currentVersion + 1,
            updatedAt: new Date().toISOString(),
          },
        },
      }
    }),
  syncTaskVersion: (taskId, version) =>
    set((state) => {
      const task = state.tasksById[taskId]
      if (!task) return {}

      return {
        tasksById: {
          ...state.tasksById,
          [taskId]: {
            ...task,
            version,
          },
        },
      }
    }),
  revertMoveLocal: (inverseMove) =>
    set((state) => {
      const nextState = applyMove(state, inverseMove)
      return nextState
    }),
  markOpPending: (op) =>
    set((state) => ({
      pendingOps: { ...state.pendingOps, [op.opId]: op },
      taskSyncStatus: { ...state.taskSyncStatus, [op.taskId]: 'pending' },
      taskErrors: { ...state.taskErrors, [op.taskId]: undefined },
      isSyncing: true,
    })),
  markOpResolved: (opId) =>
    set((state) => {
      const op = state.pendingOps[opId]
      if (!op) return {}

      const nextPending = { ...state.pendingOps }
      delete nextPending[opId]

      const stillPendingTask = Object.values(nextPending).some(
        (pending) => pending.taskId === op.taskId,
      )

      return {
        pendingOps: nextPending,
        taskSyncStatus: {
          ...state.taskSyncStatus,
          [op.taskId]: stillPendingTask ? 'pending' : 'idle',
        },
        isSyncing: Object.keys(nextPending).length > 0,
        lastError: undefined,
      }
    }),
  markOpFailed: (opId, error) =>
    set((state) => {
      const op = state.pendingOps[opId]
      if (!op) return {}

      const nextPending = { ...state.pendingOps }
      delete nextPending[opId]

      return {
        pendingOps: nextPending,
        taskSyncStatus: {
          ...state.taskSyncStatus,
          [op.taskId]: 'error',
        },
        taskErrors: {
          ...state.taskErrors,
          [op.taskId]: error,
        },
        isSyncing: Object.keys(nextPending).length > 0,
        lastError: error,
      }
    }),
}))

export function getBoardStateForOptimistic(state: BoardStore): BoardState {
  return {
    columnsById: state.columnsById,
    columnOrder: state.columnOrder,
    tasksById: state.tasksById,
  }
}
