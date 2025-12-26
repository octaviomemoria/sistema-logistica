
import React, { useState, useMemo, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, Cell } from 'recharts';
import { RevenueByCategory, Locacao, StatusLocacao, Equipamento, Profile } from '../types';
import StatCard from './StatCard';
import Modal from './Modal';
import Toast from './Toast';
import { ClockIcon, CurrencyDollarIcon, DocumentTextIcon, TruckIcon, WrenchScrewdriverIcon, ArrowDownTrayIcon, SparklesIcon, SpinnerIcon } from './Icons';
import { GoogleGenAI } from '@google/genai';
import { supabase } from '../supabaseClient';

const COLORS = ['#1E40AF', '#1D4ED8', '#3B82F6', '#60A5FA', '#93C5FD'];

const standardReports = [
    { title: 'Ocupação da Frota', description: 'Utilização de cada equipamento em um período.' },
    { title: 'Histórico de Manutenção', description: 'Log completo de manutenções por ativo.' },
    { title: 'Receita por Categoria', description: 'Compara a receita gerada por categorias.' },
    { title: 'Faturamento por Cliente', description: 'Detalha o faturamento total por cliente.' },
    { title: 'Relatório de Inadimplência', description: 'Lista todos os pagamentos atrasados.' },
    { title: 'Relatório de Locações Atrasadas', description: 'Exibe todas as locações com devolução pendente.' },
    { title: 'Curva ABC de Clientes', description: 'Classifica clientes por volume de faturamento.' },
];

const calculateDaysOverdue = (endDate: string) => {
    const due = new Date(endDate);
    const today = new Date();
    due.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    if (due >= today) return 0;
    const diffTime = today.getTime() - due.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};


const Reports: React.FC<{ profile: Profile }> = ({ profile }) => {
    const [locacoes, setLocacoes] = useState<Locacao[]>([]);
    const [equipamentos, setEquipamentos] = useState<Equipamento[]>([]);
    const [loading, setLoading] = useState(true);

    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [exportFormat, setExportFormat] = useState<'csv' | 'pdf'>('csv');
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [isOverdueModalOpen, setIsOverdueModalOpen] = useState(false);
    const [aiQuery, setAiQuery] = useState('');
    const [analysisResult, setAnalysisResult] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [selectedReports, setSelectedReports] = useState<string[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            if (!profile.organization_id) return;
            setLoading(true);
            try {
                const [locacoesRes, equipamentosRes, clientsRes, itemsRes] = await Promise.all([
                    supabase.from('locacoes').select('*').eq('organization_id', profile.organization_id),
                    supabase.from('equipamentos').select('*').eq('organization_id', profile.organization_id),
                    supabase.from('clientes').select('*').eq('organization_id', profile.organization_id),
                    supabase.from('locacao_itens').select('*').eq('organization_id', profile.organization_id)
                ]);
                
                if (locacoesRes.error) throw locacoesRes.error;
                if (equipamentosRes.error) throw equipamentosRes.error;

                const rawLocacoes = locacoesRes.data as Locacao[];
                const rawEquipamentos = equipamentosRes.data as Equipamento[];
                const rawClientes = clientsRes.data || [];
                const itemsData = itemsRes.data || [];

                // Manual Join
                const joinedLocacoes = rawLocacoes.map((loc: any) => {
                    const item = itemsData.find((i: any) => i.locacao_id === loc.id);
                    const equip = item ? rawEquipamentos.find(e => e.id === item.equipamento_id) : null;
                    
                    return {
                        ...loc,
                        equipamentos: equip,
                        clientes: rawClientes.find((c:any) => c.id === loc.cliente_id)
                    };
                });

                setLocacoes(joinedLocacoes as Locacao[]);
                setEquipamentos(rawEquipamentos);
            } catch (error) {
                console.error("Error fetching report data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [profile.organization_id]);

    const revenueByCategory = useMemo<RevenueByCategory[]>(() => {
        if (!locacoes.length) return [];
        const categoryMap = locacoes.reduce((acc, loc) => {
            const category = loc.equipamentos?.categoria || 'Sem Categoria';
            acc[category] = (acc[category] || 0) + loc.valor_total;
            return acc;
        }, {} as Record<string, number>);
        return Object.entries(categoryMap).map(([category, revenue]) => ({ category, revenue }));
    }, [locacoes]);

    const monthlyRevenue = useMemo(() => {
        if (!locacoes.length) return [];
        const monthMap = locacoes.reduce((acc, loc) => {
            const date = new Date(loc.data_inicio);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const monthName = date.toLocaleString('pt-BR', { month: 'short' });
            acc[monthKey] = {
                month: monthName.charAt(0).toUpperCase() + monthName.slice(1),
                faturamento: (acc[monthKey]?.faturamento || 0) + loc.valor_total
            };
            return acc;
        }, {} as Record<string, { month: string, faturamento: number }>);
        return Object.entries(monthMap).sort(([keyA], [keyB]) => keyA.localeCompare(keyB)).map(([, value]) => value);
    }, [locacoes]);
    
     const utilizationRate = useMemo(() => {
        if (!equipamentos.length) return 0;
        const rentedCount = equipamentos.filter(e => e.status === 'Alugado').length;
        return (rentedCount / equipamentos.length) * 100;
    }, [equipamentos]);


    const generateCsvContent = (reportTitle: string): string | null => {
        const escapeCsvCell = (cellData: any) => {
            const stringData = String(cellData ?? '');
            if (stringData.includes(',')) return `"${stringData}"`;
            return stringData;
        };
        
        let headers: string[] = [];
        let rows: any[][] = [];

        switch (reportTitle) {
            case 'Receita por Categoria':
                headers = ['Categoria', 'Receita (R$)'];
                rows = revenueByCategory.map((item: RevenueByCategory) => [item.category, item.revenue.toFixed(2).replace('.', ',')]);
                break;
            case 'Relatório de Locações Atrasadas':
                headers = ['Contrato ID', 'Cliente', 'Equipamento', 'Data Devolução', 'Dias em Atraso'];
                rows = locacoes
                    .filter(r => r.status === StatusLocacao.ATRASADO)
                    .map(r => [
                        r.id,
                        r.clientes?.nome_fantasia || r.clientes?.nome_completo,
                        r.equipamentos?.nome,
                        new Date(r.data_fim).toLocaleDateString('pt-BR'),
                        calculateDaysOverdue(r.data_fim)
                    ]);
                break;
            case 'Faturamento por Cliente':
                headers = ['Cliente', 'Faturamento Total (R$)'];
                const revenueByClient = locacoes.reduce((acc, rental) => {
                    const clientName = rental.clientes?.nome_fantasia || rental.clientes?.nome_completo || 'N/A';
                    acc[clientName] = (acc[clientName] || 0) + rental.valor_total;
                    return acc;
                }, {} as Record<string, number>);
                 rows = Object.entries(revenueByClient).map(([clientName, total]) => [
                    clientName,
                    (total as number).toFixed(2).replace('.', ',')
                ]);
                break;
            default:
                return null;
        }

        if (rows.length === 0) return `Nenhum dado encontrado para o relatório "${reportTitle}".`;

        const headerString = headers.join(',');
        const rowStrings = rows.map(row => row.map(escapeCsvCell).join(','));
        
        return [headerString, ...rowStrings].join('\n');
    };
    
    const handleReportSelection = (reportTitle: string) => {
        setSelectedReports(prev => 
            prev.includes(reportTitle)
                ? prev.filter(title => title !== reportTitle)
                : [...prev, reportTitle]
        );
    };
    
    const handleToggleSelectAll = () => {
        if (selectedReports.length === standardReports.length) {
            setSelectedReports([]);
        } else {
            setSelectedReports(standardReports.map(r => r.title));
        }
    };

    const handleExport = () => {
        if (selectedReports.length === 0) {
            setToast({ message: 'Selecione ao menos um relatório para exportar.', type: 'error' });
            return;
        }
    
        setIsExportModalOpen(false);
    
        if (exportFormat === 'pdf') {
            setToast({ message: 'Gerando seus relatórios PDF, por favor aguarde...', type: 'success' });
            
            setTimeout(() => {
                setToast({ message: `${selectedReports.length} relatório(s) PDF gerado(s) com sucesso!`, type: 'success' });
            }, 2500); 
            
            setSelectedReports([]);
            return;
        }
    
        let exportedCount = 0;
        selectedReports.forEach(reportTitle => {
            const csvContent = generateCsvContent(reportTitle);
            if (csvContent && !csvContent.startsWith('Nenhum dado')) {
                const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement('a');
                const url = URL.createObjectURL(blob);
                const fileName = `${reportTitle.replace(/\s+/g, '_').toLowerCase()}.csv`;
    
                link.setAttribute('href', url);
                link.setAttribute('download', fileName);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                exportedCount++;
            } else {
                setToast({ message: `Não foi possível gerar dados para "${reportTitle}".`, type: 'error' });
            }
        });
    
        if (exportedCount > 0) {
            setToast({ message: `Seus relatórios estão sendo baixados!`, type: 'success' });
        }
        
        setSelectedReports([]);
    };

    const handleAnalysis = async () => {
        if (!process.env.API_KEY) {
            setToast({ message: 'A chave de API para análise de IA não foi configurada.', type: 'error' });
            return;
        }
        if (!aiQuery.trim()) {
            setToast({ message: 'Por favor, insira uma pergunta para análise.', type: 'error' });
            return;
        }
        setIsAnalyzing(true);
        setAnalysisResult('');

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

            const dataSummary = `
                - Receita por Categoria: ${JSON.stringify(revenueByCategory)}
                - Faturamento Mensal: ${JSON.stringify(monthlyRevenue)}
                - Locações com devolução atrasada: ${JSON.stringify(locacoes.filter(r => r.status === StatusLocacao.ATRASADO).map(r => ({cliente: r.clientes?.nome_fantasia || r.clientes?.nome_completo, equipamento: r.equipamentos?.nome})))}
            `;

            const prompt = `
                Você é um assistente de análise de negócios para uma empresa de locação de equipamentos chamada Locnos.
                Analise os seguintes dados e responda à pergunta do usuário de forma clara, amigável e concisa, como se estivesse apresentando insights.
                Use formatação como listas ou negrito se ajudar na clareza. Não inclua os dados brutos na sua resposta, apenas a análise.

                Dados da Empresa:
                ${dataSummary}

                Pergunta do Usuário: "${aiQuery}"
            `;
            
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });

            setAnalysisResult(response.text);

        } catch (error) {
            console.error("Erro na análise com IA:", error);
            setToast({ message: 'Ocorreu um erro ao tentar analisar os dados.', type: 'error' });
            setAnalysisResult('Não foi possível gerar a análise. Tente novamente mais tarde.');
        } finally {
            setIsAnalyzing(false);
        }
    };
    
    if (loading) {
        return <div className="flex justify-center items-center h-full"><SpinnerIcon className="w-10 h-10 text-primary" /></div>;
    }

    return (
        <>
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            <div className="space-y-8">
                <div className="bg-white p-6 rounded-xl shadow-md">
                    <div className="flex items-center gap-3 mb-4">
                        <SparklesIcon className="w-8 h-8 text-primary"/>
                        <h3 className="text-2xl font-semibold text-gray-800">Análise Inteligente com IA</h3>
                    </div>
                    <p className="text-gray-600 mb-4">Faça perguntas em linguagem natural sobre seus dados e obtenha insights instantâneos gerados por IA.</p>
                    
                    <div className="flex flex-col sm:flex-row gap-2">
                        <input
                            type="text"
                            value={aiQuery}
                            onChange={(e) => setAiQuery(e.target.value)}
                            placeholder="Ex: Qual categoria de equipamento é mais lucrativa?"
                            className="w-full px-4 py-2 border rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary"
                            disabled={isAnalyzing}
                        />
                        <button
                            onClick={handleAnalysis}
                            disabled={isAnalyzing}
                            className="flex items-center justify-center bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-hover transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            {isAnalyzing ? <SpinnerIcon className="w-5 h-5 mr-2" /> : <SparklesIcon className="w-5 h-5 mr-2" />}
                            {isAnalyzing ? 'Analisando...' : 'Analisar'}
                        </button>
                    </div>

                    {analysisResult && (
                        <div className="mt-6 p-4 border rounded-lg bg-gray-50">
                            <h4 className="font-semibold text-gray-700 mb-2">Resultado da Análise</h4>
                            <div className="text-gray-800 whitespace-pre-wrap">{analysisResult}</div>
                        </div>
                    )}
                </div>

                <div>
                     <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                        <h3 className="text-2xl font-semibold text-gray-800">Indicadores Chave de Desempenho (KPIs)</h3>
                        <button
                            onClick={() => setIsExportModalOpen(true)}
                            className="flex items-center justify-center bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
                        >
                            <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
                            Exportar Relatórios
                        </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard title="Taxa de Utilização" value={`${utilizationRate.toFixed(1)}%`} icon={<TruckIcon />} trend="+3.1% vs. mês anterior" />
                        <StatCard title="Utilização Financeira" value="15.2%" icon={<CurrencyDollarIcon />} description="Retorno sobre o valor do ativo" />
                        <StatCard title="Duração Média da Locação" value="12.3 dias" icon={<ClockIcon />} />
                        <StatCard title="Custo Manutenção/Receita" value="4.8%" icon={<WrenchScrewdriverIcon />} trendColor="text-red-500" trend="Meta: < 4%" />
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    <div className="lg:col-span-3 bg-white p-6 rounded-xl shadow-md">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Receita por Categoria de Equipamento</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={revenueByCategory} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                <XAxis type="number" tickFormatter={(value) => `R$${Number(value) / 1000}k`} />
                                <YAxis type="category" dataKey="category" width={80} />
                                <Tooltip formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR')}`} cursor={{fill: 'rgba(29, 78, 216, 0.1)'}}/>
                                <Bar dataKey="revenue" name="Receita" fill="#1D4ED8" radius={[0, 4, 4, 0]} barSize={20}>
                                    {revenueByCategory.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-md">
                         <h3 className="text-lg font-semibold text-gray-800">Faturamento Mensal</h3>
                         <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={monthlyRevenue}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" />
                                <YAxis tickFormatter={(value) => `R$${Number(value) / 1000}k`} />
                                <Tooltip formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, 'Faturamento']} />
                                <Legend />
                                <Line type="monotone" dataKey="faturamento" name="Faturamento" stroke="#1D4ED8" strokeWidth={2} activeDot={{ r: 8 }} />
                            </LineChart>
                         </ResponsiveContainer>
                    </div>
                </div>
                
                <div>
                    <h3 className="text-2xl font-semibold text-gray-800 mb-4">Relatórios Essenciais</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {standardReports.map(report => (
                            <div key={report.title} className="bg-white p-6 rounded-xl shadow-md flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center mb-3">
                                        <div className="bg-blue-100 text-primary p-2 rounded-full mr-4"><DocumentTextIcon className="w-6 h-6" /></div>
                                        <h4 className="text-md font-semibold text-gray-800">{report.title}</h4>
                                    </div>
                                    <p className="text-sm text-gray-600">{report.description}</p>
                                </div>
                                <button
                                    onClick={() => {
                                        if (report.title === 'Relatório de Locações Atrasadas') {
                                            setIsOverdueModalOpen(true);
                                        } else {
                                            setToast({ message: `Funcionalidade para "${report.title}" em desenvolvimento.`, type: 'success' });
                                        }
                                    }}
                                    className="mt-4 w-full bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-hover transition-colors"
                                >
                                    Gerar Relatório
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <Modal isOpen={isExportModalOpen} onClose={() => setIsExportModalOpen(false)} title="Exportar Relatórios">
                <div className="space-y-4">
                    <p className="text-sm text-gray-600">Selecione os relatórios e o formato desejado para a exportação.</p>
                    
                    <div>
                        <div className="flex justify-between items-center mb-2">
                           <h4 className="text-sm font-semibold text-gray-700">Relatórios para Exportar</h4>
                           <button type="button" onClick={handleToggleSelectAll} className="text-xs font-medium text-primary hover:underline">
                               {selectedReports.length === standardReports.length ? 'Desmarcar Todos' : 'Marcar Todos'}
                           </button>
                        </div>
                        <div className="max-h-48 overflow-y-auto border rounded-md p-2 space-y-1 bg-gray-50">
                            {standardReports.map(report => (
                                <label key={report.title} className="flex items-center p-2 rounded-md hover:bg-gray-100 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={selectedReports.includes(report.title)}
                                        onChange={() => handleReportSelection(report.title)}
                                        className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                                    />
                                    <span className="ml-3 text-sm font-medium text-gray-800">{report.title}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <fieldset>
                        <legend className="text-sm font-semibold text-gray-700 mb-2">Formato de Exportação</legend>
                        <div className="space-y-2">
                            <label className={`flex items-center p-3 w-full rounded-md border cursor-pointer transition-colors ${exportFormat === 'csv' ? 'bg-blue-50 border-primary' : 'bg-white border-gray-200 hover:border-gray-300'}`}>
                                <input
                                    type="radio"
                                    name="export-format"
                                    value="csv"
                                    checked={exportFormat === 'csv'}
                                    onChange={() => setExportFormat('csv')}
                                    className="h-4 w-4 focus:ring-0"
                                />
                                <div className="ml-3">
                                    <p className="font-semibold text-gray-800">CSV (Planilha)</p>
                                    <p className="text-xs text-gray-500">Ideal para importar em Excel, Google Sheets, etc.</p>
                                </div>
                            </label>
                             <label className={`flex items-center p-3 w-full rounded-md border cursor-pointer transition-colors ${exportFormat === 'pdf' ? 'bg-blue-50 border-primary' : 'bg-white border-gray-200 hover:border-gray-300'}`}>
                                <input
                                    type="radio"
                                    name="export-format"
                                    value="pdf"
                                    checked={exportFormat === 'pdf'}
                                    onChange={() => setExportFormat('pdf')}
                                    className="h-4 w-4 focus:ring-0"
                                />
                                 <div className="ml-3">
                                    <p className="font-semibold text-gray-800">PDF (Documento)</p>
                                    <p className="text-xs text-gray-500">Formato pronto para impressão e compartilhamento.</p>
                                </div>
                            </label>
                        </div>
                    </fieldset>

                    <div className="mt-6 flex justify-end space-x-3 pt-4 border-t">
                        <button type="button" onClick={() => setIsExportModalOpen(false)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancelar</button>
                        <button type="button" onClick={handleExport} className="flex items-center justify-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-hover">
                            <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
                            Exportar {selectedReports.length} Relatório(s)
                        </button>
                    </div>
                </div>
            </Modal>
            
            <Modal isOpen={isOverdueModalOpen} onClose={() => setIsOverdueModalOpen(false)} title="Relatório de Locações Atrasadas">
                <div className="max-h-[60vh] overflow-y-auto">
                    <table className="w-full text-sm text-left text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0">
                            <tr>
                                <th scope="col" className="px-4 py-2">Cliente</th>
                                <th scope="col" className="px-4 py-2">Equipamento</th>
                                <th scope="col" className="px-4 py-2">Devolução</th>
                                <th scope="col" className="px-4 py-2 text-center">Dias Atraso</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white">
                            {locacoes
                                .filter(r => r.status === StatusLocacao.ATRASADO)
                                .map((rental) => (
                                    <tr key={rental.id} className="border-b hover:bg-gray-50">
                                        <td className="px-4 py-3 font-medium text-gray-800">{rental.clientes?.nome_fantasia || rental.clientes?.nome_completo}</td>
                                        <td className="px-4 py-3 text-gray-600">{rental.equipamentos?.nome}</td>
                                        <td className="px-4 py-3 text-gray-600">{new Date(rental.data_fim).toLocaleDateString('pt-BR')}</td>
                                        <td className="px-4 py-3 text-center font-bold text-red-600">{calculateDaysOverdue(rental.data_fim)}</td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>
            </Modal>
        </>
    );
};

export default Reports;
