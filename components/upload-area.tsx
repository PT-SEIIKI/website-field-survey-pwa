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
      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
        isDragActive ? "border-blue-500 bg-blue-50" : "border-border bg-muted/20"
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

      <div className="space-y-4">
        <div className="flex justify-center">
          <div className="p-4 bg-blue-100 rounded-full">
            <ImageIcon className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div>
          <p className="text-lg font-medium mb-1">Pilih atau Drag Foto</p>
          <p className="text-sm text-muted-foreground">
            Pilih satu atau lebih foto untuk di-upload ({isDragActive ? "Lepaskan di sini" : "atau drag ke sini"})
          </p>
        </div>

        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
          className="gap-2 bg-blue-600 hover:bg-blue-700"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Memproses...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              Pilih Foto
            </>
          )}
        </Button>

        <p className="text-xs text-muted-foreground">Format: JPG, PNG, WebP | Max size: 50MB per file</p>
      </div>
    </div>
  )
}
