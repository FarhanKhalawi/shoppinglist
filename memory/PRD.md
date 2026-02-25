# Shopping List PWA - PRD

## Original Problem Statement
Build a cross-device shopping list app as a Progressive Web App (PWA) with:
- Arabic-first, RTL by default with English toggle
- Mobile-first responsive UI with Light + Dark mode
- JWT email/password + Google OAuth authentication
- Offline-first with IndexedDB and sync
- Shopping lists and items CRUD with categories, quantities, filters

## User Personas
1. **Arabic-speaking shoppers** - Primary users who want to organize shopping in Arabic
2. **Multi-device users** - People who need lists synced across phone/tablet/desktop
3. **Offline shoppers** - Users in areas with poor connectivity

## Core Requirements (Static)
- PWA with installable app, service worker, manifest
- RTL Arabic-first with English support
- JWT + Google OAuth authentication
- Local-only mode fallback
- IndexedDB for offline storage
- Sync when online (last-write-wins)
- Export/Import data functionality

## What's Been Implemented (Jan 2026)

### Backend (FastAPI + MongoDB)
- ✅ User authentication (JWT email/password)
- ✅ Google OAuth integration (Emergent Auth)
- ✅ Shopping Lists CRUD API
- ✅ Items CRUD API with quantity, unit, category, notes
- ✅ Bulk actions (mark all done, clear purchased)
- ✅ Export/Import endpoints
- ✅ Sync endpoint for offline changes

### Frontend (React + Tailwind)
- ✅ Welcome page with hero image
- ✅ Auth page (Login/Signup tabs + Google + Local mode)
- ✅ Dashboard with lists overview
- ✅ List detail with quick-add bar
- ✅ Item management (checkbox, edit, delete)
- ✅ Search and filters (All/Purchased/Not Purchased)
- ✅ Settings (Theme, Language, Export/Import)
- ✅ RTL Arabic support with Cairo + Tajawal fonts
- ✅ Dark/Light/System theme

### PWA Features
- ✅ Web manifest with Arabic metadata
- ✅ Service Worker for offline caching
- ✅ IndexedDB wrapper for local storage
- ✅ iOS safe-area support

## Prioritized Backlog

### P0 (Critical) - DONE
- [x] Core authentication flow
- [x] Lists and items CRUD
- [x] Basic offline support
- [x] RTL Arabic UI

### P1 (High Priority) - Future
- [ ] Drag-and-drop item reordering
- [ ] Swipe gestures on mobile
- [ ] Push notifications for shared lists
- [ ] List sharing between users

### P2 (Nice to Have) - Future
- [ ] Barcode scanner for products
- [ ] Price tracking
- [ ] Suggested items based on history
- [ ] Voice input for adding items
- [ ] Categories with custom colors/icons

## Technical Architecture

```
Frontend (React 19)
├── Contexts: Auth, Theme, Language
├── Components: Dashboard, ListDetail, Settings
├── Hooks: useShoppingLists, useListItems
├── Lib: api.js, db.js (IndexedDB)
└── PWA: service-worker.js, manifest.json

Backend (FastAPI)
├── Auth: JWT + Google OAuth session
├── Models: User, ShoppingList, Item
├── Routes: /api/auth/*, /api/lists/*, /api/sync
└── DB: MongoDB with Motor async driver
```

## Next Tasks
1. Implement drag-and-drop for item reordering
2. Add swipe actions on mobile
3. Implement conflict resolution UI for sync
4. Add list sharing functionality
