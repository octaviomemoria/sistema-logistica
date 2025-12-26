import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { UserRole } from '../types';
import { SpinnerIcon, GoogleIcon } from './Icons';

const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setMessage(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) {
      setError(error.message);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    // A lógica de criação de Organização e Perfil foi movida para um Trigger no Supabase.
    // Agora, apenas passamos os dados necessários durante o cadastro.
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          company_name: companyName,
        }
      }
    });

    if (signUpError) {
      setError(signUpError.message);
    } else if (data.user && data.user.identities?.length === 0) {
      // Caso o usuário já exista mas não esteja confirmado (common Supabase behavior)
      setError(
        'Este e-mail já está cadastrado, mas não foi confirmado. ' +
        'Por favor, verifique sua caixa de entrada para o e-mail de confirmação. Se não o encontrar, tente redefinir sua senha.'
      );
    } else if (data.user) {
      // Sucesso! O usuário precisa confirmar o e-mail.
      setMessage('Cadastro realizado! Verifique seu e-mail para confirmar sua conta antes de fazer o login.');
    } else {
       setError('Ocorreu um erro inesperado durante o cadastro. Tente novamente.');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="mt-6 text-center text-4xl font-extrabold text-primary">
          Locnos
        </h1>
        <h2 className="mt-2 text-center text-xl font-bold text-gray-800">
          {isLogin ? 'Acesse sua conta' : 'Crie sua conta na Locnos'}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Ou{' '}
          <button onClick={() => { setIsLogin(!isLogin); setError(null); setMessage(null); }} className="font-medium text-primary hover:text-primary-hover">
            {isLogin ? 'crie uma nova conta' : 'faça login na sua conta'}
          </button>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-lg sm:rounded-lg sm:px-10">
          <div className="space-y-6">
            <button
                onClick={handleGoogleLogin}
                className="w-full flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
              <GoogleIcon className="w-5 h-5 mr-2" />
              Entrar com Google
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">OU</span>
              </div>
            </div>
          </div>
          <form className="mt-6 space-y-6" onSubmit={isLogin ? handleLogin : handleSignUp}>
            {!isLogin && (
              <>
                 <div>
                  <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">
                    Nome da Locadora
                  </label>
                  <div className="mt-1">
                    <input
                      id="companyName"
                      name="companyName"
                      type="text"
                      required
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                    />
                  </div>
                </div>
                 <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                    Seu Nome Completo
                  </label>
                  <div className="mt-1">
                    <input
                      id="fullName"
                      name="fullName"
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Endereço de e-mail
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Senha
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                />
              </div>
            </div>
            
            {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</p>}
            {message && <p className="text-sm text-green-600 bg-green-50 p-3 rounded-md">{message}</p>}


            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:bg-gray-400"
              >
                {loading && <SpinnerIcon className="w-5 h-5 mr-2"/>}
                {loading ? 'Processando...' : (isLogin ? 'Entrar com E-mail' : 'Criar Conta')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Auth;