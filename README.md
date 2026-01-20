# Aeon ⏳

> _Domine seu tempo, forje sua eternidade_

Aeon é um aplicativo desktop de Pomodoro com foco em precisão, gamificação e um tema medieval premium. Ele roda offline, guarda seus dados localmente e oferece modos de foco customizáveis.

## ✨ Destaques

- ⏱️ **Timer anti-drift** baseado em timestamps reais
- 🎨 **Modos preset + custom** (Tradicional, Foco Sustentável, Animedoro, Mangadoro)
- 🏆 **Gamificação completa**: XP dinâmico, níveis, streaks e 20 conquistas
- 🧾 **Pergaminhos (tarefas)** com etapas, prazos e recompensas
- 🎯 **Missões diárias e semanais** com bônus de XP
- 📊 **Estatísticas detalhadas** + export CSV
- 🔔 **Notificações nativas** e atalhos de teclado
- 💾 **SQLite com migrations** (dados locais)

## 🚀 Stack

- Frontend: React 19 + TypeScript + Vite + Zustand + TailwindCSS
- Backend: Tauri 2 + Rust
- Persistência: SQLite (tauri-plugin-sql)
- Testes: Vitest + Testing Library

## 📦 Requisitos

- Node.js 20+
- Rust 1.75+ (https://rustup.rs)
- Linux: `webkit2gtk`, `libappindicator`, `librsvg2`

## 🛠️ Desenvolvimento

```bash
# Instalar dependências
npm install

# Carregar ambiente Rust (primeira vez)
source $HOME/.cargo/env

# Rodar em dev (auto-detecta GPU/sessão e aplica defaults seguros)
npm run tauri:dev

# Rodar testes
npm test
```

**O comando `tauri:dev` inicia automaticamente:**
- Frontend Vite dev server em `http://localhost:1420/`
- Backend Rust com hot reload
- Database SQLite local

### Wayland + NVIDIA

Por padrão o DMABUF fica desabilitado para evitar crash do WebKitGTK. Para testar:

```bash
AEON_WAYLAND_DMABUF=1 npm run tauri:dev
```

### Modo de Performance

Em ambientes lentos, ative **Modo de Performance** nas configurações. Ele reduz animações e sombras pesadas. Para forçar no dev:

```bash
VITE_AEON_LOW_FX=1 npm run tauri:dev
```

### Diagnóstico de ambiente

```bash
./scripts/detect-env.sh
```

## 💾 Banco de dados

- Linux: `~/.local/share/com.pedro.aeon/pomodore.db`
- Migrations em `src-tauri/src/db.rs`

## 🧪 Testes

```bash
npm test
npm run test:watch
npm run test:ui
npm run test:coverage
```

## 📦 Build

```bash
npm run tauri:build
```

Instaladores em `src-tauri/target/release/bundle/`.

## 🗂️ Estrutura do repo

- `src/` UI + estado + domínio
- `src-tauri/` backend Rust + migrations
- `scripts/` utilitários (detect-env, launcher dev)

## 🤝 Contribuindo

Leia `CONTRIBUTING.md` para setup, padrões e fluxo de trabalho.

## 📄 Licença

MIT - veja `LICENSE`.
