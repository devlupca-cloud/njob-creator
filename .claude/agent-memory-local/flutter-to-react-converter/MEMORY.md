# Flutter-to-React Converter — Agent Memory

## Projeto
- **Destino**: Next.js 14 App Router, TypeScript, Tailwind CSS v4, Supabase, React Query, Zustand
- **Tema**: Dark — fundo `#0f0f0f`, primária `#AE32C3`, dark-primary `#651693`
- **Fonte**: DM Sans (`--font-sans`)
- **Componentes UI base**: `components/ui/`
- **Componentes por feature**: `components/<feature>/`

## Estrutura de Pastas Confirmada
```
app/(app)/home/page.tsx        — home convertida
app/(app)/layout.tsx           — inclui Sidebar + Navbar automaticamente
components/ui/Button.tsx       — Button com variants: primary|secondary|ghost|danger
components/ui/Sidebar.tsx      — sidebar desktop com nav items
components/home/CardEvento.tsx
components/home/CardMetricas.tsx
components/home/ToggleOnline.tsx
components/home/NovoEventoModal.tsx
lib/store/app-store.ts         — useCreator(), useAppStore()
lib/types/database.ts          — tipos Supabase (Database interface)
lib/supabase/client.ts         — createClient() para browser
```

## Padrões de Conversão Confirmados

### StatefulWidget → 'use client' + useState/useQuery
### FutureBuilder → useQuery (React Query)
### Drawer → Sidebar já inclusa no layout, page.tsx não precisa renderizá-la
### showModalBottomSheet → estado `modalOpen` + componente modal posicionado fixed bottom
### launchURL → window.open(url, '_blank', 'noopener,noreferrer')
### toast success/error → import { toast } from 'sonner'

## Supabase — Padrões de Acesso
- **Client browser**: `createClient()` de `lib/supabase/client.ts`
- **View vw_creator_events**: colunas `event_id, creator_id, event_name, event_type, start_date (string ISO YYYY-MM-DD), time (string ISO), duration_min, attendee_count, title`
- **RPC get_creator_metrics**: não está em `Database.Functions` → chamar via fetch direto para `/rest/v1/rpc/get_creator_metrics` com `{ p_profile_id: userId }`
- **Edge Function criar_ticket_live**: POST `/functions/v1/criar_ticket_live` com `{ titulo, descricao, data, valor, estimatedDurationMinutes }`

## CSS Variables (globals.css)
```
--color-background: #0f0f0f
--color-surface: #1a1a1a
--color-surface-2: #242424
--color-border: #2e2e2e
--color-foreground: #f0f0f0
--color-muted: #9a9a9a
--color-primary: #AE32C3
--color-primary-dark: #651693
--color-error: #ef4444
```
Utility: `.bg-gradient-primary` = `linear-gradient(135deg, #AE32C3, #651693)`

## Regras de Negócio Descobertas
- Botão de ação do CardEvento aparece APENAS se `new Date() >= eventTime`
- "Ver todos" aparece APENAS se há 3 ou mais eventos no dia
- Valor mínimo do ingresso: R$10,00
- Duração: '1 hora' = 60min, '30 minutos' = 30min
- URL live: `live-canvas-vue.lovable.app/live?room={eventId}&mode=host&userName={name}&userID={uid}`
- URL call: `live-canvas-vue.lovable.app/video-call?room={creatorId}&userName={name}&userID={uid}`

## Detalhes Importantes
- `vw_creator_events.start_date` é `string | null` em formato YYYY-MM-DD (não Date)
- `getTodayISO()` deve usar timezone local, não UTC, para comparar com start_date
- `Database.Functions` está como `Record<string, never>` — RPCs devem ser chamadas via fetch
- CardMetricas usa `fillColor` com cor clara (textos sempre `#222222`), não dark
- ToggleOnline: thumb desliza via `left` CSS, transição 200ms easeInOut

## Correct API Endpoint Names (from Flutter source scan)

### RPC (POST to /rest/v1/rpc/<name>)
- `get_profile_info` — GET, param: p_profile_id
- `save_profile_info` — POST, body: { p_payload: {...} }
- `get_creator_metrics` — GET, param: p_profile_id
- `save_creator_availability` — POST, body: { p_payload: {...} }
- `get_creator_daily_slots` — GET, params: p_creator_id, p_date
- `get_packs_by_creator` — POST, body: { p_creator_id, p_has_photo, p_has_video, p_start_date, p_end_date }
- `create_pack_with_items` — POST, body: { p_payload: {...} }
- `get_pack_with_items` — GET, param: p_pack_id
- `update_pack_with_items` — POST, body: { p_payload: {...} }
- `get_available_coupons` — GET, JWT only

### Edge Functions (POST to /functions/v1/<name>)
- `create-stripe-connected-account` — empty body
- `create-checkout-subscription-stripe` — body: { price_id }
- `create-stripe-pack` — body: { p_payload: {...} }
- `create-stripe-live-ticket` — body: { titulo, descricao, data, valor, estimatedDurationMinutes }
- `get-creator-financial-statement` — body: { year, month }
- `creator-payout-update-link` — empty body → returns { url }

## Packages Disponíveis (sem adicionar novos)
`@tanstack/react-query ^5`, `zustand ^5`, `sonner ^2`, `@supabase/ssr`, `next 14`

## Estrutura Perfil (Phase 1 — Concluido)
```
app/(app)/profile/page.tsx                    — hub do perfil com menu
app/(app)/profile/info/page.tsx               — informacoes pessoais (avatar + campos)
app/(app)/profile/edit/name/page.tsx          — alterar nome (profiles.full_name)
app/(app)/profile/edit/email/page.tsx         — alterar email (supabase.auth.updateUser)
app/(app)/profile/edit/password/page.tsx      — alterar senha (supabase.auth.updateUser)
app/(app)/profile/edit/description/page.tsx   — descricao com 5 selects (creator_description)
app/(app)/profile/edit/language/page.tsx      — idioma (localStorage njob_language)
app/(app)/profile/edit/interactions/page.tsx  — interacoes (profile_settings + profiles.whatsapp)
app/(app)/profile/edit/images/page.tsx        — fotos (Storage bucket images + profile_images)
```

## Padroes Perfil Descobertos
- Avatar: Storage bucket `images`, path `profiles/{userId}/avatar.{ext}`, upsert: true
- Foto capa: `profile_images` com `highlight_image_url: true`
- Fotos complementares: `profile_images` com `highlight_image_url: false`, campo `index`
- profile_settings: coluna `profile_id` (nao `creator_id`)
- creator_description: coluna `profile_id`, update via `.eq('profile_id', userId)`
- Senha: validacao minimo 8 chars + letra + numero
- Email: verificar email atual via `session.user.email` antes de chamar updateUser
- Input moeda: valor em centavos internamente, exibir com locale pt-BR

## Componentes UI Disponiveis
- `Button.tsx` — variants: primary|secondary|ghost|danger, props: loading, fullWidth
- `Input.tsx` — label, error, hint, iconLeft, iconRight
- `PasswordInput.tsx` — wrapper de Input com toggle visibilidade
- `SelectField.tsx` — label, options [{value, label}], error, placeholder
- `PageHeader.tsx` — title, showBack, onBack, action
- `Spinner.tsx`
- `GuestAuthModal.tsx` — props: open, onClose, message?; limpa cookie njob-guest + store.setGuest(false) + router.push('/register')

## Padrao de Modal com Animacao (sem biblioteca externa)
```tsx
// Keyframe via <style> tag inline no retorno do componente
<style>{`
  @keyframes modalIn {
    from { opacity: 0; transform: scale(0.94) translateY(8px); }
    to   { opacity: 1; transform: scale(1) translateY(0); }
  }
`}</style>
// Aplicar no panel: animation: 'modalIn 220ms cubic-bezier(0.22, 1, 0.36, 1) both'
// backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)' no overlay
```

## Cookie Deletion Pattern
```ts
function deleteCookie(name: string) {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`
}
```

## i18n System
- Hook: `useTranslation` from `@/lib/i18n` → retorna `{ t, locale }`
- Locale-aware formatting: `getLocaleBcp47(locale)` → `'pt-BR' | 'en-US' | 'es-ES'`
- Chaves importantes: `common.close|back|cancel|confirm|delete|loading|optional`, `events.newEvent|eventName|eventDuration|eventPrice|eventDate|eventTime|fieldRequired|minPriceHint|selectDate|invalidTime|localTimezoneHint|creating|eventCreated|errorCreating|duration30min|duration1hour|eventTitlePlaceholder`, `schedule.title|noEvents|live|videoCall|date|time|duration|ticketPrice`, `content.create|edit|coverImage|uploadMedia|contentTitle|contentDescription|price|contentSaved|contentDeleted|titleRequired|errorSaving|errorDeleting|deleteContent|deleteConfirm|publish`, `financial.title|totalEarnings|history|withdraw|period|noTransactions`, `home.visits|likes|revenue|last30days`
- IMPORTANTE: Se variável local `t` conflita com hook, renomear: `const { t: tFn, locale } = useTranslation()`
- Funções de formatação fora do componente: adicionar parâmetro `bcp47 = 'pt-BR'`
- Valores internos de duração: `'1hora'` e `'30min'`; mapa `DURACAO_BACKEND_VALUE` preserva strings para Edge Function

## i18n Pattern (useTranslation)
- Hook: `import { useTranslation, getLocaleBcp47 } from '@/lib/i18n'`
- Inside component: `const { t, locale } = useTranslation()`
- For Intl/toLocaleString: `getLocaleBcp47(locale)` → returns 'pt-BR' | 'en-US' | 'es-ES'
- Locale change: `useAppStore((s) => s.setLocale)` — persisted via Zustand + localStorage
- New keys go in pt.ts (master), en.ts, es.ts — all three must stay in sync
- Sub-components in same file that need t(): pass translated strings as props (no restructuring)
- `Translations` type in pt.ts uses `DeepStringify<typeof pt>` — all values become `string`
