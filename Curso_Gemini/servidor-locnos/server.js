// 1. Importa a ferramenta Express que instalamos
const express = require('express');
const cors = require('cors'); 


// ... (imports do express e cors)

// --- CONFIGURAÇÃO DO BANCO DE DADOS (NOVO!) ---
const { Pool } = require('pg');
const bcrypt = require('bcrypt'); // <-- ADICIONE ESTA LINHA


const pool = new Pool({
  user: 'postgres',        // O usuário padrão do PostgreSQL
  host: 'localhost',       // Onde o servidor está (sua máquina)
  database: 'locnos_db',   // O nome do banco que criamos
  password: '1234',        // A senha que você criou na instalação
  port: 5432,              // A porta padrão do PostgreSQL
});
// --- FIM DA CONFIGURAÇÃO ---




// --- NOSSO "BANCO DE DADOS" FAKE ---
const emailCorreto = 'teste@locnos.com';
const senhaCorreta = '1234';

// 2. Cria a nossa aplicação chamando a função do express
const app = express();

// 3. Ensina o Express a ler o corpo de requisições em formato JSON
app.use(express.json());
app.use(cors());

// 4. Define uma "porta" onde nosso servidor ficará "ouvindo" os pedidos
const port = 3000;

// 5. Rota de teste para a página inicial (/)
app.get('/', (req, res) => {
  res.send('<h1>O servidor está funcionando!</h1>');
});

// 6. Rota para onde o formulário vai enviar os dados (/login)
// Rota de login atualizada para usar o banco de dados
app.post('/login', async (req, res) => {
  try {
    // 1. Pega o email e a senha do corpo da requisição
    const { email, senha } = req.body;
    
    // 2. Prepara a consulta SQL para encontrar o usuário pelo email
    const consultaSql = 'SELECT * FROM usuarios WHERE email = $1';
    
    // 3. Envia a consulta para o banco de dados usando o pool
    // 'await' pausa a função até o banco de dados responder
    const resultado = await pool.query(consultaSql, [email]);
    console.log('resultado):', resultado);
    
    // 4. Analisa a resposta do banco de dados
    if (resultado.rows.length === 0) {
      // 4a. Nenhum usuário encontrado com esse e-mail
      console.log('Falha no login: E-mail não encontrado', email);
      return res.status(401).json({ Coded('sucesso');: false, mensagem: 'E-mail ou senha inválidos.' });
    }

    // 5. Usuário foi encontrado! Agora comparamos a senha.
    const usuario = resultado.rows[0]; // Pega o primeiro (e único) usuário encontrado

    if (senha === usuario.senha) {
      // 6a. SUCESSO! A senha bate.
      console.log('Sucesso no login para:', email);
      res.status(200).json({ sucesso: true, mensagem: 'Login realizado com sucesso!' });
    } else {
      // 6b. FALHA! A senha está errada.
      console.log('Falha no login: Senha incorreta para:', email);
      res.status(401).json({ sucesso: false, mensagem: 'E-mail ou senha inválidos.' });
    }

  } catch (error) {
    // 7. Lida com qualquer erro inesperado (ex: banco de dados fora do ar)
    console.error('Erro no servidor ao tentar fazer login:', error);
    res.status(500).json({ sucesso: false, mensagem: 'Erro interno no servidor.' });
  }
});

  // 2. Imprime no terminal (para nosso controle)
  console.log('Tentativa de login com:', { email: emailRecebido });

  // 3. Verifica se os dados batem com nosso "banco de dados"
  if (emailRecebido === emailCorreto && senhaRecebida === senhaCorreta) {
    // 4a. Responde com SUCESSO
    res.status(200).json({ 
      sucesso: true, 
      mensagem: 'Login realizado com sucesso!' 
    });
  } else {
    // 4b. Responde com FALHA
    res.status(401).json({
      sucesso: false,
      mensagem: 'E-mail ou senha inválidos.'
    });
  }
});

// 7. Manda o servidor começar a ouvir na porta definida
app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});