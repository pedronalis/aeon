
## Implementation Details (Task 1)

### Changes Made
- **Typography**:
    - Added `fontSize.hero` (8rem) for the main timer.
    - Added `letterSpacing.medieval` (0.15em) for uppercase headers.
    - Created `.typography-hero` utility (renamed from `.text-hero` to avoid circular dependency).
    - Created `.text-body-reading` for optimized long-form text.

### Accessibility
- **Contrast**: Adjusted `text-muted` from `#7a6f5d` to `#948672` to meet WCAG AA requirements on the surface color.
- **Focus**: Created `.focus-gold` and `.focus-gold-glow` for high-visibility, thematic focus states. Updated `.btn` and `.input` to use these patterns.

### Low-FX Support
- Added overrides for `.typography-hero` (removes filters/shadows) and `.focus-gold-glow` (removes shadows, uses solid outline) when `data-fx="low"` is active.
