import type { MovePayload } from '../types/board.types'

interface SimulatedMoveOptions {
  delayMs?: number
  failRate?: number
}

export async function simulateMoveRequest(
  _move: MovePayload,
  options: SimulatedMoveOptions = {},
) {
  const delayMs = options.delayMs ?? 1200
  const failRate = options.failRate ?? 0.25

  await new Promise((resolve) => setTimeout(resolve, delayMs))

  if (Math.random() < failRate) {
    throw new Error('Simulated backend failure while moving ticket')
  }

  return { ok: true as const, serverVersion: Date.now() }
}
