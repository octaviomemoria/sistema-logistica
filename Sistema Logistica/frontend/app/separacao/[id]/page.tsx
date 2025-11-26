'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';
import { formatarMoeda } from '@/lib/utils';
import {
    ArrowLeft,
    Package,
    CheckCircle2,
    Circle,
    Barcode,
    User,
    FileText,
    MapPin,
    Hash
} from 'lucide-react';

interface ItemPedido {
    id: string;
    codigo_produto: string;
    descricao_produto: string;
    quantidade: number;
    localizacao_estoque?: string;
    valor_unitario: number;
    separado?: boolean;
}

interface Pedido {
    id: string;
    numero_pedido: string;
    numero_nf: string;
    valor_total: number;
    clientes: {
        nome: string;
        cidade: string;
    };
}

interface Separacao {
    id: string;
    pedido_id: string;
    status: string;
}

export default function SeparacaoAtivaPage() {
    const router = useRouter();
    const params = useParams();
    const separacaoId = params.id as string;

    const [separacao, setSeparacao] = useState<Separacao | null>(null);
    const [pedido, setPedido] = useState<Pedido | null>(null);
    const [itens, setItens] = useState<ItemPedido[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [codigoBarras, setCodigoBarras] = useState('');
    const [processandoItem, setProcessandoItem] = useState<string | null>(null);
    const [finalizando, setFinalizando] = useState(false);

    const inputCodigoBarrasRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        carregarDados();
    }, [separacaoId]);

    // Auto-focus no input de código de barras
    useEffect(() => {
        inputCodigoBarrasRef.current?.focus();
    }, []);

    const carregarDados = async () => {
        setCarregando(true);
        try {
            // Buscar informações da separação
            const { data: dataSeparacao } = await api.get(`/separacao/${separacaoId}`);
            setSeparacao(dataSeparacao.separacao);

            // Buscar dados do pedido
            const { data: dataPedido } = await api.get(`/pedidos/${dataSeparacao.separacao.pedido_id}`);
            setPedido(dataPedido.pedido);

            // Inicializar itens com status de separado = false
            const itensComStatus = dataPedido.pedido.itens_pedido.map((item: ItemPedido) => ({
                ...item,
                separado: false
            }));
            setItens(itensComStatus);

        } catch (erro) {
            console.error('Erro ao carregar dados:', erro);
            alert('Erro ao carregar informações da separação');
            router.push('/separacao');
        } finally {
            setCarregando(false);
        }
    };

    const confirmarItem = async (itemId: string, codigoBarrasConferido?: string) => {
        setProcessandoItem(itemId);
        try {
            const item = itens.find(i => i.id === itemId);
            if (!item) return;

            await api.post(`/separacao/${separacaoId}/item`, {
                item_pedido_id: itemId,
                quantidade_separada: item.quantidade,
                codigo_barras_conferido: codigoBarrasConferido || null
            });

            // Atualizar estado local
            setItens(itens.map(i =>
                i.id === itemId ? { ...i, separado: true } : i
            ));

            // Limpar código de barras
            setCodigoBarras('');

            // Re-focus no input
            inputCodigoBarrasRef.current?.focus();

        } catch (erro) {
            console.error('Erro ao confirmar item:', erro);
            alert('Erro ao confirmar item');
        } finally {
            setProcessandoItem(null);
        }
    };

    const handleCodigoBarrasSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!codigoBarras.trim()) return;

        // Procurar item pelo código de barras (código do produto)
        const item = itens.find(i =>
            !i.separado && i.codigo_produto === codigoBarras.trim()
        );

        if (item) {
            confirmarItem(item.id, codigoBarras);
        } else {
            alert('Produto não encontrado ou já separado');
            setCodigoBarras('');
        }
    };

    const finalizarSeparacao = async () => {
        const itensPendentes = itens.filter(i => !i.separado);

        if (itensPendentes.length > 0) {
            const confirmar = window.confirm(
                `Ainda existem ${itensPendentes.length} item(ns) pendente(s). Deseja finalizar mesmo assim?`
            );
            if (!confirmar) return;
        }

        setFinalizando(true);
        try {
            await api.post(`/separacao/${separacaoId}/finalizar`);

            alert('Separação finalizada com sucesso!');
            router.push('/separacao');

        } catch (erro) {
            console.error('Erro ao finalizar separação:', erro);
            alert('Erro ao finalizar separação');
        } finally {
            setFinalizando(false);
        }
    };

    const itensSeparados = itens.filter(i => i.separado).length;
    const totalItens = itens.length;
    const progresso = totalItens > 0 ? (itensSeparados / totalItens) * 100 : 0;
    const todosSeparados = itensSeparados === totalItens && totalItens > 0;

    if (carregando) {
        return (
            <div className="flex flex-col items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                <p className="mt-4 text-gray-600">Carregando separação...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Cabeçalho */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => router.push('/separacao')}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <ArrowLeft size={24} />
                </button>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-gray-900">
                        Separação em Andamento
                    </h1>
                    <p className="text-gray-500 mt-1">
                        Pedido {pedido?.numero_pedido} - {pedido?.clientes?.nome}
                    </p>
                </div>
            </div>

            {/* Card de Informações do Pedido */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="flex items-start gap-3">
                        <div className="bg-blue-50 p-2 rounded-lg">
                            <Hash className="text-primary" size={20} />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">Pedido</p>
                            <p className="font-semibold text-gray-900">{pedido?.numero_pedido}</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <div className="bg-green-50 p-2 rounded-lg">
                            <FileText className="text-green-600" size={20} />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">NF</p>
                            <p className="font-semibold text-gray-900">{pedido?.numero_nf || '-'}</p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <div className="bg-purple-50 p-2 rounded-lg">
                            <User className="text-purple-600" size={20} />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">Cliente</p>
                            <p className="font-semibold text-gray-900 truncate">
                                {pedido?.clientes?.nome}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <div className="bg-yellow-50 p-2 rounded-lg">
                            <Package className="text-yellow-600" size={20} />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">Valor Total</p>
                            <p className="font-semibold text-gray-900">
                                {formatarMoeda(pedido?.valor_total || 0)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Barra de Progresso */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Progresso</span>
                        <span className="text-sm font-semibold text-primary">
                            {itensSeparados} / {totalItens} itens
                        </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-500 ${todosSeparados ? 'bg-green-500' : 'bg-primary'
                                }`}
                            style={{ width: `${progresso}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Input de Código de Barras */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-4">
                    <Barcode className="text-primary" size={24} />
                    <h2 className="text-lg font-semibold text-gray-900">Leitura de Código de Barras</h2>
                </div>
                <form onSubmit={handleCodigoBarrasSubmit} className="flex gap-3">
                    <input
                        ref={inputCodigoBarrasRef}
                        type="text"
                        value={codigoBarras}
                        onChange={(e) => setCodigoBarras(e.target.value)}
                        placeholder="Digite ou escaneie o código de barras..."
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-lg"
                        autoFocus
                    />
                    <button
                        type="submit"
                        disabled={!codigoBarras.trim()}
                        className="px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Confirmar
                    </button>
                </form>
                <p className="text-sm text-gray-500 mt-2">
                    Pressione Enter após escanear ou digitar o código
                </p>
            </div>

            {/* Lista de Itens */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                    <h2 className="text-lg font-semibold text-gray-900">Itens do Pedido</h2>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Código
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Descrição
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Localização
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                    Quantidade
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                    Ações
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {itens.map((item) => (
                                <tr
                                    key={item.id}
                                    className={`${item.separado
                                            ? 'bg-green-50'
                                            : 'bg-white hover:bg-gray-50'
                                        } transition-colors`}
                                >
                                    <td className="px-6 py-4">
                                        {item.separado ? (
                                            <CheckCircle2 className="text-green-600" size={24} />
                                        ) : (
                                            <Circle className="text-gray-300" size={24} />
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="font-mono text-sm font-medium text-gray-900">
                                            {item.codigo_produto}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm text-gray-900">
                                            {item.descricao_produto}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {item.localizacao_estoque ? (
                                            <div className="flex items-center gap-1 text-sm text-gray-600">
                                                <MapPin size={14} className="text-primary" />
                                                {item.localizacao_estoque}
                                            </div>
                                        ) : (
                                            <span className="text-sm text-gray-400">-</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="text-sm font-semibold text-gray-900">
                                            {item.quantidade}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex justify-center">
                                            <button
                                                onClick={() => confirmarItem(item.id)}
                                                disabled={item.separado || processandoItem === item.id}
                                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${item.separado
                                                        ? 'bg-green-100 text-green-700 cursor-not-allowed'
                                                        : 'bg-primary text-white hover:bg-blue-700'
                                                    } disabled:opacity-50`}
                                            >
                                                {processandoItem === item.id ? (
                                                    <span className="flex items-center gap-2">
                                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                        Processando
                                                    </span>
                                                ) : item.separado ? (
                                                    'Separado'
                                                ) : (
                                                    'Confirmar'
                                                )}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Botões de Ação */}
            <div className="flex gap-4">
                <button
                    onClick={() => router.push('/separacao')}
                    className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                    Pausar/Cancelar
                </button>
                <button
                    onClick={finalizarSeparacao}
                    disabled={!todosSeparados || finalizando}
                    className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors ${todosSeparados
                            ? 'bg-green-600 hover:bg-green-700 text-white'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                >
                    {finalizando ? (
                        <span className="flex items-center justify-center gap-2">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            Finalizando...
                        </span>
                    ) : (
                        `Finalizar Separação ${todosSeparados ? '✓' : `(${totalItens - itensSeparados} pendentes)`}`
                    )}
                </button>
            </div>
        </div>
    );
}
