import { XMLParser } from 'fast-xml-parser'

const parser = new XMLParser({ ignoreAttributes: false })

export class MtConnectMachineService {
  private agentUrl: URL | null = null

  setAgentAddress(address: unknown): { success: boolean; message: string; address?: string } {
    if (typeof address !== 'string' || !address.trim()) {
      return { success: false, message: 'Inserisci un indirizzo IP valido per l’agente MTConnect.' }
    }

    const candidate = address.trim()
    let parsed: URL
    try {
      parsed = new URL(candidate.includes('://') ? candidate : `http://${candidate}`)
    } catch {
      return { success: false, message: 'L’indirizzo dell’agente MTConnect non è valido.' }
    }

    if (
      parsed.protocol !== 'http:' ||
      !parsed.hostname ||
      parsed.username ||
      parsed.password ||
      !['/', '/current'].includes(parsed.pathname) ||
      parsed.search ||
      parsed.hash
    ) {
      return { success: false, message: 'Inserisci host e porta dell’agente MTConnect, senza percorsi aggiuntivi.' }
    }

    parsed.pathname = '/current'
    this.agentUrl = parsed
    return {
      success: true,
      message: 'Indirizzo dell’agente MTConnect aggiornato.',
      address: parsed.toString(),
    }
  }

  async readStatus(): Promise<{ success: boolean; data?: unknown; message?: string }> {
    if (!this.agentUrl) {
      return { success: false, message: 'Indirizzo dell’agente MTConnect non configurato.' }
    }

    try {
      const response = await fetch(this.agentUrl, { signal: AbortSignal.timeout(10_000) })
      if (!response.ok) {
        return { success: false, message: `L’agente MTConnect ha restituito HTTP ${response.status}.` }
      }
      const document: unknown = parser.parse(await response.text())
      if (!document || typeof document !== 'object' || !('MTConnectStreams' in document)) {
        return { success: false, message: 'La risposta dell’agente non contiene dati MTConnect.' }
      }
      const streams = (document as { MTConnectStreams?: { Streams?: unknown } }).MTConnectStreams?.Streams
      if (!streams || typeof streams !== 'object') {
        return { success: false, message: 'La risposta MTConnect non contiene i flussi macchina.' }
      }
      return { success: true, data: streams }
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : String(error) }
    }
  }
}
