import type { BoardColumnView, BoardState, Task } from '../types/board.types'

export function selectBoardColumnsForView(state: BoardState): BoardColumnView[] {
  return state.columnOrder.map((columnId) => {
    const column = state.columnsById[columnId]
    const items: Task[] = column.taskIds
      .map((taskId) => state.tasksById[taskId])
      .filter(Boolean)

    return {
      id: column.id,
      title: column.title,
      items,
    }
  })
}
