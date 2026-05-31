# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — start the Vite dev server (default http://localhost:5173)
- `npm run build` — production build to `dist/`
- `npm run preview` — serve the production build locally

The Cloudflare Worker lives in `worker/` and is operated with `wrangler` (`wrangler dev` to run locally on :8787, `wrangler deploy` to publish, `wrangler secret put <NAME>` to set secrets). There is no test runner, linter, or formatter configured.

## Architecture

Personal-finance SPA (Vite + React 19, Tailwind v3). **User financial data lives entirely in the browser** (`localStorage`) — no router, no auth, no data backend. The only server-side piece is a thin **Cloudflare Worker that proxies external APIs to hide their keys**.

```
Browser (React)  ──►  Cloudflare Worker (worker/)  ──►  Gemini API   POST /analyze
  localStorage           secrets live here          └─►  brapi.dev    GET  /quote
```

**State flows through a single React context.** `src/context/FinanceContext.jsx` is the only source of truth: it holds `transactions` and `investments`, derives `totals` (receitas/despesas/saldo) with `useMemo`, and exposes `addTransaction`/`removeTransaction`/`addInvestment`/`removeInvestment`/`clearAll`. Every component reads/writes via the `useFinance()` hook. Add new derived values here rather than recomputing across components. **Live market data (quotes) is deliberately NOT in the context** — it is fetched in the `useQuotes` hook and never persisted.

**Persistence is automatic via localStorage**, one `useEffect` per slice: `smd:transactions:v1` and `smd:investments:v1`. Changing a stored shape requires bumping the `:v1` suffix to avoid loading incompatible old data.

**A transaction** is `{ id, createdAt, type, description, amount, category, date }`. **An investment** is `{ id, createdAt, ticker, quantity, avgPrice }` (`ticker` is uppercased on add). `type` is the literal `'receita'` or `'despesa'` (used directly in comparisons — not enums). `amount`/`avgPrice` are positive numbers; direction comes from `type`, not the sign.

**Categories are modularized in `src/config/categories.js`** (moved out of `utils.js`, which now re-exports them for back-compat). Each category has `id`, `label`, `groupId`, `type`, `color`, `icon` (a lucide icon name). They are organized into `CATEGORY_GROUPS`; helpers `categoryById`, `categoriesByType`, `groupsByType`, and `categoriesGroupedByType` drive the grouped `<optgroup>` select, chart colors, and label lookups. Add or change categories only here.

### External integrations (always via the Worker)
- `src/services/brapi.js` → `GET ${VITE_WORKER_URL}/quote?tickers=...`, returns `ticker → { price, changePercent, currency, shortName }`. Consumed by `src/hooks/useQuotes.js`, which polls (default 60s, `intervalMs: 0` disables) and exposes `{ quotes, loading, error, refresh }`.
- `src/services/ai.js` → builds the pt-BR analysis prompt from totals/transactions/investments/quotes and `POST`s `{ prompt }` to `${VITE_WORKER_URL}/analyze`, returning `{ analysis }` (markdown). Rendered by `AIAnalysis.jsx` with `react-markdown` + the `prose` typography plugin.
- **`worker/index.js`** has two routes, replicated from the user's other Gemini proxies (`../dkcell/worker`) **minus the Firebase auth**: `pickModel()` auto-selects the best available Gemini model. Keys are Worker secrets `GEMINI_API_KEY` and `BRAPI_TOKEN`; the front only knows `VITE_WORKER_URL` (in `.env.local`). **Never put API keys in the front-end bundle.**

**Components** (`src/components/`) are presentational; local state only in the form components. `App.jsx` is the shell with state-based tab navigation (Painel · Lançamentos · Investimentos · Análise IA) — there is no router.

## Conventions

- UI text and category labels are in **Brazilian Portuguese**; keep new user-facing strings in pt-BR.
- Money is formatted with `formatBRL` and percentages with `formatPercent` (`src/utils.js`) — don't hand-format.
- Styling is Tailwind utility classes inline. The custom `money-*` green scale (`tailwind.config.js`) is for brand/positive accents; `red-*` for despesas/losses; amber for volatility alerts. Brand/headings use the `font-display` (Fraunces) family; body uses Inter.
