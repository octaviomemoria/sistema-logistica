import Link from 'next/link'

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="min-h-screen flex flex-col">
            <header className="bg-white shadow p-4">
                <div className="container mx-auto flex justify-between items-center">
                    <Link href="/dashboard" className="text-xl font-bold text-blue-600">
                        Locnos Dashboard
                    </Link>
                    <nav className="space-x-4">
                        <Link href="/dashboard" className="text-gray-600 hover:text-blue-600">Overview</Link>
                        <Link href="/dashboard/routing" className="text-gray-600 hover:text-blue-600">Routing</Link>
                        {/* Add more links here */}
                    </nav>
                </div>
            </header>
            <main className="flex-grow bg-gray-50">
                {children}
            </main>
        </div>
    )
}
