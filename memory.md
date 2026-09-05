# DealFlow360 - Project Memory

> Last updated: 2026-09-05

---

## One-Line Idea

**DealFlow360 is a self-governing B2B sales platform that automatically evaluates, approves, optimizes, negotiates, fulfills, and monitors sales deals from quotation to payment.**

The key word is **self-governing** - the system does not just record deals, it actively drives them forward using deterministic business rules, ML, and LLM capabilities.

---

## The Problem We Are Solving

Real B2B sales are complicated. A salesperson creates a quotation and the system must automatically answer:

- What discount is allowed for this customer and product category?
- Does this quotation require approval? Who approves it?
- Is there enough stock? Which warehouses should fulfill it?
- What upsells/cross-sells should the rep consider?
- What is the margin impact?
- Which line items are one-time vs. recurring?
- What happens if the customer negotiates?
- Is this deal becoming stalled or risky?

DealFlow360 answers all of these **automatically** instead of making employees coordinate manually.

---

## The Central Object: Quotation

Almost everything in the system revolves around the **Quotation**.

```
Customer
    |
    v
Quotation
    |
    |-- Products & line items
    |-- Discounts
    |-- Risk score
    |-- Approvals
    |-- AI Recommendations
    |-- Warehouse allocation
    |-- Billing (one-time + recurring)
    |-- Customer negotiations
    `-- Audit history
```

---

## End-to-End Workflow

```
Create Quotation
     |
     v
Evaluate Discounts (vs. tier/category ceilings)
     |
     v
Calculate Blended Risk Score
     |
     v
AI Upsell / Cross-sell Recommendations
     |
     v
Route to Approval (if risk threshold exceeded)
     |
     v
  Approve / Reject / Return for Revision
     |
     v
Send to Customer Negotiation Portal
     |
     v
Customer Views -> Comments -> Counter-offer
     |
     v
Risk Recalculated -> Re-approve if Required
     |
     v
Customer Confirms
     |
     v
Fulfillment (multi-warehouse allocation)
     |
     v
Billing (one-time + recurring split)
     |
     v
Payment
     |
     v
Deal Health Monitoring (continuous)
     |
     v
Reporting & Analytics
```

---

## Five User Roles

**Security constraint:** No user can self-escalate their role. Customer portal users have zero access to the internal application.

---

### 1. Sales Representative
**Access:** Internal application
**Default landing:** Sales Workspace / Sales Dashboard

Responsibilities:
- Builds quotations, selects customers, adds products, adjusts quantities
- Applies line-level and order-level discounts within permitted thresholds
- Adds upsell and cross-sell items suggested by the recommendation engine
- Tracks approval status in real time and responds to revision requests
- Monitors fulfillment progress on confirmed orders
- Responds to customer negotiation requests routed from the portal

---

### 2. Sales Manager / Approver
**Access:** Internal application
**Default landing:** Manager / Approval Workspace

Responsibilities:
- Reviews and approves or rejects quotations that exceed discount thresholds
- Configures discount tiers and approval chains (or delegates to Admin)
- Monitors the deal health dashboard for at-risk and stalled deals
- Acts as first-level approver in the approval chain
- May return quotations to the rep for revision with comments

---

### 3. Finance / Operations User
**Access:** Internal application
**Default landing:** Finance / Operations Workspace

Responsibilities:
- Handles second-level approvals for high-risk discounts
- Manages warehouse fulfillment splits and backorder decisions
- Reconciles recurring billing, proration adjustments, and credit notes
- Oversees subscription plan changes and cancellations

---

### 4. Admin
**Access:** Full internal application
**Default landing:** Administration Workspace

Responsibilities:
- Manages backend setup: products, price lists, discount tiers, warehouses, subscription plans
- Creates and manages internal user accounts; assigns and modifies roles
- Configures global approval chains and discount ceiling rules
- Views platform-wide analytics and reporting
- Only role authorized to grant or change privileged roles (Sales Manager, Finance, Admin)

---

### 5. Customer (Portal User)
**Access:** Isolated Customer Quotation Portal ONLY - zero access to internal application
**Default landing:** Customer Quotation Portal

Responsibilities:
- Views quotations shared with them by a sales representative
- Sees quotation status (draft, pending approval, approved, confirmed)
- Requests line-level changes and asks questions via comments
- Counters a discount or proposes modified terms
- Confirms final terms with one click
- Cannot see internal pricing, margins, cost data, or other customers data

---

### Role Assignment Rules

| Role | Can sign up themselves? | Who assigns the role? |
|------|------------------------|-----------------------|
| Admin | No | Existing Admin only |
| Sales Manager | No | Admin only |
| Finance / Operations | No | Admin only |
| Sales Rep | Yes (pending admin activation) | Admin assigns after signup |
| Customer | Yes (self-service signup) | Automatic on signup |

---

## Major Modules

```
DealFlow360
|
|-- Authentication & RBAC
|-- Customer Management
|-- Product & Price Management
|-- Quotation Builder              <- core workspace
|-- Discount Governance            <- deterministic rules
|-- Approval Workflow              <- deterministic routing
|-- AI Recommendations             <- upsell / cross-sell
|-- Inventory & Warehouse Fulfillment
|-- Subscription & Billing
|-- Customer Negotiation Portal    <- isolated customer view
|-- Deal Health & Anomaly Detection
|-- Notifications
|-- Audit Trail
`-- Reporting & Analytics
```

---

## Three Kinds of Intelligence

### 1. Deterministic Business Logic (never use LLM for these)
- Discount limit calculation
- Approval routing
- Risk score calculation
- Warehouse allocation
- Billing / proration
- Permission checks

### 2. ML / Recommendation Intelligence
- Upsell and cross-sell suggestions
- Deal anomaly detection
- Deal health risk indicators

### 3. LLM (natural language where it actually helps)
- Explain why approval is required
- Explain deal risks in plain language
- Summarize a quotation
- Answer sales-policy questions (optional RAG)
- Assist sales representatives

---

## Proposed Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + TypeScript + Tailwind CSS + shadcn/ui |
| Backend | Python + FastAPI |
| Database | PostgreSQL (+ pgvector if RAG needed) |
| AI/ML | Python recommendation algorithms, anomaly detection, LLM API |
| Auth | JWT / secure sessions + RBAC |
| Background Jobs | Redis + Celery (only if genuinely needed) |
| Infrastructure | Docker / Docker Compose |

---

## Development Order (Step-by-Step)

We will build strictly in this order. Do NOT jump ahead.

1. Resolve open questions / ambiguities
2. RBAC & user model design
3. Database schema design
4. Backend API design
5. Frontend / UI design
6. Business logic implementation
7. AI / ML integration
8. Integration & end-to-end testing
9. Deployment

---

## Open Questions (Unresolved)

| # | Area | Question |
|---|------|----------|
| 1 | Tenancy | Single company or multi-tenant SaaS? |
| 2 | Customer portal auth | Username/password login or magic link / signed URL? |
| 3 | Quotation versioning | Mutable with audit log, or immutable version snapshots? |
| 4 | Risk score formula | What inputs and weights define the blended risk score? |
| 5 | Approval chain granularity | Global rules, per-team, or per-category? |
| 6 | Currency | Single currency or multi-currency with exchange rates? |
| 7 | Tax | Real tax calculation or display-only field? |
| 8 | Subscription billing | System of record or integration with Stripe/payment gateway? |
| 9 | Inventory | DealFlow360 owns stock levels, or integrates with external WMS? |
| 10 | Notifications | Email only, in-app, or third-party (Slack, etc.)? |
| 11 | Recommendation engine | Rule-based, collaborative filtering, or hybrid for v1? |
| 12 | LLM provider | OpenAI / Anthropic / Gemini? Is RAG in scope for v1? |
| 13 | Report export | Server-side or client-side PDF/XLSX generation? |
| 14 | Deployment target | Local Docker Compose, cloud-hosted, or both? |

---

## What We Are NOT Doing Yet

- No code
- No database tables or migrations
- No frontend components
- No API endpoints
- No package installs
- No terminal commands
- No file modifications to the project

We design first, build second.


---

## User Onboarding & Role Assignment — Confirmed Pattern

### Internal Users (Sales Rep, Sales Manager, Finance, Admin)

**Admin-invite model only. No public signup for internal roles.**

Flow:
```
Admin goes to Settings -> Users -> [Invite User]
    |
    v
Enters email address + selects role
(Sales Rep / Sales Manager / Finance / Admin)
    |
    v
System creates a pending invite record in DB
(email, role, invite_token, expires_at)
    |
    v
System sends invite email to that address
"You have been invited to DealFlow360. Click here to activate your account."
    |
    v
User clicks the link (no prior registration needed)
    |
    v
"Set Up Your Account" page
  - Name (pre-filled if admin entered it)
  - Password
  - Confirm Password
  - [Activate Account]
    |
    v
System validates token (not expired, not already used)
    |
    v
User account created with the role assigned by Admin
    |
    v
User logged in and routed to their role-specific workspace
```

Key rules:
- User does NOT need to pre-register. Account is created only when they accept the invite.
- Token is one-time use and expires (24-72 hours, configurable).
- Admin can resend or cancel a pending invite.
- Admin can see invite status: Active / Pending Invite.

### Customers (Portal User)

**Self-service public signup. No admin involvement needed.**

Flow:
```
Customer visits DealFlow360 login page
    |
    v
Clicks "Sign Up"
    |
    v
Fills Customer signup form
  - Full Name
  - Company Name
  - Email
  - Password
  - Confirm Password
    |
    v
Account created automatically with "Customer" role
    |
    v
Routed to Customer Quotation Portal
```

### Role Assignment Rules (Confirmed)

| Role | Can self-signup? | How account is created |
|------|-----------------|----------------------|
| Admin | No | Existing Admin invites via email |
| Sales Manager | No | Admin invites via email |
| Finance / Operations | No | Admin invites via email |
| Sales Rep | No | Admin invites via email |
| Customer | Yes (self-service) | Self-signup on login page |

### Token Security (for implementation reference)

- invite_token: random UUID or signed JWT
- expires_at: 24-72 hours from invite creation
- One-time use: token is invalidated immediately after account activation
- Expired token: Admin can resend invite, generating a fresh token

### Login Page Impact

Because internal users are invited (never self-signup):
- The "Sign Up" button on the Login page leads to the Customer signup form ONLY
- A note is shown: "Internal team member? Contact your administrator for an invite."
- No role selector anywhere on the public-facing Login or Signup pages

