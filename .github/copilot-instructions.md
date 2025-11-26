## Objetivo rápido

Este repositório contém um servidor Node/Express minimal em `servidor-locnos/` e uma pasta de front-end estático em `Curso_Gemini/`.

Como agente: entregue mudanças pequenas e seguras, referenciando arquivos exatos, e sempre preserve o comportamento existente a menos que a tarefa peça mudança explícita.

## Estrutura principal

- `servidor-locnos/server.js` — servidor Express (porta 3000). Rotas de exemplo: `GET /` e `POST /login`.
- `servidor-locnos/package.json` — dependência principal: `express`.
- `Curso_Gemini/` — front-end estático: `Index.html`, `script.js`, `estilos.css`.
- `ProjetoNovo/Projeto` — diretório de projeto adicional (pode conter código de usuário). Inspecione antes de editar.

## Padrões e convenções do projeto

- Código do servidor é escrito em CommonJS (`require` / `module.exports`). Mantenha o estilo consistente.
- O front-end é servir arquivos estáticos (HTML/JS/CSS). Alterações em `Index.html` e `script.js` normalmente não exigem build.
- Scripts npm são mínimos; não há script de start definido — ao criar scripts, atualize `package.json` em `servidor-locnos/`.

## Pontos de integração e fluxos de dados

- Requisições do front-end para o back-end usam rotas HTTP simples. Ex.: formulário de login no front-end envia POST para `/login` em `server.js`.
- O servidor atualmente usa `express.json()` para parse de body JSON.

## Exemplos concretos de tarefas seguras

- "Adicionar uma rota GET /status": editar `servidor-locnos/server.js` e adicionar `app.get('/status', (req,res)=>res.json({ok:true}))`.
- "Conectar front-end ao back-end para login": inspecione `Curso_Gemini/script.js` e garanta que o fetch POST a `/login` envie `Content-Type: application/json`.
- "Adicionar script npm start": no `servidor-locnos/package.json` adicione `"start": "node server.js"`.

## Evite mudanças arriscadas

- Não atualize dependências (package.json) sem testes manuais; sem CI nem testes automatizados, atualizações podem quebrar runtime.
- Não mova ou renomeie pastas sem confirmar dependências entre front-end e back-end.

## Como formatar sugestões de PR

- Explique a intenção em 1-2 linhas, liste arquivos editados e um breve teste manual para validar (p.ex., "curl http://localhost:3000/status" ou abrir `Index.html` no navegador).

## Arquivos para referência ao fazer mudanças

- `servidor-locnos/server.js` — rota e middleware principais.
- `servidor-locnos/package.json` — scripts e dependências.
- `Curso_Gemini/Index.html`, `Curso_Gemini/script.js` — integração front-back.

Se algo estiver faltando ou se você preferir um tom diferente, diga quais seções quer expandir ou reduzir.
