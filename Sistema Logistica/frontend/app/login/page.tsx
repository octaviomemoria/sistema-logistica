'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/store';
import { LogIn, Loader2 } from 'lucide-react';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [carregando, setCarregando] = useState(false);
    const [erro, setErro] = useState('');
    const router = useRouter();
    const { setToken, setUsuario } = useAuthStore();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setErro('');
        setCarregando(true);

        try {
            // Autenticar com Supabase
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password: senha,
            });

            if (error) throw error;

            if (data.session) {
                // Salvar token
                setToken(data.session.access_token);

                // Buscar dados do usuário na tabela usuarios
                const { data: usuarioData, error: userError } = await supabase
                    .from('usuarios')
                    .select('*')
                    .eq('auth_user_id', data.user.id)
                    .single();

                if (userError || !usuarioData) {
                    throw new Error('Usuário não encontrado no sistema');
                }

                // Salvar dados do usuário
                setUsuario({
                    id: usuarioData.id,
                    nome: usuarioData.nome,
                    email: usuarioData.email,
                    perfil: usuarioData.perfil,
                });

                // Redirecionar para dashboard
                router.push('/dashboard');
            }
        } catch (error: any) {
            console.error('Erro no login:', error);
            setErro(error.message || 'Erro ao fazer login. Verifique suas credenciais.');
        } finally {
            setCarregando(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Card de Login */}
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    {/* Logo */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-full mb-4">
                            <LogIn className="text-white" size={32} />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900">Logística Inteligente</h1>
                        <p className="text-gray-500 mt-2">Faça login para continuar</p>
                    </div>

                    {/* Formulário */}
                    <form onSubmit={handleLogin} className="space-y-6">
                        {erro && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                                {erro}
                            </div>
                        )}

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                E-mail
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                placeholder="seu@email.com"
                            />
                        </div>

                        <div>
                            <label htmlFor="senha" className="block text-sm font-medium text-gray-700 mb-2">
                                Senha
                            </label>
                            <input
                                id="senha"
                                type="password"
                                value={senha}
                                onChange={(e) => setSenha(e.target.value)}
                                required
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                placeholder="••••••••"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={carregando}
                            className="w-full bg-primary text-white py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {carregando ? (
                                <>
                                    <Loader2 className="animate-spin" size={20} />
                                    Entrando...
                                </>
                            ) : (
                                'Entrar'
                            )}
                        </button>
                    </form>

                    {/* Footer */}
                    <div className="mt-6 text-center text-sm text-gray-500">
                        <p>Esqueceu sua senha? Entre em contato com o administrador.</p>
                    </div>
                </div>

                {/* Informações de desenvolvimento */}
                <div className="mt-6 text-center text-sm text-gray-600 bg-white/50 backdrop-blur-sm rounded-lg p-4">
                    <p className="font-medium mb-2">🚀 Ambiente de Desenvolvimento</p>
                    <p className="text-xs">
                        Para testar, crie um usuário no Supabase Auth e na tabela <code className="bg-gray-200 px-1 rounded">usuarios</code>
                    </p>
                </div>
            </div>
        </div>
    );
}
