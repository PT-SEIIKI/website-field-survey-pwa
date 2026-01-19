# Survey PWA

## Overview
A Progressive Web Application for conducting field surveys with photo upload capabilities. Built with Next.js 16, React 19, and Tailwind CSS.

## Project Structure
- `app/` - Next.js App Router pages and API routes
  - `admin/` - Admin dashboard pages
  - `api/` - API endpoints (health, photos, stats, upload)
  - `login/` - Login page
  - `survey/` - Survey related pages (dashboard, gallery, upload)
- `components/` - Reusable React components
- `hooks/` - Custom React hooks
- `lib/` - Utility functions
- `public/` - Static assets
- `styles/` - Global styles

## Tech Stack
- **Framework**: Next.js 16 with Turbopack
- **UI**: React 19, Tailwind CSS, Radix UI components
- **Forms**: React Hook Form with Zod validation
- **Charts**: Recharts
- **Notifications**: Sonner toast

## Development
Run the dev server:
```bash
npm run dev -- -p 5000 -H 0.0.0.0
```

## Deployment
Configured for autoscale deployment:
- Build: `npm run build`
- Start: `npm run start -- -p 5000 -H 0.0.0.0`

## Demo Credentials
- **Surveyor**: surveyor1 / password123
- **Admin**: admin / admin123

## Recent Changes
- **2026-01-19**: Implemented Folder Management system with full offline and online support.
  - Added `folders` table to database schema with `houseName` and `nik` fields.
  - Added `folderId` to `survey_entries` to link entries with folders.
  - Implemented FolderManager UI component for CRUD operations.
  - Integrated folder selection in the Upload and Camera pages.
  - Updated SyncManager to handle folder and photo synchronization from IndexedDB to PostgreSQL.
  - Added search functionality for folders in the Dashboard.
