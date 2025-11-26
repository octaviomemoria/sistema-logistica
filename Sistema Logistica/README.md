# Sistema Logística Inteligente

Sistema completo de gestão de expedição de pedidos para distribuidoras, desenvolvido em português com integração a ERP SAP Business One e WMS Expert.

## 📋 Visão Geral

O Sistema Logística Inteligente é uma plataforma completa que automatiza e otimiza os processos de expedição, garantindo entregas pontuais e rastreabilidade completa. O sistema integra todas as etapas desde o faturamento até a entrega final com comprovante digital.

## 🏗 Arquitetura

**Stack Tecnológico:**
- **Backend:** Node.js + Express + TypeScript
- **Frontend:** Next.js 14 + React + TypeScript + Tailwind CSS
- **Banco de Dados:** Supabase (PostgreSQL)
- **Autenticação:** Supabase Auth com Row Level Security (RLS)
- **Armazenamento:** Google Drive API (comprovantes de entrega)
- **Mobile:** React Native + Expo (planejado)

## 📂 Estrutura do Projeto

```
Sistema Logistica/
├── database/                    # Scripts SQL do banco
│   ├── schema.sql              # Tabelas principais
│   ├── views_triggers.sql      # Views, triggers e funções
│   ├── rls_policies.sql        # Políticas de segurança
│   └── README.md               # Documentação
├── backend/                     # API REST Node.js
│   ├── src/
│   │   ├── config/             # Configurações (Supabase, Google Drive)
│   │   ├── middlewares/        # Auth, error handler
│   │   ├── routes/             # Rotas da API
│   │   ├── utils/              # Logger, helpers
│   │   └── server.ts           # Servidor principal
│   ├── package.json
│   └── README.md
└── frontend/                    # Aplicação Web Next.js
    ├── app/                     # Páginas (App Router)
    ├── components/              # Componentes React
    ├── lib/                     # Bibliotecas e utils
    ├── package.json
    └── (em desenvolvimento)
```

## ✨ Funcionalidades Implementadas

### 🗄️ Banco de Dados (Completo)
- ✅ 16 tabelas principais:
  - Cadastros: clientes, vendedores, regiões, transportadoras, motoristas, veículos
  - Logística: pedidos, itens_pedido, rotas, rotas_pedidos
  - Operação: separacoes, itens_separacao, conferencias, expedicoes, entregas
  - Sistema: usuarios, historico_status_pedidos
- ✅ Views otimizadas para dashboard e relatórios
- ✅ Triggers automáticos (updated_at, histórico de status)
- ✅ Funções auxiliares (cálculo de tempo, geração de romaneio, estatísticas)
- ✅ Row Level Security (RLS) implementado com 5 perfis de usuário

### 🔧 Backend API (Completo)
- ✅ Autenticação e autorização via Supabase JWT
- ✅ Endpoints completos:
  - **Pedidos:** Listagem, detalhes, atualização de status, timeline
  - **Dashboard:** Estatísticas em tempo real, alertas, gráficos
  - **Separação:** Disponiveis, iniciar, confirmar itens, finalizar
  - **Rotas:** CRUD completo, otimização, adição de pedidos
  - **Entregas:** Rotas do motorista, registro de POD com upload
  - **Relatórios:** Expedições, entregas, desempenho, tempos médios
  - **Cadastros:** Clientes, vendedores, transportadoras, veículos, motoristas
  - **Integrações:** Webhooks SAP/WMS, status de conectividade
- ✅Integração Google Drive para upload de assinaturas e fotos
- ✅ Middleware de tratamento de erros centralizado
- ✅ Logger com Winston (arquivos de log)
- ✅ Validação de dados com express-validator

### 🎨 Frontend Web (Em Desenvolvimento)
- ✅ Projeto Next.js 14 configurado
- ✅ Tailwind CSS com sistema de design tokens
- ✅ Suporte a dark mode
- ⏳ Páginas principais (em andamento)
- ⏳ Componentes reutilizáveis (em andamento)

## 🚀 Como Executar

### Pré-requisitos
- Node.js 20+
- Conta no Supabase
- Credenciais do Google Drive API (opcional)

### 1. Configurar Banco de Dados

Acesse seu projeto Supabase e execute os scripts na ordem:

```sql
-- 1. Criar tabelas
\i database/schema.sql

-- 2. Criar views e funções
\i database/views_triggers.sql

-- 3. Configurar segurança
\i database/rls_policies.sql
```

### 2. Backend

```bash
cd backend

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Editar .env com suas credenciais

# Executar em desenvolvimento
npm run dev
```

A API estará disponível em `http://localhost:3001`

### 3. Frontend

```bash
cd frontend

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Editar .env com as URLs

# Executar em desenvolvimento
npm run dev
```

O frontend estará disponível em `http://localhost:3000`

## 👥 Perfis de Usuário

O sistema suporta 5 perfis com permissões específicas:

1. **Admin** - Acesso total ao sistema
2. **Gestor** - Gerencia operações, cadastros e relatórios
3. **Separador** - Opera separação de pedidos
4. **Conferente** - Confere pedidos antes da expedição
5. **Motorista** - Registra entregas e visualiza rotas

## 📊 Principais Indicadores (Dashboard)

- Pedidos pendentes de expedição
- Pedidos com atraso (pendentes > 3 dias)
- Expedições realizadas hoje
- Pedidos em rota
- Entregas concluídas hoje
- Entregas atrasadas
- Tempo médio de expedição (horas)
- Tempo médio de entrega (horas)

## 🔄 Fluxo de Processo

```
1. Pedido Faturado (ERP) 
   ↓
2. Separação (App Mobile/Web)
   ↓
3. Conferência (App Mobile/Web)
   ↓
4. Montagem de Rotas (Web)
   ↓
5. Expedição/Despacho (Web)
   ↓
6. Entrega com POD (App Mobile)
   ↓
7. Comprovante Digital (Web/App)
```

## 📱 Apps Móveis (Planejado)

### App Separadores/Conferentes
- Login e autenticação
- Lista de pedidos para separar
- Leitor de código de barras
- Confirmação de itens
- Interface de conferência

### App Motoristas
- Rotas do dia
- Lista de entregas
- Navegação/mapa
- Captura de assinatura digital
- Foto do comprovante
- Registro de ocorrências

## 🔗 Integrações

- **SAP Business One** - Importação automática de pedidos faturados
- **WMS Expert** - Sincronização de status de separação
- **Google Drive** - Armazenamento de comprovantes (assinaturas e fotos)

## 📝 Próximos Passos

1. **Frontend Web** (Em andamento)
   - [ ] Dashboard completo
   - [ ] Gestão de pedidos
   - [ ] Roteirização com mapa
   - [ ] Relatórios
   - [ ] Impressão de etiquetas e romaneios

2. **Apps Móveis**
   - [ ] App separadores React Native
   - [ ] App motoristas React Native

3. **Funcionalidades Avançadas**
   - [ ] Otimização automática de rotas (algoritmo TSP)
   - [ ] Notificações push
   - [ ] Tracking GPS em tempo real
   - [ ] Dashboard para TV/monitor

## 📄 Licença

Projeto proprietário - Todos os direitos reservados

## 👨‍💻 Desenvolvimento

Sistema desenvolvido em acordo com as melhores práticas de desenvolvimento moderno:
- TypeScript para type-safety
- Padrão REST para APIs
- Arquitetura em camadas (MVC)
- Segurança com RLS e JWT
- Logs centralizados
- Tratamento de erros robusto
- Código todo em português (incluindo BD e comentários)

---

**Status:** 🚧 Em desenvolvimento ativo
**Versão:** 1.0.0-alpha
