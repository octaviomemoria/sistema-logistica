import React, { useState, useEffect, useRef } from 'react';
import { Locacao, StatusLocacao, StatusPagamento, MetodoPagamento, Equipamento, Cliente, TipoCliente, Endereco, Profile, Motorista } from '../types';
import { PlusIcon, TrashIcon, CurrencyDollarIcon, SpinnerIcon } from './Icons';
import Modal from './Modal';
import ClientFormModal, { ClientFormData } from './ClientFormModal';
import { supabase } from '../supabaseClient';

// Structure for the form item
export interface RentalItemFormData {
    tempId: string;
    equipamento_id: string;
    quantidade: number;
    valor_unitario: number;
}

export type RentalFormData = Omit<Locacao, 'id' | 'equipamentos' | 'clientes' | 'criado_em' | 'organization_id' | 'itens' | 'pagamentos'> & {
    items: RentalItemFormData[];
};

interface RentalFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: RentalFormData) => void;
    rental: Locacao | null;
    equipments: Equipamento[];
    clients: Cliente[];
    drivers: Motorista[];
    onPaymentUpdate: () => void;
    onRefreshClients: () => Promise<void>;
    profile: Profile;
}

const RentalFormModal: React.FC<RentalFormModalProps> = ({ isOpen, onClose, onSave, rental, equipments, clients, drivers, onPaymentUpdate, onRefreshClients, profile }) => {

    const initialFormState = {
        cliente_id: '', data_inicio: '', data_fim: '', status: StatusLocacao.AGENDADO,
        status_pagamento: StatusPagamento.PENDENTE,
        observacoes: '',
        endereco_uso_cep: '', endereco_uso_rua: '', endereco_uso_numero: '', endereco_uso_complemento: '',
        endereco_uso_bairro: '', endereco_uso_cidade: '', endereco_uso_estado: '',
        duracao_dias: 1,
        responsavel_entrega_id: '',
        responsavel_devolucao_id: '',
    };

    const [formState, setFormState] = useState(initialFormState);
    const [rentalItems, setRentalItems] = useState<RentalItemFormData[]>([]);
    const [useClientAddress, setUseClientAddress] = useState(true);
    const clientAddressRef = useRef<Endereco | null>(null);

    // Payment logic
    const [isAddingPayment, setIsAddingPayment] = useState(false);
    const [newPayment, setNewPayment] = useState({
        valor: '',
        metodo: MetodoPagamento.PIX,
        data: new Date().toISOString().split('T')[0]
    });

    const [isClientModalOpen, setIsClientModalOpen] = useState(false);

    useEffect(() => {
        if (rental) {
            const client = clients.find(c => c.id === rental.cliente_id);
            clientAddressRef.current = client?.endereco || null;

            setFormState({
                ...initialFormState,
                cliente_id: rental.cliente_id,
                data_inicio: new Date(rental.data_inicio).toISOString().split('T')[0],
                data_fim: new Date(rental.data_fim).toISOString().split('T')[0],
                status: rental.status,
                status_pagamento: rental.status_pagamento,
                observacoes: rental.observacoes || '',
                duracao_dias: rental.duracao_dias,
                endereco_uso_cep: rental.endereco_uso?.cep || client?.endereco?.cep || '',
                endereco_uso_rua: rental.endereco_uso?.rua || client?.endereco?.rua || '',
                endereco_uso_numero: rental.endereco_uso?.numero || client?.endereco?.numero || '',
                endereco_uso_complemento: rental.endereco_uso?.complemento || client?.endereco?.complemento || '',
                endereco_uso_bairro: rental.endereco_uso?.bairro || client?.endereco?.bairro || '',
                endereco_uso_cidade: rental.endereco_uso?.cidade || client?.endereco?.cidade || '',
                endereco_uso_estado: rental.endereco_uso?.estado || client?.endereco?.estado || '',
                responsavel_entrega_id: rental.responsavel_entrega_id || '',
                responsavel_devolucao_id: rental.responsavel_devolucao_id || '',
            });

            // Populate items
            if (rental.itens && rental.itens.length > 0) {
                setRentalItems(rental.itens.map(i => ({
                    tempId: i.id,
                    equipamento_id: i.equipamento_id,
                    quantidade: i.quantidade,
                    valor_unitario: i.valor_unitario
                })));
            } else {
                setRentalItems([]);
            }

        } else {
            setFormState(initialFormState);
            setRentalItems([]);
            clientAddressRef.current = null;
            setUseClientAddress(true);
        }
        setNewPayment({
            valor: '',
            metodo: MetodoPagamento.PIX,
            data: new Date().toISOString().split('T')[0]
        });
        setIsAddingPayment(false);
    }, [rental, isOpen]);

    // Calculate total based on items
    const calculatedTotal = rentalItems.reduce((acc, item) => acc + (item.valor_unitario * item.quantidade), 0);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;

        if (name === 'cliente_id') {
            const client = clients.find(c => c.id === value);
            clientAddressRef.current = client?.endereco || null;
            if (useClientAddress && client?.endereco) {
                setFormState(prev => ({
                    ...prev,
                    endereco_uso_cep: client.endereco?.cep || '',
                    endereco_uso_rua: client.endereco?.rua || '',
                    endereco_uso_numero: client.endereco?.numero || '',
                    endereco_uso_complemento: client.endereco?.complemento || '',
                    endereco_uso_bairro: client.endereco?.bairro || '',
                    endereco_uso_cidade: client.endereco?.cidade || '',
                    endereco_uso_estado: client.endereco?.estado || '',
                }));
            }
            setFormState(prev => ({ ...prev, [name]: value }));
            return;
        }

        if (name === 'data_inicio' || name === 'data_fim') {
            // Simple validation/calc for days
            setFormState(prev => {
                const updated = { ...prev, [name]: value };
                if (updated.data_inicio && updated.data_fim) {
                    const start = new Date(updated.data_inicio);
                    const end = new Date(updated.data_fim);
                    const diffTime = Math.abs(end.getTime() - start.getTime());
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // Inclusive
                    updated.duracao_dias = diffDays > 0 ? diffDays : 1;
                }
                return updated;
            });
            return;
        }

        setFormState(prev => ({ ...prev, [name]: value }));
    };

    // --- Item Management ---

    const handleAddItem = () => {
        setRentalItems(prev => [
            ...prev,
            {
                tempId: `temp_${Date.now()}`,
                equipamento_id: '',
                quantidade: 1,
                valor_unitario: 0
            }
        ]);
    };

    const handleRemoveItem = (index: number) => {
        setRentalItems(prev => prev.filter((_, i) => i !== index));
    };

    const handleItemChange = (index: number, field: keyof RentalItemFormData, value: any) => {
        setRentalItems(prev => {
            const newItems = [...prev];
            const item = { ...newItems[index] };

            if (field === 'equipamento_id') {
                item.equipamento_id = value;
                // Optional: Reset price or try to smart-guess based on first available period
                const equipment = equipments.find(e => e.id === value);
                if (equipment && equipment.periodos_locacao && equipment.periodos_locacao.length > 0) {
                    // Default to first period price for convenience, user can change
                    item.valor_unitario = equipment.periodos_locacao[0].preco;
                }
            } else if (field === 'quantidade') {
                item.quantidade = parseInt(value, 10) || 1;
            } else if (field === 'valor_unitario') {
                item.valor_unitario = parseFloat(value) || 0;
            }

            newItems[index] = item;
            return newItems;
        });
    };

    const handleApplyPeriodPrice = (index: number, price: number) => {
        handleItemChange(index, 'valor_unitario', price);
    };

    // --- End Item Management ---

    const handleUseClientAddressToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
        const isChecked = e.target.checked;
        setUseClientAddress(isChecked);
        if (isChecked && clientAddressRef.current) {
            setFormState(prev => ({
                ...prev,
                endereco_uso_cep: clientAddressRef.current?.cep || '',
                endereco_uso_rua: clientAddressRef.current?.rua || '',
                endereco_uso_numero: clientAddressRef.current?.numero || '',
                endereco_uso_complemento: clientAddressRef.current?.complemento || '',
                endereco_uso_bairro: clientAddressRef.current?.bairro || '',
                endereco_uso_cidade: clientAddressRef.current?.cidade || '',
                endereco_uso_estado: clientAddressRef.current?.estado || '',
            }));
        } else {
            setFormState(prev => ({
                ...prev,
                endereco_uso_cep: '', endereco_uso_rua: '', endereco_uso_numero: '', endereco_uso_complemento: '',
                endereco_uso_bairro: '', endereco_uso_cidade: '', endereco_uso_estado: '',
            }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (rentalItems.length === 0) {
            alert("Adicione pelo menos um equipamento à locação.");
            return;
        }

        if (rentalItems.some(i => !i.equipamento_id)) {
            alert("Selecione o equipamento para todos os itens.");
            return;
        }

        const rentalData: RentalFormData = {
            cliente_id: formState.cliente_id,
            data_inicio: formState.data_inicio,
            data_fim: formState.data_fim,
            status: formState.status,
            valor_total: calculatedTotal, // Use calculated sum
            status_pagamento: formState.status_pagamento,
            observacoes: formState.observacoes,
            duracao_dias: formState.duracao_dias,
            responsavel_entrega_id: formState.responsavel_entrega_id || null,
            responsavel_devolucao_id: formState.responsavel_devolucao_id || null,
            endereco_uso: {
                cep: formState.endereco_uso_cep,
                rua: formState.endereco_uso_rua,
                numero: formState.endereco_uso_numero,
                complemento: formState.endereco_uso_complemento,
                bairro: formState.endereco_uso_bairro,
                cidade: formState.endereco_uso_cidade,
                estado: formState.endereco_uso_estado,
            },
            items: rentalItems
        };
        onSave(rentalData);
    };

    const handleAddPayment = async () => {
        if (!rental) return;
        const valor = parseFloat(newPayment.valor);
        if (isNaN(valor) || valor <= 0) {
            alert('Por favor, insira um valor válido.');
            return;
        }

        setIsAddingPayment(true);
        const { error } = await supabase.from('pagamentos').insert({
            organization_id: rental.organization_id,
            locacao_id: rental.id,
            valor_pago: valor,
            metodo_pagamento: newPayment.metodo,
            data_pagamento: newPayment.data
        });

        if (error) {
            alert(`Erro ao registrar pagamento: ${error.message}`);
        } else {
            const currentTotalPaid = rental.pagamentos?.reduce((acc, p) => acc + p.valor_pago, 0) || 0;
            const newTotalPaid = currentTotalPaid + valor;
            const totalValue = calculatedTotal;

            let suggestedStatus = formState.status_pagamento;
            if (newTotalPaid >= totalValue) {
                suggestedStatus = StatusPagamento.PAGO;
            } else if (newTotalPaid > 0) {
                suggestedStatus = StatusPagamento.PAGO_PARCIALMENTE;
            }

            if (suggestedStatus !== formState.status_pagamento) {
                const confirmUpdate = window.confirm(`Pagamento registrado! O saldo pago agora é R$ ${newTotalPaid.toFixed(2)}. Deseja atualizar o status para "${suggestedStatus}"?`);
                if (confirmUpdate) {
                    await supabase.from('locacoes').update({ status_pagamento: suggestedStatus }).eq('id', rental.id);
                    setFormState(prev => ({ ...prev, status_pagamento: suggestedStatus }));
                }
            }

            setNewPayment(prev => ({ ...prev, valor: '' }));
            onPaymentUpdate();
        }
        setIsAddingPayment(false);
    };

    const handleDeletePayment = async (paymentId: string) => {
        if (window.confirm('Tem certeza que deseja remover este pagamento?')) {
            const { error } = await supabase.from('pagamentos').delete().eq('id', paymentId);
            if (error) {
                alert(`Erro ao remover pagamento: ${error.message}`);
            } else {
                onPaymentUpdate();
            }
        }
    };

    const handleSaveNewClient = async (clientData: ClientFormData) => {
        const { data, error } = await supabase.from('clientes').insert([{ ...clientData, organization_id: profile.organization_id }]).select().single();
        if (error) {
            alert(`Erro ao criar cliente: ${error.message}`);
        } else if (data) {
            await onRefreshClients();
            // Automatically select the new client
            setFormState(prev => ({ ...prev, cliente_id: data.id }));
            // Update address ref
            const newClient = data as Cliente;
            clientAddressRef.current = newClient.endereco || null;
            if (newClient.endereco && useClientAddress) {
                setFormState(prev => ({
                    ...prev,
                    endereco_uso_cep: newClient.endereco?.cep || '',
                    endereco_uso_rua: newClient.endereco?.rua || '',
                    endereco_uso_numero: newClient.endereco?.numero || '',
                    endereco_uso_complemento: newClient.endereco?.complemento || '',
                    endereco_uso_bairro: newClient.endereco?.bairro || '',
                    endereco_uso_cidade: newClient.endereco?.cidade || '',
                    endereco_uso_estado: newClient.endereco?.estado || '',
                }));
            }
            setIsClientModalOpen(false);
        }
    };

    const totalPago = rental?.pagamentos?.reduce((acc, p) => acc + p.valor_pago, 0) || 0;
    const restante = Math.max(0, calculatedTotal - totalPago);

    return (
        <>
            <Modal isOpen={isOpen} onClose={onClose} title={rental ? "Editar Locação" : "Nova Locação"}>
                <form onSubmit={handleSubmit} className="max-h-[75vh] overflow-y-auto p-1 space-y-6">
                    <div>
                        <h4 className="text-md font-semibold text-gray-600 mb-3 border-b pb-2">Detalhes da Locação</h4>
                        <div className="grid grid-cols-1 gap-4">
                            <div>
                                <label htmlFor="cliente_id" className="block text-sm font-medium text-gray-700">Cliente</label>
                                <div className="flex mt-1">
                                    <select id="cliente_id" name="cliente_id" value={formState.cliente_id} onChange={handleChange} className="block w-full px-3 py-2 border border-gray-300 rounded-l-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" required>
                                        <option value="">Selecione...</option>
                                        {clients.map(c => <option key={c.id} value={c.id}>{c.tipo === TipoCliente.PESSOA_FISICA ? c.nome_completo : c.nome_fantasia}</option>)}
                                    </select>
                                    <button
                                        type="button"
                                        onClick={() => setIsClientModalOpen(true)}
                                        className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-gray-500 hover:bg-gray-100"
                                        title="Cadastrar Novo Cliente"
                                    >
                                        <PlusIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="data_inicio" className="block text-sm font-medium text-gray-700">Data de Início</label>
                                    <input type="date" id="data_inicio" name="data_inicio" value={formState.data_inicio} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" required />
                                </div>
                                <div>
                                    <label htmlFor="data_fim" className="block text-sm font-medium text-gray-700">Data de Devolução</label>
                                    <input type="date" id="data_fim" name="data_fim" value={formState.data_fim} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" required />
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 border border-gray-200 rounded-md p-4 bg-gray-50">
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="text-sm font-semibold text-gray-700">Itens da Locação</h4>
                                <button type="button" onClick={handleAddItem} className="text-xs flex items-center text-primary hover:text-primary-hover font-medium">
                                    <PlusIcon className="w-4 h-4 mr-1" /> Adicionar Equipamento
                                </button>
                            </div>

                            <div className="space-y-3">
                                {rentalItems.length === 0 && <p className="text-sm text-gray-500 text-center py-2 italic">Nenhum equipamento adicionado.</p>}

                                {rentalItems.map((item, index) => (
                                    <div key={item.tempId} className="bg-white border border-gray-200 rounded-md p-3 shadow-sm">
                                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                                            <div className="sm:col-span-5">
                                                <label className="block text-xs font-medium text-gray-500 mb-1">Equipamento</label>
                                                <select
                                                    value={item.equipamento_id}
                                                    onChange={(e) => handleItemChange(index, 'equipamento_id', e.target.value)}
                                                    className="block w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm"
                                                    required
                                                >
                                                    <option value="">Selecione...</option>
                                                    {equipments.map(eq => <option key={eq.id} value={eq.id}>{eq.nome}</option>)}
                                                </select>
                                            </div>
                                            <div className="sm:col-span-2">
                                                <label className="block text-xs font-medium text-gray-500 mb-1">Qtd.</label>
                                                <input
                                                    type="number"
                                                    value={item.quantidade}
                                                    onChange={(e) => handleItemChange(index, 'quantidade', e.target.value)}
                                                    className="block w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm"
                                                    min="1"
                                                />
                                            </div>
                                            <div className="sm:col-span-3">
                                                <label className="block text-xs font-medium text-gray-500 mb-1">Valor Unit. (R$)</label>
                                                <input
                                                    type="number"
                                                    value={item.valor_unitario}
                                                    onChange={(e) => handleItemChange(index, 'valor_unitario', e.target.value)}
                                                    className="block w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm"
                                                    min="0" step="0.01"
                                                />
                                            </div>
                                            <div className="sm:col-span-2 text-right">
                                                <p className="text-xs font-bold text-gray-700 mb-2">Total: R$ {(item.quantidade * item.valor_unitario).toFixed(2)}</p>
                                                <button type="button" onClick={() => handleRemoveItem(index)} className="text-red-500 hover:text-red-700 text-xs underline">Remover</button>
                                            </div>
                                        </div>

                                        {/* Price Helper */}
                                        {item.equipamento_id && (() => {
                                            const eq = equipments.find(e => e.id === item.equipamento_id);
                                            if (eq && eq.periodos_locacao.length > 0) {
                                                return (
                                                    <div className="mt-2 text-xs text-gray-500 flex flex-wrap gap-2 items-center">
                                                        <span>Preços Sugeridos:</span>
                                                        {eq.periodos_locacao.map(p => (
                                                            <button
                                                                key={p.id}
                                                                type="button"
                                                                onClick={() => handleApplyPeriodPrice(index, p.preco)}
                                                                className="px-2 py-0.5 bg-gray-100 hover:bg-gray-200 rounded border border-gray-300 transition-colors"
                                                            >
                                                                {p.descricao}: R${p.preco}
                                                            </button>
                                                        ))}
                                                    </div>
                                                );
                                            }
                                            return null;
                                        })()}
                                    </div>
                                ))}
                            </div>
                            <div className="mt-3 text-right">
                                <span className="text-sm text-gray-600 mr-2">Total da Locação:</span>
                                <span className="text-lg font-bold text-primary">R$ {calculatedTotal.toFixed(2).replace('.', ',')}</span>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h4 className="text-md font-semibold text-gray-600 mb-3 border-b pb-2">Logística (Entrega e Devolução)</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="responsavel_entrega_id" className="block text-sm font-medium text-gray-700">Motorista de Entrega</label>
                                <select id="responsavel_entrega_id" name="responsavel_entrega_id" value={formState.responsavel_entrega_id} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm">
                                    <option value="">Não agendado / Retirada no balcão</option>
                                    {drivers.map(d => <option key={d.id} value={d.id}>{d.nome}</option>)}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="responsavel_devolucao_id" className="block text-sm font-medium text-gray-700">Motorista de Devolução</label>
                                <select id="responsavel_devolucao_id" name="responsavel_devolucao_id" value={formState.responsavel_devolucao_id} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm">
                                    <option value="">Não agendado / Devolução no balcão</option>
                                    {drivers.map(d => <option key={d.id} value={d.id}>{d.nome}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h4 className="text-md font-semibold text-gray-600 mb-3 border-b pb-2">Endereço de Utilização</h4>
                        <div className="flex items-center mb-4">
                            <input type="checkbox" id="useClientAddress" checked={useClientAddress} onChange={handleUseClientAddressToggle} disabled={!formState.cliente_id} className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded disabled:opacity-50" />
                            <label htmlFor="useClientAddress" className="ml-2 block text-sm text-gray-900">Usar endereço de cadastro do cliente</label>
                        </div>
                        {!useClientAddress && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div className="sm:col-span-1"><label className="block text-sm font-medium text-gray-700">CEP</label><input type="text" name="endereco_uso_cep" value={formState.endereco_uso_cep} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" /></div>
                                    <div className="sm:col-span-2"><label className="block text-sm font-medium text-gray-700">Rua</label><input type="text" name="endereco_uso_rua" value={formState.endereco_uso_rua} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" /></div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div><label className="block text-sm font-medium text-gray-700">Número</label><input type="text" name="endereco_uso_numero" value={formState.endereco_uso_numero} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" /></div>
                                    <div><label className="block text-sm font-medium text-gray-700">Bairro</label><input type="text" name="endereco_uso_bairro" value={formState.endereco_uso_bairro} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" /></div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div>
                        <h4 className="text-md font-semibold text-gray-600 mb-3 border-b pb-2">Status</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status da Locação</label>
                                <select id="status" name="status" value={formState.status} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white">
                                    {Object.values(StatusLocacao).map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="status_pagamento" className="block text-sm font-medium text-gray-700">Status do Pagamento</label>
                                <select id="status_pagamento" name="status_pagamento" value={formState.status_pagamento} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white">
                                    {Object.values(StatusPagamento).map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label htmlFor="observacoes" className="block text-sm font-medium text-gray-700">Observações</label>
                        <textarea id="observacoes" name="observacoes" value={formState.observacoes} onChange={handleChange} rows={3} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"></textarea>
                    </div>

                    {rental && (
                        <div className="border-t pt-4 mt-4">
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="text-md font-semibold text-gray-600">Histórico de Pagamentos</h4>
                                <div className="text-right text-sm">
                                    <p><span className="text-gray-500">Total Contrato:</span> <span className="font-semibold">R$ {calculatedTotal.toFixed(2)}</span></p>
                                    <p><span className="text-gray-500">Total Pago:</span> <span className="font-bold text-green-600">R$ {totalPago.toFixed(2)}</span></p>
                                </div>
                            </div>

                            <div className="bg-gray-50 rounded-md border overflow-hidden mb-4">
                                {rental.pagamentos && rental.pagamentos.length > 0 ? (
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-100">
                                            <tr>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Método</th>
                                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Valor</th>
                                                <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase w-10"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {rental.pagamentos
                                                .sort((a, b) => new Date(b.data_pagamento).getTime() - new Date(a.data_pagamento).getTime())
                                                .map((pag) => (
                                                    <tr key={pag.id}>
                                                        <td className="px-4 py-2 text-sm text-gray-700">
                                                            {new Date(pag.data_pagamento).toLocaleDateString('pt-BR')}
                                                        </td>
                                                        <td className="px-4 py-2 text-sm text-gray-700">
                                                            {pag.metodo_pagamento}
                                                        </td>
                                                        <td className="px-4 py-2 text-sm text-gray-700 text-right">
                                                            R$ {pag.valor_pago.toFixed(2).replace('.', ',')}
                                                        </td>
                                                        <td className="px-4 py-2 text-center">
                                                            <button type="button" onClick={() => handleDeletePayment(pag.id)} className="text-red-500 hover:text-red-700">
                                                                <TrashIcon className="w-4 h-4" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <p className="p-4 text-sm text-gray-500 text-center">Nenhum pagamento registrado.</p>
                                )}
                            </div>

                            {restante > 0 && (
                                <div className="bg-blue-50 p-3 rounded-md border border-blue-100">
                                    <h5 className="text-sm font-semibold text-blue-800 mb-2 flex items-center gap-2">
                                        <CurrencyDollarIcon className="w-4 h-4" /> Registrar Novo Pagamento
                                    </h5>
                                    <div className="flex flex-col sm:flex-row gap-3 items-end">
                                        <div className="w-full sm:w-1/3">
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Valor (Restante: R$ {restante.toFixed(2)})</label>
                                            <input
                                                type="number"
                                                value={newPayment.valor}
                                                onChange={(e) => setNewPayment({ ...newPayment, valor: e.target.value })}
                                                className="block w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                                                placeholder="0,00"
                                            />
                                        </div>
                                        <div className="w-full sm:w-1/3">
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Método</label>
                                            <select
                                                value={newPayment.metodo}
                                                onChange={(e) => setNewPayment({ ...newPayment, metodo: e.target.value as MetodoPagamento })}
                                                className="block w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm bg-white focus:ring-blue-500 focus:border-blue-500"
                                            >
                                                {Object.values(MetodoPagamento).map(m => <option key={m} value={m}>{m}</option>)}
                                            </select>
                                        </div>
                                        <div className="w-full sm:w-1/3">
                                            <label className="block text-xs font-medium text-gray-500 mb-1">Data</label>
                                            <input
                                                type="date"
                                                value={newPayment.data}
                                                onChange={(e) => setNewPayment({ ...newPayment, data: e.target.value })}
                                                className="block w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleAddPayment}
                                            disabled={isAddingPayment || !newPayment.valor}
                                            className="bg-blue-600 text-white px-4 py-1.5 rounded-md text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                                        >
                                            {isAddingPayment ? <SpinnerIcon className="w-4 h-4 animate-spin" /> : <PlusIcon className="w-4 h-4 mr-1" />}
                                            Adicionar
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="mt-6 flex justify-end space-x-3 pt-4 border-t">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancelar</button>
                        <button type="submit" className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-hover">Salvar Alterações</button>
                    </div>
                </form>
            </Modal>
            <ClientFormModal
                isOpen={isClientModalOpen}
                onClose={() => setIsClientModalOpen(false)}
                onSave={handleSaveNewClient}
                client={null}
                setToast={null}
            />
        </>
    );
};

export default RentalFormModal;
