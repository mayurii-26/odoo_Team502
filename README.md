# DealFlow360

> Intelligent, self-governing B2B Sales Operations Platform.

---

## Project Structure

```
dealflow360/
├── frontend/               React + TypeScript + Vite (UI)
│   └── src/
│       ├── pages/          Page-level components
│       ├── components/     Reusable UI components
│       └── ...
│
├── backend/                Python + FastAPI (API)
│   └── app/
│       ├── main.py         FastAPI entry point
│       ├── core/           Config, DB, Security
│       ├── api/v1/         REST API routes
│       ├── models/         SQLAlchemy ORM models
│       ├── schemas/        Pydantic request/response schemas
│       ├── services/       Business logic (deterministic)
│       ├── ai/             ML recommendations + LLM layer
│       └── utils/          Email, audit trail helpers
│
└── memory.md               Project decisions and architecture notes
```

---

## Quick Start (Local Development)

### 1. Backend

```bash
cd backend
cp .env.example .env
# Fill in .env values
pip install -r requirements.txt
uvicorn app.main:app --reload
# API: http://localhost:8000
# Docs: http://localhost:8000/docs
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
# App: http://localhost:5173
```

### 3. Docker (full stack)

```bash
docker-compose up
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16 (App Router) + TypeScript |
| Styling | Vanilla CSS Modules |
| Backend | Python 3.12 + FastAPI |
| Database | PostgreSQL 16 + pgvector |
| Auth | JWT (python-jose) + bcrypt |
| Email | Resend (dev) → Postmark (prod) |
| AI/ML | scikit-learn + OpenAI API |
| Infrastructure | Docker + Docker Compose |

---

## SMTP

- **Development:** [Resend](https://resend.com) — free tier, 3,000 emails/month
- **Production:** [Postmark](https://postmarkapp.com) — best deliverability for transactional email

Configure `RESEND_API_KEY` in `.env`.

---

## Roles

| Role | Access | Onboarding |
|------|--------|-----------|
| Admin | Full internal app | Existing Admin invites |
| Sales Manager | Internal app | Admin invites |
| Finance / Ops | Internal app | Admin invites |
| Sales Rep | Internal app | Admin invites |
| Customer | Portal only | Self-signup |

