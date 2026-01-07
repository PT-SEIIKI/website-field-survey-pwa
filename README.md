# Offline Survey PWA

Progressive Web App untuk survei lapangan dengan dukungan offline penuh. Aplikasi ini memungkinkan tim survei untuk mengambil ratusan foto di lapangan dan menguploadnya ketika koneksi internet tersedia.

## Fitur Utama

✅ **Progressive Web App (PWA)**
- Dapat diinstal di Android, iOS, dan Desktop
- Mode offline-first dengan IndexedDB
- Service Worker untuk caching
- Background Sync untuk upload otomatis

✅ **Survei Lapangan**
- Upload multi-file dengan drag-drop
- Capture langsung dari kamera perangkat
- Metadata untuk setiap foto (lokasi, deskripsi, waktu)
- Galeri lokal untuk melihat foto pending

✅ **Sinkronisasi Otomatis**
- Deteksi koneksi internet real-time
- Queue otomatis untuk foto offline
- Upload satu per satu saat online
- Background Sync API support

✅ **Admin Dashboard**
- Lihat semua foto yang diupload
- Filter berdasarkan lokasi dan tanggal
- Preview dan download foto
- Statistik komprehensif

✅ **Keamanan**
- Authentication sederhana (demo)
- Role-based access (Surveyor/Admin)
- File storage di server
- Metadata terekam

## Struktur Folder

```
project-root/
├── app/
│   ├── layout.tsx              # Root layout dengan PWA meta tags
│   ├── page.tsx                # Home redirect
│   ├── manifest.ts             # PWA manifest
│   ├── providers.tsx           # Context providers
│   ├── globals.css             # Global styles
│   │
│   ├── login/
│   │   └── page.tsx            # Login page
│   │
│   ├── survey/
│   │   ├── layout.tsx          # Survey layout dengan auth
│   │   ├── dashboard/
│   │   │   └── page.tsx        # Surveyor dashboard
│   │   └── upload/
│   │       └── page.tsx        # Upload & camera page
│   │
│   ├── admin/
│   │   ├── layout.tsx          # Admin layout
│   │   └── page.tsx            # Admin dashboard
│   │
│   └── api/
│       ├── health/route.ts     # Health check
│       ├── upload/route.ts     # Photo upload endpoint
│       ├── photos/
│       │   ├── list/route.ts   # List photos dengan filter
│       │   └── [id]/route.ts   # Get/Delete photo
│       └── stats/route.ts      # Dashboard stats
│
├── components/
│   ├── ui/                     # shadcn/ui components
│   ├── auth-provider.tsx       # Auth protection
│   ├── logout-button.tsx       # Logout button
│   ├── camera-capture.tsx      # Camera component
│   ├── upload-area.tsx         # Drag-drop upload
│   └── pwa-install-prompt.tsx  # Install banner
│
├── lib/
│   ├── auth.ts                 # Authentication logic
│   ├── indexeddb.ts            # IndexedDB utilities
│   ├── connectivity.ts         # Online/offline detection
│   ├── sync-manager.ts         # Sync queue & auto-upload
│   ├── photo-manager.ts        # Photo operations
│   ├── background-sync.ts      # Background Sync API
│   └── service-worker-register.ts  # SW registration
│
├── hooks/
│   ├── use-sync-status.ts      # Sync status hook
│   ├── use-online-status.ts    # Online status hook
│   └── use-local-photos.ts     # Local photos hook
│
├── public/
│   ├── sw.js                   # Service Worker
│   ├── offline.html            # Offline fallback
│   ├── manifest.json           # PWA manifest
│   ├── uploads/                # Uploaded photos (generated)
│   └── icons/                  # PWA icons (add your icons)
│
├── scripts/
│   ├── generate-icons.js       # Generate PWA icons (optional)
│
├── package.json
├── next.config.mjs
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.js
└── README.md
```

## Instalasi & Setup

### Prasyarat
- Node.js 18+
- npm atau yarn

### 1. Clone/Setup Project

```bash
# Install dependencies
npm install

# atau dengan yarn
yarn install
```

### 2. Development

```bash
npm run dev
# atau
yarn dev
```

Akses aplikasi di `http://localhost:3000`

**Demo Credentials:**
- **Surveyor**: username: `surveyor1`, password: `password123`
- **Admin**: username: `admin`, password: `admin123`

### 3. Build untuk Production

```bash
npm run build
npm start
```

## Cara Menggunakan

### Untuk Tim Survei

1. **Login** dengan akun surveyor
2. **Dashboard** - Lihat status sinkronisasi
3. **Upload Foto:**
   - Pilih metode: Upload file atau Capture kamera
   - Drag-drop atau pilih multiple files
   - Tambahkan lokasi & deskripsi (opsional)
4. **Offline Mode:**
   - Foto tetap bisa diambil tanpa internet
   - Tersimpan di IndexedDB lokal
   - Auto-sync saat koneksi tersedia
5. **Galeri Lokal:**
   - Lihat status setiap foto (pending/syncing/synced/failed)
   - Refresh manual jika perlu

### Untuk Admin

1. **Login** dengan akun admin
2. **Admin Panel:**
   - Lihat semua foto yang diupload
   - Filter berdasarkan lokasi & tanggal
   - Preview foto langsung
   - Download individual foto
   - Hapus foto jika diperlukan
3. **Statistik:**
   - Total foto
   - Total ukuran storage
   - Lokasi unik
   - Rentang tanggal

## PWA Installation

### Android
1. Buka aplikasi di Chrome
2. Tap menu (⋮) → "Install app" atau "Add to Home screen"
3. Aplikasi akan diinstall seperti native app

### iOS
1. Buka di Safari
2. Tap Share → "Add to Home Screen"
3. Selesai!

### Desktop
1. Buka di Chrome/Edge
2. Klik ikon install di address bar (jika tersedia)
3. Atau right-click → "Install Survey PWA"

## Fitur Offline

- **Upload Files:** Foto tersimpan lokal di IndexedDB
- **Capture Camera:** Ambil foto langsung tanpa internet
- **Metadata:** Lokasi & deskripsi tersimpan offline
- **Queue Management:** Otomatis queue foto untuk sync
- **Auto Sync:** Saat online, foto langsung terupload
- **Background Sync:** Upload terus jalan di background

## API Endpoints

### Upload Photo
```
POST /api/upload
Content-Type: multipart/form-data
- file: Photo blob
- photoId: UUID
- location: String (optional)
- description: String (optional)
- timestamp: Number
```

### List Photos
```
GET /api/photos/list
Query params:
- location: Filter by location
- startDate: Filter from date
- endDate: Filter to date
```

### Get Photo Metadata
```
GET /api/photos/[id]
```

### Delete Photo
```
DELETE /api/photos/[id]
```

### Get Stats
```
GET /api/stats
```

### Health Check
```
GET /api/health
HEAD /api/health
```

## Database/Storage

### IndexedDB (Client)
- **photos**: Menyimpan blob foto & status sync
- **syncQueue**: Queue untuk foto yang perlu diupload
- **metadata**: Lokasi, deskripsi, timestamp foto

### File System (Server)
- **public/uploads/**: Menyimpan foto JPG
- **public/uploads/[id].json**: Metadata foto

## Security Notes

⚠️ **Production Deployment:**
- Ganti authentication dummy dengan real auth (OAuth/JWT)
- Implement proper password hashing (bcrypt)
- Add CSRF protection
- Validate & sanitize input
- Use HTTPS (requirement untuk PWA)
- Implement rate limiting di API
- Add proper error handling
- Use environment variables untuk secrets

## Deployment

### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

Vercel otomatis detect Next.js dan setup PWA dengan HTTPS.

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

```bash
docker build -t survey-pwa .
docker run -p 3000:3000 survey-pwa
```

### Self-Hosted
```bash
# Build
npm run build

# Start
npm start
```

Pastikan menggunakan HTTPS reverse proxy (nginx/Apache) dengan certificate SSL/TLS.

## Troubleshooting

### Service Worker tidak register
- Check browser console untuk error
- Pastikan HTTPS digunakan (atau localhost)
- Clear cache & reload

### Foto tidak sync
- Check koneksi internet
- Verify API endpoint accessible
- Check browser console untuk error details
- Try manual sync button

### Storage penuh
- Clear browser cache/storage
- Delete old photos dari admin panel
- Check device storage

## Development Tips

### Debugging Offline Features
1. Chrome DevTools → Application → Service Workers
2. Check "Offline" checkbox untuk test offline mode
3. Application → Storage → IndexedDB untuk lihat data lokal

### Testing Sync
1. Upload foto saat online
2. Simulate offline (DevTools → Network → Offline)
3. Upload lebih banyak foto
4. Back online - foto harus sync otomatis

### Performance
- Service Worker cache files secara aggressive
- IndexedDB handles large photo blobs efficiently
- Upload queue processes one-by-one untuk stability

## License

MIT - Gunakan sesuai kebutuhan

## Support

Untuk issues atau pertanyaan, buat GitHub issue atau hubungi tim development.

---

**Dibuat dengan ❤️ untuk survei lapangan yang lebih efisien**
