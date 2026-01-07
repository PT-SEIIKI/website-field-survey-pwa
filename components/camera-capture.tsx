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
    <div className="space-y-4">
      <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
        <canvas ref={canvasRef} className="hidden" />

        {!isReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80">
            <div className="text-white text-center">
              <div className="animate-spin mb-2">
                <Camera className="w-8 h-8 mx-auto" />
              </div>
              <p>Mengakses kamera...</p>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Button onClick={onCancel} variant="outline" className="flex-1 gap-2 bg-transparent">
          <X className="w-4 h-4" />
          Batal
        </Button>
        <Button onClick={handleCapture} disabled={!isReady} className="flex-1 gap-2 bg-blue-600 hover:bg-blue-700">
          <Check className="w-4 h-4" />
          Ambil Foto
        </Button>
      </div>
    </div>
  )
}
