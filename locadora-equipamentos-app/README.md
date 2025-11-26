Locadora de Equipamentos - scaffold

Instalação e execução (PowerShell):

```powershell
cd "c:\Users\octav\octavio.memoria\VS Code\locadora-equipamentos-app"
npm install
npm run dev
```

Endpoints:
- GET /api/equipments
- POST /api/equipments { name }
- POST /api/rentals { equipmentId, customerName }
- POST /api/rentals/:id/return

Admin (dev) endpoints for quick testing:
- POST /api/admin/seed -> creates sample equipments
- POST /api/admin/reset -> clears store

Quick test (PowerShell):
```powershell
# seed sample data
Invoke-RestMethod -Method POST -Uri http://localhost:3001/api/admin/seed

# list equipments
Invoke-RestMethod -Method GET -Uri http://localhost:3001/api/equipments

# create a rental
Invoke-RestMethod -Method POST -Uri http://localhost:3001/api/rentals -Body (@{ equipmentId=1; customerName='Joao' } | ConvertTo-Json) -ContentType 'application/json'

# return rental id 1
Invoke-RestMethod -Method POST -Uri http://localhost:3001/api/rentals/1/return
```

Observações: Scaffold usa armazenamento em memória. Para persistência, substitua por um DB.

Explicação rápida (em português):

- Fluxo básico:
	1) Criar equipamento: POST /api/equipments com { name } — o servidor gera um id e marca como available=true.
	2) Alugar equipamento: POST /api/rentals com { equipmentId, customerName } — o servidor verifica se o equipamento existe e está disponível; cria um objeto Rental e marca o equipamento como unavailable (available=false).
	3) Devolver equipamento: POST /api/rentals/:id/return — o servidor marca o rental como returned=true, seta endDate e torna o equipamento disponível novamente.

- Use os endpoints de admin (/api/admin/seed e /api/admin/reset) somente para facilitar testes locais — eles limpam ou populam o store em memória.

Se quiser que eu adicione exemplos em curl, ou conecte a um banco SQLite para persistência, posso implementar o próximo passo.

Client (React + Vite)
---------------------
Criei um client mínimo em `client/` que consulta as rotas `/api` do backend.

Para rodar o client em modo desenvolvimento (usa proxy para /api):
```powershell
cd client
npm install
npm run dev
```

Isso abrirá o client em `http://localhost:5173` e as chamadas `/api` serão proxied para `http://127.0.0.1:3001`.

Para gerar build do client e servir pelo backend:
```powershell
cd client
npm install
npm run build
# depois volte para a raiz do backend
cd ..
npm run build
node .\dist\app.js
```

Publicar no GitHub e CI/CD
-------------------------

1) Use `PUSH_TO_GITHUB.md` (no repositório) para comandos PowerShell prontos para criar o repositório remoto e enviar o commit inicial.

2) Um workflow GitHub Actions foi adicionado em `.github/workflows/ci.yml` que fará o build do backend (tsc) e do client (Vite) em pushes para `main`. Você pode habilitar variáveis de ambiente/segredos para publicar imagens Docker (DOCKER_USERNAME/DOCKER_PASSWORD) se quiser que a Action também faça o push da imagem.

Docker
------

Há um `Dockerfile` de múltiplas etapas que:

- compila o backend (TypeScript) e o client (Vite) na imagem de build;
- copia os artefatos para uma imagem runtime menor e executa `node dist/app.js`.

Para construir localmente a imagem Docker e rodar:

```powershell
cd 'C:\Users\octav\octavio.memoria\VS Code\locadora-equipamentos-app'
docker build -t locadora-equipamentos-app:local .
docker run --rm -p 3001:3001 locadora-equipamentos-app:local
```

Notas finais
-----------

Se quiser, eu posso:

- adicionar um workflow que faz deploy automático (por exemplo para um registro Docker ou GitHub Pages para o client),
- converter o armazenamento em memória para SQLite e adicionar migrations,
- ou criar um conjunto de testes unitários.

Diga qual opção prefere e eu adiciono os arquivos necessários.

Deploy com GitHub Actions (o que foi adicionado)
-----------------------------------------------

1) `ci.yml` — build sem deployment (executa tsc e vite build e uploada artifacts).
2) `deploy.yml` — build + deploy automático quando houver push para `main`:
	 - publica o conteúdo de `client/dist` no GitHub Pages usando `peaceiris/actions-gh-pages` (usa o token padrão `GITHUB_TOKEN`).
	 - opcionalmente constrói e envia uma imagem Docker para Docker Hub quando os segredos `DOCKER_USERNAME` e `DOCKER_PASSWORD` estiverem configurados em Settings > Secrets do repositório.

Como configurar GitHub Pages e Docker secrets

- No GitHub repo: Settings -> Pages -> Source -> selecione `gh-pages` branch (a Action publica nessa branch automaticamente).
- Adicione os segredos em Settings -> Secrets and variables -> Actions:
	- `DOCKER_USERNAME` — seu usuário no Docker Hub
	- `DOCKER_PASSWORD` — sua senha ou token de acesso do Docker Hub

	Se preferir usar GitHub Container Registry (GHCR) em vez do Docker Hub, adicione o segredo:

	- `GHCR_TOKEN` — um Personal Access Token com `write:packages` e `read:packages` (crie em https://github.com/settings/tokens)

	O workflow `publish-ghcr.yml` foi adicionado e publicará a imagem para `ghcr.io/<seu-usuario>/locadora-equipamentos-app:latest` quando houver push para `main`.

Depois disso, ao pushar na branch `main` o workflow `deploy.yml` será acionado e deverá publicar o client e (se segredos presentes) enviar a imagem Docker.

