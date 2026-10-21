import { useCallback, useState } from 'react'
import type { MachineConfiguration, MachineData } from '../types'
import type { DeltaJobData, DeltaMachineData } from './data'
import { connectDelta, disconnectDelta, readDelta, writeDeltaJob } from './service'
import { useMachinePolling } from '../useMachinePolling'

export function useDeltaMachine(configuration: MachineConfiguration): MachineData<DeltaMachineData> & {
  connect: () => Promise<void>
  disconnect: () => Promise<void>
  writeJob: (job: DeltaJobData) => Promise<string>
  connecting: boolean
} {
  const [connected, setConnected] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [sessionId, setSessionId] = useState(0)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const read = useCallback(async () => {
    const response = await readDelta()
    if (!response.success || !response.data) {
      throw new Error(response.message || 'OPC UA non ha restituito dati macchina.')
    }
    return response.data
  }, [])
  const polling = useMachinePolling(connected, configuration.pollIntervalMs, read, sessionId)

  const connect = useCallback(async () => {
    const port = Number(configuration.port)
    if (!configuration.host.trim() || !Number.isInteger(port) || port < 1 || port > 65535) {
      setConnectionError('Inserisci un host e una porta OPC UA validi nella configurazione comunicazione.')
      return
    }
    setConnecting(true)
    setConnectionError(null)
    try {
      const response = await connectDelta(configuration.host.trim(), port)
      if (!response.success) throw new Error(response.message || 'Connessione OPC UA non riuscita.')
      setSessionId((current) => current + 1)
      setConnected(true)
    } catch (error) {
      setConnectionError(error instanceof Error ? error.message : 'Connessione OPC UA non riuscita.')
    } finally {
      setConnecting(false)
    }
  }, [configuration.host, configuration.port])

  const disconnect = useCallback(async () => {
    setConnecting(true)
    setConnectionError(null)
    try {
      const response = await disconnectDelta()
      if (!response.success) throw new Error(response.message || 'Impossibile disconnettersi dalla macchina OPC UA.')
      setConnected(false)
    } catch (error) {
      setConnectionError(error instanceof Error ? error.message : 'Impossibile disconnettersi dalla macchina OPC UA.')
    } finally {
      setConnecting(false)
    }
  }, [])

  const writeJob = useCallback(async (job: DeltaJobData) => {
    const result = await writeDeltaJob(job)
    if (!result.success) throw new Error(result.message || 'La macchina ha rifiutato i dati della commessa.')
    return result.message || 'Parametri della commessa inviati alla macchina.'
  }, [])

  return {
    values: polling.data,
    connected,
    connecting,
    error: connectionError ?? polling.error,
    updatedAt: polling.updatedAt,
    connect,
    disconnect,
    writeJob,
  }
}
