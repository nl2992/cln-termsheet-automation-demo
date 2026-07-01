const KEY = 'cln_ts_builder_v1'

export interface PersistedState {
  productId: string
  values: Record<string, string>
  client: string
  templateName: string
}

export function loadState(): Partial<PersistedState> | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function saveState(state: PersistedState) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    // ignore (private mode / quota)
  }
}
