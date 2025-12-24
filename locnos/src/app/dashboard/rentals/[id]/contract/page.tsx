'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Printer, ArrowLeft, RefreshCw } from 'lucide-react'
import { getRentalForContract } from './actions'
import { useToast } from '@/hooks/use-toast'

export default function ContractGeneratorPage() {
    const params = useParams()
    const router = useRouter()
    const { showToast } = useToast()
    const printRef = useRef<HTMLDivElement>(null)

    const [loading, setLoading] = useState(true)
    const [rental, setRental] = useState<any>(null)
    const [templates, setTemplates] = useState<any[]>([])
    const [selectedTemplateId, setSelectedTemplateId] = useState('')
    const [generatedContent, setGeneratedContent] = useState('')

    useEffect(() => {
        if (params.id) {
            getRentalForContract(params.id as string).then(res => {
                if (res.success) {
                    setRental(res.rental)
                    setTemplates(res.templates || [])
                    if (res.templates && res.templates.length > 0) {
                        setSelectedTemplateId(res.templates[0].id)
                    }
                } else {
                    showToast('error', 'Erro ao carregar dados')
                }
                setLoading(false)
            })
        }
    }, [params.id])

    // Generation Logic
    useEffect(() => {
        if (!rental || !selectedTemplateId) return

        const template = templates.find(t => t.id === selectedTemplateId)
        if (!template) return

        let content = template.content

        // Formatters
        const fmtMoney = (val: number) => `R$ ${val?.toFixed(2) || '0,00'}`
        const fmtDate = (d: string) => new Date(d).toLocaleDateString('pt-BR')

        // Variables Map
        const replacements: Record<string, string> = {
            '{{Cliente.Nome}}': rental.customer.name,
            '{{Cliente.Documento}}': rental.customer.document,
            '{{Cliente.Endereco}}': `${rental.customer.street}, ${rental.customer.number} - ${rental.customer.neighborhood}, ${rental.customer.city}/${rental.customer.state}`,

            '{{Locacao.DataInicio}}': fmtDate(rental.startDate),
            '{{Locacao.DataFim}}': fmtDate(rental.endDate),
            '{{Locacao.Dias}}': Math.ceil((new Date(rental.endDate).getTime() - new Date(rental.startDate).getTime()) / (1000 * 60 * 60 * 24)).toString(),
            '{{Locacao.ValorTotal}}': fmtMoney(rental.totalAmount),

            '{{Locacao.Caucao}}': fmtMoney(rental.securityDeposit),
            '{{Locacao.FreteEntrega}}': fmtMoney(rental.deliveryFee),
            '{{Locacao.FreteDevolucao}}': fmtMoney(rental.returnFee),
            '{{Locacao.EnderecoUso}}': rental.deliveryAddress || 'O mesmo do cadastro',
        }

        // Apply simple replacements
        Object.keys(replacements).forEach(key => {
            content = content.replaceAll(key, replacements[key])
        })

        // Complex Replacements: Items Table
        if (content.includes('{{Objeto.Lista}}')) {
            const tableRows = rental.items.map((item: any) => `
                <tr>
                    <td style="border: 1px solid #ddd; padding: 8px;">${item.equipment.name}</td>
                    <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${item.quantity}</td>
                    <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${fmtMoney(item.unitPrice)}</td>
                    <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${fmtMoney(item.totalPrice)}</td>
                </tr>
            `).join('')

            const tableHtml = `
                <table style="width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 10px; font-size: 14px;">
                    <thead>
                        <tr style="background-color: #f9f9f9;">
                            <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Equipamento</th>
                            <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">Qtd</th>
                            <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">Unit.</th>
                            <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">Total</th>
                        </tr>
                    </thead>
                    <tbody>${tableRows}</tbody>
                </table>
            `
            content = content.replaceAll('{{Objeto.Lista}}', tableHtml)
        }

        // Complex Replacements: Replacement Value
        if (content.includes('{{Objeto.ValorReposicao}}')) {
            const totalReplacement = rental.items.reduce((acc: number, item: any) => acc + (item.equipment.replacementValue || 0) * item.quantity, 0)
            content = content.replaceAll('{{Objeto.ValorReposicao}}', fmtMoney(totalReplacement))
        }

        setGeneratedContent(content)

    }, [rental, selectedTemplateId, templates])

    const handlePrint = () => {
        window.print()
    }

    if (loading) return <div className="p-8 text-center">Carregando gerador...</div>

    return (
        <div className="flex flex-col min-h-screen bg-gray-100">
            {/* Control Bar (Hidden on Print) */}
            <div className="bg-white border-b px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4 print:hidden shadow-sm z-10">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full text-gray-600">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="font-bold text-lg text-gray-800">Gerador de Contrato</h1>
                        <p className="text-xs text-gray-500">Locação #{rental?.id?.slice(-6)} - {rental?.customer?.name}</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-gray-700">Modelo:</label>
                        <select
                            className="input py-1 text-sm w-64"
                            value={selectedTemplateId}
                            onChange={e => setSelectedTemplateId(e.target.value)}
                        >
                            {templates.map(t => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                        </select>
                    </div>

                    <button onClick={handlePrint} className="btn-primary flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all">
                        <Printer size={18} /> Imprimir / PDF
                    </button>
                </div>
            </div>

            {/* Preview Area */}
            <div className="flex-1 overflow-auto p-4 md:p-8 flex justify-center print:p-0 print:overflow-visible bg-gray-100">
                <div
                    ref={printRef}
                    className="bg-white shadow-xl print:shadow-none w-full max-w-[210mm] min-h-[297mm] p-[20mm] print:p-0 text-black text-sm leading-relaxed"
                >
                    {/* Render HTML Safely (We trust the admin templates) */}
                    <div
                        className="prose max-w-none"
                        dangerouslySetInnerHTML={{ __html: generatedContent.replace(/\n/g, '<br/>') }}
                    />
                </div>
            </div>

            {/* Print Styles */}
            <style jsx global>{`
                @media print {
                    body {
                        background: white;
                    }
                    .print\\:hidden {
                        display: none !important;
                    }
                    .print\\:shadow-none {
                        box-shadow: none !important;
                    }
                    .print\\:p-0 {
                        padding: 0 !important;
                    }
                    @page {
                        margin: 20mm;
                    }
                }
            `}</style>
        </div>
    )
}
