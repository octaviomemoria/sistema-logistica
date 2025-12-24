import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default async function ReceiptPrintPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params

    // Fetch payment with relations
    const payment = await prisma.payment.findUnique({
        where: { id },
        include: {
            rental: {
                include: {
                    person: true
                }
            }
        }
    })

    if (!payment) notFound()

    const { rental } = payment
    const { person } = rental

    return (
        <div className="max-w-[148mm] mx-auto p-[10mm] border-2 border-dashed border-gray-300 m-8 print:border-0 print:m-0">
            <style dangerouslySetInnerHTML={{
                __html: `
                @media print {
                    @page { size: A5; margin: 0; }
                    body { margin: 10mm; }
                }
            `}} />

            {/* Header */}
            <div className="text-center border-b-2 border-black pb-4 mb-6">
                <h1 className="text-xl font-bold uppercase">Recibo de Pagamento</h1>
                <p className="text-sm text-gray-600">Nº {payment.id.slice(0, 8).toUpperCase()}</p>
            </div>

            {/* Company Info */}
            <div className="text-center mb-8">
                <h2 className="font-bold">LOCNOS EQUIPAMENTOS</h2>
                <p className="text-xs">CNPJ: 00.000.000/0001-00</p>
                <p className="text-xs">Rua Exemplo, 123 - Centro</p>
            </div>

            {/* Content */}
            <div className="space-y-6 text-sm mb-12">
                <div className="flex justify-between border-b border-gray-200 pb-2">
                    <span className="font-bold">Valor Recebido:</span>
                    <span className="font-bold text-lg">R$ {payment.amount.toFixed(2)}</span>
                </div>

                <div>
                    <span className="font-bold block mb-1">Recebemos de:</span>
                    <p>{person.name} ({person.document})</p>
                </div>

                <div>
                    <span className="font-bold block mb-1">Referente a:</span>
                    <p>Locação Nº {rental.id.slice(0, 8).toUpperCase()}</p>
                    {payment.notes && <p className="text-gray-500 text-xs mt-1">Obs: {payment.notes}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <span className="font-bold block mb-1">Forma de Pagto:</span>
                        <p className="uppercase">{payment.paymentMethod}</p>
                    </div>
                    <div>
                        <span className="font-bold block mb-1">Data:</span>
                        <p>{format(payment.paymentDate, 'dd/MM/yyyy HH:mm')}</p>
                    </div>
                </div>
            </div>

            {/* Signature */}
            <div className="mt-16 pt-4 border-t border-black text-center">
                <p className="font-bold text-sm">Locnos Equipamentos</p>
                <p className="text-xs text-gray-500">Assinatura do Recebedor</p>
            </div>

            <div className="text-center mt-8 text-[10px] text-gray-400">
                Impresso em {format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
            </div>
        </div>
    )
}
