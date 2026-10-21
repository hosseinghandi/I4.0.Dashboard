import { machineDefinitions } from '../../machines'
import type { MachineConfiguration, MachineConfigurations, MachineId } from '../../machines/types'
import type { MachineStates } from '../../machines/useMachineConnections'
import { CommunicationSetupCard } from './CommunicationSetupCard'
import { PageHeading } from '../shared/PageHeading'

export function CommunicationSetupPage({
  configurations,
  machineStates,
  onSaveConfiguration,
}: {
  configurations: MachineConfigurations
  machineStates: MachineStates
  onSaveConfiguration: (id: MachineId, config: MachineConfiguration) => void
}) {
  return (
    <section>
      <PageHeading eyebrow="CONFIGURAZIONE" title="Configurazione comunicazione" description="Imposta indirizzo di rete, porta e intervallo di aggiornamento per ogni macchina." />
      <div className="grid items-start gap-3.5 xl:grid-cols-2">
        {machineDefinitions.map((machine) => {
          const state = machineStates[machine.id]
          return (
            <CommunicationSetupCard
              key={machine.id}
              machine={machine}
              configuration={configurations[machine.id]}
              state={state}
              onSave={(configuration) => onSaveConfiguration(machine.id, configuration)}
              onConnect={() => { if ('connect' in state) void state.connect() }}
              onDisconnect={() => { if ('disconnect' in state) void state.disconnect() }}
            />
          )
        })}
      </div>
    </section>
  )
}
