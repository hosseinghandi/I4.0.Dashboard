import { useCallback, useEffect, useState } from 'react'
import { defaultMachineConfigurations } from './index'
import type { MachineConfiguration, MachineConfigurations, MachineId } from './types'

const storageKey = 'ocima-machine-configurations'

function loadConfigurations(): MachineConfigurations {
  try {
    const saved = localStorage.getItem(storageKey)
    if (!saved) return defaultMachineConfigurations
    const parsed: unknown = JSON.parse(saved)
    if (!parsed || typeof parsed !== 'object') return defaultMachineConfigurations

    const record = parsed as Partial<Record<MachineId, Partial<MachineConfiguration>>>
    return Object.fromEntries(
      Object.entries(defaultMachineConfigurations).map(([id, defaults]) => {
        const config = record[id as MachineId]
        return [id, {
          host: typeof config?.host === 'string' ? config.host : defaults.host,
          port: typeof config?.port === 'string' ? config.port : defaults.port,
          pollIntervalMs: typeof config?.pollIntervalMs === 'number'
            ? config.pollIntervalMs
            : defaults.pollIntervalMs,
        }]
      }),
    ) as MachineConfigurations
  } catch {
    return defaultMachineConfigurations
  }
}

export function useMachineConfigurations() {
  const [configurations, setConfigurations] = useState(loadConfigurations)

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(configurations))
  }, [configurations])

  const updateConfiguration = useCallback((id: MachineId, configuration: MachineConfiguration) => {
    setConfigurations((current) => ({ ...current, [id]: configuration }))
  }, [])

  return { configurations, updateConfiguration }
}
