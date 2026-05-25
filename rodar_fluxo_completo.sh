#!/bin/bash
# Fluxo completo: Gmail → banco → CSV → build do site (GitHub Pages)
set -e
cd "$(dirname "$0")"
source .venv/bin/activate

DIAS="${1:-7}"
echo "=== 1/3 Pipeline Gmail → PostgreSQL ==="
python3 aio_pipeline.py --dias "$DIAS" --atualizar --export-csv

echo ""
echo "=== 2/3 CSV em dashboard/public/aio_solicitacoes.csv ==="
ls -la dashboard/public/aio_solicitacoes.csv

echo ""
echo "=== 3/3 Build do dashboard ==="
cd dashboard
npm install
npm run build
echo ""
echo "Pronto. Para publicar: git add dashboard/public/aio_solicitacoes.csv && git push"
echo "Site local: cd dashboard && npm run preview"
