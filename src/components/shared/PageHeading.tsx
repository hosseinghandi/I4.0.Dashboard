import type { ReactNode } from 'react'

export function PageHeading({
  eyebrow,
  title,
  description,
  aside,
}: {
  eyebrow: string
  title: string
  description?: ReactNode
  aside?: ReactNode
}) {
  return (
    <section className="mb-5 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
      <div className="min-w-0">
        <p className="mb-1.5 text-[11px] font-extrabold tracking-[1px] text-brand-primary">{eyebrow}</p>
        <h1 className="m-0 text-[25px] font-bold leading-tight tracking-tight text-brand-ink sm:text-[30px]">{title}</h1>
        {description && <p className="mb-0 mt-2 text-[13px] text-neutral-500">{description}</p>}
      </div>
      {aside}
    </section>
  )
}
