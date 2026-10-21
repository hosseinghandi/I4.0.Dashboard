import { useState, type FormEvent } from 'react'
import type { DeltaJobData } from './data'
import { Panel } from '../../components/shared/Panel'

export function DeltaJobForm({ connected, onSubmit }: { connected: boolean; onSubmit: (job: DeltaJobData) => Promise<string> }) {
  const [job, setJob] = useState<DeltaJobData>({ numeroOrdine: '', commessa: '', quantitaRichiesta: '' })
  const [message, setMessage] = useState<string | null>(null)
  const [sending, setSending] = useState(false)

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSending(true)
    setMessage(null)
    try {
      setMessage(await onSubmit(job))
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Impossibile inviare i parametri della commessa.')
    } finally {
      setSending(false)
    }
  }

  const update = (field: keyof DeltaJobData, value: string) => setJob((current) => ({ ...current, [field]: value }))

  return (
    <Panel title="Parametri commessa MES" description="Invia i dati della commessa di produzione alla Delta MINI 15 DIASTEP.">
      <form className="mt-4" onSubmit={(event) => void submit(event)}>
        <div className="grid gap-3 sm:grid-cols-3">
          <JobField label="Numero ordine" value={job.numeroOrdine} disabled={!connected} onChange={(value) => update('numeroOrdine', value)} placeholder="es. ORD-2026-001" />
          <JobField label="Codice commessa" value={job.commessa} disabled={!connected} onChange={(value) => update('commessa', value)} placeholder="es. JOB-2048" />
          <JobField label="Quantità richiesta" value={job.quantitaRichiesta} disabled={!connected} onChange={(value) => update('quantitaRichiesta', value)} placeholder="es. 500" />
        </div>
        <button className="mt-3 w-full rounded-md bg-brand-primary px-3 py-2.5 text-[11px] font-bold text-white hover:bg-brand-primary-hover disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto" type="submit" disabled={!connected || sending}>{sending ? 'Invio in corso…' : 'Invia parametri commessa'}</button>
        {message && <p className="mb-0 mt-2 text-center text-[11px] text-neutral-700" role="status">{message}</p>}
      </form>
    </Panel>
  )
}

function JobField({ label, value, disabled, onChange, placeholder }: {
  label: string
  value: string
  disabled: boolean
  onChange: (value: string) => void
  placeholder: string
}) {
  return (
    <label className="grid min-w-0 gap-1.5">
      <span className="text-[11px] font-semibold text-neutral-600">{label}</span>
      <input className="h-9 min-w-0 rounded-md border border-brand-border bg-neutral-50 px-2.5 text-xs text-brand-ink focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-green-100 disabled:bg-neutral-100" value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
    </label>
  )
}
