export const RECENT_TOOLS_STORAGE_KEY = "biotools:recent-tools"
export const RECENT_TOOLS_UPDATED_EVENT = "biotools:recent-tools-updated"
export const MAX_RECENT_TOOLS = 6

function canUseStorage() {
  return typeof window !== "undefined"
}

export function loadRecentToolIds(): string[] {
  if (!canUseStorage()) return []

  try {
    const parsed: unknown = JSON.parse(
      window.localStorage.getItem(RECENT_TOOLS_STORAGE_KEY) ?? "[]",
    )
    if (!Array.isArray(parsed)) return []

    return [...new Set(parsed.filter((id): id is string => typeof id === "string"))].slice(
      0,
      MAX_RECENT_TOOLS,
    )
  } catch {
    return []
  }
}

export function recordRecentTool(toolId: string): string[] {
  if (!toolId) return loadRecentToolIds()

  const updated = [toolId, ...loadRecentToolIds().filter((id) => id !== toolId)].slice(
    0,
    MAX_RECENT_TOOLS,
  )

  if (canUseStorage()) {
    try {
      window.localStorage.setItem(RECENT_TOOLS_STORAGE_KEY, JSON.stringify(updated))
    } catch {
      // localStorage may be unavailable in private browsing or restricted environments.
    }

    window.dispatchEvent(new Event(RECENT_TOOLS_UPDATED_EVENT))
  }

  return updated
}
