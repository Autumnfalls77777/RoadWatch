<div align="center">

![RoadWatch Banner](docs/screenshots/banner.jpg)

# 🚧 RoadWatch

### India's Roads. Finally Accountable.

**AI-powered road monitoring where citizens report, communities validate, AI verifies, and authorities are held accountable — all in one transparent platform.**

[![Hackathon Project](https://img.shields.io/badge/Hackathon-Project-orange?style=for-the-badge)](#)
[![Team](https://img.shields.io/badge/Team-Night's%20Sky-blueviolet?style=for-the-badge)](#-team)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![YOLOv8](https://img.shields.io/badge/YOLOv8-AI%20Engine-ff6b35?style=for-the-badge)](https://ultralytics.com/)

</div>

---

## 📖 Table of Contents

- [What is RoadWatch?](#-what-is-roadwatch)
- [How It Helps India](#-how-it-helps-india)
- [Screenshots & Features](#-screenshots--features)
  - [Hero — The Platform](#1-hero--the-platform)
  - [Live Interactive Map](#2-live-interactive-map--pune-pilot)
  - [How to Report an Issue](#3-how-to-report-a-road-issue-step-by-step)
  - [Complaints Feed](#4-complaints-feed)
  - [Complaint Detail & Authority Routing](#5-complaint-detail--authority-routing)
  - [Gamification System](#6--gamification-system--citizen-levels)
  - [Community Forum](#7-community-forum)
  - [Citizen Dashboard](#8-citizen-dashboard)
  - [Contractor Rankings](#9-contractor-rankings--public-accountability)
  - [Analytics & Audit Center](#10-global-analytics--audit-center)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Installation & Setup](#-installation--setup)
  - [Frontend](#frontend-react--vite)
  - [Backend](#backend-nodejs--express)
  - [Machine Learning Service](#machine-learning-service-python--fastapi)
- [Environment Variables](#-environment-variables)
- [Team](#-team)

---

## 🔍 What is RoadWatch?

**RoadWatch** is a full-stack, AI-powered civic infrastructure platform built to monitor, report, and resolve road damage across India. It bridges the gap between citizens and government authorities by creating a transparent, accountable loop:

1. **Citizens report** road issues with photos via a 4-step wizard
2. **YOLOv8 AI** automatically verifies the image, classifies the defect, and scores its severity
3. **Community validates** reports through upvotes and geo-confirmed sightings
4. **Smart routing** sends the complaint to the exact responsible authority (ward office → municipal corporation)
5. **Authorities act**, assign contractors, and update statuses in real-time
6. **Everyone can see** live repair progress on the interactive map

The platform currently has a **live pilot in Pune** (PMC — Pune Municipal Corporation), with real road health data across 92 wards.

---

## 🇮🇳 How It Helps India

India loses an estimated **₹54,000 crore annually** due to poor road conditions — from vehicle damage, fuel inefficiency, and road accidents. RoadWatch directly addresses this by:

| Problem | RoadWatch Solution |
|---|---|
| No unified system to report road issues | 4-step AI-guided complaint wizard |
| Reports get lost in bureaucracy | Smart authority routing chain — complaint reaches the right desk automatically |
| Citizens have no idea what happens after they report | Real-time status updates + live map |
| Contractor accountability is opaque | Public Accountability Score Engine for all contractors |
| Budget mismanagement on road projects | Budget Transparency dashboard with ₹840Cr+ monitored |
| Duplicate/fake reports waste government time | YOLOv8 AI deduplication + confidence scoring (89% accuracy) |
| Low citizen participation | Gamification system with XP, levels, and community ranks |

> **"RoadWatch reduced our complaint backlog by 60%. The AI prioritization is incredibly useful."**
> — *Rajesh Kumar, District Engineer, Pune*

---

## 📸 Screenshots & Features

### 1. Hero — The Platform

> AI-powered road monitoring for a billion citizens.

![RoadWatch Homepage](docs/screenshots/01-homepage.png)

The landing page presents live platform statistics:
- **2.4M+** Reports Filed
- **89%** AI Accuracy
- **12,400+** Roads Tracked
- **₹840Cr** Budget Monitored

---

### 2. Live Interactive Map — Pune Pilot

> Every report instantly appears on the map with a photo, status badge, and AI confidence score.

![Live Map - Pune Overview](docs/screenshots/02-live-map.png)

The live map shows Pune's 92 wards with colour-coded road health markers:
- 🟢 **Excellent** — Health score 80–100
- 🟡 **Moderate** — Health score 60–79
- 🟠 **Poor** — Health score 40–59
- 🔴 **Critical** — Health score below 40

Click any marker to see the complaint photo, severity, AI confidence, and a direct link to the full report:

![Map Complaint Popup](docs/screenshots/03-map-popup.png)

---

### 3. How to Report a Road Issue (Step by Step)

Filing a report takes under 60 seconds. The 4-step wizard guides citizens through:

---

**Step 1 — Describe the Issue**

> Give the issue a title, choose a category (Pothole, Crack, Flooding, etc.), set severity, and add a description.

![Report Step 1 - Issue Details](docs/screenshots/04-report-step1.png)

---

**Step 2 — Pin the Location**

> Auto-detect your GPS location or tap the map to fine-tune the exact spot. District and State are auto-filled.

![Report Step 2 - Location](docs/screenshots/05-report-step2.png)

---

**Step 3 — Upload Photo or Video**

> Attach a photo or short video. The AI instantly starts analysing your media for defect detection.

![Report Step 3 - Media Upload](docs/screenshots/06-report-step3.png)

> *"Photos are mandatory and increase verification speed by 5×"*

---

**Step 4 — AI Reviews & You Submit**

> Before submission, RoadWatch AI returns: confidence score, severity rating (0–10), and duplicate check status.

![Report Step 4 - AI Analysis & Submit](docs/screenshots/07-report-step4.png)

In this example: **94% confidence · Severity 6.3/10 · No Duplicate**

---

### 4. Complaints Feed

> Browse all reported issues with AI verification badges, agency routing chains, community vote counts, and real-time status.

![Complaints Feed](docs/screenshots/08-complaints.png)

Each complaint card shows:
- **AI Verified** badge with defect type and confidence (e.g. *AI Verified · Pothole · 89%*)
- **Agency Route** — the chain of responsible bodies from road name to governing authority
- **Upvotes + Verified count** — community confirmation
- **Status pill** — Submitted / In Progress / Resolved / Critical Alert

---

### 5. Complaint Detail & Authority Routing

> Full complaint page with authority routing chain, AI analysis results, and community validation score.

![Complaint Detail Page](docs/screenshots/09-complaint-detail.png)

The **Authority Routing Chain** automatically resolves:
1. **Geo-tagged Road** — e.g. Sohagpur
2. **PMC Pilot Ward Office** — e.g. Shivajinagar-Ghole Road Ward Office
3. **Responsible Governance Agency** — e.g. Pune Municipal Corporation Road Department

No manual forwarding. No lost tickets.

---

### 6. 🏆 Gamification System — Citizen Levels

> Every verified report, community vote, and forum post earns you XP. Rise through the ranks and shape your city.

![Gamification - Citizen Levels](docs/screenshots/10-gamification.png)

#### XP Earning System

| Action | XP Earned |
|---|---|
| Filing a new road complaint | +50 XP |
| Report verified by AI | +30 XP |
| Community validates your report | +20 XP per verification |
| Upvoting a community post | +5 XP |
| Writing a community post | +25 XP |
| Report resolved by authority | +100 XP |
| Forum reply that gets upvoted | +10 XP |

#### Citizen Level Ranks

| Level | Rank | XP Required | Perks |
|---|---|---|---|
| L1 | 🔵 Road Scout | 0 – 500 pts | Can file basic road issues |
| L2 | 🟣 Road Reporter | 500 – 2,000 pts | Reports carry higher priority weight |
| L3 | 🟡 Road Guardian | 2,000 – 5,000 pts | Can verify and flag other reports |
| L4 | 🟠 Road Inspector | 5,000 – 15,000 pts | Trusted citizen; direct line to regional road office |
| L5 | 🔴 Road Champion | 15,000+ pts | Top-tier civic contributor; featured on leaderboard |

---

### 7. Community Forum

> A public forum where citizens discuss road issues, tag roads, upvote problems, and hold authorities accountable.

![Community Forum](docs/screenshots/11-community.png)

Community posts are tagged by topic (Trending, Repair Delay, Flooding, Streetlights, Safety) and linked to specific roads. Each post shows:
- **Vote count** with upvote/downvote
- **View count** and comment count
- **Author level badge** — Scout, Reporter, Guardian, Inspector, **Champion**
- **Linked road & authority** — automatically resolved from the post's location

Popular posts surface to the top, creating democratic pressure on authorities to act.

---

### 8. Citizen Dashboard

> Your personal hub for managing reports, tracking reputation, and monitoring your impact.

![Citizen Dashboard](docs/screenshots/12-citizen-dashboard.png)

The dashboard shows:
- **Reputation Points** and current level with progress bar to next rank
- **Total Filings**, **Resolved Cases**, **Critical Alerts**, and **Resolve Rate**
- **My Complaints** tab — status of all your reports (Submitted / In Progress / Resolved)
- **My Posts** tab — your community forum posts
- **Report Review States** panel — real-time counts per status
- **Quick Actions** — Reports, Live Map, AI Help, Community, Contractors, Analytics

---

### 9. Contractor Rankings — Public Accountability

> Every road contractor working under municipal contracts gets a public accountability scorecard.

![Contractor Rankings](docs/screenshots/13-contractors.png)

**Public Accountability Score Formula:**
> Road Condition Score + Complaint Volume + Resolution Performance + Citizen Feedback + Repair Completion Rate → Final Score: 0–100

Each contractor card displays:
- **Public Score** (0–100)
- Jobs Done, Active Projects, Open Complaints, Road Health score
- **Budget Managed** (e.g. ₹6.20 Cr)
- Bar chart breakdown: Road Condition Score, Resolution Performance, Repair Completion Rate
- Citizen Rating, Reliability Score, Resolve Rate

No more invisible contractors. Citizens can see exactly who is accountable for each road.

---

### 10. Global Analytics & Audit Center

> Real-time road condition indexing, authority response diagnostics, and municipal budget auditing.

![Analytics Dashboard](docs/screenshots/14-analytics.png)

The Analytics dashboard drills down from **Country → State → District → Local Ward**:

- **Road Analytics** — total area reports, road length (km), footpath coverage %, high-risk wards
- **Complaint & Repair Dynamics** — monthly incident volume vs. contractor resolution schedules
- **Severity Distribution** — AI model engine pie chart (Medium / Critical / High)

![Road Quality Rankings & Notifications](docs/screenshots/15-analytics-rankings.png)

- **Road Quality Index Rankings** — denormalised average road health per road, colour-coded (green → red)
- **Ward Health Rankings** — auto-generated ward scores from uploaded city datasets
- **Complaint Density** — complaints normalised against ward road length
- **Smart Notifications** — nearby road alerts, complaint status updates, and community replies delivered in real-time

---

## 🛠 Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React 18 + Vite | UI framework & build tool |
| Tailwind CSS | Utility-first styling |
| Leaflet.js | Interactive maps |
| Recharts / Victory | Analytics charts |
| shadcn/ui | Component library |
| React Router v6 | Client-side routing |

### Backend
| Technology | Purpose |
|---|---|
| Node.js + Express | REST API server |
| PostgreSQL (Supabase) | Primary database |
| JWT | Authentication |
| Supabase Realtime | Live data updates |

### Machine Learning Service
| Technology | Purpose |
|---|---|
| Python 3.11 + FastAPI | AI microservice |
| YOLOv8 (Ultralytics) | Road defect detection |
| OpenCV | Image / video processing |
| Pillow | Image utilities |

### Database
| Technology | Purpose |
|---|---|
| PostgreSQL | Relational data store |
| Materialized Views | Fast analytics queries |
| Row-level Security | Multi-role access control |

---

## 📁 Project Structure

```
RoadWatch/
├── src/                    # React frontend (Vite)
│   ├── pages/              # Route-level pages (Map, Complaints, Community, etc.)
│   ├── components/         # Reusable UI components
│   ├── api/                # API client functions
│   ├── hooks/              # Custom React hooks
│   └── services/           # Frontend service layer
│
├── backend/                # Node.js / Express REST API
│   ├── server.js           # Express app entry point
│   ├── config.js           # App config & roles
│   ├── lib/                # Middleware, DB client
│   └── services/           # AI, analytics, dataset services
│
├── machine/                # Python FastAPI ML microservice
│   ├── main.py             # FastAPI entry point
│   ├── detector.py         # YOLOv8 inference engine
│   ├── video_processor.py  # Frame extraction for videos
│   ├── road_health.py      # Road health score calculator
│   ├── severity.py         # Severity classification logic
│   ├── routes/             # FastAPI route handlers
│   ├── services/           # ML business logic
│   ├── outputs/            # Trained model weights (best.pt)
│   └── requirements.txt    # Python dependencies
│
├── database/               # SQL schema, migrations & seed data
│   ├── schema.sql          # Full database schema
│   ├── migrations/         # Version-controlled migrations
│   ├── triggers.sql        # DB triggers
│   ├── materialized_views.sql
│   ├── security.sql        # RLS policies
│   └── seed.sql            # Sample data
│
├── entities/               # Shared JS entity models
├── dataset/                # Road condition datasets (Excel)
├── docs/screenshots/       # README screenshots
├── .gitignore
└── README.md
```

---

## 🚀 Installation & Setup

### Prerequisites

- **Node.js** v18+
- **Python** 3.10+
- **PostgreSQL** 14+ (or a Supabase project)
- **Git**

---

### Frontend (React + Vite)

```bash
# 1. Clone the repository
git clone https://github.com/your-org/roadwatch.git
cd roadwatch

# 2. Install Node dependencies
npm install

# 3. Copy environment template and fill in values
cp .env.example .env

# 4. Start the development server
npm run dev
```

The frontend will be available at `http://localhost:5173`

---

### Backend (Node.js / Express)

```bash
# From the project root (the backend shares node_modules)
# Ensure your .env has ROADWATCH_API_PORT, DATABASE_URL, and ROADWATCH_JWT_SECRET set

# Start the backend server
node backend/server.js
```

The API will be available at `http://localhost:8787`

---

### Machine Learning Service (Python + FastAPI)

```bash
# Navigate to the machine learning directory
cd machine

# Create and activate a virtual environment
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

# Copy the environment template
cp .env.example .env

# Start the FastAPI service
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

The ML API will be available at `http://localhost:8000`

> **Note:** The trained YOLOv8 model weights (`outputs/best.pt`) are not committed to the repository due to file size. Download the model from the project releases page and place it in `machine/outputs/best.pt`.

---

### Database Setup

```bash
# Connect to your PostgreSQL instance and run in order:
psql -U your_user -d your_db -f database/schema.sql
psql -U your_user -d your_db -f database/security.sql
psql -U your_user -d your_db -f database/triggers.sql
psql -U your_user -d your_db -f database/materialized_views.sql
psql -U your_user -d your_db -f database/seed.sql   # optional: sample data
```

---

## 🔐 Environment Variables

### Root `.env` (Frontend + Backend)

```env
# Backend API
ROADWATCH_API_PORT=8787
ROADWATCH_JWT_SECRET=your-secret-key-here
ROADWATCH_AI_URL=http://127.0.0.1:8000

# Database
DATABASE_URL=postgresql://user:password@host:5432/roadwatch
```

### `machine/.env` (ML Service)

```env
# Model
MODEL_PATH=./outputs/best.pt

# Detection
CONFIDENCE=0.25

# FastAPI Service
SERVICE_HOST=0.0.0.0
SERVICE_PORT=8000
```

> Copy `machine/.env.example` to `machine/.env` to see all available configuration options.

---

## 👥 Team

<div align="center">

### 🌌 Night's Sky

*Hackathon Project — AI-Powered Road Accountability*

</div>

| Name | Role | Contributions |
|---|---|---|
| **Prabal Jaiswal** | Full-Stack Lead | Frontend (React + Vite), Backend (Node.js + Express), Database (PostgreSQL schema, migrations, RLS) |
| **Saiyam Bajpai** | ML Engineer | Python ML microservice (FastAPI), YOLOv8 model training & integration, video processing pipeline |
| **Chahat Bhatija** | ML Engineer | YOLOv8 dataset curation, model evaluation, road health scoring algorithm, severity classification |
| **Nitin Kushwah** | Documentation & Presentation | Project documentation, research paper, Hackathon presentation deck, system architecture diagrams |

---

<div align="center">

Built with ❤️ for India by **Team Night's Sky**

*Making India's roads safer — one report at a time.*

</div>
