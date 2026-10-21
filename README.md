# OCIMA Industrial Dashboard

The sidebar opens directly on **Rettificatrice cilindrica universale QGrind
U-600**. It contains a result page for each of the four machines and one
**Communication setup** page. IP/host, port, and refresh interval are saved
locally per machine; supported machine connections are controlled there.

## Source structure

- `backend/server.ts` starts the single local API on port `3000`.
  `backend/routes/` maps API requests to the machine drivers,
  `backend/paths/` defines route paths, and `backend/drivers/` contains
  protocol-specific communication. Machine connection state is held in
  memory; no database is used yet.
- `src/machines/{qgrind,delta,zeiss,mikron}/` keeps each machine's data types,
  configuration, hooks, and machine-specific UI together. The QGrind and Delta
  folders also own their protocol service modules.
- `src/machines/types.ts`, `useMachinePolling.ts`,
  `useMachineConfigurations.ts`, and `useMachineConnections.ts` are shared
  machine contracts and hooks, kept directly in `src/machines/` to avoid an
  extra shared subfolder.
- `src/machines/index.ts` combines each machine's configuration into the
  registry. `src/components/shared/` includes shared machine page components as
  well as common UI; `src/components/layout/` and `src/components/setup/` keep
  their focused groups.
- Styling uses Tailwind utilities and theme tokens in `src/index.css`; there is
  no app-specific stylesheet.

## Machine integrations

- **QGrind U-600** reads the configured MTConnect agent directly from the
  dashboard backend.
- **Delta MINI 15 DIASTEP** uses the OPC UA driver hosted by the dashboard
  backend and retains
  its machine results and MES job-parameter write form on its machine page.
- **Zeiss Contura** and **MIKRON VCE 1200 PRO** have no drivers or data-field
  mappings in the machine projects currently available. Communication setup
  identifies the missing driver; saving network settings does not enable live
  results or connection controls.

Machine result pages keep their defined fields visible while disconnected;
values remain blank until live readings arrive. QGrind groups live
observations into machine status, production, machine values, alarms/conditions,
and other observations, and shows the original response for troubleshooting.

## Run locally

Start the dashboard backend:

```powershell
Set-Location 'C:\.HOSSEIN\Automation\dev\I4.0.Dashboard'
npm run backend
```

For browser development, start Vite in another terminal with `npm run dev`;
the UI is at `http://127.0.0.1:5173` and proxies API requests to the dashboard
backend at `http://127.0.0.1:3000`.

`npm run desktop` builds and starts the dashboard backend and Vite, then opens
the UI in an Electron desktop window. The single backend listens on port 3000
and exposes these machine routes:

- Delta OPC UA: `POST /api/machines/delta/connect`, `/disconnect`, `/read`,
  and `/write`.
- QGrind MTConnect: `POST /api/machines/qgrind/agent` configures the agent;
  `GET /api/machines/qgrind/status` reads its current data.
For production, run `npm run build` then `npm run desktop:built`; the backend
serves the built UI and API from port 3000.

No database is configured; machine communication settings are held in memory
by the backend and reset when it restarts.

## Build and lint

```powershell
npm run build
npm run lint
```
