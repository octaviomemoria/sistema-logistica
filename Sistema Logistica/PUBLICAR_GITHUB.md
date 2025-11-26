# Guia: Como Publicar no GitHub

## 📋 Passo a Passo Completo

### 1️⃣ Login no GitHub (Autenticação)

Você tem **duas opções** para se autenticar no GitHub:

#### **Opção A: GitHub CLI (Recomendado - Mais Fácil)**

```bash
# 1. Instalar GitHub CLI (se ainda não tem)
# Baixe em: https://cli.github.com/

# 2. Fazer login
gh auth login

# 3. Seguir as instruções:
# - Escolha: GitHub.com
# - Protocolo: HTTPS
# - Autenticar: Login with a web browser
# - Copie o código que aparecer
# - Pressione Enter (abrirá o navegador)
# - Cole o código no navegador e autorize
```

#### **Opção B: Personal Access Token (PAT)**

```bash
# 1. Criar token no GitHub:
# - Acesse: https://github.com/settings/tokens
# - Clique em "Generate new token" > "Generate new token (classic)"
# - Nome: "Sistema Logistica"
# - Marque: "repo" (acesso completo aos repositórios)
# - Clique em "Generate token"
# - COPIE O TOKEN (você não verá novamente!)

# 2. Configurar Git com suas credenciais
git config --global user.name "Seu Nome"
git config --global user.email "seu.email@exemplo.com"

# 3. Quando fizer git push, use:
# Username: seu-usuario-github
# Password: cole-o-token-aqui (não sua senha!)
```

---

### 2️⃣ Criar Repositório no GitHub

**Via Interface Web:**

1. Acesse https://github.com/new
2. Preencha:
   - **Nome do repositório:** `sistema-logistica` (ou outro nome)
   - **Descrição:** "Sistema completo de gestão logística para distribuidoras"
   - **Visibilidade:** Private ou Public (sua escolha)
   - ❌ **NÃO marque** "Initialize with README" (já temos arquivos)
3. Clique em **"Create repository"**
4. **Copie a URL do repositório** que aparecerá

**Ou via GitHub CLI:**

```bash
# Criar repositório privado
gh repo create sistema-logistica --private --source=. --remote=origin

# Ou criar repositório público
gh repo create sistema-logistica --public --source=. --remote=origin
```

---

### 3️⃣ Preparar e Enviar os Arquivos

```bash
# 1. Adicionar arquivos ao staging (já fizemos isso!)
git add .

# 2. Fazer commit
git commit -m "feat: implementação inicial do sistema logística

- Backend completo com API REST
- Frontend com páginas de Dashboard, Pedidos e Separação
- Banco de dados Supabase configurado
- Módulo de separação com leitor de código de barras
- Integração Google Drive para comprovantes"

# 3. Renomear branch para main (se necessário)
git branch -M main

# 4. Adicionar repositório remoto (substitua pela sua URL)
git remote add origin https://github.com/SEU-USUARIO/sistema-logistica.git

# 5. Enviar para o GitHub
git push -u origin main
```

---

### 4️⃣ Comandos Prontos para Você

**Execute na ordem:**

```powershell
# Navegue até a pasta do projeto
cd "c:\Users\octav\octavio.memoria\VS Code\Sistema Logistica"

# Configurar seu usuário Git (primeira vez)
git config --global user.name "Seu Nome Completo"
git config --global user.email "seu.email@gmail.com"

# Fazer commit dos arquivos
git commit -m "feat: implementação inicial - backend, frontend e módulo de separação"

# Renomear branch para main
git branch -M main

# Adicionar repositório remoto (SUBSTITUA pela URL do seu repo)
git remote add origin https://github.com/SEU-USUARIO/sistema-logistica.git

# Enviar para o GitHub
git push -u origin main
```

---

## 🔐 Autenticação no Git Push

Quando você executar `git push`, o Git solicitará credenciais:

### Se usou GitHub CLI:
✅ Nada a fazer! Já está autenticado.

### Se usou Personal Access Token:
```
Username: seu-usuario-github
Password: ghp_seu_token_aqui (NÃO é sua senha do GitHub!)
```

---

## 📝 Próximos Commits (Atualizações Futuras)

Depois de publicado, para enviar novas mudanças:

```bash
# 1. Ver arquivos modificados
git status

# 2. Adicionar arquivos
git add .

# 3. Fazer commit com mensagem descritiva
git commit -m "feat: adicionar módulo de roteirização"
# ou
git commit -m "fix: corrigir bug no leitor de código de barras"

# 4. Enviar para GitHub
git push
```

---

## 🎯 Padrões de Mensagens de Commit

Use prefixos para organizar:

- `feat:` - Nova funcionalidade
- `fix:` - Correção de bug
- `docs:` - Documentação
- `style:` - Formatação, espaços
- `refactor:` - Refatoração de código
- `test:` - Adicionar testes
- `chore:` - Manutenção, configs

**Exemplos:**
```bash
git commit -m "feat: adicionar página de relatórios"
git commit -m "fix: corrigir validação de código de barras"
git commit -m "docs: atualizar README com instruções de deploy"
```

---

## ❓ Problemas Comuns

### Erro: "remote origin already exists"
```bash
# Remover o remote existente
git remote remove origin

# Adicionar novamente
git remote add origin https://github.com/SEU-USUARIO/sistema-logistica.git
```

### Erro: "Authentication failed"
```bash
# Se usando token, certifique-se de:
# 1. Copiar o token completo (começa com ghp_)
# 2. Usar o token como senha (não sua senha do GitHub)
# 3. Token deve ter permissão "repo"
```

### Erro: "Updates were rejected"
```bash
# Baixar mudanças do GitHub primeiro
git pull origin main --rebase

# Depois enviar
git push origin main
```

---

## 🌐 Url do Seu Repositório

Após criar no GitHub, a URL será algo como:

```
https://github.com/seu-usuario/sistema-logistica
```

Você pode compartilhar essa URL com outras pessoas ou acessar pelo navegador!

---

## ✅ Checklist Final

- [ ] Fazer login no GitHub (GitHub CLI ou criar PAT)
- [ ] Criar repositório no GitHub (web ou CLI)
- [ ] Configurar user.name e user.email do Git
- [ ] Executar `git commit`
- [ ] Executar `git remote add origin`
- [ ] Executar `git push -u origin main`
- [ ] Verificar no navegador se os arquivos apareceram

---

**🎉 Depois disso, seu projeto estará no GitHub!**
