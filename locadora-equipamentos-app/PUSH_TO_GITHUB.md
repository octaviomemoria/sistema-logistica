# Como criar o repositório remoto e enviar (push) — instruções prontas

Este arquivo contém comandos PowerShell prontos para você executar localmente para: inicializar o git (se ainda não fez), criar o commit inicial, criar o repositório no GitHub e enviar (`push`) o branch `main`.

ATENÇÃO: o ambiente onde eu estou não tem o comando `git` disponível, por isso não consigo executar esses passos por você aqui. Execute-os no seu computador local.

## Opção A — usar GitHub CLI (`gh`) (recomendado se tiver instalado e autenticado):

1. Abra PowerShell e rode:

```powershell
cd 'C:\Users\octav\octavio.memoria\VS Code\locadora-equipamentos-app'
# Inicializa (se ainda não inicializou)
git init -b main
git add .
git commit -m "chore: initial commit - backend and client scaffold"

# Cria repositório remoto e faz push automático (substitua usuario/nome-do-repo)
gh repo create <seu-usuario>/nome-do-repo --public --source=. --remote=origin --push
```

## Opção B — usar a API REST do GitHub com um token (automatizável). Requer um token com escopo `repo`.

1. No PowerShell, defina uma variável de ambiente para a sessão (substitua seu_token e seu-usuario):

```powershell
# $env:GITHUB_TOKEN ficará somente nesta sessão
$env:GITHUB_TOKEN = 'seu_token_aqui'

cd 'C:\Users\octav\octavio.memoria\VS Code\locadora-equipamentos-app'
git init -b main
git add .
git commit -m "chore: initial commit - backend and client scaffold"

# Cria o repo remoto via API
$body = @{ name = 'nome-do-repo'; description = 'Locadora equipamentos app'; private = $false } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri 'https://api.github.com/user/repos' -Headers @{ Authorization = "token $env:GITHUB_TOKEN" } -Body $body -ContentType 'application/json'

# Adiciona remote e faz push
git remote add origin https://github.com/<seu-usuario>/nome-do-repo.git
git branch -M main
git push -u origin main
```

Observação de segurança: o token fica apenas na sessão PowerShell atual quando definido com `$env:GITHUB_TOKEN = '...'`. Não cole tokens em locais públicos.

## Opção C — criar manualmente pelo site do GitHub (UI)

1. Vá para https://github.com/new e crie um repositório com o nome desejado.
2. Depois de criado, siga as instruções que aparecem na página — normalmente:

```powershell
cd 'C:\Users\octav\octavio.memoria\VS Code\locadora-equipamentos-app'
git init -b main
git add .
git commit -m "chore: initial commit - backend and client scaffold"
git remote add origin https://github.com/<seu-usuario>/nome-do-repo.git
git branch -M main
git push -u origin main
```

## Script PowerShell rápido (execução local)

Se quiser, salve o bloco abaixo como `create-and-push.ps1` e execute localmente (substitua `nome-do-repo`):

```powershell
Param(
  [string] $RepoName = 'nome-do-repo',
  [string] $Visibility = 'public' # 'public' ou 'private'
)

Set-StrictMode -Version Latest
cd (Split-Path -Path $PSScriptRoot -Parent)
Write-Host "Repo root: $(Get-Location)"

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
  Write-Error "git não está instalado ou não está no PATH. Instale Git e tente novamente."
  exit 1
}

git init -b main
git add .
git commit -m "chore: initial commit - backend and client scaffold"

if (Get-Command gh -ErrorAction SilentlyContinue) {
  Write-Host "gh CLI detectado — criando repositório e fazendo push..."
  gh repo create $RepoName --$Visibility --source=. --remote=origin --push
  exit $LASTEXITCODE
} elseif ($env:GITHUB_TOKEN) {
  Write-Host "gh não encontrado, mas GITHUB_TOKEN presente — criando repo via API e fazendo push..."
  $body = @{ name = $RepoName; private = ($Visibility -eq 'private') } | ConvertTo-Json
  Invoke-RestMethod -Method Post -Uri 'https://api.github.com/user/repos' -Headers @{ Authorization = "token $env:GITHUB_TOKEN" } -Body $body -ContentType 'application/json'
  git remote add origin https://github.com/$env:USER/$RepoName.git
  git push -u origin main
  exit $LASTEXITCODE
} else {
  Write-Host "Nem gh nem GITHUB_TOKEN detectados. Crie o repo via https://github.com/new e então rode: git remote add origin ...; git push -u origin main"
  exit 0
}
```

Se quiser, depois que o repositório estiver no GitHub eu posso:

- Adicionar um workflow GitHub Actions que constrói o `client` e o backend e publica artefatos ou cria um Docker image.
- Criar um `README.md` melhor formatado com badges e instruções de CI/CD.

----
Nota final: execute os comandos no seu computador local. Se preferir que eu crie o repositório remoto aqui, você precisa me fornecer (por mensagem) um token GitHub com escopo `repo` — não recomendado por motivos de segurança. Recomendo usar `gh` localmente ou a UI do GitHub.
