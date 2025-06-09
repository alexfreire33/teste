#!/bin/bash
set -e

echo "Restaurando backup customizado com comandos adicionais..."

export PGPASSWORD="$POSTGRES_PASSWORD"

psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" <<EOF
SET work_mem TO '256MB';
ALTER TABLE inside.users_surveys_responses_aux DISABLE TRIGGER ALL;
\i /docker-entrypoint-initdb.d/backup.sql
ALTER TABLE inside.users_surveys_responses_aux ENABLE TRIGGER ALL;
EOF

echo "Backup restaurado com sucesso."
