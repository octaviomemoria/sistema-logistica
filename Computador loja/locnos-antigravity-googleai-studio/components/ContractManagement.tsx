import React, { useState, useMemo, useEffect } from 'react';
import { ModeloContrato, Profile } from '../types';
import { PlusIcon, SearchIcon } from './Icons';
import Modal from './Modal';
import Toast from './Toast';
import { supabase } from '../supabaseClient';

const ContractManagement: React.FC<{ profile: Profile }> = ({ profile }) => {
    const [templates, setTemplates] = useState<ModeloContrato[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<ModeloContrato | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const fetchTemplates = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('modelos_contrato')
            .select('*')
            .eq('organization_id', profile.organization_id);

        if (error) {
            setToast({ message: `Erro ao carregar modelos: ${error.message}`, type: 'error' });
        } else {
            setTemplates(data);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchTemplates();
    }, [profile.organization_id]);

    const handleOpenModal = (template: ModeloContrato | null = null) => {
        setEditingTemplate(template);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setEditingTemplate(null);
        setIsModalOpen(false);
    };

    const handleSaveTemplate = async (templateData: Omit<ModeloContrato, 'id' | 'organization_id'>) => {
        if (editingTemplate) {
            // FIX: The type of templateData was inferred as 'never' because the Supabase DB types were incorrect. This is fixed in supabaseClient.ts.
            const { error } = await supabase.from('modelos_contrato').update(templateData).eq('id', editingTemplate.id);
            if(error) {
                setToast({ message: `Erro ao atualizar modelo: ${error.message}`, type: 'error' });
            } else {
                setToast({ message: 'Modelo de contrato atualizado!', type: 'success' });
                fetchTemplates();
            }
        } else {
            // FIX: The type of the inserted object was inferred as 'never' because the Supabase DB types were incorrect. This is fixed in supabaseClient.ts.
            const { error } = await supabase.from('modelos_contrato').insert([{...templateData, organization_id: profile.organization_id}]);
            if(error) {
                setToast({ message: `Erro ao criar modelo: ${error.message}`, type: 'error' });
            } else {
                setToast({ message: 'Modelo de contrato criado!', type: 'success' });
                fetchTemplates();
            }
        }
        handleCloseModal();
    };

    const handleDeleteTemplate = async (id: string) => {
        if (window.confirm('Tem certeza que deseja excluir este modelo de contrato?')) {
            const { error } = await supabase.from('modelos_contrato').delete().eq('id', id);
             if(error) {
                setToast({ message: `Erro ao excluir modelo: ${error.message}`, type: 'error' });
            } else {
                setToast({ message: 'Modelo de contrato excluído.', type: 'success' });
                fetchTemplates();
            }
        }
    };

    const filteredTemplates = useMemo(() => {
        return templates.filter(t => t.nome.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [templates, searchTerm]);

    return (
        <>
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            <div className="bg-white p-6 rounded-xl shadow-md">
                <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
                    <h3 className="text-xl font-semibold text-gray-800">Modelos de Contrato</h3>
                    <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-4">
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3"><SearchIcon /></span>
                            <input type="text" placeholder="Buscar modelo..." onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary"/>
                        </div>
                        <button onClick={() => handleOpenModal()} className="flex items-center justify-center bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-hover transition-colors">
                            <PlusIcon className="w-5 h-5 mr-2" />
                            Novo Modelo
                        </button>
                    </div>
                </div>

                {loading ? <p>Carregando modelos...</p> : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredTemplates.map(template => (
                            <div key={template.id} className="bg-gray-50 border border-gray-200 rounded-lg p-5 flex flex-col justify-between">
                                <div>
                                    <h4 className="font-bold text-gray-800">{template.nome}</h4>
                                    <p className="text-sm text-gray-500 mt-2 line-clamp-3">{template.conteudo}</p>
                                </div>
                                <div className="flex space-x-3 mt-4 pt-4 border-t">
                                    <button onClick={() => handleOpenModal(template)} className="text-primary hover:underline font-medium">Editar</button>
                                    <button onClick={() => handleDeleteTemplate(template.id)} className="text-red-600 hover:underline font-medium">Excluir</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <ContractFormModal isOpen={isModalOpen} onClose={handleCloseModal} onSave={handleSaveTemplate} template={editingTemplate} />
        </>
    );
};

const ContractFormModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Omit<ModeloContrato, 'id' | 'organization_id'>) => void;
    template: ModeloContrato | null;
}> = ({ isOpen, onClose, onSave, template }) => {
    const [formState, setFormState] = useState({ nome: '', conteudo: '' });

    React.useEffect(() => {
        if (template) {
            setFormState({ nome: template.nome, conteudo: template.conteudo });
        } else {
            setFormState({ nome: '', conteudo: '' });
        }
    }, [template, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormState({ ...formState, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formState);
    };

    const placeholders = [
      { tag: '{{CLIENT_NAME}}', desc: 'Nome ou Razão Social do cliente' },
      { tag: '{{CLIENT_DOCUMENT_NUMBER}}', desc: 'CPF ou CNPJ do cliente' },
      { tag: '{{CLIENT_PHONE}}', desc: 'Telefone do cliente' },
      { tag: '{{CLIENT_EMAIL}}', desc: 'Email do cliente' },
      { tag: '{{CLIENT_ADDRESS}}', desc: 'Endereço completo do cliente' },
      { tag: '{{EQUIPMENT_NAME}}', desc: 'Nome do equipamento alugado' },
      { tag: '{{EQUIPMENT_BRAND}}', desc: 'Marca do equipamento' },
      { tag: '{{START_DATE}}', desc: 'Data de início da locação' },
      { tag: '{{END_DATE}}', desc: 'Data de término da locação' },
      { tag: '{{RENTAL_DAYS}}', desc: 'Duração da locação em dias' },
      { tag: '{{TOTAL_VALUE}}', desc: 'Valor total da locação' },
      { tag: '{{DEPOSIT_VALUE}}', desc: 'Valor da caução (se houver)' },
    ];

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={template ? "Editar Modelo" : "Criar Novo Modelo de Contrato"}>
            <form onSubmit={handleSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto p-1">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-4">
                        <div>
                            <label htmlFor="nome" className="block text-sm font-medium text-gray-700">Nome do Modelo</label>
                            <input type="text" id="nome" name="nome" value={formState.nome} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" required />
                        </div>
                        <div>
                            <label htmlFor="conteudo" className="block text-sm font-medium text-gray-700">Conteúdo do Contrato</label>
                            <textarea id="conteudo" name="conteudo" value={formState.conteudo} onChange={handleChange} rows={15} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm font-mono" placeholder="Digite ou cole o texto do contrato aqui..." required></textarea>
                        </div>
                    </div>
                    <div className="lg:col-span-1 bg-gray-50 p-4 rounded-lg overflow-y-auto">
                        <h4 className="font-semibold text-gray-700 mb-3">Variáveis Dinâmicas</h4>
                        <p className="text-xs text-gray-500 mb-4">Clique para copiar e cole no texto do contrato.</p>
                        <div className="space-y-2">
                            {placeholders.map(p => (
                                <div key={p.tag} onClick={() => copyToClipboard(p.tag)} className="cursor-pointer p-2 bg-white border rounded-md hover:bg-blue-50 hover:border-primary transition-colors">
                                    <p className="font-mono text-xs font-bold text-primary">{p.tag}</p>
                                    <p className="text-xs text-gray-500">{p.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3 pt-4 border-t">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancelar</button>
                    <button type="submit" className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-hover">Salvar Modelo</button>
                </div>
            </form>
        </Modal>
    );
};

export default ContractManagement;