import type { MachineId } from '../machines/types'

export type StepStatus = 'pending' | 'working' | 'finished' | 'error'
export type ProductionArticleState = 'queued' | 'waiting' | 'working' | 'error' | 'completed'

export interface ProductionArticleStep {
  machineId: MachineId
  position: number
  status: StepStatus
  message: string
  startedAt: string | null
  dispatchedAt: string | null
  finishedAt: string | null
  updatedAt: string
}

export interface ProductionArticle {
  id: number
  code: string
  description: string
  quantity: number
  notes: string
  createdAt: string
  updatedAt: string
  state: ProductionArticleState
  currentMachine: MachineId | null
  steps: ProductionArticleStep[]
}

export interface ProductionArticleInput {
  code: string
  description: string
  quantity: number
  notes: string
  machines: MachineId[]
}

export const stepStatusLabels: Record<StepStatus, string> = {
  pending: 'In attesa',
  working: 'In lavorazione',
  finished: 'Terminato',
  error: 'Errore',
}

export function stepLabel(step: ProductionArticleStep): string {
  return step.status === 'pending' && step.dispatchedAt ? 'Inviato alla macchina' : stepStatusLabels[step.status]
}

export const productionArticleStateLabels: Record<ProductionArticleState, string> = {
  queued: 'In coda',
  waiting: 'In attesa della macchina successiva',
  working: 'In lavorazione',
  error: 'Errore',
  completed: 'Completato',
}

export const productionArticleStateStyles: Record<ProductionArticleState, string> = {
  queued: 'bg-neutral-100 text-neutral-700 border border-neutral-300',
  waiting: 'bg-neutral-100 text-neutral-800 border border-neutral-300',
  working: 'bg-brand-green-100 text-brand-green-900 border border-brand-green-300 font-semibold',
  error: 'bg-neutral-200 text-neutral-900 border border-neutral-400',
  completed: 'bg-brand-green-50 text-brand-green-800 border border-brand-green-200',
}

export const stepStatusStyles: Record<StepStatus, string> = {
  pending: 'bg-neutral-100 text-neutral-600 border border-neutral-200',
  working: 'bg-brand-sidebar text-white border border-brand-sidebar',
  finished: 'bg-brand-primary text-white',
  error: 'bg-neutral-800 text-white',
}

export const shortMachineNames: Record<MachineId, string> = {
  delta: 'Delta MINI 15',
  qgrind: 'Q-Grind U-600',
  mikron: 'Mikron VCE 1200',
  zeiss: 'Zeiss Contura',
}

export const machineTypeLabels: Record<MachineId, string> = {
  delta: 'Rettifica tangenziale',
  qgrind: 'Rettifica cilindrica',
  mikron: 'Fresatura CNC',
  zeiss: 'Misura e collaudo CMM',
}

