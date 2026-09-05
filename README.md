# DealFlow360

> Intelligent, self-governing B2B Sales Operations Platform.

---

## Project Structure

```
dealflow360/
├── frontend/               Next.js 16 (App Router) + TypeScript + Vanilla CSS Modules
│   └── src/
│       ├── app/            Next.js App Router (layout & page entry points)
│       ├── components/     Enterprise UI modules (Admin, Sales, Dashboard, Invoices, Subscriptions)
│       └── lib/            API client and state helpers
│
├── backend/                Python 3.12 + FastAPI
│   └── app/
│       ├── main.py         FastAPI entry point & routers
│       ├── core/           Database (SQLAlchemy), Security & Config
│       ├── api/v1/         REST API endpoints (Auth, Users, Quotations, Invoices, etc.)
│       ├── models/         SQLAlchemy ORM models
│       ├── schemas/        Pydantic request/response schemas
│       ├── services/       Deterministic business logic
│       ├── ai/             ML recommendations & anomaly detection
│       └── utils/          Email (Resend) & notification helpers
│
└── memory.md               Architecture specifications and design guidelines
```

---

## Quick Start (Local Development)

### 1. Prerequisites
- **Python 3.10+** (Python 3.12 recommended)
- **Node.js 18+** & `npm`
- **PostgreSQL 15+** (optional: pgvector enabled)

---

### 2. Backend Setup

```bash
cd backend

# Create & activate virtual environment
# On Windows (PowerShell):
python -m venv venv
.\venv\Scripts\Activate.ps1

# On Linux/macOS:
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
# Copy .env.example to .env and configure DATABASE_URL and RESEND_API_KEY
cp .env.example .env

# Run FastAPI development server
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

- **API Endpoint:** `http://localhost:8000`
- **Interactive Swagger Docs:** `http://localhost:8000/docs`

---

### 3. Frontend Setup

```bash
cd frontend

# Install Node dependencies
npm install

# Run Next.js development server
npm run dev
```

- **Web Application:** `http://localhost:3000`

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 16 (App Router) + React 19 + TypeScript |
| **Styling** | Premium Vanilla CSS Modules (Glassmorphism & Dark Mode) |
| **Backend** | Python 3.12 + FastAPI + Uvicorn |
| **Database** | PostgreSQL + SQLAlchemy ORM + asyncpg / psycopg2 |
| **Auth & Security** | JWT (`python-jose`) + password hashing (`passlib`/`bcrypt`) |
| **Email Service** | [Resend](https://resend.com) API for transactional emails |
| **Data & Analytics**| scikit-learn + pandas + numpy |

---

## User Roles & Permissions

| Role | Access Level | Onboarding Flow |
|------|-------------|-----------------|
| **Admin** | Full system control, role provisioning, user directory, system configuration | Initial Admin / Admin Invite |
| **Sales Manager** | High-tier approvals, team performance, quotes & pipeline analytics | Admin invites |
| **Sales Rep** | Quotation builder, discounts, catalog, Kanban pipeline | Admin invites |
| **Finance / Ops** | Invoicing, payments, fulfillment tracking, margin audits | Admin invites |
| **Customer** | Customer self-service portal, quotation acceptance & status | Direct self-signup |

---

## Environment Variables (`backend/.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:postgres@localhost:5432/dealflow360` |
| `SECRET_KEY` | JWT secret signing key | Generated secret string |
| `RESEND_API_KEY` | Resend API key for verification emails | `re_...` |
| `EMAIL_FROM` | Sender address for verification & notifications | `onboarding@resend.dev` |
| `FRONTEND_URL` | Frontend origin for CORS and email links | `http://localhost:3000` |
