import type { ReactNode } from 'react'

export function Panel({
  title,
  description,
  updatedAt,
  actions,
  children,
}: {
  title: string
  description: string
  updatedAt?: Date | null
  actions?: ReactNode
  children: ReactNode
}) {
  return (
    <article className="min-w-0 rounded-[11px] border border-brand-border bg-white p-4 shadow-sm sm:p-[18px]">
      <header className="relative flex min-h-11 items-start justify-between gap-2 border-b border-neutral-100 pb-3">
        <div className="min-w-0">
          <h2 className="m-0 text-base font-bold text-brand-ink">{title}</h2>
          <p className="mb-0 mt-1 text-[11px] text-neutral-500">{description}</p>
        </div>
        {actions}
        {updatedAt && <small className="absolute bottom-[-17px] right-0 text-[10px] text-neutral-400">Aggiornato alle {updatedAt.toLocaleTimeString('it-IT')}</small>}
      </header>
      {children}
    </article>
  )
}
