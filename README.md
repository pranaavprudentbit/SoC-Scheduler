# SOCSync - Intelligent Shift Manager

AI-powered shift management system for Security Operations Centers built with Next.js 15, Firebase, and Gemini AI.

## 🚀 Features

- **AI-Powered Scheduling**: Automatic shift generation using Google Gemini AI
- **Real-time Calendar View**: Visual 7-day schedule overview
- **Swap Shifts**: Peer-to-peer shift trade system
- **Activity Logging**: Comprehensive log of all admin and user actions
- **User Preferences**: Customizable shift preferences and unavailable dates
- **Admin Dashboard**: Team management and analytics
- **Role-Based Access**: Admin and Analyst role separation
- **Firebase Backend**: Secure authentication and real-time database

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Firebase (Firestore + Authentication)
- **UI Components**: Lucide React (icons)
- **Charts**: Recharts
- **AI**: Google Gemini API

## 📦 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create or update `.env.local` with your Firebase config and Google Gemini API key:

```env
FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY="..."
GEMINI_API_KEY=...
```

Get your Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey).
See `FIREBASE_SETUP.md` for detailed Firestore configuration.

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📂 Project Structure

```
SOC/
├── app/
│   ├── api/               # API routes (schedule generation)
│   ├── components/        # React components (AdminPanel, CalendarView, etc.)
│   ├── login/             # Login page
│   ├── globals.css        # Global styles
│   └── page.tsx           # Main dashboard
├── lib/
│   ├── firebase/          # Firebase config
│   └── types.ts           # Type definitions
├── QUICK_START.md         # Setup guide
├── FIREBASE_SETUP.md      # Firestore schema info
└── package.json           # Dependencies
```

## 🎯 How It Works

### Authentication
1. Admin creates user accounts via Firebase Auth.
2. Login handled by Firebase Auth.

### Schedule Generation
1. Admin clicks "Generate Schedule" in the Dashboard.
2. AI generates a fair shift distribution based on preferences and availability.
3. Shifts are saved to Firestore and the calendar updates automatically.

### Swap Shifts
1. User posts a request to "Swap Shifts".
2. Other users can accept the swap.
3. Ownership transfers immediately upon acceptance.

### Activity Logging
1. All key actions (e.g., assigning shifts, updating roles, swapping) are logged.
2. Admins can view the full history in the "Logs" tab of the dashboard.

## 🔐 User Roles

- **ADMIN**: Can create users, generate schedules, manage the team, and view activity logs.
- **ANALYST**: Can view the schedule, swap shifts, and set preferences.

## 📄 License

MIT

---

Built with ❤️ for SOC teams using Next.js 15 + Firebase + Gemini AI
