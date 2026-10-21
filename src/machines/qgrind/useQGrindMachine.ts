import { useCallback, useState } from 'react'
import type { MachineConfiguration, MachineData } from '../types'
import type { QGrindMachineData } from './data'
import { readMtConnect, setMtConnectAddress, getMtConnectMeasurements } from './service'
import { useMachinePolling } from '../useMachinePolling'

export function useQGrindMachine(configuration: MachineConfiguration): MachineData<QGrindMachineData> & {
  connect: () => Promise<void>
  disconnect: () => void
  connecting: boolean
} {
  const [connected, setConnected] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [sessionId, setSessionId] = useState(0)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [initialData, setInitialData] = useState<QGrindMachineData | null>(null)
  const [initialUpdatedAt, setInitialUpdatedAt] = useState<Date | null>(null)
  const address = `${configuration.host.trim()}:${configuration.port}`
  const read = useCallback(async () => {
    const raw = await readMtConnect()
    return { raw, observations: getMtConnectMeasurements(raw) }
  }, [])
  const polling = useMachinePolling(connected, configuration.pollIntervalMs, read, sessionId)

  const connect = useCallback(async () => {
    const port = Number(configuration.port)
    if (!configuration.host.trim() || !Number.isInteger(port) || port < 1 || port > 65535) {
      setConnectionError('Inserisci un host e una porta validi per l’agente MTConnect nella configurazione comunicazione.')
      return
    }

    setConnecting(true)
    setConnectionError(null)
    try {
      await setMtConnectAddress(address)
      const raw = await readMtConnect()
      setInitialData({ raw, observations: getMtConnectMeasurements(raw) })
      setInitialUpdatedAt(new Date())
      setSessionId((current) => current + 1)
      setConnected(true)
    } catch (error) {
      setConnectionError(error instanceof Error ? error.message : 'Connessione MTConnect non riuscita.')
    } finally {
      setConnecting(false)
    }
  }, [address, configuration.host, configuration.port])

  const disconnect = useCallback(() => {
    setConnected(false)
    setConnectionError(null)
    setInitialData(null)
    setInitialUpdatedAt(null)
  }, [])

  return {
    values: connected ? polling.data ?? initialData : null,
    connected,
    connecting,
    error: connectionError ?? polling.error,
    updatedAt: connected ? polling.updatedAt ?? initialUpdatedAt : null,
    connect,
    disconnect,
  }
}
