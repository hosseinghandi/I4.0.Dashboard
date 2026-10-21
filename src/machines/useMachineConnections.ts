import { useDeltaMachine } from './delta/useDeltaMachine'
import { useMachineConfigurations } from './useMachineConfigurations'
import { useMikronMachine } from './mikron/useMikronMachine'
import { useQGrindMachine } from './qgrind/useQGrindMachine'
import { useZeissMachine } from './zeiss/useZeissMachine'

export type MachineStates = ReturnType<typeof useMachineConnections>['machines']

export function useMachineConnections() {
  const { configurations, updateConfiguration } = useMachineConfigurations()
  const qgrind = useQGrindMachine(configurations.qgrind)
  const zeiss = useZeissMachine()
  const delta = useDeltaMachine(configurations.delta)
  const mikron = useMikronMachine()

  return {
    configurations,
    updateConfiguration,
    machines: { qgrind, zeiss, delta, mikron },
  }
}
