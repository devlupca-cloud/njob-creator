# Migration Status — Flutter → React/Next.js

**Project:** njob Creator Web
**Stack:** Next.js 14, TypeScript, Tailwind v4, Supabase, React Query, Zustand, Sonner
**Flutter Source:** `/Users/samanthamaia/development/njob_creator`
**React Target:** `/Users/samanthamaia/development/njob_creator_web`

---

## ✅ Completed

| Screen | Route | Flutter Ref |
|--------|-------|-------------|
| Login | `/login` | `lib/pages/login/` |
| Register | `/register` | `lib/pages/register/` |
| ResetPasswordSendEmail | `/reset-password` | `lib/pages/reset_password/` |
| ResetPasswordVerifyPin | `/reset-password/verify` | `lib/pages/reset_password/` |
| ResetPasswordNew | `/reset-password/new` | `lib/pages/reset_password/` |
| ContaStripe (onboarding) | `/stripe-setup` | `lib/pages/conta_stripe/` |
| Home (dashboard) | `/home` | `lib/pages/home/` |
| Layout (Sidebar + Navbar) | `app/(app)/layout.tsx` | `lib/components/drawer/` |

---

## Phase 1 — Profile (9 screens) — Concluido

| Screen | Route | Status | Flutter Ref |
|--------|-------|--------|-------------|
| Perfil (hub) | `/profile` | Concluido | `lib/pages/perfil/perfil/` |
| InformacoesPessoais | `/profile/info` | Concluido | `lib/pages/perfil/informacoes_pessoais/` |
| AlterarNome | `/profile/edit/name` | Concluido | `lib/pages/perfil/alterar_nome/` |
| AlterarEmail | `/profile/edit/email` | Concluido | `lib/pages/perfil/alterar_email/` |
| AlterarSenha | `/profile/edit/password` | Concluido | `lib/pages/perfil/alterar_senha/` |
| AlterarDescricao | `/profile/edit/description` | Concluido | `lib/pages/perfil/alterar_descricao/` |
| AlterarIdioma | `/profile/edit/language` | Concluido | `lib/pages/perfil/alterar_idioma/` |
| AlterarInteracoes | `/profile/edit/interactions` | Concluido | `lib/pages/perfil/alterar_interacoes/` |
| AlterarImagens | `/profile/edit/images` | Concluido | `lib/pages/perfil/alterar_imagens/` |

**APIs:** RPC `get_profile_info`, RPC `save_profile_info`, Supabase Storage (profile/banner/additional images)

---

## ✅ Phase 2 — Schedule + Availability (2 screens) — Concluído

| Screen | Route | Status | Flutter Ref |
|--------|-------|--------|-------------|
| Agenda | `/schedule` | ✅ Concluído | `lib/pages/agenda/agenda/` |
| EditarDisponibilidade | `/schedule/availability` | ✅ Concluído | `lib/pages/agenda/editar_disponibilidade/` |

**APIs:** `vw_creator_events` (query), RPC `get_creator_daily_slots`, RPC `save_creator_availability`, Edge Function `criar_ticket_live` (via NovoEventoModal)
**Components:** `CalendarioEventos`, `CardEventoAgenda`, `DetalhesAgendamentoModal`, expandable slots (Manhã/Tarde/Noite/Madrugada) on availability page

---

## ✅ Phase 3 — Chat (2 screens) — Concluído

| Screen | Route | Status | Flutter Ref |
|--------|-------|--------|-------------|
| ListaConversas | `/chat` | ✅ Concluído | `lib/pages/chat/lista_conversas/` |
| Chat (conversa) | `/chat/[id]` | ✅ Concluído | `lib/pages/chat/chat/` |

**APIs:** `vw_creator_conversations` (query), `vw_messages` (query), `messages` (insert), `conversation_participants` (update last_read_at), Realtime on `messages` for chat thread
**Features:** List with search, filter unread, sort; conversation with realtime messages, send message, mark read

---

## ✅ Phase 4 — Content / Packages (3 screens) — Concluído

| Screen | Route | Status | Flutter Ref |
|--------|-------|--------|-------------|
| Conteudo | `/content` | ✅ Concluído | `lib/pages/conteudo/conteudo/` |
| CriarPacote | `/content/create` | ✅ Concluído | `lib/pages/conteudo/criar_pacote/` |
| EditarPacote | `/content/[id]/edit` | ✅ Concluído | `lib/pages/conteudo/editar_pacote/` |

**APIs:** RPC `get_packs_by_creator`, RPC `create_pack_with_items`, RPC `get_pack_with_items`, RPC `update_pack_with_items` (lib/api/content.ts)
**Features:** List with filters (photo/video), grid cards, FAB create, create form, edit form

---

## ✅ Phase 5 — Financial (1 screen, 3 tabs) — Concluído

| Screen | Route | Status | Flutter Ref |
|--------|-------|--------|-------------|
| Financeiro | `/financial` | ✅ Concluído | `lib/pages/financeiro/financeiro/` |

**APIs:** Edge Function `get-creator-financial-statement` (POST), Edge Function `creator-payout-update-link` (POST), RPC `get_creator_metrics`
**Tabs:** Visão Geral (métricas), Extrato (year/month + statement), Saques (link atualizar dados)

---

## ✅ Phase 6 — Coupons (2 screens) — Concluído

| Screen | Route | Status | Flutter Ref |
|--------|-------|--------|-------------|
| Cupons | `/subscriptions` | ✅ Concluído | `lib/pages/cupons/cupons/` |
| DetalhesCupon | `/subscriptions/[id]` | ✅ Concluído | `lib/pages/cupons/detalhes_cupon/` |

**APIs:** RPC `get_available_coupons` (lib/api/coupons.ts)

---

## ✅ Phase 7 — Payments (3 screens) — Concluído

| Screen | Route | Status | Flutter Ref |
|--------|-------|--------|-------------|
| CartoesCadastrados | `/payments` | ✅ Concluído | `lib/pages/pagamentos/` |
| DetalhesCartao | `/payments/[id]` | ✅ Concluído | `lib/pages/pagamentos/` |
| AdicionarCartao | `/payments/add` | ✅ Concluído | `lib/pages/pagamentos/` |

**APIs:** Edge Function `creator-payout-update-link` (Stripe link); account info from creator store (account_details)

---

## ✅ Phase 8 — Subscriptions (2 screens) — Concluído

| Screen | Route | Status | Flutter Ref |
|--------|-------|--------|-------------|
| Assinatura | `/subscription-plans` | ✅ Concluído | `lib/pages/assinatura/assinatura/` |
| AssinaturaPrimeiroAcesso | `/onboarding/subscription` | ✅ Concluído | `lib/pages/assinatura/assinatura_primero_acesso/` |

**APIs:** Table `subscription_plans` (list active plans)

---

## Low Priority / Skip

| Screen | Notes |
|--------|-------|
| WebView (genérico) | Use `window.open()` |
| WebViewLIVE | Use `window.open()` |
| Splash | Integrate into middleware |

---

## Key Files

- Flutter source: `/Users/samanthamaia/development/njob_creator/lib/pages/`
- Flutter models: `/Users/samanthamaia/development/njob_creator/lib/backend/schema/structs/`
- React types: `lib/types/database.ts`
- React store: `lib/store/app-store.ts`
- React UI components: `components/ui/`
- CSS vars: `app/globals.css`
