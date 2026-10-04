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

  ags_js_dir=""

  # XDG_DATA_DIRS is the actual standards-based mechanism for "where did my
  # package manager put this app's shared data files" -- distro-agnostic,
  # and what a non-FHS layout (NixOS's /nix/store profiles, for instance)
  # populates correctly where a bin-to-share path assumption wouldn't hold.
  # Tried first, since it's the more trustworthy signal of the two.
  old_ifs=$IFS
  IFS=:
  for dir in ${XDG_DATA_DIRS:-/usr/local/share:/usr/share}; do
    candidate="$dir/ags/js"
    if [ -d "$candidate/node_modules/gnim" ]; then
      ags_js_dir="$candidate"
      break
    fi
  done
  IFS=$old_ifs

  # Falls back to walking up from the `ags` binary itself (<prefix>/bin/ags
  # -> <prefix>/share/ags/js) only if that didn't find it -- a reasonable
  # guess on an FHS-layout distro, but still just a guess, so every step is
  # checked rather than trusted blindly (an empty/failed `readlink -f`
  # degrading straight to `dirname`'s own "no directory" fallback -- "." --
  # being passed through uncaught is exactly what produced a bogus
  # ./share/ags/js before).
  if [ -z "$ags_js_dir" ]; then
    ags_bin=$(command -v ags)
    resolved=$(readlink -f "$ags_bin" 2>/dev/null) || resolved=""
    if [ -n "$resolved" ]; then
      prefix=$(dirname "$(dirname "$resolved")")
      candidate="$prefix/share/ags/js"
      [ -d "$candidate/node_modules/gnim" ] && ags_js_dir="$candidate"
    fi
  fi

  if [ -z "$ags_js_dir" ]; then
    echo "[install] couldn't find AGS's JS runtime (checked \$XDG_DATA_DIRS and next to the 'ags' binary) -- is AGS installed correctly?" >&2
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

# @girs -- the GObject-Introspection-derived TypeScript bindings every
# `gi://...` import in this project resolves against -- is in .gitignore
# (it's large, machine-generated, and specific to whatever GI libraries and
# versions are actually installed) and so never comes from `git clone` at
# all. Generating it is slow (tens of seconds), so it's skipped once it
# exists rather than regenerated on every run; delete the directory to
# force a fresh one (e.g. after installing a library with new GI bindings).
if [ ! -d "@girs" ] || [ -z "$(ls -A @girs 2>/dev/null)" ]; then
  echo "[install] generating GI TypeScript bindings (this can take a while)..."
  ags types -d "$(pwd)"
else
  echo "[install] @girs already present, skipping generation"
fi

echo "[install] generating GTK/Astal type declarations..."
bun run gtk:typegen

echo "[install] linting..."
bun run lint

echo "[install] type-checking..."
# `ags`/`gnim`'s own symlinked-in runtime and @girs's generated GObject
# bindings aren't code this project owns, and reliably produce noise tsc
# can't be configured away from entirely (they're reached through real
# imports, not just swept in by a broad "include", so skipLibCheck alone
# doesn't cover the non-.d.ts ones) -- a type error only means something
# here if it points at this project's own src/ or scripts/ files.
tsc_output=$(bunx tsc --noEmit 2>&1) || true
if echo "$tsc_output" | grep -qE '^(src|scripts)/'; then
  echo "$tsc_output"
  echo "[install] type errors found in this project's own code" >&2
  exit 1
fi

cat <<EOF

[install] done -- razzmataisse-ags is ready to go.

Try it out:
  bun run dev                  # live-reloading dev session
  ags run src/app.ts --gtk 4   # run it once, the way Hyprland would

Or wire it into Hyprland permanently (the new Lua config format --
e.g. in autostart.lua):
  hl.on("hyprland.start", function()
    hl.exec_cmd("ags run $(pwd)/src/app.ts --gtk 4")
  end)
EOF
