"use client"
import { useRef, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Camera, X, Check } from "lucide-react"

interface CameraCaptureProps {
  onCapture: (blob: Blob) => void
  onCancel: () => void
}

export function CameraCapture({ onCapture, onCancel }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<string>("")

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        })

        if (videoRef.current) {
          videoRef.current.srcObject = stream
          setIsReady(true)
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Tidak bisa akses kamera"
        setError(errorMsg)
        console.error("[v0] Camera error:", err)
      }
    }

    startCamera()

    return () => {
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
        tracks.forEach((track) => track.stop())
      }
    }
  }, [])

  const handleCapture = async () => {
    if (!videoRef.current || !canvasRef.current) return

    const context = canvasRef.current.getContext("2d")
    if (!context) return

    canvasRef.current.width = videoRef.current.videoWidth
    canvasRef.current.height = videoRef.current.videoHeight

    context.drawImage(videoRef.current, 0, 0)

    canvasRef.current.toBlob(
      (blob) => {
        if (blob) {
          onCapture(blob)
        }
      },
      "image/jpeg",
      0.9,
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
        <p className="text-red-700 mb-2">Gagal akses kamera: {error}</p>
        <Button onClick={onCancel} variant="outline">
          Batal
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="relative bg-black rounded-3xl overflow-hidden aspect-[4/3] sm:aspect-video shadow-2xl ring-1 ring-white/10">
        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
        <canvas ref={canvasRef} className="hidden" />

        <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/60 to-transparent flex justify-center">
           <div className="flex items-center gap-2 px-3 py-1 bg-black/40 backdrop-blur-md rounded-full border border-white/10 text-[10px] text-white font-bold uppercase tracking-widest">
             <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
             Live Camera Feed
           </div>
        </div>

        {!isReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/90 backdrop-blur-sm">
            <div className="text-white text-center">
              <div className="animate-spin mb-4">
                <Camera className="w-10 h-10 mx-auto text-primary" />
              </div>
              <p className="font-bold tracking-tight">Initializing Sensor...</p>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Button 
          onClick={onCancel} 
          variant="outline" 
          size="lg"
          className="rounded-2xl border-2 font-bold"
        >
          <X className="w-5 h-5" />
          BATAL
        </Button>
        <Button 
          onClick={handleCapture} 
          disabled={!isReady} 
          size="lg"
          className="rounded-2xl font-black shadow-xl shadow-primary/20"
        >
          <Camera className="w-5 h-5" />
          AMBIL FOTO
        </Button>
      </div>
    </div>
  )
}
