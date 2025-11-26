# Frontend Web - Sistema Logística Inteligente

Interface web administrativa desenvolvida com Next.js 14, React e TypeScript.

## Tecnologias

- **Next.js 14** (App Router)
- **React 18**
- **TypeScript**
- **Tailwind CSS** (estilização)
- **Chart.js / Recharts** (gráficos)
- **Zustand** (gerenciamento de estado)
- **Axios** (requisições HTTP)
- **Supabase Client** (autenticação)
- **Lucide React** (ícones)

## Instalação

```bash
# Instalar dependências
npm install

# Copiar arquivo de ambiente
cp .env.example .env

# Editar .env com as URLs da API e Supabase
# ...

# Executar em desenvolvimento
npm run dev

# Build para produção
npm run build

# Executar produção
npm start
```

## Estrutura de Pastas

```
frontend/
├── app/                      # Páginas (Next.js App Router)
│   ├── dashboard/           # Dashboard principal
│   ├── pedidos/             # Gestão de pedidos
│   ├── login/               # Autenticação
│   ├── layout.tsx           # Layout raiz
│   └── globals.css          # Estilos globais
├── components/              # Componentes React reutilizáveis
│   ├── Sidebar.tsx          # Navegação lateral
│   ├── Header.tsx           # Cabeçalho
│   ├── Card.tsx             # Cards genéricos
│   └── StatusBadge.tsx      # Badge de status
├── lib/                     # Bibliotecas e utilitários
│   ├── api.ts               # Cliente API axios
│   ├── supabase.ts          # Cliente Supabase
│   ├── store.ts             # Zustand store
│   └── utils.ts             # Funções auxiliares
├── package.json
├── next.config.js
└── tailwind.config.js
```

## Páginas Implementadas

### ✅ Login (`/login`)
- Autenticação via Supabase Auth
- Validação de credenciais
- Redirecionamento automático
- Design responsivo e moderno

### ✅ Dashboard (`/dashboard`)
- **KPIs em tempo real:**
  - Pedidos pendentes de expedição
  - Expedições realizadas hoje
  - Pedidos em rota
  - Entregas concluídas
- **Gráfico de expedições** (últimos 7 dias)
- **Métricas de tempo:**
  - Tempo médio de expedição
  - Tempo médio de entrega
- **Tabela de expedições de hoje**
- **Alertas:**
  - Pedidos pendentes com atraso
  - Entregas atrasadas
- **Auto-refresh** a cada 30 segundos

### ✅ Pedidos (`/pedidos`)
- **Listagem com filtros:**
  - Busca por número, NF, cliente
  - Filtro por status
  - Paginação (20 por página)
- **Detalhes do pedido** (`/pedidos/[id]`):
  - Informações completas
  - Itens do pedido (tabela)
  - Timeline visual do processo
  - Cards de separação/conferência
  - Cards de expedição/entrega
  - Cliente, vendedor, região

## Componentes Reutilizáveis

### `<Sidebar />`
- Navegação lateral responsiva
- Menu collapse para mobile
- Indicador de página ativa
- Informações do usuário logado

### `<Header />`
- Busca global
- Notificações
- Perfil do usuário

### `<Card />` e `<CardKPI />`
- Card genérico com título e conteúdo
- CardKPI para métricas com ícones e cores

### `<StatusBadge />`
- Badge colorido por status do pedido
- 11 status diferentes

## Gerenciamento de Estado

Usando **Zustand** para estado global:

```typescript
// Store de autenticação
const { usuario, token, setToken, logout } = useAuthStore();
```

## Integração com Backend

Cliente axios configurado em `lib/api.ts`:

```typescript
import api from '@/lib/api';

// Exemplo de uso
const { data } = await api.get('/dashboard/estatisticas');
```

**Interceptors:**
- Adiciona token JWT automaticamente
- Redireciona para login se 401
- Tratamento de erros centralizado

## Formatação de Dados

Utilitários em `lib/utils.ts`:

```typescript
formatarData(data)           // 26/11/2025
formatarDataHora(data)       // 26/11/2025 13:45
formatarMoeda(valor)         // R$ 1.234,56
formatarNumero(valor, 2)     // 123,45
calcularDiasAtraso(data)     // 5
```

## Estilos e Tema

Sistema de design tokens usando Tailwind CSS:

- **Cores primárias:** Blue (primary)
- **Suporte a dark mode** (configurável)
- **Componentes responsivos** (mobile-first)
- **Animações customizadas**
- **Scrollbar personalizado**

## Responsividade

Todos os componentes foram desenvolvidos seguindo Mobile-First:

- **Mobile:** < 768px
- **Tablet:** 768px - 1024px
- **Desktop:** > 1024px

Sidebar colapsa automaticamente em mobile.

## Deploy

### Vercel (Recomendado)

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Netlify

```bash
# Build
npm run build

# Deploy pasta .next
```

### Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
CMD ["npm", "start"]
```

## Variáveis de Ambiente

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anonima
```

## Próximas Páginas

- [ ] Roteirização (montagem de rotas)
- [ ] Relatórios (com exportação)
- [ ] Cadastros (CRUD transportadoras, veículos, etc)
- [ ] Configurações

## Scripts

```bash
npm run dev      # Desenvolvimento (porta 3000)
npm run build    # Build de produção
npm start        # Servidor produção
npm run lint     # ESLint
```

## Performance

- **Code Splitting** automático (Next.js)
- **Image Optimization** (Next Image)
- **Font Optimization** (Next Font)
- **Lazy Loading** de componentes pesados

## Testes

```bash
# Em desenvolvimento
npm test
```

---

**Status:** 🚧 Em desenvolvimento ativo  
**Versão:** 1.0.0-alpha
