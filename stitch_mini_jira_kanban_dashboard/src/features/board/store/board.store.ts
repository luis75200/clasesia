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
  applyMoveLocal: (move: MovePayload) => void
  revertMoveLocal: (inverseMove: MovePayload) => void
  markOpPending: (op: PendingMoveOp) => void
  markOpResolved: (opId: string) => void
  markOpFailed: (opId: string, error: string) => void
}

const seedTasks: Task[] = [
  {
    id: 'TASK-100',
    title: 'Configurar OAuth corporativo',
    priority: 'HIGH',
    isBlocked: false,
    labels: ['auth'],
    assignees: [{ id: 'u1', name: 'Laura' }],
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'TASK-101',
    title: 'Diseñar flujo de estados Kanban',
    priority: 'MEDIUM',
    isBlocked: false,
    labels: ['board'],
    assignees: [{ id: 'u2', name: 'Marcos' }],
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'TASK-102',
    title: 'Validar export CSV con filtros',
    priority: 'LOW',
    isBlocked: true,
    labels: ['metrics'],
    assignees: [{ id: 'u3', name: 'Sofia' }],
    updatedAt: new Date().toISOString(),
  },
]

const tasksById = seedTasks.reduce<Record<string, Task>>((acc, task) => {
  acc[task.id] = task
  return acc
}, {})

const createInitialColumns = (): Record<ColumnId, { id: ColumnId; title: string; taskIds: string[] }> => ({
  TODO: { id: 'TODO', title: 'Por hacer', taskIds: ['TASK-100', 'TASK-101'] },
  IN_PROGRESS: { id: 'IN_PROGRESS', title: 'En progreso', taskIds: ['TASK-102'] },
  REVIEW: { id: 'REVIEW', title: 'Review', taskIds: [] },
  DONE: { id: 'DONE', title: 'Listo', taskIds: [] },
})

export const useBoardStore = create<BoardStore>((set) => ({
  columnsById: createInitialColumns(),
  columnOrder: ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'],
  tasksById,
  pendingOps: {},
  taskSyncStatus: {},
  taskErrors: {},
  isSyncing: false,
  applyMoveLocal: (move) =>
    set((state) => {
      const nextState = applyMove(state, move)
      return {
        ...nextState,
        tasksById: {
          ...nextState.tasksById,
          [move.taskId]: {
            ...nextState.tasksById[move.taskId],
            updatedAt: new Date().toISOString(),
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
