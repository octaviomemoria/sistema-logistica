'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import Card from '@/components/Card';
import StatusBadge from '@/components/StatusBadge';
import { formatarData, formatarMoeda } from '@/lib/utils';
import { Plus, Truck, MapPin, Save, ArrowRight } from 'lucide-react';

export default function RoteirizacaoPage() {
    const [pedidosDisponiveis, setPedidosDisponiveis] = useState<any[]>([]);
    const [rotaAtual, setRotaAtual] = useState<any>({
        nome: '',
        data_rota: new Date().toISOString().split('T')[0],
        tipo: 'frota_propria',
        veiculo_id: '',
        motorista_id: '',
        transportadora_id: '',
        pedidos: [],
    });
    const [veiculos, setVeiculos] = useState<any[]>([]);
    const [motoristas, setMotoristas] = useState<any[]>([]);
    const [transportadoras, setTransportadoras] = useState<any[]>([]);
    const [salvando, setSalvando] = useState(false);
    const [carregando, setCarregando] = useState(true);

    useEffect(() => {
        carregarDados();
    }, []);

    const carregarDados = async () => {
        try {
            // Carregar pedidos disponíveis (conferidos e não expedidos)
            const { data: pedidos } = await api.get('/pedidos', {
                params: { status: 'conferido', limite: 100 },
            });
            setPedidosDisponiveis(pedidos.pedidos);

            // Carregar veículos
            const { data: veiculosData } = await api.get('/cadastros/veiculos');
            setVeiculos(veiculosData.veiculos);

            // Carregar motoristas
            const { data: motoristasData } = await api.get('/cadastros/motoristas');
            setMotoristas(motoristasData.motoristas);

            // Carregar transportadoras
            const { data: transportadorasData } = await api.get('/cadastros/transportadoras');
            setTransportadoras(transportadorasData.transportadoras);
        } catch (erro) {
            console.error('Erro ao carregar dados:', erro);
        } finally {
            setCarregando(false);
        }
    };

    const adicionarPedidoARota = (pedido: any) => {
        if (rotaAtual.pedidos.find((p: any) => p.id === pedido.id)) {
            alert('Pedido já está na rota');
            return;
        }

        setRotaAtual({
            ...rotaAtual,
            pedidos: [...rotaAtual.pedidos, { ...pedido, sequencia: rotaAtual.pedidos.length + 1 }],
        });

        // Remover da lista de disponíveis
        setPedidosDisponiveis(pedidosDisponiveis.filter((p) => p.id !== pedido.id));
    };

    const removerPedidoDaRota = (pedidoId: string) => {
        const pedido = rotaAtual.pedidos.find((p: any) => p.id === pedidoId);
        if (pedido) {
            setPedidosDisponiveis([...pedidosDisponiveis, pedido]);
        }

        setRotaAtual({
            ...rotaAtual,
            pedidos: rotaAtual.pedidos
                .filter((p: any) => p.id !== pedidoId)
                .map((p: any, index: number) => ({ ...p, sequencia: index + 1 })),
        });
    };

    const moverPedido = (index: number, direcao: 'cima' | 'baixo') => {
        const novosPedidos = [...rotaAtual.pedidos];
        const novoIndex = direcao === 'cima' ? index - 1 : index + 1;

        if (novoIndex < 0 || novoIndex >= novosPedidos.length) return;

        [novosPedidos[index], novosPedidos[novoIndex]] = [novosPedidos[novoIndex], novosPedidos[index]];

        setRotaAtual({
            ...rotaAtual,
            pedidos: novosPedidos.map((p, idx) => ({ ...p, sequencia: idx + 1 })),
        });
    };

    const salvarRota = async () => {
        if (!rotaAtual.nome) {
            alert('Informe o nome da rota');
            return;
        }

        if (rotaAtual.pedidos.length === 0) {
            alert('Adicione pelo menos um pedido à rota');
            return;
        }

        if (rotaAtual.tipo === 'frota_propria' && (!rotaAtual.veiculo_id || !rotaAtual.motorista_id)) {
            alert('Selecione o veículo e motorista para frota própria');
            return;
        }

        if (rotaAtual.tipo === 'transportadora' && !rotaAtual.transportadora_id) {
            alert('Selecione a transportadora');
            return;
        }

        setSalvando(true);
        try {
            // Criar rota
            const dadosRota: any = {
                nome: rotaAtual.nome,
                data_rota: rotaAtual.data_rota,
                tipo: rotaAtual.tipo,
            };

            if (rotaAtual.tipo === 'frota_propria') {
                dadosRota.veiculo_id = rotaAtual.veiculo_id;
                dadosRota.motorista_id = rotaAtual.motorista_id;
            } else {
                dadosRota.transportadora_id = rotaAtual.transportadora_id;
            }

            const { data: novaRota } = await api.post('/rotas', dadosRota);

            // Adicionar pedidos à rota
            const pedidosParaAdicionar = rotaAtual.pedidos.map((p: any) => ({
                pedido_id: p.id,
                sequencia_entrega: p.sequencia,
            }));

            await api.post(`/rotas/${novaRota.rota.id}/pedidos`, {
                pedidos: pedidosParaAdicionar,
            });

            alert('Rota criada com sucesso!');

            // Limpar formulário
            setRotaAtual({
                nome: '',
                data_rota: new Date().toISOString().split('T')[0],
                tipo: 'frota_propria',
                veiculo_id: '',
                motorista_id: '',
                transportadora_id: '',
                pedidos: [],
            });

            // Recarregar dados
            carregarDados();
        } catch (erro: any) {
            console.error('Erro ao salvar rota:', erro);
            alert('Erro ao salvar rota: ' + (erro.response?.data?.mensagem || erro.message));
        } finally {
            setSalvando(false);
        }
    };

    const calcularTotais = () => {
        return rotaAtual.pedidos.reduce(
            (acc: any, pedido: any) => ({
                valor: acc.valor + (pedido.valor_total || 0),
                peso: acc.peso + (pedido.peso_total_kg || 0),
                volumes: acc.volumes + (pedido.quantidade_volumes || 1),
            }),
            { valor: 0, peso: 0, volumes: 0 }
        );
    };

    if (carregando) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-gray-600">Carregando dados...</p>
                </div>
            </div>
        );
    }

    const totais = calcularTotais();

    return (
        <div className="space-y-6">
            {/* Cabeçalho */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Roteirização</h1>
                <p className="text-gray-500 mt-1">Monte rotas de entrega otimizadas</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Pedidos Disponíveis */}
                <div className="lg:col-span-1">
                    <Card titulo="Pedidos Disponíveis" className="h-full">
                        <div className="space-y-2 max-h-[600px] overflow-y-auto">
                            {pedidosDisponiveis.length > 0 ? (
                                pedidosDisponiveis.map((pedido) => (
                                    <div
                                        key={pedido.id}
                                        className="p-3 border border-gray-200 rounded-lg hover:border-primary cursor-pointer transition-colors"
                                        onClick={() => adicionarPedidoARota(pedido)}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="font-medium text-gray-900">{pedido.numero_pedido}</span>
                                            <button className="text-primary hover:bg-blue-50 p-1 rounded">
                                                <Plus size={16} />
                                            </button>
                                        </div>
                                        <p className="text-sm text-gray-600 mb-1">{pedido.cliente_nome}</p>
                                        <div className="flex items-center justify-between text-xs text-gray-500">
                                            <span>{pedido.cliente_cidade}</span>
                                            <span>{formatarMoeda(pedido.valor_total)}</span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center text-gray-500 py-8">Nenhum pedido disponível para roteirização</p>
                            )}
                        </div>
                    </Card>
                </div>

                {/* Montagem da Rota */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Configurações da Rota */}
                    <Card titulo="Configurações da Rota">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Nome da Rota</label>
                                <input
                                    type="text"
                                    value={rotaAtual.nome}
                                    onChange={(e) => setRotaAtual({ ...rotaAtual, nome: e.target.value })}
                                    placeholder="Ex: Rota SP Centro - 26/11"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Data da Rota</label>
                                <input
                                    type="date"
                                    value={rotaAtual.data_rota}
                                    onChange={(e) => setRotaAtual({ ...rotaAtual, data_rota: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
                                <select
                                    value={rotaAtual.tipo}
                                    onChange={(e) => setRotaAtual({ ...rotaAtual, tipo: e.target.value as any })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                >
                                    <option value="frota_propria">Frota Própria</option>
                                    <option value="transportadora">Transportadora</option>
                                </select>
                            </div>

                            {rotaAtual.tipo === 'frota_propria' ? (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Veículo</label>
                                        <select
                                            value={rotaAtual.veiculo_id}
                                            onChange={(e) => setRotaAtual({ ...rotaAtual, veiculo_id: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                        >
                                            <option value="">Selecione...</option>
                                            {veiculos.map((veiculo) => (
                                                <option key={veiculo.id} value={veiculo.id}>
                                                    {veiculo.placa} - {veiculo.modelo}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Motorista</label>
                                        <select
                                            value={rotaAtual.motorista_id}
                                            onChange={(e) => setRotaAtual({ ...rotaAtual, motorista_id: e.target.value })}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                        >
                                            <option value="">Selecione...</option>
                                            {motoristas.map((motorista) => (
                                                <option key={motorista.id} value={motorista.id}>
                                                    {motorista.nome}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </>
                            ) : (
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Transportadora</label>
                                    <select
                                        value={rotaAtual.transportadora_id}
                                        onChange={(e) => setRotaAtual({ ...rotaAtual, transportadora_id: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                    >
                                        <option value="">Selecione...</option>
                                        {transportadoras.map((transportadora) => (
                                            <option key={transportadora.id} value={transportadora.id}>
                                                {transportadora.nome}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Pedidos na Rota */}
                    <Card
                        titulo="Pedidos na Rota"
                        acoes={
                            <div className="flex items-center gap-4">
                                <div className="text-sm text-gray-600">
                                    {rotaAtual.pedidos.length} pedido(s) - {formatarMoeda(totais.valor)}
                                </div>
                                <button
                                    onClick={salvarRota}
                                    disabled={salvando || rotaAtual.pedidos.length === 0}
                                    className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Save size={16} />
                                    {salvando ? 'Salvando...' : 'Salvar Rota'}
                                </button>
                            </div>
                        }
                    >
                        {rotaAtual.pedidos.length > 0 ? (
                            <div className="space-y-2">
                                {rotaAtual.pedidos.map((pedido: any, index: number) => (
                                    <div key={pedido.id} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                                        {/* Sequência */}
                                        <div className="flex flex-col gap-1">
                                            <button
                                                onClick={() => moverPedido(index, 'cima')}
                                                disabled={index === 0}
                                                className="text-gray-400 hover:text-primary disabled:opacity-30"
                                            >
                                                ▲
                                            </button>
                                            <span className="text-sm font-bold text-primary text-center">{pedido.sequencia}</span>
                                            <button
                                                onClick={() => moverPedido(index, 'baixo')}
                                                disabled={index === rotaAtual.pedidos.length - 1}
                                                className="text-gray-400 hover:text-primary disabled:opacity-30"
                                            >
                                                ▼
                                            </button>
                                        </div>

                                        {/* Informações */}
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="font-medium text-gray-900">{pedido.numero_pedido}</span>
                                                <span className="text-sm font-medium text-gray-900">{formatarMoeda(pedido.valor_total)}</span>
                                            </div>
                                            <p className="text-sm text-gray-600">{pedido.cliente_nome}</p>
                                            <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                                                <MapPin size={12} />
                                                <span>{pedido.cliente_cidade} - {pedido.cliente_uf}</span>
                                            </div>
                                        </div>

                                        {/* Remover */}
                                        <button
                                            onClick={() => removerPedidoDaRota(pedido.id)}
                                            className="text-red-600 hover:bg-red-50 p-2 rounded"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))}

                                {/* Totais */}
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                    <div className="grid grid-cols-3 gap-4 text-center">
                                        <div>
                                            <p className="text-sm text-gray-500">Valor Total</p>
                                            <p className="text-lg font-bold text-gray-900">{formatarMoeda(totais.valor)}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Peso Total</p>
                                            <p className="text-lg font-bold text-gray-900">{totais.peso.toFixed(2)} kg</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Volumes</p>
                                            <p className="text-lg font-bold text-gray-900">{totais.volumes}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <Truck className="mx-auto text-gray-300 mb-4" size={48} />
                                <p className="text-gray-500">Adicione pedidos à rota</p>
                                <p className="text-sm text-gray-400 mt-1">Clique nos pedidos disponíveis ao lado</p>
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
}
