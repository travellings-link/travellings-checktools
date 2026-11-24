#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
FRONTEND_DIR="$(cd -- "$SCRIPT_DIR/.." && pwd -P)"
BACKEND_DIR="${BACKEND_DIR:-/c/Users/YanMo/IdeaProjects/travellings-checktools-backend}"
BACKEND_PORT="${BACKEND_PORT:-8080}"
FRONTEND_PORT="${FRONTEND_PORT:-5174}"
CHECK_ONLY=false

usage() {
  cat <<'EOF'
Usage: ./script/local-develop.sh [--check] [--backend-dir PATH]

Starts the H2 backend and Vite frontend together.
Environment overrides: BACKEND_DIR, BACKEND_PORT, FRONTEND_PORT.
EOF
}

while (($#)); do
  case "$1" in
    --check) CHECK_ONLY=true; shift ;;
    --backend-dir) [[ $# -ge 2 ]] || { echo "ERROR: --backend-dir requires a path" >&2; exit 2; }; BACKEND_DIR="$2"; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "ERROR: unknown option: $1" >&2; usage >&2; exit 2 ;;
  esac
done

command -v npm >/dev/null 2>&1 || { echo "ERROR: npm is not available" >&2; exit 1; }
command -v curl >/dev/null 2>&1 || { echo "ERROR: curl is not available" >&2; exit 1; }
if command -v pwsh.exe >/dev/null 2>&1; then POWERSHELL=pwsh.exe
elif command -v powershell.exe >/dev/null 2>&1; then POWERSHELL=powershell.exe
elif command -v pwsh >/dev/null 2>&1; then POWERSHELL=pwsh
else echo "ERROR: PowerShell is required for the backend H2 launcher" >&2; exit 1
fi

[[ -d "$BACKEND_DIR" ]] || { echo "ERROR: backend directory not found: $BACKEND_DIR" >&2; exit 1; }
BACKEND_DIR="$(cd -- "$BACKEND_DIR" && pwd -P)"
BACKEND_RUNNER="$BACKEND_DIR/scripts/run-local-h2.ps1"
[[ -f "$BACKEND_RUNNER" ]] || { echo "ERROR: backend runner not found: $BACKEND_RUNNER" >&2; exit 1; }
[[ -f "$BACKEND_DIR/gradlew.bat" ]] || { echo "ERROR: Gradle wrapper not found in: $BACKEND_DIR" >&2; exit 1; }
[[ -f "$FRONTEND_DIR/package.json" ]] || { echo "ERROR: frontend package.json not found: $FRONTEND_DIR" >&2; exit 1; }
case "$BACKEND_PORT:$FRONTEND_PORT" in *[!0-9:]*|:*|*:) echo "ERROR: ports must be positive integers" >&2; exit 1;; esac
((BACKEND_PORT > 0 && BACKEND_PORT < 65536 && FRONTEND_PORT > 0 && FRONTEND_PORT < 65536)) || { echo "ERROR: ports must be 1..65535" >&2; exit 1; }
[[ "$BACKEND_PORT" != "$FRONTEND_PORT" ]] || { echo "ERROR: backend and frontend ports must differ" >&2; exit 1; }

if command -v cygpath >/dev/null 2>&1; then BACKEND_RUNNER_NATIVE="$(cygpath -w "$BACKEND_RUNNER")"
elif command -v wslpath >/dev/null 2>&1; then BACKEND_RUNNER_NATIVE="$(wslpath -w "$BACKEND_RUNNER")"
else BACKEND_RUNNER_NATIVE="$BACKEND_RUNNER"
fi

if [[ "$CHECK_ONLY" == true ]]; then
  printf 'Prerequisites OK\n  frontend: %s\n  backend:  %s\n  backend URL: http://localhost:%s\n  frontend URL: http://localhost:%s\n' "$FRONTEND_DIR" "$BACKEND_DIR" "$BACKEND_PORT" "$FRONTEND_PORT"
  exit 0
fi

BACKEND_PID=''; FRONTEND_PID=''
stop_tree() {
  [[ -n "$1" ]] || return 0
  if command -v taskkill.exe >/dev/null 2>&1; then taskkill.exe //PID "$1" //T //F >/dev/null 2>&1 || true
  else kill "$1" >/dev/null 2>&1 || true
  fi
}
cleanup() { trap - EXIT INT TERM; echo; echo 'Stopping local services...'; stop_tree "$FRONTEND_PID"; stop_tree "$BACKEND_PID"; }
trap cleanup EXIT INT TERM

echo "[1/3] Starting backend with H2 on http://localhost:$BACKEND_PORT"
FRONTEND_URL="http://localhost:$FRONTEND_PORT" \
CORS_ORIGINS="http://localhost:$FRONTEND_PORT,http://127.0.0.1:$FRONTEND_PORT" \
GITHUB_REDIRECT_URI="http://localhost:$BACKEND_PORT/auth/github/callback" \
"$POWERSHELL" -NoProfile -ExecutionPolicy Bypass -File "$BACKEND_RUNNER_NATIVE" -Port "$BACKEND_PORT" &
BACKEND_PID=$!
BACKEND_URL="http://127.0.0.1:$BACKEND_PORT"
for ((attempt=1; attempt<=120; attempt++)); do
  if ! kill -0 "$BACKEND_PID" 2>/dev/null; then wait "$BACKEND_PID" || true; echo 'ERROR: backend exited before becoming ready' >&2; exit 1; fi
  if curl --silent --output /dev/null --max-time 2 "$BACKEND_URL/auth/me"; then break; fi
  ((attempt < 120)) || { echo 'ERROR: backend did not become ready within 120 seconds' >&2; exit 1; }
  sleep 1
done

echo '[2/3] Backend is ready'
echo "[3/3] Starting frontend on http://localhost:$FRONTEND_PORT"
(
  cd "$FRONTEND_DIR"
  DEV_API_TARGET="$BACKEND_URL" DEV_TRAVELLINGS_API_TARGET="${DEV_TRAVELLINGS_API_TARGET:-https://api.travellings.cn}" npm run dev -- --host localhost --port "$FRONTEND_PORT"
) &
FRONTEND_PID=$!
printf '\nLocal development is running:\n  frontend: http://localhost:%s\n  backend:  http://localhost:%s\nPress Ctrl+C to stop both.\n' "$FRONTEND_PORT" "$BACKEND_PORT"
wait "$FRONTEND_PID"
