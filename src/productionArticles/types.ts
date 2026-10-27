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
  queued: 'bg-neutral-100 text-neutral-600',
  waiting: 'bg-amber-50 text-amber-700',
  working: 'bg-blue-50 text-blue-700',
  error: 'bg-red-50 text-red-700',
  completed: 'bg-brand-green-50 text-brand-green-800',
}

export const stepStatusStyles: Record<StepStatus, string> = {
  pending: 'bg-neutral-100 text-neutral-500',
  working: 'bg-blue-100 text-blue-700',
  finished: 'bg-brand-primary text-white',
  error: 'bg-red-100 text-red-700',
}
