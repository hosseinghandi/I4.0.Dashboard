import type { ApiResult } from '../types'
import type { DeltaJobData, DeltaMachineData } from './data'
import { postJson } from '../../services/http'

const apiBase = '/api/machines/delta'

export function connectDelta(ip: string, port: number): Promise<ApiResult<never>> {
  return postJson(`${apiBase}/connect`, { ip, port })
}

export function disconnectDelta(): Promise<ApiResult<never>> {
  return postJson(`${apiBase}/disconnect`, {})
}

export function readDelta(): Promise<ApiResult<DeltaMachineData>> {
  return postJson(`${apiBase}/read`, {})
}

export function writeDeltaJob(data: DeltaJobData): Promise<ApiResult<never>> {
  return postJson(`${apiBase}/write`, data)
}
