import type { CellValue } from "./types"

export type RemoteSheetData = Record<string, CellValue>

const cache = new Map<string, RemoteSheetData>()

function cacheKey(slug: string, sheetName: string): string {
  return `${slug}#${sheetName}`
}

export function getCachedSheet(slug: string, sheetName: string): RemoteSheetData | undefined {
  return cache.get(cacheKey(slug, sheetName))
}

export async function fetchSheetData(slug: string, sheetName: string): Promise<RemoteSheetData> {
  const key = cacheKey(slug, sheetName)
  const cached = cache.get(key)
  if (cached) return cached

  const res = await fetch(`/api/sheet?slug=${encodeURIComponent(slug)}&sheet=${encodeURIComponent(sheetName)}`)
  if (!res.ok) {
    throw new Error(`Failed to fetch sheet: ${res.statusText}`)
  }
  const data = await res.json()
  cache.set(key, data.cells)
  return data.cells
}

export function invalidateSheetCache(slug: string, sheetName: string): void {
  cache.delete(cacheKey(slug, sheetName))
}

export function invalidateAllCaches(): void {
  cache.clear()
}
