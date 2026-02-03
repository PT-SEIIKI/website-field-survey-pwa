# SEIIKI Survey PWA - Sistem Survey Lapangan Offline-First

Aplikasi web progresif (Progressive Web Application) yang dirancang khusus untuk pendataan lapangan dengan kemampuan **offline-first lengkap**, manajemen data wilayah hierarkis, dan sinkronisasi otomatis ke database pusat.

## 🌟 Fitur Unggulan

### 📱 **Progressive Web Application (PWA)**
- **Installable**: Dapat diinstall di smartphone/tablet seperti aplikasi native
- **Offline-First**: 100% fungsional tanpa koneksi internet
- **Responsive**: Optimal di semua ukuran layar (mobile, tablet, desktop)
- **Fast Loading**: Caching strategis untuk performa maksimal

### 🔄 **Offline & Sync Capabilities**
- **Complete Offline Mode**: Semua fitur dapat digunakan tanpa internet
- **Smart Caching**: Service worker dengan cache strategis (Network First, Stale While Revalidate)
- **Auto-Sync**: Sinkronisasi otomatis saat koneksi kembali
- **Queue Management**: Operasi CRUD di-queue saat offline, dieksekusi saat online
- **Retry Logic**: 3x percobaan dengan exponential backoff

### 🗺️ **Manajemen Data Wilayah Hierarkis**
- **3-Level Hierarchy**: Desa → Dusun → Rumah
- **CRUD Operations**: Create, Read, Update, Delete untuk semua level
- **Inline Editing**: Edit langsung di dashboard tanpa modal
- **Cascade Delete**: Hapus desa otomatis hapus semua dusun dan rumah
- **Real-time Updates**: Perubahan langsung terlihat di UI

### 📸 **Manajemen Foto Survey**
- **Camera Integration**: Akses kamera device langsung
- **Bulk Upload**: Upload multiple foto sekaligus
- **Metadata Tagging**: Foto terhubung dengan data wilayah
- **Offline Storage**: Foto tersimpan di IndexedDB saat offline
- **Auto-Sync**: Upload otomatis saat online kembali

### 👥 **Manajemen Pengguna & Role**
- **Role-Based Access Control (RBAC)**: Admin dan Surveyor roles
- **User Management**: Create, update, delete user accounts
- **Secure Authentication**: Session-based authentication
- **Permission Control**: Akses fitur berdasarkan role

### 📊 **Dashboard & Analytics**
- **Real-time Statistics**: Jumlah foto, wilayah, status sinkronisasi
- **Visual Hierarchy**: Tampilan pohon untuk struktur wilayah
- **Sync Status**: Monitoring operasi yang pending/syncing/failed
- **Activity Tracking**: Log aktivitas pengguna

## 🏗️ Arsitektur Teknis

### **Frontend Stack**
- **Next.js 15**: React framework dengan App Router
- **TypeScript**: Type safety dan better development experience
- **TailwindCSS**: Utility-first CSS framework
- **Shadcn/ui**: Modern component library
- **Lucide React**: Icon library

### **Backend & Database**
- **Next.js API Routes**: Serverless API endpoints
- **PostgreSQL**: Primary database dengan Drizzle ORM
- **IndexedDB**: Client-side storage untuk offline capabilities
- **Drizzle Kit**: Database schema management

### **PWA Technologies**
- **Service Worker**: Custom SW dengan advanced caching strategies
- **Web App Manifest**: PWA installation dan shortcuts
- **Background Sync**: API untuk sinkronisasi background
- **Cache Storage**: Strategis caching untuk assets dan API

## 🛠️ Prasyarat Instalasi

### **System Requirements**
- **Node.js**: v18+ (LTS version recommended)
- **npm**: v9+ atau **yarn**: v1.22+
- **PostgreSQL**: v13+ dengan user privileges
- **Git**: Untuk version control

### **Development Tools**
- **VS Code**: Recommended dengan extensions:
  - TypeScript and JavaScript Language Features
  - Tailwind CSS IntelliSense
  - PWA Builder
  - Thunder Client (API testing)

## 🚀 Panduan Instalasi Lengkap

### **1. Clone Repository**
```bash
git clone <repository-url>
cd website-field-survey-pwa
```

### **2. Install Dependencies**
```bash
# Menggunakan npm
npm install

# Atau menggunakan yarn
yarn install
```

### **3. Konfigurasi Environment**
Buat file `.env` di root directory:
```env
# Database Configuration
DATABASE_URL=postgresql://postgres:EDUJUANDA12345@localhost:5432/pwa_survey

# Authentication & Security
JWT_SECRET="your-super-secret-jwt-key-here"
JWT_EXPIRES_IN="7d"
NEXTAUTH_SECRET="your-nextauth-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# File Upload Settings
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE="10485760"  # 10MB
ALLOWED_FILE_TYPES="image/jpeg,image/png,image/jpg"

# Development Settings
NODE_ENV="development"
ALLOW_DEV_USER_SEED="true"
```

### **4. Setup Database**
```bash
# Push schema ke database
npm run db:push

# Jalankan seeder untuk data awal
npm run db:seed
```

### **5. Start Development Server**
```bash
# Development mode dengan hot reload
npm run dev

# Aplikasi akan berjalan di http://localhost:3000
```

## 🌱 Database Seeder

### **Default Accounts**
Setelah menjalankan `npm run db:seed`, sistem akan membuat:

#### **Admin Account**
- **Username**: `admin`
- **Password**: `admin123`
- **Role**: `admin`
- **Akses**: Semua fitur termasuk manajemen user

#### **Surveyor Account**
- **Username**: `surveyor1`
- **Password**: `password123`
- **Role**: `user`
- **Akses**: Survey dan upload foto

### **Default Data**
- **Survey Default**: "Survey Utama" untuk testing
- **Database Tables**: Villages, Sub-villages, Houses, Photos, Folders

## 📱 PWA Installation & Usage

### **Install sebagai Aplikasi**
1. Buka `http://localhost:3000` di Chrome/Edge
2. Klik icon **Install** (⊕) di address bar
3. Klik **Install App**
4. Aplikasi akan muncul di homescreen

### **Shortcuts Available**
- **Dashboard Survey**: Langsung ke dashboard
- **Upload Foto**: Langsung ke halaman upload
- **Galeri**: Lihat foto-foto survey

### **Offline Usage**
1. **Buka aplikasi** (tanpa internet)
2. **Login** dengan akun yang tersimpan
3. **Gunakan semua fitur**:
   - ✅ Dashboard dan statistik
   - ✅ Upload foto (tersimpan lokal)
   - ✅ Kelola wilayah (CRUD)
   - ✅ Lihat galeri offline
4. **Auto-sync** saat koneksi kembali

## 📂 Struktur Proyek

```
website-field-survey-pwa/
├── app/                          # Next.js App Router
│   ├── admin/                   # Admin pages
│   │   ├── page.tsx            # Admin dashboard
│   │   ├── users/              # User management
│   │   └── stats/              # Statistics
│   ├── api/                    # API routes
│   │   ├── login/              # Authentication
│   │   ├── villages/           # Village CRUD
│   │   ├── sub-villages/       # Sub-village CRUD
│   │   ├── houses/             # House CRUD
│   │   ├── folders/            # Folder management
│   │   ├── photos/             # Photo operations
│   │   └── stats/              # Statistics API
│   ├── survey/                 # Survey pages
│   │   ├── dashboard/          # Survey dashboard
│   │   ├── upload/             # Photo upload
│   │   ├── gallery/            # Photo gallery
│   │   └── folder/             # Folder management
│   ├── login/                  # Login page
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Home page
│   ├── providers.tsx           # App providers
│   └── manifest.ts             # PWA manifest
├── components/                  # Reusable UI components
│   ├── ui/                     # Shadcn UI components
│   ├── upload-area.tsx         # Photo upload component
│   ├── village-hierarchy.tsx   # Hierarchy display
│   ├── folder-manager.tsx      # Folder management
│   └── logout-button.tsx       # Logout component
├── lib/                        # Utility libraries
│   ├── indexeddb.ts            # IndexedDB operations
│   ├── offline-sync-queue.ts   # Offline sync queue
│   ├── service-worker-register.ts # SW registration
│   ├── sync-manager.ts         # Sync logic
│   ├── photo-manager.ts        # Photo handling
│   ├── connectivity.ts         # Network detection
│   └── auth.ts                 # Authentication
├── server/                     # Backend logic
│   ├── db.ts                   # Database connection
│   ├── storage.ts              # Data access layer
│   └── seed.ts                 # Database seeder
├── shared/                     # Shared types & schemas
│   └── schema.ts               # Database schemas
├── public/                     # Static assets
│   ├── sw.js                   # Service worker
│   ├── manifest.json           # PWA manifest
│   ├── offline.html            # Offline fallback page
│   └── icons/                  # PWA icons
├── drizzle.config.ts           # Drizzle config
├── package.json                # Dependencies
└── README.md                   # This file
```

## 🔧 Konfigurasi Lanjutan

### **Environment Variables**
```env
# Database
DATABASE_URL=postgresql://user:password@host:port/database

# Security
JWT_SECRET=random-256-bit-string
JWT_EXPIRES_IN=7d
NEXTAUTH_SECRET=random-256-bit-string
NEXTAUTH_URL=http://localhost:3000

# File Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/jpg

# Development
NODE_ENV=production
ALLOW_DEV_USER_SEED=true
```

### **Database Configuration**
```bash
# Create new database
createdb pwa_survey

# Create user (optional)
CREATE USER survey_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE pwa_survey TO survey_user;
```

## 🚀 Deployment

### **Vercel (Recommended)**
1. Push ke GitHub repository
2. Connect ke Vercel
3. Set environment variables di Vercel dashboard
4. Deploy otomatis

### **Docker**
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

### **Traditional Server**
```bash
# Build untuk production
npm run build

# Start production server
npm start

# Atau menggunakan PM2
pm2 start npm --name "survey-pwa" -- start
```

## 🔒 Keamanan

### **Authentication & Authorization**
- **Session-based authentication** dengan JWT tokens
- **Role-based access control (RBAC)**
- **Password hashing** (implementasi untuk production)
- **CSRF protection** (Next.js built-in)

### **Data Security**
- **Input validation** dengan Zod schemas
- **SQL injection prevention** (Drizzle ORM)
- **File upload security** dengan type validation
- **Environment variable protection**

### **PWA Security**
- **HTTPS required** untuk production
- **Service worker scope limitation**
- **Cache security** dengan proper headers
- **Content Security Policy** (CSP)

## 🧪 Testing

### **Manual Testing Checklist**
- [ ] Login/logout functionality
- [ ] Offline mode operations
- [ ] Sync queue functionality
- [ ] CRUD operations untuk villages/sub-villages/houses
- [ ] Photo upload dan gallery
- [ ] Admin panel functionality
- [ ] PWA installation
- [ ] Responsive design

### **Testing Offline Mode**
1. Buka Developer Tools → Network → Offline
2. Test semua fitur:
   - Login dengan cached credentials
   - Dashboard loading
   - CRUD operations
   - Photo upload (ke IndexedDB)
3. Kembali online → verifikasi auto-sync

## 🐛 Troubleshooting

### **Common Issues**

#### **Service Worker Not Registering**
```bash
# Clear browser cache
# Unregister existing SW di chrome://serviceworker-internals/
# Restart development server
```

#### **Database Connection Error**
```bash
# Check PostgreSQL service
sudo systemctl status postgresql

# Verify connection string
psql postgresql://user:password@localhost:5432/database
```

#### **Sync Queue Not Processing**
```bash
# Check IndexedDB di DevTools → Application → IndexedDB
# Verify network connectivity
# Check console untuk error messages
```

#### **PWA Installation Failed**
- Ensure HTTPS di production
- Check manifest.json validity
- Verify service worker scope

## 📊 Performance Optimization

### **Caching Strategy**
- **Service Worker**: Network First untuk API, Stale While Revalidate untuk assets
- **Browser Cache**: Static assets dengan long-term cache
- **CDN**: Untuk production deployment

### **Bundle Optimization**
- **Code splitting**: Automatic dengan Next.js
- **Tree shaking**: Unused code elimination
- **Image optimization**: Next.js Image component
- **Font optimization**: Subset fonts

## 🔄 Version Control & Updates

### **Semantic Versioning**
- **Major**: Breaking changes
- **Minor**: New features
- **Patch**: Bug fixes

### **Update Process**
1. **Backup database**
2. **Pull latest code**
3. **Run migrations**: `npm run db:push`
4. **Install dependencies**: `npm install`
5. **Restart server**

## 📞 Support & Maintenance

### **Monitoring**
- **Error tracking**: Console logs dan error boundaries
- **Performance monitoring**: Core Web Vitals
- **Usage analytics**: User interaction tracking

### **Regular Maintenance**
- **Database backups**: Daily automated backups
- **Log rotation**: Prevent log file bloat
- **Cache cleanup**: Remove outdated cache entries
- **Security updates**: Keep dependencies updated

## 🤝 Contributing

### **Development Workflow**
1. Fork repository
2. Create feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -m 'Add new feature'`
4. Push branch: `git push origin feature/new-feature`
5. Create Pull Request

### **Code Standards**
- **TypeScript**: Strict mode enabled
- **ESLint**: Code linting dan formatting
- **Prettier**: Code formatting
- **Husky**: Pre-commit hooks

## 📄 License

© 2026 PT. SOLUSI ENERGI KELISTRIKAN INDONESIA

All rights reserved. This software is proprietary and confidential.

---

## 📞 Kontak & Support

**PT. SOLUSI ENERGI KELISTRIKAN INDONESIA**
- **Website**: https://seiki-energy.com
- **Email**: support@seiki-energy.com
- **Phone**: +62 21 1234 5678

**Technical Support**
- **Documentation**: README.md ini
- **Issue Tracking**: GitHub Issues (untuk development team)
- **Emergency Support**: Hubungi IT Department

---

*Last updated: February 2026*
