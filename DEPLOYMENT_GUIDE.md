# Offline Survey PWA - Deployment Guide

## Quickstart Development

```bash
# Clone atau download project
cd offline-survey-pwa

# Install dependencies
npm install

# Run development server
npm run dev
```

Akses di `http://localhost:3000`

---

## Pre-Deployment Checklist

### Security
- [ ] Replace demo auth dengan JWT/Sessions
- [ ] Add password hashing (bcrypt)
- [ ] Enable HTTPS (required untuk PWA)
- [ ] Add rate limiting di API
- [ ] Validate file uploads on backend

### Performance
- [ ] Optimize images
- [ ] Enable compression
- [ ] Setup CDN untuk uploads
- [ ] Add caching headers

### Monitoring
- [ ] Setup error tracking (Sentry)
- [ ] Add analytics
- [ ] Setup uptime monitoring

---

## Deployment to Vercel (Recommended)

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit: Offline Survey PWA"
git push origin main
```

### 2. Deploy via Vercel Dashboard

1. Go to vercel.com/new
2. Select GitHub repository
3. Click Deploy
4. Vercel auto-detects Next.js
5. Click "Deploy"

### 3. Post-Deploy Configuration

1. **Environment Variables**
   - Add any needed env vars in Vercel dashboard
   - Project > Settings > Environment Variables

2. **Custom Domain** (optional)
   - Project > Settings > Domains
   - Add your custom domain

3. **PWA Setup**
   - No additional setup needed
   - manifest.json & sw.js served automatically
   - HTTPS enabled automatically

### 4. Testing After Deploy

1. Visit your Vercel URL
2. Test login: surveyor1/password123
3. Try upload offline (simulate in DevTools)
4. Check manifest: https://yoursite.com/manifest.json
5. Install on mobile

---

## Deployment to Self-Hosted Server

### Requirements
- Node.js 18+ atau Bun
- HTTPS (self-signed certificates untuk testing)
- Reverse proxy (Nginx/Apache)

### Build & Deploy

```bash
# Build production bundle
npm run build

# Start production server
npm start

# Or use PM2 untuk background process
npm install -g pm2
pm2 start npm --name "survey-pwa" -- start
```

### Nginx Configuration

```nginx
server {
  listen 443 ssl;
  server_name yourdomain.com;

  ssl_certificate /path/to/cert.pem;
  ssl_certificate_key /path/to/key.pem;

  # Enable gzip compression
  gzip on;
  gzip_types text/plain application/json text/javascript;

  location / {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade \$http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host \$host;
    proxy_cache_bypass \$http_upgrade;
  }

  # Serve static files
  location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
    proxy_pass http://localhost:3000;
    expires 30d;
    add_header Cache-Control "public, immutable";
  }
}
```

---

## Post-Deployment: Production Improvements

### 1. Upgrade Authentication

```typescript
// lib/auth-prod.ts - Production version
import bcrypt from 'bcrypt'

export async function loginProd(credentials: LoginCredentials) {
  // 1. Query database untuk user
  // 2. Verify password dengan bcrypt
  // 3. Generate JWT token
  // 4. Set secure HTTP-only cookie
  // 5. Return user data
}
```

### 2. Add Database

Pilih salah satu:
- PostgreSQL + Prisma
- MongoDB + Mongoose
- Supabase (recommended)

```typescript
// app/api/upload/route-prod.ts
import { createServerClient } from '@supabase/ssr'

export async function POST(request: NextRequest) {
  const supabase = createServerClient(...)
  
  // 1. Authenticate user
  // 2. Save file ke storage
  // 3. Save metadata ke database
  // 4. Return success
}
```

### 3. Add Error Tracking

```bash
npm install @sentry/nextjs
```

```typescript
// sentry.client.config.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
});
```

### 4. Add Monitoring

```bash
npm install @vercel/analytics
```

Sudah included di layout.tsx

---

## File Structure After Deployment

```
public/
  uploads/          # Photo files
    *.jpg
    *.json         # Metadata files
  manifest.json    # PWA manifest
  sw.js            # Service worker
  icons/           # App icons

app/
  api/
    upload/        # Photo upload
    photos/        # Photo management
    stats/         # Statistics
    health/        # Health check
  survey/
    upload/        # Upload page
    gallery/       # Gallery page
    dashboard/     # Surveyor dashboard
  admin/           # Admin dashboard
  login/           # Login page

lib/
  # Core utilities: auth, indexeddb, sync, etc.

components/
  # UI components
```

---

## Troubleshooting

### Service Worker not registering

```javascript
// Check SW registration in browser console
navigator.serviceWorker.getRegistrations().then(regs => {
  console.log(regs)
})

// Hard refresh: Ctrl+Shift+R
```

### IndexedDB not working

```javascript
// Open DevTools > Application > Storage
// Check IndexedDB > SurveyOfflineDB
```

### Camera permission denied

iOS Safari requires:
- HTTPS connection
- User permission prompt
- App added to home screen

### Photos not syncing

1. Check online/offline status
2. Check browser console for errors
3. Verify /api/upload is accessible
4. Check public/uploads directory exists

---

## Performance Optimization Tips

### 1. Image Compression
Add image optimization:

```bash
npm install sharp
```

### 2. Database Indexing
Add indexes untuk frequently queried fields:

```sql
CREATE INDEX idx_location ON photos(location);
CREATE INDEX idx_timestamp ON photos(timestamp);
```

### 3. Caching Strategy
Optimize service worker caching:

```javascript
// Cache static assets untuk 30 hari
cache.put(request, response.clone());
```

### 4. CDN Integration
Upload photos ke CDN (Cloudinary, AWS S3, etc.):

```typescript
// Upload ke CDN instead of local filesystem
const cdnUrl = await uploadToCDN(blob);
```

---

## Security Hardening

### 1. Rate Limiting
```bash
npm install express-rate-limit
```

### 2. CORS Configuration
```typescript
// middleware.ts
export const config = {
  matcher: ['/api/:path*'],
}

export function middleware(request: NextRequest) {
  return NextResponse.json(
    { error: 'Unauthorized' },
    { status: 403 }
  )
}
```

### 3. File Upload Validation
```typescript
// Validate file type, size, dimensions
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

function validateFile(file: File) {
  if (!ALLOWED_TYPES.includes(file.type)) throw new Error('Invalid type')
  if (file.size > MAX_FILE_SIZE) throw new Error('File too large')
}
```

### 4. Environment Variables
```bash
# .env.local (never commit)
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-key
NEXTAUTH_SECRET=your-secret
```

---

## Monitoring & Analytics

### Vercel Analytics (Free)
Already integrated via @vercel/analytics

### Custom Error Tracking
Setup Sentry for error tracking:
- DSN: Get from sentry.io
- Track unhandled errors
- Monitor performance

### API Monitoring
Track API health:
```typescript
// GET /api/health
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date(),
    uptime: process.uptime()
  })
}
```

---

## Maintenance

### Regular Tasks
- [ ] Monitor error logs (Sentry)
- [ ] Check storage usage (uploads folder)
- [ ] Review user activity
- [ ] Update dependencies (npm update)
- [ ] Backup database regularly
- [ ] Clear old sync queue items

### Database Cleanup
```typescript
// Delete photos older than 90 days
const ninetyDaysAgo = Date.now() - (90 * 24 * 60 * 60 * 1000)
// DELETE FROM photos WHERE timestamp < ninetyDaysAgo
```

---

## Scaling Considerations

As user base grows:

1. **Database**: Switch to managed PostgreSQL (Supabase, Heroku)
2. **Storage**: Use S3/GCS instead of local filesystem
3. **Queue**: Use Bull/RabbitMQ untuk async processing
4. **Cache**: Implement Redis untuk caching
5. **Load Balancing**: Setup multiple instances behind load balancer

---

## Support & Troubleshooting

### Common Issues

**Q: PWA not installing on mobile**
A: Check manifest.json valid, SW registered, HTTPS enabled

**Q: Sync not working**
A: Check online status, verify API endpoint, check network tab

**Q: Photos not saving offline**
A: Check IndexedDB quota, verify Storage API support

**Q: Camera not working on iOS**
A: Need HTTPS, user permission, might need to add to home screen first

---

## Next Steps

1. Deploy to production
2. Improve authentication system
3. Add database backend
4. Setup monitoring
5. Test on real devices
6. Gather user feedback
7. Iterate and improve

---

Generated: January 7, 2026
