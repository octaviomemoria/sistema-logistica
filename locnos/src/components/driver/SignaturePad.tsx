'use client'

import { useRef, useEffect } from 'react'
import SignatureCanvas from 'react-signature-canvas'
import { Eraser } from 'lucide-react'

interface SignaturePadProps {
    onEnd: (data: string) => void
}

export default function SignaturePad({ onEnd }: SignaturePadProps) {
    const padRef = useRef<SignatureCanvas>(null)

    const clear = () => {
        padRef.current?.clear()
        onEnd('')
    }

    // Resize handling for mobile
    useEffect(() => {
        const resizeCanvas = () => {
            const canvas = padRef.current?.getCanvas()
            if (canvas) {
                const ratio = Math.max(window.devicePixelRatio || 1, 1)
                canvas.width = canvas.offsetWidth * ratio
                canvas.height = canvas.offsetHeight * ratio
                canvas.getContext('2d')?.scale(ratio, ratio)
                padRef.current?.clear() // Clearing on resize to avoid distortion
            }
        }

        window.addEventListener('resize', resizeCanvas)
        return () => window.removeEventListener('resize', resizeCanvas)
    }, [])

    return (
        <div className="border rounded-lg overflow-hidden bg-gray-50 relative">
            <SignatureCanvas
                ref={padRef}
                penColor="black"
                canvasProps={{
                    className: 'w-full h-40 bg-white cursor-crosshair'
                }}
                onEnd={() => onEnd(padRef.current?.toDataURL() || '')}
            />
            <button
                type="button"
                onClick={clear}
                className="absolute top-2 right-2 p-1.5 bg-gray-200 rounded-full text-gray-600 hover:bg-gray-300"
            >
                <Eraser size={16} />
            </button>
        </div>
    )
}
