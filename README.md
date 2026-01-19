# Survey PWA - Dokumentasi Sistem Terpadu

Survey PWA adalah aplikasi web progresif (Progressive Web Application) yang dirancang khusus untuk kebutuhan pendataan lapangan yang menuntut reliabilitas tinggi dalam kondisi koneksi internet yang tidak stabil.

## 🌟 Fitur Unggulan

### 1. Arsitektur Offline-First (PWA)
Aplikasi ini tetap dapat dioperasikan secara penuh meskipun tanpa koneksi internet.
- **Instalasi**: Dapat diinstal langsung dari browser di Android, iOS, maupun Desktop (Add to Home Screen).
- **Penyimpanan Lokal**: Foto dan data survei disimpan dengan aman di **IndexedDB** perangkat pengguna.
- **Resiliensi**: Service Worker memastikan aplikasi dapat dibuka dan dijalankan tanpa bergantung pada server saat offline.

### 2. Manajemen Folder (Pengorganisasian Data)
Data survei dikelompokkan secara hierarkis untuk memudahkan manajemen ribuan entri data.
- **Identitas Lengkap**: Folder mencakup Nama Folder, Nama Pemilik Rumah, dan NIK (Validasi 16 digit).
- **Galeri Terintegrasi**: Setiap folder memiliki halaman detail untuk melihat koleksi foto terkait.
- **Akses Cepat**: Fitur pencarian folder memudahkan pencarian data di lapangan.

### 3. Sinkronisasi Cerdas (Smart Sync)
Proses pengunggahan data yang efisien dan otomatis.
- **Antrean Sinkronisasi**: Data masuk ke antrean (queue) saat offline.
- **Auto-Detect**: Sistem mendeteksi kembalinya koneksi internet dan memulai sinkronisasi secara otomatis di latar belakang.
- **Integritas Data**: Menggunakan logika "Folders-First" untuk menjamin semua foto terhubung dengan folder yang tepat di database pusat.

### 4. Pengalaman Pengguna (UX)
- **Preview & Download**: Pengguna dapat melihat hasil jepretan langsung di aplikasi dan mengunduhnya untuk keperluan laporan eksternal.
- **Kamera Kustom**: Antarmuka pengambilan foto yang dioptimalkan untuk perangkat seluler.

## 🛠️ Detail Teknis

- **Frontend**: Next.js 16 (App Router), React 19, Tailwind CSS.
- **UI Components**: Shadcn UI (Radix UI), Lucide Icons, Sonner Toast.
- **Backend & DB**: Node.js API Routes, PostgreSQL dengan Drizzle ORM.
- **Storage**: File sistem lokal (server) untuk foto, PostgreSQL untuk metadata.

## 🚀 Cara Penggunaan Singkat

### Untuk Surveyor
1. **Login** (`surveyor1` / `password123`).
2. **Buat/Pilih Folder** yang sesuai dengan lokasi/rumah yang disurvei.
3. **Klik "Ambil Foto"** di dalam folder tersebut.
4. **Isi Deskripsi** dan simpan. Data akan tersimpan di HP jika offline, atau langsung ke server jika online.

### Untuk Admin
1. **Login** (`admin` / `admin123`).
2. **Buka Portal Admin** untuk melihat rekapitulasi data dari seluruh surveyor.
3. **Cari Folder** tertentu untuk memverifikasi foto dan mengunduhnya.

## 📦 Informasi Deployment (VPS)
- **Alamat**: `0.0.0.0`
- **Port**: `5000`
- **Command Run**: `npm run dev -- -p 5000 -H 0.0.0.0` (Dev) atau `npm start` (Prod).

---
*Aplikasi ini dikembangkan untuk memberikan solusi pendataan lapangan yang modern, cepat, dan handal.*
