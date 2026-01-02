#!/usr/bin/env bash
# Iterate over each .cat file in bloodbowl-third-season and run the team converter.
# Usage:
#   ./scripts/updateDataSources/batch_convert_all_teams.sh
# Notes:
# - Can be executed from any directory; paths are resolved relative to this script.
# - Requires Node.js and project dependencies installed.

set -euo pipefail
IFS=$'\n\t'

# Resolve repo root based on this script's location
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"
CATS_DIR="${ROOT_DIR}/scripts/updateDataSources/bloodbowl-third-season"
CONVERTER="${ROOT_DIR}/scripts/updateDataSources/convert_team_bs_to_ff_json.js"

if [[ ! -f "${CONVERTER}" ]]; then
  echo "Converter not found: ${CONVERTER}" >&2
  exit 1
fi

if [[ ! -d "${CATS_DIR}" ]]; then
  echo "Directory not found: ${CATS_DIR}" >&2
  echo "Did you clone BSData/bloodbowl-third-season into scripts/updateDataSources?" >&2
  exit 1
fi

CAT_FILES=()
while IFS= read -r -d '' file; do
  CAT_FILES+=("$file")
done < <(find "${CATS_DIR}" -maxdepth 1 -type f -name '*.cat' -print0)

if [[ ${#CAT_FILES[@]} -eq 0 ]]; then
  echo "No .cat files found in ${CATS_DIR}" >&2
  exit 1
fi

FAILED=()

echo "Found ${#CAT_FILES[@]} .cat file(s). Starting conversion..."
for cat in "${CAT_FILES[@]}"; do
  printf "\n=== Converting: %s ===\n" "${cat}"
  if node "${CONVERTER}" "${cat}"; then
    echo "✔ Successfully converted: ${cat}"
  else
    echo "✖ Failed to convert: ${cat}" >&2
    FAILED+=("${cat}")
  fi
done

printf "\nAll conversions attempted.\n"
if [[ ${#FAILED[@]} -gt 0 ]]; then
  echo "The following conversions failed (${#FAILED[@]}):" >&2
  for f in "${FAILED[@]}"; do
    echo "  - ${f}" >&2
  done
  exit 1
else
  echo "All conversions completed successfully."
fi
