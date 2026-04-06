---
name: Component Patterns
description: Subcomponent architecture rules and styling conventions confirmed in this project
type: project
---

## Subcomponent rules (confirmed in home page refactor)
- `_components/` folder inside each route segment holds private subcomponents (Next.js convention)
- Subcomponents receive ALL data via props — no direct Zustand/store access (exception: `useTranslation`)
- Page-level orchestrators own all `useQuery` hooks and handlers; they pass callbacks (`onXxx`) to children
- Named exports (not default) for subcomponents inside `_components/`
- `QuickActions` component was NOT created — the original file had no quick-action section; do not fabricate components that don't exist in the source

## Styling conventions
- Convert all `style={{}}` to Tailwind; keep `style={{}}` only for truly dynamic values (gradients, colors from JS vars)
- Gradient buttons: `style={{ background: 'linear-gradient(to right, #651693 0%, #AE32C3 100%)' }}` — keep as inline style (dynamic)
- CSS variables: always use Tailwind arbitrary values `text-[var(--color-primary)]`, not `style={{ color: 'var(--color-primary)' }}`
- Hover effects: use Tailwind `hover:opacity-[0.88]` instead of `onMouseEnter/onMouseLeave` JS handlers

**Why:** Established during refactor of 720-line God Component at `app/(app)/home/page.tsx` on 2026-04-06.
**How to apply:** Follow this pattern on any future page/component decomposition in this codebase.
