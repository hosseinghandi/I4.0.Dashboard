import type { MachineData } from '../types'
import type { ZeissMachineData } from './data'

export function useZeissMachine(): MachineData<ZeissMachineData> {
  return {
    values: null,
    connected: false,
    connecting: false,
    error: null,
    updatedAt: null,
  }
}
