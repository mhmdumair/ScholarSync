# 🕐 Student Scheduler

A real-time student timetable built with **Next.js 14**, **MongoDB**, **Prisma**, and **Google Login**. Works offline as a PWA.

---

## ✨ Features

- ⚡ **Real-time countdowns** — live seconds ticking down to your next class
- 📅 **Weekly timetable grid** — visual overview of your whole week
- ➕ **Add/Remove lectures** — set start time, end time, subject, location, instructor
- ⏰ **Deadline timers** — set a deadline per lecture and watch it count down
- 🔴 **Live progress bar** — visual bar showing how far through a lecture you are
- 🟡 **"Starting soon" alerts** — highlighted when class starts in < 30 mins
- 📱 **PWA / Offline support** — installs on phone, works offline via IndexedDB cache
- 🔐 **Google OAuth** — secure sign-in with your Google account
- 🌙 **Dark theme** — beautiful dark UI with grid background

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Database | MongoDB Atlas |
| ORM | Prisma |
| Auth | NextAuth.js v4 + Google OAuth |
| Styling | Tailwind CSS + Custom CSS |
| Offline | next-pwa (Service Worker) + IndexedDB |
| Time | date-fns |
| Fonts | Syne + Space Mono |

---

## 🚀 Setup Guide

### Step 1: Clone and Install

```bash
git clone <your-repo>
cd student-scheduler
npm install
```

### Step 2: MongoDB Atlas

1. Go to [mongodb.com/cloud/atlas](https://mongodb.com/cloud/atlas)
2. Create a free cluster
3. Create a database user with read/write access
4. Add `0.0.0.0/0` to IP whitelist (or your IP)
5. Get your connection string: `mongodb+srv://user:pass@cluster.mongodb.net/`

### Step 3: Google OAuth

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project
3. Go to **APIs & Services → Credentials**
4. Create **OAuth 2.0 Client ID** (Web application)
5. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
6. Copy Client ID and Client Secret

### Step 4: Environment Variables

Copy `.env.local.example` to `.env.local` and fill in:

```env
DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/student_scheduler?retryWrites=true&w=majority"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="run: openssl rand -base64 32"
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret"
```

### Step 5: Generate Prisma Client & Push Schema

```bash
npm run prisma:generate
npm run prisma:push
```

### Step 6: Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 📱 Install as PWA (Mobile)

On Android Chrome: tap **"Add to Home Screen"** from the browser menu
On iOS Safari: tap **Share → Add to Home Screen**

The app will then work like a native app, including offline mode!

---

## 🏗 Project Structure

```
student-scheduler/
├── app/
│   ├── actions/
│   │   └── lectures.ts       # Server Actions (no API needed!)
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts
│   │   └── lectures/route.ts
│   ├── auth/signin/page.tsx
│   ├── dashboard/
│   │   ├── page.tsx           # Server Component
│   │   └── DashboardClient.tsx # Client Component
│   ├── globals.css
│   ├── layout.tsx
│   └── providers.tsx
├── components/
│   ├── LectureCard.tsx        # Card with live countdown
│   ├── LectureModal.tsx       # Add/Edit form modal
│   ├── LiveClock.tsx          # Real-time clock
│   ├── NextClassWidget.tsx    # "Next Up" panel
│   ├── OfflineBanner.tsx      # Offline indicator
│   └── WeeklyGrid.tsx         # Visual weekly timetable
├── hooks/
│   ├── useClock.ts            # 1-second interval clock
│   └── useOffline.ts          # Network status
├── lib/
│   ├── auth.ts                # NextAuth config
│   ├── offlineCache.ts        # IndexedDB wrapper
│   ├── prisma.ts              # Prisma singleton
│   └── time.ts                # Time utilities
├── prisma/
│   └── schema.prisma          # MongoDB schema
├── types/
│   └── next-auth.d.ts         # Session type extension
└── public/
    └── manifest.json          # PWA manifest
```

---

## 🔒 How Authentication Works

- **NextAuth.js** handles Google OAuth
- Sessions stored in **MongoDB** via Prisma Adapter
- All server actions check session before any DB operation
- Each user only sees their own lectures

---

## 📴 How Offline Works

1. **Service Worker** (via next-pwa) caches all app assets
2. When online → lectures saved to **IndexedDB** automatically
3. When offline → app loads from Service Worker cache, lectures from IndexedDB
4. Adding/editing is **disabled** offline (shows tooltip)
5. A banner notifies the user when offline

---

## 🚢 Deploy to Vercel

```bash
npm i -g vercel
vercel
```

Add all environment variables in Vercel dashboard.
Update `NEXTAUTH_URL` to your production URL.
Update Google OAuth redirect URIs to include your production URL.

---

## 📝 License

MIT
