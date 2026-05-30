# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this project does

Pipeline that ingests AIO (Autorização de Início de Execução) emails from Gmail (GEPAC07 system) into PostgreSQL, exports to CSV, and serves a React dashboard on GitHub Pages. The emails are forwarded from the GEPAC07 system to a Gmail account; the pipeline reads the forwarded body to extract structured fields.

## Commands

### Python pipeline (activate venv first)
```bash
source .venv/bin/activate

# One-time setup
python3 setup_tabela.py          # create DB table (requires schema se_cgpac to exist)
python3 gerar_token.py           # generate Gmail OAuth refresh token

# Daily use
python3 aio_pipeline.py --dias 7 --atualizar --export-csv   # full run
python3 aio_pipeline.py --dry-run                            # inspect without writing
python3 exportar_csv.py                                      # DB → CSV only

# Full flow (Gmail → DB → CSV → build)
./rodar_fluxo_completo.sh 7
```

### Dashboard (React/Vite)
```bash
cd dashboard
npm install
npm run dev      # dev server
npm run build    # production build → dist/
npm run preview  # preview production build
```

### Publish to GitHub Pages
```bash
# The GitHub Actions workflow deploys docs/ automatically on push to main.
# To publish manually:
./publicar_painel_manual.sh
# Or: build → copy dist/ to docs/ → commit including docs/ and dashboard/public/aio_solicitacoes.csv → push
```

## Architecture

### Data flow
```
Gmail (GEPAC07 emails) → aio_pipeline.py → PostgreSQL (se_cgpac.aio_solicitacoes)
                                          → exportar_csv.py → dashboard/public/aio_solicitacoes.csv
                                                            → React dashboard (GitHub Pages)
```

### Python backend (`/`)
- **`aio_pipeline.py`** — main pipeline: Gmail OAuth → message fetch → body parsing → DB insert. Uses `GEPAC07` detection and regex patterns (`_PATTERNS`) to extract fields like `instrumento`, `tc`, `municipio_beneficiado`, `programa`, etc. Deduplicates via `email_id` (Gmail message ID). `--atualizar` switches `ON CONFLICT DO NOTHING` to `DO UPDATE`.
- **`exportar_csv.py`** — reads all rows from `se_cgpac.aio_solicitacoes` ordered by `data_aio_recebido DESC` and writes `dashboard/public/aio_solicitacoes.csv`.
- **`setup_tabela.py`** — DDL for `aio_solicitacoes` table + indexes. Run once.
- **`gerar_token.py`** — OAuth flow that writes `GMAIL_REFRESH_TOKEN` to `config.env`.
- **`config.env`** — secrets file (DB credentials + Gmail OAuth tokens). Never committed; see `config.env.example`.

### React dashboard (`dashboard/src/`)
- **`App.jsx`** — entry point. Fetches CSV from two sources (local site + GitHub raw) and uses whichever has more rows. Falls back to `dados-exemplo.js` if both fail.
- **`mapeador.js`** — converts raw CSV rows (snake_case column names matching the DB schema) to the camelCase shape consumed by `DashboardAIO`. Key mapping: `valor_investimento` → `valorInvest`, `data_aio_recebido` → `dataAIO`, `programa_descricao` → `programaCurto`, etc.
- **`DashboardAIO.jsx`** — single self-contained dashboard component. Accepts `dados` (mapped rows) and `linhasBrutas` (raw CSV rows for Excel export). Contains KPI cards, PieChart (by program), BarChart (by UF), expandable TC cards, and a paginated sortable table with per-column filters.
- **`FiltrosGerais.jsx`** — collapsible global filter bar (program + week-of-year). Filters apply to the entire panel before local table filters.
- **`filtros-tempo.js`** — week key logic (`semanaAioKey`) used by global week filter.
- **`ExportarExcel.jsx`** + **`gerarExcel.js`** — Excel export via the `xlsx` library, using `linhasBrutas` (raw CSV) to preserve all DB columns.
- **`dados-exemplo.js`** — static example data shown when CSV fails to load.

### Deployment
- `docs/` — the production build served by GitHub Pages (`.nojekyll` included). GitHub Actions workflow in `.github/workflows/` rebuilds on push to `main`.
- `dashboard/dist/` — local build output (not committed).

## Key conventions

- **Column names are the contract.** The CSV column names from `exportar_csv.py` (`COLUNAS` tuple) must match `mapeador.js` field references. Adding a DB column requires updating both files.
- **`email_id`** (Gmail message ID) is the unique key — used as `ON CONFLICT` target. Prevents duplicate inserts from re-running the pipeline.
- **GEPAC07 body parsing:** The pipeline reads forwarded emails where the original GEPAC07 metadata (From, Date, Subject) is embedded in the email body, not in the Gmail headers. `extract_gepac_metadata_from_body()` handles this; `extract_aio_fields()` uses `_PATTERNS` regexes to extract structured fields.
- **`programa` split:** The `programa` field from GEPAC07 is `"<codigo> - <descricao>"`. `_parse_programa()` splits into `programa_codigo` + `programa_descricao`. The dashboard uses `programa_descricao` (via `rotuloPrograma()` in `mapeador.js`) as the display label.
- **Security:** `config.env`, `credentials.json`, `token.pickle` are gitignored. The CSV (`dashboard/public/aio_solicitacoes.csv`) contains operational data and **is** committed/public. Always run `git status` before pushing to confirm secrets are not staged.
- **VPN:** DB connection requires VPN if `DB_HOST` is on an internal network. Run the pipeline before disconnecting.
- **Logs:** Written to `~/logs/aio_pipeline.log`.
