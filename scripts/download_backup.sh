#!/bin/bash

FILE_ID="1VKNKnwxnkqNNdc0xYSYAzt6GqGJn3T9a"
BACKUP_DIR="/docker-entrypoint-initdb.d"
BACKUP_FILE="$BACKUP_DIR/backup.sql"

echo "🔍 Verificando se o backup já existe..."
if [ ! -f "$BACKUP_FILE" ]; then
    echo "⬇️ Baixando backup do Google Drive com gdown..."

    # Instala Python e gdown se necessário
    if ! command -v gdown &> /dev/null; then
        apt-get update && apt-get install -y python3 python3-pip
        pip3 install --break-system-packages gdown
    fi

    gdown --id "$FILE_ID" -O "$BACKUP_FILE"

    if [ $? -eq 0 ]; then
        echo "✅ Backup baixado com sucesso!"
    else
        echo "❌ Falha ao baixar o backup"
        exit 1
    fi
else
    echo "📦 Backup já existe, pulando download."
fi
