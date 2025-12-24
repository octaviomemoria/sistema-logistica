import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default async function ContractPrintPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params

    const rental = await prisma.rental.findUnique({
        where: { id },
        include: {
            person: true,
            items: {
                include: { equipment: true }
            }
        }
    })

    if (!rental) notFound()

    const person = rental.person
    const driver = rental.deliveryDriverId ? await prisma.user.findUnique({ where: { id: rental.deliveryDriverId } }) : null

    return (
        <div className="max-w-[210mm] mx-auto p-[15mm]">
            <style dangerouslySetInnerHTML={{
                __html: `
                @media print {
                    @page { margin: 15mm; }
                    body { -webkit-print-color-adjust: exact; }
                }
            `}} />

            {/* Header */}
            <div className="flex justify-between items-center border-b pb-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold uppercase tracking-wide">Contrato de Locação</h1>
                    <p className="text-gray-600">Nº {rental.id.slice(0, 8).toUpperCase()}</p>
                </div>
                <div className="text-right">
                    <h2 className="font-bold text-lg">LOCNOS EQUIPAMENTOS</h2>
                    <p className="text-sm">CNPJ: 00.000.000/0001-00</p>
                    <p className="text-sm">contato@locnos.com.br</p>
                </div>
            </div>

            {/* Parties */}
            <div className="grid grid-cols-2 gap-8 mb-8">
                <div>
                    <h3 className="font-bold border-b mb-2 text-sm uppercase">Locatário (Cliente)</h3>
                    <div className="text-sm space-y-1">
                        <p className="font-bold">{person.name}</p>
                        <p>{person.document}</p>
                        <p>{person.street}, {person.number} - {person.neighborhood}</p>
                        <p>{person.city} - {person.state}</p>
                        <p>{person.phone} | {person.email}</p>
                    </div>
                </div>
                <div>
                    <h3 className="font-bold border-b mb-2 text-sm uppercase">Detalhes da Locação</h3>
                    <div className="text-sm space-y-1">
                        <p><span className="font-semibold">Data Início:</span> {format(rental.startDate, 'dd/MM/yyyy HH:mm')}</p>
                        <p><span className="font-semibold">Devolução:</span> {format(rental.endDate, 'dd/MM/yyyy HH:mm')}</p>
                        <p><span className="font-semibold">Duração:</span> {rental.durationDays} dias</p>
                        <p><span className="font-semibold">Endereço de Uso:</span> {rental.deliveryAddress || 'Mesmo do cadastro'}</p>
                    </div>
                </div>
            </div>

            {/* Items */}
            <div className="mb-8">
                <h3 className="font-bold border-b mb-2 text-sm uppercase">Equipamentos locados</h3>
                <table className="w-full text-sm text-left">
                    <thead>
                        <tr className="border-b-2 border-gray-100">
                            <th className="py-2">Item</th>
                            <th className="py-2 text-center">Qtd</th>
                            <th className="py-2 text-right">Valor Unit.</th>
                            <th className="py-2 text-right">Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {rental.items.map(item => (
                            <tr key={item.id}>
                                <td className="py-2">{item.equipment.name} <span className="text-gray-500 text-xs">({item.equipment.brand})</span></td>
                                <td className="py-2 text-center">{item.quantity}</td>
                                <td className="py-2 text-right">R$ {item.unitPrice.toFixed(2)}</td>
                                <td className="py-2 text-right">R$ {item.totalPrice.toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Financials */}
            <div className="flex justify-end mb-8">
                <div className="w-64 space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span>Subtotal Itens:</span>
                        <span>R$ {rental.totalItems.toFixed(2)}</span>
                    </div>
                    {rental.deliveryFee > 0 && (
                        <div className="flex justify-between">
                            <span>Frete Entrega:</span>
                            <span>R$ {rental.deliveryFee.toFixed(2)}</span>
                        </div>
                    )}
                    {rental.returnFee > 0 && (
                        <div className="flex justify-between">
                            <span>Frete Devolução:</span>
                            <span>R$ {rental.returnFee.toFixed(2)}</span>
                        </div>
                    )}
                    {rental.discount > 0 && (
                        <div className="flex justify-between text-green-600">
                            <span>Desconto:</span>
                            <span>- R$ {rental.discount.toFixed(2)}</span>
                        </div>
                    )}
                    <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2">
                        <span>Total:</span>
                        <span>R$ {rental.totalAmount.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            {/* Terms */}
            <div className="text-xs text-justify text-gray-500 mb-12 leading-relaxed">
                <p className="mb-2">1. O LOCATÁRIO declara ter recebido os equipamentos em perfeito estado de conservação e funcionamento.</p>
                <p className="mb-2">2. O LOCATÁRIO se compromete a devolver os equipamentos na data estipulada, sob pena de cobrança de diárias adicionais.</p>
                <p className="mb-2">3. Em caso de dano ou perda, o LOCATÁRIO arcará com os custos de reparo ou reposição conforme tabela vigente.</p>
                <p>4. Este contrato serve como título executivo extrajudicial.</p>
            </div>

            {/* Signatures */}
            <div className="grid grid-cols-2 gap-16 mt-16">
                <div className="text-center pt-8 border-t border-black">
                    <p className="font-bold">Locnos Equipamentos</p>
                    <p className="text-xs text-gray-500">Locador</p>
                </div>
                <div className="text-center pt-8 border-t border-black">
                    <p className="font-bold">{person.name}</p>
                    <p className="text-xs text-gray-500">Locatário</p>
                </div>
            </div>

            <div className="text-center mt-12 text-xs text-gray-400">
                Impresso em {format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
            </div>
        </div>
    )
}
