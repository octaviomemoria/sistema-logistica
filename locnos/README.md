# Locnos - Sistema de Gestão de Locação de Equipamentos

Sistema completo de gestão de locação de equipamentos desenvolvido com Next.js 16, TypeScript, PostgreSQL e Prisma.

## 🚀 Funcionalidades

### Módulos Implementados

- ✅ **Gestão de Clientes** - Cadastro completo (PF/PJ) com documentos e referências
- ✅ **Gestão de Inventário** - Controle de equipamentos com estoque e preços dinâmicos
- ✅ **Gestão de Contratos** - Templates personalizáveis para contratos de locação
- ✅ **Gestão de Locações** - CRUD completo com itens, motoristas, e controle financeiro
- ✅ **Ocorrências** - Registro de danos, perdas e limpezas
- ✅ **Dashboard** - Estatísticas em tempo real
- ✅ **Sistema de Autenticação** - Next-Auth com controle de acesso
- ✅ **Interface em Português** - 100% traduzido

### Características

- 🎨 Interface moderna e responsiva
- 🔔 Notificações toast elegantes
- ⚡ Loading states em todas as páginas
- 🌐 100% em português brasileiro
- 📊 Dashboard com estatísticas de negócio
- 💰 Controle financeiro completo (pagamentos, descontos, caução)
- 🚚 Gerenciamento de entregas e devoluções
- 📋 Rastreamento de status de locações
- 💾 Dados de exemplo incluídos

## 🛠️ Tecnologias

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript
- **Backend**: Next.js Server Actions
- **Database**: PostgreSQL com Prisma ORM
- **Autenticação**: NextAuth.js
- **Styling**: Tailwind CSS
- **Icons**: Lucide React

## 📦 Instalação

```bash
# Instalar dependências
npm install

# Configurar banco de dados
cp .env.example .env
# Edite .env com suas credenciais do PostgreSQL

# Executar migrations
npx prisma migrate dev

# Popular banco com dados de exemplo
npm run seed

# Iniciar servidor de desenvolvimento
npm run dev
```

## 🌐 Acesso

- **Aplicação**: http://localhost:3000
- **Prisma Studio**: http://localhost:5555 (execute `npx prisma studio`)

### Credenciais de Teste

Após executar `npm run seed`, use:
- **Email**: admin@locnos.com.br
- **Senha**: admin123

## 📚 Estrutura do Projeto

```
src/
├── app/                        # Next.js App Router
│   ├── api/                   # API Routes
│   │   └── auth/              # NextAuth endpoints
│   ├── dashboard/             # Módulos do dashboard
│   │   ├── customers/         # Gestão de clientes
│   │   ├── inventory/         # Gestão de equipamentos
│   │   ├── contracts/         # Gestão de contratos
│   │   └── rentals/           # Gestão de locações
│   ├── login/                 # Página de login
│   └── layout.tsx             # Layout principal
├── components/                # Componentes React
│   ├── ui/                    # Componentes de UI
│   ├── customers/             # Componentes de clientes
│   ├── inventory/             # Componentes de inventário
│   └── rentals/               # Componentes de locações
├── hooks/                     # Custom hooks
│   └── use-toast.tsx          # Hook de notificações
└── lib/                       # Utilitários
    └── prisma.ts              # Cliente Prisma

prisma/
├── schema.prisma              # Schema do banco
└── seed.ts                    # Script de seeding
```

## 🎯 Funcionalidades Principais

### Gestão de Clientes
- Cadastro de Pessoa Física (PF) e Jurídica (PJ)
- Documentos (CPF/CNPJ) com validação
- Endereço completo
- Upload de documentos
- Referências comerciais
- Controle de status (Ativo, Inadimplente)

### Gestão de Inventário
- Cadastro completo de equipamentos
- Categorias e subcategorias
- Especificações técnicas dinâmicas
- Períodos de locação personalizados (diária, semanal, mensal)
- Controle de estoque (total vs. locado)
- Valores de compra, venda e reposição
- Upload de imagens

### Gestão de Locações
- Criação de locações com múltiplos itens
- Tipos: Diária (pontual) ou Mensal
- Status: Rascunho, Agendado, Ativo, Concluído, Atrasado, Cancelado
- Cálculo automático de valores
- Controle de entregas e devoluções
- Designação de motoristas/freteiros
- Registro de pagamentos
- Gestão de caução e descontos
- Reversibilidade de status

### Ocorrências
- Registro de danos
- Registro de perdas
- Custos de limpeza
- Outras ocorrências
- Controle de resolução

### Dashboard
- Total de clientes ativos
- Equipamentos disponíveis
- Locações ativas
- Receita do período
- Alertas de atrasos
- Ações rápidas

## 🔧 Scripts Disponíveis

```bash
npm run dev          # Servidor de desenvolvimento
npm run build        # Build para produção
npm run start        # Servidor de produção
npm run lint         # Linter
npm run seed         # Popular banco de dados
```

## 📝 Dados de Exemplo

O script de seed cria:
- 1 usuário administrador
- 2 motoristas/freteiros
- 10 clientes (mix de PF e PJ)
- 15 equipamentos em diversas categorias
- 5 locações de exemplo
- 1 template de contrato padrão

Execute `npm run seed` para popular o banco.

## 🎨 UI/UX

- Interface 100% em português brasileiro
- Notificações toast elegantes com feedback visual
- Loading states em todas as operações
- Animações suaves e transições
- Design responsivo para desktop e mobile
- Feedback visual para todas as ações
- Formulários intuitivos com validação

## 🚀 Próximos Passos

- [ ] Geração de contratos em PDF
- [ ] Sistema de impressão de recibos
- [ ] Relatórios financeiros avançados
- [ ] Notificações de vencimento por email/SMS
- [ ] Integração com gateways de pagamento
- [ ] App mobile para motoristas
- [ ] Assinatura eletrônica de contratos
- [ ] Dashboard de analytics avançado

## 📄 Licença

Este projeto foi desenvolvido como parte do sistema Locnos de gestão de locação de equipamentos.

## 🤝 Contribuindo

Para contribuir com o projeto:

1. Fork o repositório
2. Crie uma branch para sua feature (`git checkout -b feature/NovaFuncionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/NovaFuncionalidade`)
5. Abra um Pull Request

## 📞 Suporte

Para suporte e dúvidas, entre em contato através do repositório do projeto.

---

**Desenvolvido com ❤️ usando Next.js e TypeScript**
