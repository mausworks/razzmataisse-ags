#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."

ags run scripts/gtk-typegen.ts --gtk 4
bunx prettier --write src/lib/gtk/*.d.ts
