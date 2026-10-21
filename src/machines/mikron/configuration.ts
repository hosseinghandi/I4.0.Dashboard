import type { MachineDefinition } from '../types'

export const mikronConfiguration: MachineDefinition = {
  id: 'mikron',
  name: 'MIKRON VCE 1200 PRO',
  serial: '2023.005.00003',
  protocol: 'Driver non disponibile',
  resultView: 'driver-required',
  defaultConfiguration: { host: '', port: '', pollIntervalMs: 5000 },
  supportsConnection: false,
}
