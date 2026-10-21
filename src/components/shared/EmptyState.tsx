export function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex min-h-36 flex-col items-center justify-center px-5 py-7 text-center text-neutral-500">
      <span aria-hidden="true" className="grid h-9 w-9 place-items-center rounded-full bg-brand-green-50 text-lg text-brand-green-700">⌁</span>
      <p className="mb-0 mt-2.5 max-w-[320px] text-xs leading-relaxed">{message}</p>
    </div>
  )
}
