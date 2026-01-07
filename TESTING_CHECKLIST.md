# Offline Survey PWA - Testing Checklist

## Manual Testing Guide

### 1. AUTHENTICATION TESTING

#### 1.1 Login Page
- [ ] Navigate to http://localhost:3000/login
- [ ] Demo credentials visible
- [ ] Try invalid credentials → error message shown
- [ ] Try valid surveyor1/password123 → redirect to dashboard
- [ ] Try valid admin/admin123 → redirect to dashboard
- [ ] Session stored in localStorage

#### 1.2 Logout
- [ ] Click logout button
- [ ] Redirected to login page
- [ ] Session cleared from localStorage
- [ ] Cannot access protected routes

---

### 2. OFFLINE MODE TESTING

#### 2.1 Enable Offline Mode
1. DevTools > Network > Offline
2. All functionality continues to work
3. Photos can be uploaded

#### 2.2 IndexedDB Storage
1. DevTools > Application > Storage > IndexedDB
2. SurveyOfflineDB exists
3. Photos store has entries
4. Metadata store has entries
5. Sync queue store has entries

#### 2.3 Service Worker
1. DevTools > Application > Service Workers
2. SW registered
3. Scope: /
4. Status: activated & running
5. No errors in console

---

### 3. PHOTO UPLOAD TESTING

#### 3.1 Drag & Drop
- [ ] Offline mode
- [ ] Drag image file ke upload area
- [ ] File accepted
- [ ] Photo appears in local gallery
- [ ] Status: "pending"

#### 3.2 File Selection
- [ ] Click "Pilih Foto" button
- [ ] Select multiple files (e.g., 5 photos)
- [ ] All files added
- [ ] Progress shown
- [ ] All appear in gallery

#### 3.3 Camera Capture (Mobile/Desktop)
- [ ] Click "Buka Kamera"
- [ ] Camera permission requested
- [ ] Allow permission
- [ ] Camera stream shown
- [ ] Click "Ambil Foto"
- [ ] Blur permission: allow
- [ ] Modal closes
- [ ] Photo in gallery with pending status

#### 3.4 Metadata
- [ ] Enter location: "Jakarta Selatan, Blok C"
- [ ] Enter description: "Gedung A"
- [ ] Take photo with camera
- [ ] Photo saved dengan metadata
- [ ] Visible di admin dashboard

---

### 4. SYNC TESTING

#### 4.1 Manual Sync (Online)
1. Go online (DevTools > Network > Online)
2. Click "Sinkronisasi Sekarang" button
3. Status changes to "Sinkronisasi..."
4. Photos status changes: pending → syncing → synced
5. Status back to "Siap" after done

#### 4.2 Auto Sync
1. Offline mode: Upload beberapa foto
2. Go to DevTools > Network > Online
3. Auto-sync should start automatically
4. Check `/uploads/` folder di public directory
5. Photo files + metadata JSON ada

#### 4.3 Failed Sync Retry
1. Disconnect network saat syncing
2. Photo status: "failed"
3. Go online again
4. Click "Sinkronisasi Sekarang"
5. Failed photo di-retry
6. Status berubah ke "synced"

---

### 5. GALLERY TESTING

#### 5.1 Local Gallery
- [ ] Visit /survey/gallery
- [ ] All photos shown
- [ ] Status badges correct
- [ ] Timestamp format: dd-mm-yyyy hh:mm:ss
- [ ] Photo count matches

#### 5.2 Photo Preview
- [ ] Click photo
- [ ] Full-size preview shown
- [ ] Can see details
- [ ] Close by clicking outside

#### 5.3 Delete Photo
- [ ] Right-click photo atau click delete button
- [ ] Confirmation dialog shown
- [ ] Confirm delete
- [ ] Photo removed from gallery
- [ ] Count decreases

---

### 6. ADMIN DASHBOARD TESTING

#### 6.1 Admin Access
- [ ] Login dengan admin credentials
- [ ] Redirect ke /survey/dashboard
- [ ] Click "Admin Panel" button
- [ ] Redirect ke /admin
- [ ] See all uploaded photos

#### 6.2 Admin Only Features
- [ ] Try login dengan surveyor account
- [ ] Don't see "Admin Panel" button
- [ ] Can't access /admin directly (redirect)

#### 6.3 Photo Management
- [ ] See table with all photos
- [ ] Column: ID, Location, Date, Description, Size
- [ ] Eye icon: preview photo
- [ ] Download icon: download photo
- [ ] Trash icon: delete photo

#### 6.4 Filtering
- [ ] Filter by location: "Jakarta"
- [ ] Only photos dari Jakarta shown
- [ ] Filter by date range: last 7 days
- [ ] Only photos dalam range shown
- [ ] Combine filters: location + date
- [ ] Click "Reset" to clear filters

#### 6.5 Statistics
- [ ] Total Foto: correct count
- [ ] Total Size: correct MB calculation
- [ ] Lokasi Unik: correct count
- [ ] Hari Survei: correct count

---

### 7. RESPONSIVE DESIGN TESTING

#### 7.1 Mobile (375px width)
- [ ] All text readable
- [ ] Buttons clickable
- [ ] No horizontal scroll
- [ ] Camera works
- [ ] Layout stacks vertically

#### 7.2 Tablet (768px width)
- [ ] Grid layout adjusts
- [ ] Content properly spaced
- [ ] All features accessible

#### 7.3 Desktop (1920px width)
- [ ] Multi-column layout
- [ ] Dashboard stats grid
- [ ] Admin table scrollable horizontally
- [ ] Sidebar sticky

---

### 8. ERROR HANDLING TESTING

#### 8.1 Camera Errors
- [ ] Deny camera permission
- [ ] Error message shown
- [ ] Can still upload files

#### 8.2 Network Errors
- [ ] Disconnect during upload
- [ ] Graceful degradation
- [ ] Offline mode engaged
- [ ] Can retry when online

#### 8.3 Storage Errors
- [ ] Fill IndexedDB (simulate via DevTools)
- [ ] Error handling triggered
- [ ] User can clear storage
- [ ] Continue working

---

### 9. PERFORMANCE TESTING

#### 9.1 Load Time
- [ ] First load < 3 seconds
- [ ] Subsequent loads < 1 second
- [ ] Smooth transitions

#### 9.2 Offline Performance
- [ ] Works without network
- [ ] No lag when offline
- [ ] UI responsive

#### 9.3 Memory
- [ ] No memory leaks after 10 min usage
- [ ] DevTools > Memory: stable usage

---

### 10. PWA INSTALLATION TESTING

#### 10.1 Install Prompt (Android)
1. Open Chrome
2. Visit http://localhost:3000 (or deployed URL)
3. Should see "Install app" prompt
4. Click install
5. App appears on home screen
6. Open from home screen
7. Works in fullscreen (no address bar)

#### 10.2 Install Manual (iOS)
1. Open Safari
2. Click share button
3. Select "Add to Home Screen"
4. Name: "Survey"
5. Add
6. Open from home screen
7. Works in fullscreen

#### 10.3 PWA Features
- [ ] Manifest loaded correctly
- [ ] Icons display properly
- [ ] App title correct
- [ ] Theme color applied
- [ ] Works offline after install

---

### 11. API ENDPOINT TESTING

#### 11.1 Test dengan curl/Postman

```bash
# Health check
curl http://localhost:3000/api/health

# Upload photo
curl -X POST http://localhost:3000/api/upload \
  -F "file=@photo.jpg" \
  -F "photoId=test-123" \
  -F "location=Jakarta" \
  -F "description=Test photo"

# List photos
curl http://localhost:3000/api/photos/list

# Get stats
curl http://localhost:3000/api/stats

# Delete photo
curl -X DELETE http://localhost:3000/api/photos/[photoId]
```

---

### 12. BROWSER COMPATIBILITY TESTING

Test pada setiap browser:

| Browser | Desktop | Mobile | Notes |
|---------|---------|--------|-------|
| Chrome | ✓ | ✓ | Full support |
| Firefox | ✓ | ✓ | Full support |
| Safari | ✓ | ✓ | iOS 14+ |
| Edge | ✓ | ✓ | Full support |
| Samsung Internet | - | ✓ | Android |

---

## Automated Testing (Optional)

### Unit Tests Example

```typescript
// __tests__/auth.test.ts
import { login, getCurrentUser } from '@/lib/auth'

describe('Auth', () => {
  test('login with valid credentials', () => {
    const result = login({ username: 'surveyor1', password: 'password123' })
    expect(result.success).toBe(true)
    expect(result.user?.role).toBe('surveyor')
  })

  test('login with invalid credentials', () => {
    const result = login({ username: 'invalid', password: 'wrong' })
    expect(result.success).toBe(false)
  })
})
```

### Integration Tests Example

```typescript
// __tests__/upload.integration.test.ts
describe('Photo Upload Flow', () => {
  test('upload photo offline and sync online', async () => {
    // 1. Simulate offline
    // 2. Upload photo
    // 3. Verify IndexedDB storage
    // 4. Go online
    // 5. Verify sync completes
  })
})
```

---

## Test Coverage Goals

- **Statements**: > 80%
- **Branches**: > 75%
- **Functions**: > 80%
- **Lines**: > 80%

---

## Known Issues & Workarounds

### Issue 1: Service Worker caching old version
**Workaround**: Hard refresh (Ctrl+Shift+R)

### Issue 2: IndexedDB quota exceeded
**Workaround**: Clear DevTools > Storage > Clear site data

### Issue 3: Camera not working on desktop
**Expected**: Use file upload instead

### Issue 4: iOS camera permission persists
**Expected**: User needs to change in Settings > Privacy

---

## Testing Best Practices

1. Test di Incognito/Private mode untuk fresh session
2. Clear cache antara tests
3. Test both online & offline scenarios
4. Test mobile dengan actual device jika mungkin
5. Test dengan slow network (throttle di DevTools)
6. Test dengan weak device (CPU throttling)

---

## Sign-off

- [ ] All manual tests passed
- [ ] No critical errors
- [ ] PWA features working
- [ ] Performance acceptable
- [ ] Ready for deployment

**Tested by**: ________________
**Date**: ________________
**Sign**: ________________

---

Generated: January 7, 2026
