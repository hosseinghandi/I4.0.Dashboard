import {
  deltaResultFields,
  type DeltaMachineData,
  type DeltaJobData,
} from "./data";
import type { MachineData } from "../types";
import { ErrorBanner } from "../../components/shared/ErrorBanner";
import { Panel } from "../../components/shared/Panel";
import { DeltaJobForm } from "./DeltaJobForm";

export function DeltaResults({
  machine,
  onWriteJob,
}: {
  machine: MachineData<DeltaMachineData>;
  onWriteJob: (job: DeltaJobData) => Promise<string>;
}) {
  return (
    <div className="space-y-3.5">
      <Panel
        title="Risultati macchina Delta"
        description="Valori OPC UA in tempo reale"
        updatedAt={machine.updatedAt}
      >
        {machine.error && <ErrorBanner message={machine.error} />}
        <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
          {deltaResultFields.map((field) => {
            const value = machine.values?.[field.key];
            const displayValue =
              value === undefined
                ? "—"
                : field.format
                  ? field.format(value)
                  : String(value);
            return (
              <div
                key={field.key}
                aria-disabled={!machine.values}
                className={`flex min-h-[68px] items-center justify-between gap-3 rounded-lg border border-neutral-100 px-3.5 py-3 ${machine.values ? "bg-neutral-50" : "bg-neutral-50/60 text-neutral-400"}`}
              >
                <span
                  className={`text-xs ${machine.values ? "text-neutral-600" : "text-neutral-400"}`}
                >
                  {field.label}
                </span>
                <strong
                  className={`text-right font-mono text-sm ${field.key === "stato" && value ? "text-brand-green-700" : machine.values ? "text-brand-ink" : "text-neutral-400"}`}
                >
                  {displayValue}
                </strong>
              </div>
            );
          })}
        </div>
        {!machine.values && (
          <p className="mb-0 mt-3 text-[11px] text-neutral-500">
            I valori saranno visualizzati quando la connessione OPC UA con Delta
            sarà attiva.
          </p>
        )}
      </Panel>
      <DeltaJobForm connected={machine.connected} onSubmit={onWriteJob} />
    </div>
  );
}
