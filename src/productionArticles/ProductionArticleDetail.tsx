import { machineDefinitionById } from '../machines'
import { ProductionArticleStepper } from './ProductionArticleCard'
import {
  productionArticleStateLabels,
  productionArticleStateStyles,
  stepLabel,
  stepStatusStyles,
  type ProductionArticle,
} from './types'

// SQLite CURRENT_TIMESTAMP is UTC without a zone marker.
const formatDate = (value: string | null) =>
  value ? new Date(`${value.replace(' ', 'T')}Z`).toLocaleString('it-IT') : '—'

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
  return (
    <div className="fixed inset-0 z-40 grid place-items-center overflow-y-auto bg-black/40 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-2xl rounded-[11px] bg-white p-5 shadow-xl">
        <header className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="m-0 truncate text-xl font-bold text-brand-ink">{productionArticle.code}</h2>
            <p className="m-0 mt-1 text-xs text-neutral-500">{productionArticle.description || 'Nessuna descrizione'}</p>
          </div>
          <button type="button" aria-label="Chiudi" className="px-2 text-lg text-neutral-500" onClick={onClose}>✕</button>
        </header>

        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-neutral-600">
          <span className={`rounded-full px-2.5 py-1 font-semibold ${productionArticleStateStyles[productionArticle.state]}`}>{productionArticleStateLabels[productionArticle.state]}</span>
          <span>Quantità: <b>{productionArticle.quantity}</b></span>
          <span>Creato: {formatDate(productionArticle.createdAt)}</span>
          <span>Aggiornato: {formatDate(productionArticle.updatedAt)}</span>
        </div>
        {productionArticle.notes && <p className="mb-0 mt-3 whitespace-pre-wrap rounded-md bg-brand-surface-subtle p-2.5 text-xs text-neutral-600">{productionArticle.notes}</p>}

        <div className="mt-4"><ProductionArticleStepper productionArticle={productionArticle} /></div>
        <p className="mb-0 mt-3 text-[11px] text-neutral-400">Lo stato è letto automaticamente dai dati reali delle macchine.</p>

        <ul className="m-0 mt-3 list-none space-y-2 p-0">
          {productionArticle.steps.map((step, index) => (
            <li key={step.machineId} className="rounded-md border border-brand-border p-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`grid h-6 w-6 place-items-center rounded-full text-[10px] font-bold ${stepStatusStyles[step.status]}`}>{index + 1}</span>
                <span className="min-w-0 flex-1 text-sm font-semibold">{machineDefinitionById[step.machineId].name}</span>
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${stepStatusStyles[step.status]}`}>{stepLabel(step)}</span>
              </div>
              <p className="m-0 mt-1.5 text-[11px] text-neutral-500">
                Inviato: {formatDate(step.dispatchedAt)} · Inizio: {formatDate(step.startedAt)} · Fine: {formatDate(step.finishedAt)}
              </p>
              {step.message && <p className="m-0 mt-1 text-[11px] text-neutral-600">{step.message}</p>}
            </li>
          ))}
        </ul>

        <div className="mt-5 flex justify-between gap-2">
          <button
            type="button"
            className="rounded-md px-4 py-2 text-sm text-red-700 hover:bg-red-50"
            onClick={() => {
              if (window.confirm(`Eliminare il Production Article ${productionArticle.code}?`)) onDelete()
            }}
          >
            Elimina
          </button>
          <button type="button" className="rounded-md bg-brand-primary px-4 py-2 text-sm font-semibold text-white hover:bg-brand-primary-hover" onClick={onEdit}>
            Modifica
          </button>
        </div>
      </div>
    </div>
  )
}
