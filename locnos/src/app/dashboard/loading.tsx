import LoadingSpinner from '@/components/ui/loading-spinner'

export default function Loading() {
    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
                <LoadingSpinner size="lg" />
                <p className="mt-4 text-gray-600">Carregando...</p>
            </div>
        </div>
    )
}
