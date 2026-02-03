"use client";

import { useRouter } from "next/navigation";
import { useLocalPhotos } from "@/hooks/use-local-photos";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { useSyncStatus } from "@/hooks/use-sync-status";
import { addPhotoWithMetadata } from "@/lib/photo-manager";
import { initConnectivityListener, getOnlineStatus } from "@/lib/connectivity";
import { initSyncManager, startSync } from "@/lib/sync-manager";
import {
  getVillages,
  saveVillage,
  deleteVillage as dbDeleteVillage,
  getSubVillages,
  saveSubVillage,
  deleteSubVillage as dbDeleteSubVillage,
  getHouses,
  saveHouse,
  deleteHouse as dbDeleteHouse,
} from "@/lib/indexeddb";
import { UploadArea } from "@/components/upload-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  ArrowLeft,
  RefreshCw,
  Wifi,
  WifiOff,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Suspense, useEffect, useState } from "react";

export default function UploadPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          Loading...
        </div>
      }
    >
      <UploadPageContent />
    </Suspense>
  );
}

function UploadPageContent() {
  const router = useRouter();
  const { photos, isLoading, refreshPhotos } = useLocalPhotos();
  const isOnline = useOnlineStatus();
  const syncStatus = useSyncStatus();

  const [isUploading, setIsUploading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const [villages, setVillages] = useState<any[]>([]);
  const [subVillages, setSubVillages] = useState<any[]>([]);
  const [houses, setHouses] = useState<any[]>([]);

  const [selectedVillageId, setSelectedVillageId] = useState<string>("");
  const [selectedSubVillageId, setSelectedSubVillageId] = useState<string>("");
  const [selectedHouseId, setSelectedHouseId] = useState<string>("");

  const [newVillageName, setNewVillageName] = useState("");
  const [newSubVillageName, setNewSubVillageName] = useState("");
  const [newHouseName, setNewHouseName] = useState("");
  const [showAddVillage, setShowAddVillage] = useState(false);
  const [showAddSubVillage, setShowAddSubVillage] = useState(false);
  const [showAddHouse, setShowAddHouse] = useState(false);

  const createVillage = async () => {
    if (!newVillageName.trim()) return;
    const offlineId = `v_${Date.now()}`;

    if (!getOnlineStatus()) {
      const newV = {
        id: offlineId,
        name: newVillageName.trim(),
        syncStatus: "pending",
      };
      await saveVillage(newV);
      setVillages((prev) => [...prev, newV]);
      setSelectedVillageId(offlineId);
      setNewVillageName("");
      setShowAddVillage(false);
      await fetchVillages();
      return;
    }

    const res = await fetch("/api/villages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newVillageName.trim(), offlineId }),
    });
    if (res.ok) {
      const created = await res.json();
      await saveVillage({
        ...created,
        id: String(created.id),
        offlineId,
        syncStatus: "synced",
      });
      setVillages((prev) => [...prev, { ...created, id: String(created.id) }]);
      setSelectedVillageId(String(created.id));
      setNewVillageName("");
      setShowAddVillage(false);
      await fetchVillages();
    }
  };

  const createSubVillage = async () => {
    if (!newSubVillageName.trim() || !selectedVillageId) return;
    const offlineId = `sv_${Date.now()}`;

    if (!getOnlineStatus()) {
      const newSV = {
        id: offlineId,
        name: newSubVillageName.trim(),
        villageId: selectedVillageId,
        syncStatus: "pending",
      };
      await saveSubVillage(newSV);
      setSubVillages((prev) => [...prev, newSV]);
      setSelectedSubVillageId(offlineId);
      setNewSubVillageName("");
      setShowAddSubVillage(false);
      await fetchSubVillages(selectedVillageId);
      return;
    }

    const res = await fetch("/api/sub-villages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newSubVillageName.trim(),
        villageId: selectedVillageId,
        offlineId,
      }),
    });
    if (res.ok) {
      const created = await res.json();
      await saveSubVillage({
        ...created,
        id: String(created.id),
        offlineId,
        syncStatus: "synced",
      });
      setSubVillages((prev) => [
        ...prev,
        { ...created, id: String(created.id) },
      ]);
      setSelectedSubVillageId(String(created.id));
      setNewSubVillageName("");
      setShowAddSubVillage(false);
      await fetchSubVillages(selectedVillageId);
    }
  };

  const createHouse = async () => {
    if (!newHouseName.trim() || !selectedSubVillageId) return;
    const offlineId = `h_${Date.now()}`;

    if (!getOnlineStatus()) {
      const newH = {
        id: offlineId,
        name: newHouseName.trim(),
        subVillageId: selectedSubVillageId,
        syncStatus: "pending",
      };
      await saveHouse(newH);
      setHouses((prev) => [...prev, newH]);
      setSelectedHouseId(offlineId);
      setNewHouseName("");
      setShowAddHouse(false);
      await fetchHouses(selectedSubVillageId);
      return;
    }

    const res = await fetch("/api/houses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newHouseName.trim(),
        subVillageId: selectedSubVillageId,
        offlineId,
      }),
    });
    if (res.ok) {
      const created = await res.json();
      await saveHouse({
        ...created,
        id: String(created.id),
        offlineId,
        syncStatus: "synced",
      });
      setHouses((prev) => [...prev, { ...created, id: String(created.id) }]);
      setSelectedHouseId(String(created.id));
      setNewHouseName("");
      setShowAddHouse(false);
      await fetchHouses(selectedSubVillageId);
    }
  };

  const deleteVillage = async (id: string) => {
    if (!getOnlineStatus()) {
      await dbDeleteVillage(id);
      setVillages((prev) => prev.filter((v) => String(v.id) !== id));
      if (selectedVillageId === id) {
        setSelectedVillageId("");
        setSubVillages([]);
        setHouses([]);
      }
      return;
    }

    const res = await fetch(`/api/villages/${id}`, { method: "DELETE" });
    if (res.ok) {
      await dbDeleteVillage(id);
      setVillages((prev) => prev.filter((v) => String(v.id) !== id));
      if (selectedVillageId === id) {
        setSelectedVillageId("");
        setSubVillages([]);
        setHouses([]);
      }
    }
  };

  const deleteSubVillage = async (id: string) => {
    if (!getOnlineStatus()) {
      await dbDeleteSubVillage(id);
      setSubVillages((prev) => prev.filter((sv) => String(sv.id) !== id));
      if (selectedSubVillageId === id) {
        setSelectedSubVillageId("");
        setHouses([]);
      }
      return;
    }

    const res = await fetch(`/api/sub-villages/${id}`, { method: "DELETE" });
    if (res.ok) {
      await dbDeleteSubVillage(id);
      setSubVillages((prev) => prev.filter((sv) => String(sv.id) !== id));
      if (selectedSubVillageId === id) {
        setSelectedSubVillageId("");
        setHouses([]);
      }
    }
  };

  const deleteHouse = async (id: string) => {
    if (!getOnlineStatus()) {
      await dbDeleteHouse(id);
      setHouses((prev) => prev.filter((h) => String(h.id) !== id));
      if (selectedHouseId === id) setSelectedHouseId("");
      return;
    }

    const res = await fetch(`/api/houses/${id}`, { method: "DELETE" });
    if (res.ok) {
      await dbDeleteHouse(id);
      setHouses((prev) => prev.filter((h) => String(h.id) !== id));
      if (selectedHouseId === id) setSelectedHouseId("");
    }
  };

  const fetchVillages = async () => {
    const local = await getVillages();
    if (local.length > 0) {
      setVillages(local);
    }

    if (getOnlineStatus()) {
      const res = await fetch("/api/villages");
      if (res.ok) {
        const remote = await res.json();
        setVillages(remote.map((v) => ({ ...v, id: String(v.id) })));
        for (const v of remote)
          await saveVillage({ ...v, id: String(v.id), syncStatus: "synced" });
      }
    }
  };

  useEffect(() => {
    fetchVillages();
  }, []);

  const fetchSubVillages = async (villageId: string) => {
    const local = await getSubVillages(villageId);
    setSubVillages(local);

    if (getOnlineStatus()) {
      const res = await fetch(`/api/sub-villages?villageId=${villageId}`);
      if (res.ok) {
        const remote = await res.json();
        setSubVillages(remote.map((sv) => ({ ...sv, id: String(sv.id) })));
        for (const sv of remote)
          await saveSubVillage({
            ...sv,
            id: String(sv.id),
            syncStatus: "synced",
          });
      }
    }
  };

  const fetchHouses = async (subVillageId: string) => {
    const local = await getHouses(subVillageId);
    setHouses(local);

    if (getOnlineStatus()) {
      const res = await fetch(`/api/houses?subVillageId=${subVillageId}`);
      if (res.ok) {
        const remote = await res.json();
        setHouses(remote.map((h) => ({ ...h, id: String(h.id) })));
        for (const h of remote)
          await saveHouse({ ...h, id: String(h.id), syncStatus: "synced" });
      }
    }
  };

  useEffect(() => {
    if (!selectedVillageId) {
      setSubVillages([]);
      setSelectedSubVillageId("");
      return;
    }
    fetchSubVillages(selectedVillageId);
  }, [selectedVillageId]);

  useEffect(() => {
    if (!selectedSubVillageId) {
      setHouses([]);
      setSelectedHouseId("");
      return;
    }
    fetchHouses(selectedSubVillageId);
  }, [selectedSubVillageId]);

  useEffect(() => {
    initConnectivityListener();
    initSyncManager();
    if (isOnline) {
      startSync();
    }
  }, [isOnline]);

  const handleFilesSelected = async (files: File[]) => {
    setIsUploading(true);
    try {
      for (const file of files) {
        await addPhotoWithMetadata(file, {
          villageId: selectedVillageId,
          subVillageId: selectedSubVillageId,
          houseId: selectedHouseId,
          selectedVillageId,
          selectedSubVillageId,
          selectedHouseId,
          surveyId: 1,
          timestamp: Date.now(),
        });
      }
      setSuccessMessage(`${files.length} foto berhasil ditambahkan`);
      await refreshPhotos();
      setTimeout(() => setSuccessMessage(""), 3000);
      if (isOnline) {
        startSync();
      }
    } catch (error) {
      console.error("Upload error:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSync = async () => {
    await startSync();
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="rounded-full h-9 w-9"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-semibold tracking-tight">
              Upload Foto
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-medium tracking-wide uppercase ${
                isOnline
                  ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                  : "bg-orange-500/10 text-orange-600 border-orange-500/20"
              }`}
            >
              {isOnline ? (
                <Wifi className="w-3 h-3" />
              ) : (
                <WifiOff className="w-3 h-3" />
              )}
              {isOnline ? "Online" : "Offline"}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-7 space-y-8">
            {syncStatus.totalPending > 0 && (
              <div className="bg-secondary border border-border rounded-lg p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">
                      {syncStatus.totalPending} foto tertunda
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Otomatis sinkron saat online
                    </p>
                  </div>
                </div>
                <Button
                  onClick={handleSync}
                  disabled={syncStatus.isSyncing || !isOnline}
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs bg-background"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 mr-2 ${syncStatus.isSyncing ? "animate-spin" : ""}`}
                  />
                  Sync
                </Button>
              </div>
            )}

            {successMessage && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-lg p-4 text-sm font-medium animate-in fade-in slide-in-from-top-2">
                {successMessage}
              </div>
            )}

            <div className="space-y-6">
              <div className="space-y-4 p-6 border border-border rounded-xl bg-card/50">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Desa
                    </label>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() => setShowAddVillage(!showAddVillage)}
                    >
                      {showAddVillage ? (
                        <X className="w-3 h-3" />
                      ) : (
                        <Plus className="w-3 h-3" />
                      )}
                    </Button>
                  </div>
                  {showAddVillage && (
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={newVillageName}
                        onChange={(e) => setNewVillageName(e.target.value)}
                        placeholder="Nama desa baru..."
                        className="flex-1 h-9 rounded-md border border-border bg-background px-3 text-sm"
                      />
                      <Button size="sm" className="h-9" onClick={createVillage}>
                        Tambah
                      </Button>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <select
                      value={selectedVillageId}
                      onChange={(e) => setSelectedVillageId(e.target.value)}
                      className="flex-1 h-10 rounded-md border border-border bg-background px-3 text-sm focus:ring-1 focus:ring-foreground transition-all"
                    >
                      <option value="">Pilih Desa</option>
                      {villages.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.name}
                        </option>
                      ))}
                    </select>
                    {selectedVillageId && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 text-destructive hover:text-destructive"
                        onClick={() => deleteVillage(selectedVillageId)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Dusun
                    </label>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() => setShowAddSubVillage(!showAddSubVillage)}
                      disabled={!selectedVillageId}
                    >
                      {showAddSubVillage ? (
                        <X className="w-3 h-3" />
                      ) : (
                        <Plus className="w-3 h-3" />
                      )}
                    </Button>
                  </div>
                  {showAddSubVillage && selectedVillageId && (
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={newSubVillageName}
                        onChange={(e) => setNewSubVillageName(e.target.value)}
                        placeholder="Nama dusun baru..."
                        className="flex-1 h-9 rounded-md border border-border bg-background px-3 text-sm"
                      />
                      <Button
                        size="sm"
                        className="h-9"
                        onClick={createSubVillage}
                      >
                        Tambah
                      </Button>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <select
                      value={selectedSubVillageId}
                      onChange={(e) => setSelectedSubVillageId(e.target.value)}
                      disabled={!selectedVillageId}
                      className="flex-1 h-10 rounded-md border border-border bg-background px-3 text-sm focus:ring-1 focus:ring-foreground transition-all disabled:opacity-50"
                    >
                      <option value="">Pilih Dusun</option>
                      {subVillages.map((sv) => (
                        <option key={sv.id} value={sv.id}>
                          {sv.name}
                        </option>
                      ))}
                    </select>
                    {selectedSubVillageId && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 text-destructive hover:text-destructive"
                        onClick={() => deleteSubVillage(selectedSubVillageId)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Rumah
                    </label>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() => setShowAddHouse(!showAddHouse)}
                      disabled={!selectedSubVillageId}
                    >
                      {showAddHouse ? (
                        <X className="w-3 h-3" />
                      ) : (
                        <Plus className="w-3 h-3" />
                      )}
                    </Button>
                  </div>
                  {showAddHouse && selectedSubVillageId && (
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={newHouseName}
                        onChange={(e) => setNewHouseName(e.target.value)}
                        placeholder="Nama rumah baru..."
                        className="flex-1 h-9 rounded-md border border-border bg-background px-3 text-sm"
                      />
                      <Button size="sm" className="h-9" onClick={createHouse}>
                        Tambah
                      </Button>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <select
                      value={selectedHouseId}
                      onChange={(e) => setSelectedHouseId(e.target.value)}
                      disabled={!selectedSubVillageId}
                      className="flex-1 h-10 rounded-md border border-border bg-background px-3 text-sm focus:ring-1 focus:ring-foreground transition-all disabled:opacity-50"
                    >
                      <option value="">Pilih Rumah</option>
                      {houses.map((h) => (
                        <option key={h.id} value={h.id}>
                          {h.name}
                        </option>
                      ))}
                    </select>
                    {selectedHouseId && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 text-destructive hover:text-destructive"
                        onClick={() => deleteHouse(selectedHouseId)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <UploadArea
                  onFilesSelected={handleFilesSelected}
                  isLoading={isUploading}
                />
              </div>
            </div>
          </div>

          <aside className="lg:col-span-5">
            <div className="sticky top-24 border border-border rounded-lg overflow-hidden bg-background">
              <div className="p-4 border-b border-border flex items-center justify-between">
                <h3 className="text-sm font-semibold">Status Sinkronisasi</h3>
                <Badge variant="outline" className="font-mono text-[10px]">
                  {photos.length}
                </Badge>
              </div>
              <div className="p-4">
                <Tabs defaultValue="pending">
                  <TabsList className="grid grid-cols-4 w-full h-8 p-0 bg-secondary rounded-md overflow-hidden mb-4">
                    <TabsTrigger
                      value="pending"
                      className="text-[10px] uppercase font-bold tracking-tight py-1 rounded-none data-[state=active]:bg-background"
                    >
                      Tertunda
                    </TabsTrigger>
                    <TabsTrigger
                      value="syncing"
                      className="text-[10px] uppercase font-bold tracking-tight py-1 rounded-none data-[state=active]:bg-background"
                    >
                      Proses
                    </TabsTrigger>
                    <TabsTrigger
                      value="synced"
                      className="text-[10px] uppercase font-bold tracking-tight py-1 rounded-none data-[state=active]:bg-background"
                    >
                      Selesai
                    </TabsTrigger>
                    <TabsTrigger
                      value="failed"
                      className="text-[10px] uppercase font-bold tracking-tight py-1 rounded-none data-[state=active]:bg-background"
                    >
                      Gagal
                    </TabsTrigger>
                  </TabsList>

                  <div className="min-h-[200px] max-h-[400px] overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                    <TabsContent value="pending" className="m-0 space-y-1">
                      <PhotoList status="pending" photos={photos} />
                    </TabsContent>
                    <TabsContent value="syncing" className="m-0 space-y-1">
                      <PhotoList status="syncing" photos={photos} />
                    </TabsContent>
                    <TabsContent value="synced" className="m-0 space-y-1">
                      <PhotoList status="synced" photos={photos} />
                    </TabsContent>
                    <TabsContent value="failed" className="m-0 space-y-1">
                      <PhotoList status="failed" photos={photos} />
                    </TabsContent>
                  </div>
                </Tabs>

                <Button
                  onClick={refreshPhotos}
                  variant="ghost"
                  className="w-full mt-4 h-9 text-xs text-muted-foreground hover:text-foreground"
                  disabled={isLoading}
                >
                  <RefreshCw
                    className={`w-3 h-3 mr-2 ${isLoading ? "animate-spin" : ""}`}
                  />
                  Segarkan List
                </Button>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

function PhotoList({ status, photos }: { status: string; photos: any[] }) {
  const filtered = photos.filter((p) => {
    if (status === "pending")
      return !p.syncStatus || p.syncStatus === "pending";
    return p.syncStatus === status;
  });

  if (filtered.length === 0) {
    return (
      <p className="text-center py-10 text-[10px] text-muted-foreground italic uppercase tracking-widest">
        Kosong
      </p>
    );
  }

  return (
    <div className="space-y-1.5">
      {filtered.map((photo) => (
        <div
          key={photo.id}
          className="flex items-center justify-between p-2.5 rounded-md border border-border bg-secondary/30"
        >
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-[10px] font-mono text-muted-foreground truncate">
              {photo.id.substring(0, 8)}
            </span>
          </div>
          <div
            className={`h-1.5 w-1.5 rounded-full ${
              photo.syncStatus === "synced"
                ? "bg-emerald-500"
                : photo.syncStatus === "failed"
                  ? "bg-rose-500"
                  : photo.syncStatus === "syncing"
                    ? "bg-amber-500 animate-pulse"
                    : "bg-muted-foreground/30"
            }`}
          />
        </div>
      ))}
    </div>
  );
}
