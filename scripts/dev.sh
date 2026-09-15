#!/usr/bin/env bash
set -uo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."

# AGS has no built-in watch mode (`ags run --help` doesn't offer one), and
# no watch tool (entr/watchexec/inotifywait) is installed. Rather than pull
# in a system package, poll source file mtimes once a second and restart
# `ags run` when anything changes -- crude, but plenty for a personal bar.

pid=""

# The bar is non-exclusive in dev mode (see AGS_DEV below), so it no longer
# reserves its own screen space -- push the top gap out by the bar's height
# for the duration of the dev session so windows don't sit under it. This is
# set once here, not per-restart; AGS_DEV already keeps individual restarts
# from disturbing the layout.
BAR_HEIGHT=34
GAP=30
POLL_INTERVAL="1s"

push_layout_down() {
  hyprctl eval "hl.config({ general = { gaps_out = { top = $((GAP + BAR_HEIGHT)), right = $GAP, bottom = $GAP, left = $GAP } } })" \
    >/dev/null 2>&1
}

restore_layout() {
  hyprctl reload >/dev/null 2>&1
}

start() {
  # AGS_DEV: see widget/Bar.tsx -- makes the bar non-exclusive in dev mode
  # so restarts don't reserve/release screen space and shove other windows
  # around every time.
  AGS_DEV=1 ags run app.ts --gtk 4 &
  pid=$!
}

stop() {
  # `ags run` forks gjs rather than exec-ing into it, so killing $pid only
  # kills the wrapper -- the gjs process (and its "ags" IPC instance name)
  # lingers and collides with the next `ags run`. Ask it to quit over IPC
  # instead, then wait for the wrapper to actually exit.
  ags quit >/dev/null 2>&1 || true
  if [[ -n "$pid" ]]; then
    wait "$pid" 2>/dev/null
  fi
  pid=""
}

cleanup() {
  echo
  echo "[dev] stopping..."
  stop
  restore_layout
  exit 0
}
trap cleanup INT TERM

checksum() {
  find . \
    -path ./node_modules -prune -o \
    -path ./.git -prune -o \
    -path ./@girs -prune -o \
    \( -name "*.ts" -o -name "*.tsx" \) -print0 |
    sort -z |
    xargs -0 stat -c '%Y %n' 2>/dev/null |
    md5sum
}

echo "[dev] watching for changes (poll every $POLL_INTERVAL)..."
push_layout_down
start
prev=$(checksum)

while true; do
  sleep "$POLL_INTERVAL"
  current=$(checksum)
  if [[ "$current" != "$prev" ]]; then
    echo "[dev] change detected, restarting..."
    stop
    start
    prev=$(checksum)
  fi
done
