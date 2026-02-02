"use client"

import { useState, useEffect } from "react"
import { ChevronRight, ChevronDown, Folder, Home, Image as ImageIcon, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export function VillageHierarchy() {
  const [villages, setVillages] = useState<any[]>([])
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchVillages()
  }, [])

  const fetchVillages = async () => {
    try {
      const res = await fetch("/api/villages")
      if (res.ok) setVillages(await res.json())
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const toggle = (id: string) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }))
  }

  if (loading) return <Loader2 className="animate-spin mx-auto" />

  return (
    <div className="space-y-2">
      {villages.map(v => (
        <VillageItem key={v.id} village={v} expanded={expanded} toggle={toggle} />
      ))}
    </div>
  )
}

function VillageItem({ village, expanded, toggle }: any) {
  const [subVillages, setSubVillages] = useState<any[]>([])
  const isExpanded = expanded[`v-${village.id}`]

  useEffect(() => {
    if (isExpanded && subVillages.length === 0) {
      fetch(`/api/sub-villages?villageId=${village.id}`)
        .then(res => res.json())
        .then(setSubVillages)
    }
  }, [isExpanded])

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-card/30">
      <button 
        onClick={() => toggle(`v-${village.id}`)}
        className="w-full flex items-center gap-3 p-4 hover:bg-secondary/30 transition-colors"
      >
        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        <Folder className="w-4 h-4 text-primary" />
        <span className="font-bold uppercase text-sm tracking-tight">{village.name}</span>
      </button>
      {isExpanded && (
        <div className="pl-8 pr-4 pb-4 space-y-2 border-t border-border/50 pt-2">
          {subVillages.map(sv => (
            <SubVillageItem key={sv.id} subVillage={sv} expanded={expanded} toggle={toggle} />
          ))}
          {subVillages.length === 0 && <p className="text-[10px] text-muted-foreground uppercase py-2">Belum ada dusun</p>}
        </div>
      )}
    </div>
  )
}

function SubVillageItem({ subVillage, expanded, toggle }: any) {
  const [houses, setHouses] = useState<any[]>([])
  const isExpanded = expanded[`sv-${subVillage.id}`]

  useEffect(() => {
    if (isExpanded && houses.length === 0) {
      fetch(`/api/houses?subVillageId=${subVillage.id}`)
        .then(res => res.json())
        .then(setHouses)
    }
  }, [isExpanded])

  return (
    <div className="border border-border/50 rounded-md bg-background/50">
      <button 
        onClick={() => toggle(`sv-${subVillage.id}`)}
        className="w-full flex items-center gap-3 p-3 hover:bg-secondary/20 transition-colors"
      >
        {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        <Folder className="w-3 h-3 text-primary/70" />
        <span className="font-semibold text-xs tracking-tight">{subVillage.name}</span>
      </button>
      {isExpanded && (
        <div className="pl-8 pr-3 pb-3 space-y-1 pt-1">
          {houses.map(h => (
            <HouseItem key={h.id} house={h} />
          ))}
          {houses.length === 0 && <p className="text-[9px] text-muted-foreground uppercase py-1">Belum ada rumah</p>}
        </div>
      )}
    </div>
  )
}

function HouseItem({ house }: any) {
  const [photoCount, setPhotoCount] = useState(0)
  const router = useRouter()

  useEffect(() => {
    fetch(`/api/photos/list?houseId=${house.id}`)
      .then(res => res.json())
      .then(data => setPhotoCount(data.photos?.length || 0))
  }, [house.id])

  return (
    <div 
      onClick={() => router.push(`/survey/house/${house.id}`)}
      className="flex items-center justify-between p-2 rounded hover:bg-secondary/40 transition-colors cursor-pointer"
    >
      <div className="flex items-center gap-2">
        <Home className="w-3 h-3 text-muted-foreground" />
        <span className="text-xs">{house.name}</span>
      </div>
      <div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-bold">
        <ImageIcon className="w-3 h-3" />
        {photoCount}
      </div>
    </div>
  )
}
