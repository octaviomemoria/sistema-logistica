import { Inter } from 'next/font/google'
import '@/app/globals.css'
import { Toaster } from "@/components/ui/toaster"
import { LogOut, Truck } from 'lucide-react'
import Link from 'next/link'

const inter = Inter({ subsets: ['latin'] })

export default function DriverLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className={`min-h-screen bg-gray-50 ${inter.className}`}>
            {/* Mobile Header */}
            <header className="bg-blue-600 text-white p-4 sticky top-0 z-10 shadow-md">
                <div className="flex justify-between items-center max-w-lg mx-auto">
                    <Link href="/driver" className="flex items-center gap-2 font-bold text-lg">
                        <Truck className="h-6 w-6" />
                        <span>Locnos Driver</span>
                    </Link>
                    <Link href="/" className="p-2 hover:bg-blue-700 rounded-full">
                        <LogOut size={20} />
                    </Link>
                </div>
            </header>

            <main className="max-w-lg mx-auto p-4 pb-20">
                {children}
            </main>

            <Toaster />
        </div>
    )
}
