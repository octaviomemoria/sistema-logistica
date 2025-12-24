import { prisma } from '@/lib/prisma'
import EquipmentForm from '@/components/inventory/EquipmentForm'
import { notFound } from 'next/navigation'

export default async function EditEquipmentPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const equipment = await prisma.equipment.findUnique({
        where: { id: params.id }
    })

    if (!equipment) {
        notFound()
    }

    // Convert keys to expected format for the form if needed
    // Prisma returns Json types as basic objects, we cast them in Form or here.
    const initialData = {
        ...equipment,
        rentalPeriods: equipment.rentalPeriods as any,
        specifications: equipment.specifications as any,
        externalLinks: equipment.externalLinks as string[]
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Editar Equipamento</h1>
            <p className="text-gray-600 mb-8">Atualize as informações do equipamento.</p>
            <EquipmentForm initialData={initialData} isEditing={true} />
        </div>
    )
}
