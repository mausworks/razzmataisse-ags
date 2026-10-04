#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."

# `ags`/`gnim`'s own symlinked-in runtime and @girs's generated GObject
# bindings aren't code this project owns, and reliably produce noise tsc
# can't be configured away from entirely (they're reached through real
# imports, not just swept in by a broad "include", so skipLibCheck alone
# doesn't cover the non-.d.ts ones) -- a type error only means something
# here if it points at this project's own src/ or scripts/ files.
#
# --pretty false: tsc's default colorized output prefixes each filename
# with an ANSI escape code, which silently breaks a `^src/`-anchored
# grep -- plain output keeps paths at the actual start of the line.
output=$(bunx tsc --noEmit --pretty false 2>&1) || true

if echo "$output" | grep -qE '^(src|scripts)/'; then
  echo "$output"
  echo "error: type errors found in this project's own code" >&2
  exit 1
fi
