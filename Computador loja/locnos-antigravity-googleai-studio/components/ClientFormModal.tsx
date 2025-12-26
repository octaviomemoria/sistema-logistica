
import React, { useState, useEffect } from 'react';
import { Cliente, TipoCliente, ReferenciaContato, DocumentoCliente, Locacao, StatusLocacao, Profile } from '../types';
import { PlusIcon, TrashIcon, UploadIcon, PaperClipIcon, SpinnerIcon, ExclamationTriangleIcon } from './Icons';
import Modal from './Modal';
import Toast from './Toast';

// Definindo o tipo de dados do formulário exportável para uso em outros componentes
export type ClientFormData = Omit<Cliente, 'id' | 'total_locacoes' | 'cliente_desde' | 'organization_id'>;

interface ClientFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: ClientFormData) => Promise<void>;
    client: Cliente | null;
    clientRentals?: Locacao[];
    setToast?: (toast: { message: string; type: 'success' | 'error' } | null) => void;
}

const getRentalStatusClass = (status: StatusLocacao) => {
  switch (status) {
    case StatusLocacao.ATIVO: return 'bg-green-100 text-green-800';
    case StatusLocacao.CONCLUIDO: return 'bg-blue-100 text-blue-800';
    case StatusLocacao.ATRASADO: return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

// --- Funções de Máscara e Validação ---

const maskCPF = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1');
};

const maskCNPJ = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1');
};

const maskPhone = (value: string) => {
  let r = value.replace(/\D/g, "");
  r = r.replace(/^0/, "");
  if (r.length > 10) {
    r = r.replace(/^(\d\d)(\d{5})(\d{4}).*/, "($1) $2-$3");
  } else if (r.length > 5) {
    r = r.replace(/^(\d\d)(\d{4})(\d{0,4}).*/, "($1) $2-$3");
  } else if (r.length > 2) {
    r = r.replace(/^(\d\d)(\d{0,5})/, "($1) $2");
  } else {
    r = r.replace(/^(\d*)/, "($1");
  }
  return r;
};

const maskCEP = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/^(\d{5})(\d)/, '$1-$2')
    .replace(/(-\d{3})\d+?$/, '$1');
};

const validateCPF = (cpf: string): boolean => {
    cpf = cpf.replace(/[^\d]+/g, '');
    if (cpf === '' || cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
    let add = 0;
    for (let i = 0; i < 9; i++) add += parseInt(cpf.charAt(i)) * (10 - i);
    let rev = 11 - (add % 11);
    if (rev === 10 || rev === 11) rev = 0;
    if (rev !== parseInt(cpf.charAt(9))) return false;
    add = 0;
    for (let i = 0; i < 10; i++) add += parseInt(cpf.charAt(i)) * (11 - i);
    rev = 11 - (add % 11);
    if (rev === 10 || rev === 11) rev = 0;
    if (rev !== parseInt(cpf.charAt(10))) return false;
    return true;
};

const validateCNPJ = (cnpj: string): boolean => {
    cnpj = cnpj.replace(/[^\d]+/g, '');
    if (cnpj === '' || cnpj.length !== 14) return false;
    // Elimina CNPJs invalidos conhecidos
    if (/^(\d)\1{13}$/.test(cnpj)) return false;
         
    let tamanho = cnpj.length - 2
    let numeros = cnpj.substring(0,tamanho);
    let digitos = cnpj.substring(tamanho);
    let soma = 0;
    let pos = tamanho - 7;
    for (let i = tamanho; i >= 1; i--) {
      soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
      if (pos < 2) pos = 9;
    }
    let resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
    if (resultado != parseInt(digitos.charAt(0))) return false;
         
    tamanho = tamanho + 1;
    numeros = cnpj.substring(0,tamanho);
    soma = 0;
    pos = tamanho - 7;
    for (let i = tamanho; i >= 1; i--) {
      soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
      if (pos < 2) pos = 9;
    }
    resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
    if (resultado != parseInt(digitos.charAt(1))) return false;
           
    return true;
};

const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

// --- Fim das Funções ---

const ClientFormModal: React.FC<ClientFormModalProps> = ({ isOpen, onClose, onSave, client, clientRentals = [], setToast }) => {
    const initialFormState = {
        tipo: TipoCliente.PESSOA_FISICA, nome_completo: '', razao_social: '', nome_fantasia: '', documento: '', email: '', telefone: '',
        cep: '', rua: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '', inadimplente: false
    };
    const [formState, setFormState] = useState(initialFormState);
    const [errors, setErrors] = useState<Record<string, string>>({});
    // Inicializa com 2 referências vazias por padrão
    const [references, setReferences] = useState<Partial<ReferenciaContato>[]>([]);
    const [documents, setDocuments] = useState<DocumentoCliente[]>([]);
    const [isFetchingCep, setIsFetchingCep] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (client) {
            setFormState({
                tipo: client.tipo,
                nome_completo: client.nome_completo || '',
                razao_social: client.razao_social || '',
                nome_fantasia: client.nome_fantasia || '',
                documento: client.documento, // Assume que já vem formatado ou não, a mascara cuidará ao editar
                email: client.email,
                telefone: client.telefone,
                cep: client.endereco?.cep || '',
                rua: client.endereco?.rua || '',
                numero: client.endereco?.numero || '',
                complemento: client.endereco?.complemento || '',
                bairro: client.endereco?.bairro || '',
                cidade: client.endereco?.cidade || '',
                estado: client.endereco?.estado || '',
                inadimplente: client.inadimplente,
            });
            
            // Se tiver referências, usa as do cliente. Se tiver menos que 2, preenche com vazias.
            let refs = client.referencias || [];
            while (refs.length < 2) {
                refs.push({ id: `ref_${Date.now()}_${refs.length}`, nome: '', telefone: '', parentesco: '' });
            }
            setReferences(refs);
            setDocuments(client.documentos || []);
        } else {
            setFormState(initialFormState);
            // Inicializa com 2 referências obrigatórias
            setReferences([
                { id: `ref_${Date.now()}_1`, nome: '', telefone: '', parentesco: '' },
                { id: `ref_${Date.now()}_2`, nome: '', telefone: '', parentesco: '' }
            ]);
            setDocuments([]);
        }
        setErrors({});
        setIsSaving(false);
    }, [client, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        let newValue = value;

        // Aplicação de Máscaras
        if (name === 'documento') {
            newValue = formState.tipo === TipoCliente.PESSOA_FISICA ? maskCPF(value) : maskCNPJ(value);
        } else if (name === 'telefone') {
            newValue = maskPhone(value);
        } else if (name === 'cep') {
            newValue = maskCEP(value);
        }

        // Limpar erro ao digitar
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }

        // Resetar documento se mudar o tipo
        if (name === 'tipo') {
            setFormState(prev => ({ ...prev, tipo: value as TipoCliente, documento: '' }));
            setErrors(prev => ({ ...prev, documento: '' }));
            return;
        }

        if (type === 'checkbox') {
             setFormState({ ...formState, [name]: (e.target as HTMLInputElement).checked });
        } else {
             setFormState({ ...formState, [name]: newValue });
        }
    };
    
    const handleCepBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
        const cep = e.target.value.replace(/\D/g, '');
        if (cep.length !== 8) return;

        setIsFetchingCep(true);
        try {
            const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
            if (!response.ok) throw new Error('Falha ao buscar CEP.');
            const data = await response.json();
            if (data.erro) {
               if(setToast) setToast({ message: 'CEP não encontrado.', type: 'error' });
               setErrors(prev => ({...prev, cep: 'CEP inválido'}));
            } else {
                setFormState(prev => ({...prev, rua: data.logradouro, bairro: data.bairro, cidade: data.localidade, estado: data.uf }));
                setErrors(prev => ({...prev, cep: ''}));
            }
        } catch (error) {
            console.error("Erro ao buscar CEP:", error);
            if(setToast) setToast({ message: `Erro ao buscar CEP. Verifique sua conexão.`, type: 'error' });
        } finally {
            setIsFetchingCep(false);
        }
    };
    
    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = error => reject(error);
        });
    };

    const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const uploadedFiles = Array.from(e.target.files);
            const newDocs: DocumentoCliente[] = await Promise.all(uploadedFiles.map(async (file: File) => ({
                id: `doc_${Date.now()}_${Math.random()}`,
                nome: file.name,
                url: await fileToBase64(file),
            })));
            setDocuments(prev => [...prev, ...newDocs]);
        }
    };
    
    const handleRemoveDocument = (id: string) => {
        setDocuments(docs => docs.filter(doc => doc.id !== id));
    };

    const handleReferenceChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const newReferences = [...references];
        const field = e.target.name as keyof Omit<ReferenciaContato, 'id'>;
        let value = e.target.value;
        if (field === 'telefone') value = maskPhone(value);
        (newReferences[index] as any)[field] = value;
        setReferences(newReferences);
        
        if (errors.referencias) {
            setErrors(prev => ({ ...prev, referencias: '' }));
        }
    };

    const handleAddReference = () => {
        setReferences([...references, { id: `ref_${Date.now()}`, nome: '', telefone: '', parentesco: '' }]);
    };

    const handleRemoveReference = (index: number) => {
        if (references.length <= 2) return; // Impede remover se tiver 2 ou menos
        setReferences(references.filter((_, i) => i !== index));
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!validateEmail(formState.email)) {
            newErrors.email = 'Formato de e-mail inválido';
        }

        if (formState.tipo === TipoCliente.PESSOA_FISICA) {
            if (!validateCPF(formState.documento)) newErrors.documento = 'CPF inválido';
            if (!formState.nome_completo.trim()) newErrors.nome_completo = 'Nome é obrigatório';
        } else {
            if (!validateCNPJ(formState.documento)) newErrors.documento = 'CNPJ inválido';
            if (!formState.razao_social.trim()) newErrors.razao_social = 'Razão Social é obrigatória';
            if (!formState.nome_fantasia.trim()) newErrors.nome_fantasia = 'Nome Fantasia é obrigatório';
        }
        
        // Validação de telefone
        const cleanPhone = formState.telefone.replace(/\D/g, '');
        if (cleanPhone.length < 10) {
            newErrors.telefone = 'Telefone incompleto';
        }

        // Validação de referências (Pelo menos 2 preenchidas)
        const validRefs = references.filter(r => r.nome?.trim() && r.telefone?.trim() && r.parentesco?.trim());
        if (validRefs.length < 2) {
            newErrors.referencias = 'É obrigatório informar pelo menos 2 referências pessoais completas.';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!validateForm()) {
            if(setToast) setToast({ message: 'Verifique os erros no formulário.', type: 'error' });
            return;
        }

        setIsSaving(true);

        const clientData = {
            tipo: formState.tipo,
            documento: formState.documento,
            email: formState.email,
            telefone: formState.telefone,
            inadimplente: formState.inadimplente,
            nome_completo: formState.tipo === TipoCliente.PESSOA_FISICA ? formState.nome_completo : undefined,
            razao_social: formState.tipo === TipoCliente.PESSOA_JURIDICA ? formState.razao_social : undefined,
            nome_fantasia: formState.tipo === TipoCliente.PESSOA_JURIDICA ? formState.nome_fantasia : undefined,
            endereco: {
                cep: formState.cep, rua: formState.rua, numero: formState.numero, complemento: formState.complemento,
                bairro: formState.bairro, cidade: formState.cidade, estado: formState.estado,
            },
            referencias: references
                .filter(r => r.nome && r.telefone && r.parentesco)
                .map(r => ({ ...r, id: r.id || `ref_${Date.now()}`}) as ReferenciaContato),
            documentos: documents,
        };
        
        try {
            await onSave(clientData as ClientFormData);
        } catch(error) {
            // Error handled in parent or via toast in parent
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={client ? "Editar / Detalhes do Cliente" : "Adicionar Novo Cliente"}>
             <form onSubmit={handleSubmit} className="max-h-[75vh] overflow-y-auto p-1 space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Tipo de Cliente</label>
                    <select name="tipo" value={formState.tipo} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm">
                        <option value={TipoCliente.PESSOA_FISICA}>Pessoa Física</option>
                        <option value={TipoCliente.PESSOA_JURIDICA}>Pessoa Jurídica</option>
                    </select>
                </div>

                {formState.tipo === TipoCliente.PESSOA_FISICA ? (
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Nome Completo</label>
                        <input type="text" name="nome_completo" value={formState.nome_completo} onChange={handleChange} className={`mt-1 block w-full px-3 py-2 border ${errors.nome_completo ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm`} required />
                        {errors.nome_completo && <p className="text-red-500 text-xs mt-1">{errors.nome_completo}</p>}
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Razão Social</label>
                            <input type="text" name="razao_social" value={formState.razao_social} onChange={handleChange} className={`mt-1 block w-full px-3 py-2 border ${errors.razao_social ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm`} required />
                            {errors.razao_social && <p className="text-red-500 text-xs mt-1">{errors.razao_social}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Nome Fantasia</label>
                            <input type="text" name="nome_fantasia" value={formState.nome_fantasia} onChange={handleChange} className={`mt-1 block w-full px-3 py-2 border ${errors.nome_fantasia ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm`} />
                            {errors.nome_fantasia && <p className="text-red-500 text-xs mt-1">{errors.nome_fantasia}</p>}
                        </div>
                    </div>
                )}
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">{formState.tipo === TipoCliente.PESSOA_FISICA ? 'CPF' : 'CNPJ'}</label>
                        <input 
                            type="text" 
                            name="documento" 
                            value={formState.documento} 
                            onChange={handleChange} 
                            className={`mt-1 block w-full px-3 py-2 border ${errors.documento ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm`} 
                            required 
                            maxLength={18}
                            placeholder={formState.tipo === TipoCliente.PESSOA_FISICA ? '000.000.000-00' : '00.000.000/0000-00'}
                        />
                        {errors.documento && <p className="text-red-500 text-xs mt-1 flex items-center"><ExclamationTriangleIcon className="w-3 h-3 mr-1" />{errors.documento}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Telefone</label>
                        <input type="tel" name="telefone" value={formState.telefone} onChange={handleChange} className={`mt-1 block w-full px-3 py-2 border ${errors.telefone ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm`} required maxLength={15} placeholder="(00) 00000-0000" />
                        {errors.telefone && <p className="text-red-500 text-xs mt-1">{errors.telefone}</p>}
                    </div>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input type="email" name="email" value={formState.email} onChange={handleChange} className={`mt-1 block w-full px-3 py-2 border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm`} required />
                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                </div>
                
                 <div className="border-t pt-4 mt-4">
                    <h4 className="text-md font-semibold text-gray-600 mb-3">Endereço</h4>
                     <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="sm:col-span-1 relative">
                            <label htmlFor="cep" className="block text-sm font-medium text-gray-700">CEP</label>
                            <input type="text" id="cep" name="cep" value={formState.cep} onChange={handleChange} onBlur={handleCepBlur} maxLength={9} placeholder="00000-000" className={`mt-1 block w-full px-3 py-2 border ${errors.cep ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm`} />
                             {isFetchingCep && <SpinnerIcon className="absolute right-2 bottom-2 w-5 h-5 text-gray-400" />}
                             {errors.cep && <p className="text-red-500 text-xs mt-1">{errors.cep}</p>}
                        </div>
                        <div className="sm:col-span-2"><label className="block text-sm font-medium text-gray-700">Rua / Logradouro</label><input type="text" name="rua" value={formState.rua} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" /></div>
                    </div>
                     <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                        <div className="sm:col-span-1"><label className="block text-sm font-medium text-gray-700">Número</label><input type="text" name="numero" value={formState.numero} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" /></div>
                        <div className="sm:col-span-2"><label className="block text-sm font-medium text-gray-700">Complemento</label><input type="text" name="complemento" value={formState.complemento} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" /></div>
                    </div>
                     <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                        <div><label className="block text-sm font-medium text-gray-700">Bairro</label><input type="text" name="bairro" value={formState.bairro} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" /></div>
                        <div><label className="block text-sm font-medium text-gray-700">Cidade</label><input type="text" name="cidade" value={formState.cidade} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" /></div>
                        <div><label className="block text-sm font-medium text-gray-700">Estado</label><input type="text" name="estado" value={formState.estado} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" /></div>
                    </div>
                </div>

                <div className="border-t pt-4 mt-4">
                    <h4 className="text-md font-semibold text-gray-600 mb-3">Referências Pessoais (Mínimo 2)</h4>
                    {errors.referencias && <p className="text-red-500 text-sm mb-2 bg-red-50 p-2 rounded border border-red-200">{errors.referencias}</p>}
                    <div className="space-y-3">
                        {references.map((ref, index) => (
                             <div key={ref.id || index} className="grid grid-cols-12 gap-2 items-end p-2 bg-gray-50 rounded-md">
                                <div className="col-span-12 sm:col-span-4"><label className="block text-xs font-medium text-gray-600">Nome</label><input type="text" name="nome" value={ref.nome} onChange={(e) => handleReferenceChange(index, e)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm" /></div>
                                <div className="col-span-6 sm:col-span-4"><label className="block text-xs font-medium text-gray-600">Telefone</label><input type="tel" name="telefone" value={ref.telefone} onChange={(e) => handleReferenceChange(index, e)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm" maxLength={15} placeholder="(00) 00000-0000" /></div>
                                <div className="col-span-6 sm:col-span-3"><label className="block text-xs font-medium text-gray-600">Parentesco</label><input type="text" name="parentesco" value={ref.parentesco} onChange={(e) => handleReferenceChange(index, e)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm" /></div>
                                <div className="col-span-12 sm:col-span-1 flex justify-end"><button type="button" onClick={() => handleRemoveReference(index)} disabled={references.length <= 2} className="p-2 text-red-500 hover:text-red-700 disabled:opacity-30 disabled:cursor-not-allowed"><TrashIcon className="w-4 h-4" /></button></div>
                            </div>
                        ))}
                    </div>
                     <button type="button" onClick={handleAddReference} className="mt-3 flex items-center text-sm font-medium text-primary hover:underline">
                        <PlusIcon className="w-4 h-4 mr-1" />
                        Adicionar Referência
                    </button>
                </div>
                
                <div className="border-t pt-4 mt-4">
                     <h4 className="text-md font-semibold text-gray-600 mb-3">Documentos Anexados</h4>
                     <div className="space-y-2">
                        {documents.map(doc => (
                             <div key={doc.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                                <div className="flex items-center gap-2">
                                    <PaperClipIcon className="w-5 h-5 text-gray-500" />
                                    <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-primary hover:underline" download={doc.nome}>{doc.nome}</a>
                                </div>
                                <button type="button" onClick={() => handleRemoveDocument(doc.id)} className="p-1 text-red-500 hover:text-red-700"><TrashIcon className="w-4 h-4" /></button>
                             </div>
                        ))}
                     </div>
                     <label htmlFor="doc-upload" className="mt-4 inline-flex items-center gap-2 px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 cursor-pointer">
                        <UploadIcon className="w-4 h-4"/> Anexar Documentos
                        <input id="doc-upload" type="file" multiple onChange={handleDocumentUpload} className="hidden" />
                     </label>
                </div>
                
                 {client && (
                    <div className="border-t pt-4 mt-4">
                        <label className="flex items-center">
                            <input type="checkbox" name="inadimplente" checked={formState.inadimplente} onChange={handleChange} className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded" />
                            <span className="ml-2 text-sm font-medium text-gray-700">Marcar como inadimplente</span>
                        </label>
                    </div>
                )}

                {client && clientRentals && clientRentals.length > 0 && (
                    <div className="border-t pt-6 mt-6">
                        <h4 className="text-md font-semibold text-gray-600 mb-3">Histórico de Locações</h4>
                        <div className="max-h-60 overflow-y-auto border rounded-md">
                            <table className="w-full text-sm text-left text-gray-500">
                                <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0">
                                    <tr>
                                        <th scope="col" className="px-4 py-2">Equipamento</th>
                                        <th scope="col" className="px-4 py-2">Período</th>
                                        <th scope="col" className="px-4 py-2">Status</th>
                                        <th scope="col" className="px-4 py-2 text-right">Valor</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white">
                                    {clientRentals.map((rental) => (
                                        <tr key={rental.id} className="border-b hover:bg-gray-50">
                                            <td className="px-4 py-3 font-medium text-gray-800">{rental.equipamentos?.nome || 'Carregando...'}</td>
                                            <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{`${new Date(rental.data_inicio).toLocaleDateString('pt-BR')} - ${new Date(rental.data_fim).toLocaleDateString('pt-BR')}`}</td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-1 font-semibold leading-tight rounded-full text-xs ${getRentalStatusClass(rental.status)}`}>{rental.status}</span>
                                            </td>
                                            <td className="px-4 py-3 text-right font-medium text-gray-800">R$ {rental.valor_total.toFixed(2).replace('.', ',')}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}


                <div className="mt-6 flex justify-end space-x-3 pt-4 border-t">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancelar</button>
                    <button type="submit" disabled={isSaving} className="flex items-center justify-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-hover disabled:bg-gray-400">
                        {isSaving && <SpinnerIcon className="w-5 h-5 mr-2" />}
                        {isSaving ? 'Salvando...' : 'Salvar'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default ClientFormModal;
