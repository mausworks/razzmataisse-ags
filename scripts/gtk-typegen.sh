#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."

ags run scripts/gtk-typegen.ts --gtk 4
npx prettier --write lib/gtk/*.d.ts
