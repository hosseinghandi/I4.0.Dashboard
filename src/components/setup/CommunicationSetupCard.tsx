import { useState, type FormEvent } from "react";
import type { MachineDefinition } from "../../machines/types";
import type {
  MachineConfiguration,
  MachineData,
} from "../../machines/types";
import { ErrorBanner } from "../shared/ErrorBanner";
import { StatusBadge } from "../shared/StatusBadge";

export function CommunicationSetupCard({
  machine,
  configuration,
  state,
  onSave,
  onConnect,
  onDisconnect,
}: {
  machine: MachineDefinition;
  configuration: MachineConfiguration;
  state: MachineData<object>;
  onSave: (configuration: MachineConfiguration) => void;
  onConnect: () => void;
  onDisconnect: () => void;
}) {
  const [draft, setDraft] = useState(configuration);

  const save = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSave(draft);
  };

  return (
    <article className="rounded-[11px] border border-brand-border bg-white p-4 shadow-sm sm:p-[17px]">
      <div className="flex min-h-[68px] items-start justify-between gap-2.5">
        <div className="min-w-0">
          <p className="mb-1 font-mono text-[10px] text-brand-primary">
            {machine.serial}
          </p>
          <h2 className="m-0 max-w-[330px] text-[15px] font-bold leading-snug text-brand-ink">
            {machine.name}
          </h2>
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-bold ${machine.supportsConnection ? "bg-brand-green-50 text-brand-green-800" : "bg-neutral-100 text-neutral-600"}`}
        >
          {machine.protocol}
        </span>
      </div>
      <form onSubmit={save}>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-[minmax(0,1fr)_78px_168px]">
          <label className="col-span-2 grid min-w-0 gap-1.5 sm:col-span-1">
            <span className="text-[10px] font-semibold text-neutral-600">
              Indirizzo IP / host
            </span>
            <input
              className="h-[35px] min-w-0 rounded-md border border-brand-border bg-neutral-50 px-2 text-[11px] text-brand-ink focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-green-100 disabled:bg-neutral-100"
              value={draft.host}
              disabled={state.connected}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  host: event.target.value,
                }))
              }
              placeholder="es. 192.168.1.50"
            />
          </label>
          <label className="grid min-w-0 gap-1.5">
            <span className="text-[10px] font-semibold text-neutral-600">
              Porta
            </span>
            <input
              className="h-[35px] min-w-0 rounded-md border border-brand-border bg-neutral-50 px-2 text-[11px] text-brand-ink focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-green-100 disabled:bg-neutral-100"
              type="number"
              min="1"
              max="65535"
              value={draft.port}
              disabled={state.connected}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  port: event.target.value,
                }))
              }
              placeholder="Porta"
            />
          </label>
          <label className="col-span-2 grid min-w-0 gap-1.5 sm:col-span-1">
            <span className="whitespace-nowrap text-[10px] font-semibold text-neutral-600">
              Intervallo di aggiornamento
            </span>
            <select
              className="h-[35px] min-w-0 rounded-md border border-brand-border bg-neutral-50 px-2 text-[11px] text-brand-ink focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-green-100 disabled:bg-neutral-100"
              value={draft.pollIntervalMs}
              disabled={state.connected}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  pollIntervalMs: Number(event.target.value),
                }))
              }
            >
              <option value={1000}>1 secondo</option>
              <option value={2000}>2 secondi</option>
              <option value={5000}>5 secondi</option>
              <option value={10000}>10 secondi</option>
            </select>
          </label>
        </div>
        <div className="mt-3 flex min-h-[34px] items-center gap-2">
          <button
            type="submit"
            className="rounded-md border border-brand-border bg-white px-3 py-2 text-[11px] font-semibold text-neutral-700 hover:bg-neutral-50"
          >
            Salva impostazioni
          </button>
          {machine.supportsConnection && (
            <button
              type="button"
              disabled={state.connecting}
              onClick={state.connected ? onDisconnect : onConnect}
              className={`ml-auto rounded-md px-3 py-2 text-[11px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-55 ${state.connected ? "bg-neutral-700 hover:bg-neutral-800" : "bg-brand-primary hover:bg-brand-primary-hover"}`}
            >
              {state.connecting
                ? state.connected
                  ? "Disconnessione…"
                  : "Connessione…"
                : state.connected
                  ? "Disconnetti"
                  : "Connetti"}
            </button>
          )}
          {state.connected && <StatusBadge connected />}
        </div>
      </form>
      {state.error && <ErrorBanner message={state.error} />}
    </article>
  );
}
