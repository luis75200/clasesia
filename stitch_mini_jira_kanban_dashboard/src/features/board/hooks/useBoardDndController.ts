import { useMemo, useOptimistic } from 'react'
import type { DropResult } from '@hello-pangea/dnd'
import { simulateMoveRequest } from '../api/board.api'
import { applyMove, invertMove } from '../lib/move.utils'
import { selectBoardColumnsForView } from '../store/board.selectors'
import { getBoardStateForOptimistic, useBoardStore } from '../store/board.store'
import type { BoardState, MovePayload } from '../types/board.types'

function buildMoveFromDropResult(result: DropResult): MovePayload | null {
  const { source, destination, draggableId } = result

  if (!destination) return null

  return {
    taskId: draggableId,
    fromColumnId: source.droppableId as MovePayload['fromColumnId'],
    toColumnId: destination.droppableId as MovePayload['toColumnId'],
    fromIndex: source.index,
    toIndex: destination.index,
  }
}

export function useBoardDndController() {
  const storeState = useBoardStore((state) => state)
  const baseBoardState = useMemo<BoardState>(
    () => getBoardStateForOptimistic(storeState),
    [storeState],
  )

  const [optimisticBoardState, addOptimisticMove] = useOptimistic(
    baseBoardState,
    (currentState, move: MovePayload) => applyMove(currentState, move),
  )

  const columns = useMemo(
    () => selectBoardColumnsForView(optimisticBoardState),
    [optimisticBoardState],
  )

  const onDragEnd = async (result: DropResult) => {
    const move = buildMoveFromDropResult(result)
    if (!move) return

    if (
      move.fromColumnId === move.toColumnId &&
      move.fromIndex === move.toIndex
    ) {
      return
    }

    const opId = crypto.randomUUID()
    const inverseMove = invertMove(move)

    addOptimisticMove(move)
    useBoardStore.getState().markOpPending({
      opId,
      move,
      inverseMove,
      taskId: move.taskId,
      status: 'pending',
    })

    try {
      await simulateMoveRequest(move)
      useBoardStore.getState().applyMoveLocal(move)
      useBoardStore.getState().markOpResolved(opId)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown move error'
      useBoardStore.getState().markOpFailed(opId, message)
      useBoardStore.getState().revertMoveLocal(inverseMove)
    }
  }

  return {
    columns,
    taskSyncStatus: storeState.taskSyncStatus,
    taskErrors: storeState.taskErrors,
    isSyncing: storeState.isSyncing,
    lastError: storeState.lastError,
    onDragEnd,
  }
}
