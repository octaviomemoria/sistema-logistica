# Locnos Rental Management System

A full-stack system to manage equipment rental for Locnos and other rental companies. Focused on inventory control, reservations/contracts, finance/fiscal, logistics, maintenance, CRM, and multiunit.

## Stack
- API: Node.js (Fastify + TypeScript) with Prisma ORM (PostgreSQL)
- DB: PostgreSQL (Docker)
- Auth: JWT + basic RBAC roles
- Frontend: (placeholder) – will add Next.js admin portal

## Core Modules (phase 1)
- Cadastro: clientes, fornecedores, categorias, modelos e itens (serializados)
- Estoque: status, movimentações, multiunidade
- Reservas e Contratos: cotações, aprovações, conversão, devoluções parciais
- Financeiro: faturas (boletos/NF-e placeholders), pagamentos
- Logística: agendamento de entregas/retiradas
- Manutenção: preventiva e corretiva

## Getting Started (Windows PowerShell)

0. Instale Node.js e habilite pnpm (se ainda não tiver)
```
# Opção A: via winget (recomendado)
winget install OpenJS.NodeJS.LTS

# Ative o Corepack para usar pnpm sem instalar globalmente
corepack enable; corepack prepare pnpm@9.0.0 --activate

# Verifique
node -v; pnpm -v
```

1. Copie env e suba Postgres com Docker
```
Copy-Item .env.example .env
cd docker; docker compose up -d; cd ..
```

2. Instale dependências com pnpm e gere Prisma
```
pnpm install
pnpm prisma:generate
# Crie o schema e rode seed (opcional)
pnpm db:push
pnpm db:seed
```

3. Rode a API
```
cd apps/api
pnpm dev
```
API em http://localhost:3333 | docs em /docs

## Availability rules (resumo)
- Um item só pode ser reservado/alugado se não houver sobreposição com reservas aprovadas/convertidas ou contratos ativos/em atraso.
- Status dos itens: AVAILABLE, RESERVED, RENTED, MAINTENANCE, INACTIVE.
- Suporte a QR Code/Código de barras via campos `serialNumber`/`qrCode`/`barcodeSku`.

## Roadmap
- [ ] Next.js Admin portal (cadastros, reservas, contratos, dashboards)
- [ ] Integrações: Boleto (Juno/Asaas), NFS-e
- [ ] Relatórios (rentabilidade, utilização, faturamento)
- [ ] Otimização de rotas de logística
- [ ] Multiunidade completa (transferências, centros de custo)

## Dev Notes
- Prisma schema em `packages/db/prisma/schema.prisma`.
- Seeds em `packages/db/prisma/seed.ts` (ajuste o hash de senha do admin).
- Endpoints principais em `apps/api/src/views/*`.
