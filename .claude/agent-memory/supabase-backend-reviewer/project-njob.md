---
name: Projeto njob - Arquitetura Backend
description: Estrutura geral, tabelas, RPCs, Edge Functions e padrões do projeto njob
type: project
---

## Apps
- **njob_client_web**: React SPA (Vite/React Router). Supabase client: `@supabase/supabase-js` direto, flowType `implicit`.
- **njob_creator_web**: Next.js 14 App Router. Supabase client: `@supabase/ssr` (browser + server + middleware).

## Tabelas acessadas diretamente
profiles, creator_description, profile_images, profile_settings, profile_views, profile_documents,
content_likes, creator_favorites, creator_notification_settings, creator_payout_info,
creator_availability, creator_availability_slots, creator_subscriptions,
live_streams, live_stream_tickets, one_on_one_calls,
packs, pack_items, pack_purchases,
conversations, conversation_participants, messages,
notifications, coupons, coupon_usage,
transactions, payouts, platform_settings, processed_webhook_events,
subscription_plans, saved_cards

## Views usadas
vw_creator_conversations, vw_messages, vw_creator_events, total_gasto_cliente

## RPCs chamadas
get_creators_filtered (client), get_creator_details (client), toggle_creator_like (client),
get_available_coupons (client + creator), get_profile_info (creator), get_packs_by_creator (creator),
create_pack_with_items (creator), get_pack_with_items (creator), update_pack_with_items (creator),
get_creator_daily_slots (creator), save_creator_availability (creator), get_creator_metrics (creator),
upsert_profile_images (creator)

## Edge Functions chamadas
create-stripe-connected-account, create-stripe-pack, create-stripe-live-ticket,
create-checkout-subscription-stripe, creator-payout-update-link, get-creator-financial-statement

## Storage buckets
- `images` (público) — fotos de perfil, imagens de packs
- `avatars` (público) — avatares do client_web

## Padrão de auth
- client_web: onAuthStateChange + Zustand (njob-auth), flowType implicit, in-memory lock para evitar race condition no token refresh
- creator_web: @supabase/ssr com middleware Next.js, cookie-based session, getUser() no middleware

**Why:** Registrar para orientar futuras revisões do mesmo projeto.
**How to apply:** Consultar antes de qualquer auditoria ou implementação de novas features.
