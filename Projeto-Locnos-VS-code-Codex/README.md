# Locnos – Sistema Web para Locadoras de Equipamentos

Locnos é uma aplicação SaaS multi-tenant construída com React, TypeScript, Supabase, TailwindCSS e React Query para simplificar a operação diária de locadoras de equipamentos. O sistema oferece autenticação completa, isolamento por organização (RLS), dashboards operacionais e financeiros, módulos de cadastros e integrações com Supabase Storage e a API Gemini para análises assistidas por IA.

## Principais recursos

- **Layout SPA responsivo** com sidebar fixa, header contextual e suporte a tema claro/escuro (persistido).
- **Autenticação Supabase** (login, cadastro de locadora, sessão persistente, gestão de usuários e perfis).
- **Gestão de Equipamentos** com CRUD completo, upload de imagens para o Storage, importação CSV, planos de preço e exclusão em lote segura.
- **Clientes e Locações** com filtros, validações, histórico, visualização em lista e calendário, controle de estoque, pagamentos e encerramento automatizado.
- **Dashboards** com KPIs, gráficos (Recharts), cartões de status e visão por perfil (admin, gerente, atendente e técnico).
- **Financeiro e Relatórios** com indicadores de faturamento, inadimplência, exportação CSV e perguntas em linguagem natural via Gemini (quando configurado).
- **Módulos adicionais**: Ocorrências, Tarefas internas, Motoristas e Modelos de Contrato com geração dinâmica.
- **Componentes reutilizáveis** (Modal genérico, StatCards, cabeçalhos ordenáveis, calendário customizado, dropzone de upload, toasts).

## Estrutura de pastas

```
src/
├─ components/        # Layout, UI base, gráficos, calendário
├─ contexts/          # AuthProvider e ThemeProvider
├─ hooks/             # Hooks customizados (ex: useAuth)
├─ pages/             # Cada módulo de negócio
├─ routes/            # Rotas protegidas e layout principal
├─ services/          # Clientes Supabase e chamadas por domínio
├─ types/             # Tipos/Interfaces compartilhadas
└─ utils/             # Formatadores, constantes e helpers de CSV
```

## Configuração

1. Copie `.env.example` para `.env` e informe suas credenciais:

```bash
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_ANON_KEY=<public-anon-key>
VITE_GEMINI_API_KEY=<opcional, para análises IA>
```

2. Instale as dependências:

```bash
npm install
```

3. Execute em desenvolvimento:

```bash
npm run dev
```

4. Build de produção (já validado via `npm run build`):

```bash
npm run build
```

## Integrações Supabase

- **Banco**: utilize o script fornecido no enunciado para criar tabelas, enums e políticas RLS. Cada registro recebe `organization_id` automaticamente no frontend.
- **Storage**: buckets `imagens-equipamentos`, `documentos-clientes` e `contratos-gerados` são referenciados em `src/utils/constants.ts`.
- **Edge Function para convites**: o frontend chama `supabase.functions.invoke("invite-user")`. Crie a função no Supabase para enviar convites com a Service Key.

## Considerações

- O layout é responsivo e totalmente tipado em TypeScript.
- Toasts, loaders e validações via React Hook Form oferecem feedback claro.
- O projeto usa React Query para cache e sincronização com Supabase.
- Todos os módulos respeitam permissões de perfil e isolamento multi-tenant.

Sinta-se à vontade para adaptar estilos, criar novos relatórios e evoluir as integrações conforme o seu fluxo no Supabase. Boas locações! 🎯
