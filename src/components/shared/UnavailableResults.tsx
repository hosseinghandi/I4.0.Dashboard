import type { MachineDefinition } from '../../machines/types'
import { EmptyState } from './EmptyState'
import { Panel } from './Panel'

export function UnavailableResults({ machine, onOpenSetup }: { machine: MachineDefinition; onOpenSetup: () => void }) {
  return (
    <Panel title="Risultati macchina" description={`${machine.serial} · ${machine.protocol}`}>
      <EmptyState message="Il driver di comunicazione e la mappatura dei dati non sono ancora disponibili per questa macchina. I dati in tempo reale saranno visibili quando verrà aggiunta l'integrazione." />
      <div className="mb-4 flex justify-center">
        <button type="button" className="rounded-md border border-brand-border bg-white px-3 py-2 text-[11px] font-semibold text-neutral-700 hover:bg-neutral-50" onClick={onOpenSetup}>Apri configurazione comunicazione</button>
      </div>
    </Panel>
  )
}
