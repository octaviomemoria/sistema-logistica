'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Lock, Mail, Loader2, ArrowRight } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function LoginPage() {
    const router = useRouter()
    const { showToast } = useToast()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const result = await signIn('credentials', {
                redirect: false,
                email,
                password,
            })

            if (result?.error) {
                showToast('error', 'Email ou senha inválidos')
            } else {
                showToast('success', 'Login realizado com sucesso!')
                router.push('/dashboard')
            }
        } catch (error) {
            showToast('error', 'Erro ao conectar ao servidor')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col md:flex-row animate-in fade-in zoom-in duration-300">
                {/* Visual Side (Mobile hidden, Desktop only logic if expanded, currently simple centered card) */}
                <div className="p-8 w-full">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-blue-600 text-white mb-4 shadow-lg shadow-blue-600/30">
                            <span className="font-bold text-2xl">L</span>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900">Bem-vindo ao Locnos</h1>
                        <p className="text-gray-500 text-sm mt-2">Faça login para acessar o sistema</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="email"
                                    required
                                    className="input pl-10 w-full"
                                    placeholder="seu@email.com"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <label className="text-sm font-medium text-gray-700">Senha</label>
                                <a href="#" className="text-xs text-blue-600 hover:underline">Esqueceu a senha?</a>
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="password"
                                    required
                                    className="input pl-10 w-full"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full py-2.5 mt-2 flex items-center justify-center gap-2 group"
                        >
                            {loading ? (
                                <Loader2 className="animate-spin" size={20} />
                            ) : (
                                <>
                                    Entrar
                                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-200"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white text-gray-500">Credenciais de Teste</span>
                            </div>
                        </div>
                        <div className="mt-4 p-3 bg-gray-50 rounded text-xs text-gray-600 text-left">
                            <p><strong>Email:</strong> admin@locnos.com.br</p>
                            <p><strong>Senha:</strong> admin123</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
