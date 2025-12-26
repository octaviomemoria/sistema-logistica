'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, MapPin, Loader2, X } from 'lucide-react'

interface AddressAutocompleteProps {
    value: string
    onChange: (value: string) => void
    placeholder?: string
    className?: string
}

interface NominatimResult {
    place_id: number
    display_name: string
    lat: string
    lon: string
}

export default function AddressAutocomplete({ value, onChange, placeholder = 'Buscar endereço...', className = '' }: AddressAutocompleteProps) {
    const [suggestions, setSuggestions] = useState<NominatimResult[]>([])
    const [loading, setLoading] = useState(false)
    const [isOpen, setIsOpen] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)
    const [inputValue, setInputValue] = useState(value)

    // Ref to track if we should skip the next fetch (e.g. valid selection or sync)
    const skipFetch = useRef(false)

    const [userLocation, setUserLocation] = useState<{ lat: number, lon: number } | null>(null)

    // Sync external value changes
    useEffect(() => {
        if (value !== inputValue) {
            setInputValue(value)
            skipFetch.current = true // Don't fetch when parent updates us
        }
    }, [value])

    // Get User Location for Proximity Bias
    useEffect(() => {
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setUserLocation({
                        lat: position.coords.latitude,
                        lon: position.coords.longitude
                    })
                },
                (error) => {
                    console.log('Location access denied or error:', error.message)
                }
            )
        }
    }, [])

    // Debounce logic
    useEffect(() => {
        const timer = setTimeout(() => {
            if (skipFetch.current) {
                skipFetch.current = false
                return
            }

            if (inputValue && inputValue.length > 3) {
                fetchSuggestions(inputValue)
            }
        }, 800)

        return () => clearTimeout(timer)
    }, [inputValue])

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

    const fetchSuggestions = async (query: string) => {
        console.log('Fetching address suggestions for:', query)
        setLoading(true)
        try {
            let url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=br&limit=5`

            // Add location bias if available (approx 50km bounding box)
            if (userLocation) {
                const delta = 0.5 // Roughly 50km
                const viewbox = [
                    userLocation.lon - delta, // left
                    userLocation.lat + delta, // top
                    userLocation.lon + delta, // right
                    userLocation.lat - delta  // bottom
                ].join(',')
                url += `&viewbox=${viewbox}&bounded=0`
                console.log('Using location bias:', viewbox)
            }

            const response = await fetch(url, {
                headers: {
                    'User-Agent': 'LocnosApp/1.0'
                }
            })
            if (!response.ok) throw new Error('Network response was not ok')

            const data = await response.json()
            console.log('Address suggestions:', data)
            setSuggestions(data)
            setIsOpen(true)
        } catch (error) {
            console.error('Error fetching address:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSelect = (result: NominatimResult) => {
        console.log('Selected address:', result.display_name)
        skipFetch.current = true // Don't fetch on selection
        onChange(result.display_name)
        setInputValue(result.display_name)
        setIsOpen(false)
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // User typed, so we DO want to fetch (unless it's short)
        // skipFetch is false by default
        setInputValue(e.target.value)
        onChange(e.target.value)
    }

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            <div className="relative">
                <MapPin className="absolute left-3 top-2.5 text-gray-400" size={16} />
                <input
                    type="text"
                    className="input pl-9 pr-8"
                    value={inputValue}
                    onChange={handleChange}
                    placeholder={placeholder}
                    onFocus={() => inputValue.length > 3 && setIsOpen(true)}
                />
                {loading ? (
                    <div className="absolute right-3 top-2.5">
                        <Loader2 size={16} className="animate-spin text-blue-600" />
                    </div>
                ) : (
                    inputValue && (
                        <button
                            type="button"
                            onClick={() => {
                                setInputValue('')
                                onChange('')
                                setSuggestions([])
                            }}
                            className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                        >
                            <X size={16} />
                        </button>
                    )
                )}
            </div>

            {isOpen && suggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {suggestions.map((result) => (
                        <button
                            key={result.place_id}
                            className="w-full text-left px-4 py-2 hover:bg-gray-50 border-b last:border-0 text-sm flex items-start gap-2"
                            onClick={() => handleSelect(result)}
                            type="button"
                        >
                            <MapPin size={14} className="mt-1 text-gray-400 flex-shrink-0" />
                            <span className="text-gray-700 line-clamp-2">{result.display_name}</span>
                        </button>
                    ))}
                    <div className="bg-gray-50 px-2 py-1 flex justify-end">
                        <span className="text-[10px] text-gray-400">Powered by OSM Nominatim</span>
                    </div>
                </div>
            )}
        </div>
    )
}
