'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, ChevronDown, Check, X } from 'lucide-react'

interface Option {
    label: string
    value: string
    subLabel?: string
}

interface SearchableSelectProps {
    options: Option[]
    value: string
    onChange: (value: string) => void
    placeholder?: string
    className?: string
    disabled?: boolean
}

export default function SearchableSelect({
    options,
    value,
    onChange,
    placeholder = 'Selecione...',
    className = '',
    disabled = false
}: SearchableSelectProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const containerRef = useRef<HTMLDivElement>(null)

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // Filter options
    const filteredOptions = options.filter(option =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (option.subLabel && option.subLabel.toLowerCase().includes(searchTerm.toLowerCase()))
    )

    const selectedOption = options.find(o => o.value === value)

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            {/* Trigger Button */}
            <div
                className={`flex items-center justify-between w-full p-2 border rounded-lg bg-white cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-blue-500'}`}
                onClick={() => !disabled && setIsOpen(!isOpen)}
            >
                <div className="flex-1 min-w-0 pr-2">
                    {selectedOption ? (
                        <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-900 truncate">{selectedOption.label}</span>
                            {selectedOption.subLabel && (
                                <span className="text-xs text-gray-500 truncate">{selectedOption.subLabel}</span>
                            )}
                        </div>
                    ) : (
                        <span className="text-sm text-gray-400">{placeholder}</span>
                    )}
                </div>
                <ChevronDown size={16} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
                    {/* Search Input */}
                    <div className="p-2 border-b">
                        <div className="relative">
                            <Search size={14} className="absolute left-2 top-2.5 text-gray-400" />
                            <input
                                autoFocus
                                className="w-full pl-8 pr-2 py-1.5 text-sm border rounded bg-gray-50 focus:outline-none focus:border-blue-500"
                                placeholder="Buscar..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Options List */}
                    <div className="max-h-60 overflow-y-auto">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map(option => (
                                <div
                                    key={option.value}
                                    className={`px-3 py-2 cursor-pointer hover:bg-blue-50 flex items-center justify-between ${option.value === value ? 'bg-blue-50' : ''}`}
                                    onClick={() => {
                                        onChange(option.value)
                                        setIsOpen(false)
                                        setSearchTerm('')
                                    }}
                                >
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm ${option.value === value ? 'font-bold text-blue-700' : 'text-gray-700'}`}>
                                            {option.label}
                                        </p>
                                        {option.subLabel && (
                                            <p className="text-xs text-gray-500 truncate">{option.subLabel}</p>
                                        )}
                                    </div>
                                    {option.value === value && <Check size={16} className="text-blue-600" />}
                                </div>
                            ))
                        ) : (
                            <div className="p-4 text-center text-sm text-gray-500">
                                Nenhum resultado encontrado
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
