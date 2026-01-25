# Aeon ⏳

Languages: 🇺🇸 English | 🇧🇷 [PT-BR (principal)](README.md)

[![License: MIT](https://img.shields.io/github/license/pedronalis/aeon)](LICENSE)
[![Last Commit](https://img.shields.io/github/last-commit/pedronalis/aeon/main)](https://github.com/pedronalis/aeon/commits/main)
[![Repo Size](https://img.shields.io/github/repo-size/pedronalis/aeon)](https://github.com/pedronalis/aeon)

> _Master your time, forge your eternity_

Aeon is a desktop Pomodoro app focused on precision, gamification, and a premium medieval theme. It runs offline, stores data locally, and offers customizable focus modes.

## 🪟 Windows setup (step-by-step)

1. Install Node.js 20+ and Git.
2. Install Rust (MSVC) via rustup and open a new terminal:

```bash
winget install Rustlang.Rustup
rustup default stable-x86_64-pc-windows-msvc
```

3. Install **Visual Studio Build Tools** with **Desktop development with C++** (MSVC + Windows 10/11 SDK).
4. Install **WebView2 Runtime (Evergreen)**.
5. Clone the repo and install dependencies:

```bash
git clone https://github.com/pedronalis/aeon.git
cd aeon
npm install
```

6. Run in development:

```bash
npm run tauri:dev
```

7. Build the installer (NSIS):

```bash
npm run tauri:build:windows
```

8. Installer output: `src-tauri/target/release/bundle/nsis/`.
9. Optional (MSI): install **WiX Toolset** and run:

```bash
npm run tauri:build -- --bundles msi
```

## 🖼️ Screenshots

| Timer | Scrolls |
| --- | --- |
| ![Timer](docs/screenshots/aeon-timer.svg) | ![Scrolls](docs/screenshots/aeon-pergaminhos.svg) |

> Images are placeholders. Replace them with real screenshots when needed.

## ✨ Highlights

- ⏱️ **Anti-drift timer** based on real timestamps
- 🎨 **Preset + custom modes** (Traditional, Sustainable Focus, Animedoro, Mangadoro)
- 🏆 **Full gamification**: dynamic XP, levels, streaks, 20 achievements
- 🧾 **Scrolls (tasks)** with stages, deadlines, and rewards
- 🎯 **Daily and weekly quests** with XP bonuses
- 📊 **Detailed stats** + CSV export
- 🔔 **Native notifications** and keyboard shortcuts
- 💾 **SQLite with migrations** (local data)

## 🚀 Stack

- Frontend: React 19 + TypeScript + Vite + Zustand + TailwindCSS
- Backend: Tauri 2 + Rust
- Persistence: SQLite (tauri-plugin-sql)
- Tests: Vitest + Testing Library

## 📦 Requirements

- Node.js 20+
- Rust 1.75+ (https://rustup.rs)
- Linux: `webkit2gtk`, `libappindicator`, `librsvg2`
- Windows: Visual Studio Build Tools (Desktop C++), WebView2 Runtime

## 🛠️ Development

```bash
# Install dependencies
npm install

# Load Rust environment (first time)
source $HOME/.cargo/env

# Run dev (auto-detects GPU/session and applies safe defaults)
npm run tauri:dev

# Run tests
npm test
```

**The `tauri:dev` command starts automatically:**
- Vite dev server at `http://localhost:1420/`
- Rust backend with hot reload
- Local SQLite database

### Wayland + NVIDIA

By default DMABUF is disabled to avoid WebKitGTK crashes. To test:

```bash
AEON_WAYLAND_DMABUF=1 npm run tauri:dev
```

### Performance mode

On slower machines, enable **Performance Mode** in settings. It reduces heavy animations and shadows. To force it in dev:

```bash
VITE_AEON_LOW_FX=1 npm run tauri:dev
```

### Environment diagnostics

```bash
./scripts/detect-env.sh
```

### Useful scripts

```bash
npm run tauri:dev:wayland
npm run tauri:dev:wayland-nvidia
npm run tauri:dev:wayland-intel
npm run tauri:dev:x11
npm run tauri:dev:software
npm run tauri:build
```

## 💾 Database

- Linux: `~/.local/share/com.pedro.aeon/pomodore.db`
- Migrations: `src-tauri/src/db.rs`

## 📚 Documentation

- `docs/QUEST_SYSTEM.md`

## 🧪 Tests

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

Installers are output in `src-tauri/target/release/bundle/`.

## 🗂️ Repo structure

- `src/` UI + state + domain
- `src-tauri/` Rust backend + migrations
- `scripts/` utilities (detect-env, dev launcher)

## 🤝 Contributing

Read `CONTRIBUTING.md` for setup, conventions, and workflow.

## 📄 License

MIT - see `LICENSE`.
