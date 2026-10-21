import type { ReactNode } from 'react'
import type { MachineDefinition } from '../../machines/types'
import { PageHeading } from './PageHeading'

export function MachinePage({ machine, connected, children }: {
  machine: MachineDefinition
  connected: boolean
  children: ReactNode
}) {
  return (
    <section>
      <PageHeading
        eyebrow="RISULTATI MACCHINA"
        title={machine.name}
        description={<>Numero di serie <strong className="font-mono text-neutral-700">{machine.serial}</strong></>}
        aside={<span className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-[11px] font-semibold ${connected ? 'bg-brand-green-50 text-brand-green-800' : 'bg-neutral-100 text-neutral-600'}`}><span className={`h-1.5 w-1.5 rounded-full ${connected ? 'bg-brand-primary' : 'bg-neutral-400'}`} />{connected ? 'Connesso' : 'Non connesso'}</span>}
      />
      {children}
    </section>
  )
}
