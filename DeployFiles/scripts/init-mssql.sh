#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
REPO_DIR="$(cd "${DEPLOY_DIR}/.." && pwd)"
ENV_FILE="${DEPLOY_DIR}/.env"
COMPOSE_FILE="${DEPLOY_DIR}/compose/mssql/docker-compose.yml"
SQL_FILE="${REPO_DIR}/back/JiuDiary.Api/DataBase/Scripts/create-database.sql"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Create ${ENV_FILE} from .env.example first."
  exit 1
fi

set -a
. "$ENV_FILE"
set +a

docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" exec -T mssql \
  /opt/mssql-tools18/bin/sqlcmd \
  -S localhost -U sa -P "$MSSQL_SA_PASSWORD" -C -b \
  -i /dev/stdin < "$SQL_FILE"

echo "Database JiuDiary initialized."
