import React, { useState, useMemo, useEffect } from 'react';
import { Tarefa, StatusTarefa, Profile } from '../types';
import { PlusIcon, SearchIcon, SpinnerIcon } from './Icons';
import Modal from './Modal';
import Toast from './Toast';
import SortableHeader from './SortableHeader';
import { supabase } from '../supabaseClient';


type SortKeys = keyof Tarefa;

const getStatusBadgeClass = (status: Tarefa['status']) => {
  switch (status) {
    case 'Pendente': return 'bg-yellow-100 text-yellow-800';
    case 'Em Andamento': return 'bg-blue-100 text-blue-800';
    case 'Concluída': return 'bg-green-100 text-green-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const TaskList: React.FC<{ profile: Profile }> = ({ profile }) => {
    const [tasks, setTasks] = useState<Tarefa[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Tarefa | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: SortKeys; direction: 'ascending' | 'descending' } | null>(null);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const fetchTasks = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('tarefas')
            .select('*')
            .eq('organization_id', profile.organization_id);
            
        if (error) {
            setToast({ message: `Erro ao carregar tarefas: ${error.message}`, type: 'error' });
        } else {
            setTasks(data);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchTasks();
    }, [profile.organization_id]);

    const handleOpenModal = (task: Tarefa | null = null) => {
        setEditingTask(task);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setEditingTask(null);
        setIsModalOpen(false);
    };

    // FIX: Corrected the type of taskData to exclude immutable fields, resolving the 'never' type error on updates.
    const handleSaveTask = async (taskData: Omit<Tarefa, 'id' | 'organization_id'>) => {
        if (editingTask) {
            // FIX: The type of taskData was inferred as 'never' because the Supabase DB types were incorrect. This is fixed in supabaseClient.ts.
            const { error } = await supabase.from('tarefas').update(taskData).eq('id', editingTask.id);
            if(error) setToast({ message: `Erro ao atualizar tarefa: ${error.message}`, type: 'error'});
            else {
                setToast({ message: 'Tarefa atualizada com sucesso!', type: 'success' });
                fetchTasks();
            }
        } else {
            // FIX: The type of the inserted object was inferred as 'never' because the Supabase DB types were incorrect. This is fixed in supabaseClient.ts.
            const { error } = await supabase.from('tarefas').insert([{ ...taskData, organization_id: profile.organization_id }]);
            if(error) setToast({ message: `Erro ao criar tarefa: ${error.message}`, type: 'error'});
            else {
                setToast({ message: 'Tarefa criada com sucesso!', type: 'success' });
                fetchTasks();
            }
        }
        handleCloseModal();
    };

    const sortedAndFilteredTasks = useMemo(() => {
        let filtered = tasks.filter(t => t.titulo.toLowerCase().includes(searchTerm.toLowerCase()));
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
    }, [tasks, searchTerm, sortConfig]);

    const requestSort = (key: SortKeys) => {
        setSortConfig(prev => ({ key, direction: prev && prev.key === key && prev.direction === 'ascending' ? 'descending' : 'ascending' }));
    };

    return (
        <>
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            <div className="bg-white p-6 rounded-xl shadow-md">
                <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
                    <h3 className="text-xl font-semibold text-gray-800">Lista de Tarefas</h3>
                    <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-4">
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3"><SearchIcon /></span>
                            <input type="text" placeholder="Buscar..." onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary"/>
                        </div>
                        <button onClick={() => handleOpenModal()} className="flex items-center justify-center bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-hover transition-colors">
                            <PlusIcon className="w-5 h-5 mr-2" />
                            Nova Tarefa
                        </button>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3"><SortableHeader label="Tarefa" sortKey="titulo" requestSort={requestSort} sortConfig={sortConfig} /></th>
                                <th scope="col" className="px-6 py-3"><SortableHeader label="Responsável" sortKey="responsavel" requestSort={requestSort} sortConfig={sortConfig} /></th>
                                <th scope="col" className="px-6 py-3"><SortableHeader label="Prazo" sortKey="data_vencimento" requestSort={requestSort} sortConfig={sortConfig} /></th>
                                <th scope="col" className="px-6 py-3"><SortableHeader label="Status" sortKey="status" requestSort={requestSort} sortConfig={sortConfig} /></th>
                                <th scope="col" className="px-6 py-3">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? <tr><td colSpan={5} className="text-center py-8"><SpinnerIcon className="mx-auto w-8 h-8"/></td></tr>
                            : sortedAndFilteredTasks.map((task) => (
                                <tr key={task.id} className="bg-white border-b hover:bg-gray-50">
                                    <td className="px-6 py-4 font-medium text-gray-900">{task.titulo}</td>
                                    <td className="px-6 py-4">{task.responsavel || 'N/A'}</td>
                                    <td className="px-6 py-4">{new Date(task.data_vencimento).toLocaleDateString('pt-BR')}</td>
                                    <td className="px-6 py-4"><span className={`px-2 py-1 font-semibold leading-tight rounded-full text-xs ${getStatusBadgeClass(task.status)}`}>{task.status}</span></td>
                                    <td className="px-6 py-4">
                                        <button onClick={() => handleOpenModal(task)} className="text-primary hover:underline font-medium">Editar</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <TaskFormModal isOpen={isModalOpen} onClose={handleCloseModal} onSave={handleSaveTask} task={editingTask} />
            </div>
        </>
    );
};

const TaskFormModal: React.FC<{isOpen: boolean; onClose: () => void; onSave: (data: Omit<Tarefa, 'id' | 'organization_id'>) => void; task: Tarefa | null;}> = ({ isOpen, onClose, onSave, task }) => {
    const [formState, setFormState] = useState({
        titulo: '', descricao: '', responsavel: '', data_vencimento: '', status: StatusTarefa.PENDENTE
    });

    React.useEffect(() => {
        if (task) setFormState({ ...task, data_vencimento: new Date(task.data_vencimento).toISOString().split('T')[0], responsavel: task.responsavel || '' });
        else setFormState({ titulo: '', descricao: '', responsavel: '', data_vencimento: '', status: StatusTarefa.PENDENTE });
    }, [task, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormState(prev => ({...prev, [name]: value}));
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formState);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={task ? "Editar Tarefa" : "Criar Nova Tarefa"}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div><label className="block text-sm font-medium text-gray-700">Título</label><input type="text" name="titulo" value={formState.titulo} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" required /></div>
                <div><label className="block text-sm font-medium text-gray-700">Descrição</label><textarea name="descricao" value={formState.descricao} onChange={handleChange} rows={3} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"></textarea></div>
                <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-sm font-medium text-gray-700">Responsável</label><input type="text" name="responsavel" value={formState.responsavel} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" /></div>
                    <div><label className="block text-sm font-medium text-gray-700">Prazo</label><input type="date" name="data_vencimento" value={formState.data_vencimento} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" required /></div>
                </div>
                <div><label className="block text-sm font-medium text-gray-700">Status</label><select name="status" value={formState.status} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm bg-white">{Object.values(StatusTarefa).map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                <div className="mt-6 flex justify-end space-x-3">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancelar</button>
                    <button type="submit" className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-hover">Salvar</button>
                </div>
            </form>
        </Modal>
    );
};

export default TaskList;