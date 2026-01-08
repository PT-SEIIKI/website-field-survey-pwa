"use client"

import type React from "react"
import { useRef, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Upload, ImageIcon, Loader2 } from "lucide-react"

interface UploadAreaProps {
  onFilesSelected: (files: File[]) => void
  isLoading?: boolean
}

export function UploadArea({ onFilesSelected, isLoading = false }: UploadAreaProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragActive, setIsDragActive] = useState(false)

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true)
    } else if (e.type === "dragleave") {
      setIsDragActive(false)
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragActive(false)

      const files = Array.from(e.dataTransfer.files).filter((file) => file.type.startsWith("image/"))

      if (files.length > 0) {
        onFilesSelected(files)
      }
    },
    [onFilesSelected],
  )

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)
      onFilesSelected(files)
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  return (
    <div
      className={`border-2 border-dashed rounded-2xl p-6 sm:p-12 text-center transition-all duration-300 ${
        isDragActive 
          ? "border-primary bg-primary/5 scale-[0.99] shadow-inner" 
          : "border-primary/10 bg-muted/20 hover:border-primary/20 hover:bg-muted/30"
      }`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <Input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        className="hidden"
        onChange={handleChange}
        disabled={isLoading}
      />

      <div className="space-y-6">
        <div className="flex justify-center">
          <div className="p-5 bg-primary/10 rounded-3xl text-primary animate-in zoom-in duration-500">
            <ImageIcon className="w-10 h-10" />
          </div>
        </div>

        <div className="max-w-xs mx-auto">
          <p className="text-xl font-black tracking-tight mb-2">Pilih atau Drag Foto</p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {isDragActive 
              ? "Lepaskan untuk mulai upload" 
              : "Ambil satu atau beberapa foto bukti survei Anda"}
          </p>
        </div>

        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
          size="lg"
          className="gap-3 px-8 shadow-xl active:scale-95"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Memproses...
            </>
          ) : (
            <>
              <Upload className="w-5 h-5" />
              PILIH DARI GALERI
            </>
          )}
        </Button>

        <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground/60">
          JPG • PNG • WEBP | MAX 10MB
        </p>
      </div>
    </div>
  )
}
