# Pipeline AIO + Painel web

Fluxo integrado: **Gmail (GEPAC07)** → **PostgreSQL** → **CSV** → **dashboard** (GitHub Pages).

| Etapa | Ferramenta |
|-------|------------|
| 1. Ler emails | `aio_pipeline.py` |
| 2. Banco | `se_cgpac.aio_solicitacoes` |
| 3. CSV | `exportar_csv.py` ou `--export-csv` |
| 4. Site | pasta `dashboard/` → GitHub Pages |

**Manual para usuários:** [MANUAL.md](MANUAL.md)  
**Manual do dashboard:** [dashboard/README.md](dashboard/README.md)

## Estrutura

```
painel_aio/
├── aio_pipeline.py          # programa principal
├── exportar_csv.py          # banco → CSV
├── gerar_token.py           # setup Gmail (1x)
├── setup_tabela.py          # setup banco (1x)
├── rodar_fluxo_completo.sh  # executa tudo de uma vez
├── config.env
├── dashboard/               # site React (painel_aio no GitHub)
│   ├── public/aio_solicitacoes.csv
│   └── src/
└── .github/workflows/       # deploy GitHub Pages
```

## Comandos rápidos

```bash
source .venv/bin/activate

# Fluxo completo (7 dias + CSV + build)
./rodar_fluxo_completo.sh 7

# Ou passo a passo:
python3 aio_pipeline.py --dias 7 --atualizar --export-csv
python3 exportar_csv.py
cd dashboard && npm install && npm run dev
```

## Publicar no GitHub

1. Crie o repositório **painel_aio** no GitHub.
2. Rode localmente: `./rodar_fluxo_completo.sh 7`
3. Commit incluindo `dashboard/public/aio_solicitacoes.csv`
4. Push → GitHub Actions publica em `https://usuario.github.io/painel_aio/`
