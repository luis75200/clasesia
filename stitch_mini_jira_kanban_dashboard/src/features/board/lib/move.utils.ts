import type { BoardState, MovePayload } from '../types/board.types'

function reorder<T>(list: T[], startIndex: number, endIndex: number): T[] {
  const next = [...list]
  const [removed] = next.splice(startIndex, 1)
  next.splice(endIndex, 0, removed)
  return next
}

export function applyMove(board: BoardState, move: MovePayload): BoardState {
  const fromColumn = board.columnsById[move.fromColumnId]
  const toColumn = board.columnsById[move.toColumnId]

  if (!fromColumn || !toColumn) return board

  if (move.fromColumnId === move.toColumnId) {
    const nextTaskIds = reorder(fromColumn.taskIds, move.fromIndex, move.toIndex)
    return {
      ...board,
      columnsById: {
        ...board.columnsById,
        [move.fromColumnId]: {
          ...fromColumn,
          taskIds: nextTaskIds,
        },
      },
    }
  }

  const sourceTaskIds = [...fromColumn.taskIds]
  const [movedTaskId] = sourceTaskIds.splice(move.fromIndex, 1)
  if (!movedTaskId) return board

  const destinationTaskIds = [...toColumn.taskIds]
  destinationTaskIds.splice(move.toIndex, 0, movedTaskId)

  return {
    ...board,
    columnsById: {
      ...board.columnsById,
      [move.fromColumnId]: {
        ...fromColumn,
        taskIds: sourceTaskIds,
      },
      [move.toColumnId]: {
        ...toColumn,
        taskIds: destinationTaskIds,
      },
    },
  }
}

export function invertMove(move: MovePayload): MovePayload {
  return {
    taskId: move.taskId,
    fromColumnId: move.toColumnId,
    toColumnId: move.fromColumnId,
    fromIndex: move.toIndex,
    toIndex: move.fromIndex,
  }
}
