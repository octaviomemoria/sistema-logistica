# Banco de Dados - Sistema Logística Inteligente

Este diretório contém todos os scripts SQL para criação e configuração do banco de dados Supabase (PostgreSQL).

## Arquivos

### 1. `schema.sql`
Schema principal com todas as tabelas do sistema:

**Tabelas de Cadastro:**
- `regioes` - Regiões de entrega
- `clientes` - Clientes da distribuidora
- `vendedores` - Vendedores
- `transportadoras` - Transportadoras terceirizadas
- `motoristas` - Motoristas da frota própria
- `veiculos` - Veículos da frota própria

**Tabelas de Pedidos:**
- `pedidos` - Pedidos de clientes
- `itens_pedido` - Itens de cada pedido

**Tabelas de Logística:**
- `rotas` - Rotas de entrega planejadas
- `rotas_pedidos` - Relacionamento pedidos x rotas

**Tabelas de Operação:**
- `usuarios` - Usuários do sistema
- `separacoes` - Separação de pedidos
- `itens_separacao` - Itens separados
- `conferencias` - Conferências finais
- `expedicoes` - Expedições/despachos
- `entregas` - Comprovantes de entrega (POD)
- `historico_status_pedidos` - Log de mudanças de status

### 2. `views_triggers.sql`
Views, triggers e funções auxiliares:

**Views:**
- `vw_pedidos_dashboard` - Visão completa de pedidos para o dashboard
- `vw_entregas_atrasadas` - Pedidos com atraso na entrega
- `vw_pedidos_pendentes_expedicao` - Pedidos aguardando expedição

**Triggers:**
- Atualização automática de `updated_at`
- Registro automático de histórico de status

**Funções:**
- `fn_calcular_tempo_expedicao()` - Calcula tempo entre faturamento e expedição
- `fn_calcular_tempo_entrega()` - Calcula tempo entre expedição e entrega
- `fn_gerar_numero_romaneio()` - Gera próximo número de romaneio
- `fn_estatisticas_dashboard()` - Retorna estatísticas para o dashboard

### 3. `rls_policies.sql`
Políticas de Row Level Security (RLS) do Supabase:

**Perfis de Acesso:**
- **Admin:** Acesso total a todas as tabelas
- **Gestor:** Gerencia cadastros, pedidos, rotas e expedições
- **Separador:** Visualiza pedidos e gerencia suas próprias separações
- **Conferente:** Visualiza pedidos e gerencia suas próprias conferências
- **Motorista:** Visualiza rotas e registra entregas

## Como Usar

### Executar no Supabase

1. Acesse seu projeto no [Supabase Dashboard](https://app.supabase.com)
2. Vá em **SQL Editor**
3. Execute os scripts na seguinte ordem:

```sql
-- 1. Criar schema principal
\i schema.sql

-- 2. Criar views e funções
\i views_triggers.sql

-- 3. Configurar políticas de segurança
\i rls_policies.sql
```

Ou copie e cole o conteúdo de cada arquivo diretamente no SQL Editor.

### Dados Iniciais (Seed)

Para popular o banco com dados de teste, execute o arquivo `seed.sql` (será criado posteriormente).

## Diagrama ER

```
clientes ──┐
           ├──> pedidos ──> itens_pedido
vendedores─┤       │
regioes ───┘       ├──> separacoes ──> itens_separacao
                   ├──> conferencias
                   ├──> expedicoes ──┐
                   ├──> entregas     │
                   └──> historico    │
                                     │
transportadoras ──┐                  │
veiculos ─────────┼──> rotas <───────┘
motoristas ───────┘       │
                          └──> rotas_pedidos
```

## Observações

- Todas as tabelas usam UUIDs como chave primária
- Campos `created_at` e `updated_at` são atualizados automaticamente
- RLS está habilitado em todas as tabelas para segurança
- Views otimizadas com índices para performance
- Suporte a geolocalização (PostGIS) para coordenadas de clientes e entregas
