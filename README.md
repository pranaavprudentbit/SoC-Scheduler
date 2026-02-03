# SOCSync - Intelligent Shift Manager

AI-powered shift management system for Security Operations Centers (SOC) built with **Next.js 15**, **Firebase**, and **Gemini AI**.

## 🚀 Features

### Core Scheduling
- **AI-Powered Scheduling**: Automatic, fair shift generation using Google Gemini AI, respecting constraints and preferences.
- **Real-time Calendar View**: Interactive 7-day schedule overview with drag-and-drop capabilities.
- **Smart Shift Swapping**: Peer-to-peer shift trade system with "Swap Market" for offering/taking shifts.
- **Shift Recommendations**: AI-driven suggestions for filling gaps based on availability and fairness.

### Team Management
- **Leave Management**: comprehensive leave request and approval workflow.
- **Clock In/Out Tracking**: Real-time tracking of shift attendance and actual working hours.
- **Bulk Availability**: Easy interface for users to mark availability for multiple days or weeks.
- **Performance Metrics**: Detailed dashboards showing reliability scores, shift completion rates, and swap activity.
- **User Profiles**: Rich user profiles with role management, avatars, and preference settings.

### Operational Tools
- **Smart Handover**: Shift notes and broadcast messages to ensure smooth transitions between shifts.
- **Team Coverage**: Heatmaps and status indicators to visualize staffing levels and potential gaps.
- **Activity Logging**: Comprehensive immutable log of all admin and user actions for auditability.
- **Role-Based Access Control**: Strict separation between Admin and Analyst capabilities.

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Backend / Database**: Firebase (Firestore, Authentication)
- **AI Engine**: Google Gemini API (via `@google/genai`)
- **UI Components**: Lucide React (icons)
- **Visualization**: Recharts (Analytics & Performance charts)
- **Linting/Formatting**: ESLint

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

- Get your Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey).
- See `FIREBASE_SETUP.md` for detailed Firestore configuration.

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📂 Project Structure

```
SOC/
├── app/
│   ├── api/                    # API routes (schedule generation, users, etc.)
│   ├── components/             # React components
│   │   ├── AdminPanel.tsx      # Main Admin dashboard
│   │   ├── CalendarView.tsx    # Shift calendar component
│   │   ├── ClockInOut.tsx      # Time tracking component
│   │   ├── LeaveRequestPanel.tsx # Leave management UI
│   │   ├── PerformanceDashboard.tsx # User stats & metrics
│   │   ├── ShiftRecommendations.tsx # AI suggestions
│   │   └── ...
│   ├── login/                  # Login page
│   └── page.tsx                # Main application entry
├── lib/
│   ├── firebase/               # Firebase configuration & admin SDK
│   ├── types.ts                # TypeScript definitions
│   └── shiftConfig.ts          # Configuration for shift timings
├── public/                     # Static assets
└── ...
```

## 🎯 How It Works

### Scheduling & AI
1. **Configuration**: Admin sets shift parameters (staff per day, rest days, etc.).
2. **Generation**: Admin triggers "Generate Schedule". Gemini AI analyzes constraints, availability, and fairness to propose a roster.
3. **Adjustment**: Admins can manually drag-and-drop shifts or use **Shift Recommendations** to fill specific slots.

### Daily Operations
- **Clock In/Out**: Analysts use the dashboard to log their start and end times.
- **Handovers**: Users leaving a shift leave "Shift Notes" for the incoming team.
- **Swaps**: If a user can't make a shift, they post it to the **Swap Marketplace**. Only eligible peers can accept it.

### Administration
- **Leaves**: Users submit leave requests; Admins approve/reject them in the **Leave Request Panel**.
- **Monitoring**: Admins view **Team Coverage Heatmaps** and **Performance Dashboards** to ensure operational efficiency.
- **Logs**: Every significant action is recorded in the **Activity Log** for transparency.

## 🔐 User Roles

- **ADMIN**: Full system control. Can generate schedules, manage users, approve leaves, and access all analytics.
- **ANALYST**: Operational view. Can see schedules, manage their availability, swap shifts, clock in/out, and view their own stats.

## 📄 License

MIT

---

Built with ❤️ for SOC teams using Next.js 15 + Firebase + Gemini AI
