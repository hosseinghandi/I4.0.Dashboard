import type { MachineResultField } from '../types'

export interface DeltaMachineData {
  pezziProdottiTot: string | number
  pezziPlateau: string | number
  stato: boolean
  statoDeriva: boolean
  allarme: number
  inizioCiclo: boolean
  fineCiclo: boolean
}

export interface DeltaJobData {
  numeroOrdine: string
  commessa: string
  quantitaRichiesta: string
}

export const deltaResultFields: MachineResultField<DeltaMachineData>[] = [
  { key: 'pezziProdottiTot', label: 'Pezzi totali prodotti' },
  { key: 'pezziPlateau', label: 'Pezzi plateau' },
  { key: 'stato', label: 'Stato macchina', format: (value) => value ? 'In funzione' : 'Ferma' },
  { key: 'statoDeriva', label: 'Stato deriva', format: (value) => value ? 'Attiva' : 'Inattiva' },
  { key: 'allarme', label: 'Allarme' },
  { key: 'inizioCiclo', label: 'Inizio ciclo', format: (value) => value ? 'Attivo' : 'Inattivo' },
  { key: 'fineCiclo', label: 'Fine ciclo', format: (value) => value ? 'Completato' : 'In corso' },
]
