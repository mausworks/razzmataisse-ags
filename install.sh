#!/bin/sh
# Installs razzmataisse-ags and verifies it's in a working state.
#
# Run locally from inside an existing checkout:
#   ./install.sh
#
# Or piped straight into a shell, with no checkout on disk yet:
#   curl -fsSL https://raw.githubusercontent.com/mausworks/razzmataisse-ags/main/install.sh | sh
# which clones the repo into ~/.config/razzmataisse-ags (where AGS expects
# it) and re-runs this same script from there.
set -eu

REPO_SSH="git@github.com:mausworks/razzmataisse-ags.git"
REPO_HTTPS="https://github.com/mausworks/razzmataisse-ags.git"
INSTALL_DIR="$HOME/.config/razzmataisse-ags"

# A few cheap, good-enough checks for "already inside a checkout of this
# repo" -- deliberately not trying to resolve $0 to a real path, since
# piped into `sh` (no file on disk at all) it won't point anywhere useful.
in_repo_checkout() {
  git rev-parse --is-inside-work-tree >/dev/null 2>&1 || return 1
  [ "$(git rev-parse --show-toplevel)" = "$(pwd)" ] || return 1
  [ -f package.json ] && grep -q '"ags"' package.json
}

if ! in_repo_checkout; then
  echo "[install] not inside a razzmataisse-ags checkout -- setting one up at $INSTALL_DIR"

  if [ -d "$INSTALL_DIR/.git" ]; then
    echo "[install] $INSTALL_DIR already exists, pulling latest instead of cloning"
    git -C "$INSTALL_DIR" pull --ff-only
  else
    git clone "$REPO_SSH" "$INSTALL_DIR" 2>/dev/null ||
      git clone "$REPO_HTTPS" "$INSTALL_DIR"
  fi

  # `exec` replaces the process image, not the working directory -- without
  # this `cd`, the re-exec'd script below would still see `pwd` as wherever
  # it was originally invoked from (e.g. `~`), fail `in_repo_checkout` again
  # the exact same way, and loop here forever instead of ever progressing
  # past this branch.
  cd "$INSTALL_DIR"
  exec sh "$INSTALL_DIR/install.sh"
fi

echo "[install] installing dependencies..."
bun install

link_ags_runtime() {
  # `ags`/`gnim` are declared as optionalDependencies, not regular ones --
  # the real AGS CLI was never published to npm under the name "ags" (that
  # name belongs to an unrelated, long-dead 2014 package, so it can never
  # resolve there), and `gnim` deliberately isn't fetched from npm either:
  # it needs to be the *exact* copy bundled with the installed `ags` CLI,
  # not an independently-versioned one, or dev-time types could drift from
  # what actually runs. `optionalDependencies` just keeps a failed/skipped
  # resolution from aborting the rest of `bun install` -- the actual
  # linking happens here, every run, so it's correct regardless of what
  # bun did (or didn't) do with them.
  command -v ags >/dev/null 2>&1 || {
    echo "[install] 'ags' not found on \$PATH -- install AGS first (see README)" >&2
    exit 1
  }

  ags_bin=$(command -v ags)
  # Binary-relative, not a hard-coded /usr -- holds for /usr, /usr/local,
  # a user prefix, etc.
  prefix=$(dirname "$(dirname "$(readlink -f "$ags_bin")")")
  ags_js_dir="$prefix/share/ags/js"

  if [ ! -d "$ags_js_dir/node_modules/gnim" ]; then
    echo "[install] expected AGS's JS runtime at $ags_js_dir, but it's missing" >&2
    exit 1
  fi

  mkdir -p node_modules
  # `ln -sfn` only replaces an existing *symlink* at the target path -- if
  # bun actually resolved `gnim` from npm (it can; `ags` never can, see
  # above), node_modules/gnim is a real directory there, and `-n` makes ln
  # create the link *inside* it instead of replacing it. Clear a real
  # directory first so this is correct either way.
  for name in ags gnim; do
    [ -d "node_modules/$name" ] && [ ! -L "node_modules/$name" ] &&
      rm -rf "node_modules/$name"
  done
  ln -sfn "$ags_js_dir" node_modules/ags
  ln -sfn "$ags_js_dir/node_modules/gnim" node_modules/gnim
}

echo "[install] linking the AGS/gnim runtime..."
link_ags_runtime

echo "[install] generating GTK/Astal type declarations..."
bun run gtk:typegen

echo "[install] linting..."
bun run lint

echo "[install] type-checking..."
bunx tsc --noEmit

cat <<EOF

[install] done -- razzmataisse-ags is ready to go.

Try it out:
  bun run dev                  # live-reloading dev session
  ags run src/app.ts --gtk 4   # run it once, the way Hyprland would

Or wire it into Hyprland permanently, in your Hyprland config:
  exec-once = ags run $(pwd)/src/app.ts --gtk 4
EOF
