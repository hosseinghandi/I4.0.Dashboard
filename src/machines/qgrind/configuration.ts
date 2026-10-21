import type { MachineDefinition } from '../types'

export const qgrindConfiguration: MachineDefinition = {
  id: 'qgrind',
  name: 'Rettificatrice cilindrica universale QGrind U-600',
  serial: '600_00201',
  protocol: 'MTConnect',
  resultView: 'mtconnect',
  defaultConfiguration: { host: '192.168.200.10', port: '5000', pollIntervalMs: 2000 },
  supportsConnection: true,
}
