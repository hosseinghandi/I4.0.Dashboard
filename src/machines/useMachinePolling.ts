import { useEffect, useState } from 'react'

export interface MachinePollingState<TData> {
  data: TData | null
  error: string | null
  updatedAt: Date | null
}

const initialState = <TData,>(): MachinePollingState<TData> => ({
  data: null,
  error: null,
  updatedAt: null,
})

export function useMachinePolling<TData>(
  enabled: boolean,
  intervalMs: number,
  read: () => Promise<TData>,
  sessionId: number,
): MachinePollingState<TData> {
  const [state, setState] = useState<MachinePollingState<TData> & { sessionId: number }>(() => ({
    ...initialState<TData>(),
    sessionId,
  }))

  useEffect(() => {
    if (!enabled) return

    let cancelled = false
    let timeout: ReturnType<typeof setTimeout>

    const poll = async () => {
      try {
        const data = await read()
        if (!cancelled) setState({ data, error: null, updatedAt: new Date(), sessionId })
      } catch (error) {
        if (!cancelled) {
          setState((current) => ({
            ...current,
            sessionId,
            error: error instanceof Error ? error.message : 'Lettura dei dati macchina non riuscita.',
          }))
        }
      } finally {
        if (!cancelled) timeout = setTimeout(() => void poll(), intervalMs)
      }
    }

    void poll()
    return () => {
      cancelled = true
      clearTimeout(timeout)
    }
  }, [enabled, intervalMs, read, sessionId])

  if (!enabled || state.sessionId !== sessionId) return initialState()
  return state
}
