# Album Completo

Plataforma de colecionadores para gerenciar album, anunciar figurinhas, encontrar matches (troca, venda e doacao) e finalizar checkout.

## Requisitos

- Node.js 20+
- NPM 10+
- Projeto Supabase criado

## Variaveis de ambiente

Crie `/.env.local` com:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=SUA_ANON_KEY
```

## Setup do banco (Supabase)

1. Abra o SQL Editor do Supabase.
2. Execute o conteudo de `supabase/schema.sql`.
3. Confirme que as RPCs abaixo existem:
   - `public.get_matches_for_album(text)`
   - `public.delete_my_account()`

## Scripts

- `npm run dev` - sobe ambiente de desenvolvimento
- `npm run build` - gera build de producao
- `npm run start` - roda build de producao
- `npm run lint` - lint com ESLint
- `npm run test` - testes unitarios com Vitest
- `npm run test:watch` - testes em watch mode

## Executando localmente

```bash
npm install
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

## Estrutura principal

- `app/` - rotas e paginas (album, anuncios, matches, checkout, conta)
- `components/` - componentes reutilizaveis
- `lib/db.ts` - acesso ao Supabase
- `lib/store.ts` - persistencia local temporaria (carrinho e apoios de UX)
- `supabase/schema.sql` - schema, policies e funcoes SQL
- `docs/data-strategy.md` - estrategia de persistencia adotada

## Observacoes

- Dados criticos de negocio devem viver no Supabase.
- `localStorage` deve ser usado como cache/estado temporario de interface.
