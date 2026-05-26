#!/bin/bash
# Publica o painel: build → pasta docs/ → push (GitHub Pages lê docs/ na main).
set -e
cd "$(dirname "$0")"

echo "=== 1/4 Exportar CSV (se config.env existir) ==="
if [ -f config.env ]; then
  source .venv/bin/activate 2>/dev/null || true
  python3 exportar_csv.py || echo "(export ignorado — sem banco)"
else
  echo "(sem config.env — usa CSV já existente)"
fi

echo ""
echo "=== 2/4 Build do dashboard ==="
cd dashboard
npm install
npm run build
cd ..

echo ""
echo "=== 3/4 Copiar build para docs/ ==="
rm -rf docs
cp -r dashboard/dist docs
touch docs/.nojekyll
LINHAS=$(($(wc -l < docs/aio_solicitacoes.csv) - 1))
echo "Registros no CSV publicado: $LINHAS"

echo ""
echo "=== 4/4 Commit e push (ative Pages: branch main, pasta /docs) ==="
git add docs/
git status -sb docs/

if git diff --cached --quiet; then
  echo "Nada novo em docs/ para commitar."
else
  git commit -m "Publica painel em docs/ (${LINHAS} AIOs)"
fi

git push origin main

gh api -X POST repos/brunothiago/painel_aio/pages/builds 2>/dev/null || true

echo ""
echo "Pronto. Em 2–5 min: https://brunothiago.github.io/painel_aio/"
echo "O painel também busca o CSV atualizado direto do GitHub se o site estiver em cache."
