import PersonForm from '@/components/persons/PersonForm'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function NewPersonPage() {
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
                <h1 className="text-3xl font-bold text-gray-900">Nova Pessoa</h1>
                <p className="text-gray-600 mt-2">Cadastre uma nova pessoa no sistema</p>
            </div>

            <PersonForm />
        </div>
    )
}
