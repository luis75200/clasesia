import type { MovePayload } from '../types/board.types'
import { changeTaskStatus } from '../../../lib/api'

export async function simulateMoveRequest(
  move: MovePayload,
  currentVersion = 1,
) {
  const response = await changeTaskStatus(move.taskId, {
    status: move.toColumnId,
    version: currentVersion,
  })

  return { ok: true as const, serverVersion: response.data.version }
}
