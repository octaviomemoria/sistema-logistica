console.log('Arquivo de script carregado com sucesso!'); // <--- Adicione esta linha

const form = document.querySelector('#login-form');
const botao = document.querySelector('#btn-login');
const inputEmail = document.querySelector('#email');
const inputSenha = document.querySelector('#senha');



botao.addEventListener('click', function (event) {
    console.log('Botão de login foi clicado!'); // <--- Adicione esta linha

    event.preventDefault(); // Evita o envio do formulário
    const email = inputEmail.value;
    const senha = inputSenha.value;
    if (email === '' || senha === '') { alert('E-mail ou senha em brancos'); }
    else {
    // 1. Envia os dados para o servidor usando fetch
  fetch('http://localhost:3000/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email, senha: senha })
})
.then(response => {
    // 1. Converte a resposta para JSON, não importa se foi sucesso ou erro
    return response.json(); 
})
.then(data => {
    // 2. Agora 'data' é o nosso objeto JSON { sucesso: ..., mensagem: ... }
    alert(data.mensagem); // Mostra SÓ a mensagem

    if (data.sucesso) {
        // Se o login deu certo, podemos fazer mais coisas!
        console.log('Usuário logado com sucesso!');
        // No futuro, poderíamos redirecionar o usuário para outra página aqui
    } else {
        // Se deu errado (ex: status 401)
        console.log('Falha na autenticação.');
    }
})
.catch(error => {
    console.error('Erro ao conectar com o servidor:', error);
    alert('Não foi possível conectar ao servidor.');
});
}
});