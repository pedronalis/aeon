#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DESKTOP_FILE="${HOME}/.local/share/applications/aeon.desktop"
RUN_SCRIPT="${ROOT_DIR}/run-aeon.sh"
ICON_PATH="${ROOT_DIR}/src-tauri/icons/icon.png"
ICON_DIR="${HOME}/.local/share/icons/hicolor/256x256/apps"

FORCE_SESSION="${AEON_DESKTOP_FORCE_SESSION:-wayland}"
FORCE_GPU="${AEON_DESKTOP_FORCE_GPU:-nvidia}"
EXEC_CMD="${RUN_SCRIPT}"

if [ -n "${FORCE_SESSION}" ] || [ -n "${FORCE_GPU}" ]; then
  EXEC_CMD="env"
  if [ -n "${FORCE_SESSION}" ]; then
    EXEC_CMD="${EXEC_CMD} AEON_FORCE_SESSION=${FORCE_SESSION}"
  fi
  if [ -n "${FORCE_GPU}" ]; then
    EXEC_CMD="${EXEC_CMD} AEON_FORCE_GPU=${FORCE_GPU}"
  fi
  EXEC_CMD="${EXEC_CMD} ${RUN_SCRIPT}"
fi

mkdir -p "$(dirname "$DESKTOP_FILE")"

cat > "$DESKTOP_FILE" <<EOF
[Desktop Entry]
Name=Aeon
Exec=${EXEC_CMD}
Path=${ROOT_DIR}
TryExec=${RUN_SCRIPT}
Type=Application
Icon=aeon
Categories=Utility;
Terminal=false
StartupNotify=true
StartupWMClass=aeon
X-GNOME-UsesNotifications=true
EOF

chmod +x "$RUN_SCRIPT" "$DESKTOP_FILE"

mkdir -p "$ICON_DIR"
cp "$ICON_PATH" "$ICON_DIR/aeon.png"

if command -v gtk-update-icon-cache >/dev/null 2>&1; then
  gtk-update-icon-cache -f -t "$(dirname "$ICON_DIR")" || true
fi

if command -v gio >/dev/null 2>&1; then
  gio set "$DESKTOP_FILE" metadata::trusted true || true
fi

if command -v update-desktop-database >/dev/null 2>&1; then
  update-desktop-database "$(dirname "$DESKTOP_FILE")" || true
fi

echo "Desktop entry installed at ${DESKTOP_FILE}"
