'use client'

import { useState, useEffect } from 'react'
import { getTemplates, createTemplate, updateTemplate, deleteTemplate, TemplateInput } from './actions'
import { Plus, Edit2, Trash2, Save, FileText } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function TemplatesPage() {
    const [templates, setTemplates] = useState<any[]>([])
    const [editing, setEditing] = useState<any>(null)
    const { showToast } = useToast()

    // Form State
    const [name, setName] = useState('')
    const [content, setContent] = useState('')

    const loadData = async () => {
        const result = await getTemplates()
        if (result.success) setTemplates(result.templates || [])
    }

    useEffect(() => { loadData() }, [])

    const handleEdit = (tmpl: any) => {
        setEditing(tmpl)
        setName(tmpl.name)
        setContent(tmpl.content)
    }

    const handleNew = () => {
        setEditing({ id: null }) // New mode
        setName('')
        setContent('CONTRATO DE LOCAÇÃO\n\nLOCADOR: Locnos Ltda\nLOCATÁRIO: {{Cliente.Nome}}\nDATA: {{Locacao.DataInicio}}\n...')
    }

    const handleSave = async () => {
        const data: TemplateInput = { name, content }
        let result
        if (editing.id) {
            result = await updateTemplate(editing.id, data)
        } else {
            result = await createTemplate(data)
        }

        if (result.success) {
            showToast('success', 'Modelo salvo!')
            setEditing(null)
            loadData()
        } else {
            showToast('error', result.error)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Excluir modelo?')) return
        await deleteTemplate(id)
        loadData()
    }

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Modelos de Contrato</h1>
                <button onClick={handleNew} className="btn-primary flex gap-2"><Plus size={18} /> Novo Modelo</button>
            </div>

            {editing ? (
                <div className="card p-6 max-w-4xl mx-auto space-y-4">
                    <h2 className="text-xl font-bold mb-4">{editing.id ? 'Editar Modelo' : 'Novo Modelo'}</h2>

                    <div>
                        <label className="label">Nome do Modelo</label>
                        <input className="input" value={name} onChange={e => setName(e.target.value)} />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2">
                            <label className="label">Conteúdo do Contrato</label>
                            <textarea
                                className="input h-96 font-mono text-sm"
                                value={content}
                                onChange={e => setContent(e.target.value)}
                            />
                        </div>
                        <div className="bg-blue-50 p-4 rounded-lg h-fit">
                            <h3 className="font-bold text-blue-900 mb-2">Variáveis Disponíveis</h3>
                            <ul className="text-xs space-y-1 text-blue-800 font-mono">
                                <li>{'{{Cliente.Nome}}'}</li>
                                <li>{'{{Cliente.Documento}}'} (CPF/CNPJ)</li>
                                <li>{'{{Cliente.Endereco}}'} (Endereço Cadastro)</li>
                                <li>{'{{Locacao.DataInicio}}'} / {'{{Locacao.DataFim}}'}</li>
                                <li>{'{{Locacao.Dias}}'} (Duração)</li>
                                <li>{'{{Locacao.ValorTotal}}'}</li>
                                <li>{'{{Locacao.Caucao}}'}</li>
                                <li>{'{{Locacao.FreteEntrega}}'}</li>
                                <li>{'{{Locacao.FreteDevolucao}}'}</li>
                                <li>{'{{Locacao.EnderecoUso}}'}</li>
                                <li>{'{{Objeto.Lista}}'} (Item, Qtd, Preço)</li>
                                <li>{'{{Objeto.ValorReposicao}}'} (Total Reposição)</li>
                            </ul>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2">
                        <button onClick={() => setEditing(null)} className="btn-secondary">Cancelar</button>
                        <button onClick={handleSave} className="btn-primary flex gap-2"><Save size={18} /> Salvar</button>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {templates.map(t => (
                        <div key={t.id} className="card p-6 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
                                    <FileText size={24} />
                                </div>
                                <div className="flex gap-1">
                                    <button onClick={() => handleEdit(t)} className="p-2 text-gray-400 hover:text-blue-600"><Edit2 size={18} /></button>
                                    <button onClick={() => handleDelete(t.id)} className="p-2 text-gray-400 hover:text-red-600"><Trash2 size={18} /></button>
                                </div>
                            </div>
                            <h3 className="font-bold text-gray-900">{t.name}</h3>
                            <p className="text-xs text-gray-500 mt-2">Última edição: {new Date(t.updatedAt).toLocaleDateString()}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
