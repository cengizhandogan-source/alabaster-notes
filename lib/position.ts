const GAP = 1000

export function getInsertPosition(siblings: { position: number }[], targetIndex: number): number {
  if (siblings.length === 0) return GAP

  if (targetIndex <= 0) {
    return Math.floor(siblings[0].position / 2) || GAP
  }

  if (targetIndex >= siblings.length) {
    return siblings[siblings.length - 1].position + GAP
  }

  const before = siblings[targetIndex - 1].position
  const after = siblings[targetIndex].position
  const mid = Math.floor((before + after) / 2)

  if (mid === before || mid === after) {
    return -1 // signal normalization needed
  }

  return mid
}

export function normalizePositions(count: number): number[] {
  return Array.from({ length: count }, (_, i) => (i + 1) * GAP)
}
