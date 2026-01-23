#!/bin/bash
# =============================================================================
# Aeon - Script de Execução Otimizado para X11 (Fallback)
# =============================================================================
# Use este script quando Wayland não estiver disponível ou estiver instável.
# Otimizado para NVIDIA e Intel em X11.
# =============================================================================

set -e

export PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:${PATH}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

notify_error() {
    local message="$1"
    if command -v notify-send >/dev/null 2>&1; then
        notify-send "Aeon" "$message"
        return
    fi
    if command -v zenity >/dev/null 2>&1; then
        zenity --error --title="Aeon" --text="$message"
        return
    fi
    echo -e "${RED}${message}${NC}" >&2
}

echo -e "${BLUE}=== Aeon - Iniciando em X11 ===${NC}"

# Detectar GPU
detect_gpu() {
    if lspci | grep -i nvidia > /dev/null 2>&1; then
        echo "nvidia"
    elif lspci | grep -i "intel.*graphics\|intel.*gpu" > /dev/null 2>&1; then
        echo "intel"
    else
        echo "unknown"
    fi
}

GPU="${AEON_FORCE_GPU:-$(detect_gpu)}"
echo -e "${GREEN}GPU detectada:${NC} $GPU"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BINARY="$SCRIPT_DIR/src-tauri/target/release/aeon"

if [ ! -f "$BINARY" ]; then
    notify_error "Binario nao encontrado em $BINARY. Execute 'npm run tauri:build' antes."
    exit 1
fi

# =============================================================================
# Forçar X11
# =============================================================================
export GDK_BACKEND=x11
export CLUTTER_BACKEND=x11
export SDL_VIDEODRIVER=x11
export QT_QPA_PLATFORM=xcb

# =============================================================================
# WebKitGTK X11 - Configurações otimizadas
# =============================================================================

if [ "$GPU" = "nvidia" ]; then
    echo -e "${YELLOW}Aplicando otimizações NVIDIA para X11...${NC}"

    # NVIDIA em X11 geralmente tem problemas com DMABUF
    export WEBKIT_DISABLE_DMABUF_RENDERER=1

    # Verificar se compositing pode ser habilitado
    NVIDIA_VERSION=""
    if command -v nvidia-smi >/dev/null 2>&1; then
        NVIDIA_VERSION=$(nvidia-smi --query-gpu=driver_version --format=csv,noheader 2>/dev/null | head -1 | cut -d'.' -f1)
    fi

    if [ -n "$NVIDIA_VERSION" ] && [ "$NVIDIA_VERSION" -ge 470 ]; then
        echo -e "${GREEN}Driver NVIDIA $NVIDIA_VERSION - compositing habilitado${NC}"
        export WEBKIT_FORCE_COMPOSITING_MODE=1
    else
        echo -e "${YELLOW}Driver NVIDIA antigo - usando software rendering${NC}"
        export WEBKIT_DISABLE_COMPOSITING_MODE=1
    fi

    export __GLX_VENDOR_LIBRARY_NAME=nvidia

elif [ "$GPU" = "intel" ]; then
    echo -e "${YELLOW}Aplicando otimizações Intel para X11...${NC}"

    # Intel em X11 pode usar DMABUF com drivers modernos
    export WEBKIT_DISABLE_DMABUF_RENDERER=0
    export WEBKIT_FORCE_COMPOSITING_MODE=0

    export LIBVA_DRIVER_NAME=iHD
    export MESA_LOADER_DRIVER_OVERRIDE=iris

else
    echo -e "${YELLOW}GPU desconhecida - configurações conservadoras${NC}"
    export WEBKIT_DISABLE_DMABUF_RENDERER=1
    export WEBKIT_FORCE_COMPOSITING_MODE=1
fi

echo -e "${BLUE}Iniciando Aeon...${NC}"
echo -e "${GREEN}Variáveis de ambiente configuradas:${NC}"
echo "  GDK_BACKEND=$GDK_BACKEND"
echo "  WEBKIT_DISABLE_DMABUF_RENDERER=$WEBKIT_DISABLE_DMABUF_RENDERER"
echo "  WEBKIT_FORCE_COMPOSITING_MODE=${WEBKIT_FORCE_COMPOSITING_MODE:-0}"

exec "$BINARY"
