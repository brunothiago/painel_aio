#!/usr/bin/env python3
"""
=============================================================================
GERAR TOKEN GMAIL — rodar UMA vez na instalação
=============================================================================

Abre o navegador para login em cgpac.mcid@gmail.com e salva as chaves
GMAIL_* no config.env. Depois disso, o aio_pipeline.py roda sozinho.

Pré-requisitos:
  - credentials.json nesta pasta (JSON OAuth do Google Cloud)
  - cgpac.mcid@gmail.com em "Usuários de teste" no Google Cloud
  - Gmail API ativada no projeto aio-pipeline-mcid

Uso:
  python3 gerar_token.py
=============================================================================
"""

import json
import re
import sys
from pathlib import Path

from google_auth_oauthlib.flow import InstalledAppFlow

# Escopo: somente leitura da caixa de email
SCOPES = ["https://www.googleapis.com/auth/gmail.readonly"]

_BASE = Path(__file__).resolve().parent
_CREDENTIALS_CANDIDATES = [
    _BASE / "credentials.json",
    Path.home() / ".config/aio_pipeline/credentials.json",
]


def _find_credentials() -> Path:
    """Localiza o arquivo credentials.json baixado do Google Cloud."""
    for path in _CREDENTIALS_CANDIDATES:
        if path.exists():
            return path
    print("[ERRO] credentials.json não encontrado.")
    print("  Coloque o JSON do Google Cloud em:")
    for p in _CREDENTIALS_CANDIDATES:
        print(f"    - {p}")
    sys.exit(1)


def _salvar_no_config_env(client_id: str, client_secret: str, refresh_token: str) -> None:
    """Grava GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET e GMAIL_REFRESH_TOKEN no config.env."""
    config_path = _BASE / "config.env"
    if not config_path.exists():
        print(f"[AVISO] {config_path} não existe; copie manualmente as linhas exibidas.")
        return

    texto = config_path.read_text(encoding="utf-8")
    for chave, valor in {
        "GMAIL_CLIENT_ID": client_id,
        "GMAIL_CLIENT_SECRET": client_secret,
        "GMAIL_REFRESH_TOKEN": refresh_token,
    }.items():
        padrao = re.compile(rf"^{re.escape(chave)}=.*$", re.MULTILINE)
        nova = f"{chave}={valor}"
        texto = padrao.sub(nova, texto) if padrao.search(texto) else texto.rstrip() + f"\n{nova}\n"

    config_path.write_text(texto, encoding="utf-8")
    print(f"[OK] {config_path} atualizado.")


def main():
    creds_path = _find_credentials()
    block = json.loads(creds_path.read_text(encoding="utf-8"))
    installed = block.get("installed") or block.get("web")
    project_id = installed.get("project_id", "?")

    print(f"credentials.json: {creds_path}")
    print(f"Projeto Google Cloud: {project_id}")
    print(f"\nConfirme cgpac.mcid@gmail.com em Usuários de teste:")
    print(f"  https://console.cloud.google.com/auth/audience?project={project_id}\n")
    print("Abrindo o navegador — login com cgpac.mcid@gmail.com\n")

    flow = InstalledAppFlow.from_client_secrets_file(str(creds_path), SCOPES)
    creds = flow.run_local_server(port=0, prompt="consent")

    if not creds.refresh_token:
        print("[ERRO] Sem refresh_token. Revogue o app em myaccount.google.com/permissions")
        sys.exit(1)

    client_id = installed["client_id"]
    client_secret = installed["client_secret"]

    print("\n" + "=" * 60)
    print(f"GMAIL_CLIENT_ID={client_id}")
    print(f"GMAIL_CLIENT_SECRET={client_secret}")
    print(f"GMAIL_REFRESH_TOKEN={creds.refresh_token}")
    print("=" * 60 + "\n")

    _salvar_no_config_env(client_id, client_secret, creds.refresh_token)
    print("Próximo passo: python3 aio_pipeline.py --dry-run --dias 7")


if __name__ == "__main__":
    main()
