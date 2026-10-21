export function ErrorBanner({ message }: { message: string }) {
  return (
    <div role="alert" className="my-3 flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-800">
      <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full bg-red-700 text-[10px] font-bold text-white">!</span>
      <p className="m-0 break-words">{message}</p>
    </div>
  )
}
