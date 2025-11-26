'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import Card from '@/components/Card';
import { formatarData, formatarMoeda } from '@/lib/utils';
import {
    BarChart3,
    Calendar,
    Clock,
    Truck,
    PackageCheck,
    TrendingUp,
    Download,
    Filter
} from 'lucide-react';

export default function RelatoriosPage() {
    // Estados para filtros
    const [dataInicio, setDataInicio] = useState(
        new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]
    );
    const [dataFim, setDataFim] = useState(new Date().toISOString().split('T')[0]);
    const [loading, setLoading] = useState(false);

    // Estados para dados
    const [temposMedios, setTemposMedios] = useState<any>(null);
    const [desempenhoSeparadores, setDesempenhoSeparadores] = useState<any[]>([]);
    const [expedicoes, setExpedicoes] = useState<any[]>([]);
    const [entregas, setEntregas] = useState<any[]>([]);
    const [abaAtiva, setAbaAtiva] = useState<'geral' | 'expedicoes' | 'entregas'>('geral');

    useEffect(() => {
        carregarRelatorios();
    }, []); // Carrega inicial, depois só quando clicar em filtrar

    const carregarRelatorios = async () => {
        setLoading(true);
        try {
            const params = { data_inicio: dataInicio, data_fim: dataFim };

            // Carregar todos os dados em paralelo
            const [resTempos, resDesempenho, resExpedicoes, resEntregas] = await Promise.all([
                api.get('/relatorios/tempo-medio', { params }),
                api.get('/relatorios/desempenho-separadores', { params }),
                api.get('/relatorios/expedicoes', { params }),
                api.get('/relatorios/entregas', { params })
            ]);

            setTemposMedios(resTempos.data);
            setDesempenhoSeparadores(resDesempenho.data.desempenho);
            setExpedicoes(resExpedicoes.data.expedicoes);
            setEntregas(resEntregas.data.entregas);

        } catch (erro) {
            console.error('Erro ao carregar relatórios:', erro);
            alert('Erro ao carregar dados dos relatórios');
        } finally {
            setLoading(false);
        }
    };

    const exportarCSV = (dados: any[], nomeArquivo: string) => {
        // Implementação simples de exportação
        if (!dados.length) return;

        const headers = Object.keys(dados[0]).join(',');
        const rows = dados.map(obj => Object.values(obj).map(val =>
            typeof val === 'object' ? JSON.stringify(val) : val
        ).join(','));

        const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `${nomeArquivo}.csv`);
        document.body.appendChild(link);
        link.click();
    };

    return (
        <div className="space-y-6">
            {/* Cabeçalho */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Relatórios Gerenciais</h1>
                    <p className="text-gray-500 mt-1">Análise de desempenho e operações</p>
                </div>

                {/* Filtros de Data */}
                <div className="flex items-end gap-2 bg-white p-2 rounded-lg shadow-sm border border-gray-200">
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">Data Início</label>
                        <input
                            type="date"
                            value={dataInicio}
                            onChange={e => setDataInicio(e.target.value)}
                            className="px-2 py-1 border rounded text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">Data Fim</label>
                        <input
                            type="date"
                            value={dataFim}
                            onChange={e => setDataFim(e.target.value)}
                            className="px-2 py-1 border rounded text-sm"
                        />
                    </div>
                    <button
                        onClick={carregarRelatorios}
                        disabled={loading}
                        className="px-4 py-1.5 bg-primary text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 text-sm h-[34px]"
                    >
                        <Filter size={16} />
                        Filtrar
                    </button>
                </div>
            </div>

            {/* Navegação de Abas */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                    <button
                        onClick={() => setAbaAtiva('geral')}
                        className={`
                            whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2
                            ${abaAtiva === 'geral'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                        `}
                    >
                        <BarChart3 size={18} />
                        Visão Geral
                    </button>
                    <button
                        onClick={() => setAbaAtiva('expedicoes')}
                        className={`
                            whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2
                            ${abaAtiva === 'expedicoes'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                        `}
                    >
                        <PackageCheck size={18} />
                        Expedições
                    </button>
                    <button
                        onClick={() => setAbaAtiva('entregas')}
                        className={`
                            whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2
                            ${abaAtiva === 'entregas'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                        `}
                    >
                        <Truck size={18} />
                        Entregas
                    </button>
                </nav>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
            ) : (
                <>
                    {/* Conteúdo: Visão Geral */}
                    {abaAtiva === 'geral' && (
                        <div className="space-y-6">
                            {/* KPIs de Tempo */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <Card className="bg-blue-50 border-blue-100">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-blue-100 rounded-full text-blue-600">
                                            <Clock size={24} />
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600">Tempo Médio Expedição</p>
                                            <h3 className="text-2xl font-bold text-gray-900">
                                                {temposMedios?.tempo_medio_expedicao_horas || 0}h
                                            </h3>
                                            <p className="text-xs text-gray-500">Faturamento até Saída</p>
                                        </div>
                                    </div>
                                </Card>

                                <Card className="bg-green-50 border-green-100">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-green-100 rounded-full text-green-600">
                                            <Truck size={24} />
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600">Tempo Médio Entrega</p>
                                            <h3 className="text-2xl font-bold text-gray-900">
                                                {temposMedios?.tempo_medio_entrega_horas || 0}h
                                            </h3>
                                            <p className="text-xs text-gray-500">Saída até Entrega</p>
                                        </div>
                                    </div>
                                </Card>

                                <Card className="bg-purple-50 border-purple-100">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-purple-100 rounded-full text-purple-600">
                                            <TrendingUp size={24} />
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600">Total Analisado</p>
                                            <h3 className="text-2xl font-bold text-gray-900">
                                                {temposMedios?.total_pedidos_analisados || 0}
                                            </h3>
                                            <p className="text-xs text-gray-500">Pedidos no período</p>
                                        </div>
                                    </div>
                                </Card>
                            </div>

                            {/* Desempenho Separadores */}
                            <Card titulo="Desempenho da Equipe de Separação">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3">Separador</th>
                                                <th className="px-6 py-3 text-center">Pedidos Separados</th>
                                                <th className="px-6 py-3 text-center">Tempo Total (min)</th>
                                                <th className="px-6 py-3 text-center">Média por Pedido</th>
                                                <th className="px-6 py-3">Eficiência</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {desempenhoSeparadores.length > 0 ? (
                                                desempenhoSeparadores.map((sep, idx) => (
                                                    <tr key={idx} className="bg-white border-b hover:bg-gray-50">
                                                        <td className="px-6 py-4 font-medium text-gray-900">
                                                            {sep.nome_separador || 'N/A'}
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            {sep.total_separacoes}
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            {sep.tempo_total_minutos.toFixed(0)}
                                                        </td>
                                                        <td className="px-6 py-4 text-center font-bold text-primary">
                                                            {sep.tempo_medio_minutos.toFixed(1)} min
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                                                                <div
                                                                    className="bg-primary h-2.5 rounded-full"
                                                                    style={{ width: `${Math.min(100, (15 / (sep.tempo_medio_minutos || 1)) * 100)}%` }}
                                                                ></div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                                                        Nenhum dado encontrado para o período
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </Card>
                        </div>
                    )}

                    {/* Conteúdo: Expedições */}
                    {abaAtiva === 'expedicoes' && (
                        <Card
                            titulo="Relatório de Expedições"
                            acoes={
                                <button
                                    onClick={() => exportarCSV(expedicoes, 'expedicoes')}
                                    className="flex items-center gap-2 text-sm text-primary hover:text-blue-700"
                                >
                                    <Download size={16} /> Exportar CSV
                                </button>
                            }
                        >
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3">Data/Hora</th>
                                            <th className="px-6 py-3">Pedido</th>
                                            <th className="px-6 py-3">Cliente</th>
                                            <th className="px-6 py-3">Rota</th>
                                            <th className="px-6 py-3">Veículo/Transp.</th>
                                            <th className="px-6 py-3">Responsável</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {expedicoes.map((exp) => (
                                            <tr key={exp.id} className="bg-white border-b hover:bg-gray-50">
                                                <td className="px-6 py-4">
                                                    {new Date(exp.data_hora_expedicao).toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4 font-medium">
                                                    {exp.pedidos?.numero_pedido}
                                                    <span className="block text-xs text-gray-500">NF: {exp.pedidos?.numero_nf}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {exp.pedidos?.clientes?.nome}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {exp.rotas?.nome}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {exp.rotas?.tipo === 'frota_propria'
                                                        ? exp.rotas?.veiculos?.placa
                                                        : exp.rotas?.transportadoras?.nome}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {exp.usuarios?.nome}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    )}

                    {/* Conteúdo: Entregas */}
                    {abaAtiva === 'entregas' && (
                        <Card
                            titulo="Relatório de Entregas Realizadas"
                            acoes={
                                <button
                                    onClick={() => exportarCSV(entregas, 'entregas')}
                                    className="flex items-center gap-2 text-sm text-primary hover:text-blue-700"
                                >
                                    <Download size={16} /> Exportar CSV
                                </button>
                            }
                        >
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3">Data Entrega</th>
                                            <th className="px-6 py-3">Pedido</th>
                                            <th className="px-6 py-3">Cliente</th>
                                            <th className="px-6 py-3">Cidade</th>
                                            <th className="px-6 py-3">Motorista</th>
                                            <th className="px-6 py-3">Recebedor</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {entregas.map((ent) => (
                                            <tr key={ent.id} className="bg-white border-b hover:bg-gray-50">
                                                <td className="px-6 py-4">
                                                    {new Date(ent.data_hora_entrega).toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4 font-medium">
                                                    {ent.pedidos?.numero_pedido}
                                                    <span className="block text-xs text-gray-500">
                                                        {formatarMoeda(ent.pedidos?.valor_total)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {ent.pedidos?.clientes?.nome}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {ent.pedidos?.clientes?.cidade}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {ent.motoristas?.nome}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {ent.nome_recebedor}
                                                    <span className="block text-xs text-gray-500">Doc: {ent.documento_recebedor}</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    )}
                </>
            )}
        </div>
    );
}
