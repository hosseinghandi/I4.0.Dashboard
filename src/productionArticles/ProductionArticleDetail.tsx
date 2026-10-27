import { useState } from 'react'
import { BoxIcon } from '../components/shared/BoxIcon'
import { machineDefinitionById } from '../machines'
import {
  machineTypeLabels,
  productionArticleStateLabels,
  productionArticleStateStyles,
  shortMachineNames,
  stepLabel,
  stepStatusStyles,
  type ProductionArticle,
} from './types'

// SQLite CURRENT_TIMESTAMP is UTC without a zone marker.
const formatDate = (value: string | null) =>
  value
    ? new Date(`${value.replace(' ', 'T')}Z`).toLocaleString('it-IT', {
        dateStyle: 'short',
        timeStyle: 'short',
      })
    : '—'

export function ProductionArticleDetail({
  productionArticle,
  onClose,
  onEdit,
  onDelete,
}: {
  productionArticle: ProductionArticle
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const [confirmDelete, setConfirmDelete] = useState(false)

  const finishedCount = productionArticle.steps.filter((s) => s.status === 'finished').length
  const totalCount = productionArticle.steps.length
  const progressPercent = totalCount > 0 ? Math.round((finishedCount / totalCount) * 100) : 0

  return (
    <div
      className="fixed inset-0 z-40 grid place-items-center overflow-y-auto bg-black/50 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl sm:p-7">
        <header className="flex items-start justify-between gap-4 border-b border-neutral-100 pb-4">
          <div className="flex items-start gap-3.5 min-w-0">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-brand-green-200 bg-brand-green-50 text-brand-primary">
              <BoxIcon className="h-6 w-6" strokeWidth={1} />
            </div>
            <div className="min-w-0">
              <h2 className="m-0 truncate font-mono text-2xl font-bold text-neutral-900">
                {productionArticle.code}
              </h2>
              <p className="m-0 mt-0.5 text-xs font-medium text-neutral-500">
                {productionArticle.description || 'Nessuna descrizione specificata'}
              </p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Chiudi"
            className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 transition-colors"
            onClick={onClose}
          >
            ✕
          </button>
        </header>

        {/* Metadata pills */}
        <div className="mt-4 flex flex-wrap items-center gap-2.5 text-xs text-neutral-600">
          <span
            className={`rounded-full px-3 py-1 font-semibold ${productionArticleStateStyles[productionArticle.state]}`}
          >
            {productionArticleStateLabels[productionArticle.state]}
          </span>
          <span className="rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 py-1 font-mono font-semibold">
            Quantità: {productionArticle.quantity} pz
          </span>
          <span className="text-neutral-400">·</span>
          <span className="text-[11px] text-neutral-500">
            Creato: {formatDate(productionArticle.createdAt)}
          </span>
          <span className="text-neutral-400">·</span>
          <span className="text-[11px] text-neutral-500">
            Aggiornato: {formatDate(productionArticle.updatedAt)}
          </span>
        </div>

        {/* Notes */}
        {productionArticle.notes && (
          <p className="mb-0 mt-3.5 whitespace-pre-wrap rounded-xl border border-neutral-200 bg-neutral-50/80 p-3 text-xs text-neutral-700">
            <span className="font-bold text-neutral-900">Note: </span>
            {productionArticle.notes}
          </p>
        )}

        {/* Clean Progress Summary - Replaces the broken overflowing horizontal stepper */}
        <div className="mt-5 rounded-xl border border-neutral-200 bg-neutral-50/80 p-3.5">
          <div className="flex items-center justify-between text-xs font-semibold text-neutral-700">
            <span>Avanzamento fasi ({totalCount} stazioni)</span>
            <span className="font-mono text-neutral-500">
              {finishedCount} di {totalCount} completate ({progressPercent}%)
            </span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-neutral-200">
            <div
              className="h-full rounded-full bg-brand-primary transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <p className="mb-0 mt-3 text-[11px] text-neutral-400">
          Lo stato di avanzamento è letto automaticamente dai dati reali delle macchine.
        </p>

        {/* Detailed Vertical Step List */}
        <ul className="m-0 mt-3 list-none space-y-2.5 p-0">
          {productionArticle.steps.map((step, index) => {
            const isDone = step.status === 'finished'
            const isWorking = step.status === 'working'
            const isError = step.status === 'error'
            const shortName = shortMachineNames[step.machineId] || machineDefinitionById[step.machineId].name
            const fullName = machineDefinitionById[step.machineId].name
            const typeLabel = machineTypeLabels[step.machineId] || ''

            return (
              <li
                key={step.machineId}
                className={`rounded-xl border p-3.5 transition-all ${
                  isWorking
                    ? 'border-brand-primary/60 bg-brand-green-50/40 ring-1 ring-brand-green-200'
                    : isDone
                      ? 'border-neutral-200 bg-white'
                      : 'border-neutral-200 bg-neutral-50/50'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`grid h-6 w-6 place-items-center rounded-full text-xs font-bold ${
                        isDone
                          ? 'bg-brand-primary text-white'
                          : isWorking
                            ? 'bg-brand-sidebar text-white ring-1 ring-brand-primary animate-pulse'
                            : isError
                              ? 'bg-neutral-800 text-white'
                              : 'bg-neutral-200 text-neutral-600'
                      }`}
                    >
                      {isDone ? '✓' : index + 1}
                    </span>
                    <div className="min-w-0">
                      <span className="font-bold text-sm text-neutral-900 block truncate">
                        {shortName}
                        {typeLabel && <span className="ml-2 font-normal text-xs text-neutral-500">({typeLabel})</span>}
                      </span>
                      <span className="text-[11px] text-neutral-400 block truncate">
                        {fullName}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${stepStatusStyles[step.status]}`}
                  >
                    {stepLabel(step)}
                  </span>
                </div>

                <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-neutral-500">
                  <span>Inviato: <b>{formatDate(step.dispatchedAt)}</b></span>
                  <span>Inizio: <b>{formatDate(step.startedAt)}</b></span>
                  <span>Fine: <b>{formatDate(step.finishedAt)}</b></span>
                </div>

                {step.message && (
                  <p className="m-0 mt-2 rounded-lg bg-neutral-100/70 p-2 text-xs font-medium text-neutral-700">
                    {step.message}
                  </p>
                )}
              </li>
            )
          })}
        </ul>

        {/* Modal actions footer */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-neutral-100 pt-4">
          {confirmDelete ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-red-700 font-medium">Sei sicuro?</span>
              <button
                type="button"
                className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
                onClick={onDelete}
              >
                Conferma eliminazione
              </button>
              <button
                type="button"
                className="rounded-lg border border-neutral-300 px-3 py-1.5 text-xs text-neutral-600 hover:bg-neutral-50"
                onClick={() => setConfirmDelete(false)}
              >
                Annulla
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="rounded-lg px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
              onClick={() => setConfirmDelete(true)}
            >
              Elimina articolo
            </button>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
              onClick={onClose}
            >
              Chiudi
            </button>
            <button
              type="button"
              className="rounded-lg bg-brand-primary px-4 py-2 text-xs font-semibold text-white hover:bg-brand-primary-hover shadow-xs"
              onClick={onEdit}
            >
              Modifica articolo
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
