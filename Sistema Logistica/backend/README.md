# Backend API - Sistema Logística Inteligente

Backend Node.js + Express + TypeScript para o Sistema Logística Inteligente.

## Tecnologias

- **Node.js** 20+
- **Express** 4.x
- **TypeScript** 5.x
- **Supabase** (PostgreSQL + Auth)
- **Google Drive API** (armazenamento de comprovantes)
- **Winston** (logging)
- **Multer** (upload de arquivos)

## Pré-requisitos

1. Node.js 20 ou superior
2. Conta no Supabase com projeto configurado
3. Credenciais do Google Drive API
4. (Opcional) Acesso às APIs do SAP Business One e WMS Expert

## Instalação

```bash
# Instalar dependências
npm install

# Copiar arquivo de ambiente
cp .env.example .env

# Editar .env com suas credenciais
# ...

# Executar em desenvolvimento
npm run dev

# Build para produção
npm run build

# Executar produção
npm start
```

## Variáveis de Ambiente

Edite o arquivo `.env` com as seguintes variáveis:

```env
# Servidor
PORT=3001
NODE_ENV=development

# Supabase
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua-chave-anonima
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role

# Google Drive
GOOGLE_DRIVE_CLIENT_ID=...
GOOGLE_DRIVE_CLIENT_SECRET=...
GOOGLE_DRIVE_REFRESH_TOKEN=...
GOOGLE_DRIVE_FOLDER_ID=...

# SAP Business One (opcional)
SAP_B1_BASE_URL=...
SAP_B1_USERNAME=...
SAP_B1_PASSWORD=...

# WMS Expert (opcional)
WMS_EXPERT_BASE_URL=...
WMS_EXPERT_API_KEY=...
```

## Estrutura de Pastas

```
backend/
├── src/
│   ├── config/          # Configurações (Supabase, Google Drive)
│   ├── middlewares/     # Middlewares (auth, errorHandler)
│   ├── routes/          # Rotas da API
│   ├── services/        # Serviços de negócio
│   ├── utils/           # Utilitários (logger)
│   └── server.ts        # Servidor principal
├── dist/                # Build de produção
├── logs/                # Logs da aplicação
├── package.json
└── tsconfig.json
```

## Rotas da API

### Autenticação
- Autenticação via Supabase Auth
- Token JWT no header: `Authorization: Bearer <token>`

### Endpoints Principais

#### Pedidos (`/api/pedidos`)
- `GET /` - Listar pedidos (com filtros)
- `GET /:id` - Detalhes do pedido
- `PATCH /:id/status` - Atualizar status
- `GET /:id/timeline` - Timeline completa

#### Dashboard (`/api/dashboard`)
- `GET /estatisticas` - Estatísticas gerais
- `GET /pedidos-pendentes` - Pedidos pendentes
- `GET /entregas-atrasadas` - Entregas atrasadas
- `GET /expedicoes-hoje` - Expedições do dia
- `GET /grafico-expedicoes` - Dados para gráficos

#### Separação (`/api/separacao`)
- `GET /disponiveis` - Pedidos para separar
- `POST /iniciar` - Iniciar separação
- `POST /:id/item` - Confirmar item separado
- `POST /:id/finalizar` - Finalizar separação

#### Rotas (`/api/rotas`)
- `GET /` - Listar rotas
- `POST /` - Criar rota
- `GET /:id` - Detalhes da rota
- `POST /:id/pedidos` - Adicionar pedidos à rota
- `PATCH /:id/status` - Atualizar status da rota

#### Entregas (`/api/entregas`)
- `GET /minhas-rotas` - Rotas do motorista
- `POST /` - Registrar entrega (POD)
- `GET /:pedido_id/comprovante` - Ver comprovante

#### Relatórios (`/api/relatorios`)
- `GET /expedicoes` - Relatório de expedições
- `GET /entregas` - Relatório de entregas
- `GET /desempenho-separadores` - Desempenho
- `GET /tempo-medio` - Tempos médios

#### Cadastros (`/api/cadastros`)
- `GET /clientes` - Listar clientes
- `GET /vendedores` - Listar vendedores
- `GET /transportadoras` - Listar transportadoras
- `POST /transportadoras` - Criar transportadora
- `GET /veiculos` - Listar veículos
- `POST /veiculos` - Criar veículo
- `GET /motoristas` - Listar motoristas
- `POST /motoristas` - Criar motorista

#### Integrações (`/api/integracao`)
- `POST /sap/webhook` - Webhook SAP
- `POST /wms/webhook` - Webhook WMS
- `GET /status` - Status das integrações

## Autenticação e Autorização

O sistema usa Supabase Auth + Row Level Security (RLS).

### Perfis de Usuário:
- **admin** - Acesso total
- **gestor** - Gerencia operações e cadastros
- **separador** - Opera separação de pedidos
- **conferente** - Conf ere pedidos
- **motorista** - Registra entregas

## Deploy

### Opções de Hospedagem

1. **Railway** (recomendado)
   ```bash
   # Instalar Railway CLI
   npm i -g @railway/cli
   
   # Login e deploy
   railway login
   railway init
   railway up
   ```

2. **Render**
   - Conectar repositório GitHub
   - Configurar variáveis de ambiente
   - Deploy automático

3. **VPS própria** (Ubuntu/Debian)
   ```bash
   # Instalar Node.js
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # Clonar código e instalar
   git clone <repo>
   cd backend
   npm install
   npm run build
   
   # Usar PM2 para gerenciar processo
   npm install -g pm2
   pm2 start dist/server.js --name logistica-api
   pm2 save
   pm2 startup
   ```

## Logs

Os logs são salvos na pasta `logs/`:
- `error.log` - Apenas erros
- `combined.log` - Todos os logs

Em desenvolvimento, logs também aparecem no console.

## Testes

```bash
# Executar testes
npm test

# Com coverage
npm test -- --coverage
```

## Suporte

Para problemas ou dúvidas, consulte a documentação do Supabase e do Express.
