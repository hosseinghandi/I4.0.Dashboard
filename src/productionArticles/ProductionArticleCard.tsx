import { machineDefinitionById } from '../machines'
import { BoxIcon } from '../components/shared/BoxIcon'
import {
  machineTypeLabels,
  productionArticleStateLabels,
  productionArticleStateStyles,
  shortMachineNames,
  stepLabel,
  stepStatusLabels,
  stepStatusStyles,
  type ProductionArticle,
} from './types'

const formatDate = (value: string | null) =>
  value
    ? new Date(`${value.replace(' ', 'T')}Z`).toLocaleString('it-IT', {
        dateStyle: 'short',
        timeStyle: 'short',
      })
    : '—'

/**
 * Compact stepper for single-line rows:
 * Clean, lightweight numeric indicators with status colors and connecting lines.
 */
export function CompactStepper({ productionArticle }: { productionArticle: ProductionArticle }) {
  return (
    <ol className="m-0 flex list-none items-center gap-1.5 p-0" aria-label="Percorso macchine">
      {productionArticle.steps.map((step, index) => {
        const isDone = step.status === 'finished'
        const isWorking = step.status === 'working'
        const isError = step.status === 'error'
        const shortName = shortMachineNames[step.machineId] || machineDefinitionById[step.machineId]?.name

        return (
          <li
            key={step.machineId}
            className="flex items-center gap-1.5"
            title={`${shortName}: ${stepLabel(step)}`}
          >
            <span
              className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-[9px] font-bold transition-all ${
                isDone
                  ? 'bg-brand-primary text-white shadow-xs'
                  : isWorking
                    ? 'bg-brand-sidebar text-white ring-2 ring-brand-primary ring-offset-1 animate-pulse'
                    : isError
                      ? 'bg-neutral-800 text-white'
                      : 'bg-neutral-200 text-neutral-600'
              }`}
            >
              {isDone ? '✓' : isError ? '!' : index + 1}
            </span>
            {index < productionArticle.steps.length - 1 && (
              <span
                className={`h-0.5 w-2.5 rounded-full ${
                  isDone ? 'bg-brand-primary' : 'bg-neutral-200'
                }`}
              />
            )}
          </li>
        )
      })}
    </ol>
  )
}

/**
 * Non-overlapping, responsive workflow stepper for the Featured Card:
 * Combines an overview timeline progress track with a spacious responsive card grid.
 */
export function ProductionArticleStepper({
  productionArticle,
  compact = false,
}: {
  productionArticle: ProductionArticle
  compact?: boolean
}) {
  if (compact) {
    return <CompactStepper productionArticle={productionArticle} />
  }

  const totalSteps = productionArticle.steps.length
  const finishedSteps = productionArticle.steps.filter((s) => s.status === 'finished').length
  const progressPercent = totalSteps > 0 ? Math.round((finishedSteps / totalSteps) * 100) : 0

  return (
    <div className="w-full space-y-4">
      {/* Connected top timeline line */}
      <div className="relative px-2">
        <div className="absolute top-1/2 left-4 right-4 h-1 -translate-y-1/2 rounded-full bg-neutral-200">
          <div
            className="h-full rounded-full bg-brand-primary transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="relative flex justify-between">
          {productionArticle.steps.map((step, index) => {
            const isDone = step.status === 'finished'
            const isWorking = step.status === 'working'
            const isError = step.status === 'error'

            return (
              <div key={step.machineId} className="flex flex-col items-center">
                <span
                  className={`grid h-7 w-7 place-items-center rounded-full text-xs font-bold transition-all ${
                    isDone
                      ? 'bg-brand-primary text-white ring-4 ring-white shadow-sm'
                      : isWorking
                        ? 'bg-brand-sidebar text-white ring-4 ring-brand-green-200 shadow-sm animate-pulse'
                        : isError
                          ? 'bg-neutral-800 text-white ring-4 ring-white shadow-sm'
                          : 'bg-white text-neutral-600 border-2 border-neutral-300 ring-4 ring-white'
                  }`}
                >
                  {isDone ? '✓' : isError ? '!' : index + 1}
                </span>
                <span className="mt-1 text-[11px] font-bold text-neutral-700">
                  {shortMachineNames[step.machineId] || `Fase ${index + 1}`}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Responsive Grid Cards: Guaranteed NO text collision or overlap */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {productionArticle.steps.map((step, index) => {
          const isDone = step.status === 'finished'
          const isWorking = step.status === 'working'
          const isError = step.status === 'error'
          const machine = machineDefinitionById[step.machineId]
          const shortName = shortMachineNames[step.machineId] || machine.name
          const typeLabel = machineTypeLabels[step.machineId] || 'Lavorazione'

          return (
            <div
              key={step.machineId}
              className={`flex flex-col justify-between rounded-xl border p-3.5 transition-all ${
                isWorking
                  ? 'border-brand-primary/70 bg-brand-green-50/70 ring-2 ring-brand-green-200 shadow-xs'
                  : isDone
                    ? 'border-brand-green-200 bg-brand-green-50/40'
                    : isError
                      ? 'border-neutral-300 bg-neutral-100/70'
                      : 'border-neutral-200 bg-neutral-50/70'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-1.5 pb-2 border-b border-neutral-200/60">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                    Fase {index + 1}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      isWorking
                        ? 'bg-brand-sidebar text-white ring-1 ring-brand-primary'
                        : isDone
                          ? 'bg-brand-primary text-white'
                          : isError
                            ? 'bg-neutral-800 text-white'
                            : 'bg-neutral-200 text-neutral-700'
                    }`}
                  >
                    {stepStatusLabels[step.status]}
                  </span>
                </div>

                <div className="pt-2">
                  <h4 className="m-0 text-sm font-bold text-neutral-900 leading-tight">
                    {shortName}
                  </h4>
                  <p className="m-0 mt-0.5 text-[11px] text-neutral-500">
                    {typeLabel}
                  </p>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-neutral-200/50">
                {step.message ? (
                  <p className="m-0 text-[11px] font-medium text-neutral-700 line-clamp-2">
                    {step.message}
                  </p>
                ) : (
                  <p className="m-0 text-[11px] text-neutral-400">
                    {isDone ? 'Lavorazione completata' : 'In attesa avvio'}
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/**
 * Featured Active Card:
 * Displays all data of the selected article in an ultra-efficient, ergonomic layout
 * that fits completely within screen height without requiring scrolling.
 */
export function FeaturedProductionArticleCard({
  productionArticle,
  onOpenDetail,
  onEdit,
}: {
  productionArticle: ProductionArticle
  onOpenDetail: () => void
  onEdit?: () => void
}) {
  const currentStep =
    productionArticle.steps.find((s) => s.status === 'working') ??
    productionArticle.steps.find((s) => s.status !== 'finished') ??
    productionArticle.steps[0]

  const currentMachine = currentStep ? machineDefinitionById[currentStep.machineId] : null
  const currentShortName = currentStep ? shortMachineNames[currentStep.machineId] : null
  const finishedStepsCount = productionArticle.steps.filter((s) => s.status === 'finished').length
  const totalSteps = productionArticle.steps.length
  const progressPercent = totalSteps > 0 ? Math.round((finishedStepsCount / totalSteps) * 100) : 0

  return (
    <article className="rounded-xl border border-brand-primary/50 bg-white p-3.5 sm:p-4 shadow-xs transition-shadow hover:shadow-sm">
      {/* Row 1: Header - Icon, Code, State Badge, Description, Lotto & Action Buttons */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Requested Box Icon */}
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-brand-green-200 bg-brand-green-50 text-brand-primary">
            <BoxIcon className="h-5 w-5" strokeWidth={1.2} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-lg font-bold tracking-tight text-neutral-900 sm:text-xl">
                {productionArticle.code}
              </span>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${productionArticleStateStyles[productionArticle.state]}`}
              >
                {productionArticleStateLabels[productionArticle.state]}
              </span>
              <span className="rounded-md border border-neutral-200 bg-neutral-50 px-2 py-0.5 font-mono text-[11px] font-bold text-neutral-700">
                Lotto: {productionArticle.quantity} pz
              </span>
              <span className="text-[10px] text-neutral-400 font-mono hidden md:inline">
                #{productionArticle.id}
              </span>
            </div>
            <p className="m-0 mt-0.5 truncate text-xs font-medium text-neutral-600 max-w-xl">
              {productionArticle.description || 'Nessuna descrizione specificata'}
            </p>
          </div>
        </div>

        {/* Action Buttons & Timestamps */}
        <div className="flex shrink-0 items-center justify-between gap-2 border-t border-neutral-100 pt-2 sm:border-0 sm:pt-0">
          <span className="text-[10px] text-neutral-400 hidden xl:inline">
            Agg: {formatDate(productionArticle.updatedAt)}
          </span>
          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                type="button"
                onClick={onEdit}
                className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors cursor-pointer"
              >
                Modifica
              </button>
            )}
            <button
              type="button"
              onClick={onOpenDetail}
              className="rounded-lg bg-brand-sidebar px-3 py-1.5 text-xs font-semibold text-white hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              Dettagli completi →
            </button>
          </div>
        </div>
      </div>

      {/* Row 2: Active Phase Banner & Live Notes (Compact Callout) */}
      <div className="mt-2.5 rounded-lg border border-brand-border/60 bg-neutral-50/80 px-3 py-2 text-xs">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            <span className="inline-flex items-center gap-1.5 font-bold text-brand-sidebar">
              <span className="h-2 w-2 rounded-full bg-brand-primary animate-pulse" />
              Fase {currentStep?.position ?? 1}: {currentShortName || currentMachine?.name}
            </span>
            <span
              className={`rounded-full px-2 py-0.2 text-[10px] font-semibold ${
                currentStep ? stepStatusStyles[currentStep.status] : 'bg-neutral-200 text-neutral-600'
              }`}
            >
              {currentStep ? stepLabel(currentStep) : 'In attesa'}
            </span>
            {currentStep?.message && (
              <span className="text-neutral-700 font-medium truncate max-w-md hidden sm:inline">
                — {currentStep.message}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 text-[11px] text-neutral-500 font-mono">
            {currentStep?.startedAt && (
              <span>Avvio: <b className="font-semibold text-neutral-700">{formatDate(currentStep.startedAt)}</b></span>
            )}
            <span className="text-neutral-400">
              {finishedStepsCount}/{totalSteps} fasi ({progressPercent}%)
            </span>
          </div>
        </div>

        {/* Note if present */}
        {productionArticle.notes && (
          <div className="mt-1.5 border-t border-neutral-200/60 pt-1 text-[11px] text-neutral-600">
            <span className="font-bold text-neutral-800">Note: </span>
            <span className="truncate">{productionArticle.notes}</span>
          </div>
        )}
      </div>

      {/* Row 3: Machine Sequence Pipeline Grid - Compact, Non-overlapping, Shows All Phases */}
      <div className="mt-2.5">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {productionArticle.steps.map((step, index) => {
            const isDone = step.status === 'finished'
            const isWorking = step.status === 'working'
            const isError = step.status === 'error'
            const shortName = shortMachineNames[step.machineId] || machineDefinitionById[step.machineId]?.name

            return (
              <div
                key={step.machineId}
                className={`flex items-center justify-between gap-1.5 rounded-lg border px-2.5 py-1.5 transition-colors ${
                  isWorking
                    ? 'border-brand-primary/80 bg-brand-green-50/70 shadow-2xs'
                    : isDone
                      ? 'border-brand-green-200 bg-brand-green-50/30'
                      : isError
                        ? 'border-neutral-300 bg-neutral-100'
                        : 'border-neutral-200 bg-neutral-50/60'
                }`}
                title={step.message || shortName}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px] font-bold ${
                      isDone
                        ? 'bg-brand-primary text-white'
                        : isWorking
                          ? 'bg-brand-sidebar text-white ring-1 ring-brand-primary'
                          : isError
                            ? 'bg-neutral-800 text-white'
                            : 'bg-neutral-200 text-neutral-600'
                    }`}
                  >
                    {isDone ? '✓' : index + 1}
                  </span>
                  <span className="truncate text-xs font-bold text-neutral-900">
                    {shortName}
                  </span>
                </div>

                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold ${
                    isWorking
                      ? 'bg-brand-sidebar text-white'
                      : isDone
                        ? 'bg-brand-primary text-white'
                        : isError
                          ? 'bg-neutral-800 text-white'
                          : 'bg-neutral-200 text-neutral-600'
                  }`}
                >
                  {stepStatusLabels[step.status]}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </article>
  )
}

/**
 * Single Line Row for subsequent articles:
 * When selected (isActive === true), it is CLEARLY MARKED with radio/checkmark,
 * green border accent, glowing background, and an active badge!
 */
export function ProductionArticleRow({
  productionArticle,
  isActive = false,
  onSelect,
  onOpenDetail,
}: {
  productionArticle: ProductionArticle
  isActive?: boolean
  onSelect: () => void
  onOpenDetail: () => void
}) {
  const currentStep =
    productionArticle.steps.find((s) => s.status === 'working') ??
    productionArticle.steps.find((s) => s.status !== 'finished') ??
    null

  const currentShort = currentStep
    ? shortMachineNames[currentStep.machineId] || machineDefinitionById[currentStep.machineId]?.name
    : 'Completato'

  return (
    <div
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect()
        }
      }}
      className={`group relative flex flex-col gap-2 rounded-xl border transition-all sm:flex-row sm:items-center sm:justify-between px-3.5 py-2.5 sm:px-4 sm:py-2.5 cursor-pointer ${
        isActive
          ? 'border-brand-primary border-l-4 border-l-brand-primary bg-brand-green-50/70 shadow-xs ring-1 ring-brand-primary/30'
          : 'border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50/80 hover:shadow-2xs'
      }`}
    >
      {/* Left: Radio/Checkmark selection marker + Box Icon + Code + Description */}
      <div className="flex min-w-0 items-center gap-2.5">
        {/* Distinctive selection marker */}
        <div className="shrink-0" title={isActive ? 'Articolo selezionato' : 'Clicca per selezionare'}>
          {isActive ? (
            <span className="grid h-4.5 w-4.5 place-items-center rounded-full bg-brand-primary text-white shadow-xs">
              <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M2.5 6l2.5 2.5 4.5-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          ) : (
            <span className="block h-4.5 w-4.5 rounded-full border-2 border-neutral-300 transition-colors group-hover:border-neutral-400 group-hover:bg-neutral-100" />
          )}
        </div>

        {/* Box Icon */}
        <div
          className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg border transition-colors ${
            isActive
              ? 'border-brand-green-300 bg-brand-green-100 text-brand-primary'
              : 'border-neutral-200 bg-neutral-50 text-neutral-500 group-hover:text-neutral-700'
          }`}
        >
          <BoxIcon className="h-3.5 w-3.5" strokeWidth={1} />
        </div>

        {/* Code & Description */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className={`font-mono text-xs sm:text-sm font-bold ${
                isActive ? 'text-brand-green-950 font-extrabold' : 'text-neutral-900'
              }`}
            >
              {productionArticle.code}
            </span>
            {isActive && (
              <span className="inline-flex items-center gap-1 rounded bg-brand-primary px-1.5 py-0.2 text-[8px] font-bold text-white uppercase tracking-wider shadow-2xs">
                In primo piano
              </span>
            )}
          </div>
          <p className="m-0 truncate text-xs text-neutral-500 max-w-xs md:max-w-md">
            {productionArticle.description || 'Nessuna descrizione'}
          </p>
        </div>
      </div>

      {/* Middle/Right: Mini Stepper + Current machine + Quantity + State Badge + Action */}
      <div className="flex items-center justify-between gap-3 sm:justify-end sm:shrink-0">
        <div className="hidden lg:block">
          <CompactStepper productionArticle={productionArticle} />
        </div>

        <div className="text-left sm:text-right">
          <span className="block text-xs font-semibold text-neutral-700 truncate max-w-[140px]">
            {currentStep ? currentShort : 'Completato'}
          </span>
          <span className="text-[10px] text-neutral-400 font-mono">
            {productionArticle.quantity} pz
          </span>
        </div>

        {/* State Badge */}
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${productionArticleStateStyles[productionArticle.state]}`}
        >
          {productionArticleStateLabels[productionArticle.state]}
        </span>

        {/* Quick action button to open detail modal */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onOpenDetail()
          }}
          title="Apri scheda dettagli completa"
          className="rounded-lg px-2 py-1 text-xs font-semibold text-neutral-500 hover:bg-neutral-100 hover:text-brand-primary transition-colors cursor-pointer"
        >
          Dettagli →
        </button>
      </div>
    </div>
  )
}

/**
 * Standard card export maintained for compatibility
 */
export function ProductionArticleCard({
  productionArticle,
  onOpen,
}: {
  productionArticle: ProductionArticle
  onOpen: () => void
}) {
  return (
    <FeaturedProductionArticleCard
      productionArticle={productionArticle}
      onOpenDetail={onOpen}
    />
  )
}
