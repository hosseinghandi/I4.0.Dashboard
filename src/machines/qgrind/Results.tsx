import type { MachineData } from '../types'
import type { QGrindCategory, QGrindMachineData, QGrindObservation } from './data'
import { ErrorBanner } from '../../components/shared/ErrorBanner'
import { Panel } from '../../components/shared/Panel'

const categoryLabels: Record<QGrindCategory, string> = {
  execution: 'Stato macchina',
  production: 'Produzione',
  motion: 'Valori macchina',
  alarms: 'Allarmi e condizioni',
  other: 'Altre osservazioni',
}

const categoryOrder: QGrindCategory[] = ['execution', 'production', 'motion', 'alarms', 'other']

export function QGrindResults({ machine }: { machine: MachineData<QGrindMachineData> }) {
  const observations = machine.values?.observations ?? []
  const groups = categoryOrder
    .map((category) => ({
      category,
      observations: observations.filter((item) => item.category === category),
    }))

  return (
    <div className="space-y-3.5">
      <Panel
        title="Dati QGrind U-600"
        description="Osservazioni macchina dall'agente MTConnect"
        updatedAt={machine.updatedAt}
      >
        {machine.error && <ErrorBanner message={machine.error} />}
        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <SummaryValue label="Osservazioni" value={observations.length} />
          <SummaryValue label="Valori di stato" value={countCategory(observations, 'execution')} />
          <SummaryValue label="Valori di produzione" value={countCategory(observations, 'production')} />
          <SummaryValue label="Allarmi" value={countCategory(observations, 'alarms')} alarm />
        </div>
        {observations.length === 0 && (
          <p className="mb-0 mt-4 text-[10px] text-neutral-500">
            {machine.connected
              ? "Connesso, ma l'agente non ha ancora restituito osservazioni."
              : "I campi verranno compilati quando saranno disponibili i dati dell'agente MTConnect."}
          </p>
        )}
        <div className="mt-5 space-y-4">
          {groups.map(({ category, observations: items }) => (
            <ObservationGroup key={category} title={categoryLabels[category]} observations={items} />
          ))}
        </div>
      </Panel>
      {machine.values && (
        <details className="rounded-lg border border-brand-border bg-white px-4 py-3">
          <summary className="cursor-pointer text-[11px] font-semibold text-neutral-600">Visualizza la risposta MTConnect originale</summary>
          <pre className="max-h-80 overflow-auto whitespace-pre-wrap break-words rounded-md bg-neutral-50 p-3 font-mono text-[9px] leading-relaxed text-neutral-700">{JSON.stringify(machine.values.raw, null, 2)}</pre>
        </details>
      )}
    </div>
  )
}

function countCategory(observations: QGrindObservation[], category: QGrindCategory) {
  return observations.filter((item) => item.category === category).length
}

function SummaryValue({ label, value, alarm = false }: { label: string; value: number; alarm?: boolean }) {
  return (
    <div className="rounded-lg border border-neutral-100 bg-neutral-50 px-3 py-3">
      <span className="block text-[10px] font-semibold text-neutral-500">{label}</span>
      <strong className={`mt-1 block text-xl font-bold ${alarm && value > 0 ? 'text-red-600' : 'text-brand-ink'}`}>{value}</strong>
    </div>
  )
}

function ObservationGroup({ title, observations }: { title: string; observations: QGrindObservation[] }) {
  return (
    <section>
      <h3 className="mb-2 border-b border-neutral-100 pb-2 text-[11px] font-bold text-neutral-700">{title}<span className="ml-2 font-normal text-neutral-400">{observations.length}</span></h3>
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {observations.length > 0
          ? observations.map((item, index) => <ObservationCard key={`${item.name}-${index}`} observation={item} />)
          : <EmptyObservationCard />}
      </div>
    </section>
  )
}

function EmptyObservationCard() {
  return (
    <div aria-disabled="true" className="flex min-h-11 items-center justify-between gap-3 rounded-md border border-dashed border-neutral-200 bg-neutral-50 px-3 py-2.5 text-neutral-400">
      <span className="text-[11px]">In attesa di osservazioni</span>
      <strong className="font-mono text-xs">—</strong>
    </div>
  )
}

function ObservationCard({ observation }: { observation: QGrindObservation }) {
  return (
    <div className="flex min-w-0 items-start justify-between gap-3 rounded-md border border-neutral-100 bg-white px-3 py-2.5">
      <span title={observation.name} className="min-w-0 truncate text-[11px] text-neutral-600">{observation.name}</span>
      <span className="shrink-0 text-right">
        <strong title={observation.value} className="font-mono text-xs text-brand-ink">{observation.value}</strong>
        {observation.unit && <small className="ml-1 text-[9px] text-neutral-500">{observation.unit}</small>}
        {observation.timestamp && <small className="mt-1 block text-[8px] text-neutral-400">{new Date(observation.timestamp).toLocaleTimeString('it-IT')}</small>}
      </span>
    </div>
  )
}
