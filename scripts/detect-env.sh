#!/bin/bash
# =============================================================================
# Aeon - Script de Detecção de Ambiente
# =============================================================================
# Detecta automaticamente:
# - GPU (NVIDIA, Intel, AMD)
# - Sessão (Wayland, X11)
# - Driver version
# - Recomendações de execução
# =============================================================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║          Aeon - Detecção de Ambiente de Renderização         ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# =============================================================================
# Detectar Sessão Gráfica
# =============================================================================
echo -e "${CYAN}[1/4] Detectando sessão gráfica...${NC}"

if [ "$XDG_SESSION_TYPE" = "wayland" ]; then
    SESSION="wayland"
    SESSION_DISPLAY="Wayland"
elif [ "$XDG_SESSION_TYPE" = "x11" ]; then
    SESSION="x11"
    SESSION_DISPLAY="X11"
elif [ -n "$WAYLAND_DISPLAY" ]; then
    SESSION="wayland"
    SESSION_DISPLAY="Wayland (detectado via WAYLAND_DISPLAY)"
elif [ -n "$DISPLAY" ]; then
    SESSION="x11"
    SESSION_DISPLAY="X11 (detectado via DISPLAY)"
else
    SESSION="unknown"
    SESSION_DISPLAY="Desconhecido"
fi

echo -e "  ${GREEN}Sessão:${NC} $SESSION_DISPLAY"
echo ""

# =============================================================================
# Detectar GPU
# =============================================================================
echo -e "${CYAN}[2/4] Detectando GPU...${NC}"

NVIDIA_DETECTED=false
INTEL_DETECTED=false
AMD_DETECTED=false

# NVIDIA
if lspci | grep -i nvidia > /dev/null 2>&1; then
    NVIDIA_DETECTED=true
    NVIDIA_CARD=$(lspci | grep -i nvidia | head -1 | sed 's/.*: //')
    echo -e "  ${GREEN}NVIDIA:${NC} $NVIDIA_CARD"

    # Versão do driver
    if command -v nvidia-smi &> /dev/null; then
        NVIDIA_DRIVER=$(nvidia-smi --query-gpu=driver_version --format=csv,noheader 2>/dev/null | head -1)
        if [ -n "$NVIDIA_DRIVER" ]; then
            echo -e "  ${GREEN}Driver NVIDIA:${NC} $NVIDIA_DRIVER"
            NVIDIA_MAJOR=$(echo "$NVIDIA_DRIVER" | cut -d'.' -f1)
        fi
    fi
fi

# Intel
if lspci | grep -iE "intel.*(graphics|gpu|vga|display)" > /dev/null 2>&1; then
    INTEL_DETECTED=true
    INTEL_CARD=$(lspci | grep -iE "intel.*(graphics|gpu|vga|display)" | head -1 | sed 's/.*: //')
    echo -e "  ${GREEN}Intel:${NC} $INTEL_CARD"
fi

# AMD
if lspci | grep -iE "amd.*(graphics|gpu|vga|radeon|display)" > /dev/null 2>&1; then
    AMD_DETECTED=true
    AMD_CARD=$(lspci | grep -iE "amd.*(graphics|gpu|vga|radeon|display)" | head -1 | sed 's/.*: //')
    echo -e "  ${GREEN}AMD:${NC} $AMD_CARD"
fi

if [ "$NVIDIA_DETECTED" = false ] && [ "$INTEL_DETECTED" = false ] && [ "$AMD_DETECTED" = false ]; then
    echo -e "  ${YELLOW}Nenhuma GPU dedicada detectada${NC}"
fi
echo ""

# =============================================================================
# Verificar Drivers e Suporte
# =============================================================================
echo -e "${CYAN}[3/4] Verificando suporte a renderização...${NC}"

# Verificar se glxinfo está disponível
if command -v glxinfo &> /dev/null; then
    RENDERER=$(glxinfo 2>/dev/null | grep "OpenGL renderer" | sed 's/.*: //')
    if [ -n "$RENDERER" ]; then
        echo -e "  ${GREEN}OpenGL Renderer:${NC} $RENDERER"
    fi
fi

# Verificar suporte a Vulkan
if command -v vulkaninfo &> /dev/null; then
    VULKAN_SUPPORT=$(vulkaninfo 2>/dev/null | grep "deviceName" | head -1 | sed 's/.*= //')
    if [ -n "$VULKAN_SUPPORT" ]; then
        echo -e "  ${GREEN}Vulkan:${NC} $VULKAN_SUPPORT"
    fi
fi

# Verificar VA-API
if command -v vainfo &> /dev/null; then
    VAAPI_DRIVER=$(vainfo 2>/dev/null | grep "Driver version" | head -1)
    if [ -n "$VAAPI_DRIVER" ]; then
        echo -e "  ${GREEN}VA-API:${NC} $VAAPI_DRIVER"
    fi
fi
echo ""

# =============================================================================
# Recomendações
# =============================================================================
echo -e "${CYAN}[4/4] Recomendações de execução...${NC}"
echo ""

RECOMMENDED_SCRIPT=""
RECOMMENDED_NPM=""

if [ "$SESSION" = "wayland" ]; then
    if [ "$NVIDIA_DETECTED" = true ]; then
        if [ -n "$NVIDIA_MAJOR" ] && [ "$NVIDIA_MAJOR" -ge 515 ]; then
            echo -e "  ${GREEN}✓ Wayland + NVIDIA (driver moderno)${NC}"
            echo -e "    DMABUF desabilitado por padrao para estabilidade"
            echo -e "    Recomendado: ${YELLOW}./run-aeon-wayland.sh${NC}"
            echo -e "    Ou: ${YELLOW}npm run tauri:dev:wayland-nvidia${NC}"
            echo -e "    Para testar DMABUF: ${YELLOW}AEON_WAYLAND_DMABUF=1${NC}"
            RECOMMENDED_SCRIPT="./run-aeon-wayland.sh"
            RECOMMENDED_NPM="npm run tauri:dev:wayland-nvidia"
        else
            echo -e "  ${YELLOW}⚠ Wayland + NVIDIA (driver antigo < 515)${NC}"
            echo -e "    DMABUF desabilitado para estabilidade"
            echo -e "    Recomendado: ${YELLOW}./run-aeon-wayland.sh${NC}"
            echo -e "    Alternativa: ${YELLOW}npm run tauri:dev:x11${NC}"
            RECOMMENDED_SCRIPT="./run-aeon-wayland.sh"
            RECOMMENDED_NPM="npm run tauri:dev:wayland-nvidia"
        fi
    elif [ "$INTEL_DETECTED" = true ]; then
        echo -e "  ${GREEN}✓ Wayland + Intel (melhor performance)${NC}"
        echo -e "    Recomendado: ${YELLOW}./run-aeon-wayland.sh${NC}"
        echo -e "    Ou: ${YELLOW}npm run tauri:dev:wayland-intel${NC}"
        RECOMMENDED_SCRIPT="./run-aeon-wayland.sh"
        RECOMMENDED_NPM="npm run tauri:dev:wayland-intel"
    elif [ "$AMD_DETECTED" = true ]; then
        echo -e "  ${GREEN}✓ Wayland + AMD (bom suporte)${NC}"
        echo -e "    Recomendado: ${YELLOW}./run-aeon-wayland.sh${NC}"
        echo -e "    Ou: ${YELLOW}npm run tauri:dev:wayland${NC}"
        RECOMMENDED_SCRIPT="./run-aeon-wayland.sh"
        RECOMMENDED_NPM="npm run tauri:dev:wayland"
    else
        echo -e "  ${YELLOW}⚠ Wayland (GPU não identificada)${NC}"
        echo -e "    Recomendado: ${YELLOW}./run-aeon-wayland.sh${NC}"
        RECOMMENDED_SCRIPT="./run-aeon-wayland.sh"
        RECOMMENDED_NPM="npm run tauri:dev:wayland"
    fi
else
    # X11
    if [ "$INTEL_DETECTED" = true ]; then
        echo -e "  ${GREEN}✓ X11 + Intel${NC}"
        echo -e "    Recomendado: ${YELLOW}npm run tauri:dev:x11-intel${NC}"
        RECOMMENDED_SCRIPT="./run-aeon-x11.sh"
        RECOMMENDED_NPM="npm run tauri:dev:x11-intel"
    else
        echo -e "  ${YELLOW}⚠ X11 (fallback)${NC}"
        echo -e "    Recomendado: ${YELLOW}./run-aeon-x11.sh${NC}"
        echo -e "    Ou: ${YELLOW}npm run tauri:dev:x11${NC}"
        RECOMMENDED_SCRIPT="./run-aeon-x11.sh"
        RECOMMENDED_NPM="npm run tauri:dev:x11"
    fi
fi

echo ""
echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                      Comandos Disponíveis                    ║${NC}"
echo -e "${BLUE}╠══════════════════════════════════════════════════════════════╣${NC}"
echo -e "${BLUE}║${NC} ${GREEN}Wayland:${NC}                                                    ${BLUE}║${NC}"
echo -e "${BLUE}║${NC}   npm run tauri:dev:wayland        (genérico)               ${BLUE}║${NC}"
echo -e "${BLUE}║${NC}   npm run tauri:dev:wayland-nvidia (NVIDIA otimizado)       ${BLUE}║${NC}"
echo -e "${BLUE}║${NC}   npm run tauri:dev:wayland-intel  (Intel otimizado)        ${BLUE}║${NC}"
echo -e "${BLUE}║${NC}                                                              ${BLUE}║${NC}"
echo -e "${BLUE}║${NC} ${YELLOW}X11 (fallback):${NC}                                             ${BLUE}║${NC}"
echo -e "${BLUE}║${NC}   npm run tauri:dev:x11            (genérico)               ${BLUE}║${NC}"
echo -e "${BLUE}║${NC}   npm run tauri:dev:x11-intel      (Intel otimizado)        ${BLUE}║${NC}"
echo -e "${BLUE}║${NC}   npm run tauri:dev:software       (software rendering)     ${BLUE}║${NC}"
echo -e "${BLUE}║${NC}                                                              ${BLUE}║${NC}"
echo -e "${BLUE}║${NC} ${CYAN}Scripts de execução (release):${NC}                              ${BLUE}║${NC}"
echo -e "${BLUE}║${NC}   ./run-aeon-wayland.sh            (auto-detecta GPU)       ${BLUE}║${NC}"
echo -e "${BLUE}║${NC}   ./run-aeon-x11.sh                (fallback X11)           ${BLUE}║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

if [ -n "$RECOMMENDED_NPM" ]; then
    echo -e "${GREEN}>>> Comando recomendado para seu sistema:${NC}"
    echo -e "    ${YELLOW}$RECOMMENDED_NPM${NC}"
    echo ""
fi
