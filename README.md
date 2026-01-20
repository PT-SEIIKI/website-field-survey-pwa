# SEIIKI Survey PWA - Dokumentasi Lengkap

Survey PWA adalah aplikasi web progresif (Progressive Web Application) yang dirancang untuk pendataan lapangan yang handal dengan kemampuan offline-first, manajemen folder, dan sinkronisasi otomatis ke database pusat.

## 🌟 Fitur Utama
- **Offline-First**: Dapat digunakan tanpa koneksi internet. Data disimpan di IndexedDB.
- **Manajemen Folder**: Organisasi data berdasarkan rumah/NIK/lokasi.
- **Sinkronisasi Otomatis**: Mendeteksi koneksi internet untuk mengunggah data yang tertunda.
- **Manajemen User**: Admin dapat membuat, mengelola, dan menghapus akun surveyor.
- **Admin Dashboard**: Statistik rekapitulasi data dan galeri foto terpusat.

## 🛠️ Prasyarat (Prerequisites)
- **Node.js**: v18 atau lebih baru.
- **npm**: v9 atau lebih baru.
- **PostgreSQL**: Database relasional untuk penyimpanan permanen.

## 🚀 Cara Instalasi

1. **Clone Repository**:
   ```bash
   git clone <url-repository>
   cd website-survey-pwa
   ```

2. **Install Dependensi**:
   ```bash
   npm install
   ```

3. **Konfigurasi Environment**:
   Salin file `.env.example` (jika ada) atau buat file `.env` dan tambahkan variabel berikut:
   ```env
   DATABASE_URL=postgres://user:password@localhost:5432/survey_db
   ```

4. **Persiapan Database**:
   Push skema database ke PostgreSQL:
   ```bash
   npm run db:push
   ```

## 🌱 Seeder (Data Awal)
Sistem dilengkapi dengan seeder untuk membuat akun administrator default. Jalankan perintah berikut:
```bash
npx tsx server/seed.ts
```
**Kredensial Default Admin:**
- **Username**: `admin`
- **Password**: `adminpassword`

## 🏃 Cara Menjalankan

### Mode Pengembangan (Development)
Untuk menjalankan server dengan fitur hot-reload:
```bash
npm run dev -- -p 5000 -H 0.0.0.0
```

### Mode Produksi (Production)
1. **Build Aplikasi**:
   ```bash
   npm run build
   ```
2. **Start Server**:
   ```bash
   npm start -- -p 5000 -H 0.0.0.0
   ```

## 📂 Struktur Proyek
- `app/`: Routing Next.js (App Router) dan halaman UI.
- `server/`: Logika backend, storage layer, dan database connection.
- `shared/`: Skema database dan tipe data TypeScript yang digunakan bersama.
- `public/`: Aset statis, Service Worker (`sw.js`), dan manifest PWA.
- `components/`: Komponen UI reusable (Shadcn UI).

## 🔒 Keamanan
- Password pada demo disimpan secara plain text. Untuk produksi, sangat disarankan untuk mengimplementasikan hashing menggunakan `bcrypt` atau `argon2`.
- Role-based Access Control (RBAC) membatasi akses menu Manajemen User hanya untuk akun dengan role `admin`.

---
© 2026 PT. SOLUSI ENERGI KELISTRIKAN INDONESIA
