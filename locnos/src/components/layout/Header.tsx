'use client'

import { useState, useEffect, useRef } from 'react'
import { Menu, Bell, Search, X, Loader2 } from 'lucide-react'
import { globalSearch, SearchResult } from '@/app/dashboard/actions/search'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface HeaderProps {
    onMenuClick: () => void
}

export default function Header({ onMenuClick }: HeaderProps) {
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<SearchResult[]>([])
    const [loading, setLoading] = useState(false)
    const [open, setOpen] = useState(false)
    const router = useRouter()
    const wrapperRef = useRef<HTMLDivElement>(null)

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (query.length >= 2) {
                setLoading(true)
                const res = await globalSearch(query)
                setResults(res)
                setLoading(false)
                setOpen(true)
            } else {
                setResults([])
                setOpen(false)
            }
        }, 300)

        return () => clearTimeout(timer)
    }, [query])

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [wrapperRef])

    const handleSelect = (url: string) => {
        setOpen(false)
        setQuery('')
        router.push(url)
    }

    return (
        <header className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-30">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={onMenuClick} className="lg:hidden text-gray-600">
                        <Menu size={24} />
                    </button>
                    <h1 className="text-2xl font-bold text-gray-800 hidden md:block">Dashboard</h1>
                </div>

                <div className="flex items-center gap-4 flex-1 justify-end md:justify-end max-w-xl">
                    {/* Global Search */}
                    <div ref={wrapperRef} className="relative w-full max-w-md">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Buscar locações, pessoas, itens..."
                                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onFocus={() => query.length >= 2 && setOpen(true)}
                            />
                            <div className="absolute left-3 top-2.5 text-gray-400">
                                {loading ? <Loader2 size={20} className="animate-spin text-blue-500" /> : <Search size={20} />}
                            </div>
                            {query && (
                                <button
                                    onClick={() => { setQuery(''); setOpen(false); }}
                                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                                >
                                    <X size={16} />
                                </button>
                            )}
                        </div>

                        {/* Dropdown Results */}
                        {open && (
                            <div className="absolute top-full mt-2 w-full bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden py-1 max-h-96 overflow-y-auto">
                                {results.length > 0 ? (
                                    <>
                                        {results.map((res) => (
                                            <button
                                                key={res.id + res.type}
                                                onClick={() => handleSelect(res.url)}
                                                className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 border-b border-gray-50 last:border-0"
                                            >
                                                <div className={`p-2 rounded-lg shrink-0 ${res.type === 'RENTAL' ? 'bg-blue-100 text-blue-600' :
                                                    res.type === 'PERSON' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'
                                                    }`}>
                                                    {res.type === 'RENTAL' ? <LinkIcon size={16} /> : res.type === 'PERSON' ? <User size={16} /> : <Package size={16} />}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-sm text-gray-800">{res.title}</p>
                                                    <p className="text-xs text-gray-500">{res.subtitle}</p>
                                                </div>
                                            </button>
                                        ))}
                                    </>
                                ) : (
                                    <div className="px-4 py-8 text-center text-gray-500 text-sm">
                                        Nenhum resultado encontrado.
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <button className="relative text-gray-600 hover:text-gray-800 shrink-0">
                        <Bell size={22} />
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">3</span>
                    </button>
                </div>
            </div>
        </header>
    )
}

// Icon helpers to avoid import issues inside component if needed
import { Package, User, Link as LinkIcon } from 'lucide-react'
