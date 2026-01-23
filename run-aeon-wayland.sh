#!/bin/bash
# =============================================================================
# Aeon - Script de Execução Otimizado para Wayland
# =============================================================================
# Este script detecta automaticamente o hardware (NVIDIA/Intel) e configura
# as variáveis de ambiente ideais para máxima performance em Wayland.
# =============================================================================

set -e

# Garantir PATH completo quando iniciado via .desktop
export PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:${PATH}"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

echo -e "${BLUE}=== Aeon - Iniciando em Wayland ===${NC}"

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

# Detectar sessão (Wayland ou X11)
detect_session() {
    if [ "$XDG_SESSION_TYPE" = "wayland" ]; then
        echo "wayland"
    elif [ "$XDG_SESSION_TYPE" = "x11" ]; then
        echo "x11"
    elif [ -n "$WAYLAND_DISPLAY" ]; then
        echo "wayland"
    else
        echo "x11"
    fi
}

GPU="${AEON_FORCE_GPU:-$(detect_gpu)}"
SESSION=$(detect_session)

echo -e "${GREEN}GPU detectada:${NC} $GPU"
echo -e "${GREEN}Sessão detectada:${NC} $SESSION"

# Diretório do script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BINARY="$SCRIPT_DIR/src-tauri/target/release/aeon"

if [ ! -f "$BINARY" ]; then
    notify_error "Binario nao encontrado em $BINARY. Execute 'npm run tauri:build' antes."
    exit 1
fi

# =============================================================================
# Configurações base para Wayland
# =============================================================================
export GDK_BACKEND=wayland
export CLUTTER_BACKEND=wayland
export SDL_VIDEODRIVER=wayland
export QT_QPA_PLATFORM=wayland

# WebKit/GTK4 Wayland optimizations
export GTK_USE_PORTAL=1

# =============================================================================
# Configurações específicas por GPU
# =============================================================================

if [ "$GPU" = "nvidia" ]; then
    echo -e "${YELLOW}Aplicando otimizações NVIDIA...${NC}"

    # NVIDIA requer configurações específicas para Wayland
    export __GLX_VENDOR_LIBRARY_NAME=nvidia
    export GBM_BACKEND=nvidia-drm
    export __NV_PRIME_RENDER_OFFLOAD=1
    export __VK_LAYER_NV_optimus=NVIDIA_only

    # WebKitGTK com NVIDIA em Wayland
    # DMABUF tem historico de crash em alguns drivers/sistemas, usar por padrao desabilitado
    NVIDIA_VERSION=""
    if command -v nvidia-smi >/dev/null 2>&1; then
        NVIDIA_VERSION=$(nvidia-smi --query-gpu=driver_version --format=csv,noheader 2>/dev/null | head -1 | cut -d'.' -f1)
    fi

    if [ -n "$NVIDIA_VERSION" ]; then
        echo -e "${GREEN}Driver NVIDIA $NVIDIA_VERSION detectado${NC}"
    fi

    if [ -z "${WEBKIT_DISABLE_DMABUF_RENDERER+x}" ]; then
        if [ "${AEON_WAYLAND_DMABUF:-0}" = "1" ]; then
            echo -e "${YELLOW}DMABUF habilitado via AEON_WAYLAND_DMABUF=1${NC}"
            export WEBKIT_DISABLE_DMABUF_RENDERER=0
        else
            echo -e "${YELLOW}DMABUF desabilitado por padrao para estabilidade${NC}"
            export WEBKIT_DISABLE_DMABUF_RENDERER=1
        fi
    fi

    # Forcar compositing para estabilidade com NVIDIA
    if [ -z "${WEBKIT_FORCE_COMPOSITING_MODE+x}" ]; then
        export WEBKIT_FORCE_COMPOSITING_MODE=1
    fi

    # VA-API para aceleração de vídeo (se disponível)
    export LIBVA_DRIVER_NAME=nvidia

elif [ "$GPU" = "intel" ]; then
    echo -e "${YELLOW}Aplicando otimizações Intel...${NC}"

    # Intel tem excelente suporte a Wayland e DMABUF
    if [ -z "${WEBKIT_DISABLE_DMABUF_RENDERER+x}" ]; then
        export WEBKIT_DISABLE_DMABUF_RENDERER=0
    fi
    if [ -z "${WEBKIT_FORCE_COMPOSITING_MODE+x}" ]; then
        export WEBKIT_FORCE_COMPOSITING_MODE=0
    fi

    # VA-API para Intel
    export LIBVA_DRIVER_NAME=iHD

    # Intel específico para melhor performance
    export MESA_LOADER_DRIVER_OVERRIDE=iris

else
    echo -e "${YELLOW}GPU desconhecida - usando configurações genéricas${NC}"
    if [ -z "${WEBKIT_DISABLE_DMABUF_RENDERER+x}" ]; then
        export WEBKIT_DISABLE_DMABUF_RENDERER=0
    fi
    if [ -z "${WEBKIT_FORCE_COMPOSITING_MODE+x}" ]; then
        export WEBKIT_FORCE_COMPOSITING_MODE=0
    fi
fi

# =============================================================================
# Fallback para X11 se Wayland falhar
# =============================================================================

if [ "$SESSION" = "x11" ]; then
    echo -e "${YELLOW}Sessão X11 detectada - usando XWayland ou X11 nativo${NC}"
    export GDK_BACKEND=x11
    # Em X11, DMABUF pode causar problemas
    if [ -z "${WEBKIT_DISABLE_DMABUF_RENDERER+x}" ]; then
        export WEBKIT_DISABLE_DMABUF_RENDERER=1
    fi
    if [ -z "${WEBKIT_FORCE_COMPOSITING_MODE+x}" ]; then
        export WEBKIT_FORCE_COMPOSITING_MODE=1
    fi
fi

# =============================================================================
# Otimizações gerais de performance
# =============================================================================

# Reduzir latência de input
export MOZ_ENABLE_WAYLAND=1

# Desabilitar VSync se necessário (pode causar tearing)
# export vblank_mode=0

# WebKitGTK performance
export WEBKIT_DISABLE_COMPOSITING_MODE=0

echo -e "${BLUE}Iniciando Aeon...${NC}"
echo -e "${GREEN}Variáveis de ambiente configuradas:${NC}"
echo "  GDK_BACKEND=$GDK_BACKEND"
echo "  WEBKIT_DISABLE_DMABUF_RENDERER=$WEBKIT_DISABLE_DMABUF_RENDERER"
echo "  WEBKIT_FORCE_COMPOSITING_MODE=$WEBKIT_FORCE_COMPOSITING_MODE"

exec "$BINARY"
