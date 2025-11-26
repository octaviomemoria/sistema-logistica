'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import Card from '@/components/Card';
import {
    Users,
    Truck,
    Map,
    Briefcase,
    UserCircle,
    Plus,
    Search,
    Building2
} from 'lucide-react';

export default function CadastrosPage() {
    const [abaAtiva, setAbaAtiva] = useState<'clientes' | 'motoristas' | 'veiculos' | 'transportadoras'>('clientes');
    const [dados, setDados] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [busca, setBusca] = useState('');

    useEffect(() => {
        carregarDados();
    }, [abaAtiva]);

    const carregarDados = async () => {
        setLoading(true);
        try {
            const endpoint = `/cadastros/${abaAtiva}`;
            const { data } = await api.get(endpoint);
            // A resposta vem como { clientes: [...] } ou { veiculos: [...] }
            setDados(data[abaAtiva] || []);
        } catch (erro) {
            console.error(`Erro ao carregar ${abaAtiva}:`, erro);
            alert('Erro ao carregar dados');
        } finally {
            setLoading(false);
        }
    };

    const dadosFiltrados = dados.filter(item => {
        const termo = busca.toLowerCase();
        if (abaAtiva === 'clientes' || abaAtiva === 'motoristas' || abaAtiva === 'transportadoras') {
            return item.nome?.toLowerCase().includes(termo) ||
                item.documento?.includes(termo) ||
                item.cidade?.toLowerCase().includes(termo);
        }
        if (abaAtiva === 'veiculos') {
            return item.placa?.toLowerCase().includes(termo) ||
                item.modelo?.toLowerCase().includes(termo);
        }
        return true;
    });

    const renderTabela = () => {
        if (loading) {
            return (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
            );
        }

        if (dadosFiltrados.length === 0) {
            return (
                <div className="text-center py-12 text-gray-500">
                    Nenhum registro encontrado.
                </div>
            );
        }

        return (
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                        <tr>
                            {abaAtiva === 'clientes' && (
                                <>
                                    <th className="px-6 py-3">Nome / Razão Social</th>
                                    <th className="px-6 py-3">Documento</th>
                                    <th className="px-6 py-3">Cidade/UF</th>
                                    <th className="px-6 py-3">Região</th>
                                </>
                            )}
                            {abaAtiva === 'motoristas' && (
                                <>
                                    <th className="px-6 py-3">Nome</th>
                                    <th className="px-6 py-3">CNH</th>
                                    <th className="px-6 py-3">Categoria</th>
                                    <th className="px-6 py-3">Telefone</th>
                                </>
                            )}
                            {abaAtiva === 'veiculos' && (
                                <>
                                    <th className="px-6 py-3">Placa</th>
                                    <th className="px-6 py-3">Modelo</th>
                                    <th className="px-6 py-3">Capacidade (kg)</th>
                                    <th className="px-6 py-3">Motorista Padrão</th>
                                </>
                            )}
                            {abaAtiva === 'transportadoras' && (
                                <>
                                    <th className="px-6 py-3">Nome</th>
                                    <th className="px-6 py-3">CNPJ</th>
                                    <th className="px-6 py-3">Cidade/UF</th>
                                    <th className="px-6 py-3">Telefone</th>
                                </>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {dadosFiltrados.map((item: any) => (
                            <tr key={item.id} className="bg-white border-b hover:bg-gray-50">
                                {abaAtiva === 'clientes' && (
                                    <>
                                        <td className="px-6 py-4 font-medium">{item.nome}</td>
                                        <td className="px-6 py-4">{item.documento}</td>
                                        <td className="px-6 py-4">{item.cidade} - {item.uf}</td>
                                        <td className="px-6 py-4">{item.regioes?.nome || '-'}</td>
                                    </>
                                )}
                                {abaAtiva === 'motoristas' && (
                                    <>
                                        <td className="px-6 py-4 font-medium">{item.nome}</td>
                                        <td className="px-6 py-4">{item.cnh}</td>
                                        <td className="px-6 py-4">{item.categoria_cnh}</td>
                                        <td className="px-6 py-4">{item.telefone}</td>
                                    </>
                                )}
                                {abaAtiva === 'veiculos' && (
                                    <>
                                        <td className="px-6 py-4 font-medium font-mono">{item.placa}</td>
                                        <td className="px-6 py-4">{item.modelo}</td>
                                        <td className="px-6 py-4">{item.capacidade_kg} kg</td>
                                        <td className="px-6 py-4">{item.motoristas?.nome || '-'}</td>
                                    </>
                                )}
                                {abaAtiva === 'transportadoras' && (
                                    <>
                                        <td className="px-6 py-4 font-medium">{item.nome}</td>
                                        <td className="px-6 py-4">{item.documento}</td>
                                        <td className="px-6 py-4">{item.cidade} - {item.uf}</td>
                                        <td className="px-6 py-4">{item.telefone}</td>
                                    </>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <div className="flex flex-col md:flex-row gap-6">
            {/* Sidebar de Navegação */}
            <div className="w-full md:w-64 flex-shrink-0">
                <Card className="p-2">
                    <nav className="space-y-1">
                        <button
                            onClick={() => setAbaAtiva('clientes')}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${abaAtiva === 'clientes'
                                    ? 'bg-primary text-white'
                                    : 'text-gray-600 hover:bg-gray-100'
                                }`}
                        >
                            <Users size={20} />
                            Clientes
                        </button>
                        <button
                            onClick={() => setAbaAtiva('motoristas')}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${abaAtiva === 'motoristas'
                                    ? 'bg-primary text-white'
                                    : 'text-gray-600 hover:bg-gray-100'
                                }`}
                        >
                            <UserCircle size={20} />
                            Motoristas
                        </button>
                        <button
                            onClick={() => setAbaAtiva('veiculos')}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${abaAtiva === 'veiculos'
                                    ? 'bg-primary text-white'
                                    : 'text-gray-600 hover:bg-gray-100'
                                }`}
                        >
                            <Truck size={20} />
                            Veículos
                        </button>
                        <button
                            onClick={() => setAbaAtiva('transportadoras')}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${abaAtiva === 'transportadoras'
                                    ? 'bg-primary text-white'
                                    : 'text-gray-600 hover:bg-gray-100'
                                }`}
                        >
                            <Building2 size={20} />
                            Transportadoras
                        </button>
                    </nav>
                </Card>
            </div>

            {/* Conteúdo Principal */}
            <div className="flex-1 space-y-6">
                <div className="flex flex-col md:flex-row justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 capitalize">
                            {abaAtiva}
                        </h1>
                        <p className="text-gray-500 mt-1">
                            Gerenciamento de {abaAtiva}
                        </p>
                    </div>

                    <div className="flex gap-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Buscar..."
                                value={busca}
                                onChange={(e) => setBusca(e.target.value)}
                                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary w-full md:w-64"
                            />
                        </div>
                        {/* Botão Novo - Apenas visual por enquanto */}
                        {abaAtiva !== 'clientes' && (
                            <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors">
                                <Plus size={20} />
                                <span className="hidden md:inline">Novo</span>
                            </button>
                        )}
                    </div>
                </div>

                <Card className="p-0 overflow-hidden">
                    {renderTabela()}
                </Card>
            </div>
        </div>
    );
}
