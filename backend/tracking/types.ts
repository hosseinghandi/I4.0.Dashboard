export type StepStatus = 'pending' | 'working' | 'finished' | 'error'

export interface TrackedArticle {
  code: string
  description: string
  quantity: number
}

export interface Observation {
  // "idle" means the machine reports nothing about this article yet.
  status: StepStatus | 'idle'
  message: string
}

export interface MachineAdapter {
  machineId: string
  /** Why the machine cannot be used right now, or null when it is reachable. */
  unavailableReason(): string | null
  /** Hands the article to the machine. Adapters for read-only machines omit it. */
  dispatch?(article: TrackedArticle): Promise<void>
  /** Derives the step state purely from the machine's own data. */
  observe(article: TrackedArticle, previous: StepStatus): Promise<Observation>
}
