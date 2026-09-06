# ============================================================
# DealFlow360 - Workspace Data API (Live PostgreSQL Integration)
# ============================================================
from typing import List, Optional, Any, Dict
from datetime import datetime
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from app.core.database import get_db
from app.models.quotation import Quotation, QuotationLine
from app.models.product import Product, ProductCategory, Pricelist, Promotion
from app.models.inventory import Warehouse, InventoryStock, FulfillmentOrder
from app.models.billing import Invoice, InvoiceLine, Subscription, Payment
from app.models.approval import Approval, ApprovalStep
from app.models.health import DealHealthSnapshot
from app.models.customer import Customer, CustomerContact
from app.models.user import User
from app.models.discount import DiscountTier, DiscountRule
from app.models.audit import AuditLog

router = APIRouter()

# â"â" Schemas for Mutations â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"
class QuotationLineSaveItem(BaseModel):
    id: Optional[Any] = None
    product_id: Optional[int] = None
    product_name: Optional[str] = None
    quantity: int = 1
    unit_price: float = 0.0
    discount_percent: float = 0.0
    unit_cost: Optional[float] = None

class SaveFullQuotationPayload(BaseModel):
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    customer_company: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None
    sales_rep_name: Optional[str] = None
    sales_rep_email: Optional[str] = None
    lines: List[QuotationLineSaveItem] = []

class ApprovalActionPayload(BaseModel):
    action: str  # "APPROVE" or "REJECT"
    comments: Optional[str] = None
    approver_name: Optional[str] = "Sales Manager"

class CreateAuditLogPayload(BaseModel):
    user_id: Optional[int] = None
    actor_name: Optional[str] = "System Operator"
    actor_role: Optional[str] = "admin"
    action: str
    entity_type: str = "quotation"
    entity_id: Optional[int] = 1042
    target_quotation_id: Optional[str] = None
    customer_name: Optional[str] = None
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    details: Optional[str] = None

# ── Helpers ───────────────────────────────────────────────────
def format_quotation(q: Quotation, db: Session, preloaded: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    if preloaded:
        customers_map = preloaded.get("customers", {})
        contacts_map = preloaded.get("contacts", {})
        users_map = preloaded.get("users", {})
        products_map = preloaded.get("products", {})
        lines = preloaded.get("lines_by_quote", {}).get(q.id, [])

        customer = customers_map.get(q.customer_id)
        cust_company = customer.company_name if customer else "Enterprise Client"
        cust_tier = customer.customer_tier if customer else "Gold"
        primary_contact = contacts_map.get(q.customer_id)
        cust_name = primary_contact.name if primary_contact else cust_company
        cust_email = primary_contact.email if primary_contact else "client@example.com"
        sales_rep = users_map.get(q.sales_rep_id)
        sales_rep_name = sales_rep.name if sales_rep else "Jane Smith"

        formatted_lines = []
        for l in lines:
            prod = products_map.get(l.product_id)
            prod_name = prod.name if prod else f"Product #{l.product_id}"
            sku = prod.sku if prod else f"SKU-{l.product_id}"
            cat_frontend = "Services" if (prod and prod.category_id in [4, 5]) else "Hardware"
            prod_type = "recurring" if (prod and prod.category_id in [4, 5] and any(x in prod_name.lower() for x in ["care", "support", "plan", "warranty"])) else "one_time"

            formatted_lines.append({
                "id": str(l.id),
                "product_id": l.product_id,
                "product_name": prod_name,
                "sku": sku,
                "category": cat_frontend,
                "type": prod_type,
                "quantity": l.quantity,
                "unit_price": float(l.unit_price or 0.0),
                "unit_cost": float(l.unit_cost or 0.0),
                "discount_percent": float(l.discount_percent or 0.0),
                "discount_amount": float(l.discount_amount or 0.0),
                "line_subtotal": float(l.line_subtotal or 0.0),
                "line_cost": float(l.line_cost or 0.0),
                "line_margin": float(l.line_margin or 0.0),
                "line_margin_percent": float(l.line_margin_percent or 0.0),
                "discount_limit_percent": float(l.discount_limit_percent or 15.0),
                "discount_status": l.discount_status or "OK"
            })
    else:
        lines = db.query(QuotationLine).filter(QuotationLine.quotation_id == q.id).all()
        customer = db.query(Customer).filter(Customer.id == q.customer_id).first()
        cust_company = customer.company_name if customer else "Enterprise Client"
        cust_tier = customer.customer_tier if customer else "Gold"
        primary_contact = db.query(CustomerContact).filter(CustomerContact.customer_id == q.customer_id, CustomerContact.is_primary == True).first()
        if not primary_contact:
            primary_contact = db.query(CustomerContact).filter(CustomerContact.customer_id == q.customer_id).first()
        cust_name = primary_contact.name if primary_contact else cust_company
        cust_email = primary_contact.email if primary_contact else "client@example.com"
        sales_rep = db.query(User).filter(User.id == q.sales_rep_id).first()
        sales_rep_name = sales_rep.name if sales_rep else "Jane Smith"

        formatted_lines = []
        for l in lines:
            prod = db.query(Product).filter(Product.id == l.product_id).first()
            prod_name = prod.name if prod else f"Product #{l.product_id}"
            sku = prod.sku if prod else f"SKU-{l.product_id}"
            cat_frontend = "Services" if (prod and prod.category_id in [4, 5]) else "Hardware"
            prod_type = "recurring" if (prod and prod.category_id in [4, 5] and any(x in prod_name.lower() for x in ["care", "support", "plan", "warranty"])) else "one_time"

            formatted_lines.append({
                "id": str(l.id),
                "product_id": l.product_id,
                "product_name": prod_name,
                "sku": sku,
                "category": cat_frontend,
                "type": prod_type,
                "quantity": l.quantity,
                "unit_price": float(l.unit_price or 0.0),
                "unit_cost": float(l.unit_cost or 0.0),
                "discount_percent": float(l.discount_percent or 0.0),
                "discount_amount": float(l.discount_amount or 0.0),
                "line_subtotal": float(l.line_subtotal or 0.0),
                "line_cost": float(l.line_cost or 0.0),
                "line_margin": float(l.line_margin or 0.0),
                "line_margin_percent": float(l.line_margin_percent or 0.0),
                "discount_limit_percent": float(l.discount_limit_percent or 15.0),
                "discount_status": l.discount_status or "OK"
            })

    appr = None
    if preloaded and "approvals_by_quote" in preloaded:
        appr = preloaded["approvals_by_quote"].get(q.id)
    else:
        appr = db.query(Approval).filter(Approval.quotation_id == q.id).first()

    approval_wf = None
    if appr:
        approval_wf = {
            "id": appr.id,
            "status": appr.status.capitalize() if appr.status else "Pending",
            "managerStatus": appr.status.capitalize() if appr.status else "Pending",
            "financeStatus": "Approved" if appr.status == "APPROVED" else ("Rejected" if appr.status == "REJECTED" else "Pending"),
            "managerNotes": appr.decision_comment or "",
            "reason": appr.reason or "",
            "submittedAt": appr.created_at.isoformat() if appr.created_at else None,
        }

    return {
        "id": q.quote_number or f"Q-{q.id}",
        "db_id": q.id,
        "quote_number": q.quote_number or f"Q-{q.id}",
        "customer_name": cust_name,
        "customer_company": cust_company,
        "customer_email": cust_email,
        "customer_tier": cust_tier,
        "total_amount": float(q.total_amount or 0.0),
        "subtotal": float(q.subtotal or 0.0),
        "discount_amount": float(q.discount_amount or 0.0),
        "discount_percent": float(q.discount_percent or 0.0),
        "tax_amount": float(q.tax_amount or 0.0),
        "total_cost": float(q.total_cost or 0.0),
        "gross_margin": float(q.gross_margin or 0.0),
        "margin_percent": float(q.margin_percent or 0.0),
        "status": q.status or "DRAFT",
        "deal_health_score": float(q.deal_health_score or 75.0),
        "deal_stage": "Negotiation" if q.status in ["SENT", "PENDING_APPROVAL"] else ("Closed Won" if q.status == "ACCEPTED" else ("Lost" if q.status == "REJECTED" else "Drafting")),
        "created_at": q.created_at.strftime("%Y-%m-%d") if q.created_at else "2026-03-01",
        "expires_at": q.valid_until.strftime("%Y-%m-%d") if q.valid_until else "2026-04-01",
        "sales_rep": sales_rep_name,
        "sales_rep_email": sales_rep.email if sales_rep else "sales@dealflow360.com",
        "sales_rep_id": sales_rep.id if sales_rep else 1,
        "customer_notes": q.customer_notes or "",
        "internal_notes": q.internal_notes or "",
        "lines": formatted_lines,
        "approval_status": appr.status if appr else None,
        "approval_workflow": approval_wf,
        "approvalWorkflow": approval_wf
    }

# ── Bootstrap Endpoint: All Workspace Data in One Call ───────
@router.get("/bootstrap")
def get_workspace_bootstrap(db: Session = Depends(get_db)):
    """
    Returns live PostgreSQL dataset for all workspace tabs in a fast, batch-prefetched call.
    """
    # Bulk prefetch reference dictionaries to avoid N+1 query latency over cloud DB
    all_customers = {c.id: c for c in db.query(Customer).all()}
    all_users = {u.id: u for u in db.query(User).all()}
    all_products = {p.id: p for p in db.query(Product).all()}
    all_categories = {cat.id: cat.name for cat in db.query(ProductCategory).all()}
    
    # Preload contacts
    contacts_map = {}
    for c in db.query(CustomerContact).all():
        if c.customer_id not in contacts_map or c.is_primary:
            contacts_map[c.customer_id] = c

    # Preload lines grouped by quotation_id
    lines_by_quote: Dict[int, List[Any]] = {}
    for l in db.query(QuotationLine).all():
        lines_by_quote.setdefault(l.quotation_id, []).append(l)

    # Preload latest approval by quotation_id
    approvals_by_quote: Dict[int, Any] = {}
    for a in db.query(Approval).order_by(Approval.id.asc()).all():
        approvals_by_quote[a.quotation_id] = a

    preloaded = {
        "customers": all_customers,
        "contacts": contacts_map,
        "users": all_users,
        "products": all_products,
        "lines_by_quote": lines_by_quote,
        "approvals_by_quote": approvals_by_quote,
    }

    # 1. Quotations (60 records)
    db_quotes = db.query(Quotation).order_by(desc(Quotation.id)).limit(60).all()
    quotations_list = [format_quotation(q, db, preloaded=preloaded) for q in db_quotes]

    # Preload stock sums
    stock_by_prod: Dict[int, int] = {}
    stock_by_wh: Dict[int, Dict[str, int]] = {}
    for s in db.query(InventoryStock).all():
        qty = int(s.quantity_available or s.quantity_on_hand or 0)
        stock_by_prod[s.product_id] = stock_by_prod.get(s.product_id, 0) + qty
        stock_by_wh.setdefault(s.warehouse_id, {})[str(s.product_id)] = qty

    # 2. Products (24 records)
    products_list = []
    for p in all_products.values():
        cat_name = all_categories.get(p.category_id, "Enterprise Hardware")
        total_stock = stock_by_prod.get(p.id, 45)
        margin_pct = float(p.margin_percent) if p.margin_percent else (round(((p.unit_price - p.cost_price) / p.unit_price) * 100, 1) if p.unit_price > 0 else 35.0)
        products_list.append({
            "id": p.id,
            "name": p.name,
            "sku": p.sku or f"SKU-{p.id}",
            "category": cat_name,
            "unit_price": float(p.unit_price or 0.0),
            "cost_price": float(p.cost_price or 0.0),
            "margin_percent": margin_pct,
            "stock_quantity": total_stock,
            "description": p.description or f"Enterprise tier {p.name}.",
            "is_active": p.is_active if hasattr(p, "is_active") else True
        })

    # 3. Warehouses (3 records)
    db_warehouses = db.query(Warehouse).all()
    warehouses_list = []
    for w in db_warehouses:
        inv_map = stock_by_wh.get(w.id, {})
        total_units = sum(inv_map.values())
        warehouses_list.append({
            "id": str(w.id),
            "code": w.warehouse_code,
            "name": w.name,
            "location": f"{w.city}, {w.state or w.country}",
            "capacity": w.capacity,
            "current_stock": total_units,
            "inventory": inv_map,
            "manager_name": w.manager_name or "Operations Lead"
        })

    # 4. Invoices (40 records)
    db_invoices = db.query(Invoice).order_by(desc(Invoice.id)).limit(40).all()
    invoices_list = []
    for inv in db_invoices:
        cust = all_customers.get(inv.customer_id)
        cust_name = cust.company_name if cust else f"Client #{inv.customer_id}"
        invoices_list.append({
            "id": inv.id,
            "invoice_number": inv.invoice_number or f"INV-{inv.id:04d}",
            "quotation_id": inv.quotation_id,
            "customer_name": cust_name,
            "amount": float(inv.total_amount or 0.0),
            "amount_paid": float(inv.amount_paid or 0.0),
            "amount_due": float(inv.amount_due or 0.0),
            "status": inv.status or "POSTED",
            "payment_status": inv.payment_status or "PAID",
            "issue_date": inv.invoice_date.strftime("%Y-%m-%d") if inv.invoice_date else "2026-03-01",
            "due_date": inv.due_date.strftime("%Y-%m-%d") if inv.due_date else "2026-03-31"
        })

    # 5. Subscriptions (15 records)
    db_subs = db.query(Subscription).order_by(desc(Subscription.id)).all()
    subs_list = []
    for s in db_subs:
        cust = all_customers.get(s.customer_id)
        cust_name = cust.company_name if cust else f"Customer #{s.customer_id}"
        subs_list.append({
            "id": s.id,
            "subscription_number": s.subscription_number or f"SUB-{s.id:04d}",
            "customer_name": cust_name,
            "plan_name": s.plan_name or "Enterprise Platform License",
            "billing_frequency": s.billing_frequency or "MONTHLY",
            "recurring_amount": float(s.recurring_amount or 1500.0),
            "status": s.status or "ACTIVE",
            "start_date": s.start_date.strftime("%Y-%m-%d") if s.start_date else "2026-01-01",
            "next_billing_date": s.next_billing_date.strftime("%Y-%m-%d") if s.next_billing_date else "2026-04-01",
            "auto_renew": s.auto_renew if hasattr(s, "auto_renew") else True
        })

    # 6. Approvals (25 records)
    quotes_by_id = {q.id: q for q in db_quotes}
    db_approvals = db.query(Approval).order_by(desc(Approval.id)).all()
    approvals_list = []
    for a in db_approvals:
        quote = quotes_by_id.get(a.quotation_id)
        q_num = quote.quote_number if quote else f"Q-{a.quotation_id}"
        cust = all_customers.get(quote.customer_id) if quote else None
        c_name = cust.company_name if cust else "Enterprise Client"
        req_user = all_users.get(a.requested_by) if a.requested_by else None
        req_email = req_user.email if req_user else None
        quote_rep = all_users.get(quote.sales_rep_id) if (quote and quote.sales_rep_id) else None
        rep_email = quote_rep.email if quote_rep else req_email
        approvals_list.append({
            "id": a.id,
            "quotation_id": a.quotation_id,
            "quote_number": q_num,
            "customer_name": c_name,
            "requester_name": req_user.name if req_user else (quote_rep.name if quote_rep else "Sales Representative"),
            "requester_email": req_email or rep_email,
            "sales_rep_email": rep_email,
            "discount_requested": float(quote.discount_percent) if (quote and quote.discount_percent) else 18.5,
            "max_allowed_discount": 15.0,
            "status": a.status or "PENDING",
            "requested_at": a.created_at.strftime("%Y-%m-%d %H:%M") if a.created_at else "2026-03-02 10:30",
            "reason": a.reason or "Enterprise volume pricing concession requested."
        })

    # 7. Users
    users_list = []
    for u in all_users.values():
        users_list.append({
            "id": u.id,
            "email": u.email,
            "fullName": u.name,
            "name": u.name,
            "role": u.role,
            "reporting_manager": getattr(u, "reporting_manager", None),
            "status": "Active" if u.status == "ACTIVE" else "Pending Invite",
            "is_active": u.status == "ACTIVE",
            "department": "Sales Operations"
        })

    # 8. Pipeline & Reports Summary
    total_rev = db.query(func.sum(Quotation.total_amount)).filter(Quotation.status == "ACCEPTED").scalar() or 1450000.0
    active_pipeline = db.query(func.sum(Quotation.total_amount)).filter(Quotation.status.in_(["SENT", "PENDING_APPROVAL", "APPROVED"])).scalar() or 680000.0
    total_quotes_count = len(quotations_list)
    won_quotes_count = sum(1 for q in quotations_list if q["status"] == "ACCEPTED")
    win_rate = round((won_quotes_count / total_quotes_count) * 100, 1) if total_quotes_count > 0 else 64.2

    reports_summary = {
        "total_revenue": float(total_rev),
        "active_pipeline": float(active_pipeline),
        "total_quotes": total_quotes_count,
        "win_rate": win_rate,
        "avg_deal_size": round(float(total_rev) / won_quotes_count, 2) if won_quotes_count > 0 else 24500.0,
        "avg_discount": 9.4,
        "avg_margin": 38.6
    }

    # 9. Governance Rules
    db_tiers = db.query(DiscountTier).all()
    tier_limits = {t.name: float(t.max_discount) for t in db_tiers}
    if "Platinum" not in tier_limits:
        tier_limits["Platinum"] = 20.0
    if "Bronze" not in tier_limits:
        tier_limits["Bronze"] = 5.0
    if "Silver" not in tier_limits:
        tier_limits["Silver"] = 10.0
    if "Gold" not in tier_limits:
        tier_limits["Gold"] = 15.0

    cat_limits = {"Hardware": 15.0, "Software": 25.0, "Services": 10.0}
    governance_data = {
        "tierLimits": tier_limits,
        "categoryLimits": cat_limits,
        "approvalLevels": {
            "managerThreshold": 15.0,
            "financeThreshold": 20.0
        }
    }

    # 10. Audit Logs
    db_audit = db.query(AuditLog).order_by(desc(AuditLog.id)).limit(100).all()
    audit_logs_list = []
    for a in db_audit:
        u = all_users.get(a.user_id) if a.user_id else None
        role_label = u.role.lower() if u and u.role else "admin"
        ts = a.created_at.strftime("%b %d, %Y, %I:%M:%S %p") if a.created_at else datetime.utcnow().strftime("%b %d, %Y, %I:%M:%S %p")
        audit_logs_list.append({
            "id": f"aud-{a.id}",
            "timestamp": ts,
            "actorName": u.name if u else "System Admin",
            "actorRole": role_label,
            "actionType": a.action,
            "targetQuotationId": f"Q-{a.entity_id}" if a.entity_type == "quotation" else f"#{a.entity_id}",
            "customerName": "Enterprise Client",
            "details": a.new_value or f"{a.action} executed on {a.entity_type} #{a.entity_id}"
        })

    return {
        "status": "success",
        "data": {
            "quotations": quotations_list,
            "products": products_list,
            "warehouses": warehouses_list,
            "invoices": invoices_list,
            "subscriptions": subs_list,
            "approvals": approvals_list,
            "users": users_list,
            "governance": governance_data,
            "reports": reports_summary,
            "audit_logs": audit_logs_list
        }
    }

# â"â" Quotation CRUD & Actions â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"â"
@router.get("/quotations")
def list_quotations(status: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Quotation).order_by(desc(Quotation.id))
    if status:
        query = query.filter(Quotation.status == status)
    return [format_quotation(q, db) for q in query.all()]

@router.get("/quotations/{quote_id}")
def get_quotation_detail(quote_id: str, db: Session = Depends(get_db)):
    quote = None
    if quote_id.isdigit():
        quote = db.query(Quotation).filter(Quotation.id == int(quote_id)).first()
    if not quote:
        quote = db.query(Quotation).filter(Quotation.quote_number == quote_id).first()
    if not quote:
        raise HTTPException(status_code=404, detail="Quotation not found")
    return format_quotation(quote, db)

@router.put("/quotations/{quote_id}")
def update_full_quotation(quote_id: str, payload: SaveFullQuotationPayload, db: Session = Depends(get_db)):
    quote = None
    if quote_id.isdigit():
        quote = db.query(Quotation).filter(Quotation.id == int(quote_id)).first()
    if not quote:
        quote = db.query(Quotation).filter(Quotation.quote_number == quote_id).first()
    if not quote:
        raise HTTPException(status_code=404, detail="Quotation not found")

    if payload.status:
        quote.status = payload.status
    if payload.notes is not None:
        quote.internal_notes = payload.notes
    if payload.sales_rep_email:
        rep_u = db.query(User).filter(User.email.ilike(payload.sales_rep_email)).first()
        if rep_u:
            quote.sales_rep_id = rep_u.id
    elif payload.sales_rep_name:
        rep_u = db.query(User).filter(User.name.ilike(payload.sales_rep_name)).first()
        if rep_u:
            quote.sales_rep_id = rep_u.id

    if payload.customer_name and payload.customer_name.strip():
        cust = db.query(Customer).filter(Customer.company_name.ilike(payload.customer_name.strip())).first()
        if not cust:
            contact = db.query(CustomerContact).filter(CustomerContact.name.ilike(payload.customer_name.strip())).first()
            if contact:
                cust = db.query(Customer).filter(Customer.id == contact.customer_id).first()
        if not cust:
            comp_name = payload.customer_name.strip()
            last_c = db.query(Customer).order_by(desc(Customer.id)).first()
            next_code = f"CUST-{(last_c.id + 101) if last_c else 101}"
            cust = Customer(
                customer_code=next_code,
                company_name=comp_name,
                industry="Healthcare & Pharmaceuticals" if "pharma" in comp_name.lower() else "Enterprise Services",
                company_size="50-250",
                country="India",
                state="Maharashtra",
                city="Mumbai",
                currency="USD",
                customer_tier="Gold",
                sales_owner_id=quote.sales_rep_id or 1,
                credit_limit=150000.0,
                payment_terms_days=30,
                status="ACTIVE"
            )
            db.add(cust)
            db.commit()
            db.refresh(cust)

            contact = CustomerContact(
                customer_id=cust.id,
                name=f"{comp_name} Procurement Lead",
                email=payload.customer_email or f"contact@{comp_name.lower().replace(' ', '')}.com",
                phone="+91-9876543210",
                job_title="Procurement Director",
                department="Procurement",
                is_primary=True,
                portal_enabled=True,
                status="ACTIVE"
            )
            db.add(contact)
            db.commit()
        if cust:
            quote.customer_id = cust.id

    # Update line items if provided
    if payload.lines is not None and len(payload.lines) > 0:
        # Remove existing lines and re-create to keep sync clean
        db.query(QuotationLine).filter(QuotationLine.quotation_id == quote.id).delete()
        
        total_sub = 0.0
        total_disc = 0.0
        total_cost = 0.0

        for l in payload.lines:
            # find product
            prod = None
            if l.product_id:
                prod = db.query(Product).filter(Product.id == l.product_id).first()
            if not prod and l.product_name:
                prod = db.query(Product).filter(Product.name == l.product_name).first()
            
            p_id = prod.id if prod else 1
            u_cost = l.unit_cost if l.unit_cost is not None else (prod.cost_price if prod else l.unit_price * 0.65)
            
            disc_amt = round(l.quantity * l.unit_price * (l.discount_percent / 100.0), 2)
            l_sub = round(l.quantity * l.unit_price - disc_amt, 2)
            l_cost = round(l.quantity * u_cost, 2)
            l_margin = round(l_sub - l_cost, 2)
            l_margin_pct = round((l_margin / l_sub) * 100, 2) if l_sub > 0 else 0.0

            total_sub += (l.quantity * l.unit_price)
            total_disc += disc_amt
            total_cost += l_cost

            new_line = QuotationLine(
                quotation_id=quote.id,
                product_id=p_id,
                quantity=l.quantity,
                unit_price=l.unit_price,
                discount_percent=l.discount_percent,
                discount_amount=disc_amt,
                line_subtotal=l_sub,
                unit_cost=u_cost,
                line_cost=l_cost,
                line_margin=l_margin,
                line_margin_percent=l_margin_pct,
                discount_limit_percent=15.0,
                discount_status="OK" if l.discount_percent <= 15.0 else "OVER_LIMIT"
            )
            db.add(new_line)

        # Update totals
        tax = round((total_sub - total_disc) * 0.08, 2)
        total_amt = round((total_sub - total_disc) + tax, 2)
        gross_margin = round((total_sub - total_disc) - total_cost, 2)
        net_rev = total_sub - total_disc
        m_pct = round((gross_margin / net_rev) * 100, 2) if net_rev > 0 else 0.0

        quote.subtotal = round(total_sub, 2)
        quote.discount_amount = round(total_disc, 2)
        quote.tax_amount = tax
        quote.total_amount = total_amt
        quote.total_cost = round(total_cost, 2)
        quote.gross_margin = gross_margin
        quote.margin_percent = m_pct
        quote.discount_percent = round((total_disc / total_sub) * 100, 2) if total_sub > 0 else 0.0
        
        # Calculate health score based on margin
        quote.deal_health_score = 90.0 if m_pct >= 40 else (75.0 if m_pct >= 25 else 50.0)

    # Synchronize approvals table
    if quote.status == "PENDING_APPROVAL":
        existing_appr = db.query(Approval).filter(Approval.quotation_id == quote.id).first()
        manager_user = db.query(User).filter(User.role.ilike("%manager%")).first() or db.query(User).first()
        manager_id = manager_user.id if manager_user else 3
        
        last_appr = db.query(Approval).order_by(desc(Approval.id)).first()
        next_appr_num = f"APR-{(last_appr.id + 1020) if last_appr else 1021}"

        if not existing_appr:
            new_appr = Approval(
                approval_number=next_appr_num,
                quotation_id=quote.id,
                requested_by=quote.sales_rep_id or 1,
                assigned_to=manager_id,
                approval_type="DISCOUNT",
                reason=payload.notes or "Quotation discount concession requested",
                risk_score=float(quote.deal_health_score or 50.0),
                status="PENDING",
                requested_at=datetime.utcnow(),
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            db.add(new_appr)
        else:
            existing_appr.status = "PENDING"
            if payload.notes:
                existing_appr.reason = payload.notes
    elif quote.status in ["APPROVED", "ACCEPTED", "CONFIRMED"]:
        appr = db.query(Approval).filter(Approval.quotation_id == quote.id).first()
        if appr:
            appr.status = "APPROVED"
            appr.resolved_at = datetime.utcnow()
    elif quote.status == "REJECTED":
        appr = db.query(Approval).filter(Approval.quotation_id == quote.id).first()
        if appr:
            appr.status = "REJECTED"
            appr.resolved_at = datetime.utcnow()

    db.commit()
    db.refresh(quote)
    return format_quotation(quote, db)

@router.post("/quotations")
def create_new_quotation(payload: SaveFullQuotationPayload, db: Session = Depends(get_db)):
    # Resolve sales rep
    sales_rep = None
    if payload.sales_rep_email:
        sales_rep = db.query(User).filter(User.email.ilike(payload.sales_rep_email)).first()
    if not sales_rep and payload.sales_rep_name:
        sales_rep = db.query(User).filter(User.name.ilike(payload.sales_rep_name)).first()
    if not sales_rep:
        sales_rep = db.query(User).filter(User.role.ilike("%rep%")).first() or db.query(User).first()

    # Find or create customer
    cust = None
    if payload.customer_name and payload.customer_name.strip():
        cust = db.query(Customer).filter(Customer.company_name.ilike(payload.customer_name.strip())).first()
        if not cust:
            contact = db.query(CustomerContact).filter(CustomerContact.name.ilike(payload.customer_name.strip())).first()
            if contact:
                cust = db.query(Customer).filter(Customer.id == contact.customer_id).first()
        if not cust:
            comp_name = payload.customer_name.strip()
            last_c = db.query(Customer).order_by(desc(Customer.id)).first()
            next_code = f"CUST-{(last_c.id + 101) if last_c else 101}"
            cust = Customer(
                customer_code=next_code,
                company_name=comp_name,
                industry="Healthcare & Pharmaceuticals" if "pharma" in comp_name.lower() else "Enterprise Services",
                company_size="50-250",
                country="India",
                state="Maharashtra",
                city="Mumbai",
                currency="USD",
                customer_tier="Gold",
                sales_owner_id=sales_rep.id if sales_rep else 1,
                credit_limit=150000.0,
                payment_terms_days=30,
                status="ACTIVE"
            )
            db.add(cust)
            db.commit()
            db.refresh(cust)

            contact = CustomerContact(
                customer_id=cust.id,
                name=f"{comp_name} Procurement Lead",
                email=payload.customer_email or f"contact@{comp_name.lower().replace(' ', '')}.com",
                phone="+91-9876543210",
                job_title="Procurement Director",
                department="Procurement",
                is_primary=True,
                portal_enabled=True,
                status="ACTIVE"
            )
            db.add(contact)
            db.commit()
    if not cust:
        cust = db.query(Customer).first()
    
    # Generate next quote number
    last_q = db.query(Quotation).order_by(desc(Quotation.id)).first()
    next_num = f"Q-{(last_q.id + 1040) if last_q else 1042}"

    new_q = Quotation(
        quote_number=next_num,
        customer_id=cust.id if cust else 1,
        sales_rep_id=sales_rep.id if sales_rep else 1,
        quote_date=datetime.utcnow(),
        valid_until=datetime.utcnow(),
        status=payload.status or "DRAFT",
        currency="USD",
        subtotal=0.0,
        discount_amount=0.0,
        tax_amount=0.0,
        total_amount=0.0,
        total_cost=0.0,
        gross_margin=0.0,
        margin_percent=0.0,
        discount_percent=0.0,
        deal_health_score=85.0
    )
    db.add(new_q)
    db.commit()
    db.refresh(new_q)

    # Populate lines and create approval if needed
    return update_full_quotation(str(new_q.id), payload, db)

@router.post("/approvals/{approval_id}/action")
def process_approval(approval_id: str, payload: ApprovalActionPayload, db: Session = Depends(get_db)):
    req = None
    clean_id = approval_id.replace("appr-", "").replace("Q-", "")
    if clean_id.isdigit():
        req = db.query(Approval).filter(Approval.id == int(clean_id)).first()
        if not req:
            req = db.query(Approval).filter(Approval.quotation_id == int(clean_id)).first()
    if not req:
        # try matching by quotation quote_number
        quote_match = db.query(Quotation).filter(Quotation.quote_number == approval_id).first()
        if quote_match:
            req = db.query(Approval).filter(Approval.quotation_id == quote_match.id).first()
            if not req:
                req = Approval(
                    quotation_id=quote_match.id,
                    requested_by=quote_match.sales_rep_id,
                    status="PENDING",
                    reason="Manager reviewed approval"
                )
                db.add(req)
                db.commit()
                db.refresh(req)

    if not req:
        raise HTTPException(status_code=404, detail="Approval request not found")

    new_stat = "APPROVED" if payload.action.upper() == "APPROVE" else "REJECTED"
    req.status = new_stat
    req.decision_comment = payload.comments or f"Decision processed by {payload.approver_name}."
    req.resolved_at = datetime.utcnow()
    
    quote = db.query(Quotation).filter(Quotation.id == req.quotation_id).first()
    if quote:
        quote.status = "APPROVED" if payload.action.upper() == "APPROVE" else "REJECTED"
        if payload.comments:
            quote.internal_notes = payload.comments

    db.commit()
    return {"status": "success", "new_status": req.status, "quote_number": quote.quote_number if quote else None}

@router.post("/audit-log")
def create_audit_log(payload: CreateAuditLogPayload, db: Session = Depends(get_db)):
    user = None
    if payload.user_id:
        user = db.query(User).filter(User.id == payload.user_id).first()
    elif payload.actor_name:
        user = db.query(User).filter(User.name == payload.actor_name).first()

    clean_entity_id = payload.entity_id or 1042
    if payload.target_quotation_id:
        digits = "".join(filter(str.isdigit, payload.target_quotation_id))
        if digits:
            clean_entity_id = int(digits)

    new_log = AuditLog(
        user_id=user.id if user else None,
        entity_type=payload.entity_type,
        entity_id=clean_entity_id,
        action=payload.action,
        old_value=payload.old_value,
        new_value=payload.new_value or payload.details,
        ip_address="127.0.0.1",
        timestamp=datetime.utcnow(),
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    db.add(new_log)
    db.commit()
    db.refresh(new_log)

    return {
        "status": "success",
        "log": {
            "id": f"aud-{new_log.id}",
            "timestamp": new_log.created_at.strftime("%b %d, %Y, %I:%M:%S %p"),
            "actorName": payload.actor_name or (user.name if user else "System Operator"),
            "actorRole": payload.actor_role or (user.role.lower() if user else "admin"),
            "actionType": new_log.action,
            "targetQuotationId": payload.target_quotation_id or (f"Q-{new_log.entity_id}" if new_log.entity_type == "quotation" else str(new_log.entity_id)),
            "customerName": payload.customer_name or "Enterprise Client",
            "details": payload.details or f"{new_log.action} on {new_log.entity_type}"
        }
    }
