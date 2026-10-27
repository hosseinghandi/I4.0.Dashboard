import { useState, type FormEvent } from 'react'
import { ErrorBanner } from '../components/shared/ErrorBanner'
import { machineDefinitionById, machineDefinitions } from '../machines'
import type { MachineId } from '../machines/types'
import { createProductionArticle, updateProductionArticle } from './service'
import type { ProductionArticle } from './types'

const inputClass =
  'w-full rounded-md border border-brand-border bg-white px-3 py-2 text-sm text-brand-ink outline-none focus:border-brand-primary'

export function ProductionArticleForm({
  productionArticle,
  onClose,
  onSaved,
}: {
  productionArticle: ProductionArticle | null
  onClose: () => void
  onSaved: (productionArticle: ProductionArticle) => void
}) {
  const [code, setCode] = useState(productionArticle?.code ?? '')
  const [description, setDescription] = useState(productionArticle?.description ?? '')
  const [quantity, setQuantity] = useState(String(productionArticle?.quantity ?? 1))
  const [notes, setNotes] = useState(productionArticle?.notes ?? '')
  // Ordered list of the machines this production article goes through.
  const [route, setRoute] = useState<MachineId[]>(productionArticle?.steps.map((step) => step.machineId) ?? [])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const available = machineDefinitions.filter((machine) => !route.includes(machine.id))

  const move = (index: number, offset: number) => {
    const target = index + offset
    if (target < 0 || target >= route.length) return
    const next = [...route]
    ;[next[index], next[target]] = [next[target], next[index]]
    setRoute(next)
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setError(null)
    const input = { code, description, notes, quantity: Number(quantity), machines: route }
    try {
      onSaved(
        productionArticle
          ? await updateProductionArticle(productionArticle.id, input)
          : await createProductionArticle(input),
      )
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Salvataggio non riuscito.')
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-40 grid place-items-center overflow-y-auto bg-black/40 p-4" role="dialog" aria-modal="true">
      <form onSubmit={submit} className="w-full max-w-xl rounded-[11px] bg-white p-5 shadow-xl">
        <h2 className="m-0 text-lg font-bold text-brand-ink">{productionArticle ? 'Modifica Production Article' : 'Introduci nuovo Production Article'}</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_110px]">
          <label className="text-xs font-semibold text-neutral-600">
            Codice Production Article *
            <input className={inputClass} value={code} maxLength={80} required autoFocus onChange={(e) => setCode(e.target.value)} />
          </label>
          <label className="text-xs font-semibold text-neutral-600">
            Quantità
            <input className={inputClass} type="number" min={1} step={1} value={quantity} onChange={(e) => setQuantity(e.target.value)} />
          </label>
        </div>
        <label className="mt-3 block text-xs font-semibold text-neutral-600">
          Descrizione
          <input className={inputClass} value={description} maxLength={300} onChange={(e) => setDescription(e.target.value)} />
        </label>
        <label className="mt-3 block text-xs font-semibold text-neutral-600">
          Note
          <textarea className={inputClass} rows={2} value={notes} maxLength={2000} onChange={(e) => setNotes(e.target.value)} />
        </label>

        <fieldset className="mt-4 rounded-md border border-brand-border p-3">
          <legend className="px-1 text-xs font-semibold text-neutral-600">Percorso macchine (in ordine)</legend>
          {route.length === 0 ? (
            <p className="m-0 text-xs text-neutral-500">Aggiungi le macchine necessarie per questo Production Article.</p>
          ) : (
            <ol className="m-0 list-none space-y-1.5 p-0">
              {route.map((machineId, index) => (
                <li key={machineId} className="flex items-center gap-2 rounded-md bg-brand-surface-subtle px-2.5 py-1.5 text-xs">
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-brand-primary text-[10px] font-bold text-white">{index + 1}</span>
                  <span className="min-w-0 flex-1 truncate font-medium">{machineDefinitionById[machineId].name}</span>
                  <button type="button" aria-label="Sposta su" disabled={index === 0} className="px-1.5 disabled:opacity-30" onClick={() => move(index, -1)}>↑</button>
                  <button type="button" aria-label="Sposta giù" disabled={index === route.length - 1} className="px-1.5 disabled:opacity-30" onClick={() => move(index, 1)}>↓</button>
                  <button type="button" aria-label="Rimuovi" className="px-1.5 text-red-700" onClick={() => setRoute(route.filter((id) => id !== machineId))}>✕</button>
                </li>
              ))}
            </ol>
          )}
          {available.length > 0 && (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {available.map((machine) => (
                <button
                  key={machine.id}
                  type="button"
                  className="rounded-full border border-brand-border px-2.5 py-1 text-[11px] text-neutral-600 hover:border-brand-primary hover:text-brand-primary"
                  onClick={() => setRoute([...route, machine.id])}
                >
                  + {machine.name}
                </button>
              ))}
            </div>
          )}
        </fieldset>

        {error && <ErrorBanner message={error} />}
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" className="rounded-md px-4 py-2 text-sm text-neutral-600 hover:bg-neutral-100" onClick={onClose}>Annulla</button>
          <button type="submit" disabled={saving || route.length === 0} className="rounded-md bg-brand-primary px-4 py-2 text-sm font-semibold text-white hover:bg-brand-primary-hover disabled:opacity-50">
            {saving ? 'Salvataggio…' : 'Salva'}
          </button>
        </div>
      </form>
    </div>
  )
}
