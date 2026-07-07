# wynbench-ui

Browser-based frontend for Wynbench. Built with React + Vite. Provides connection management, action builders, workflow tools, and result visualisation.

## Getting started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start the development server:

   ```bash
   npm run dev
   ```

3. Open the local URL printed by Vite.

## Connecting to the Wynbench agent

The UI talks to the Wynbench agent over HTTP.

- `VITE_WYNBENCH_AGENT_HTTP_URL` defaults to `http://localhost:8080`

Create a `.env` file if your agent is hosted elsewhere:

```bash
VITE_WYNBENCH_AGENT_HTTP_URL=http://localhost:8080
```

## Available pages

- **Connections** — create, inspect, and delete saved connection targets
- **Actions** — build a protocol action payload and execute it
- **Workflows** — compose multi-step workflows with editable JSON payloads
- **Results** — review responses, logs, and errors

## Scripts

- `npm run dev` — start the Vite dev server
- `npm run build` — type-check and produce a production build
- `npm run lint` — run Oxlint
