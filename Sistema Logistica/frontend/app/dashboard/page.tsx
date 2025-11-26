'use client';

import { useEffect, useState } from 'react';
import { CardKPI } from '@/components/Card';
import { Package, Truck, CheckCircle, AlertTriangle, Clock, TrendingUp } from 'lucide-react';
import api from '@/lib/api';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import StatusBadge from '@/components/StatusBadge';
import { formatarDataHora } from '@/lib/utils';

// Registrar componentes do Chart.js
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

interface Estatisticas {
    pedidos_pendentes_expedicao: number;
    pedidos_pendentes_atraso: number;
    pedidos_expedidos_hoje: number;
    pedidos_em_rota: number;
    pedidos_entregues_hoje: number;
    entregas_atrasadas: number;
    tempo_medio_expedicao_horas: number;
    tempo_medio_entrega_horas: number;
}

export default function DashboardPage() {
    const [estatisticas, setEstatisticas] = useState<Estatisticas | null>(null);
    const [graficoExpedicoes, setGraficoExpedicoes] = useState<any>(null);
    const [expedicoesHoje, setExpedicoesHoje] = useState<any[]>([]);
    const [carregando, setCarregando] = useState(true);

    useEffect(() => {
        carregarDados();
        // Auto-refresh a cada 30 segundos
        const intervalo = setInterval(carregarDados, 30000);
        return () => clearInterval(intervalo);
    }, []);

    const carregarDados = async () => {
        try {
            // Carregar estatísticas
            const { data: stats } = await api.get('/dashboard/estatisticas');
            setEstatisticas(stats);

            // Carregar dados do gráfico
            const { data: grafico } = await api.get('/dashboard/grafico-expedicoes');
            setGraficoExpedicoes(grafico.dados);

            // Carregar expedições de hoje
            const { data: expedicoes } = await api.get('/dashboard/expedicoes-hoje');
            setExpedicoesHoje(expedicoes.expedicoes);
        } catch (erro) {
            console.error('Erro ao carregar dashboard:', erro);
        } finally {
            setCarregando(false);
        }
    };

    if (carregando) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-gray-600">Carregando dashboard...</p>
                </div>
            </div>
        );
    }

    // Dados do gráfico
    const dadosGrafico = {
        labels: graficoExpedicoes?.map((d: any) => new Date(d.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })) || [],
        datasets: [
            {
                label: 'Expedições',
                data: graficoExpedicoes?.map((d: any) => d.quantidade) || [],
                borderColor: 'rgb(59, 130, 246)',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                tension: 0.4,
            },
        ],
    };

    const opcoesGrafico = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false,
            },
            tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                padding: 12,
                titleFont: { size: 14 },
                bodyFont: { size: 13 },
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    precision: 0,
                },
            },
        },
    };

    return (
        <div className="space-y-6">
            {/* Cabeçalho */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                    <p className="text-gray-500 mt-1">Visão geral das operações logísticas</p>
                </div>
                <div className="text-sm text-gray-500">
                    Última atualização: {new Date().toLocaleTimeString('pt-BR')}
                </div>
            </div>

            {/* KPIs Principais */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <CardKPI
                    titulo="Pendentes de Expedição"
                    valor={estatisticas?.pedidos_pendentes_expedicao || 0}
                    icone={<Clock size={24} />}
                    cor="yellow"
                    descricao={`${estatisticas?.pedidos_pendentes_atraso || 0} com atraso`}
                />
                <CardKPI
                    titulo="Expedidos Hoje"
                    valor={estatisticas?.pedidos_expedidos_hoje || 0}
                    icone={<Package size={24} />}
                    cor="blue"
                />
                <CardKPI
                    titulo="Em Rota"
                    valor={estatisticas?.pedidos_em_rota || 0}
                    icone={<Truck size={24} />}
                    cor="purple"
                    descricao={`${estatisticas?.entregas_atrasadas || 0} atrasadas`}
                />
                <CardKPI
                    titulo="Entregas Hoje"
                    valor={estatisticas?.pedidos_entregues_hoje || 0}
                    icone={<CheckCircle size={24} />}
                    cor="green"
                />
            </div>

            {/* Métricas de Tempo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="text-blue-600" size={20} />
                        <h3 className="font-semibold text-gray-900">Tempo Médio de Expedição</h3>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">
                        {estatisticas?.tempo_medio_expedicao_horas?.toFixed(1) || '0'} <span className="text-lg text-gray-500">horas</span>
                    </p>
                    <p className="text-sm text-gray-500 mt-2">Do faturamento até a expedição</p>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="text-green-600" size={20} />
                        <h3 className="font-semibold text-gray-900">Tempo Médio de Entrega</h3>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">
                        {estatisticas?.tempo_medio_entrega_horas?.toFixed(1) || '0'} <span className="text-lg text-gray-500">horas</span>
                    </p>
                    <p className="text-sm text-gray-500 mt-2">Da expedição até a entrega</p>
                </div>
            </div>

            {/* Gráfico de Expedições */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Expedições - Últimos 7 Dias</h3>
                <div className="h-64">
                    <Line data={dadosGrafico} options={opcoesGrafico} />
                </div>
            </div>

            {/* Expedições de Hoje */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Expedições Realizadas Hoje</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Horário</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">N° Pedido</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Romaneio</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rota</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {expedicoesHoje.length > 0 ? (
                                expedicoesHoje.map((exp: any) => (
                                    <tr key={exp.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 text-sm text-gray-900">
                                            {new Date(exp.data_hora_expedicao).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                            {exp.pedidos?.numero_pedido || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {exp.numero_romaneio}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {exp.rotas?.nome || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            <StatusBadge status={exp.rotas?.tipo === 'frota_propria' ? 'expedido' : 'em_transito'} />
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                        Nenhuma expedição realizada hoje
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Alertas */}
            {(estatisticas?.pedidos_pendentes_atraso || 0) > 0 && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="text-yellow-600" size={20} />
                        <p className="text-sm font-medium text-yellow-800">
                            Atenção: {estatisticas?.pedidos_pendentes_atraso} pedido(s) pendente(s) há mais de 3 dias
                        </p>
                    </div>
                </div>
            )}

            {(estatisticas?.entregas_atrasadas || 0) > 0 && (
                <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="text-red-600" size={20} />
                        <p className="text-sm font-medium text-red-800">
                            Urgente: {estatisticas?.entregas_atrasadas} entrega(s) atrasada(s)
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
