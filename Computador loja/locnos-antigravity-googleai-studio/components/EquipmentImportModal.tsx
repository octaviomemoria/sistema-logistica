import React, { useState } from 'react';
import Modal from './Modal';
import { SpinnerIcon, UploadIcon, ArrowDownTrayIcon } from './Icons';

interface EquipmentImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newEquipments: any[]) => void;
  setToast: (toast: { message: string; type: 'success' | 'error' } | null) => void;
}

const REQUIRED_HEADERS = ['name', 'category', 'subCategory', 'brand', 'purchaseValue', 'totalQuantity'];
const ALL_HEADERS = [...REQUIRED_HEADERS, 'saleValue', 'suggestedDeposit'];

const columnInstructions = [
    { name: 'name', desc: 'Nome do equipamento (Ex: Betoneira 500L)', required: true },
    { name: 'category', desc: 'Categoria principal (Ex: Construção Civil)', required: true },
    { name: 'subCategory', desc: 'Subcategoria (Ex: Misturadores)', required: true },
    { name: 'brand', desc: 'Marca do equipamento (Ex: Marca A)', required: true },
    { name: 'purchaseValue', desc: 'Valor de compra (Use . para decimais, Ex: 4500.00)', required: true },
    { name: 'totalQuantity', desc: 'Quantidade em estoque (Ex: 5)', required: true },
    { name: 'saleValue', desc: 'Valor de venda (Opcional, Ex: 3000.00)', required: false },
    { name: 'suggestedDeposit', desc: 'Valor de caução (Opcional, Ex: 400.00)', required: false },
];

const EquipmentImportModal: React.FC<EquipmentImportModalProps> = ({ isOpen, onClose, onSave, setToast }) => {
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
        link.setAttribute('download', 'modelo_importacao_equipamentos.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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
            const hasRequiredHeaders = REQUIRED_HEADERS.every(h => headerLine.includes(h));

            if (!hasRequiredHeaders) {
                setToast({ message: 'O cabeçalho do arquivo não corresponde ao modelo. Verifique as colunas obrigatórias.', type: 'error' });
                setIsLoading(false);
                return;
            }

            const newEquipments: any[] = [];
            for (let i = 1; i < lines.length; i++) {
                const values = lines[i].split(',');
                const equipmentData: any = {};
                
                headerLine.forEach((header, index) => {
                    if (values[index]) {
                        equipmentData[header] = values[index].trim();
                    }
                });

                // Simple validation
                if (REQUIRED_HEADERS.some(h => !equipmentData[h])) {
                    console.warn(`Linha ${i + 1} ignorada: Faltam dados obrigatórios.`);
                    continue; // Skip incomplete rows
                }
                
                // Convert numeric fields
                equipmentData.purchaseValue = parseFloat(equipmentData.purchaseValue.replace(',', '.'));
                equipmentData.totalQuantity = parseInt(equipmentData.totalQuantity, 10);
                if (equipmentData.saleValue) equipmentData.saleValue = parseFloat(equipmentData.saleValue.replace(',', '.'));
                if (equipmentData.suggestedDeposit) equipmentData.suggestedDeposit = parseFloat(equipmentData.suggestedDeposit.replace(',', '.'));

                if (isNaN(equipmentData.purchaseValue) || isNaN(equipmentData.totalQuantity)) {
                    console.warn(`Linha ${i + 1} ignorada: Valor de compra ou quantidade inválidos.`);
                    continue; // Skip rows with invalid numbers
                }
                
                newEquipments.push(equipmentData);
            }
            
            if(newEquipments.length > 0) {
                onSave(newEquipments);
            } else {
                setToast({ message: 'Nenhum equipamento válido encontrado no arquivo para importar.', type: 'error' });
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
        <Modal isOpen={isOpen} onClose={onClose} title="Importar Equipamentos via Planilha">
            <div className="space-y-6">
                <div>
                    <h4 className="text-md font-semibold text-gray-700">Passo 1: Baixe o Modelo</h4>
                    <p className="text-sm text-gray-500 mt-1 mb-3">Use nosso modelo CSV para garantir que seus dados estejam no formato correto para a importação.</p>
                    <button onClick={handleDownloadTemplate} className="inline-flex items-center bg-gray-100 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium">
                        <ArrowDownTrayIcon className="w-5 h-5 mr-2"/>
                        Baixar Modelo CSV
                    </button>
                </div>

                <div>
                    <h4 className="text-md font-semibold text-gray-700">Passo 2: Faça o Upload do Arquivo</h4>
                    <p className="text-sm text-gray-500 mt-1 mb-3">Selecione o arquivo CSV que você preencheu.</p>
                    <label htmlFor="csv-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-primary hover:text-primary-hover focus-within:outline-none">
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
                        <input id="csv-upload" name="csv-upload" type="file" className="sr-only" accept=".csv" onChange={handleFileChange} />
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
                        {isLoading ? 'Importando...' : 'Importar Equipamentos'}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default EquipmentImportModal;
