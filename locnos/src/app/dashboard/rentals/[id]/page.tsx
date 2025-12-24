import { getRentalById } from '../actions'
import RentalForm from '@/components/rentals/RentalForm'

export default async function EditRentalPage({ params }: { params: { id: string } }) {
    const { id } = await params
    const { rental } = await getRentalById(id)

    if (!rental) {
        return <div className="p-6">Locação não encontrada</div>
    }

    return (
        <div className="p-6">
            <RentalForm initialData={rental} />
        </div>
    )
}
