---
name: Project Stack & Conventions
description: Core libraries and project-wide conventions for njob creator web
type: project
---

- Framework: Next.js 14 App Router (`app/` directory), `'use client'` directive on interactive components
- Styling: Tailwind CSS for utility classes; inline `style={{}}` only for dynamic values (e.g. gradient strings). CSS variables exposed via `var(--color-primary)`, `var(--color-muted)`, `var(--color-foreground)`, `var(--color-background)`, `var(--color-border)`, `var(--color-surface)`, `var(--color-surface-2)` — use Tailwind arbitrary values: `text-[var(--color-primary)]`
- Icons: lucide-react (installed). Replace all inline SVG components with lucide imports.
- Data fetching: `@tanstack/react-query` (`useQuery`). All queries live in page-level orchestrators; subcomponents receive data via props.
- Backend: Supabase (client via `@/lib/supabase/client`). Auth via `supabase.auth.getUser()`.
- State: Zustand store at `@/lib/store/app-store` — exposes `useCreator()`, `useIsGuest()`, `useAppStore()`
- i18n: `useTranslation` from `@/lib/i18n` — allowed inside subcomponents (exception to "no store access in subcomponents" rule)
- Guest guard: `useGuestGuard()` at `@/lib/hooks/useGuestGuard` — returns `{ requireAuth, showGuestModal, setShowGuestModal }`
- Database types: `@/lib/types/database` — `Database['public']['Views']['vw_creator_events']['Row']`
- Date utils: `@/lib/utils/datetime` — `getTodayLocalYYYYMMDD`, `getTomorrowLocalYYYYMMDD`, `eventStartDateLocal`, `formatTimeLocal`

**Why:** Confirmed by reading page.tsx and component sources directly.
**How to apply:** Use these imports/patterns in all new or refactored files in this project.
