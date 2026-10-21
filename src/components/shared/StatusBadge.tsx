export function StatusBadge({ connected, label }: { connected: boolean; label?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[10px] font-semibold ${connected ? 'bg-brand-green-50 text-brand-green-800' : 'bg-neutral-100 text-neutral-600'}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${connected ? 'bg-brand-primary' : 'bg-neutral-400'}`} />
      {label ?? (connected ? 'Connesso' : 'Non connesso')}
    </span>
  )
}
