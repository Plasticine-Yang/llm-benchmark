#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# Runs a Node command, working around one macOS-only failure mode.
#
# On Apple Silicon every binary must carry at least an ad-hoc signature. The
# Node build shipped with some runtimes is signed with the hardened runtime
# flag (CS_RUNTIME), which turns on library validation: Node then refuses to
# dlopen any native addon that is not signed by the *same* team. Rollup's
# prebuilt binding (rollup.<platform>.node) is linker-signed with no team, so
# `vite` dies with ERR_DLOPEN_FAILED before it can start.
#
# The fix is a private, ad-hoc re-signed copy of the same Node binary with the
# hardened-runtime flag removed. It is created on demand under .tools/ and
# never replaces the original.
#
# Usage: scripts/with-node.sh <script> [args...]
# ---------------------------------------------------------------------------
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

SHIM="$ROOT/.tools/node"

find_node() {
  if command -v node >/dev/null 2>&1; then
    command -v node
    return
  fi
  for candidate in \
    "${DSH_NODE:-}" \
    "$HOME/.dsh/dsh-runtimes/dsh-primary-runtime/dependencies/node/bin/node" \
    /usr/local/bin/node \
    /opt/homebrew/bin/node; do
    if [ -n "$candidate" ] && [ -x "$candidate" ]; then
      printf '%s\n' "$candidate"
      return
    fi
  done
  return 1
}

needs_shim() {
  local node="$1" info
  [ "$(uname -s)" = "Darwin" ] || return 1
  command -v codesign >/dev/null 2>&1 || return 1
  # NOTE: capture first — piping into `grep -q` makes grep close the pipe early,
  # codesign dies from SIGPIPE, and `set -o pipefail` turns that into a false
  # negative. CS_RUNTIME appears as "(runtime)" in the code directory flags.
  info="$(codesign -dv "$node" 2>&1 || true)"
  case "$info" in
    *'(runtime)'*) return 0 ;;
    *) return 1 ;;
  esac
}

NODE="$(find_node)" || {
  echo "with-node: no Node.js runtime found on PATH" >&2
  exit 127
}

if needs_shim "$NODE"; then
  if [ ! -x "$SHIM" ] || [ "$NODE" -nt "$SHIM" ]; then
    echo "with-node: Node enforces library validation; preparing an ad-hoc copy…" >&2
    mkdir -p "$ROOT/.tools"
    cp "$NODE" "$SHIM"
    codesign --force --sign - --timestamp=none "$SHIM" >/dev/null 2>&1 || {
      echo "with-node: could not re-sign the Node copy" >&2
      rm -f "$SHIM"
      exit 1
    }
  fi
  NODE="$SHIM"
fi

exec "$NODE" "$@"
