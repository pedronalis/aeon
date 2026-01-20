# Contributing

Thanks for your interest in contributing to Aeon!

## Prerequisites

- Node.js 20+
- Rust 1.75+
- Linux dependencies: webkit2gtk, libappindicator, librsvg2

## Setup

```bash
npm install
source $HOME/.cargo/env
npm run tauri:dev
```

## Tests

```bash
npm test
```

## Code style

- Keep UI strings in PT-BR and use proper accents.
- Prefer small, focused PRs.
- Keep changes in the appropriate layer (`src/` for UI/state, `src-tauri/` for backend).

## Commit messages

Use concise, imperative messages (e.g. `fix: handle null profile`).

## Troubleshooting

If Wayland + NVIDIA is unstable, run `npm run tauri:dev` (safe defaults) or disable DMABUF.

