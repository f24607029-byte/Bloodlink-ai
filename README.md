# BloodLink AI 🩸
### Pakistan’s Intelligent Blood Donation & Emergency Crisis Response Platform

BloodLink AI is a production-grade, premium full-stack healthcare coordination platform built initially for Rawalpindi & Islamabad, Pakistan. 

It fuses high-fidelity geo-mapping with real-time donor outreach networks, gamified contributor availability streaks, automated medical triage classification, and clinical chatbot counseling powered securely by server-side Gemini AI.

---

## 🛠️ Production Tech Stack

- **Frontend SPA:** React + TypeScript + Vite + Tailwind CSS (v4) + Motion
- **Backend Service:** Node.js + Express + CORS Security Middleware
- **AI Triage Kernels:** Google Gemini 1.5 Pro/Flash SDK (`@google/genai` utilizing standard server-side token authentication)
- **Mapping:** OpenStreetMap + Leaflet.js
- **Chart Telemetry:** Recharts + D3-based aggregates
- **Databases:** MongoDB Atlas Client (Option A) with a local, zero-config in-memory seed generator (Option B Fallback)

---

## 📂 New Reorganized Directory Structure

To fulfill production best practices, the codebase has been cleanly separated into modular client and server layers:

```text
├── /frontend                      # React client-side sources (Vite SPA)
│   ├── main.tsx                   # Mounting entry point
│   ├── App.tsx                    # Main UI Dashboard coordinator
│   ├── index.css                  # Tailwinds (v4) design token declarations
│   ├── types.ts                   # Unified types (User, Hospital, Donor, SOS, Camp)
│   ├── lib/
│   │   ├── api.ts                 # Unified client API_BASE endpoint resolver
│   │   └── mlEngine.ts            # Mathematical ML kernels (Naive Bayes text class, Logistic, KMeans)
│   └── components/                # Independent React layout modules
│       ├── AIChatbot.tsx          # Dynamic bilingual clinical chatbot
│       ├── MapComponent.tsx       # Leaflet geographic maps coordinator
│       ├── SOSRequestForm.tsx     # Surgical emergency launcher
│       ├── DonorSearch.tsx        # Searchable regional donor registry card
│       ├── DonorStreakBadge.tsx   # Contributor streak & gamified badges
│       └── StatsDashboard.tsx     # Inventory graphs & donut telemetry charts
│
├── /backend                       # Decoupled backend architecture
│   ├── server.ts                  # Central Express framework organizer
│   ├── config/
│   │   └── config.ts              # System-wide environment variable parser
│   ├── data/
│   │   └── seedData.ts            # Extensive Islamabad/Rawalpindi base seed records
│   ├── services/
│   │   ├── dbService.ts           # Dual-mode DB Engine (Mongo Atlas / Local Seed Store)
│   │   └── geminiService.ts       # Secure Google Gemini AI integration and fallbacks
│   └── routes/                    # Modular, separated Express routes
│       ├── authRoutes.ts          # Volunteer authentication profiles
│       ├── donorRoutes.ts         # Direct donor queries & reviews
│       ├── hospitalRoutes.ts      # Hospital catalog inventories
│       ├── campRoutes.ts          # Upcoming donation campaign schedules
│       ├── emergencyRoutes.ts     # Urgent SOS requests management
│       ├── notificationRoutes.ts  # System alerts and notifications broadcast
│       ├── mlRoutes.ts            # Machine learning operations
│       └── chatRoutes.ts          # Chat taxonomy, Naive Bayes models, & Gemini prompts
│
├── server.ts                      # Transparent entry-point proxy for local full-stack run
├── index.html                     # HTML root referencing /frontend/main.tsx
├── package.json                   # Pipeline scripts, dependencies, and esbuild packaging
├── tsconfig.json                  # Compiler paths mapping configuration
└── vite.config.ts                 # Vite resolution, path-aliasing, and fallback setups
```

---

## 💻 Running the Project Locally

The workspace provides an integrated, zero-config full-stack setup that triggers both the backend API and hot-loaded Vite static assets simultaneously.

### Steps to Run:

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Setup Your Local Secrets:**
   Create a local `.env` file in the root directory (based on `.env.example`):
   ```bash
   cp .env.example .env
   ```
   *Modify variables (like `GEMINI_API_KEY` and `MONGO_URI`) inside `.env`.*

3. **Start the Integrated Development Server:**
   ```bash
   npm run dev
   ```
   *The server spins up instantly on http://localhost:3000.*

4. **Verify Linter and Compile Standalone Production Bundle:**
   ```bash
   npm run lint
   npm run build
   ```
   *The compiler validates type safety and bundles server-side Node code to `/dist/server.cjs` via esbuild and front-end static bundle assets into `/dist` via Vite.*

---

## 🔌 Dual Database Modes (Options A & B)

BloodLink AI is engineered with automatic db orchestration layers inside `/backend/services/dbService.ts`:

### Option A: MongoDB Atlas (Preferred Production Mode)
If `MONGO_URI` is supplied in environment variables:
1. The server binds with the native `mongodb` package.
2. If collections are blank, it runs automated seeding of twin-cities hospitals, donors, and notifications.
3. Performs standard reads, insertions, and updates dynamically.

### Option B: Local Fallback (Ideal Demo Mode)
If `MONGO_URI` is omitted or database timeouts occur:
1. The server switches to a pre-seeded, in-memory array database containing standard coordinates, numbers, and profiles.
2. Retains full local functionality including creating reviews, submitting SOS, and register fields.

---

## 🌐 Complete Environment Variable Checklist

Configure these variables in your target environment for deployments:

| Variable Name | Required | Description | Example Values |
|---|---|---|---|
| `PORT` | No | Server port (Defaults to 3000) | `3000` |
| `NODE_ENV` | No | Environment Mode | `production` / `development` |
| `MONGO_URI` | No | MongoDB Atlas Connection string (Leave empty for fallback mode) | `mongodb+srv://user:pass@cluster0.abc.mongodb.net/?w=majority` |
| `GEMINI_API_KEY` | Yes | API Key facilitating Chatbot replies | `AIzaSyCsYourKeyHere...` |
| `FRONTEND_URL` | No | Whitelisted Frontend URL mapping CORS | `https://bloodlink-ai.vercel.app` |
| `BACKEND_URL` | No | Whitelisted Backend API URL for decoupled apps | `https://bloodlink-ai.onrender.com` |
| `VITE_API_URL`| No | Frontend variable pointing client requests to backend | `https://bloodlink-ai.onrender.com` |

---

## 🚀 DevOps Decoupled Deployment Guide

For larger loads, it is recommended to host the backend API on Render (or Railway/Cloud Run) and compile the React client UI statically to Vercel.

### 1. Backend Service Deployment (Render)

1. Sign up on [Render Core](https://render.com) and link your GitHub project.
2. Select **New Web Service** and map it to your repository.
3. Configure the following deploy coordinates:
   - **Environment:** `Node`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm run start` (Starts `node dist/server.cjs` compiling Express and routing static hooks)
4. Add the following **Environment Variables** in Render's dashboard:
   - `NODE_ENV=production`
   - `PORT=10000` (Render binds this port automatically)
   - `MONGO_URI=your_atlas_connection_string`
   - `GEMINI_API_KEY=your_gemini_api_key`
   - `FRONTEND_URL=your_vercel_site_address` (Forces CORS compliance)
5. Save and deploy. Copy your Render service URL (e.g., `https://bloodlink-ai.onrender.com`).

---

### 2. Frontend SPA Deployment (Vercel)

1. Sign up on [Vercel](https://vercel.com) and click **Add New Project**.
2. Select your repository.
3. In **Build & Development Settings**, configure the following:
   - **Build Command:** `vite build`
   - **Output Directory:** `dist`
4. Add the following **Environment Variables** in Vercel's panels:
   - `VITE_API_URL=https://bloodlink-ai.onrender.com` (Directs the client fetches away from self-origin to your Render service address)
5. Click **Deploy**. Vercel will bundle your static files and supply an eye-safe production page.

---

## 🔒 API Endpoint Manifest

All API roots support standard CORS preflight queries and JSON response structures.

### Clinical & ML Queries
- `POST /api/chat`: Runs symptom analysis, intent classification, medical coordinates parsing, and issues bilingual therapist suggestions.
- `GET /api/ml/metrics`: Obtains diagnostic parameters (F1 Score, Precision, Recall, Confusion Matrices) of mathematical models.
- `POST /api/ml/predict-urgency`: Predicts clinical case urgency labels ("critical", "urgent", "medium", "low").
- `POST /api/ml/predict-donor`: Scores matching volunteer donor candidates.
- `GET /api/ml/camp-clustering`: Uses K-Means on maps to group high density area clusters.
- `POST /api/ml/forecast-demand`: Computes future blood shortages.

### Core Registries & Channels
- `GET /api/hospitals`: Catalog of regional twin-cities hospitals and availability statuses.
- `GET /api/donors`: Retreives matching donors (`bloodGroup`, `city`, `availableOnly`).
- `POST /api/donors/toggle-availability`: Simple contributor toggle switch.
- `POST /api/emergencies`: Commits urgent patient SOS reports and triggers regional notifications.
- `POST /api/emergencies/fulfill`: Closes an active emergency case, updating matched stats.
- `GET /api/notifications`: Retrieves the global system history timeline.
