import type { ApiResult } from '../types'
import type { QGrindCategory, QGrindObservation } from './data'
import { postJson, requestJson } from '../../services/http'

interface MtConnectResponse {
  success: boolean
  data?: unknown
  message?: string
  error?: string
}

const apiBase = '/api/machines/qgrind'

export async function setMtConnectAddress(agentAddress: string): Promise<void> {
  const result = await postJson<ApiResult<never>>(`${apiBase}/agent`, {
    manualIpSetup: agentAddress,
  })
  if (!result.success) throw new Error(result.message || 'Impossibile impostare l’indirizzo dell’agente MTConnect.')
}

export async function readMtConnect(): Promise<unknown> {
  const result = await requestJson<MtConnectResponse>(`${apiBase}/status`)
  if (!result.success) {
    throw new Error(result.message || result.error || 'Richiesta all’agente MTConnect non riuscita.')
  }
  return result.data ?? null
}

export function getMtConnectMeasurements(data: unknown): QGrindObservation[] {
  const measurements: QGrindObservation[] = []

  function visit(value: unknown, path: string): void {
    if (Array.isArray(value)) {
      value.forEach((item, index) => visit(item, path ? `${path} ${index + 1}` : `Observation ${index + 1}`))
      return
    }

    if (value === null || typeof value !== 'object') return

    const record = value as Record<string, unknown>
    const textValue = record['#text'] ?? record._text
    if (textValue !== undefined && textValue !== null && typeof textValue !== 'object') {
      const explicitName = record['@_name'] ?? record.name
      const dataItemId = record['@_dataItemId']
      const name = typeof explicitName === 'string' && explicitName
        ? explicitName
        : [path.split(' / ').at(-1) || 'Osservazione', typeof dataItemId === 'string' ? dataItemId : ''].filter(Boolean).join(' · ')
      const tags = `${path} ${name} ${String(record['@_type'] ?? '')}`.toLowerCase()
      const declaredCategory = record['@_category']
      const category: QGrindCategory = declaredCategory === 'CONDITION' || /alarm|fault|condition/.test(tags)
        ? 'alarms'
        : /execution|controller_mode|avail|emergency|functional_mode|system/.test(tags)
          ? 'execution'
          : /production|part_count|good_parts|bad_parts|program/.test(tags)
            ? 'production'
            : /position|velocity|feed|speed|load|torque|temperature|power|current/.test(tags)
              ? 'motion'
              : 'other'
      const unit = record['@_units'] ?? record['@_nativeUnits']
      const timestamp = record['@_timestamp']
      measurements.push({
        name,
        value: String(textValue),
        category,
        ...(typeof unit === 'string' ? { unit } : {}),
        ...(typeof timestamp === 'string' ? { timestamp } : {}),
      })
      return
    }

    for (const [key, child] of Object.entries(record)) {
      if (key.startsWith('@_') || key === 'xmlns' || key === 'xmlns:xsi') continue
      visit(child, key.startsWith('#') ? path : path ? `${path} / ${key}` : key)
    }
  }

  visit(data, '')
  return measurements
}
