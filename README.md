# SOCSync - Intelligent Shift Manager

AI-powered shift management system for Security Operations Centers built with Next.js 15, Firebase, and Gemini AI.

## 🚀 Features

- **AI-Powered Scheduling**: Automatic shift generation using Google Gemini AI
- **Real-time Calendar View**: Visual 7-day schedule overview
- **Shift Swap Marketplace**: Peer-to-peer shift exchange system
- **User Preferences**: Customizable shift preferences and blackout dates
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

1. **Clone and install:**
```bash
npm install
```

2. **Follow setup guide:**
- Read `QUICK_START.md` for complete Firebase setup
- Or read `FIREBASE_SETUP.md` for detailed Firestore configuration

3. **Run development server:**
```bash
npm run dev
```

4. **Open in browser:**
```
http://localhost:3000
```

## 🔑 Environment Variables

Your `.env.local` is already configured with:
```
FIREBASE_PROJECT_ID=soc-scheduler-c2ad9
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@soc-scheduler-c2ad9.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="..."
GEMINI_API_KEY=...
```

## 📂 Project Structure

```
SOC/
├── app/
│   ├── api/
│   │   └── generate-schedule/       # AI schedule generation endpoint
│   │       └── route.ts          # AI schedule generation endpoint
│   ├── components/
│   │   ├── AdminPanel.tsx         # Admin control panel
│   │   ├── CalendarView.tsx       # Weekly calendar display
│   │   ├── PreferencesPanel.tsx   # User settings
│   │   ├── Sidebar.tsx            # Navigation sidebar
│   │   ├── SwapMarket.tsx         # Shift swap interface
│   │   └── UserManagement.tsx     # User creation (admin only)
│   ├── login/
│   │   └── page.tsx               # Login page
│   ├── globals.css                # Global styles
│   ├── layout.tsx                 # Root layout
│   └── page.tsx                   # Main dashboard
├── lib/
│   ├── firebase/
│   │   ├── config.ts              # Firebase client config
│   │   └── admin.ts               # Firebase Admin SDK
│   └── types.ts                   # TypeScript type definitions
├── QUICK_START.md                 # Setup guide (start here!)
├── FIREBASE_SETUP.md              # Detailed Firestore info
├── .env.local                     # Environment variables
├── next.config.ts                 # Next.js configuration
├── tailwind.config.ts             # Tailwind CSS configuration
├── tsconfig.json                  # TypeScript configuration
├── middleware.ts                  # Auth middleware
└── package.json                   # Dependencies
```

## 🎯 How It Works

### Authentication Flow
1. Admin creates user accounts via Firebase Authentication
2. User data stored in Firestore `users` collection
3. Login handled by Firebase Auth (email/password)
4. Session managed on client-side

### Schedule Generation
1. Admin clicks "Auto-Generate" in Team tab
2. API calls Gemini AI with user preferences
3. AI generates fair shift distribution
4. Shifts saved to Firestore `shifts` collection
5. Calendar updates automatically

### Shift Swapping
1. User posts shift to swap marketplace
2. Swap request stored in Firestore
3. Other users can accept the swap
4. On acceptance, shift ownership transfers
5. Both users see updated shifts immediately

## 🔐 Firebase Collections

Your app uses 3 Firestore collections:

1. **users** - User profiles and preferences
2. **shifts** - All scheduled shifts
3. **swap_requests** - Shift swap marketplace

See `FIREBASE_SETUP.md` for complete schema and security rules.

## 📝 Default Roles

- **ADMIN**: Can create users, generate schedules, manage team
- **ANALYST**: Can view schedule, swap shifts, set preferences

## 🚦 Getting Started Checklist

- [ ] Read `QUICK_START.md`
- [ ] Enable Firebase Authentication
- [ ] Create Firestore database
- [ ] Apply security rules
- [ ] Create admin user
- [ ] Run `npm run dev`
- [ ] Login and test

## 📞 Support

- Check `QUICK_START.md` for step-by-step setup
- Review `FIREBASE_SETUP.md` for Firestore details
- Check Firebase Console for errors
- Inspect browser console (F12) for client errors

## 📄 License

MIT

---

Built with ❤️ for SOC teams using Next.js 15 + Firebase + Gemini AI


```

## 🔧 Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create or update `.env.local` with your Google Gemini API key:

```env
API_KEY=your_gemini_api_key_here
```

Get your API key from [Google AI Studio](https://makersuite.google.com/app/apikey)

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for Production

```bash
npm run build
npm start
```

## 🎨 UI Design

The application features a clean, minimalist design with:
- Light theme with zinc color palette
- Responsive layout (mobile & desktop)
- Smooth animations and transitions
- Accessible components

## 📱 Key Components

### Dashboard
- Quick stats overview
- Next shift information
- Weekly calendar view

### Admin Panel
- AI-powered schedule generation
- Team statistics
- Shift distribution charts

### Swap Market
- Post shift swap requests
- Browse available swaps
- Accept/decline requests

### Preferences
- Select preferred shifts
- Set blackout dates
- Update personal settings

## 🔐 User Roles

- **Admin**: Full access including team management and AI scheduling
- **Analyst**: Standard access to calendar, swaps, and preferences

## 🤝 Contributing

This is a demo project. Feel free to fork and customize for your needs.

## 📄 License

MIT

## 🙏 Acknowledgments

- Built with Next.js and React
- Icons by Lucide React
- Charts by Recharts
- AI by Google Gemini
