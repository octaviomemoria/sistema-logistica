
import React, { useState, useMemo, useEffect } from 'react';
import { Locacao, StatusLocacao, LogisticsEvent, Motorista, Profile, Endereco } from '../types';
import { CameraIcon, MapPinIcon, TruckIcon, SpinnerIcon } from './Icons';
import Modal from './Modal';
import { supabase } from '../supabaseClient';

type OperationalRental = Locacao & { stage: 'checkout' | 'active' | 'checkin' | 'done' };

interface RentalCardProps {
    rental: OperationalRental;
    onOpenModal: (type: 'checkout' | 'checkin', rental: OperationalRental) => void;
}

const RentalCard: React.FC<RentalCardProps> = ({ rental, onOpenModal }) => (
  <div className="bg-white p-4 rounded-lg shadow border border-gray-200 mb-4">
    <div className="flex justify-between items-start">
        <div>
            <p className="font-bold text-gray-800">{rental.equipamentos?.nome || 'Equipamento'}</p>
            <p className="text-sm text-gray-500">{rental.clientes?.nome_fantasia || rental.clientes?.nome_completo || 'Cliente'}</p>
            <p className="text-xs text-gray-400 mt-1">Contrato: {rental.id.slice(0, 8)}</p>
        </div>
        <div className="text-right">
            <span className="text-sm font-semibold text-primary">R$ {rental.valor_total.toFixed(2)}</span>
            {(rental.status_pagamento === 'Pendente' || rental.status_pagamento === 'Atrasado') && (
                 <p className="text-xs text-red-600 font-bold mt-1">Falta Pagar</p>
            )}
        </div>
    </div>
    <div className="text-center mt-3">
        {rental.stage === 'checkout' && <button onClick={() => onOpenModal('checkout', rental)} className="w-full bg-blue-500 text-white px-3 py-1.5 text-sm rounded-md hover:bg-blue-600">Realizar Check-out</button>}
        {rental.stage === 'checkin' && <button onClick={() => onOpenModal('checkin', rental)} className="w-full bg-green-500 text-white px-3 py-1.5 text-sm rounded-md hover:bg-green-600">Realizar Check-in</button>}
    </div>
  </div>
);

const CheckInOutModal = ({ isOpen, onClose, type, rental }: { isOpen: boolean, onClose: () => void, type: 'checkout' | 'checkin', rental: OperationalRental | null }) => {
    if (!isOpen || !rental) return null;
    const title = type === 'checkout' ? `Check-out: ${rental.equipamentos?.nome}` : `Check-in: ${rental.equipamentos?.nome}`;
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <form onSubmit={(e) => { e.preventDefault(); onClose(); }} className="space-y-4">
                <div>
                    <h4 className="font-semibold text-gray-700 mb-2">Checklist de Condição</h4>
                    <div className="space-y-1">
                        <label className="flex items-center"><input type="checkbox" className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded" /> <span className="ml-2 text-gray-600">Equipamento Limpo</span></label>
                        <label className="flex items-center"><input type="checkbox" className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded" /> <span className="ml-2 text-gray-600">Tanque de Combustível Cheio</span></label>
                        <label className="flex items-center"><input type="checkbox" className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded" /> <span className="ml-2 text-gray-600">Sem avarias visíveis</span></label>
                    </div>
                </div>
                <div>
                    <label htmlFor="meter" className="block text-sm font-medium text-gray-700">Horímetro</label>
                    <input type="number" id="meter" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" placeholder="Ex: 1250 horas" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Fotos do Equipamento</label>
                    <div className="mt-1 flex items-center justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                        <div className="space-y-1 text-center">
                           <CameraIcon className="mx-auto h-12 w-12 text-gray-400" />
                           <div className="flex text-sm text-gray-600">
                               <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-primary hover:text-primary-hover focus-within:outline-none">
                                   <span>Carregar uma foto</span>
                                   <input id="file-upload" name="file-upload" type="file" className="sr-only" />
                               </label>
                               <p className="pl-1">ou arraste e solte</p>
                           </div>
                           <p className="text-xs text-gray-500">PNG, JPG, GIF até 10MB</p>
                        </div>
                    </div>
                </div>
                 <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Observações</label>
                    <textarea id="notes" name="notes" rows={3} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" placeholder={type === 'checkout' ? "Ex: Cliente ciente sobre o uso correto." : "Ex: Equipamento retornou com pequeno arranhão."}></textarea>
                </div>
                <div className="mt-6 flex justify-end space-x-3 pt-4 border-t">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancelar</button>
                    <button type="submit" className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-hover">Confirmar {type === 'checkout' ? 'Check-out' : 'Check-in'}</button>
                </div>
            </form>
        </Modal>
    );
};

const getRentalStage = (rental: Locacao): OperationalRental['stage'] => {
    const today = new Date();
    today.setHours(0,0,0,0);
    const startDate = new Date(rental.data_inicio);
    const endDate = new Date(rental.data_fim);

    if (rental.status === StatusLocacao.CONCLUIDO) return 'done';
    if (rental.status === StatusLocacao.AGENDADO) return 'checkout';
    if (rental.status === StatusLocacao.ATIVO && today > endDate) return 'checkin';
    if (rental.status === StatusLocacao.ATRASADO) return 'checkin';
    return 'active';
};

const formatAddress = (address: Endereco | undefined | null) => {
    if (!address) return "Endereço não fornecido";
    return `${address.rua}, ${address.numero} - ${address.bairro}, ${address.cidade}`;
}

const RentalOperations: React.FC<{ profile: Profile }> = ({ profile }) => {
    const [operationalRentals, setOperationalRentals] = useState<OperationalRental[]>([]);
    const [logisticsEvents, setLogisticsEvents] = useState<LogisticsEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalState, setModalState] = useState<{isOpen: boolean; type: 'checkout' | 'checkin'; rental: OperationalRental | null}>({isOpen: false, type: 'checkout', rental: null});

    useEffect(() => {
        const fetchData = async () => {
            if (!profile.organization_id) return;
            setLoading(true);

            try {
                const [locacoesRes, motoristasRes, equipmentsRes, clientsRes, itemsRes] = await Promise.all([
                    supabase.from('locacoes').select('*').eq('organization_id', profile.organization_id).in('status', [StatusLocacao.AGENDADO, StatusLocacao.ATIVO, StatusLocacao.ATRASADO, StatusLocacao.CONCLUIDO]),
                    supabase.from('motoristas').select('*').eq('organization_id', profile.organization_id),
                    supabase.from('equipamentos').select('*').eq('organization_id', profile.organization_id),
                    supabase.from('clientes').select('*').eq('organization_id', profile.organization_id),
                    supabase.from('locacao_itens').select('*').eq('organization_id', profile.organization_id)
                ]);

                if (locacoesRes.error) throw locacoesRes.error;

                const driversMap = new Map<string, Motorista>((motoristasRes.data || []).map((d: any) => [d.id, d as Motorista]));
                const defaultDriver: Motorista = { id: 'default', nome: 'Não atribuído', vehicle: ''};

                // Manual Join
                const opRentals = (locacoesRes.data || []).map((r: any) => {
                     const item = (itemsRes.data || []).find((i: any) => i.locacao_id === r.id);
                     const equip = item ? (equipmentsRes.data || []).find((e: any) => e.id === item.equipamento_id) : null;
                     
                     const client = (clientsRes.data || []).find((c: any) => c.id === r.cliente_id);
                     return {
                        ...r,
                        equipamentos: equip || { nome: 'Equipamento Desconhecido' },
                        clientes: client || { nome_completo: 'N/A' },
                        stage: getRentalStage(r)
                     };
                }) as OperationalRental[];

                setOperationalRentals(opRentals);
                
                const logistics: LogisticsEvent[] = [];
                opRentals.forEach(r => {
                    const clientName = r.clientes?.nome_fantasia || r.clientes?.nome_completo || 'N/A';
                    const address = formatAddress(r.endereco_uso || r.clientes?.endereco);
                    const deliveryDriverId = r.responsavel_entrega_id;
                    const returnDriverId = r.responsavel_devolucao_id;

                    logistics.push({
                        id: `${r.id}-entrega`, type: 'Entrega', rentalId: r.id, clientName, address,
                        scheduledTime: new Date(r.data_inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit'}),
                        driver: (deliveryDriverId && driversMap.get(deliveryDriverId)) || defaultDriver,
                        status: 'Agendado'
                    });
                     logistics.push({
                        id: `${r.id}-coleta`, type: 'Coleta', rentalId: r.id, clientName, address,
                        scheduledTime: new Date(r.data_fim).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit'}),
                        driver: (returnDriverId && driversMap.get(returnDriverId)) || defaultDriver,
                        status: 'Agendado'
                    });
                });
                setLogisticsEvents(logistics);
            } catch (error) {
                console.error("Erro ao buscar dados operacionais:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [profile.organization_id]);


    const handleOpenModal = (type: 'checkout' | 'checkin', rental: OperationalRental) => {
        setModalState({isOpen: true, type, rental});
    };

    const handleCloseModal = () => {
        setModalState({isOpen: false, type: 'checkout', rental: null});
    };
    
    const rentalsByStage = useMemo(() => {
        return operationalRentals.reduce((acc, rental) => {
            acc[rental.stage] = [...(acc[rental.stage] || []), rental];
            return acc;
        }, {} as Record<OperationalRental['stage'], OperationalRental[]>);
    }, [operationalRentals]);
    
    const stages: {id: OperationalRental['stage'], title: string}[] = [
        {id: 'checkout', title: 'Aguardando Check-out'},
        {id: 'active', title: 'Locações Ativas'},
        {id: 'checkin', title: 'Aguardando Check-in'},
        {id: 'done', title: 'Concluídas'},
    ];
    
    if (loading) {
        return <div className="flex justify-center items-center h-full"><SpinnerIcon className="w-10 h-10 text-primary" /></div>;
    }
    
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-md">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Agenda de Logística</h3>
                    <div className="max-h-96 overflow-y-auto space-y-4">
                       {logisticsEvents.length > 0 ? logisticsEvents.map(event => (
                           <div key={event.id} className="p-3 bg-gray-50 rounded-lg flex items-start gap-4">
                                <div className="flex-shrink-0">
                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${event.type === 'Entrega' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
                                        <TruckIcon className={`w-6 h-6 ${event.type === 'Coleta' ? 'transform -scale-x-100' : ''}`} />
                                    </div>
                                    <p className="text-center font-bold text-gray-700 mt-1">{event.scheduledTime}</p>
                                </div>
                               <div>
                                   <p className="font-semibold text-gray-800">{event.type} - {event.clientName}</p>
                                   <p className="text-sm text-gray-600 flex items-center gap-1"><MapPinIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />{event.address}</p>
                                   <p className="text-sm text-gray-500 mt-1">Motorista: {event.driver.nome}</p>
                               </div>
                           </div>
                       )) : <p className="text-gray-500 text-center py-8">Nenhuma operação logística agendada.</p>}
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-md">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Mapa de Operações</h3>
                    <div className="h-96 bg-gray-200 rounded-lg flex items-center justify-center">
                        <p className="text-gray-500">Integração com mapa em desenvolvimento</p>
                    </div>
                </div>
            </div>

            <div className="w-full overflow-x-auto">
                <div className="inline-grid grid-cols-4 gap-6 min-w-max p-1">
                    {stages.map(stage => (
                        <div key={stage.id} className="w-80 bg-gray-100 rounded-lg p-3">
                            <h3 className="font-semibold text-gray-700 mb-4 px-2">{stage.title} ({rentalsByStage[stage.id]?.length || 0})</h3>
                            <div className="space-y-3">
                                {(rentalsByStage[stage.id] || []).map(rental => (
                                    <RentalCard key={rental.id} rental={rental} onOpenModal={handleOpenModal} />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            
            <CheckInOutModal
                isOpen={modalState.isOpen}
                onClose={handleCloseModal}
                type={modalState.type}
                rental={modalState.rental}
            />
        </div>
    );
};

export default RentalOperations;
