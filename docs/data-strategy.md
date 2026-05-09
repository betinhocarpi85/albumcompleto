# Estrategia de persistencia de dados

## Objetivo

Definir uma unica fonte de verdade para reduzir divergencia entre sessao atual e outros dispositivos.

## Fonte de verdade

- **Supabase (obrigatorio):**
  - `profiles`
  - `coladas`
  - `anuncios`
  - `propostas`
  - `pedidos`
  - `user_preferences`

- **localStorage (permitido apenas como estado temporario):**
  - carrinho de compra em andamento
  - flags/transicoes de UI

## Regras

1. Qualquer dado de negocio que precise sobreviver a troca de dispositivo deve ser salvo no Supabase.
2. O front nao deve depender de valores exclusivos de `localStorage` para fluxos de negocio.
3. Fallback local deve ser opcional e nunca substituir escrita no banco.
4. Novas features devem entrar com contrato de dados no `lib/db.ts`.

## Plano de convergencia

- Curto prazo:
  - manter carrinho local e sincronizar pedidos/anuncios com Supabase.
  - usar RPC `get_matches_for_album` e fallback client-side apenas para resiliencia.
- Medio prazo:
  - mover carrinho para tabela dedicada no banco.
  - remover mocks legados de propostas/pedidos do `lib/store.ts`.
