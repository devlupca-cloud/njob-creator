# Mapeamento e verificação da integração Stripe

Este documento mapeia todos os pontos do **njob_creator_web** que dependem do Stripe (via Edge Functions do Supabase) e sugere como verificar cada um.

---

## 1. Visão geral

O frontend **não chama o Stripe diretamente**. Toda integração passa por **Edge Functions** do Supabase, que usam a API do Stripe no backend. As chaves do Stripe ficam apenas no Supabase (variáveis de ambiente das functions).

| Fluxo | Edge Function | O que o Stripe faz |
|-------|----------------|--------------------|
| Conta conectada (onboarding) | `create-stripe-connected-account` | Cria/conecta conta Stripe do creator |
| Link para atualizar dados de pagamento | `creator-payout-update-link` | Gera link Stripe Express para payout |
| Checkout de assinatura | `create-checkout-subscription-stripe` | Cria sessão de checkout com `price_id` |
| Produto de pacote (conteúdo) | `create-stripe-pack` | Cria Product + Price no Stripe e associa ao pack |
| Ingresso de live | `create-stripe-live-ticket` | Cria Product + Price no Stripe e registra live_stream |

---

## 2. Edge Functions e chamadas no frontend

### 2.1 `create-stripe-connected-account`

- **Onde é chamada:** `lib/supabase/creator.ts` → `createStripeAccount()`
- **Quando:** Após login/registro, quando o creator não tem `creator_payout_info` ou o status não é `COMPLETED`.
- **Payload:** `{}` (vazio).
- **Resposta esperada:** `{ url: string }` — URL do Stripe Connect onboarding.
- **Fluxo no app:**
  - Login (`app/(auth)/login/page.tsx`) ou Register (`app/(auth)/register/page.tsx`) chama `checkCreatorPayoutStatus()`.
  - Se status pendente → redireciona para `/stripe-setup?url=...`.
  - Página `app/(onboarding)/stripe-setup/page.tsx` exibe o link para o usuário completar o cadastro no Stripe.

**Como verificar:**

1. Fazer login com um usuário **creator** que ainda não completou o Stripe.
2. Deve redirecionar para `/stripe-setup` e exibir um link clicável.
3. Abrir o link e conferir se é a página de onboarding do Stripe Connect.
4. No Supabase: variáveis da Edge Function devem ter `STRIPE_SECRET_KEY` (e possivelmente `STRIPE_WEBHOOK_SECRET` se a function depender de webhook para atualizar `creator_payout_info`).

---

### 2.2 `creator-payout-update-link`

- **Onde é chamada:**
  - `app/(app)/financial/page.tsx` — botão “Atualizar dados de pagamento”.
  - `app/(app)/payments/add/page.tsx` — “Adicionar cartão / conta”.
- **Payload:** Nenhum (POST sem body ou `{}`).
- **Resposta esperada:** `{ url: string }` — link Stripe para atualizar dados de recebimento.

**Como verificar:**

1. Ir em **Financeiro** ou **Pagamentos → Adicionar cartão**.
2. Clicar no botão que chama a function; deve abrir uma nova aba com o Stripe.
3. Confirmar que a URL é do Stripe (Express ou Dashboard).

---

### 2.3 `create-checkout-subscription-stripe`

- **Onde é chamada:** `lib/api/subscription.ts` → `createSubscriptionCheckout(priceId, accessToken)`.
- **Usado em:**
  - `app/(onboarding)/subscription/page.tsx` (onboarding).
  - `app/(app)/subscription-plans/page.tsx` (planos dentro do app).
- **Payload:** `{ price_id: string }` — `stripe_price_id` do plano (tabela `subscription_plans` ou equivalente).
- **Resposta esperada:** `{ url: string }` — URL da sessão de checkout do Stripe.

**Como verificar:**

1. Garantir que os planos no banco tenham `stripe_price_id` preenchido (IDs de Price do Stripe).
2. Na tela de assinatura, clicar em “Assinar” em um plano; deve redirecionar para o checkout do Stripe.
3. No Stripe Dashboard: **Products** e **Prices** devem existir e estar ativos; os IDs devem bater com o que está no banco.

---

### 2.4 `create-stripe-pack`

- **Onde é chamada:** `lib/api/content.ts` → `createStripePack(pPayload, token)`.
- **Usado em:** `app/(app)/content/create/page.tsx` — ao criar pacote de conteúdo (após criar o pack no Supabase, chama essa function para criar produto no Stripe).
- **Payload:** `{ p_payload: { pack_id, title, price, cover_image_url, items, ... } }` (espelha o que o Flutter enviava).
- **Resposta esperada:** `{ status?: boolean, message?: string }`.

**Como verificar:**

1. Criar um novo pacote em **Venda de conteúdo** com título, preço e itens.
2. Se a function estiver ok: pacote criado e no Stripe aparece um Product (e Price) vinculado.
3. Se a function falhar: o app mostra toast de aviso mas o pacote continua criado no Supabase (fallback).
4. No banco, a tabela de packs deve ter `stripe_product_id` / `stripe_price_id` preenchidos quando a function tiver sucesso.

---

### 2.5 `create-stripe-live-ticket`

- **Onde é chamada:** `components/home/NovoEventoModal.tsx` — ao submeter o formulário “Novo evento” (live).
- **Payload:**
  - `title`, `description`, `scheduled_start_time` (ISO), `ticket_price`, `estimated_duration_minutes`.
- **Resposta esperada:** Objeto com `live_stream` (incluindo `stripe_product_id`, `stripe_price_id`, etc.).

**Como verificar:**

1. Na **Home** ou **Agenda**, abrir “Novo evento”, preencher título, data/hora, valor (≥ R$ 10) e duração.
2. Submeter; deve aparecer toast de sucesso e o evento na lista.
3. No Stripe Dashboard: novo Product e Price para o ingresso da live.
4. Na tabela `live_streams` (ou view usada no app): `stripe_product_id` e `stripe_price_id` preenchidos.

---

## 3. Dados no banco que dependem do Stripe

| Tabela / fonte | Campos Stripe | Uso |
|----------------|---------------|-----|
| `profiles` / conta creator | `stripe_account_id` (pode estar em outra tabela de conta) | Conta conectada Stripe |
| `creator_payout_info` | Status (ex.: COMPLETED), payout_method | Onboarding e link de atualização |
| `subscription_plans` | `stripe_price_id` | Checkout de assinatura |
| `packs` (ou equivalente) | `stripe_product_id`, `stripe_price_id` | Pacotes de conteúdo |
| `live_streams` | `stripe_product_id`, `stripe_price_id` | Ingressos de live |

Os tipos em `lib/types/database.ts` refletem esses campos (ex.: `stripe_price_id`, `stripe_product_id` em várias views/tabelas).

---

## 4. Checklist de verificação da integração Stripe

### 4.1 Configuração (Supabase / Stripe)

- [ ] No projeto Supabase, as Edge Functions listadas acima estão deployadas e com variáveis de ambiente definidas (ex.: `STRIPE_SECRET_KEY`).
- [ ] No Stripe Dashboard, existe um produto (e preços) para **planos de assinatura**; os IDs de Price estão salvos em `subscription_plans.stripe_price_id`.
- [ ] Webhooks do Stripe (se usados para atualizar `creator_payout_info` ou pagamentos) estão configurados e apontando para a URL da Edge Function ou do Supabase indicada na doc do backend.

### 4.2 Fluxos no app

- [ ] **Onboarding Stripe:** login como creator sem payout completo → redireciona para `/stripe-setup` e o link abre o Stripe.
- [ ] **Atualizar pagamento:** Financeiro ou Pagamentos → Adicionar/atualizar → abre link do Stripe.
- [ ] **Assinatura:** escolher plano com `stripe_price_id` → redireciona para checkout Stripe e concluir (teste com cartão de teste).
- [ ] **Pacote de conteúdo:** criar pacote → Product/Price criados no Stripe e IDs salvos no pack (ou toast de fallback em caso de erro).
- [ ] **Live:** criar evento com valor → Product/Price de ingresso criados no Stripe e `live_streams` com IDs preenchidos.

### 4.3 Ambiente

- [ ] `NEXT_PUBLIC_SUPABASE_URL` está definido; as chamadas às Edge Functions usam essa base.
- [ ] Usuário de teste está com role **creator** e, se necessário, com `creator_payout_info` em estado conhecido (ex.: COMPLETED para pular onboarding).

---

## 5. Onde está cada chamada no código

| Arquivo | Função / trecho | Edge Function |
|---------|------------------|---------------|
| `lib/supabase/creator.ts` | `createStripeAccount()` | `create-stripe-connected-account` |
| `app/(app)/financial/page.tsx` | `getPayoutLink()` | `creator-payout-update-link` |
| `app/(app)/payments/add/page.tsx` | `openPayoutLink()` | `creator-payout-update-link` |
| `lib/api/subscription.ts` | `createSubscriptionCheckout()` | `create-checkout-subscription-stripe` |
| `lib/api/content.ts` | `createStripePack()` | `create-stripe-pack` |
| `components/home/NovoEventoModal.tsx` | `supabase.functions.invoke(...)` | `create-stripe-live-ticket` |

Para uma verificação ponta a ponta, executar cada fluxo acima e conferir no **Stripe Dashboard** (Products, Prices, Connect, Checkout) e no **Supabase** (tabelas e logs das Edge Functions) se os dados batem com o esperado.
