# Aeon ⏳

> _Domine seu tempo, forge sua eternidade_

Aplicativo desktop de timer Pomodoro minimalista e elegante. Múltiplas modalidades, sistema de gamificação completo e estética Tokyo Night Terminal Premium.

## ✨ Features

- ⏱️ **Timer Anti-Drift Preciso** - Timer baseado em timestamps reais, sem drift
- 🎨 **4 Modos Preset + Custom** - Tradicional, Foco Sustentável, Animedoro, Mangadoro
- 🏆 **Sistema de Gamificação Completo** - XP dinâmico, níveis, 15 achievements e streaks
- 🎯 **Quests Diárias e Semanais** - 3 daily + 2 weekly quests com XP bônus
- 📊 **Estatísticas Detalhadas** - Histórico completo, agregações por período/modo
- 🔔 **Notificações Nativas** - Alertas ao completar fases e quests
- 🌙 **Tema Tokyo Night** - Estética cozy terminal premium
- ⌨️ **Atalhos de Teclado** - Space, R, S
- ♿ **Acessível** - WCAG AAA
- 💾 **Persistência SQLite** - Database local com migrations
- 📤 **Export CSV** - Exporte seus dados

## 🚀 Stack

- Frontend: React 18 + TypeScript + Vite + Zustand + TailwindCSS
- Backend: Tauri 2 + Rust + SQLite
- Testes: Vitest + Testing Library

## 📦 Requisitos

- Node.js 20+
- Rust 1.75+ (https://rustup.rs)
- Dependências Linux: `webkit2gtk`, `libappindicator`, `librsvg2`

## 🛠️ Desenvolvimento

```bash
# Instalar dependências
npm install

# Importante: Carregar ambiente Rust (primeira vez apenas)
source $HOME/.cargo/env

# Rodar em dev (auto-detecta GPU/sessao e aplica defaults seguros)
npm run tauri:dev

# Rodar testes
npm test
```

**Nota**: O comando `tauri:dev` inicia automaticamente:
- Frontend Vite dev server em http://localhost:1420/
- Backend Rust com hot reload
- Database SQLite (criado automaticamente em `~/.local/share/com.aeon.app/aeon.db` no Linux)

**Wayland + NVIDIA**: por padrao o DMABUF fica desabilitado para evitar crash do WebKitGTK.
Para testar DMABUF, rode com `AEON_WAYLAND_DMABUF=1 npm run tauri:dev`.

## 📦 Build

```bash
npm run tauri:build
```

Instaladores gerados em: `src-tauri/target/release/bundle/`

## 📚 Documentação

- **[Sistema de Quests](docs/QUEST_SYSTEM.md)** - Guia completo sobre quests diárias e semanais
- **Arquitetura** - Domain-driven design com camadas separadas
- **Testing** - 29 testes unitários no TimerEngine

## 🎮 Como Usar

1. Selecione um modo
2. Pressione Space para iniciar
3. Foque no trabalho
4. Faça pausas quando sugerido

**Atalhos:**
- `Space` - Iniciar/Pausar
- `R` - Reset
- `S` - Pular

## Licença

MIT
