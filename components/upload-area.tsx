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
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  return (
    <div
      className={`relative group rounded-2xl border-2 border-dashed transition-all duration-300 ${
        isDragActive 
          ? "border-foreground bg-secondary/50 shadow-inner" 
          : "border-border bg-secondary/20 hover:border-foreground/20 hover:bg-secondary/30"
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

      <div className="p-10 sm:p-20 flex flex-col items-center text-center space-y-8">
        <div className="w-16 h-16 rounded-full bg-background border border-border flex items-center justify-center text-muted-foreground group-hover:text-foreground transition-colors group-hover:scale-110 duration-500 shadow-sm">
          <ImageIcon className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h4 className="text-xl font-bold tracking-tight uppercase">Upload Proof</h4>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            {isDragActive 
              ? "Drop photos here to begin sync" 
              : "Drag and drop or select photos from your device library."}
          </p>
        </div>

        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
          variant="outline"
          size="lg"
          className="rounded-full px-8 h-12 border-border font-bold uppercase tracking-widest text-[11px] hover:bg-foreground hover:text-background transition-all"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Processing
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Select Photos
            </>
          )}
        </Button>

        <div className="flex gap-4 text-[9px] font-bold uppercase tracking-widest text-muted-foreground/50">
          <span>JPG • PNG • WEBP</span>
          <span>MAX 10MB</span>
        </div>
      </div>
    </div>
  )
}
