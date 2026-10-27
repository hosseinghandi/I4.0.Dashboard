import { machineDefinitionById } from '../machines'
import {
  productionArticleStateLabels,
  productionArticleStateStyles,
  stepStatusStyles,
  type ProductionArticle,
} from './types'

export function ProductionArticleStepper({ productionArticle }: { productionArticle: ProductionArticle }) {
  return (
    <ol className="m-0 flex list-none items-center gap-1 p-0" aria-label="Percorso macchine">
      {productionArticle.steps.map((step, index) => (
        <li key={step.machineId} className="flex min-w-0 flex-1 items-center gap-1" title={machineDefinitionById[step.machineId].name}>
          <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-[10px] font-bold ${stepStatusStyles[step.status]} ${step.status === 'working' ? 'animate-pulse' : ''}`}>
            {step.status === 'finished' ? '✓' : step.status === 'error' ? '!' : index + 1}
          </span>
          {index < productionArticle.steps.length - 1 && <span className={`h-0.5 flex-1 ${step.status === 'finished' ? 'bg-brand-primary' : 'bg-neutral-200'}`} />}
        </li>
      ))}
    </ol>
  )
}

export function ProductionArticleCard({
  productionArticle,
  onOpen,
}: {
  productionArticle: ProductionArticle
  onOpen: () => void
}) {
  const current = productionArticle.currentMachine ? machineDefinitionById[productionArticle.currentMachine].name : null
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex min-w-0 flex-col gap-3 rounded-[11px] border border-brand-border bg-white p-4 text-left shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="m-0 truncate text-base font-bold text-brand-ink">{productionArticle.code}</h3>
          <p className="m-0 mt-0.5 truncate text-[11px] text-neutral-500">{productionArticle.description || 'Nessuna descrizione'}</p>
        </div>
        <span className="shrink-0 text-[10px] font-semibold text-neutral-500">× {productionArticle.quantity}</span>
      </div>
      <ProductionArticleStepper productionArticle={productionArticle} />
      <div className="flex items-center justify-between gap-2">
        <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${productionArticleStateStyles[productionArticle.state]}`}>
          {productionArticleStateLabels[productionArticle.state]}
        </span>
        <span className="min-w-0 truncate text-[11px] text-neutral-500">
          {current ? `Ora: ${current}` : 'Tutte le macchine terminate'}
        </span>
      </div>
    </button>
  )
}
