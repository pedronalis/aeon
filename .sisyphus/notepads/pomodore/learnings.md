# Learnings

## Theme System
- The project uses a CSS variable-based theming system with Tailwind CSS.
- Themes are defined in `src/styles/globals.css` using `:root` and data attributes (e.g., `:root[data-theme='scriptorium']`).
- The surface scale was previously limited to `surface`, `surface-lighter`, `surface-darker`.
- I expanded this to a 5-level scale: `bg`, `panel`, `surface-0`, `surface-1`, `surface-2` to allow for more depth and layering.
- `tailwind.config.js` maps these CSS variables to Tailwind utility classes (e.g., `bg-surface-0`, `bg-panel`).

## Contrast & Visibility
- Dark themes (Forge, Observatory) benefit from lighter/tinted surfaces to distinguish cards from the background.
- Light themes (Scriptorium) can use darker surfaces to simulate parchment or layered paper.
- Consistent naming (`surface-0`, `surface-1`, etc.) helps maintain a unified design language across different themes.
