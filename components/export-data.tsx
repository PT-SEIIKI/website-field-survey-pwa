"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Download, FileSpreadsheet, FileText, Loader2 } from "lucide-react"
import * as XLSX from "xlsx"

export function ExportData() {
  const [isExporting, setIsExporting] = useState(false)

  const handleDownload = async (format: 'xlsx' | 'csv') => {
    setIsExporting(true)
    try {
      const response = await fetch("/api/export")
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.message || "Failed to fetch data")
      }

      const exportData = result.data.map((item: any) => ({
        "nama desa": item["nama desa"],
        "nama dusun": item["nama dusun"],
        "nama rumah": item["nama rumah"],
        "nama pemilik": item["nama pemilik"],
        "nik": item["nik"],
        "alamat": item["alamat"],
        "poto": item["poto"]
      }))

      const worksheet = XLSX.utils.json_to_sheet(exportData)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, "Data Survey")

      if (format === 'xlsx') {
        XLSX.writeFile(workbook, "data_survey.xlsx")
      } else {
        XLSX.writeFile(workbook, "data_survey.csv", { bookType: 'csv' })
      }
    } catch (error) {
      console.error("Export error:", error)
      alert("Gagal mengekspor data: " + (error instanceof Error ? error.message : String(error)))
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h4 className="font-bold text-lg tracking-tight uppercase">Ekspor Data</h4>
        <p className="text-xs text-muted-foreground leading-relaxed">Unduh semua data survey dalam format Excel atau CSV.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Button 
          onClick={() => handleDownload('xlsx')} 
          disabled={isExporting}
          className="h-12 gap-2"
        >
          {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
          Download Excel
        </Button>
        <Button 
          variant="outline"
          onClick={() => handleDownload('csv')} 
          disabled={isExporting}
          className="h-12 gap-2"
        >
          {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
          Download CSV
        </Button>
      </div>
    </div>
  )
}
