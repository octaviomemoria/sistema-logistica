'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import Card from '@/components/Card';
import { Plus, Edit, Trash2, Truck as TruckIcon, Building2, Users } from 'lucide-react';

type TipoCadastro = 'transportadoras' | 'veiculos' | 'motoristas';

export default function CadastrosPage() {
    const [tipoCadastro, setTipoCadastro] = useState<TipoCadastro>('transportadoras');
    const [dados, setDados] = useState<any[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [modalAberto, setModalAberto] = useState(false);
    const [itemEdicao, setItemEdicao] = useState<any>(null);

    useEffect(() => {
        carregarDados();
    }, [tipoCadastro]);

    const carregarDados = async () => {
        setCarregando(true);
        try {
            const { data } = await api.get(`/cadastros/${tipoCadastro}`);
            setDados(data[tipoCadastro] || []);
        } catch (erro) {
            console.error('Erro ao carregar dados:', erro);
        } finally {
            setCarregando(false);
        }
    };

    const abrirModal = (item?: any) => {
        setItemEdicao(item || null);
        setModalAberto(true);
    };

    const fecharModal = () => {
        setModalAberto(false);
        setItemEdicao(null);
    };

    const salvar = async (dados: any) => {
        try {
            if (itemEdicao) {
                // Atualizar
                await api.put(`/cadastros/${tipoCadastro}/${itemEdicao.id}`, dados);
            } else {
                // Criar
                await api.post(`/cadastros/${tipoCadastro}`, dados);
            }
            alert('Salvo com sucesso!');
            fecharModal();
            carregarDados();
        } catch (erro: any) {
            alert('Erro ao salvar: ' + (erro.response?.data?.mensagem || erro.message));
        }
    };

    return (
        <div className="space-y-6">
            {/* Cabeçalho */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Cadastros</h1>
                    <p className="text-gray-500 mt-1">Gerenciamento de cadastros básicos</p>
                </div>
            </div>

            {/* Abas */}
            <div className="flex gap-2 border-b border-gray-200">
                <button
                    onClick={() => setTipoCadastro('transportadoras')}
                    className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${tipoCadastro === 'transportadoras'
                            ? 'border-primary text-primary font-medium'
                            : 'border-transparent text-gray-600 hover:text-gray-900'
                        }`}
                >
                    <Building2 size={20} />
                    Transportadoras
                </button>
                <button
                    onClick={() => setTipoCadastro('veiculos')}
                    className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${tipoCadastro === 'veiculos'
                            ? 'border-primary text-primary font-medium'
                            : 'border-transparent text-gray-600 hover:text-gray-900'
                        }`}
                >
                    <TruckIcon size={20} />
                    Veículos
                </button>
                <button
                    onClick={() => setTipoCadastro('motoristas')}
                    className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${tipoCadastro === 'motoristas'
                            ? 'border-primary text-primary font-medium'
                            : 'border-transparent text-gray-600 hover:text-gray-900'
                        }`}
                >
                    <Users size={20} />
                    Motoristas
                </button>
            </div>

            {/* Listagem */}
            <Card
                titulo={tipoCadastro.charAt(0).toUpperCase() + tipoCadastro.slice(1)}
                acoes={
                    <button
                        onClick={() => abrirModal()}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                    >
                        <Plus size={16} />
                        Novo
                    </button>
                }
            >
                {carregando ? (
                    <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    </div>
                ) : dados.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    {tipoCadastro === 'transportadoras' && (
                                        <>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">CNPJ</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Telefone</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                                        </>
                                    )}
                                    {tipoCadastro === 'veiculos' && (
                                        <>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Placa</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Modelo</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Marca</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Capacidade</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Motorista</th>
                                        </>
                                    )}
                                    {tipoCadastro === 'motoristas' && (
                                        <>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">CPF</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">CNH</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Telefone</th>
                                        </>
                                    )}
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {dados.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50">
                                        {tipoCadastro === 'transportadoras' && (
                                            <>
                                                <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.nome}</td>
                                                <td className="px-4 py-3 text-sm text-gray-600">{item.cnpj}</td>
                                                <td className="px-4 py-3 text-sm text-gray-600">{item.telefone || '-'}</td>
                                                <td className="px-4 py-3 text-sm text-gray-600">{item.email || '-'}</td>
                                            </>
                                        )}
                                        {tipoCadastro === 'veiculos' && (
                                            <>
                                                <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.placa}</td>
                                                <td className="px-4 py-3 text-sm text-gray-600">{item.modelo}</td>
                                                <td className="px-4 py-3 text-sm text-gray-600">{item.marca || '-'}</td>
                                                <td className="px-4 py-3 text-sm text-gray-600">
                                                    {item.capacidade_peso_kg ? `${item.capacidade_peso_kg} kg` : '-'}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-600">{item.motoristas?.nome || '-'}</td>
                                            </>
                                        )}
                                        {tipoCadastro === 'motoristas' && (
                                            <>
                                                <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.nome}</td>
                                                <td className="px-4 py-3 text-sm text-gray-600">{item.cpf}</td>
                                                <td className="px-4 py-3 text-sm text-gray-600">{item.cnh}</td>
                                                <td className="px-4 py-3 text-sm text-gray-600">{item.telefone || '-'}</td>
                                            </>
                                        )}
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => abrirModal(item)}
                                                    className="p-2 text-primary hover:bg-blue-50 rounded-lg"
                                                    title="Editar"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Excluir">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-12 text-gray-500">Nenhum registro encontrado</div>
                )}
            </Card>

            {/* Modal (Simplificado - pode ser expandido) */}
            {modalAberto && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-lg font-bold mb-4">
                            {itemEdicao ? 'Editar' : 'Novo'} {tipoCadastro.slice(0, -1)}
                        </h3>
                        <p className="text-sm text-gray-600 mb-4">
                            Formulário completo será implementado conforme necessidade. Por enquanto, use o backend diretamente ou
                            Supabase Dashboard.
                        </p>
                        <div className="flex gap-2 justify-end">
                            <button onClick={fecharModal} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                                Fechar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
