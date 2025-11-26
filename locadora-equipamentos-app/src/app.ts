// Arquivo principal do servidor Express
// Este arquivo configura o Express, adiciona middlewares e registra as rotas.
// Comentários abaixo explicam cada parte para facilitar o entendimento.

const express = require('express');
const routes = require('./routes');

const app = express();

// -> Middleware para parsear JSON no corpo das requisições
// A partir do Express 4.16+ podemos usar express.json() direto (sem body-parser separado).
app.use(express.json());

// -> Rota de saúde (health check)
// GET /  => retorna um objeto simples indicando que a API está no ar.
// Use para testar rapidamente se o servidor respondeu.
app.get('/', (req: any, res: any) => res.json({ ok: true, service: 'locadora-equipamentos-app' }));

// -> Registrar as rotas da API sob o prefixo /api
// Todas as rotas definidas em src/routes/index.ts ficarão acessíveis a partir de /api
app.use('/api', routes);

// Servir front-end estático (após build do client em client/dist)
// Isso permite rodar apenas o backend em produção e servir os arquivos gerados pelo Vite.
const path = require('path');
const clientDist = path.join(__dirname, '..', 'client', 'dist');
try {
  app.use(express.static(clientDist));
  // SPA fallback: devolve index.html para rotas desconhecidas (client-side routing)
  app.get('*', (req: any, res: any) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
} catch (e) {
  // se não existir client/dist, não bloqueia o servidor (apenas não serve front)
}

// -> Inicialização do servidor
// bind explícito em 127.0.0.1 para facilitar testes locais
const port = process.env.PORT || 3001;
const host = process.env.HOST || '127.0.0.1';
app.listen(port, host, () => {
  console.log(`Locadora de equipamentos API listening on http://${host}:${port}`);
});

// export para permitir testes e importação em outros módulos (se necessário)
module.exports = app;

export {};
