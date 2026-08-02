#!/usr/bin/env bash

set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root"

current_branch="$(git branch --show-current)"

if [[ "$current_branch" != "develop" ]]; then
  echo "Dev deployment stopped: switch to the develop branch first."
  exit 1
fi

if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "Dev deployment stopped: commit tracked changes first."
  exit 1
fi

dev_api_name="w8wot-trail-companion-api-dev"
dev_api_url="https://${dev_api_name}.azurewebsites.net/api"
dev_resource_group="trail-companion-dev-rg"
dev_web_account="w8wotcompanionwebdev"

npm run lint

VITE_API_URL="$dev_api_url" \
VITE_BASE_PATH="/" \
VITE_RELEASE_CHANNEL="development" \
  npm run build

(
  cd api
  npm test
  func azure functionapp publish "$dev_api_name"
)

export AZURE_STORAGE_CONNECTION_STRING
AZURE_STORAGE_CONNECTION_STRING="$(
  az storage account show-connection-string \
    --name "$dev_web_account" \
    --resource-group "$dev_resource_group" \
    --query connectionString \
    --output tsv
)"

az storage blob upload-batch \
  --source dist \
  --destination '$web' \
  --overwrite true \
  --output none

unset AZURE_STORAGE_CONNECTION_STRING

dev_url="$(
  az storage account show \
    --name "$dev_web_account" \
    --resource-group "$dev_resource_group" \
    --query primaryEndpoints.web \
    --output tsv
)"

printf '\nDev deployment completed successfully.\n%s\n' "$dev_url"
