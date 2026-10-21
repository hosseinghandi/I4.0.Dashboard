import type { ReactNode } from "react";
import {
  machineDefinitionById,
  machineDefinitions,
} from "../../machines";
import type { MachineId } from "../../machines/types";
import { MachineSidebar } from "./MachineSidebar";

export function DashboardLayout({
  machineId,
  communicationSetupActive,
  onSelectMachine,
  onOpenSetup,
  children,
}: {
  machineId: MachineId;
  communicationSetupActive: boolean;
  onSelectMachine: (id: MachineId) => void;
  onOpenSetup: () => void;
  children: ReactNode;
}) {
  const machine = machineDefinitionById[machineId];

  return (
    <div className="min-h-screen bg-brand-surface-subtle">
      <MachineSidebar
        machines={machineDefinitions}
        activeMachine={machineId}
        communicationSetupActive={communicationSetupActive}
        onSelectMachine={onSelectMachine}
        onOpenSetup={onOpenSetup}
      />
      <main className="min-h-screen pt-[167px] sm:ml-[270px] sm:pt-0">
        <header className="flex h-[52px] items-center justify-between gap-3 border-b border-brand-border bg-white px-4 sm:h-[59px] sm:px-[clamp(22px,4.8vw,74px)]">
          <div className="flex min-w-0 items-center gap-2.5 truncate text-sm font-semibold text-neutral-600">
            <span className="shrink-0 font-extrabold tracking-wide text-brand-primary">
              OCIMA
            </span>
            <span className="text-neutral-300">/</span>
            <span className="truncate">
              {communicationSetupActive
                ? "Configurazione comunicazione"
                : machine.name}
            </span>
          </div>
        </header>
        <div className="w-full px-4 py-6 sm:px-[clamp(22px,4.8vw,74px)] sm:py-9">
          {children}
          <footer className="mt-6 text-[10px] text-neutral-400">
            Dashboard industriale OCIMA <span className="mx-1">·</span> I dati
            macchina provengono dal driver di comunicazione configurato.
          </footer>
        </div>
      </main>
    </div>
  );
}
