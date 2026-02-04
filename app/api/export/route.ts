import { NextResponse } from "next/server"
import { storage } from "@/server/storage"

export async function GET() {
  try {
    console.log("📊 [Export API] Starting data export...")
    
    // Get all villages with their sub-villages, houses, and folders
    const villages = await storage.getVillages()
    const subVillages = await storage.getSubVillages()
    const houses = await storage.getHouses()
    const folders = await storage.getFolders()
    
    console.log(`📊 [Export API] Fetched: ${villages.length} villages, ${subVillages.length} sub-villages, ${houses.length} houses, ${folders.length} folders`)
    
    // Build hierarchy data
    const exportData: any[] = []
    
    for (const house of houses) {
      // Find related data
      const subVillage = subVillages.find((sv: any) => sv.id === house.subVillageId)
      const village = subVillage ? villages.find((v: any) => v.id === subVillage.villageId) : null
      const houseFolders = folders.filter((f: any) => f.houseId === house.id)
      
      // Get all photos for this house
      const housePhotos = await storage.getPhotosByHouseId(house.id)
      
      console.log(`📊 [Export API] House ${house.name} (${house.id}): ${housePhotos.length} photos`)
      
      // Create photo links
      const photoLinks = housePhotos.map((photo: any) => {
        console.log(`📸 [Export API] Photo: ${photo.url}`)
        return `https://survei.seyiki.com${photo.url}`
      }).join(', ')
      
      console.log(`🔗 [Export API] Photo links for ${house.name}: ${photoLinks}`)
      
      // Add to export data
      exportData.push({
        "nama desa": village?.name || "-",
        "nama dusun": subVillage?.name || "-",
        "nama rumah": house.name || "-",
        "nama pemilik": house.ownerName || "-",
        "nik": house.nik || "-",
        "alamat": house.address || "-",
        "poto": photoLinks || "-"
      })
    }
    
    console.log(`📊 [Export API] Generated ${exportData.length} records for export`)
    
    return NextResponse.json({
      success: true,
      data: exportData,
      total: exportData.length
    })
    
  } catch (error) {
    console.error("❌ [Export API] Error:", error)
    return NextResponse.json(
      { 
        success: false, 
        message: "Failed to export data",
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}
