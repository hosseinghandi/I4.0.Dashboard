import { useState } from 'react'
import { machineDefinitionById } from './machines'
import { DashboardLayout } from './components/layout/DashboardLayout'
import { MachinePage } from './components/shared/MachinePage'
import { UnavailableResults } from './components/shared/UnavailableResults'
import { CommunicationSetupPage } from './components/setup/CommunicationSetupPage'
import { DeltaResults } from './machines/delta/Results'
import { QGrindResults } from './machines/qgrind/Results'
import { useMachineConnections } from './machines/useMachineConnections'
import type { MachineId } from './machines/types'

type ActivePage = 'machine' | 'setup'

export function App() {
  const [activePage, setActivePage] = useState<ActivePage>('machine')
  const [selectedMachine, setSelectedMachine] = useState<MachineId>('qgrind')
  const machineConnections = useMachineConnections()
  const states = machineConnections.machines
  const currentMachine = machineDefinitionById[selectedMachine]
  const isConnected = states[selectedMachine].connected

  const selectMachine = (id: MachineId) => {
    setSelectedMachine(id)
    setActivePage('machine')
  }

  return (
    <DashboardLayout
      machineId={selectedMachine}
      communicationSetupActive={activePage === 'setup'}
      onSelectMachine={selectMachine}
      onOpenSetup={() => setActivePage('setup')}
    >
      {activePage === 'setup' ? (
        <CommunicationSetupPage
          configurations={machineConnections.configurations}
          machineStates={states}
          onSaveConfiguration={machineConnections.updateConfiguration}
        />
      ) : (
        <MachinePage machine={currentMachine} connected={isConnected}>
          {currentMachine.resultView === 'mtconnect' ? (
            <QGrindResults machine={states.qgrind} />
          ) : currentMachine.resultView === 'delta-opcua' ? (
            <DeltaResults machine={states.delta} onWriteJob={states.delta.writeJob} />
          ) : (
            <UnavailableResults machine={currentMachine} onOpenSetup={() => setActivePage('setup')} />
          )}
        </MachinePage>
      )}
    </DashboardLayout>
  )
}

export default App
