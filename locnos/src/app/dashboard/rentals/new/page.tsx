import RentalForm from '@/components/rentals/RentalForm'

export default function NewRentalPage() {
    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Nova Locação</h1>
            <RentalForm />
        </div>
    )
}
