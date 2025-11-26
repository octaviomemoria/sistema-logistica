'use client';

import { useState } from 'react';
import api from '@/lib/api';
import Card from '@/components/Card';
import { formatarData, formatarDataHora, formatarMoeda, formatarNumero } from '@/lib/utils';
import { Download, FileText, Filter, Calendar } from 'lucide-react';

type TipoRelatorio = 'expedicoes' | 'entregas' | 'desempenho_separadores' | 'tempo_medio';

export default function RelatoriosPage() {
    const [tipoRelatorio, setTipoRelatorio] = useState<TipoRelatorio>('expedicoes');
    const [dataInicio, setDataInicio] = useState('');
    const [dataFim, setDataFim] = useState('');
    const [dados, setDados] = useState<any>(null);
    const [carregando, setCarregando] = useState(false);

    const gerarRelatorio = async () => {
        if (!dataInicio || !dataFim) {
            alert('Selecione o período');
            return;
        }

        setCarregando(true);
        try {
            const endpoint = `/relatorios/${tipoRelatorio.replace('_', '-')}`;
            const { data } = await api.get(endpoint, {
                params: {
                    data_inicio: dataInicio,
                    data_fim: dataFim,
                },
            });

            setDados(data);
        } catch (erro) {
            console.error('Erro ao gerar relatório:', erro);
            alert('Erro ao gerar relatório');
        } finally {
            setCarregando(false);
        }
    };

    const exportarCSV = () => {
        if (!dados) return;

        let csv = '';
        let filename = '';

        switch (tipoRelatorio) {
            case 'expedicoes':
                filename = 'expedicoes.csv';
                csv = 'Data;Pedido;NF;Cliente;Valor;Rota;Tipo\n';
                dados.expedicoes?.forEach((exp: any) => {
                    csv += `${formatarDataHora(exp.data_hora_expedicao)};${exp.pedidos?.numero_pedido};${exp.pedidos?.numero_nf};${exp.pedidos?.clientes?.nome
                        };${exp.pedidos?.valor_total};${exp.rotas?.nome};${exp.rotas?.tipo}\n`;
                });
                break;

            case 'entregas':
                filename = 'entregas.csv';
                csv = 'Data;Pedido;NF;Cliente;Cidade;Recebedor;Motorista\n';
                dados.entregas?.forEach((ent: any) => {
                    csv += `${formatarDataHora(ent.data_hora_entrega)};${ent.pedidos?.numero_pedido};${ent.pedidos?.numero_nf};${ent.pedidos?.clientes?.nome
                        };${ent.pedidos?.clientes?.cidade};${ent.nome_recebedor};${ent.motoristas?.nome}\n`;
                });
                break;

            case 'desempenho_separadores':
                filename = 'desempenho_separadores.csv';
                csv = 'Separador;Total Separações;Tempo Total (min);Tempo Médio (min)\n';
                dados.desempenho?.forEach((desemp: any) => {
                    csv += `${desemp.nome_separador};${desemp.total_separacoes};${desemp.tempo_total_minutos.toFixed(2)};${desemp.tempo_medio_minutos.toFixed(
                        2
                    )}\n`;
                });
                break;
        }

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
    };

    return (
        <div className="space-y-6">
            {/* Cabeçalho */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Relatórios</h1>
                <p className="text-gray-500 mt-1">Análises e relatórios gerenciais</p>
            </div>

            {/* Filtros */}
            <Card titulo="Filtros">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Relatório</label>
                        <select
                            value={tipoRelatorio}
                            onChange={(e) => setTipoRelatorio(e.target.value as TipoRelatorio)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                            <option value="expedicoes">Expedições</option>
                            <option value="entregas">Entregas</option>
                            <option value="desempenho_separadores">Desempenho Separadores</option>
                            <option value="tempo_medio">Tempos Médios</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Data Início</label>
                        <input
                            type="date"
                            value={dataInicio}
                            onChange={(e) => setDataInicio(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Data Fim</label>
                        <input
                            type="date"
                            value={dataFim}
                            onChange={(e) => setDataFim(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>

                    <div className="flex items-end">
                        <button
                            onClick={gerarRelatorio}
                            disabled={carregando}
                            className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            <Filter size={16} />
                            {carregando ? 'Gerando...' : 'Gerar Relatório'}
                        </button>
                    </div>
                </div>
            </Card>

            {/* Resultados */}
            {dados && (
                <Card
                    titulo="Resultados"
                    acoes={
                        <button
                            onClick={exportarCSV}
                            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                            <Download size={16} />
                            Exportar CSV
                        </button>
                    }
                >
                    {tipoRelatorio === 'expedicoes' && dados.expedicoes && (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data/Hora</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pedido</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">NF</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Valor</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rota</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {dados.expedicoes.map((exp: any) => (
                                        <tr key={exp.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 text-sm text-gray-600">{formatarDataHora(exp.data_hora_expedicao)}</td>
                                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{exp.pedidos?.numero_pedido}</td>
                                            <td className="px-4 py-3 text-sm text-gray-600">{exp.pedidos?.numero_nf}</td>
                                            <td className="px-4 py-3 text-sm text-gray-600">{exp.pedidos?.clientes?.nome}</td>
                                            <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                                                {formatarMoeda(exp.pedidos?.valor_total)}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600">{exp.rotas?.nome || '-'}</td>
                                            <td className="px-4 py-3 text-sm text-gray-600">
                                                {exp.rotas?.tipo === 'frota_propria' ? 'Frota Própria' : 'Transportadora'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <div className="mt-4 pt-4 border-t text-sm text-gray-600">
                                Total de expedições: <span className="font-bold">{dados.expedicoes.length}</span>
                            </div>
                        </div>
                    )}

                    {tipoRelatorio === 'entregas' && dados.entregas && (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data/Hora</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pedido</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cidade</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Recebedor</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Motorista</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {dados.entregas.map((ent: any) => (
                                        <tr key={ent.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 text-sm text-gray-600">{formatarDataHora(ent.data_hora_entrega)}</td>
                                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{ent.pedidos?.numero_pedido}</td>
                                            <td className="px-4 py-3 text-sm text-gray-600">{ent.pedidos?.clientes?.nome}</td>
                                            <td className="px-4 py-3 text-sm text-gray-600">{ent.pedidos?.clientes?.cidade}</td>
                                            <td className="px-4 py-3 text-sm text-gray-600">{ent.nome_recebedor}</td>
                                            <td className="px-4 py-3 text-sm text-gray-600">{ent.motoristas?.nome || '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <div className="mt-4 pt-4 border-t text-sm text-gray-600">
                                Total de entregas: <span className="font-bold">{dados.entregas.length}</span>
                            </div>
                        </div>
                    )}

                    {tipoRelatorio === 'desempenho_separadores' && dados.desempenho && (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Separador</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Separações</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Tempo Total (min)</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Tempo Médio (min)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {dados.desempenho.map((desemp: any, index: number) => (
                                        <tr key={index} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{desemp.nome_separador}</td>
                                            <td className="px-4 py-3 text-sm text-gray-900 text-right">{desemp.total_separacoes}</td>
                                            <td className="px-4 py-3 text-sm text-gray-600 text-right">
                                                {formatarNumero(desemp.tempo_total_minutos, 2)}
                                            </td>
                                            <td className="px-4 py-3 text-sm font-medium text-primary text-right">
                                                {formatarNumero(desemp.tempo_medio_minutos, 2)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {tipoRelatorio === 'tempo_medio' && dados && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-blue-50 rounded-lg p-6 text-center">
                                <p className="text-sm text-blue-600 font-medium mb-2">Tempo Médio de Expedição</p>
                                <p className="text-4xl font-bold text-blue-900">{dados.tempo_medio_expedicao_horas || '0'}</p>
                                <p className="text-blue-600 mt-1">horas</p>
                            </div>

                            <div className="bg-green-50 rounded-lg p-6 text-center">
                                <p className="text-sm text-green-600 font-medium mb-2">Tempo Médio de Entrega</p>
                                <p className="text-4xl font-bold text-green-900">{dados.tempo_medio_entrega_horas || '0'}</p>
                                <p className="text-green-600 mt-1">horas</p>
                            </div>

                            <div className="bg-purple-50 rounded-lg p-6 text-center">
                                <p className="text-sm text-purple-600 font-medium mb-2">Pedidos Analisados</p>
                                <p className="text-4xl font-bold text-purple-900">{dados.total_pedidos_analisados || '0'}</p>
                                <p className="text-purple-600 mt-1">pedidos</p>
                            </div>
                        </div>
                    )}

                    {!dados || (Array.isArray(dados) && dados.length === 0) ? (
                        <div className="text-center py-12">
                            <FileText className="mx-auto text-gray-300 mb-4" size={48} />
                            <p className="text-gray-500">Nenhum dado encontrado para o período selecionado</p>
                        </div>
                    ) : null}
                </Card>
            )}

            {!dados && !carregando && (
                <div className="text-center py-12">
                    <Calendar className="mx-auto text-gray-300 mb-4" size={64} />
                    <p className="text-gray-500">Selecione o período e gere um relatório</p>
                </div>
            )}
        </div>
    );
}
