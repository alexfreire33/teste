#!/bin/bash

set -e

BACKUP_FILE="/docker-entrypoint-initdb.d/backup.sql"
MAX_RETRIES=30
RETRY_INTERVAL=2

echo "📦 Verificando se o backup existe..."
if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Nenhum backup encontrado para restaurar"
    exit 0
fi

echo "⏳ Aguardando PostgreSQL ficar disponível..."
for ((i=1;i<=MAX_RETRIES;i++)); do
    if pg_isready -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" > /dev/null; then
        echo "✅ PostgreSQL está disponível. Restaurando backup..."

        # Restaurar via psql
        PGPASSWORD=$PGPASSWORD psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -f "$BACKUP_FILE"

        echo "✅ Backup restaurado com sucesso!"
        exit 0
    fi

    echo "🔁 Tentativa $i de $MAX_RETRIES: PostgreSQL não está pronto, aguardando..."
    sleep $RETRY_INTERVAL
done

echo "❌ Timeout: PostgreSQL não ficou disponível após $MAX_RETRIES tentativas"
exit 1
