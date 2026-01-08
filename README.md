# Offline Survey PWA

Progressive Web App untuk survei lapangan dengan dukungan offline penuh. Aplikasi ini memungkinkan tim survei untuk mengambil ratusan foto di lapangan dan menguploadnya ketika koneksi internet tersedia.

## Fitur Utama

✅ **Progressive Web App (PWA)**
- Dapat diinstal di Android, iOS, dan Desktop
- Mode offline-first dengan IndexedDB
- Service Worker untuk caching aset dan API
- Background Sync untuk upload otomatis saat kembali online

✅ **Survei Lapangan & Pengambilan Data**
- **Multi-File Upload**: Dukungan drag-and-drop untuk banyak file sekaligus.
- **Kamera Langsung**: Ambil foto langsung dari kamera perangkat dengan preview.
- **Metadata Lengkap**: Pencatatan lokasi (teks), deskripsi, dan stempel waktu otomatis untuk setiap foto.
- **Manajemen Penyimpanan Proaktif**: Fitur pencegahan penyimpanan penuh yang otomatis menghapus foto yang sudah tersinkronisasi jika ruang penyimpanan perangkat menipis.

✅ **Sinkronisasi Cerdas**
- **Deteksi Koneksi**: Pantauan status internet secara real-time.
- **Antrean Sinkronisasi (Sync Queue)**: Foto yang diambil saat offline masuk ke antrean IndexedDB.
- **Upload Otomatis**: Proses upload berjalan secara otomatis segera setelah perangkat mendapatkan koneksi internet.

✅ **Panel Admin & Analitik**
- **Dashboard Admin**: Monitoring semua data survei yang masuk.
- **Filter & Pencarian**: Filter data berdasarkan lokasi, rentang tanggal, dan surveyor.
- **Manajemen Data**: Preview foto, download file, dan penghapusan data dari server.
- **Statistik Visual**: Grafik dan ringkasan data survei menggunakan Recharts.

✅ **Keamanan & Teknis**
- **Role-Based Access Control (RBAC)**: Pemisahan akses antara Surveyor dan Admin.
- **PostgreSQL Ready**: Konfigurasi siap pakai untuk database PostgreSQL (via DATABASE_URL).
- **Environment Driven**: Pengaturan fleksibel menggunakan variabel lingkungan (.env).

## Teknologi yang Digunakan

- **Framework**: Next.js 16 (App Router)
- **Bahasa**: TypeScript
- **Styling**: Tailwind CSS & Radix UI (Shadcn UI)
- **Database (Server)**: PostgreSQL
- **Database (Client/Offline)**: IndexedDB
- **State & Logic**: React Hook Form, Zod (Validation), Lucide React (Icons)
- **Charts**: Recharts
- **PWA**: Custom Service Worker & Web Manifest

## Struktur Folder Utama

```
project-root/
├── app/                  # Next.js App Router (Pages, API, Layouts)
├── components/           # Komponen UI Reusable (shadcn, camera, upload)
├── hooks/                # Custom React Hooks (sync, online status, storage)
├── lib/                  # Logika bisnis (auth, db, sync manager, photo ops)
├── public/               # Aset statis, Service Worker, & Manifest
└── styles/               # Global CSS
```

## Instalasi & Deployment

### 1. Persiapan
Pastikan Anda memiliki Node.js 18+ dan database PostgreSQL.

### 2. Variabel Lingkungan (.env)
Buat file `.env` di root folder:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"
JWT_SECRET="rahasia_anda"
NEXTAUTH_SECRET="rahasia_anda"
NEXTAUTH_URL="http://localhost:5000"
UPLOAD_DIR="./public/uploads"
```

### 3. Jalankan Aplikasi
```bash
npm install
npm run dev # Development (Port 5000)
# atau
npm run build && npm start # Production
```

## Demo Akun Default
- **Surveyor**: `surveyor1` / `password123`
- **Admin**: `admin` / `admin123`

---
**Dibuat untuk mempermudah pengambilan data di area dengan koneksi internet terbatas.**
