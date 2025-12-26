import React, { useState, useEffect } from 'react';
import { Locacao, StatusLocacao, Ocorrencia, Profile, UserRole, StatusEquipamento, View } from '../types';
import StatCard from './StatCard';
import { ArrowTrendingUpIcon, ClockIcon, CurrencyDollarIcon, TruckIcon, UsersIcon, WrenchScrewdriverIcon, CheckBadgeIcon, PlusIcon, DocumentTextIcon } from './Icons';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { supabase } from '../supabaseClient';

interface DashboardProps {
    profile: Profile;
    onNavigate: (view: View) => void;
}

const getRentalStatusClass = (status: StatusLocacao) => {
    switch (status) {
        case StatusLocacao.ATIVO: return 'bg-green-100 text-green-800';
        case StatusLocacao.CONCLUIDO: return 'bg-blue-100 text-blue-800';
        case StatusLocacao.ATRASADO: return 'bg-red-100 text-red-800';
        case StatusLocacao.AGENDADO: return 'bg-purple-100 text-purple-800';
        default: return 'bg-gray-100 text-gray-800';
    }
};

const GerenteDashboard: React.FC<{ organization_id: string; onNavigate: (view: View) => void }> = ({ organization_id, onNavigate }) => {
    const [stats, setStats] = useState({
        monthlyRevenue: 0,
        rentedEquipments: 0,
        totalEquipments: 0,
        activeRentals: 0,
        overdueRentals: 0,
    });
    const [recentRentals, setRecentRentals] = useState<Locacao[]>([]);
    const [chartData, setChartData] = useState<{name: string, Receita: number}[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            if (!organization_id) return;

            // Fetch rentals
            const { data: locacoesData, error: rentalsError } = await supabase
                .from('locacoes')
                .select('*')
                .eq('organization_id', organization_id);
            
            // Fetch equipments (with status for counts)
            const { data: equipamentosData, error: equipmentsError } = await supabase
                .from('equipamentos')
                .select('id, nome, status')
                .eq('organization_id', organization_id);

            // Fetch clients
            const { data: clientesData, error: clientsError } = await supabase
                .from('clientes')
                .select('id, nome_completo, nome_fantasia')
                .eq('organization_id', organization_id);

            // Fetch Rental Items to identify the equipment
            const { data: itemsData } = await supabase
                .from('locacao_itens')
                .select('locacao_id, equipamento_id')
                .eq('organization_id', organization_id);

            if (rentalsError || equipmentsError || clientsError) {
                console.error('Error fetching dashboard data:', rentalsError?.message || equipmentsError?.message || clientsError?.message);
                return;
            }

            // Manual Join Logic
            const locacoes = (locacoesData || []).map((l: any) => {
                // Find first item associated with this rental
                const item = itemsData?.find((i: any) => i.locacao_id === l.id);
                const equip = item ? equipamentosData?.find((e: any) => e.id === item.equipamento_id) : null;

                return {
                    ...l,
                    equipamentos: equip || { nome: 'Equipamento Desconhecido' },
                    clientes: clientesData?.find((c: any) => c.id === l.cliente_id) || null
                };
            }) as Locacao[];

            const totalEquipments = equipamentosData?.length || 0;
            const rentedEquipments = equipamentosData?.filter((e: any) => e.status === StatusEquipamento.ALUGADO).length || 0;

            if (locacoes) {
                const now = new Date();
                const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                
                const monthlyRevenue = locacoes
                    .filter((l: Locacao) => new Date(l.data_inicio) >= firstDayOfMonth)
                    .reduce((sum, l: Locacao) => sum + l.valor_total, 0);
                
                type ChartDataItem = { name: string, Receita: number, year: number, monthNum: number };

                const monthlyRevenueData = locacoes.reduce((acc: Record<string, ChartDataItem>, loc: Locacao) => {
                    const date = new Date(loc.data_inicio);
                    const month = date.toLocaleString('pt-BR', { month: 'short' });
                    const year = date.getFullYear();
                    const key = `${year}-${month}`;
                    
                    if (!acc[key]) {
                        acc[key] = { name: month.charAt(0).toUpperCase() + month.slice(1), Receita: 0, year: year, monthNum: date.getMonth() };
                    }
                    acc[key].Receita += loc.valor_total;
                    return acc;
                }, {} as Record<string, ChartDataItem>);

                const sortedChartData = Object.values(monthlyRevenueData).sort((a: ChartDataItem, b: ChartDataItem) => {
                    if (a.year !== b.year) return a.year - b.year;
                    return a.monthNum - b.monthNum;
                }).slice(-7).map(({ name, Receita }) => ({ name, Receita }));

                setChartData(sortedChartData);

                setStats({
                    monthlyRevenue,
                    rentedEquipments,
                    totalEquipments,
                    activeRentals: locacoes.filter((l: Locacao) => l.status === StatusLocacao.ATIVO).length,
                    overdueRentals: locacoes.filter((l: Locacao) => l.status === StatusLocacao.ATRASADO).length,
                });

                setRecentRentals(locacoes.slice(0, 5));
            }
        };
        fetchData();
    }, [organization_id]);

    const utilizationRate = stats.totalEquipments > 0 ? (stats.rentedEquipments / stats.totalEquipments) * 100 : 0;
  
    return (
      <>
        <div className="flex flex-wrap items-center gap-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mr-2">Ações Rápidas:</h3>
            <button onClick={() => onNavigate('rentals')} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700 transition-colors">
                <PlusIcon className="w-5 h-5 mr-2"/>
                Nova Locação
            </button>
            <button onClick={() => onNavigate('clients')} className="flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg shadow-sm hover:bg-gray-50 transition-colors">
                <UsersIcon className="w-5 h-5 mr-2 text-gray-500"/>
                Cadastrar Cliente
            </button>
             <button onClick={() => onNavigate('equipments')} className="flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg shadow-sm hover:bg-gray-50 transition-colors">
                <TruckIcon className="w-5 h-5 mr-2 text-gray-500"/>
                Adicionar Equipamento
            </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Faturamento Mensal" value={`R$ ${stats.monthlyRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} icon={<CurrencyDollarIcon />} trend="+5.2% vs. mês anterior" />
          <StatCard title="Equipamentos Alugados" value={`${stats.rentedEquipments} / ${stats.totalEquipments}`} icon={<TruckIcon />} trend={`${utilizationRate.toFixed(1)}% de utilização`} />
          <StatCard title="Locações Ativas" value={stats.activeRentals.toString()} icon={<ArrowTrendingUpIcon />} />
          <StatCard title="Devoluções Atrasadas" value={stats.overdueRentals.toString()} icon={<ClockIcon />} trend="Atenção necessária" trendColor="text-red-500" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-md">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Receita por Mês</h3>
              <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: '#6B7280' }} />
                  <YAxis tick={{ fill: '#6B7280' }} tickFormatter={(value) => `R$${Number(value) / 1000}k`} />
                  <Tooltip cursor={{fill: 'rgba(29, 78, 216, 0.1)'}} contentStyle={{ backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '0.5rem' }} formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR')}`, "Receita"]} />
                  <Legend />
                  <Bar dataKey="Receita" fill="#1D4ED8" name="Receita" radius={[4, 4, 0, 0]} />
                  </BarChart>
              </ResponsiveContainer>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Locações Recentes</h3>
              <div className="space-y-4 overflow-y-auto" style={{maxHeight: '260px'}}>
              {recentRentals.map(rental => (
                  <div key={rental.id} className="flex items-center justify-between">
                  <div>
                      <p className="font-medium text-gray-700">{rental.equipamentos?.nome || 'Equipamento...'}</p>
                      <p className="text-sm text-gray-500">{rental.clientes?.nome_fantasia || rental.clientes?.nome_completo || 'Cliente...'}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getRentalStatusClass(rental.status)}`}>
                      {rental.status}
                  </span>
                  </div>
              ))}
              {recentRentals.length === 0 && <p className="text-gray-500 text-sm text-center py-4">Nenhuma locação recente.</p>}
              </div>
          </div>
        </div>
      </>
    );
};

const TecnicoDashboard: React.FC<{ organization_id: string }> = ({ organization_id }) => {
    const [openIncidents, setOpenIncidents] = useState<Ocorrencia[]>([]);
    
    useEffect(() => {
        const fetchIncidents = async () => {
             if (!organization_id) return;

            // Fetch Incidents
            const { data: incidentsData, error: incidentsError } = await supabase
                .from('ocorrencias')
                .select('*')
                .eq('organization_id', organization_id)
                .neq('status', 'Resolvido');
            
            if (incidentsError) {
                console.error('Error fetching incidents:', incidentsError);
                return;
            }

            let formattedData: Ocorrencia[] = [];

            if (incidentsData && incidentsData.length > 0) {
                 // Fetch related rentals items and equipments manually
                 const rentalIds = incidentsData.map((i: any) => i.locacao_id);
                 const { data: itemsData } = await supabase.from('locacao_itens').select('*').in('locacao_id', rentalIds);
                 
                 const equipmentIds = itemsData ? itemsData.map((i: any) => i.equipamento_id) : [];
                 const { data: equipmentsData } = await supabase.from('equipamentos').select('id, nome').in('id', equipmentIds);

                 formattedData = incidentsData.map((d: any) => {
                    const item = itemsData?.find((i: any) => i.locacao_id === d.locacao_id);
                    const equipment = item ? equipmentsData?.find((e: any) => e.id === item.equipamento_id) : null;
                    
                    return {
                        ...d,
                        nome_equipamento: equipment?.nome || 'N/A'
                    };
                });
            }

            setOpenIncidents(formattedData);
        };
        fetchIncidents();
    }, [organization_id]);

    return (
        <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Ocorrências Abertas" value={openIncidents.length.toString()} icon={<WrenchScrewdriverIcon />} />
                <StatCard title="Equipamentos em Manutenção" value="3" icon={<TruckIcon />} trendColor="text-yellow-500" trend="Aguardando peças" />
                <StatCard title="Manutenções Concluídas (Mês)" value="12" icon={<CheckBadgeIcon />} />
                <StatCard title="Preventivas Próximas" value="4" icon={<ClockIcon />} />
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md mt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Minhas Ocorrências Abertas</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3">Equipamento</th>
                                <th scope="col" className="px-6 py-3">Descrição</th>
                                <th scope="col" className="px-6 py-3">Abertura</th>
                                <th scope="col" className="px-6 py-3">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {openIncidents.map(order => (
                                <tr key={order.id} className="bg-white border-b hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium text-gray-900">{order.nome_equipamento}</td>
                                    <td className="px-6 py-4">{order.descricao}</td>
                                    <td className="px-6 py-4">{new Date(order.data_relato).toLocaleDateString('pt-BR')}</td>
                                    <td className="px-6 py-4"><span className={`px-2 py-1 font-semibold leading-tight rounded-full text-xs`}>{order.status}</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
};

const AtendenteDashboard: React.FC<{ organization_id: string }> = ({ organization_id }) => {
    const [todayCheckouts, setTodayCheckouts] = useState<Locacao[]>([]);
    const [todayCheckins, setTodayCheckins] = useState<Locacao[]>([]);
    const [activeContracts, setActiveContracts] = useState(0);

    useEffect(() => {
        const fetchRentals = async () => {
            if (!organization_id) return;
            const today = new Date().toISOString().split('T')[0];

             // Fetch rentals
            const { data: locacoesData, error: rentalsError } = await supabase
                .from('locacoes')
                .select('*')
                .eq('organization_id', organization_id);
            
            // Fetch items
            const { data: itemsData } = await supabase
                .from('locacao_itens')
                .select('locacao_id, equipamento_id')
                .eq('organization_id', organization_id);

            // Fetch equipments
            const { data: equipmentsData } = await supabase
                .from('equipamentos')
                .select('id, nome')
                .eq('organization_id', organization_id);

            // Fetch clients
            const { data: clientsData } = await supabase
                .from('clientes')
                .select('id, nome_completo, nome_fantasia')
                .eq('organization_id', organization_id);
            
            if (rentalsError) {
                console.error("Failed to fetch rentals", rentalsError);
            } else {
                 const locacoes = (locacoesData || []).map((l: any) => {
                    const item = itemsData?.find((i: any) => i.locacao_id === l.id);
                    const equip = item ? equipmentsData?.find((e: any) => e.id === item.equipamento_id) : null;
                    
                    return {
                        ...l,
                        equipamentos: equip || { nome: 'N/A' },
                        clientes: clientsData?.find((c: any) => c.id === l.cliente_id) || null
                    };
                }) as Locacao[];

                setTodayCheckouts(locacoes.filter((r: Locacao) => r.data_inicio === today));
                setTodayCheckins(locacoes.filter((r: Locacao) => r.data_fim === today));
                setActiveContracts(locacoes.filter((r: Locacao) => r.status === 'Ativo').length);
            }
        };
        fetchRentals();
    }, [organization_id]);

    return (
        <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Check-outs para Hoje" value={todayCheckouts.length.toString()} icon={<TruckIcon className="transform -scale-x-100" />} />
                <StatCard title="Check-ins para Hoje" value={todayCheckins.length.toString()} icon={<TruckIcon />} />
                <StatCard title="Novos Clientes (Mês)" value="8" icon={<UsersIcon />} />
                <StatCard title="Contratos Ativos" value={activeContracts.toString()} icon={<DocumentTextIcon />} />
            </div>
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                <div className="bg-white p-6 rounded-xl shadow-md">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Próximas Retiradas (Hoje)</h3>
                     <div className="space-y-3">
                        {todayCheckouts.length > 0 ? todayCheckouts.map(r => (
                            <div key={r.id} className="p-3 bg-gray-50 rounded-lg">
                                <p className="font-medium text-gray-800">{r.equipamentos?.nome}</p>
                                <p className="text-sm text-gray-500">{r.clientes?.nome_fantasia || r.clientes?.nome_completo}</p>
                            </div>
                        )) : <p className="text-gray-500">Nenhuma retirada para hoje.</p>}
                    </div>
                </div>
                 <div className="bg-white p-6 rounded-xl shadow-md">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Próximas Devoluções (Hoje)</h3>
                    <div className="space-y-3">
                         {todayCheckins.length > 0 ? todayCheckins.map(r => (
                            <div key={r.id} className="p-3 bg-gray-50 rounded-lg">
                                <p className="font-medium text-gray-800">{r.equipamentos?.nome}</p>
                                <p className="text-sm text-gray-500">{r.clientes?.nome_fantasia || r.clientes?.nome_completo}</p>
                                <p className="text-xs text-gray-400 mt-1">Contrato: {r.id}</p>
                            </div>
                         )) : <p className="text-gray-500">Nenhuma devolução para hoje.</p>}
                    </div>
                </div>
            </div>
        </>
    );
};

const Dashboard: React.FC<DashboardProps> = ({ profile, onNavigate }) => {
    switch (profile.role) {
        case UserRole.TECNICO:
            return <TecnicoDashboard organization_id={profile.organization_id} />;
        case UserRole.ATENDENTE:
        case UserRole.FRETEIRO:
            return <AtendenteDashboard organization_id={profile.organization_id} />;
        case UserRole.GERENTE:
        case UserRole.ADMIN:
        case UserRole.FINANCEIRO:
        default:
            return <GerenteDashboard organization_id={profile.organization_id} onNavigate={onNavigate} />;
    }
};

export default Dashboard;