import PersonForm from '@/components/persons/PersonForm'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getPersonById } from '../../actions'
import { notFound } from 'next/navigation'

export default async function EditPersonPage({ params }: { params: { id: string } }) {
    const result = await getPersonById(params.id)

    if (!result.success || !result.person) {
        notFound()
    }

    return (
        <div className="p-6">
            <div className="mb-6">
                <Link
                    href="/dashboard/persons"
                    className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                    <ArrowLeft size={20} />
                    Voltar para Pessoas
                </Link>
            </div>

            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Editar Pessoa</h1>
                <p className="text-gray-600 mt-2">Atualize os dados de {result.person.name}</p>
            </div>

            <PersonForm initialData={result.person} isEditing />
        </div>
    )
}
