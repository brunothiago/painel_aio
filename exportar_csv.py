#!/usr/bin/env python3
"""
=============================================================================
EXPORTAR CSV — lê se_cgpac.aio_solicitacoes e gera arquivo para o dashboard
=============================================================================

Uso:
    python3 exportar_csv.py
    python3 aio_pipeline.py --dias 7 --export-csv   # pipeline + CSV

O CSV vai para dashboard/public/aio_solicitacoes.csv (GitHub Pages).
=============================================================================
"""

import csv
import os
import re
import sys
from datetime import date, datetime
from decimal import Decimal
from pathlib import Path

import psycopg2
from dotenv import load_dotenv

_BASE = Path(__file__).resolve().parent
load_dotenv(_BASE / "config.env")

SCHEMA = os.getenv("DB_SCHEMA", "se_cgpac")
DEFAULT_CSV = _BASE / "dashboard" / "public" / "aio_solicitacoes.csv"

# Colunas exportadas (snake_case = mesmo nome do banco / mapeador.js)
COLUNAS = (
    "id",
    "instrumento",
    "tc",
    "recebedor",
    "municipio_beneficiado",
    "municipio",
    "uf",
    "data_assinatura",
    "data_retirada_suspensiva",
    "data_vigencia",
    "valor_investimento",
    "valor_repasse",
    "objeto",
    "programa_codigo",
    "programa_descricao",
    "programa",
    "acao_orcamentaria",
    "email_remetente",
    "email_assunto",
    "data_aio_recebido",
    "email_id",
    "criado_em",
)


def _fmt(val):
    if val is None:
        return ""
    if isinstance(val, datetime):
        return val.strftime("%Y-%m-%d %H:%M:%S%z") if val.tzinfo else val.isoformat(sep=" ", timespec="seconds")
    if isinstance(val, date):
        return val.isoformat()
    if isinstance(val, Decimal):
        return str(val)
    return val


def exportar_csv(destino: Path | None = None) -> Path:
    destino = Path(destino or os.getenv("DASHBOARD_CSV_PATH", DEFAULT_CSV))
    if not re.fullmatch(r"[A-Za-z_][A-Za-z0-9_]*$", SCHEMA):
        raise ValueError(f"DB_SCHEMA inválido: {SCHEMA}")

    conn = psycopg2.connect(
        host=os.getenv("DB_HOST"),
        port=int(os.getenv("DB_PORT", 5432)),
        dbname=os.getenv("DB_NAME"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        connect_timeout=10,
    )
    try:
        sql = f"""
            SELECT {", ".join(COLUNAS)}
            FROM {SCHEMA}.aio_solicitacoes
            ORDER BY data_aio_recebido DESC NULLS LAST, id DESC
        """
        with conn.cursor() as cur:
            cur.execute(sql)
            rows = cur.fetchall()

        destino.parent.mkdir(parents=True, exist_ok=True)
        with destino.open("w", newline="", encoding="utf-8") as f:
            w = csv.writer(f)
            w.writerow(COLUNAS)
            for row in rows:
                w.writerow([_fmt(v) for v in row])

        print(f"[OK] {len(rows)} linhas → {destino}")
        return destino
    finally:
        conn.close()


def main():
    for var in ("DB_HOST", "DB_NAME", "DB_USER", "DB_PASSWORD"):
        if not os.getenv(var):
            print(f"[ERRO] Preencha {var} no config.env")
            sys.exit(1)
    try:
        exportar_csv()
    except Exception as e:
        print(f"[ERRO] {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
