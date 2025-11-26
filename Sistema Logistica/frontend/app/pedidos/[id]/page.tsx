'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import StatusBadge from '@/components/StatusBadge';
import Card from '@/components/Card';
import { formatarData, formatarDataHora, formatarMoeda, formatarNumero } from '@/lib/utils';
import { ArrowLeft, Package, User, MapPin, Truck, CheckCircle, Clock } from 'lucide-react';

interface PedidoDetalhes {
    pedido: any;
    itens: any[];
    historico: any[];
    timeline: any[];
}

export default function PedidoDetalhesPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [dados, setDados] = useState<PedidoDetalhes | null>(null);
    const [carregando, setCarregando] = useState(true);

    useEffect(() => {
        carregarPedido();
    }, [params.id]);

    const carregarPedido = async () => {
        try {
            const { data } = await api.get(`/pedidos/${params.id}`);
            setDados(data);

            // Carregar timeline
            const { data: timelineData } = await api.get(`/pedidos/${params.id}/timeline`);
            setDados((prev) => (prev ? { ...prev, timeline: timelineData.timeline } : null));
        } catch (erro) {
            console.error('Erro ao carregar pedido:', erro);
        } finally {
            setCarregando(false);
        }
    };

    if (carregando) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-gray-600">Carregando detalhes do pedido...</p>
                </div>
            </div>
        );
    }

    if (!dados) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500">Pedido não encontrado</p>
            </div>
        );
    }

    const { pedido, itens, timeline } = dados;

    return (
        <div className="space-y-6">
            {/* Cabeçalho */}
            <div>
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
                >
                    <ArrowLeft size={20} />
                    <span>Voltar</span>
                </button>

                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Pedido {pedido.numero_pedido}</h1>
                        <p className="text-gray-500 mt-1">NF: {pedido.numero_nf || 'Não informada'}</p>
                    </div>
                    <StatusBadge status={pedido.status} className="text-base px-4 py-2" />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Coluna Principal */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Informações do Pedido */}
                    <Card titulo="Informações do Pedido">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-gray-500">Data do Pedido</p>
                                <p className="font-medium text-gray-900">{formatarData(pedido.data_pedido)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Data Faturamento</p>
                                <p className="font-medium text-gray-900">{formatarData(pedido.data_faturamento)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Valor Total</p>
                                <p className="font-medium text-gray-900 text-lg">{formatarMoeda(pedido.valor_total)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Tipo de Frete</p>
                                <p className="font-medium text-gray-900">{pedido.tipo_frete?.toUpperCase()}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Peso Total</p>
                                <p className="font-medium text-gray-900">{formatarNumero(pedido.peso_total_kg, 2)} kg</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Volumes</p>
                                <p className="font-medium text-gray-900">{pedido.quantidade_volumes || 1}</p>
                            </div>
                        </div>

                        {pedido.observacoes && (
                            <div className="mt-4 pt-4 border-t border-gray-200">
                                <p className="text-sm text-gray-500 mb-1">Observações</p>
                                <p className="text-gray-700">{pedido.observacoes}</p>
                            </div>
                        )}
                    </Card>

                    {/* Itens do Pedido */}
                    <Card titulo="Itens do Pedido">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Código</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Descrição</th>
                                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Qtd</th>
                                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Valor Unit.</th>
                                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {itens.map((item) => (
                                        <tr key={item.id}>
                                            <td className="px-4 py-3 text-sm text-gray-900">{item.codigo_produto}</td>
                                            <td className="px-4 py-3 text-sm text-gray-600">{item.descricao_produto}</td>
                                            <td className="px-4 py-3 text-sm text-gray-900 text-right">
                                                {formatarNumero(item.quantidade, 2)}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-900 text-right">
                                                {formatarMoeda(item.valor_unitario)}
                                            </td>
                                            <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                                                {formatarMoeda(item.valor_total)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>

                    {/* Timeline */}
                    <Card titulo="Histórico do Pedido">
                        <div className="space-y-4">
                            {timeline.map((evento, index) => {
                                const icones: any = {
                                    criacao: <Package className="text-blue-600" size={20} />,
                                    faturamento: <CheckCircle className="text-green-600" size={20} />,
                                    separacao_iniciada: <Clock className="text-yellow-600" size={20} />,
                                    separacao_concluida: <CheckCircle className="text-purple-600" size={20} />,
                                    conferencia: <CheckCircle className="text-cyan-600" size={20} />,
                                    expedicao: <Truck className="text-orange-600" size={20} />,
                                    entrega: <CheckCircle className="text-emerald-600" size={20} />,
                                };

                                return (
                                    <div key={index} className="flex gap-4">
                                        <div className="flex flex-col items-center">
                                            <div className="p-2 rounded-full bg-gray-100">{icones[evento.tipo] || <Clock size={20} />}</div>
                                            {index < timeline.length - 1 && <div className="w-0.5 flex-1 bg-gray-200 my-2"></div>}
                                        </div>
                                        <div className="flex-1 pb-4">
                                            <p className="font-medium text-gray-900">{evento.descricao}</p>
                                            <p className="text-sm text-gray-500">{formatarDataHora(evento.data)}</p>
                                            {evento.usuario && <p className="text-xs text-gray-400 mt-1">por {evento.usuario}</p>}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </Card>
                </div>

                {/* Coluna Lateral */}
                <div className="space-y-6">
                    {/* Cliente */}
                    <Card titulo="Cliente">
                        <div className="space-y-3">
                            <div className="flex items-start gap-2">
                                <User className="text-gray-400 mt-1" size={18} />
                                <div>
                                    <p className="font-medium text-gray-900">{pedido.cliente_nome}</p>
                                    <p className="text-sm text-gray-500">{pedido.cliente_codigo}</p>
                                </div>
                            </div>
                            {pedido.cliente_cidade && (
                                <div className="flex items-start gap-2">
                                    <MapPin className="text-gray-400 mt-1" size={18} />
                                    <div>
                                        <p className="text-sm text-gray-600">
                                            {pedido.cliente_cidade} - {pedido.cliente_uf}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Vendedor */}
                    {pedido.vendedor_nome && (
                        <Card titulo="Vendedor">
                            <p className="font-medium text-gray-900">{pedido.vendedor_nome}</p>
                        </Card>
                    )}

                    {/* Separação */}
                    {pedido.separacao_status && (
                        <Card titulo="Separação">
                            <div className="space-y-2">
                                <div>
                                    <p className="text-sm text-gray-500">Separador</p>
                                    <p className="font-medium text-gray-900">{pedido.separador_nome || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Início</p>
                                    <p className="text-gray-700">{formatarDataHora(pedido.separacao_inicio)}</p>
                                </div>
                                {pedido.separacao_fim && (
                                    <div>
                                        <p className="text-sm text-gray-500">Conclusão</p>
                                        <p className="text-gray-700">{formatarDataHora(pedido.separacao_fim)}</p>
                                    </div>
                                )}
                            </div>
                        </Card>
                    )}

                    {/* Conferência */}
                    {pedido.conferencia_data && (
                        <Card titulo="Conferência">
                            <div className="space-y-2">
                                <div>
                                    <p className="text-sm text-gray-500">Conferente</p>
                                    <p className="font-medium text-gray-900">{pedido.conferente_nome || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Data</p>
                                    <p className="text-gray-700">{formatarDataHora(pedido.conferencia_data)}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Status</p>
                                    <span
                                        className={`inline-block px-2 py-1 rounded text-xs ${pedido.conferencia_aprovada ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                            }`}
                                    >
                                        {pedido.conferencia_aprovada ? 'Aprovado' : 'Reprovado'}
                                    </span>
                                </div>
                            </div>
                        </Card>
                    )}

                    {/* Expedição */}
                    {pedido.data_hora_expedicao && (
                        <Card titulo="Expedição">
                            <div className="space-y-2">
                                <div>
                                    <p className="text-sm text-gray-500">Data Expedição</p>
                                    <p className="text-gray-700">{formatarDataHora(pedido.data_hora_expedicao)}</p>
                                </div>
                                {pedido.numero_romaneio && (
                                    <div>
                                        <p className="text-sm text-gray-500">Romaneio</p>
                                        <p className="font-medium text-gray-900">{pedido.numero_romaneio}</p>
                                    </div>
                                )}
                                {pedido.rota_nome && (
                                    <div>
                                        <p className="text-sm text-gray-500">Rota</p>
                                        <p className="text-gray-700">{pedido.rota_nome}</p>
                                    </div>
                                )}
                                {pedido.veiculo_placa && (
                                    <div>
                                        <p className="text-sm text-gray-500">Veículo</p>
                                        <p className="text-gray-700">{pedido.veiculo_placa}</p>
                                    </div>
                                )}
                                {pedido.transportadora_nome && (
                                    <div>
                                        <p className="text-sm text-gray-500">Transportadora</p>
                                        <p className="text-gray-700">{pedido.transportadora_nome}</p>
                                    </div>
                                )}
                            </div>
                        </Card>
                    )}

                    {/* Entrega */}
                    {pedido.data_hora_entrega && (
                        <Card titulo="Entrega">
                            <div className="space-y-2">
                                <div>
                                    <p className="text-sm text-gray-500">Data Entrega</p>
                                    <p className="text-gray-700">{formatarDataHora(pedido.data_hora_entrega)}</p>
                                </div>
                                {pedido.nome_recebedor && (
                                    <div>
                                        <p className="text-sm text-gray-500">Recebido por</p>
                                        <p className="font-medium text-gray-900">{pedido.nome_recebedor}</p>
                                    </div>
                                )}
                            </div>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
