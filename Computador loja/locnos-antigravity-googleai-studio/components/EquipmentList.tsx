import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Equipamento, StatusEquipamento, PeriodoLocacao, ModeloContrato, Profile } from '../types';
import { PlusIcon, SearchIcon, TrashIcon, ExclamationTriangleIcon, UploadIcon, PhotoIcon, SpinnerIcon } from './Icons';
import Modal from './Modal';
import Toast from './Toast';
import SortableHeader from './SortableHeader';
import EquipmentImportModal from './EquipmentImportModal';
import { supabase } from '../supabaseClient';
import { useEquipments } from '../hooks/useEquipments';
import Pagination from './Pagination';

type SortKeys = keyof Equipamento | 'minPrice' | 'availability';

const getStatusBadgeClass = (status: StatusEquipamento) => {
  switch (status) {
    case StatusEquipamento.DISPONIVEL: return 'bg-green-100 text-green-800';
    case StatusEquipamento.ALUGADO: return 'bg-blue-100 text-blue-800';
    case StatusEquipamento.MANUTENCAO: return 'bg-yellow-100 text-yellow-800';
    case StatusEquipamento.RESERVADO: return 'bg-purple-100 text-purple-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const EquipmentImage = ({ src, alt }: { src: string | null | undefined, alt: string }) => {
  const [error, setError] = useState(false);

  if (error || !src) {
    return (
      <div className="w-10 h-10 rounded-md bg-gray-100 flex items-center justify-center mr-4 border border-gray-200">
        <PhotoIcon className="w-5 h-5 text-gray-400" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className="w-10 h-10 rounded-md object-cover mr-4 border border-gray-200"
      onError={() => setError(true)}
    />
  );
};

type EquipmentFormData = Omit<Equipamento, 'id' | 'quantidade_alugada' | 'criado_em' | 'organization_id'>;

const EquipmentList: React.FC<{ profile: Profile }> = ({ profile }) => {
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const { equipments, loading, refreshEquipments, totalCount, totalPages } = useEquipments(profile.organization_id, page, pageSize);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipamento | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: SortKeys; direction: 'ascending' | 'descending' } | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [filterStatus, setFilterStatus] = useState<StatusEquipamento | 'all'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const lowStockThreshold = useMemo(() => {
    const saved = localStorage.getItem('lowStockThreshold');
    return saved ? parseInt(saved, 10) : 3;
  }, []);

  const categories = useMemo(() => {
    return [...new Set(equipments.map(eq => eq.categoria))];
  }, [equipments]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleOpenModal = (equipment: Equipamento | null = null) => {
    setEditingEquipment(equipment);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingEquipment(null);
    setIsModalOpen(false);
  };

  const handleImportSave = (newEquipmentsData: any[]) => {
    setToast({ message: `${newEquipmentsData.length} equipamentos importados com sucesso!`, type: 'success' });
    setIsImportModalOpen(false);
    refreshEquipments();
  };

  const handleSaveEquipment = async (equipmentData: EquipmentFormData) => {
    let resultError = null;

    if (editingEquipment) {
      const { error } = await supabase.from('equipamentos').update(equipmentData).eq('id', editingEquipment.id);
      resultError = error;
      if (!error) {
        setToast({ message: 'Equipamento atualizado com sucesso!', type: 'success' });
      }
    } else {
      const { error } = await supabase.from('equipamentos').insert([{ ...equipmentData, organization_id: profile.organization_id }]);
      resultError = error;
      if (!error) {
        setToast({ message: 'Equipamento adicionado com sucesso!', type: 'success' });
      }
    }

    if (resultError) {
      console.error(resultError);
      if (resultError.message.includes('row-level security')) {
        setToast({ message: `Erro de Permissão (RLS): Verifique se você rodou o script SQL de permissões no Supabase.`, type: 'error' });
      } else {
        setToast({ message: `Erro ao salvar equipamento: ${resultError.message}`, type: 'error' });
      }
    } else {
      refreshEquipments();
      handleCloseModal();
    }
  };

  const handleDeleteEquipment = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este equipamento?')) {
      const { error } = await supabase.from('equipamentos').delete().eq('id', id);
      if (error) {
        setToast({ message: `Erro ao excluir equipamento: ${error.message}`, type: 'error' });
      } else {
        setToast({ message: 'Equipamento excluído.', type: 'success' });
        refreshEquipments();
      }
    }
  };

  const sortedAndFilteredEquipments = useMemo(() => {
    let filtered = equipments.filter(eq => {
      const matchesSearch =
        eq.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        eq.categoria.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = filterStatus === 'all' || eq.status === filterStatus;

      const matchesCategory = filterCategory === 'all' || eq.categoria === filterCategory;

      return matchesSearch && matchesStatus && matchesCategory;
    });

    if (sortConfig !== null) {
      filtered.sort((a, b) => {
        const key = sortConfig.key;
        let valA, valB;

        if (key === 'minPrice') {
          valA = a.periodos_locacao?.length > 0 ? Math.min(...a.periodos_locacao.map(p => p.preco)) : Infinity;
          valB = b.periodos_locacao?.length > 0 ? Math.min(...b.periodos_locacao.map(p => p.preco)) : Infinity;
        } else if (key === 'availability') {
          valA = a.quantidade_total - a.quantidade_alugada;
          valB = b.quantidade_total - b.quantidade_alugada;
        } else {
          valA = a[key as keyof Equipamento];
          valB = b[key as keyof Equipamento];
        }

        if (valA === undefined || valA === null) valA = '';
        if (valB === undefined || valB === null) valB = '';

        if (valA < valB) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }
    return filtered;
  }, [equipments, searchTerm, sortConfig, filterStatus, filterCategory]);

  const requestSort = (key: SortKeys) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const filterOptions: { label: string; value: StatusEquipamento | 'all'; activeClass: string }[] = [
    { label: 'Todos', value: 'all', activeClass: 'bg-primary text-white' },
    { label: StatusEquipamento.DISPONIVEL, value: StatusEquipamento.DISPONIVEL, activeClass: 'bg-green-500 text-white' },
    { label: StatusEquipamento.ALUGADO, value: StatusEquipamento.ALUGADO, activeClass: 'bg-blue-500 text-white' },
    { label: StatusEquipamento.MANUTENCAO, value: StatusEquipamento.MANUTENCAO, activeClass: 'bg-yellow-500 text-white' },
    { label: StatusEquipamento.RESERVADO, value: StatusEquipamento.RESERVADO, activeClass: 'bg-purple-500 text-white' },
  ];

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div className="bg-white p-6 rounded-xl shadow-md">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-4 gap-4">
          <div className="w-full sm:w-auto">
            <h3 className="text-xl font-semibold text-gray-800">Acervo de Equipamentos</h3>
          </div>
          <div className="w-full sm:w-auto flex flex-col sm:flex-row items-center gap-4">
            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              className="w-full sm:w-auto pl-3 pr-10 py-2 border rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary"
              aria-label="Filtrar por categoria"
            >
              <option value="all">Todas as Categorias</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3"><SearchIcon /></span>
              <input type="text" placeholder="Buscar..." onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <button onClick={() => setIsImportModalOpen(true)} className="flex items-center justify-center bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors shadow-sm">
              <UploadIcon className="w-5 h-5 mr-2" />
              Importar
            </button>
            <button onClick={() => handleOpenModal()} className="flex items-center justify-center bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-hover transition-colors">
              <PlusIcon className="w-5 h-5 mr-2" />
              Adicionar
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-6 pb-4 border-b">
          <span className="text-sm font-medium text-gray-600 mr-2">Filtrar por status:</span>
          {filterOptions.map(option => (
            <button
              key={option.value}
              onClick={() => setFilterStatus(option.value)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-colors ${filterStatus === option.value ? option.activeClass : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3"><SortableHeader label="Equipamento" sortKey="nome" requestSort={requestSort} sortConfig={sortConfig} /></th>
                <th scope="col" className="px-6 py-3"><SortableHeader label="Categoria" sortKey="categoria" requestSort={requestSort} sortConfig={sortConfig} /></th>
                <th scope="col" className="px-6 py-3"><SortableHeader label="Disponibilidade" sortKey="availability" requestSort={requestSort} sortConfig={sortConfig} /></th>
                <th scope="col" className="px-6 py-3"><SortableHeader label="Status" sortKey="status" requestSort={requestSort} sortConfig={sortConfig} /></th>
                <th scope="col" className="px-6 py-3"><SortableHeader label="Preços a partir de (R$)" sortKey="minPrice" requestSort={requestSort} sortConfig={sortConfig} /></th>
                <th scope="col" className="px-6 py-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="text-center py-8"><SpinnerIcon className="mx-auto w-8 h-8" /></td></tr>
              ) : sortedAndFilteredEquipments.map((eq) => {
                const availability = eq.quantidade_total - eq.quantidade_alugada;
                const isLowStock = availability <= lowStockThreshold;
                return (
                  <tr key={eq.id} className="bg-white border-b hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                      <div className="flex items-center">
                        <EquipmentImage src={eq.url_imagem} alt={eq.nome} />
                        <span>{eq.nome}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">{eq.categoria}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 font-medium">
                        <span className={isLowStock ? 'text-red-600 font-bold' : 'text-green-600'}>
                          {availability}
                        </span>
                        <span>/ {eq.quantidade_total}</span>
                        {isLowStock && <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" title="Estoque baixo!" />}
                      </div>
                    </td>
                    <td className="px-6 py-4"><span className={`px-2 py-1 font-semibold leading-tight rounded-full text-xs ${getStatusBadgeClass(eq.status)}`}>{eq.status}</span></td>
                    <td className="px-6 py-4">{eq.periodos_locacao?.length > 0 ? Math.min(...eq.periodos_locacao.map(p => p.preco)).toFixed(2).replace('.', ',') : 'N/A'}</td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2"><button onClick={() => handleOpenModal(eq)} className="text-primary hover:underline font-medium">Editar</button><button onClick={() => handleDeleteEquipment(eq.id)} className="text-red-600 hover:underline font-medium">Excluir</button></div>
                    </td>
                  </tr>
                );
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
        <EquipmentFormModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSave={handleSaveEquipment}
          equipment={editingEquipment}
          setToast={setToast}
          organizationId={profile.organization_id}
        />
        <EquipmentImportModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          onSave={handleImportSave}
          setToast={setToast}
        />
      </div>
    </>
  );
};

const EquipmentFormModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: EquipmentFormData) => void;
  equipment: Equipamento | null;
  setToast: (toast: { message: string; type: 'success' | 'error' } | null) => void;
  organizationId: string;
}> = ({ isOpen, onClose, onSave, equipment, setToast, organizationId }) => {
  const [formState, setFormState] = useState({
    nome: '', categoria: '', sub_categoria: '', marca: '', valor_compra: '', quantidade_total: '', caucao_sugerida: '', valor_venda: '', status: StatusEquipamento.DISPONIVEL, modelo_contrato_id: '', descricao: ''
  });
  const [periods, setPeriods] = useState<Partial<PeriodoLocacao>[]>([{ descricao: '', dias: 1, preco: 0 }]);
  const [specs, setSpecs] = useState<{ chave: string; valor: string; }[]>([{ chave: '', valor: '' }]);
  const [links, setLinks] = useState<string[]>(['']);
  const [templates, setTemplates] = useState<ModeloContrato[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      const fetchTemplates = async () => {
        const { data, error } = await supabase.from('modelos_contrato').select('*');
        if (data) setTemplates(data);
      };
      fetchTemplates();
    }
  }, [isOpen]);

  React.useEffect(() => {
    if (equipment) {
      setFormState({
        nome: equipment.nome,
        categoria: equipment.categoria,
        sub_categoria: equipment.sub_categoria,
        marca: equipment.marca,
        valor_compra: String(equipment.valor_compra),
        quantidade_total: String(equipment.quantidade_total),
        caucao_sugerida: equipment.caucao_sugerida ? String(equipment.caucao_sugerida) : '',
        valor_venda: equipment.valor_venda ? String(equipment.valor_venda) : '',
        status: equipment.status,
        modelo_contrato_id: equipment.modelo_contrato_id || '',
        descricao: equipment.descricao || '',
      });
      setPeriods(equipment.periodos_locacao?.length > 0 ? equipment.periodos_locacao : [{ descricao: '', dias: 1, preco: 0 }]);
      setSpecs(equipment.especificacoes?.length > 0 ? equipment.especificacoes : [{ chave: '', valor: '' }]);
      setLinks(equipment.links_externos?.length > 0 ? equipment.links_externos : ['']);
      setImagePreview(equipment.url_imagem);
    } else {
      setFormState({
        nome: '', categoria: '', sub_categoria: '', marca: '', valor_compra: '', quantidade_total: '',
        caucao_sugerida: '', valor_venda: '', status: StatusEquipamento.DISPONIVEL, modelo_contrato_id: '', descricao: ''
      });
      setPeriods([{ descricao: '', dias: 1, preco: 0 }]);
      setSpecs([{ chave: '', valor: '' }]);
      setLinks(['']);
      setImagePreview(null);
    }
    setImageFile(null);
    setIsUploading(false);
  }, [equipment, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormState({ ...formState, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setToast({ message: 'Por favor, selecione um arquivo de imagem válido.', type: 'error' });
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setToast({ message: 'A imagem é muito grande. Por favor, use uma imagem menor que 5MB.', type: 'error' });
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDynamicListChange = <T,>(index: number, e: React.ChangeEvent<HTMLInputElement>, list: T[], setList: React.Dispatch<React.SetStateAction<T[]>>) => {
    const newList = [...list];
    const field = e.target.name as keyof T;
    (newList[index] as any)[field] = e.target.value;
    setList(newList as any);
  };

  const handleAddDynamicListItem = <T,>(setList: React.Dispatch<React.SetStateAction<T[]>>, newItem: T) => {
    setList(prev => [...prev, newItem]);
  };

  const handleRemoveDynamicListItem = <T,>(index: number, list: T[], setList: React.Dispatch<React.SetStateAction<T[]>>) => {
    if (list.length <= 1) return;
    setList(list.filter((_, i) => i !== index));
  };

  const handleLinkChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const newLinks = [...links];
    newLinks[index] = e.target.value;
    setLinks(newLinks);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);

    let imageUrl = equipment?.url_imagem || '';

    if (imageFile) {
      const sanitizedFileName = imageFile.name.replace(/[^a-zA-Z0-9.]/g, '_').toLowerCase();
      const timestamp = Date.now();
      const filePath = `${organizationId}/${timestamp}-${sanitizedFileName}`;

      const { data, error: uploadError } = await supabase.storage
        .from('imagens-equipamentos')
        .upload(filePath, imageFile, {
          upsert: false
        });

      if (uploadError) {
        console.error("Erro upload:", uploadError);
        if (uploadError.message.includes('Bucket not found') || uploadError.message.includes('violates row-level security')) {
          setToast({ message: `Erro de Permissão de Armazenamento. Verifique se o script SQL de Storage foi executado.`, type: 'error' });
        } else {
          setToast({ message: `Erro ao enviar imagem: ${uploadError.message}. Tente novamente.`, type: 'error' });
        }
        setIsUploading(false);
        return;
      } else {
        const { data: publicUrlData } = supabase.storage.from('imagens-equipamentos').getPublicUrl(filePath);
        imageUrl = publicUrlData.publicUrl;

        if (equipment?.url_imagem) {
          try {
            const urlObj = new URL(equipment.url_imagem);
            const pathParts = urlObj.pathname.split('/imagens-equipamentos/');
            if (pathParts.length > 1) {
              const oldFilePath = decodeURIComponent(pathParts[1]);
              await supabase.storage.from('imagens-equipamentos').remove([oldFilePath]);
            }
          } catch (error) {
            console.warn("Não foi possível remover a imagem antiga (não crítico):", error);
          }
        }
      }
    }

    const equipmentData = {
      nome: formState.nome,
      categoria: formState.categoria,
      sub_categoria: formState.sub_categoria,
      marca: formState.marca,
      valor_compra: parseFloat(formState.valor_compra),
      quantidade_total: parseInt(formState.quantidade_total, 10),
      url_imagem: imageUrl,
      descricao: formState.descricao,
      especificacoes: specs.filter(s => s.chave && s.valor),
      links_externos: links.filter(l => l),
      periodos_locacao: periods
        .filter(p => p.descricao && p.dias && p.dias > 0 && p.preco != null)
        .map(p => ({
          id: p.id || `p${Date.now()}${Math.floor(Math.random() * 1000)}`,
          descricao: p.descricao!,
          dias: Number(p.dias),
          preco: Number(p.preco)
        })),
      caucao_sugerida: formState.caucao_sugerida ? parseFloat(formState.caucao_sugerida) : undefined,
      valor_venda: formState.valor_venda ? parseFloat(formState.valor_venda) : undefined,
      status: formState.status,
      modelo_contrato_id: formState.modelo_contrato_id || undefined,
    };
    onSave(equipmentData as EquipmentFormData);
    setIsUploading(false);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={equipment ? "Editar Equipamento" : "Adicionar Novo Equipamento"}>
      <form onSubmit={handleSubmit} className="max-h-[75vh] overflow-y-auto p-1 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 space-y-3">
            <h4 className="text-md font-semibold text-gray-600">Imagem do Equipamento</h4>
            <div className="w-full aspect-square bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden border border-gray-200">
              {imagePreview ? (
                <img src={imagePreview} alt="Pré-visualização" className="w-full h-full object-cover" />
              ) : (
                <PhotoIcon className="w-16 h-16 text-gray-300" />
              )}
            </div>
            <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
            <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full flex items-center justify-center bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors shadow-sm text-sm">
              <UploadIcon className="w-4 h-4 mr-2" />
              Carregar Imagem
            </button>
            <p className="text-xs text-gray-400 text-center">Max: 5MB. JPG, PNG.</p>
          </div>
          <div className="md:col-span-2 space-y-4">
            <h4 className="text-md font-semibold text-gray-600 border-b pb-2">Informações Gerais</h4>
            <div><label htmlFor="nome" className="block text-sm font-medium text-gray-700">Nome</label><input type="text" id="nome" name="nome" value={formState.nome} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" required /></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label htmlFor="categoria" className="block text-sm font-medium text-gray-700">Categoria</label><input type="text" id="categoria" name="categoria" value={formState.categoria} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" required /></div>
              <div><label htmlFor="sub_categoria" className="block text-sm font-medium text-gray-700">Subcategoria</label><input type="text" id="sub_categoria" name="sub_categoria" value={formState.sub_categoria} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" required /></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label htmlFor="marca" className="block text-sm font-medium text-gray-700">Marca</label><input type="text" id="marca" name="marca" value={formState.marca} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" required /></div>
              <div><label htmlFor="valor_compra" className="block text-sm font-medium text-gray-700">Valor de Compra (R$)</label><input type="number" id="valor_compra" name="valor_compra" value={formState.valor_compra} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" min="0" step="0.01" required /></div>
            </div>
            <div><label htmlFor="quantidade_total" className="block text-sm font-medium text-gray-700">Quantidade Total</label><input type="number" id="quantidade_total" name="quantidade_total" value={formState.quantidade_total} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" min="0" step="1" required /></div>
          </div>
        </div>

        <div>
          <h4 className="text-md font-semibold text-gray-600 mb-3 border-b pb-2">Descrição Detalhada</h4>
          <textarea id="descricao" name="descricao" value={formState.descricao} onChange={handleChange} rows={4} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" placeholder="Descreva o equipamento, seus usos, vantagens, etc."></textarea>
        </div>

        <div>
          <h4 className="text-md font-semibold text-gray-600 mb-3 border-b pb-2">Especificações Técnicas</h4>
          <div className="space-y-2">
            {specs.map((spec, index) => (
              <div key={index} className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-5"><label className="block text-xs font-medium text-gray-600">Característica</label><input type="text" name="chave" value={spec.chave} onChange={(e) => handleDynamicListChange(index, e, specs, setSpecs)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" placeholder="Ex: Peso" /></div>
                <div className="col-span-6"><label className="block text-xs font-medium text-gray-600">Valor</label><input type="text" name="valor" value={spec.valor} onChange={(e) => handleDynamicListChange(index, e, specs, setSpecs)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" placeholder="Ex: 150 kg" /></div>
                <div className="col-span-1"><button type="button" onClick={() => handleRemoveDynamicListItem(index, specs, setSpecs)} disabled={specs.length <= 1} className="p-2 text-red-500 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"><TrashIcon className="w-4 h-4" /></button></div>
              </div>
            ))}
          </div>
          <button type="button" onClick={() => handleAddDynamicListItem(setSpecs, { chave: '', valor: '' })} className="mt-2 flex items-center text-sm font-medium text-primary hover:underline"><PlusIcon className="w-4 h-4 mr-1" />Adicionar Especificação</button>
        </div>

        <div>
          <h4 className="text-md font-semibold text-gray-600 mb-3 border-b pb-2">Períodos de Locação</h4>
          <div className="space-y-2">
            {periods.map((period, index) => (
              <div key={index} className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-5"><label className="block text-xs font-medium text-gray-600">Descrição</label><input type="text" name="descricao" value={period.descricao} onChange={(e) => handleDynamicListChange(index, e, periods, setPeriods)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm" placeholder="Ex: Diária" required /></div>
                <div className="col-span-3"><label className="block text-xs font-medium text-gray-600">Dias</label><input type="number" name="dias" value={period.dias} onChange={(e) => handleDynamicListChange(index, e, periods, setPeriods)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm" min="1" step="1" required /></div>
                <div className="col-span-3"><label className="block text-xs font-medium text-gray-600">Valor (R$)</label><input type="number" name="preco" value={period.preco} onChange={(e) => handleDynamicListChange(index, e, periods, setPeriods)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm" min="0" step="0.01" required /></div>
                <div className="col-span-1"><button type="button" onClick={() => handleRemoveDynamicListItem(index, periods, setPeriods)} disabled={periods.length <= 1} className="p-2 text-red-500 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"><TrashIcon className="w-4 h-4" /></button></div>
              </div>
            ))}
          </div>
          <button type="button" onClick={() => handleAddDynamicListItem(setPeriods, { descricao: '', dias: 1, preco: 0 })} className="mt-2 flex items-center text-sm font-medium text-primary hover:underline"><PlusIcon className="w-4 h-4 mr-1" />Adicionar Período</button>
        </div>

        <div>
          <h4 className="text-md font-semibold text-gray-600 mb-3 border-b pb-2">Mídia Externa (Vídeos / Manuais)</h4>
          <div className="space-y-2">
            {links.map((link, index) => (
              <div key={index} className="flex items-center gap-2">
                <input type="url" value={link} onChange={(e) => handleLinkChange(index, e)} className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" placeholder="https://www.youtube.com/watch?v=..." />
                <button type="button" onClick={() => handleRemoveDynamicListItem(index, links, setLinks)} disabled={links.length <= 1} className="p-2 text-red-500 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"><TrashIcon className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
          <button type="button" onClick={() => setLinks(prev => [...prev, ''])} className="mt-2 flex items-center text-sm font-medium text-primary hover:underline"><PlusIcon className="w-4 h-4 mr-1" />Adicionar Link</button>
        </div>


        <div>
          <h4 className="text-md font-semibold text-gray-600 mb-3 border-b pb-2">Valores Adicionais (Opcional)</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label htmlFor="caucao_sugerida" className="block text-sm font-medium text-gray-700">Caução Recomendada (R$)</label><input type="number" id="caucao_sugerida" name="caucao_sugerida" value={formState.caucao_sugerida} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" min="0" step="0.01" /></div>
            <div><label htmlFor="valor_venda" className="block text-sm font-medium text-gray-700">Valor de Venda (R$)</label><input type="number" id="valor_venda" name="valor_venda" value={formState.valor_venda} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" min="0" step="0.01" /></div>
          </div>
        </div>

        <div>
          <h4 className="text-md font-semibold text-gray-600 mb-3 border-b pb-2">Configurações Avançadas</h4>
          <div>
            <label htmlFor="modelo_contrato_id" className="block text-sm font-medium text-gray-700">Modelo de Contrato Padrão</label>
            <select id="modelo_contrato_id" name="modelo_contrato_id" value={formState.modelo_contrato_id} onChange={handleChange} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md">
              <option value="">Nenhum</option>
              {templates.map(template => (
                <option key={template.id} value={template.id}>{template.nome}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-6 flex justify-end space-x-3 pt-4 border-t">
          <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancelar</button>
          <button type="submit" className="flex items-center justify-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-hover disabled:bg-gray-400" disabled={isUploading}>
            {isUploading && <SpinnerIcon className="w-5 h-5 mr-2" />}
            {isUploading ? 'Enviando...' : 'Salvar'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default EquipmentList;
