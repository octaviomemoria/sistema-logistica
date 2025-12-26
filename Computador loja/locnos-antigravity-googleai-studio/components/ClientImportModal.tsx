import React, { useState } from 'react';
import Modal from './Modal';
import { SpinnerIcon, UploadIcon, ArrowDownTrayIcon } from './Icons';
// FIX: Renamed ClientType to TipoCliente to match the export from types.ts
import { TipoCliente } from '../types';

interface ClientImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newClients: any[]) => void;
  setToast: (toast: { message: string; type: 'success' | 'error' } | null) => void;
}

const REQUIRED_HEADERS_PF = ['type', 'name', 'documentNumber', 'email', 'phone'];
const REQUIRED_HEADERS_PJ = ['type', 'corporateName', 'tradeName', 'documentNumber', 'email', 'phone'];
const ALL_HEADERS = ['type', 'name', 'corporateName', 'tradeName', 'documentNumber', 'email', 'phone', 'cep', 'street', 'number', 'complement', 'neighborhood', 'city', 'state'];

const columnInstructions = [
    { name: 'type', desc: 'Tipo de cliente. Use "Pessoa Física" ou "Pessoa Jurídica".', required: true },
    { name: 'name', desc: 'Nome completo (obrigatório para Pessoa Física).', required: true },
    { name: 'corporateName', desc: 'Razão Social (obrigatório para Pessoa Jurídica).', required: true },
    { name: 'tradeName', desc: 'Nome Fantasia (obrigatório para Pessoa Jurídica).', required: true },
    { name: 'documentNumber', desc: 'CPF ou CNPJ.', required: true },
    { name: 'email', desc: 'E-mail de contato.', required: true },
    { name: 'phone', desc: 'Telefone de contato.', required: true },
    { name: 'cep', desc: 'CEP do endereço (Opcional).', required: false },
    { name: 'street', desc: 'Rua / Logradouro (Opcional).', required: false },
    { name: 'number', desc: 'Número do endereço (Opcional).', required: false },
    { name: 'complement', desc: 'Complemento (Opcional).', required: false },
    { name: 'neighborhood', desc: 'Bairro (Opcional).', required: false },
    { name: 'city', desc: 'Cidade (Opcional).', required: false },
    { name: 'state', desc: 'Estado (Ex: SP) (Opcional).', required: false },
];

const ClientImportModal: React.FC<ClientImportModalProps> = ({ isOpen, onClose, onSave, setToast }) => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.type !== 'text/csv') {
                setToast({ message: 'Por favor, selecione um arquivo no formato .csv', type: 'error' });
                return;
            }
            setSelectedFile(file);
        }
    };

    const handleDownloadTemplate = () => {
        const csvContent = ALL_HEADERS.join(',');
        const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'modelo_importacao_clientes.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        // FIX: The `URL.createObjectURL` method was incorrectly called on a string `url`, causing a type error. It should be `URL.revokeObjectURL(url)` to release the object URL from memory after the download link has been clicked.
        URL.revokeObjectURL(url);
    };
    
    const handleImport = () => {
        if (!selectedFile) {
            setToast({ message: 'Nenhum arquivo selecionado.', type: 'error' });
            return;
        }

        setIsLoading(true);
        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            const lines = text.split(/\r\n|\n/).filter(line => line.trim() !== '');
            if (lines.length < 2) {
                setToast({ message: 'O arquivo CSV está vazio ou contém apenas o cabeçalho.', type: 'error' });
                setIsLoading(false);
                return;
            }

            const headerLine = lines[0].split(',').map(h => h.trim().toLowerCase());
            
            const newClients: any[] = [];
            for (let i = 1; i < lines.length; i++) {
                const values = lines[i].split(',');
                const clientData: any = {};
                
                headerLine.forEach((header, index) => {
                    if (values[index]) {
                        clientData[header] = values[index].trim();
                    }
                });
                
                // Validate required fields based on client type
                if (!clientData.type) {
                     console.warn(`Linha ${i + 1} ignorada: O tipo de cliente é obrigatório.`);
                     continue;
                }

                let requiredFields = [];
                // FIX: Renamed ClientType to TipoCliente to match the imported type.
                if (clientData.type === TipoCliente.PESSOA_FISICA) {
                    requiredFields = REQUIRED_HEADERS_PF;
                // FIX: Renamed ClientType to TipoCliente to match the imported type.
                } else if (clientData.type === TipoCliente.PESSOA_JURIDICA) {
                    requiredFields = REQUIRED_HEADERS_PJ;
                } else {
                     console.warn(`Linha ${i + 1} ignorada: Tipo de cliente inválido. Use "Pessoa Física" ou "Pessoa Jurídica".`);
                     continue;
                }
                
                if (requiredFields.some(h => !clientData[h])) {
                    console.warn(`Linha ${i + 1} ignorada: Faltam dados obrigatórios para o tipo de cliente.`);
                    continue; // Skip incomplete rows
                }

                const address = {
                    cep: clientData.cep,
                    street: clientData.street,
                    number: clientData.number,
                    complement: clientData.complement,
                    neighborhood: clientData.neighborhood,
                    city: clientData.city,
                    state: clientData.state,
                };
                
                newClients.push({
                    type: clientData.type,
                    name: clientData.name,
                    corporateName: clientData.corporateName,
                    tradeName: clientData.tradeName,
                    documentNumber: clientData.documentNumber,
                    email: clientData.email,
                    phone: clientData.phone,
                    address: Object.values(address).some(v => v) ? address : undefined,
                });
            }
            
            if(newClients.length > 0) {
                onSave(newClients);
            } else {
                setToast({ message: 'Nenhum cliente válido encontrado no arquivo para importar.', type: 'error' });
            }
            
            setIsLoading(false);
            setSelectedFile(null);
        };
        
        reader.onerror = () => {
            setToast({ message: 'Erro ao ler o arquivo.', type: 'error' });
            setIsLoading(false);
        };

        reader.readAsText(selectedFile);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Importar Clientes via Planilha">
            <div className="space-y-6">
                <div>
                    <h4 className="text-md font-semibold text-gray-700">Passo 1: Baixe o Modelo</h4>
                    <p className="text-sm text-gray-500 mt-1 mb-3">Use nosso modelo CSV para garantir que seus dados estejam no formato correto.</p>
                    <button onClick={handleDownloadTemplate} className="inline-flex items-center bg-gray-100 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium">
                        <ArrowDownTrayIcon className="w-5 h-5 mr-2"/>
                        Baixar Modelo CSV
                    </button>
                </div>

                <div>
                    <h4 className="text-md font-semibold text-gray-700">Passo 2: Faça o Upload do Arquivo</h4>
                    <p className="text-sm text-gray-500 mt-1 mb-3">Selecione o arquivo CSV preenchido.</p>
                    <label htmlFor="csv-client-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-primary hover:text-primary-hover focus-within:outline-none">
                        <div className="flex items-center justify-center w-full px-6 py-4 border-2 border-gray-300 border-dashed rounded-md">
                            <div className="space-y-1 text-center">
                                <UploadIcon className="mx-auto h-10 w-10 text-gray-400" />
                                {selectedFile ? (
                                    <p className="text-sm font-semibold text-gray-800">{selectedFile.name}</p>
                                ) : (
                                    <p className="text-sm text-gray-600">
                                        Clique para selecionar um arquivo
                                    </p>
                                )}
                                <p className="text-xs text-gray-500">Apenas arquivos .csv são permitidos</p>
                            </div>
                        </div>
                        <input id="csv-client-upload" name="csv-client-upload" type="file" className="sr-only" accept=".csv" onChange={handleFileChange} />
                    </label>
                </div>

                <div>
                    <h4 className="text-md font-semibold text-gray-700">Instruções das Colunas</h4>
                     <div className="mt-2 text-sm text-gray-600 max-h-32 overflow-y-auto border rounded-md p-3 bg-gray-50">
                        <ul className="space-y-2">
                           {columnInstructions.map(col => (
                               <li key={col.name}>
                                   <span className={`font-semibold ${col.required ? 'text-gray-800' : 'text-gray-600'}`}>{col.name}</span>
                                   {col.required && <span className="text-red-600 font-bold">*</span>}
                                   <span className="text-gray-500 text-xs ml-2">{col.desc}</span>
                               </li>
                           ))}
                        </ul>
                    </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3 pt-4 border-t">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancelar</button>
                    <button type="button" onClick={handleImport} disabled={!selectedFile || isLoading} className="flex items-center justify-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-hover disabled:bg-gray-400 disabled:cursor-not-allowed">
                        {isLoading && <SpinnerIcon className="w-5 h-5 mr-2" />}
                        {isLoading ? 'Importando...' : 'Importar Clientes'}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default ClientImportModal;
