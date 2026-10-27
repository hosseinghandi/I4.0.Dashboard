import { Router, type Response } from 'express'
import type { DatabaseSync } from 'node:sqlite'
import { productionArticlePaths } from '../paths/machinePaths.js'

const machineIds = ['delta', 'qgrind', 'mikron', 'zeiss'] as const
import type { StepStatus } from '../tracking/types.js'

interface ProductionArticleRow {
  id: number
  code: string
  description: string
  quantity: number
  notes: string
  created_at: string
  updated_at: string
}

interface StepRow {
  production_article_id: number
  position: number
  machine_id: string
  status: StepStatus
  message: string
  started_at: string | null
  dispatched_at: string | null
  finished_at: string | null
  updated_at: string
}

class ValidationError extends Error {}

const notFoundMessage = 'Production Article non trovato.'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function text(value: unknown, field: string, maxLength: number): string {
  if (value === undefined || value === null) return ''
  if (typeof value !== 'string') throw new ValidationError(`Il campo "${field}" non è valido.`)
  const trimmed = value.trim()
  if (trimmed.length > maxLength) throw new ValidationError(`Il campo "${field}" è troppo lungo.`)
  return trimmed
}

function parseProductionArticle(body: unknown) {
  if (!isRecord(body)) throw new ValidationError('Corpo della richiesta non valido.')
  const code = text(body.code, 'codice', 80)
  if (!code) throw new ValidationError('Il codice del Production Article è obbligatorio.')
  const quantity = body.quantity === undefined ? 1 : body.quantity
  if (typeof quantity !== 'number' || !Number.isInteger(quantity) || quantity < 1 || quantity > 1_000_000) {
    throw new ValidationError('La quantità deve essere un intero positivo.')
  }
  if (!Array.isArray(body.machines)) throw new ValidationError('Il percorso macchine non è valido.')
  const machines = body.machines.map((machine) => {
    if (typeof machine !== 'string' || !(machineIds as readonly string[]).includes(machine)) {
      throw new ValidationError('Macchina sconosciuta nel percorso.')
    }
    return machine
  })
  if (new Set(machines).size !== machines.length) {
    throw new ValidationError('Una macchina può comparire una sola volta nel percorso.')
  }
  if (machines.length === 0) throw new ValidationError('Seleziona almeno una macchina.')
  return {
    code,
    description: text(body.description, 'descrizione', 300),
    notes: text(body.notes, 'note', 2000),
    quantity,
    machines,
  }
}

function overallState(steps: StepRow[]) {
  if (steps.length > 0 && steps.every((step) => step.status === 'finished')) return 'completed'
  if (steps.some((step) => step.status === 'error')) return 'error'
  if (steps.some((step) => step.status === 'working')) return 'working'
  return steps.some((step) => step.status === 'finished') ? 'waiting' : 'queued'
}

function serialize(row: ProductionArticleRow, steps: StepRow[]) {
  const current = steps.find((step) => step.status !== 'finished') ?? null
  return {
    id: row.id,
    code: row.code,
    description: row.description,
    quantity: row.quantity,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    state: overallState(steps),
    currentMachine: current?.machine_id ?? null,
    steps: steps.map((step) => ({
      machineId: step.machine_id,
      position: step.position,
      status: step.status,
      message: step.message,
      startedAt: step.started_at,
      dispatchedAt: step.dispatched_at,
      finishedAt: step.finished_at,
      updatedAt: step.updated_at,
    })),
  }
}

export function createProductionArticleRoutes(database: DatabaseSync): Router {
  const router = Router()

  const listRows = (search: string): ProductionArticleRow[] => {
    const pattern = `%${search.replace(/[\\%_]/g, '\\$&')}%`
    return database
      .prepare(
        `SELECT * FROM production_articles
         WHERE code LIKE ? ESCAPE '\\' OR description LIKE ? ESCAPE '\\'
         ORDER BY updated_at DESC, id DESC`,
      )
      .all(pattern, pattern) as unknown as ProductionArticleRow[]
  }

  const stepsFor = (articleId: number): StepRow[] =>
    database
      .prepare('SELECT * FROM production_article_steps WHERE production_article_id = ? ORDER BY position')
      .all(articleId) as unknown as StepRow[]

  const findRow = (id: number) =>
    database.prepare('SELECT * FROM production_articles WHERE id = ?').get(id) as unknown as
      | ProductionArticleRow
      | undefined

  const load = (id: number) => {
    const row = findRow(id)
    return row ? serialize(row, stepsFor(id)) : null
  }

  const parseId = (value: unknown): number | null => {
    const id = Number(value)
    return Number.isInteger(id) && id > 0 ? id : null
  }

  const transaction = <T>(work: () => T): T => {
    database.exec('BEGIN IMMEDIATE')
    try {
      const result = work()
      database.exec('COMMIT')
      return result
    } catch (error) {
      database.exec('ROLLBACK')
      throw error
    }
  }

  const fail = (response: Response, error: unknown) => {
    if (error instanceof ValidationError) {
      response.status(400).json({ success: false, message: error.message })
      return
    }
    if (error instanceof Error && /UNIQUE constraint failed: production_articles\.code/.test(error.message)) {
      response.status(409).json({ success: false, message: 'Esiste già un Production Article con questo codice.' })
      return
    }
    console.error('Production article request failed:', error)
    response.status(500).json({ success: false, message: 'Errore interno del server.' })
  }

  const insertSteps = (articleId: number, machines: string[]) => {
    const insert = database.prepare(
      'INSERT INTO production_article_steps (production_article_id, position, machine_id) VALUES (?, ?, ?)',
    )
    machines.forEach((machine, index) => insert.run(articleId, index + 1, machine))
  }

  router.get(productionArticlePaths.collection, (request, response) => {
    const search = typeof request.query.search === 'string' ? request.query.search.trim() : ''
    const data = listRows(search).map((row) => serialize(row, stepsFor(row.id)))
    response.json({ success: true, data })
  })

  router.get(productionArticlePaths.item, (request, response) => {
    const id = parseId(request.params.id)
    const data = id ? load(id) : null
    if (!data) {
      response.status(404).json({ success: false, message: notFoundMessage })
      return
    }
    response.json({ success: true, data })
  })

  router.post(productionArticlePaths.collection, (request, response) => {
    try {
      const input = parseProductionArticle(request.body)
      const id = transaction(() => {
        const result = database
          .prepare('INSERT INTO production_articles (code, description, quantity, notes) VALUES (?, ?, ?, ?)')
          .run(input.code, input.description, input.quantity, input.notes)
        const articleId = Number(result.lastInsertRowid)
        insertSteps(articleId, input.machines)
        return articleId
      })
      response.status(201).json({ success: true, data: load(id) })
    } catch (error) {
      fail(response, error)
    }
  })

  router.put(productionArticlePaths.item, (request, response) => {
    try {
      const id = parseId(request.params.id)
      if (!id || !findRow(id)) {
        response.status(404).json({ success: false, message: notFoundMessage })
        return
      }
      const input = parseProductionArticle(request.body)
      transaction(() => {
        database
          .prepare(
            `UPDATE production_articles SET code = ?, description = ?, quantity = ?, notes = ?,
             updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
          )
          .run(input.code, input.description, input.quantity, input.notes, id)
        // Drop removed machines, then re-number the rest (keeping their progress) and add new ones.
        const placeholders = input.machines.map(() => '?').join(',')
        database
          .prepare(
            `DELETE FROM production_article_steps
             WHERE production_article_id = ? AND machine_id NOT IN (${placeholders})`,
          )
          .run(id, ...input.machines)
        const existing = new Set(stepsFor(id).map((step) => step.machine_id))
        // Temporary offset avoids clashes while positions are rewritten.
        database
          .prepare('UPDATE production_article_steps SET position = position + 1000 WHERE production_article_id = ?')
          .run(id)
        const update = database.prepare(
          'UPDATE production_article_steps SET position = ? WHERE production_article_id = ? AND machine_id = ?',
        )
        const insert = database.prepare(
          'INSERT INTO production_article_steps (production_article_id, position, machine_id) VALUES (?, ?, ?)',
        )
        input.machines.forEach((machine, index) => {
          if (existing.has(machine)) update.run(index + 1, id, machine)
          else insert.run(id, index + 1, machine)
        })
      })
      response.json({ success: true, data: load(id) })
    } catch (error) {
      fail(response, error)
    }
  })

  router.delete(productionArticlePaths.item, (request, response) => {
    const id = parseId(request.params.id)
    if (!id || !findRow(id)) {
      response.status(404).json({ success: false, message: notFoundMessage })
      return
    }
    database.prepare('DELETE FROM production_articles WHERE id = ?').run(id)
    response.json({ success: true })
  })

  return router
}
