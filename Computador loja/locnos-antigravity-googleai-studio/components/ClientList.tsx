import React, { useState, useMemo } from 'react';
import { Cliente, TipoCliente, Locacao, Profile } from '../types';
import { PlusIcon, SearchIcon, ExclamationTriangleIcon, UploadIcon, SpinnerIcon } from './Icons';
import Toast from './Toast';
import SortableHeader from './SortableHeader';
import ClientImportModal from './ClientImportModal';
import ClientFormModal, { ClientFormData } from './ClientFormModal';
import { supabase } from '../supabaseClient';
import { useClients } from '../hooks/useClients';
import Pagination from './Pagination';

type SortKeys = 'name' | 'total_locacoes' | 'cliente_desde';

const ClientList: React.FC<{ profile: Profile }> = ({ profile }) => {
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const { clients, loading, refreshClients, totalCount, totalPages } = useClients(profile.organization_id, page, pageSize);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Cliente | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: SortKeys; direction: 'ascending' | 'descending' } | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [clientRentals, setClientRentals] = useState<Locacao[]>([]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleOpenModal = async (client: Cliente | null = null) => {
    setEditingClient(client);
    if (client) {
      const { data: rentalsData, error } = await supabase
        .from('locacoes')
        .select('*')
        .eq('cliente_id', client.id);

      if (error) {
        console.error("Error fetching client rentals", error);
        setClientRentals([]);
      } else if (rentalsData) {
        const rentalIds = rentalsData.map(r => r.id);
        const { data: itemsData } = await supabase.from('locacao_itens').select('*').in('locacao_id', rentalIds);
        const equipmentIds = itemsData ? itemsData.map(i => i.equipamento_id) : [];
        const { data: equipmentsData } = await supabase.from('equipamentos').select('id, nome').in('id', equipmentIds);

        const joinedRentals = rentalsData.map((r: any) => {
          const item = itemsData?.find(i => i.locacao_id === r.id);
          const equip = item ? equipmentsData?.find(e => e.id === item.equipamento_id) : null;
          return {
            ...r,
            equipamentos: equip || { nome: 'N/A' }
          };
        });

        setClientRentals(joinedRentals as Locacao[]);
      }
    } else {
      setClientRentals([]);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingClient(null);
    setIsModalOpen(false);
    setClientRentals([]);
  };

  const handleSaveClient = async (clientData: ClientFormData) => {
    if (editingClient) {
      const { error } = await supabase.from('clientes').update(clientData).eq('id', editingClient.id);
      if (error) {
        setToast({ message: `Erro ao atualizar cliente: ${error.message}`, type: 'error' });
      } else {
        setToast({ message: 'Cliente atualizado com sucesso!', type: 'success' });
        refreshClients();
      }
    } else {
      const { error } = await supabase.from('clientes').insert([{ ...clientData, organization_id: profile.organization_id }]);
      if (error) {
        setToast({ message: `Erro ao cadastrar cliente: ${error.message}`, type: 'error' });
      } else {
        setToast({ message: 'Cliente cadastrado com sucesso!', type: 'success' });
        refreshClients();
      }
    }
    handleCloseModal();
  };

  const handleImportSave = (newClientsData: any[]) => {
    setToast({ message: `${newClientsData.length} clientes importados com sucesso!`, type: 'success' });
    setIsImportModalOpen(false);
    refreshClients();
  };

  const handleDeleteClient = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este cliente?')) {
      const { error } = await supabase.from('clientes').delete().eq('id', id);
      if (error) {
        setToast({ message: `Erro ao excluir cliente: ${error.message}`, type: 'error' });
      } else {
        setToast({ message: 'Cliente excluído.', type: 'success' });
        refreshClients();
      }
    }
  };

  const sortedAndFilteredClients = useMemo(() => {
    let filtered = clients.filter(c => {
      const clientName = (c.tipo === TipoCliente.PESSOA_FISICA ? c.nome_completo : c.nome_fantasia) || '';
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      const numericSearchTerm = searchTerm.replace(/\D/g, '');

      const nameMatch = clientName.toLowerCase().includes(lowerCaseSearchTerm);
      const documentMatch = numericSearchTerm ? c.documento.replace(/\D/g, '').includes(numericSearchTerm) : false;
      const phoneMatch = numericSearchTerm ? c.telefone.replace(/\D/g, '').includes(numericSearchTerm) : false;

      return nameMatch || documentMatch || phoneMatch;
    });

    if (sortConfig !== null) {
      filtered.sort((a, b) => {
        const key = sortConfig.key;
        let valA, valB;

        if (key === 'name') {
          valA = a.tipo === TipoCliente.PESSOA_FISICA ? a.nome_completo : a.nome_fantasia;
          valB = b.tipo === TipoCliente.PESSOA_FISICA ? b.nome_completo : b.nome_fantasia;
        } else {
          valA = a[key as keyof Cliente];
          valB = b[key as keyof Cliente];
        }

        if (!valA || !valB) return 0;

        if (valA < valB) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }
    return filtered;
  }, [clients, searchTerm, sortConfig]);

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
          <div className="w-full sm:w-auto">
            <h3 className="text-xl font-semibold text-gray-800">Cadastro de Clientes</h3>
          </div>
          <div className="w-full sm:w-auto flex flex-col sm:flex-row items-center gap-4">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3"><SearchIcon /></span>
              <input type="text" placeholder="Buscar por nome, documento ou telefone..." onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <button onClick={() => setIsImportModalOpen(true)} className="flex items-center justify-center bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors shadow-sm">
              <UploadIcon className="w-5 h-5 mr-2" />
              Importar
            </button>
            <button onClick={() => handleOpenModal()} className="flex items-center justify-center bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-hover transition-colors">
              <PlusIcon className="w-5 h-5 mr-2" />
              Novo Cliente
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3"><SortableHeader label="Nome / Razão Social" sortKey="name" requestSort={requestSort} sortConfig={sortConfig} /></th>
                <th scope="col" className="px-6 py-3">Contato</th>
                <th scope="col" className="px-6 py-3 text-center"><SortableHeader label="Locações" sortKey="total_locacoes" requestSort={requestSort} sortConfig={sortConfig} /></th>
                <th scope="col" className="px-6 py-3"><SortableHeader label="Cliente Desde" sortKey="cliente_desde" requestSort={requestSort} sortConfig={sortConfig} /></th>
                <th scope="col" className="px-6 py-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="text-center py-8"><SpinnerIcon className="mx-auto w-8 h-8" /></td></tr>
              ) : sortedAndFilteredClients.map((client) => {
                const clientName = client.tipo === TipoCliente.PESSOA_FISICA ? client.nome_completo : client.nome_fantasia;
                return (
                  <tr key={client.id} className="bg-white border-b hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">
                      <div className="flex items-center">
                        {client.inadimplente && <ExclamationTriangleIcon className="w-5 h-5 text-red-500 mr-2 flex-shrink-0" title="Cliente inadimplente" />}
                        <span className="truncate">{clientName}</span>
                      </div>
                      <div className="text-xs text-gray-500">{client.tipo} - {client.documento}</div>
                    </td>
                    <td className="px-6 py-4">{client.email}<br /><span className="text-xs text-gray-500">{client.telefone}</span></td>
                    <td className="px-6 py-4 text-center font-medium">{client.total_locacoes}</td>
                    <td className="px-6 py-4">{new Date(client.cliente_desde).toLocaleDateString('pt-BR')}</td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-3">
                        <button onClick={() => handleOpenModal(client)} className="text-primary hover:underline font-medium whitespace-nowrap">Editar / Detalhes</button>
                        <button onClick={() => handleDeleteClient(client.id)} className="text-red-600 hover:underline font-medium whitespace-nowrap">Excluir</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            totalCount={totalCount}
            itemsPerPage={pageSize}
          />
        </div>
        <ClientFormModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSave={handleSaveClient}
          client={editingClient}
          setToast={setToast}
          clientRentals={clientRentals}
        />
        <ClientImportModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          onSave={handleImportSave}
          setToast={setToast}
        />
      </div>
    </>
  );
};

export default ClientList;