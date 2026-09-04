# StockFlow Copilot Host

This read-only FastAPI service connects the StockFlow web chatbot to the
authorised StockFlow MCP servers. Answers are grounded in live tenant-scoped
Core API data and no inventory action is executed from chat.

1. From the repository root, run `RUN_ALL_WINDOWS.cmd`; it starts the Core API,
   Data MCP, Intelligence MCP, Copilot host, and Angular application in the
   required order.
2. Open `http://localhost:4200`; Angular proxies `/api/v1/copilot` requests to
   `127.0.0.1:8300`.

For isolated debugging, start the Core API, Data MCP and Intelligence MCP
first, then run `run-copilot-windows.cmd` from the repository root.

Common inventory, risk, forecast, route and approval questions are resolved by
the deterministic StockFlow domain router and do not require an external AI
key. For questions expressed in other wording, set `GEMINI_API_KEY` in the
repository-root `.env` file and restart the stack. Gemini then receives the
connected, allow-listed MCP tool catalogue, selects one or more read-only
tools, and writes an answer from their live results. The Copilot host injects
the authenticated tenant and access token after tool selection; credentials
are never exposed to the model. Proposal creation, submission, approval and
rejection tools are excluded from autonomous tool calling. Never put this key
in Angular configuration or a `VITE_` variable.

Keep `STOCKFLOW_ENABLE_ACTIONS=false` during development. In production, set
`AUTH_DISABLED_FOR_LOCAL=false`, configure Supabase JWT verification, and expose
the Copilot Host through an authenticated reverse proxy or service URL.
