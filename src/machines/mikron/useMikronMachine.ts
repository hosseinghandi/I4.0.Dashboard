import type { MachineData } from '../types'
import type { MikronMachineData } from './data'

export function useMikronMachine(): MachineData<MikronMachineData> {
  return {
    values: null,
    connected: false,
    connecting: false,
    error: null,
    updatedAt: null,
  }
}
