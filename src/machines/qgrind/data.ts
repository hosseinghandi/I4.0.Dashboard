export type QGrindCategory = 'execution' | 'production' | 'motion' | 'alarms' | 'other'

export interface QGrindObservation {
  name: string
  value: string
  category: QGrindCategory
  unit?: string
  timestamp?: string
}

export interface QGrindMachineData {
  observations: QGrindObservation[]
  raw: unknown
}
