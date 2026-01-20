#!/bin/bash
# =============================================================================
# Aeon - Tauri dev launcher with safe defaults per GPU/session
# =============================================================================

set -e

detect_session() {
  if [ "$XDG_SESSION_TYPE" = "wayland" ] || [ -n "$WAYLAND_DISPLAY" ]; then
    echo "wayland"
    return
  fi
  echo "x11"
}

detect_gpu() {
  if ! command -v lspci >/dev/null 2>&1; then
    echo "unknown"
    return
  fi

  if lspci | grep -i nvidia >/dev/null 2>&1; then
    echo "nvidia"
    return
  fi
  if lspci | grep -iE "intel.*(graphics|gpu|vga|display)" >/dev/null 2>&1; then
    echo "intel"
    return
  fi
  if lspci | grep -iE "amd.*(graphics|gpu|vga|radeon|display)" >/dev/null 2>&1; then
    echo "amd"
    return
  fi

  echo "unknown"
}

SESSION="$(detect_session)"
GPU="$(detect_gpu)"

if [ "$SESSION" = "wayland" ]; then
  export GDK_BACKEND=wayland
  export CLUTTER_BACKEND=wayland
  export SDL_VIDEODRIVER=wayland
  export QT_QPA_PLATFORM=wayland
  export GTK_USE_PORTAL=1

  if [ "$GPU" = "nvidia" ]; then
    export __GLX_VENDOR_LIBRARY_NAME=nvidia

    if [ -z "${WEBKIT_DISABLE_DMABUF_RENDERER+x}" ]; then
      if [ "${AEON_WAYLAND_DMABUF:-0}" = "1" ]; then
        export WEBKIT_DISABLE_DMABUF_RENDERER=0
      else
        export WEBKIT_DISABLE_DMABUF_RENDERER=1
      fi
    fi

    if [ -z "${WEBKIT_FORCE_COMPOSITING_MODE+x}" ]; then
      export WEBKIT_FORCE_COMPOSITING_MODE=1
    fi

    if [ "${WEBKIT_DISABLE_DMABUF_RENDERER:-0}" = "1" ] && [ -z "${VITE_AEON_LOW_FX+x}" ]; then
      export VITE_AEON_LOW_FX=1
    fi
  else
    if [ -z "${WEBKIT_DISABLE_DMABUF_RENDERER+x}" ]; then
      export WEBKIT_DISABLE_DMABUF_RENDERER=0
    fi

    if [ -z "${WEBKIT_FORCE_COMPOSITING_MODE+x}" ]; then
      export WEBKIT_FORCE_COMPOSITING_MODE=0
    fi
  fi
else
  export GDK_BACKEND=x11
  export CLUTTER_BACKEND=x11
  export SDL_VIDEODRIVER=x11
  export QT_QPA_PLATFORM=xcb

  if [ -z "${WEBKIT_DISABLE_DMABUF_RENDERER+x}" ]; then
    export WEBKIT_DISABLE_DMABUF_RENDERER=1
  fi

  if [ -z "${WEBKIT_FORCE_COMPOSITING_MODE+x}" ]; then
    export WEBKIT_FORCE_COMPOSITING_MODE=1
  fi

  if [ -z "${VITE_AEON_LOW_FX+x}" ]; then
    export VITE_AEON_LOW_FX=1
  fi
fi

echo "Aeon dev: session=$SESSION gpu=$GPU"
echo "GDK_BACKEND=$GDK_BACKEND"
echo "WEBKIT_DISABLE_DMABUF_RENDERER=${WEBKIT_DISABLE_DMABUF_RENDERER:-<unset>}"
echo "WEBKIT_FORCE_COMPOSITING_MODE=${WEBKIT_FORCE_COMPOSITING_MODE:-<unset>}"

exec tauri dev
