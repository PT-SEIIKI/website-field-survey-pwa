"use client";

import { useState, useEffect } from "react";
import {
  ChevronRight,
  ChevronDown,
  Folder,
  Home,
  Image as ImageIcon,
  Loader2,
  Edit2,
  Trash2,
  X,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

export function VillageHierarchy() {
  const [villages, setVillages] = useState<any[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const router = useRouter();

  useEffect(() => {
    fetchVillages();
  }, []);

  const fetchVillages = async () => {
    try {
      const res = await fetch("/api/villages");
      if (res.ok)
        setVillages(
          (await res.json()).map((v: any) => ({ ...v, id: String(v.id) })),
        );
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const toggle = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const deleteVillage = async (id: string) => {
    if (confirm("Hapus desa ini? Semua data dusun dan rumah akan terhapus.")) {
      try {
        const res = await fetch(`/api/villages/${id}`, { method: "DELETE" });
        if (res.ok) {
          setVillages((prev) => prev.filter((v) => String(v.id) !== id));
        }
      } catch (error) {
        console.error("Error deleting village:", error);
      }
    }
  };

  const updateVillage = async (id: string, newName: string) => {
    try {
      const res = await fetch(`/api/villages/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName }),
      });
      if (res.ok) {
        setVillages((prev) =>
          prev.map((v) => (String(v.id) === id ? { ...v, name: newName } : v))
        );
      }
    } catch (error) {
      console.error("Error updating village:", error);
    }
  };

  const totalPages = Math.ceil(villages.length / itemsPerPage);
  const paginatedVillages = villages.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  if (loading) return <Loader2 className="animate-spin mx-auto" />;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {paginatedVillages.map((v) => (
          <VillageItem
            key={v.id}
            village={v}
            expanded={expanded}
            toggle={toggle}
            deleteVillage={deleteVillage}
            updateVillage={updateVillage}
          />
        ))}
      </div>
      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                className={
                  currentPage === 1
                    ? "pointer-events-none opacity-50"
                    : "cursor-pointer"
                }
              />
            </PaginationItem>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <PaginationItem key={page}>
                <PaginationLink
                  onClick={() => setCurrentPage(page)}
                  isActive={currentPage === page}
                  className="cursor-pointer"
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                className={
                  currentPage === totalPages
                    ? "pointer-events-none opacity-50"
                    : "cursor-pointer"
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}

function VillageItem({ village, expanded, toggle, deleteVillage, updateVillage }: any) {
  const [subVillages, setSubVillages] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(village.name);
  const isExpanded = expanded[`v-${village.id}`];

  useEffect(() => {
    if (isExpanded && subVillages.length === 0) {
      fetch(`/api/sub-villages?villageId=${village.id}`)
        .then((res) => res.json())
        .then(setSubVillages);
    }
  }, [isExpanded]);

  const handleSave = () => {
    if (editName.trim() && editName !== village.name) {
      updateVillage(village.id, editName.trim());
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditName(village.name);
    setIsEditing(false);
  };

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-card/30">
      <div className="flex items-center gap-3 p-4">
        <button
          onClick={() => toggle(`v-${village.id}`)}
          className="flex items-center gap-3 flex-1 hover:bg-secondary/30 transition-colors -ml-3 -my-2 p-2"
        >
          {isExpanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
          <Folder className="w-4 h-4 text-primary" />
          {isEditing ? (
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="h-7 text-sm font-bold uppercase tracking-tight bg-background border-border"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
                if (e.key === "Escape") handleCancel();
              }}
            />
          ) : (
            <span className="font-bold uppercase text-sm tracking-tight">
              {village.name}
            </span>
          )}
        </button>
        
        <div className="flex items-center gap-1">
          {isEditing ? (
            <>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0 text-green-600 hover:text-green-700"
                onClick={handleSave}
              >
                <Check className="w-3 h-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0 text-red-600 hover:text-red-700"
                onClick={handleCancel}
              >
                <X className="w-3 h-3" />
              </Button>
            </>
          ) : (
            <>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                onClick={() => setIsEditing(true)}
              >
                <Edit2 className="w-3 h-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                onClick={() => deleteVillage(village.id)}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </>
          )}
        </div>
      </div>
      {isExpanded && (
        <div className="pl-8 pr-4 pb-4 space-y-2 border-t border-border/50 pt-2">
          {subVillages.map((sv) => (
            <SubVillageItem
              key={sv.id}
              subVillage={sv}
              expanded={expanded}
              toggle={toggle}
            />
          ))}
          {subVillages.length === 0 && (
            <p className="text-[10px] text-muted-foreground uppercase py-2">
              Belum ada dusun
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function SubVillageItem({ subVillage, expanded, toggle }: any) {
  const [houses, setHouses] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(subVillage.name);
  const isExpanded = expanded[`sv-${subVillage.id}`];

  useEffect(() => {
    if (isExpanded && houses.length === 0) {
      fetch(`/api/houses?subVillageId=${subVillage.id}`)
        .then((res) => res.json())
        .then(setHouses);
    }
  }, [isExpanded]);

  const handleSave = async () => {
    if (editName.trim() && editName !== subVillage.name) {
      try {
        const res = await fetch(`/api/sub-villages/${subVillage.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: editName.trim() }),
        });
        if (res.ok) {
          subVillage.name = editName.trim();
        }
      } catch (error) {
        console.error("Error updating sub-village:", error);
      }
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditName(subVillage.name);
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (confirm("Hapus dusun ini? Semua data rumah akan terhapus.")) {
      fetch(`/api/sub-villages/${subVillage.id}`, { method: "DELETE" })
        .then((res) => {
          if (res.ok) {
            // Refresh parent component
            window.location.reload();
          }
        })
        .catch(console.error);
    }
  };

  return (
    <div className="border border-border/50 rounded-md bg-background/50">
      <div className="flex items-center gap-3 p-3">
        <button
          onClick={() => toggle(`sv-${subVillage.id}`)}
          className="flex items-center gap-3 flex-1 hover:bg-secondary/20 transition-colors -ml-3 -my-2 p-2"
        >
          {isExpanded ? (
            <ChevronDown className="w-3 h-3" />
          ) : (
            <ChevronRight className="w-3 h-3" />
          )}
          <Folder className="w-3 h-3 text-primary/70" />
          {isEditing ? (
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="h-6 text-xs font-semibold tracking-tight bg-background border-border"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
                if (e.key === "Escape") handleCancel();
              }}
            />
          ) : (
            <span className="font-semibold text-xs tracking-tight">
              {subVillage.name}
            </span>
          )}
        </button>
        
        <div className="flex items-center gap-1">
          {isEditing ? (
            <>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 text-green-600 hover:text-green-700"
                onClick={handleSave}
              >
                <Check className="w-2.5 h-2.5" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                onClick={handleCancel}
              >
                <X className="w-2.5 h-2.5" />
              </Button>
            </>
          ) : (
            <>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                onClick={() => setIsEditing(true)}
              >
                <Edit2 className="w-2.5 h-2.5" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                onClick={handleDelete}
              >
                <Trash2 className="w-2.5 h-2.5" />
              </Button>
            </>
          )}
        </div>
      </div>
      {isExpanded && (
        <div className="pl-8 pr-3 pb-3 space-y-1 pt-1">
          {houses.map((h) => (
            <HouseItem key={h.id} house={h} />
          ))}
          {houses.length === 0 && (
            <p className="text-[9px] text-muted-foreground uppercase py-1">
              Belum ada rumah
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function HouseItem({ house }: any) {
  const [photoCount, setPhotoCount] = useState(0);
  const router = useRouter();

  useEffect(() => {
    fetch(`/api/photos/list?houseId=${house.id}`)
      .then((res) => res.json())
      .then((data) => setPhotoCount(data.photos?.length || 0));
  }, [house.id]);

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
  );
}
