---
name: Problemas de Segurança - njob
description: Problemas críticos de segurança encontrados na auditoria de abril/2026
type: project
---

## CRÍTICO 1 - Segredo ZegoCloud exposto no .env.local como NEXT_PUBLIC_
Arquivo: njob_creator_web/.env.local
`NEXT_PUBLIC_ZEGO_SERVER_SECRET=19be871f7cb2c940c3cc65e32c825ea6`
Variáveis NEXT_PUBLIC_ são injetadas no bundle do browser. O server secret do ZegoCloud
NÃO pode ser exposto ao cliente. Já existe a API route `/api/zego-token` que gera o token
server-side corretamente — o NEXT_PUBLIC_ deve ser removido imediatamente.

## CRÍTICO 2 - Chaves Stripe e Supabase em .env.local commitável
O arquivo .env.local contém a anon key do Supabase (que é pública por design),
a publishable key do Stripe (pública), e o Zego Server Secret (privado).
O arquivo .env.local nunca deve ser commitado ao repositório.

## CRÍTICO 3 - live_streams atualizado diretamente pelo cliente
useLiveStreamCleanup.ts faz `.update({ status: 'finished' })` diretamente da camada cliente.
Se RLS não estiver restrita a creator_id = auth.uid(), qualquer usuário autenticado pode
marcar live streams de terceiros como 'finished'.

## IMPORTANTE 1 - client_web usa flowType: 'implicit'
flowType `implicit` foi deprecado pelo Supabase em favor de `pkce`. Usar `pkce` é mais seguro
contra ataques de interceptação de tokens.

## IMPORTANTE 2 - Realtime sem filtro de usuário na ConversationsPage (client_web)
O canal `conversations-realtime` escuta INSERT em `messages` sem filtro por usuário.
Funciona apenas se RLS filtrar no banco, mas o evento de invalidação é disparado para todos
os usuários conectados, gerando re-fetches desnecessários.

**Why:** Registrar para não regredir em futuras auditorias.
**How to apply:** Verificar se estes problemas foram corrigidos antes de marcar como resolvidos.
