import Link from 'next/link'

export default function DashboardPage() {
    return (
        <div className="container mx-auto py-8">
            <h1 className="text-3xl font-bold mb-8">Dashboard Overview</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded shadow">
                    <h2 className="text-xl font-semibold mb-2">Routing</h2>
                    <p className="text-gray-600 mb-4">Plan and optimize delivery routes.</p>
                    <Link href="/dashboard/routing" className="text-blue-600 hover:underline">
                        Go to Routing &rarr;
                    </Link>
                </div>
                {/* Add more dashboard widgets here */}
            </div>
        </div>
    )
}
