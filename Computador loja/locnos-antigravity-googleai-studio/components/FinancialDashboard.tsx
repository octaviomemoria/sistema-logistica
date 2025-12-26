
import React, { useState, useEffect } from 'react';
import StatCard from './StatCard';
import { CurrencyDollarIcon, ClockIcon, UsersIcon, CheckCircleIcon, SpinnerIcon } from './Icons';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Cliente, Profile, Locacao, StatusPagamento, Pagamento } from '../types';
import { supabase } from '../supabaseClient';

const COLORS = ['#1E40AF', '#3B82F6', '#60A5FA', '#93C5FD'];

const FinancialDashboard: React.FC<{ profile: Profile }> = ({ profile }) => {
    const [stats, setStats] = useState({ totalRevenue: 0, accountsReceivable: 0, overdue: 0, paidInvoices: 0 });
    const [paymentMethods, setPaymentMethods] = useState<{name: string, value: number}[]>([]);
    const [overdueClients, setOverdueClients] = useState<Cliente[]>([]);
    const [transactions, setTransactions] = useState<Pagamento[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!profile.organization_id) return;
            setLoading(true);

            try {
                // Parallel fetch of ALL required tables (no sql joins)
                const [locacoesRes, pagamentosRes, clientesRes] = await Promise.all([
                    supabase.from('locacoes').select('*').eq('organization_id', profile.organization_id),
                    supabase.from('pagamentos').select('*').eq('organization_id', profile.organization_id).order('data_pagamento', { ascending: false }),
                    supabase.from('clientes').select('*').eq('organization_id', profile.organization_id)
                ]);
                
                if (locacoesRes.error) throw locacoesRes.error;
                if (pagamentosRes.error) throw pagamentosRes.error;
                if (clientesRes.error) throw clientesRes.error;

                const locacoes = locacoesRes.data as Locacao[];
                const pagamentos = pagamentosRes.data as Pagamento[];
                const clientes = clientesRes.data as Cliente[];

                // --- Process Stats ---
                const totalRevenue = locacoes.reduce((sum, l) => sum + l.valor_total, 0);
                const accountsReceivable = locacoes
                    .filter(l => l.status_pagamento === StatusPagamento.PENDENTE || l.status_pagamento === StatusPagamento.PAGO_PARCIALMENTE)
                    .reduce((sum, l) => sum + l.valor_total, 0);
                const overdue = locacoes
                    .filter(l => l.status_pagamento === StatusPagamento.ATRASADO)
                    .reduce((sum, l) => sum + l.valor_total, 0);
                const paidInvoices = locacoes.filter(l => l.status_pagamento === StatusPagamento.PAGO).length;
                
                setStats({ totalRevenue, accountsReceivable, overdue, paidInvoices });
                
                // --- Process Payment Methods ---
                const methodCounts = pagamentos.reduce((acc, p) => {
                    const key = p.metodo_pagamento;
                    acc[key] = (acc[key] || 0) + 1;
                    return acc;
                }, {} as Record<string, number>);

                const totalPayments = pagamentos.length;
                const paymentMethodData = Object.entries(methodCounts).map(([name, count]) => ({
                    name,
                    value: totalPayments > 0 ? (count / totalPayments) * 100 : 0,
                }));
                setPaymentMethods(paymentMethodData);

                // --- Process Overdue Clients ---
                // Filter clients who have overdue rentals OR are marked as inadimplente
                const clientsWithIssues = clientes.filter(c => c.inadimplente === true);
                setOverdueClients(clientsWithIssues);

                // --- Process Recent Transactions (Manual Join) ---
                const recentTransactions = pagamentos.slice(0, 5).map(p => {
                    const rental = locacoes.find(l => l.id === p.locacao_id);
                    const client = rental ? clientes.find(c => c.id === rental.cliente_id) : null;
                    return {
                        ...p,
                        locacoes: {
                            id: rental?.id || '',
                            clientes: {
                                id: client?.id || '',
                                nome_completo: client?.nome_completo || null,
                                nome_fantasia: client?.nome_fantasia || null
                            }
                        }
                    };
                });
                setTransactions(recentTransactions as any); // Type casting for UI compatibility

            } catch (error) {
                console.error("Erro ao carregar financeiro:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [profile.organization_id]);


    if (loading) {
        return <div className="flex justify-center items-center h-full"><SpinnerIcon className="w-10 h-10 text-primary" /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Faturamento Total (Contratos)" value={`R$ ${stats.totalRevenue.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`} icon={<CurrencyDollarIcon />} />
                <StatCard title="A Receber (Pendente)" value={`R$ ${stats.accountsReceivable.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`} icon={<ClockIcon />} />
                <StatCard title="Em Atraso (Inadimplência)" value={`R$ ${stats.overdue.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`} icon={<UsersIcon />} trendColor="text-red-500" trend={`${overdueClients.length} clientes`} />
                <StatCard title="Contratos Quitados" value={stats.paidInvoices.toString()} icon={<CheckCircleIcon />} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-md">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Métodos de Pagamento (%)</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                            <Pie
                                data={paymentMethods}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                                nameKey="name"
                                label={({ name, value }) => `${name} ${value.toFixed(0)}%`}
                            >
                                {paymentMethods.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value: number, name) => [`${value.toFixed(1)}% de participação`, name]} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-md">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Clientes Inadimplentes (Marcados)</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-500">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3">Cliente</th>
                                    <th scope="col" className="px-6 py-3">Documento</th>
                                    <th scope="col" className="px-6 py-3">Contato</th>
                                </tr>
                            </thead>
                            <tbody>
                                {overdueClients.length > 0 ? overdueClients.map(client => (
                                    <tr key={client.id} className="bg-white border-b hover:bg-gray-50">
                                        <td className="px-6 py-4 font-medium text-gray-900">{client.nome_fantasia || client.nome_completo}</td>
                                        <td className="px-6 py-4">{client.documento}</td>
                                        <td className="px-6 py-4">{client.telefone}</td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan={3} className="text-center py-4 text-gray-500">Nenhum cliente marcado como inadimplente.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Últimos Pagamentos Recebidos</h3>
                 <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3">Cliente</th>
                                <th scope="col" className="px-6 py-3">Data</th>
                                <th scope="col" className="px-6 py-3">Método</th>
                                <th scope="col" className="px-6 py-3 text-right">Valor Pago</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transactions.length > 0 ? transactions.map(t => (
                                <tr key={t.id} className="bg-white border-b hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium text-gray-900">{t.locacoes?.clientes?.nome_fantasia || t.locacoes?.clientes?.nome_completo || 'N/A'}</td>
                                    <td className="px-6 py-4">{new Date(t.data_pagamento).toLocaleDateString('pt-BR')}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800`}>
                                            {t.metodo_pagamento}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right font-medium">R$ {t.valor_pago.toFixed(2)}</td>
                                </tr>
                            )) : (
                                <tr><td colSpan={4} className="text-center py-4 text-gray-500">Nenhum pagamento recente.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default FinancialDashboard;
