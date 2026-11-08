# 🎓 IEM Online Admission System (Full-Stack React + Express)
**Institute of Engineering & Management (IEM), Kolkata**  
*Department of Computer Science & Engineering | Course: PCCCS504 (Software Engineering & Project Management)*  
*Team: P4 ("DevForge") | Academic Session: 2026–2027*

---

## 🏛️ Executive Summary

The **IEM Admission System** is a production-ready, high-performance web platform engineered to eliminate paper-intensive admission workflows at IEM Kolkata. It strictly implements the architecture and **"Indigo Harbor" design system** defined in [`context/PROTOTYPE_PLAN.md`](context/PROTOTYPE_PLAN.md), inspired by the Voltway aesthetic and institutional higher-education standards.

---

## 🚀 Quick Start (Running on Localhost)

Both frontend and backend can be run with a single command using `npm`:

```bash
# 1. From the project root, install all dependencies (if not already installed)
npm run install:all

# 2. Start both Express Backend (Port 5000) and React Frontend (Port 5173) concurrently
npm run dev
```

- **Frontend Portal**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:5000/api](http://localhost:5000/api)
- **API Health Check**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## 🌟 Modules & Features

### 1. 🌐 Public Admissions Portal (Voltway Inspired)
- **Institutional Top Bar & Ticker**: Live Phase-1 counseling announcements and admission helpline.
- **Accreditation Header**: IEM crest, NAAC Grade 'A', Autonomous status under MAKAUT.
- **Hero Section**: Distinctive pill badge (`• 2026–2027 B.Tech Admissions Open`), bold typography, dual CTAs (*Apply Online* and *Track Application*).
- **Live 4-Metric Ribbon**:
  - `5+` Premier Engineering Specializations
  - `100%` Placement Assistance Record
  - `15,000+` Distinguished Alumni Worldwide
  - `₹72 LPA` Highest Package Offered
- **Interactive Eligibility Evaluator**: Calculates Class 12 PCM aggregate % in real-time, cross-references entrance examination ranks (WBJEE / JEE Main), and delivers instant cutoff verdicts across engineering departments.
- **Undergraduate Engineering Programs Grid**: Comprehensive intake details, department codes, and curriculum pillars for CSE, CSE (AI&ML), IT, CSBS, and ECE.
- **Admission Procedures**: 4-step roadmap and official counseling schedule.

---

### 2. 🎓 Student Admission Portal
- **Instant Demo Switcher**: Instant 1-click preview of candidate records across lifecycle states:
  - **Rahul Sen** (`IEM-2026-1042`): *Seat Offered* ➔ Settle semester fees online via Razorpay.
  - **Ananya Roy** (`IEM-2026-1088`): *Admission Confirmed* ➔ View & print verified formal Admission Letter.
  - **Sourav Banerjee** (`IEM-2026-1145`): *Action Required* ➔ Live FR-17 discrepancy query resolution.
  - **Priya Das** (`IEM-2026-1204`): *Under Committee Review*.
  - **Arpan Mukherjee** (`IEM-2026-1250`): *Verified Eligible*.
  - **+ Start New Blank Form**: Opens the guided wizard.
- **5-Step Guided Application Wizard**:
  - *Step 1*: Personal & Guardian Information
  - *Step 2*: Academic Qualifications & Entrance Exam (**Live PCM % calculator** with minimum 60% validation)
  - *Step 3*: Branch Preferences (Priority 1, 2, 3 selection)
  - *Step 4*: Document Uploads (Photo, 10th Admit Card, 12th Marksheet, Rank Card) with preview thumbnails and file validation
  - *Step 5*: Review Summary & Solemn Declaration check.
- **Visual 8-Stage Lifecycle Progress Tracker**:
  `Draft` ➔ `Submitted` ➔ `Under Review` ➔ `Query Pending` ➔ `Verified Eligible` ➔ `Seat Offered` ➔ `Enrolled 🎓`
- **Interactive Query Resolution Loop (FR-17)**: Contextual alert with scrutinizer's note, student explanation textfield, and simulated re-upload.
- **Razorpay Payment Hub**: Itemized fee breakdown (Tuition ₹65,000, Lab/Library ₹12,000, Caution Deposit ₹8,000 = Total ₹85,000), simulated gateway transaction, and instant seat confirmation with confetti celebration.
- **Provisional Admission Letter**: Printable formal admission slip with college crest, candidate credentials, transaction ID, digital verification seal, and Registrar signature.

---

### 3. 🛡️ Admin Staff & Scrutiny Committee Console
- **Command Center Statistics**: Real-time counter for Total Applicants, Pending Scrutiny, Active Discrepancy Queries, Confirmed Admissions, and Total Fee Settlement.
- **Branch Capacity Quota Monitor**: Visual capacity progress bars for CSE, CSE-AIML, IT, CSBS, and ECE.
- **Applicant Data Grid & Search Toolbar**: Filter by department or application status; live search by Name, Application ID, or Rank.
- **Split-Screen Verification Suite**:
  - *Left Pane (50%)*: Complete student demographic, marks, PCM aggregate %, and branch preference list.
  - *Right Pane (50%)*: Embedded document viewer with simulated high-resolution preview sheets (12th Marksheet, Rank Card, 10th Admit, Photo) with **Zoom In**, **Zoom Out**, and **90° Rotation** controls.
  - *Action Bar*: One-click `[✓ Verify & Mark Eligible]`, `[⚠️ Flag Discrepancy (Query)]`, `[🎓 Offer Seat]`, or `[✕ Reject Criteria]`.
- **Automated Merit Ranking Engine**: Computes composite scores (40% rank, 35% PCM %, 25% 10th score) and runs automated batch allotment.
- **Admissions Roster CSV Export**: One-click generation and instant download of `IEM_Admissions_Roster_2026.csv`.

---

## 🏗️ Architecture & Project Structure

```
IEM Admission System/
├── package.json                   # Root orchestrator (concurrently starts server & client)
├── context/
│   ├── PROTOTYPE_PLAN.md          # Architectural Blueprint & Requirements Spec
│   └── images.jpg                 # Voltway Layout Visual Reference
├── server/                        # Express.js Backend
│   ├── package.json
│   ├── .env                       # Environment configuration
│   ├── .env.example
│   └── src/
│       ├── server.js              # Server entry point, CORS, logging, error handler
│       ├── config/
│       │   ├── firebaseAdmin.js   # Firebase Admin SDK init + fallback mock provider
│       │   └── razorpayConfig.js  # Razorpay SDK init + fallback mock provider
│       ├── middleware/
│       │   └── authMiddleware.js  # Token decoding & Admin RBAC clearance
│       ├── controllers/
│       │   ├── authController.js
│       │   ├── applicationController.js
│       │   ├── adminController.js
│       │   ├── paymentController.js
│       │   └── meritController.js
│       ├── routes/
│       │   ├── authRoutes.js
│       │   ├── applicationRoutes.js
│       │   ├── adminRoutes.js
│       │   ├── paymentRoutes.js
│       │   └── meritRoutes.js
│       ├── data/
│       │   └── initialStore.js    # Seed candidates, quotas, fee schedule
│       └── utils/
│           └── meritCalculator.js # Composite index & eligibility calculations
└── client/                        # React Frontend (Vite)
    ├── package.json
    ├── vite.config.js             # Vite dev server with proxy to :5000/api
    ├── index.html                 # Inter font & Razorpay checkout script
    ├── .env                       # Client environment configuration
    ├── .env.example
    └── src/
        ├── main.jsx
        ├── App.jsx                # View router & context provider mounting
        ├── index.css              # "Indigo Harbor" Design System tokens & utilities
        ├── services/
        │   ├── api.js             # Axios client connecting to /api
        │   ├── firebase.js        # Firebase Web SDK init + fallback mock
        │   └── razorpay.js        # Razorpay checkout script loader
        ├── context/
        │   ├── AuthContext.jsx    # Session state & demo persona switching
        │   └── ApplicationContext.jsx # Real-time state synchronization
        └── components/
            ├── common/            # Navbar, Footer, StatusBadge, AuthModal, Toast
            ├── landing/           # LandingPage (Hero, Metrics, Evaluator, Programs)
            ├── student/           # Wizard, StatusAndPaymentHub, RazorpayModal, Letter
            └── admin/             # AdminPortal, SplitScreenVerification, MeritRankModal
```

---

## 🔑 Firebase & Razorpay API Configuration

The system is engineered to run immediately out-of-the-box in **Structured Mock Mode** without requiring external credentials for localhost evaluation.

When you are ready to connect live cloud credentials:

### 1. Firebase Authentication & Admin SDK
1. **Client**: Update `client/.env` with credentials from *Firebase Console -> Project Settings -> General -> Your apps -> Web app*:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key_here
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_USE_MOCK_AUTH=false
   ```
2. **Server**: Update `server/.env` with credentials from *Firebase Console -> Project Settings -> Service Accounts*:
   ```env
   FIREBASE_PROJECT_ID=your_project_id
   FIREBASE_CLIENT_EMAIL=your_service_account_email
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
   USE_MOCK_FIREBASE_ADMIN=false
   ```

### 2. Razorpay Payment Gateway
1. Update `server/.env` and `client/.env` with your API Keys from *Razorpay Dashboard -> Settings -> API Keys*:
   ```env
   # server/.env
   RAZORPAY_KEY_ID=rzp_test_...
   RAZORPAY_KEY_SECRET=your_key_secret
   USE_MOCK_RAZORPAY=false

   # client/.env
   VITE_RAZORPAY_KEY_ID=rzp_test_...
   VITE_USE_MOCK_RAZORPAY=false
   ```

---

## 👥 Authors & Academic Credits
- **Course**: PCCCS504 Software Engineering & Project Management
- **Department**: Department of Computer Science & Engineering
- **Institution**: Institute of Engineering & Management (IEM), Kolkata
- **Team**: P4 ("DevForge")
