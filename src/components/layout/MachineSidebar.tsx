import type { MachineDefinition, MachineId } from "../../machines/types";

export function MachineSidebar({
  machines,
  activeMachine,
  activePage,
  onSelectMachine,
  onOpenProductionArticles,
  onOpenSetup,
}: {
  machines: MachineDefinition[];
  activeMachine: MachineId;
  activePage: "production-articles" | "machine" | "setup";
  onSelectMachine: (id: MachineId) => void;
  onOpenProductionArticles: () => void;
  onOpenSetup: () => void;
}) {
  return (
    <aside className="fixed inset-x-0 top-0 z-20 flex flex-col bg-brand-sidebar px-3 py-3 text-neutral-200 sm:inset-y-0 sm:right-auto sm:w-[270px] sm:px-[17px] sm:py-6">
      <a
        className="flex min-h-[42px] items-center justify-center no-underline sm:min-h-[105px] sm:border-b sm:border-white/5"
        href="#machines"
        onClick={(event) => {
          event.preventDefault();
          onOpenProductionArticles();
        }}
        aria-label="Dashboard OCIMA"
      >
        <img
          className="h-auto w-[170px] object-contain sm:w-[218px]"
          src="/logo.png"
          alt="OCIMA"
        />
      </a>

      <div className="mt-2 sm:mt-6">
        <button
          type="button"
          aria-current={activePage === "production-articles" ? "page" : undefined}
          className={`flex min-h-10 w-full items-center gap-2.5 rounded-md px-2.5 text-left text-xs transition-colors ${activePage === "production-articles" ? "bg-brand-primary font-semibold text-white" : "text-neutral-300 hover:bg-white/10 hover:text-white"}`}
          onClick={onOpenProductionArticles}
        >
          <span className="w-[21px] text-center text-sm" aria-hidden="true">?</span>
          Production Article
        </button>
      </div>

      <div className="mb-2 mt-2 grid grid-cols-2 gap-1.5 sm:mt-6 sm:flex sm:flex-col sm:gap-2">
        <p className="col-span-2 mb-0 hidden px-2 text-[10px] font-bold tracking-[1.1px] text-neutral-400 sm:block">
          MACCHINE
        </p>
        {machines.map((machine, index) => (
          <button
            key={machine.id}
            type="button"
            aria-current={
              activePage === "machine" && activeMachine === machine.id
                ? "page"
                : undefined
            }
            className={`flex min-h-10 min-w-0 items-start gap-2 rounded-md px-2.5 py-2.5 text-left transition-colors sm:min-h-[58px] sm:gap-2.5 ${activePage === "machine" && activeMachine === machine.id ? "bg-brand-primary font-semibold text-white" : "text-neutral-300 hover:bg-white/10 hover:text-white"}`}
            onClick={() => onSelectMachine(machine.id)}
          >
            <span
              className={`mt-px grid h-[21px] w-[21px] shrink-0 place-items-center rounded-md text-[10px] font-bold ${activePage === "machine" && activeMachine === machine.id ? "bg-white text-brand-green-800" : "bg-white/10 text-neutral-300"}`}
            >
              {index + 1}
            </span>
            <span className="min-w-0 text-[11px] leading-snug">
              {machine.name}
            </span>
          </button>
        ))}
      </div>

      <div className="mt-1 border-t border-white/10 pt-2 sm:mt-auto sm:space-y-3 sm:pt-4">
        <button
          type="button"
          aria-current={activePage === "setup" ? "page" : undefined}
          className={`flex min-h-10 w-full items-center gap-2.5 rounded-md px-2.5 text-left text-xs transition-colors ${activePage === "setup" ? "bg-brand-primary font-semibold text-white" : "text-neutral-300 hover:bg-white/10 hover:text-white"}`}
          onClick={onOpenSetup}
        >
          <span className="w-[21px] text-center text-sm" aria-hidden="true">
            ⚙
          </span>
          Configurazione comunicazione
        </button>
      </div>
    </aside>
  );
}
