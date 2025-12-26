
import React, { useState, useMemo, useEffect } from 'react';
import { Ocorrencia, Locacao, Profile, StatusOcorrencia } from '../types';
import { PlusIcon, SearchIcon, SpinnerIcon } from './Icons';
import Modal from './Modal';
import Toast from './Toast';
import SortableHeader from './SortableHeader';
import { supabase } from '../supabaseClient';

type SortKeys = keyof Ocorrencia;
type IncidentFormData = Omit<Ocorrencia, 'id' | 'data_relato' | 'nome_equipamento' | 'nome_cliente' | 'organization_id'>;

const getStatusBadgeClass = (status: Ocorrencia['status']) => {
  switch (status) {
    case StatusOcorrencia.ABERTO: return 'bg-yellow-100 text-yellow-800';
    case StatusOcorrencia.EM_ANALISE: return 'bg-blue-100 text-blue-800';
    case StatusOcorrencia.RESOLVIDO: return 'bg-green-100 text-green-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const IncidentList: React.FC<{ profile: Profile }> = ({ profile }) => {
    const [incidents, setIncidents] = useState<Ocorrencia[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingIncident, setEditingIncident] = useState<Ocorrencia | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: SortKeys; direction: 'ascending' | 'descending' } | null>(null);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const fetchIncidents = async () => {
        setLoading(true);
        try {
            // Parallel fetch
            const [occurrencesRes, rentalsRes, equipmentsRes, clientsRes, itemsRes] = await Promise.all([
                supabase.from('ocorrencias').select('*').eq('organization_id', profile.organization_id),
                supabase.from('locacoes').select('*').eq('organization_id', profile.organization_id),
                supabase.from('equipamentos').select('id, nome').eq('organization_id', profile.organization_id),
                supabase.from('clientes').select('id, nome_completo, nome_fantasia').eq('organization_id', profile.organization_id),
                supabase.from('locacao_itens').select('*').eq('organization_id', profile.organization_id)
            ]);

            if (occurrencesRes.error) throw occurrencesRes.error;

            const rentalsMap = new Map<string, any>((rentalsRes.data || []).map((r: any) => [r.id, r]));
            const equipmentsMap = new Map<string, any>((equipmentsRes.data || []).map((e: any) => [e.id, e]));
            const clientsMap = new Map<string, any>((clientsRes.data || []).map((c: any) => [c.id, c]));
            const itemsMap = new Map<string, any>((itemsRes.data || []).map((i: any) => [i.locacao_id, i])); // Simple map: 1 item per rental for UI display

            const formattedData = (occurrencesRes.data || []).map((d: any) => {
                const rental = rentalsMap.get(d.locacao_id);
                // Find equipment via items table
                const item = itemsMap.get(d.locacao_id);
                const equipment = item ? equipmentsMap.get(item.equipamento_id) : null;
                const client = rental ? clientsMap.get(rental.cliente_id) : null;

                return {
                    ...d,
                    nome_equipamento: equipment?.nome || 'N/A',
                    nome_cliente: client?.nome_fantasia || client?.nome_completo || 'N/A',
                };
            });
            setIncidents(formattedData);
        } catch (error: any) {
            setToast({ message: `Erro ao carregar ocorrências: ${error.message}`, type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchIncidents();
    }, [profile.organization_id]);

    const handleOpenModal = (incident: Ocorrencia | null = null) => {
        setEditingIncident(incident);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setEditingIncident(null);
        setIsModalOpen(false);
    };

    const handleSaveIncident = async (incidentData: IncidentFormData) => {
        try {
            if (editingIncident) {
                const { error } = await supabase.from('ocorrencias').update(incidentData).eq('id', editingIncident.id);
                if(error) throw error;
                setToast({ message: 'Ocorrência atualizada com sucesso!', type: 'success' });
            } else {
                const { error } = await supabase.from('ocorrencias').insert([{...incidentData, organization_id: profile.organization_id}]);
                if(error) throw error;
                setToast({ message: 'Ocorrência registrada com sucesso!', type: 'success' });
            }
            fetchIncidents();
            handleCloseModal();
        } catch (error: any) {
             setToast({ message: `Erro ao salvar: ${error.message}`, type: 'error' });
        }
    };
    
    const sortedAndFilteredIncidents = useMemo(() => {
        let filtered = incidents.filter(i =>
            i.nome_equipamento?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            i.nome_cliente?.toLowerCase().includes(searchTerm.toLowerCase())
        );

        if (sortConfig !== null) {
            filtered.sort((a, b) => {
                const valA = a[sortConfig.key] || '';
                const valB = b[sortConfig.key] || '';
                if (valA < valB) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (valA > valB) return sortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }
        return filtered;
    }, [incidents, searchTerm, sortConfig]);
    
    const requestSort = (key: SortKeys) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    return (
        <>
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            <div className="bg-white p-6 rounded-xl shadow-md">
                <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
                    <h3 className="text-xl font-semibold text-gray-800">Controle de Ocorrências</h3>
                    <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-4">
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3"><SearchIcon /></span>
                            <input type="text" placeholder="Buscar..." onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary"/>
                        </div>
                        <button onClick={() => handleOpenModal()} className="flex items-center justify-center bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-hover transition-colors">
                            <PlusIcon className="w-5 h-5 mr-2" />
                            Nova Ocorrência
                        </button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3"><SortableHeader label="Equipamento" sortKey="nome_equipamento" requestSort={requestSort} sortConfig={sortConfig} /></th>
                                <th scope="col" className="px-6 py-3"><SortableHeader label="Cliente" sortKey="nome_cliente" requestSort={requestSort} sortConfig={sortConfig} /></th>
                                <th scope="col" className="px-6 py-3"><SortableHeader label="Data" sortKey="data_relato" requestSort={requestSort} sortConfig={sortConfig} /></th>
                                <th scope="col" className="px-6 py-3"><SortableHeader label="Status" sortKey="status" requestSort={requestSort} sortConfig={sortConfig} /></th>
                                <th scope="col" className="px-6 py-3"><SortableHeader label="Custo Reparo (R$)" sortKey="custo_reparo" requestSort={requestSort} sortConfig={sortConfig} /></th>
                                <th scope="col" className="px-6 py-3">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? <tr><td colSpan={6} className="text-center py-8"><SpinnerIcon className="mx-auto w-8 h-8"/></td></tr>
                            : sortedAndFilteredIncidents.map((incident) => (
                                <tr key={incident.id} className="bg-white border-b hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium text-gray-900">{incident.nome_equipamento}</td>
                                    <td className="px-6 py-4">{incident.nome_cliente}</td>
                                    <td className="px-6 py-4">{new Date(incident.data_relato).toLocaleDateString('pt-BR')}</td>
                                    <td className="px-6 py-4"><span className={`px-2 py-1 font-semibold leading-tight rounded-full text-xs ${getStatusBadgeClass(incident.status)}`}>{incident.status}</span></td>
                                    <td className="px-6 py-4">{incident.custo_reparo ? incident.custo_reparo.toFixed(2).replace('.', ',') : 'N/A'}</td>
                                    <td className="px-6 py-4">
                                        <button onClick={() => handleOpenModal(incident)} className="text-primary hover:underline font-medium">Editar</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <IncidentFormModal isOpen={isModalOpen} onClose={handleCloseModal} onSave={handleSaveIncident} incident={editingIncident} profile={profile} />
            </div>
        </>
    );
};

const IncidentFormModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: IncidentFormData) => void;
    incident: Ocorrencia | null;
    profile: Profile;
}> = ({ isOpen, onClose, onSave, incident, profile }) => {
    const [formState, setFormState] = useState({
        locacao_id: '', descricao: '', status: StatusOcorrencia.ABERTO, custo_reparo: ''
    });
    const [activeRentals, setActiveRentals] = useState<Locacao[]>([]);

    useEffect(() => {
        const fetchActiveRentals = async () => {
            if (isOpen) {
                // Manual join for dropdown options
                const [rentalsRes, itemsRes, equipmentsRes, clientsRes] = await Promise.all([
                    supabase.from('locacoes').select('*').eq('organization_id', profile.organization_id).in('status', ['Ativo', 'Atrasado']),
                    supabase.from('locacao_itens').select('*').eq('organization_id', profile.organization_id),
                    supabase.from('equipamentos').select('id, nome').eq('organization_id', profile.organization_id),
                    supabase.from('clientes').select('id, nome_completo, nome_fantasia').eq('organization_id', profile.organization_id)
                ]);
                
                const rentals = rentalsRes.data;
                const items = itemsRes.data;
                const equipments = equipmentsRes.data;
                const clients = clientsRes.data;

                if (rentals) {
                     const joined = rentals.map((r: any) => {
                         const item = items?.find((i: any) => i.locacao_id === r.id);
                         return {
                             ...r,
                             equipamentos: item ? equipments?.find((e:any) => e.id === item.equipamento_id) : { nome: 'N/A' },
                             clientes: clients?.find((c:any) => c.id === r.cliente_id)
                         }
                     });
                     setActiveRentals(joined as any);
                }
            }
        };
        fetchActiveRentals();
    }, [isOpen, profile.organization_id]);

    React.useEffect(() => {
        if (incident) {
            setFormState({
                locacao_id: incident.locacao_id,
                descricao: incident.descricao,
                status: incident.status,
                custo_reparo: incident.custo_reparo ? String(incident.custo_reparo) : ''
            });
        } else {
            setFormState({ locacao_id: '', descricao: '', status: StatusOcorrencia.ABERTO, custo_reparo: '' });
        }
    }, [incident, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormState(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            locacao_id: formState.locacao_id,
            descricao: formState.descricao,
            status: formState.status,
            custo_reparo: formState.custo_reparo ? parseFloat(formState.custo_reparo) : undefined,
        });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={incident ? "Editar Ocorrência" : "Registrar Nova Ocorrência"}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="locacao_id" className="block text-sm font-medium text-gray-700">Contrato de Locação Associado</label>
                    <select
                        id="locacao_id"
                        name="locacao_id"
                        value={formState.locacao_id}
                        onChange={handleChange}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                        required
                    >
                        <option value="">Selecione um contrato</option>
                        {activeRentals.map(r => (
                            <option key={r.id} value={r.id}>
                                {`${r.equipamentos?.nome} (${r.clientes?.nome_fantasia || r.clientes?.nome_completo})`}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label htmlFor="descricao" className="block text-sm font-medium text-gray-700">Descrição do Problema</label>
                    <textarea
                        id="descricao"
                        name="descricao"
                        value={formState.descricao}
                        onChange={handleChange}
                        rows={4}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                        required
                    ></textarea>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
                        <select
                            id="status"
                            name="status"
                            value={formState.status}
                            onChange={handleChange}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                        >
                            <option value={StatusOcorrencia.ABERTO}>Aberto</option>
                            <option value={StatusOcorrencia.EM_ANALISE}>Em Análise</option>
                            <option value={StatusOcorrencia.RESOLVIDO}>Resolvido</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="custo_reparo" className="block text-sm font-medium text-gray-700">Custo do Reparo (R$)</label>
                        <input
                            type="number"
                            id="custo_reparo"
                            name="custo_reparo"
                            value={formState.custo_reparo}
                            onChange={handleChange}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                            min="0"
                            step="0.01"
                        />
                    </div>
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancelar</button>
                    <button type="submit" className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-hover">Salvar</button>
                </div>
            </form>
        </Modal>
    );
};

export default IncidentList;
