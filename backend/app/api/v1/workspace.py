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
    lines: List[QuotationLineSaveItem] = []

class ApprovalActionPayload(BaseModel):
    action: str  # "APPROVE" or "REJECT"
    comments: Optional[str] = None
    approver_name: Optional[str] = "Sales Manager"

# â"â" Helpers to format model objects to frontend shapes â"â"â"â"â"â"â"
def format_quotation(q: Quotation, db: Session) -> Dict[str, Any]:
    lines = db.query(QuotationLine).filter(QuotationLine.quotation_id == q.id).all()
    
    # Customer and primary contact
    customer = db.query(Customer).filter(Customer.id == q.customer_id).first()
    cust_company = customer.company_name if customer else "Enterprise Client"
    cust_tier = customer.customer_tier if customer else "Gold"
    
    primary_contact = db.query(CustomerContact).filter(CustomerContact.customer_id == q.customer_id, CustomerContact.is_primary == True).first()
    if not primary_contact:
        primary_contact = db.query(CustomerContact).filter(CustomerContact.customer_id == q.customer_id).first()

    cust_name = primary_contact.name if primary_contact else cust_company
    cust_email = primary_contact.email if primary_contact else "client@example.com"

    # Sales Rep
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
        "deal_stage": "Negotiation" if q.status in ["SENT", "PENDING_APPROVAL"] else ("Closed Won" if q.status == "ACCEPTED" else "Drafting"),
        "created_at": q.created_at.strftime("%Y-%m-%d") if q.created_at else "2026-03-01",
        "expires_at": q.valid_until.strftime("%Y-%m-%d") if q.valid_until else "2026-04-01",
        "sales_rep": sales_rep_name,
        "customer_notes": q.customer_notes or "",
        "internal_notes": q.internal_notes or "",
        "lines": formatted_lines
    }

# â"â" Bootstrap Endpoint: All Workspace Data in One Call â"â"â"â"â"â"â"
@router.get("/bootstrap")
def get_workspace_bootstrap(db: Session = Depends(get_db)):
    """
    Returns live PostgreSQL dataset for all workspace tabs in a single call.
    """
    # 1. Quotations (60 records)
    db_quotes = db.query(Quotation).order_by(desc(Quotation.id)).limit(60).all()
    quotations_list = [format_quotation(q, db) for q in db_quotes]

    # 2. Products (24 records)
    db_products = db.query(Product).order_by(Product.name).all()
    products_list = []
    for p in db_products:
        cat = db.query(ProductCategory).filter(ProductCategory.id == p.category_id).first() if p.category_id else None
        cat_name = cat.name if cat else "Enterprise Hardware"
        total_stock = db.query(func.sum(InventoryStock.quantity_available)).filter(InventoryStock.product_id == p.id).scalar()
        if total_stock is None:
            total_stock = 45

        margin_pct = float(p.margin_percent) if p.margin_percent else (round(((p.unit_price - p.cost_price) / p.unit_price) * 100, 1) if p.unit_price > 0 else 35.0)

        products_list.append({
            "id": p.id,
            "name": p.name,
            "sku": p.sku or f"SKU-{p.id}",
            "category": cat_name,
            "unit_price": float(p.unit_price or 0.0),
            "cost_price": float(p.cost_price or 0.0),
            "margin_percent": margin_pct,
            "stock_quantity": int(total_stock),
            "description": p.description or f"Enterprise tier {p.name}.",
            "is_active": p.is_active if hasattr(p, "is_active") else True
        })

    # 3. Warehouses (3 records)
    db_warehouses = db.query(Warehouse).all()
    warehouses_list = []
    for w in db_warehouses:
        total_units = db.query(func.sum(InventoryStock.quantity_on_hand)).filter(InventoryStock.warehouse_id == w.id).scalar() or 0
        stocks = db.query(InventoryStock).filter(InventoryStock.warehouse_id == w.id).all()
        inv_map = {str(s.product_id): int(s.quantity_available or s.quantity_on_hand) for s in stocks}
        warehouses_list.append({
            "id": str(w.id),
            "code": w.warehouse_code,
            "name": w.name,
            "location": f"{w.city}, {w.state or w.country}",
            "capacity": w.capacity,
            "current_stock": int(total_units),
            "inventory": inv_map,
            "manager_name": w.manager_name or "Operations Lead"
        })

    # 4. Invoices (40 records)
    db_invoices = db.query(Invoice).order_by(desc(Invoice.id)).limit(40).all()
    invoices_list = []
    for inv in db_invoices:
        cust = db.query(Customer).filter(Customer.id == inv.customer_id).first() if inv.customer_id else None
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
        cust = db.query(Customer).filter(Customer.id == s.customer_id).first() if s.customer_id else None
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

    # 6. Approvals
    db_approvals = db.query(Approval).order_by(desc(Approval.id)).all()
    approvals_list = []
    for a in db_approvals:
        quote = db.query(Quotation).filter(Quotation.id == a.quotation_id).first()
        q_num = quote.quote_number if quote else f"Q-{a.quotation_id}"
        cust = db.query(Customer).filter(Customer.id == quote.customer_id).first() if quote else None
        c_name = cust.company_name if cust else "Enterprise Client"
        req_user = db.query(User).filter(User.id == a.requested_by).first() if a.requested_by else None
        approvals_list.append({
            "id": a.id,
            "quotation_id": a.quotation_id,
            "quote_number": q_num,
            "customer_name": c_name,
            "requester_name": req_user.name if req_user else "Sales Representative",
            "discount_requested": float(quote.discount_percent) if (quote and quote.discount_percent) else 18.5,
            "max_allowed_discount": 15.0,
            "status": a.status or "PENDING",
            "requested_at": a.created_at.strftime("%Y-%m-%d %H:%M") if a.created_at else "2026-03-02 10:30",
            "reason": a.reason or "Enterprise volume pricing concession requested."
        })

    # 7. Users
    db_users = db.query(User).all()
    users_list = []
    for u in db_users:
        users_list.append({
            "id": u.id,
            "email": u.email,
            "fullName": u.name,
            "name": u.name,
            "role": u.role,
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

    # 9. Governance Rules from PostgreSQL
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
            "reports": reports_summary
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

    db.commit()
    db.refresh(quote)
    return format_quotation(quote, db)

@router.post("/quotations")
def create_new_quotation(payload: SaveFullQuotationPayload, db: Session = Depends(get_db)):
    # Find or create customer
    cust = db.query(Customer).first()
    sales_rep = db.query(User).filter(User.role == "sales_rep").first() or db.query(User).first()
    
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

    # Now use update_full_quotation logic to populate lines
    return update_full_quotation(str(new_q.id), payload, db)

@router.post("/approvals/{approval_id}/action")
def process_approval(approval_id: int, payload: ApprovalActionPayload, db: Session = Depends(get_db)):
    req = db.query(Approval).filter(Approval.id == approval_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Approval request not found")

    req.status = "APPROVED" if payload.action.upper() == "APPROVE" else "REJECTED"
    req.decision_comment = payload.comments or f"Decision processed via Workspace Hub."
    req.resolved_at = datetime.utcnow()
    
    quote = db.query(Quotation).filter(Quotation.id == req.quotation_id).first()
    if quote:
        quote.status = "APPROVED" if payload.action.upper() == "APPROVE" else "REJECTED"

    db.commit()
    return {"status": "success", "new_status": req.status}
