# 🚀 Guia de Deploy - Sistema Logística

## Visão Geral

Este guia mostra como fazer o deploy do sistema em produção:
- **Frontend (Next.js)** → Vercel
- **Backend (Node.js/Express)** → Render.com
- **Banco de Dados** → Supabase (já está na nuvem)

---

## 📦 Parte 1: Deploy do Backend (Render.com)

### Passo 1: Criar conta no Render

1. Acesse https://render.com
2. Clique em **"Get Started"**
3. Faça login com sua conta GitHub

### Passo 2: Criar Web Service

1. No dashboard, clique em **"New +"** → **"Web Service"**
2. Conecte seu repositório GitHub: `octaviomemoria/sistema-logistica`
3. Clique em **"Connect"** ao lado do repositório

### Passo 3: Configurar o Service

Preencha os campos:

- **Name:** `sistema-logistica-backend` (ou o nome que preferir)
- **Region:** `Ohio (US East)` (mais próximo do Brasil)
- **Branch:** `main`
- **Root Directory:** `backend`
- **Runtime:** `Node`
- **Build Command:** `npm install && npm run build`
- **Start Command:** `npm start`
- **Instance Type:** `Free`

### Passo 4: Adicionar Variáveis de Ambiente

Role até **"Environment Variables"** e adicione (clique em **"Add from .env"** e cole):

```
NODE_ENV=production
PORT=3001
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua-chave-anonima
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role
ALLOWED_ORIGINS=https://seu-frontend.vercel.app
LOG_LEVEL=info
```

⚠️ **IMPORTANTE:** Substitua pelos valores reais do seu Supabase!

### Passo 5: Deploy

1. Clique em **"Create Web Service"**
2. Aguarde o build (5-10 minutos na primeira vez)
3. Quando aparecer **"Live"**, copie a URL (ex: `https://sistema-logistica-backend.onrender.com`)

### Passo 6: Testar

Abra no navegador: `https://sua-url.onrender.com/api/health`

Deve retornar algo como:
```json
{
  "status": "ok",
  "timestamp": "2025-11-27T..."
}
```

---

## 🎨 Parte 2: Deploy do Frontend (Vercel)

### Passo 1: Acessar Vercel

1. Acesse https://vercel.com
2. Faça login com GitHub
3. No dashboard, procure seu projeto (se já criou) ou clique em **"Add New Project"**

### Passo 2: Configurar Projeto (SE JÁ EXISTE)

Se você já tentou fazer deploy e deu erro:

1. Vá no seu projeto na Vercel
2. Clique em **"Settings"** (menu lateral)
3. Vá em **"General"**
4. Procure **"Root Directory"**
5. Clique em **"Edit"**
6. Digite: `frontend`
7. Clique em **"Save"**

### Passo 3: Configurar Variáveis de Ambiente

Ainda em **Settings**:

1. Vá em **"Environment Variables"**
2. Adicione as variáveis:

```
NEXT_PUBLIC_API_URL=https://sistema-logistica-backend.onrender.com/api
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anonima
```

⚠️ Use a URL do backend que você copiou no Passo 1.5!

3. Clique em **"Save"**

### Passo 4: Refazer Deploy

1. Vá na aba **"Deployments"**
2. Clique nos **3 pontinhos (...)** do último deploy
3. Clique em **"Redeploy"**
4. Aguarde 2-3 minutos

### Passo 5: Acessar o Sistema

Quando aparecer **"Ready"**, clique em **"Visit"** ou acesse a URL (ex: `https://sistema-logistica.vercel.app`)

---

## ✅ Verificação Final

### Checklist de Funcionamento

- [ ] Backend retorna `{"status":"ok"}` na rota `/api/health`
- [ ] Frontend carrega a tela de login
- [ ] Consegue fazer login (testar com usuário do Supabase)
- [ ] Dashboard carrega os dados corretamente

---

## 🔧 Troubleshooting

### Frontend não conecta no Backend

**Erro no console:** `Failed to fetch` ou `Network Error`

**Solução:**
1. Verifique se a variável `NEXT_PUBLIC_API_URL` está correta na Vercel
2. Verifique se o backend está "Live" no Render
3. Adicione a URL do frontend em `ALLOWED_ORIGINS` no backend (Render)

### Backend retorna erro 500

**Solução:**
1. No Render, vá em **Logs** para ver o erro
2. Verifique se as variáveis de ambiente estão corretas
3. Certifique-se que o Supabase está acessível

### "This Serverless Function has crashed"

**Causa:** A Vercel está tentando rodar o código do backend (que não é serverless)

**Solução:** Confirme que você configurou o **Root Directory** como `frontend` nas Settings da Vercel

---

## 📝 Notas Importantes

1. **Render Free Tier:** O backend pode "dormir" após 15 min sem uso. A primeira requisição pode demorar ~30s.
2. **Supabase:** Certifique-se que o Supabase permite conexões do IP do Render (geralmente já permite).
3. **HTTPS:** Ambos os serviços já fornecem HTTPS automaticamente.

---

## 🎯 Próximos Passos

Depois do deploy funcionando:
- [ ] Configurar domínio customizado (opcional)
- [ ] Configurar monitoramento (opcional)
- [ ] Testar todas as funcionalidades em produção
