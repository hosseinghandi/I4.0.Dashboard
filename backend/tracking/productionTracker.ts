import type { DatabaseSync } from 'node:sqlite'
import type { MachineAdapter, StepStatus } from './types.js'

interface CurrentStep {
  id: number
  production_article_id: number
  machine_id: string
  status: StepStatus
  message: string
  started_at: string | null
  dispatched_at: string | null
  code: string
  description: string
  quantity: number
}

const timestamp = () => new Date().toISOString().replace('T', ' ').slice(0, 19)

/**
 * Drives production article steps from real machine data. Only the first unfinished
 * step of each article is active: it is handed to its machine, then followed until
 * the machine reports that it is finished.
 */
export class ProductionTracker {
  private timer: ReturnType<typeof setInterval> | null = null
  private ticking = false
  private readonly database: DatabaseSync
  private readonly intervalMs: number
  private readonly adapters: Map<string, MachineAdapter>

  constructor(
    database: DatabaseSync,
    adapters: MachineAdapter[],
    intervalMs = 2000,
  ) {
    this.database = database
    this.intervalMs = intervalMs
    this.adapters = new Map(adapters.map((adapter) => [adapter.machineId, adapter]))
  }

  start(): void {
    if (this.timer) return
    this.timer = setInterval(() => void this.tick(), this.intervalMs)
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer)
    this.timer = null
  }

  async tick(): Promise<void> {
    if (this.ticking) return
    this.ticking = true
    try {
      const rows = this.database
        .prepare(
          `SELECT s.*, a.code, a.description, a.quantity
           FROM production_article_steps s
           JOIN production_articles a ON a.id = s.production_article_id
           WHERE s.status != 'finished'
           ORDER BY s.production_article_id, s.position`,
        )
        .all() as unknown as CurrentStep[]

      const seen = new Set<number>()
      for (const step of rows) {
        if (seen.has(step.production_article_id)) continue
        seen.add(step.production_article_id)
        try {
          await this.process(step)
        } catch (error) {
          console.error(`Production tracking failed for ${step.code}/${step.machine_id}:`, error)
        }
      }
    } finally {
      this.ticking = false
    }
  }

  private async process(step: CurrentStep): Promise<void> {
    const adapter = this.adapters.get(step.machine_id)
    if (!adapter) {
      this.save(step, step.status, 'Nessuna fonte dati: driver macchina non disponibile.', step.dispatched_at)
      return
    }

    const unavailable = adapter.unavailableReason()
    if (unavailable) {
      this.save(step, step.status, unavailable, step.dispatched_at)
      return
    }

    const article = { code: step.code, description: step.description, quantity: step.quantity }

    try {
      if (!step.dispatched_at) {
        const busy = this.database
          .prepare(
            `SELECT 1 FROM production_article_steps
             WHERE machine_id = ? AND dispatched_at IS NOT NULL AND status != 'finished' AND id != ?`,
          )
          .get(step.machine_id, step.id)
        if (busy) {
          this.save(step, 'pending', 'In coda: la macchina sta lavorando un altro Production Article.', null)
          return
        }
        await adapter.dispatch?.(article)
        this.save(step, 'pending', 'Inviato alla macchina, in attesa dell’avvio.', timestamp())
        return
      }

      const observation = await adapter.observe(article, step.status)
      const status = observation.status === 'idle' ? (step.status === 'error' ? 'pending' : step.status) : observation.status
      this.save(step, status, observation.message, step.dispatched_at)
    } catch (error) {
      // A failed dispatch stays pending and is retried on the next tick.
      const reason = error instanceof Error ? error.message : String(error)
      this.save(step, step.status, `Macchina non raggiungibile: ${reason}`, step.dispatched_at)
    }
  }

  private save(step: CurrentStep, status: StepStatus, message: string, dispatchedAt: string | null): void {
    if (status === step.status && message === step.message && dispatchedAt === step.dispatched_at) return
    const now = timestamp()
    const startedAt = status === 'working' ? (step.started_at ?? now) : step.started_at
    this.database
      .prepare(
        `UPDATE production_article_steps
         SET status = ?, message = ?, dispatched_at = ?, started_at = ?,
             finished_at = ?, updated_at = ?
         WHERE id = ?`,
      )
      .run(status, message, dispatchedAt, startedAt, status === 'finished' ? now : null, now, step.id)
    this.database
      .prepare('UPDATE production_articles SET updated_at = ? WHERE id = ?')
      .run(now, step.production_article_id)
  }
}
