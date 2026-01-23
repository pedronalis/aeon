#!/bin/bash
# =============================================================================
# Aeon - Script de Execução Principal (Auto-detecta Wayland/X11)
# =============================================================================
# Este script detecta automaticamente o ambiente e executa o script apropriado.
# Para forçar um modo específico, use:
#   - ./run-aeon-wayland.sh  (Wayland nativo - recomendado)
#   - ./run-aeon-x11.sh      (X11 fallback)
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

SESSION="${AEON_FORCE_SESSION:-}"

if [ -z "$SESSION" ]; then
    if [ "$XDG_SESSION_TYPE" = "wayland" ] || [ -n "$WAYLAND_DISPLAY" ]; then
        SESSION="wayland"
    elif [ -n "${XDG_SESSION_ID:-}" ] && command -v loginctl >/dev/null 2>&1; then
        SESSION_TYPE=$(loginctl show-session "$XDG_SESSION_ID" -p Type --value 2>/dev/null || true)
        if [ "$SESSION_TYPE" = "wayland" ]; then
            SESSION="wayland"
        else
            SESSION="x11"
        fi
    else
        SESSION="x11"
    fi
fi

if [ "$SESSION" = "wayland" ]; then
    echo "Detectado Wayland - usando run-aeon-wayland.sh"
    exec "$SCRIPT_DIR/run-aeon-wayland.sh"
else
    echo "Detectado X11 - usando run-aeon-x11.sh"
    exec "$SCRIPT_DIR/run-aeon-x11.sh"
fi
