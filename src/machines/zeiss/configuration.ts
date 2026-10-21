import type { MachineDefinition } from '../types'

export const zeissConfiguration: MachineDefinition = {
  id: 'zeiss',
  name: 'Macchina di misura Zeiss Contura 9/18/8',
  serial: '145225045070',
  protocol: 'Driver non disponibile',
  resultView: 'driver-required',
  defaultConfiguration: { host: '', port: '', pollIntervalMs: 5000 },
  supportsConnection: false,
}
