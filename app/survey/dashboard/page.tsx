"use client";

import { useRouter } from "next/navigation";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { useSyncStatus } from "@/hooks/use-sync-status";
import { LogoutButton } from "@/components/logout-button";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";
import {
  Upload,
  Wifi,
  WifiOff,
  Camera,
  RefreshCw,
  Folder as FolderIcon,
  Plus,
  UserPlus,
  Shield,
} from "lucide-react";
import { useEffect, useState } from "react";
import { VillageHierarchy } from "@/components/village-hierarchy";
import { Badge } from "@/components/ui/badge";

export default function DashboardPage() {
  const router = useRouter();
  const isOnline = useOnlineStatus();
  const syncStatus = useSyncStatus();
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [villages, setVillages] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/villages")
      .then((res) => res.json())
      .then((data) =>
        setVillages(data.map((v: any) => ({ ...v, id: String(v.id) }))),
      )
      .catch(console.error);
  }, []);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      router.push("/login");
      return;
    }
    setUser(currentUser);

    if (isOnline) {
      fetch("/api/stats")
        .then((res) => res.json())
        .then((data) => {
          if (data.success) setStats(data.stats);
        })
        .catch((err) => console.error("Error fetching stats:", err));
    }
  }, [router, isOnline]);

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="max-w-6xl mx-auto px-6 py-6 sm:py-10">
        {/* Hero / Welcome */}
        <div className="mb-8 sm:mb-12 border-b border-border pb-8 sm:pb-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-1">
              <Badge
                variant="outline"
                className="font-mono text-[10px] uppercase px-1.5 py-0 h-4 mb-2"
              >
                AKSES SISTEM DIBERIKAN
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tighter">
                Selamat Datang, {user.username}
              </h2>
              <p className="text-muted-foreground max-w-lg text-xs sm:text-sm leading-relaxed">
                {user.role === "admin"
                  ? "Kelola semua data survey, aktivitas pengguna, dan statistik sistem dari konsol pusat ini."
                  : "Kumpulkan data lapangan, kelola folder survey, dan sinkronkan temuan Anda dengan database pusat."}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => router.push("/survey/upload")}
                className="flex-1 sm:flex-none rounded-full px-6 font-bold uppercase text-[11px] tracking-widest"
              >
                <Plus className="w-4 h-4 mr-2" />
                Survey Baru
              </Button>
              {user.role === "admin" && (
                <Button
                  onClick={() => router.push("/admin")}
                  variant="outline"
                  className="flex-1 sm:flex-none rounded-full px-6 font-bold uppercase text-[11px] tracking-widest border-border"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Portal Admin
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-10 sm:mb-16">
          <StatCard
            label="Tertunda"
            value={syncStatus.totalPending}
            description="Menunggu Sinkron"
            icon={<Upload size={14} />}
            urgent={syncStatus.totalPending > 0}
          />
          <StatCard
            label="Cloud"
            value={stats ? stats.totalPhotos : "0"}
            description="Foto Tersinkron"
            icon={<Shield size={14} />}
          />
          <StatCard
            label="Wilayah"
            value={villages.length}
            description="Desa Terdata"
            icon={<FolderIcon size={14} />}
          />
          <StatCard
            label="Status"
            value={syncStatus.isSyncing ? "Sinkron" : "Aktif"}
            description={
              syncStatus.isSyncing ? "Mentransfer..." : "Sistem Siap"
            }
            icon={
              <RefreshCw
                size={14}
                className={syncStatus.isSyncing ? "animate-spin" : ""}
              />
            }
            active={syncStatus.isSyncing}
          />
        </div>

        {/* Village Hierarchy View */}
        <div className="space-y-6 sm:space-y-10">
          <div className="flex items-center gap-4">
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-[0.2em]">
              Wilayah Survey (Desa → Dusun → Rumah)
            </h3>
            <div className="h-px bg-border flex-1" />
          </div>
          <VillageHierarchy />
        </div>
      </main>

      <footer className="max-w-6xl mx-auto px-6 py-6 sm:py-10 border-t border-border mt-12 sm:mt-20">
        <p className="text-[9px] sm:text-[10px] font-mono text-muted-foreground uppercase tracking-widest text-center">
          &copy; 2026 FIELD SURVEY SYSTEM. BUILT WITH VERCEL DESIGN PRINCIPLES.
        </p>
      </footer>
    </div>
  );
}

function StatCard({
  label,
  value,
  description,
  icon,
  urgent,
  active,
}: {
  label: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
  urgent?: boolean;
  active?: boolean;
}) {
  return (
    <div
      className={`p-4 sm:p-6 border rounded-xl transition-all ${
        urgent
          ? "bg-amber-500/5 border-amber-500/20"
          : active
            ? "bg-emerald-500/5 border-emerald-500/20"
            : "bg-card/50 border-border hover:border-foreground/20"
      }`}
    >
      <div className="flex items-center justify-between mb-2 sm:mb-4">
        <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
          {label}
        </span>
        <div className="text-muted-foreground scale-90 sm:scale-100">
          {icon}
        </div>
      </div>
      <div className="text-2xl sm:text-3xl font-bold tracking-tighter mb-0.5 sm:mb-1">
        {value}
      </div>
      <p className="text-[8px] sm:text-[10px] text-muted-foreground uppercase tracking-tight truncate">
        {description}
      </p>
    </div>
  );
}
