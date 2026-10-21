import type { MachineDefinition } from '../types'

export const deltaConfiguration: MachineDefinition = {
  id: 'delta',
  name: 'Rettificatrice tangenziale Delta MINI 15 DIASTEP',
  serial: '251107.1953SX',
  protocol: 'OPC UA',
  resultView: 'delta-opcua',
  defaultConfiguration: { host: '192.168.1.91', port: '48010', pollIntervalMs: 1000 },
  supportsConnection: true,
}
