"""
DealFlow360 - Deterministic Synthetic Dataset Generator & Seeder
Seed: SEED = 360360
Total Target: EXACTLY 1,042 records across 30 tables.
"""

import os
import sys
import random
import csv
from datetime import datetime, timedelta

# Add backend to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend')))

from app.core.database import engine, SessionLocal, Base
from app.models import (
    User, Customer, CustomerContact, ProductCategory, Product,
    Pricelist, Promotion, ProductRelationship, Warehouse, InventoryStock,
    DiscountTier, DiscountRule, Quotation, QuotationLine, HistoricalOrder,
    HistoricalOrderLine, RecommendationFeedback, Approval, ApprovalStep,
    FulfillmentOrder, FulfillmentLine, Subscription, SubscriptionLine,
    Invoice, InvoiceLine, Payment, Negotiation, NegotiationMessage,
    DealHealthSnapshot, DealAnomaly, AuditLog
)

SEED = 360360
random.seed(SEED)

def seed_database():
    print("=" * 60)
    print("Starting DealFlow360 Deterministic Data Generation (SEED=360360)")
    print("=" * 60)

    # Re-create tables
    Base.metadata.create_all(bind=engine)

    session = SessionLocal()

    # Clear existing records
    print("Clearing existing synthetic data...")
    for model in [
        AuditLog, DealAnomaly, DealHealthSnapshot, NegotiationMessage, Negotiation,
        Payment, InvoiceLine, Invoice, SubscriptionLine, Subscription,
        FulfillmentLine, FulfillmentOrder, ApprovalStep, Approval,
        RecommendationFeedback, QuotationLine, Quotation, HistoricalOrderLine, HistoricalOrder,
        DiscountRule, DiscountTier, InventoryStock, Warehouse, ProductRelationship,
        Promotion, Pricelist, Product, ProductCategory, CustomerContact, Customer, User
    ]:
        session.query(model).delete()
    session.commit()

    base_time = datetime(2025, 1, 1, 9, 0, 0)

    # -------------------------------------------------------------
    # 1. USERS (8 records)
    # -------------------------------------------------------------
    print("Generating 8 Users...")
    users_data = [
        {"id": 1, "name": "Aarav Sharma", "email": "sales1@dealflow360.demo", "password_hash": "pbkdf2_sha256$hashed$sales1", "role": "Sales Representative", "status": "ACTIVE", "last_login_at": base_time + timedelta(days=400, hours=1)},
        {"id": 2, "name": "Priya Mehta", "email": "sales2@dealflow360.demo", "password_hash": "pbkdf2_sha256$hashed$sales2", "role": "Sales Representative", "status": "ACTIVE", "last_login_at": base_time + timedelta(days=400, hours=2)},
        {"id": 3, "name": "Rohan Kapoor", "email": "manager1@dealflow360.demo", "password_hash": "pbkdf2_sha256$hashed$mgr1", "role": "Sales Manager", "status": "ACTIVE", "last_login_at": base_time + timedelta(days=400, hours=3)},
        {"id": 4, "name": "Ananya Iyer", "email": "manager2@dealflow360.demo", "password_hash": "pbkdf2_sha256$hashed$mgr2", "role": "Sales Manager", "status": "ACTIVE", "last_login_at": base_time + timedelta(days=400, hours=4)},
        {"id": 5, "name": "Vikram Malhotra", "email": "finance1@dealflow360.demo", "password_hash": "pbkdf2_sha256$hashed$fin1", "role": "Finance/Operations", "status": "ACTIVE", "last_login_at": base_time + timedelta(days=400, hours=5)},
        {"id": 6, "name": "Kavita Rao", "email": "customer1@acme.demo", "password_hash": "pbkdf2_sha256$hashed$cust1", "role": "Customer Portal User", "status": "ACTIVE", "last_login_at": base_time + timedelta(days=390, hours=6)},
        {"id": 7, "name": "Sameer Joshi", "email": "customer2@novasystems.demo", "password_hash": "pbkdf2_sha256$hashed$cust2", "role": "Customer Portal User", "status": "ACTIVE", "last_login_at": base_time + timedelta(days=395, hours=7)},
        {"id": 8, "name": "Rajesh Varma", "email": "admin@dealflow360.demo", "password_hash": "pbkdf2_sha256$hashed$admin", "role": "Admin", "status": "ACTIVE", "last_login_at": base_time + timedelta(days=405, hours=8)},
    ]
    users = []
    for u in users_data:
        users.append(User(
            id=u["id"], name=u["name"], email=u["email"], password_hash=u["password_hash"],
            role=u["role"], status=u["status"], last_login_at=u["last_login_at"],
            created_at=base_time, updated_at=base_time
        ))
    session.add_all(users)
    session.flush()

    # -------------------------------------------------------------
    # 2. CUSTOMERS (40 records)
    # -------------------------------------------------------------
    print("Generating 40 Customers...")
    industries = ["Technology", "Healthcare", "Education", "Manufacturing", "Retail", "Financial Services", "Logistics", "Professional Services"]
    company_names = [
        "Acme Corp", "Nova Systems", "Vertex Technologies", "BluePeak Retail", "Orion Manufacturing",
        "Apex Healthcare", "Zenith Logistics", "CloudMatrix", "BrightPath Education", "Pinnacle Financial",
        "NexGen Software", "BioHealth Labs", "Titan Industrial", "Horizon Media", "Summit Analytics",
        "Vanguard Logistics", "Silverline Retail", "CyberShield Networks", "OmniGlobal Services", "Starlight Education",
        "Beacon Medical", "Quantum Dynamics", "Atlas Heavy Machinery", "Velocity Freight", "GreenPulse Energy",
        "Echo Systems", "Frontier Biotech", "Catalyst Consulting", "Ironclad Security", "Alpine Financial",
        "Synergy Solutions", "Prime Global", "Crestview Health", "Paramount Packaging", "Integra Core",
        "Polaris Marine", "Dynamic Commerce", "Spectrum Media", "TrueNorth Health", "Vast Horizons"
    ]
    tiers = ["ENTERPRISE", "MID_MARKET", "SMB"]
    sizes = ["10-50", "50-200", "200-500", "500-1000", "1000-5000"]
    cities = [("San Francisco", "California"), ("Austin", "Texas"), ("Seattle", "Washington"), ("Chicago", "Illinois"), ("Boston", "Massachusetts"), ("New York", "New York"), ("Denver", "Colorado"), ("Atlanta", "Georgia")]

    customers = []
    for i, name in enumerate(company_names, start=1):
        c_tier = "ENTERPRISE" if i == 1 else tiers[(i - 1) % len(tiers)]
        ind = industries[(i - 1) % len(industries)]
        size = sizes[(i - 1) % len(sizes)]
        city, state = cities[(i - 1) % len(cities)]
        rep_id = 1 if i % 2 == 1 else 2
        credit = 250000.0 if c_tier == "ENTERPRISE" else (100000.0 if c_tier == "MID_MARKET" else 40000.0)
        pt_days = 30 if c_tier == "ENTERPRISE" else (45 if c_tier == "MID_MARKET" else 60)
        ltv = 150000.0 if i == 1 else float(random.randint(15000, 120000))

        customers.append(Customer(
            id=i,
            customer_code=f"CUST-{i:03d}",
            company_name=name,
            industry=ind,
            company_size=size,
            country="United States",
            state=state,
            city=city,
            currency="USD",
            customer_tier=c_tier,
            sales_owner_id=rep_id,
            credit_limit=credit,
            payment_terms_days=pt_days,
            lifetime_value=ltv,
            status="ACTIVE",
            created_at=base_time + timedelta(days=i),
            updated_at=base_time + timedelta(days=i)
        ))
    session.add_all(customers)
    session.flush()

    # -------------------------------------------------------------
    # 3. CUSTOMER CONTACTS (40 records)
    # -------------------------------------------------------------
    print("Generating 40 Customer Contacts...")
    job_titles = ["Procurement Manager", "IT Manager", "Finance Manager", "Operations Manager", "CEO", "CFO", "CTO", "Administrative Manager"]
    first_names = ["James", "Sarah", "Michael", "Emily", "David", "Jessica", "Robert", "Ashley", "William", "Amanda"]
    last_names = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Miller", "Davis", "Wilson", "Taylor", "Anderson"]

    contacts = []
    for i in range(1, 41):
        fn = first_names[(i - 1) % len(first_names)]
        ln = last_names[(i - 1) % len(last_names)]
        title = job_titles[(i - 1) % len(job_titles)]
        dept = "Procurement" if "Procurement" in title else ("IT" if "IT" in title or "CTO" in title else ("Finance" if "Finance" in title or "CFO" in title else "Operations"))
        is_prim = True if i <= 32 else (i % 2 == 0) # 80%+ primary contacts
        portal = True if i in [1, 2, 6, 7, 10, 15] else False # Portal enabled for Acme, Nova Systems, etc.

        contacts.append(CustomerContact(
            id=i,
            customer_id=i,
            name=f"{fn} {ln}",
            email=f"{fn.lower()}.{ln.lower()}@cust{i}.demo" if i > 2 else ("kavita.rao@acme.demo" if i == 1 else "sameer.joshi@novasystems.demo"),
            phone=f"+1-555-01{i:02d}",
            job_title=title,
            department=dept,
            is_primary=is_prim,
            portal_enabled=portal,
            status="ACTIVE",
            created_at=base_time + timedelta(days=i),
            updated_at=base_time + timedelta(days=i)
        ))
    session.add_all(contacts)
    session.flush()

    # -------------------------------------------------------------
    # 4. PRODUCT CATEGORIES (6 records)
    # -------------------------------------------------------------
    print("Generating 6 Product Categories...")
    cats_data = [
        (1, "Laptops", "High performance business and workstation laptops", None),
        (2, "Monitors", "Ultra-sharp business and professional monitors", None),
        (3, "Accessories", "Ergonomic and productivity accessories", None),
        (4, "Services", "Professional deployment, installation and migration services", None),
        (5, "Support & Care", "Warranty extensions and priority support plans", None),
        (6, "Networking", "Enterprise gateways, routers and security hardware", None),
    ]
    categories = []
    for cid, cname, cdesc, pid in cats_data:
        categories.append(ProductCategory(
            id=cid, name=cname, description=cdesc, parent_category_id=pid, status="ACTIVE",
            created_at=base_time, updated_at=base_time
        ))
    session.add_all(categories)
    session.flush()

    # -------------------------------------------------------------
    # 5. PRODUCTS (24 records)
    # -------------------------------------------------------------
    print("Generating 24 Products in Structured Families & Tiers...")
    # Exact margin calculation: margin_amount = unit_price - cost_price, margin_percent = margin_amount / unit_price * 100
    products_raw = [
        # Laptop Pro Family (Cat 1: Laptops)
        (1, "LP-14", "Laptop Pro 14", "14-inch professional business laptop with Core i7", 1, "Laptop Pro", "PHYSICAL", 1, None, 1200.0, 840.0, False, None, True, True, False),
        (2, "LP-16", "Laptop Pro 16", "16-inch high performance laptop with Core i9 and 32GB RAM", 1, "Laptop Pro", "PHYSICAL", 2, 1, 1550.0, 1020.0, False, None, True, True, False),
        (3, "LP-18", "Laptop Pro 18", "18-inch flagship mobile workstation with RTX GPU", 1, "Laptop Pro", "PHYSICAL", 3, 2, 2100.0, 1350.0, False, None, True, True, False),

        # Business Monitor Family (Cat 2: Monitors)
        (4, "MB-24", "Monitor Basic 24", "24-inch Full HD IPS desktop monitor", 2, "Business Monitor", "PHYSICAL", 1, None, 220.0, 150.0, False, None, True, True, False),
        (5, "MP-27", "Monitor Pro 27", "27-inch QHD professional color-accurate monitor", 2, "Business Monitor", "PHYSICAL", 2, 4, 380.0, 240.0, False, None, True, True, False),
        (6, "MU-32", "Monitor Ultra 32", "32-inch 4K UHD curved HDR monitor", 2, "Business Monitor", "PHYSICAL", 3, 5, 650.0, 400.0, False, None, True, True, False),

        # Support Plan Family (Cat 5: Support & Care)
        (7, "BC-1Y", "Basic Care 1yr", "1-year standard warranty and email support", 5, "Support Plan", "SUBSCRIPTION", 1, None, 120.0, 40.0, True, "PLAN-BC1", True, True, True),
        (8, "PC-2Y", "Premium Care 2yr", "2-year 24/7 priority support with accidental damage coverage", 5, "Support Plan", "SUBSCRIPTION", 2, 7, 250.0, 75.0, True, "PLAN-PC2", True, True, True),
        (9, "EC-3Y", "Enterprise Care 3yr", "3-year mission-critical support with 4-hour onsite SLA", 5, "Support Plan", "SUBSCRIPTION", 3, 8, 450.0, 120.0, True, "PLAN-EC3", True, True, True),

        # Network Gateway Family (Cat 6: Networking)
        (10, "GW-STD", "Gateway Standard", "Secure branch office VPN router and firewall", 6, "Network Gateway", "PHYSICAL", 1, None, 500.0, 340.0, False, None, True, True, False),
        (11, "GW-PRO", "Gateway Pro", "High-throughput mid-market security gateway", 6, "Network Gateway", "PHYSICAL", 2, 10, 850.0, 530.0, False, None, True, True, False),
        (12, "GW-ENT", "Gateway Enterprise", "Redundant carrier-grade enterprise security appliance", 6, "Network Gateway", "PHYSICAL", 3, 11, 1400.0, 820.0, False, None, True, True, False),

        # Accessories (Cat 3: Accessories)
        (13, "ACC-WM", "Wireless Mouse", "Ergonomic rechargeable multi-device wireless mouse", 3, "Accessories", "PHYSICAL", None, None, 45.0, 18.0, False, None, True, True, False),
        (14, "ACC-MK", "Mechanical Keyboard", "Low-profile tactile mechanical keyboard with backlight", 3, "Accessories", "PHYSICAL", None, None, 95.0, 45.0, False, None, True, True, False),
        (15, "ACC-DS", "Docking Station", "Universal Thunderbolt 4 dual 4K display dock", 3, "Accessories", "PHYSICAL", None, None, 180.0, 95.0, False, None, True, True, False),
        (16, "ACC-LB", "Laptop Bag", "Water-resistant padded travel laptop messenger bag", 3, "Accessories", "PHYSICAL", None, None, 65.0, 25.0, False, None, True, True, False),
        (17, "ACC-WC", "Ultra HD Webcam", "4K auto-framing noise-cancelling conference webcam", 3, "Accessories", "PHYSICAL", None, None, 110.0, 55.0, False, None, True, True, False),
        (18, "ACC-PA", "Power Adapter 100W", "Compact GaN dual USB-C fast power adapter", 3, "Accessories", "PHYSICAL", None, None, 75.0, 30.0, False, None, True, True, False),

        # Services (Cat 4: Services)
        (19, "SRV-SET", "Onsite Setup Service", "Professional white-glove hardware deployment and configuration", 4, "Services", "SERVICE", None, None, 450.0, 220.0, False, None, True, True, True),
        (20, "SRV-DM", "Data Migration", "Secure legacy system user data and profile migration service", 4, "Services", "SERVICE", None, None, 600.0, 280.0, False, None, True, True, True),
        (21, "SRV-NET", "Network Setup", "Onsite network configuration, VLAN design and firewall setup", 4, "Services", "SERVICE", None, None, 750.0, 350.0, False, None, True, True, True),

        # Support & Cloud Services (Cat 5: Support & Care)
        (22, "SUP-EW", "Extended Warranty", "1-year extended parts and labor replacement warranty", 5, "Support & Care", "SERVICE", None, None, 180.0, 60.0, False, None, True, True, True),
        (23, "SUB-CB", "Cloud Backup 1yr", "Automated daily cloud workstation backup subscription", 5, "Support & Care", "SUBSCRIPTION", None, None, 150.0, 40.0, True, "PLAN-CB1", True, True, True),
        (24, "SUB-EPS", "Endpoint Security", "Managed enterprise anti-malware and EDR subscription", 5, "Support & Care", "SUBSCRIPTION", None, None, 200.0, 60.0, True, "PLAN-EPS1", True, True, True),
    ]

    products = []
    for p in products_raw:
        pid, sku, pname, pdesc, cid, fam, ptype, tier, parent_id, uprice, cprice, is_sub, sub_plan, is_act, is_sell, is_srv = p
        margin_amt = round(uprice - cprice, 2)
        margin_pct = round((margin_amt / uprice) * 100, 2)
        products.append(Product(
            id=pid, sku=sku, name=pname, description=pdesc, category_id=cid,
            product_family=fam, product_type=ptype, tier=tier, parent_product_id=parent_id,
            unit_price=uprice, cost_price=cprice, margin_amount=margin_amt, margin_percent=margin_pct,
            is_subscription=is_sub, subscription_plan_id=sub_plan, is_active=is_act,
            is_sellable=is_sell, is_service=is_srv, created_at=base_time, updated_at=base_time
        ))
    session.add_all(products)
    session.flush()

    # -------------------------------------------------------------
    # 6. PRICELISTS (2 records)
    # -------------------------------------------------------------
    print("Generating 2 Pricelists...")
    pricelists_data = [
        (1, "Standard Price List", "USD", None, 0.0, base_time, base_time + timedelta(days=730), "ACTIVE"),
        (2, "Enterprise Price List", "USD", "ENTERPRISE", 5.0, base_time, base_time + timedelta(days=730), "ACTIVE"),
    ]
    pricelists = []
    for pl in pricelists_data:
        pricelists.append(Pricelist(
            id=pl[0], name=pl[1], currency=pl[2], customer_tier=pl[3],
            discount_percent=pl[4], valid_from=pl[5], valid_to=pl[6], status=pl[7],
            created_at=base_time, updated_at=base_time
        ))
    session.add_all(pricelists)
    session.flush()

    # -------------------------------------------------------------
    # 7. PROMOTIONS (10 records)
    # -------------------------------------------------------------
    print("Generating 10 Promotions...")
    promos_raw = [
        # Upsell promotions (Active)
        (1, "UPGRADE10", "Laptop Pro 16 Upgrade Incentive", "10% off Laptop Pro 16 when upgrading from Laptop Pro 14", "UPGRADE", 2, 1, 10.0, 0.0, 1, base_time, base_time + timedelta(days=730), 1, "ACTIVE"),
        (2, "UPGRADE15", "Monitor Pro 27 Display Upgrade", "15% off Monitor Pro 27 when upgrading from 24-inch", "UPGRADE", 5, 2, 15.0, 0.0, 1, base_time, base_time + timedelta(days=730), 2, "ACTIVE"),

        # Cross-sell promotions (Active)
        (3, "ACCESSORY12", "Docking Station 12% Off", "12% off Docking Station when purchased with any laptop", "PERCENTAGE", 15, 3, 12.0, 0.0, 1, base_time, base_time + timedelta(days=730), 1, "ACTIVE"),
        (4, "CARE15", "Premium Care 15% Off", "15% off Premium Care 2yr plan with workstation bundles", "PERCENTAGE", 8, 5, 15.0, 0.0, 1, base_time, base_time + timedelta(days=730), 1, "ACTIVE"),
        (5, "MOUSE5", "Wireless Mouse $5 Instant Credit", "$5 off Wireless Mouse companion peripheral", "FIXED_AMOUNT", 13, 3, 0.0, 5.0, 1, base_time, base_time + timedelta(days=730), 1, "ACTIVE"),

        # Other Active promotions
        (6, "BUNDLE_MONITOR", "Dual Display Bundle", "8% off Monitor Ultra 32 when bundling 2 or more", "BUNDLE", 6, 2, 8.0, 0.0, 2, base_time, base_time + timedelta(days=730), 2, "ACTIVE"),

        # Expired promotions
        (7, "WINTER_LAPTOP", "Winter 2024 Laptop Sale", "8% off laptops in Q4 2024", "PERCENTAGE", None, 1, 8.0, 0.0, 1, base_time - timedelta(days=90), base_time - timedelta(days=1), 3, "EXPIRED"),
        (8, "SPRING_CARE", "Spring Support Promotion 2024", "10% off Basic Care plans", "PERCENTAGE", 7, 5, 10.0, 0.0, 1, base_time - timedelta(days=180), base_time - timedelta(days=91), 2, "EXPIRED"),
        (9, "SERVICE_DISC", "Initial Deployment Discount", "5% off Professional Services in early 2024", "CATEGORY", None, 4, 5.0, 0.0, 1, base_time - timedelta(days=240), base_time - timedelta(days=120), 3, "EXPIRED"),

        # Scheduled promotion
        (10, "NET_SUMMER", "Summer 2026 Gateway Upgrade Promo", "10% off Gateway Pro upcoming promotion", "BUNDLE", 11, 6, 10.0, 0.0, 1, base_time + timedelta(days=500), base_time + timedelta(days=590), 2, "SCHEDULED"),
    ]
    promotions = []
    for pr in promos_raw:
        promotions.append(Promotion(
            id=pr[0], promotion_code=pr[1], name=pr[2], description=pr[3],
            promotion_type=pr[4], product_id=pr[5], category_id=pr[6],
            discount_percent=pr[7], discount_amount=pr[8], minimum_quantity=pr[9],
            valid_from=pr[10], valid_to=pr[11], priority=pr[12], status=pr[13],
            created_at=base_time, updated_at=base_time
        ))
    session.add_all(promotions)
    session.flush()

    # -------------------------------------------------------------
    # 8. PRODUCT RELATIONSHIPS (40 records)
    # -------------------------------------------------------------
    print("Generating 40 Product Relationships...")
    relationships_raw = [
        # UPSELLS (12 records: same-family lower-to-higher tier)
        (1, 2, "UPSELL", 0.88, 1, "Screen size and processor upgrade from 14-inch to 16-inch"),
        (1, 3, "UPSELL", 0.42, 2, "Workstation tier upgrade with dedicated graphics"),
        (2, 3, "UPSELL", 0.65, 1, "Flagship workstation upgrade with maximum memory"),
        (4, 5, "UPSELL", 0.82, 1, "QHD resolution and 27-inch screen size upgrade"),
        (4, 6, "UPSELL", 0.38, 2, "4K UHD ultra-wide premium display upgrade"),
        (5, 6, "UPSELL", 0.68, 1, "Curved 4K HDR ultra-wide upgrade"),
        (7, 8, "UPSELL", 0.78, 1, "2-year coverage with 24/7 priority support"),
        (7, 9, "UPSELL", 0.35, 2, "3-year mission-critical enterprise support SLA"),
        (8, 9, "UPSELL", 0.58, 1, "Enterprise on-site SLA upgrade"),
        (10, 11, "UPSELL", 0.75, 1, "Throughput and advanced VPN capacity upgrade"),
        (10, 12, "UPSELL", 0.32, 2, "Redundant carrier-grade appliance upgrade"),
        (11, 12, "UPSELL", 0.62, 1, "High availability enterprise cluster upgrade"),

        # CROSS-SELLS (28 records: complementary products)
        (1, 13, "CROSS_SELL", 0.92, 1, "Frequent co-purchase: Ergonomic Wireless Mouse"),
        (1, 15, "CROSS_SELL", 0.85, 1, "Frequent co-purchase: Thunderbolt 4 Docking Station"),
        (1, 16, "CROSS_SELL", 0.75, 2, "Complementary protection: Padded Laptop Bag"),
        (1, 22, "CROSS_SELL", 0.72, 2, "Hardware protection: Extended Warranty"),
        (1, 8, "CROSS_SELL", 0.68, 3, "Priority support plan: Premium Care 2yr"),
        (1, 14, "CROSS_SELL", 0.60, 3, "Productivity keyboard: Mechanical Keyboard"),
        (1, 17, "CROSS_SELL", 0.55, 4, "Remote conferencing: Ultra HD Webcam"),
        (1, 18, "CROSS_SELL", 0.52, 4, "Secondary mobile power: Power Adapter 100W"),
        (1, 19, "CROSS_SELL", 0.48, 4, "Deployment service: Onsite Setup Service"),
        (1, 23, "CROSS_SELL", 0.45, 5, "Data backup: Cloud Backup 1yr"),

        (2, 13, "CROSS_SELL", 0.90, 1, "High co-purchase: Wireless Mouse"),
        (2, 15, "CROSS_SELL", 0.88, 1, "High co-purchase: Docking Station"),
        (2, 8, "CROSS_SELL", 0.75, 2, "Recommended support: Premium Care 2yr"),
        (2, 22, "CROSS_SELL", 0.70, 2, "Extended Warranty protection"),
        (2, 14, "CROSS_SELL", 0.62, 3, "Mechanical Keyboard peripheral"),
        (2, 19, "CROSS_SELL", 0.50, 3, "Onsite Setup Service for 16-inch fleet"),

        (3, 15, "CROSS_SELL", 0.92, 1, "Essential Docking Station for workstation"),
        (3, 9, "CROSS_SELL", 0.80, 1, "Enterprise Care 3yr mission-critical protection"),
        (3, 14, "CROSS_SELL", 0.68, 2, "Mechanical Keyboard for workstation"),

        (4, 15, "CROSS_SELL", 0.70, 1, "Display docking connection: Docking Station"),
        (5, 15, "CROSS_SELL", 0.76, 1, "Display docking connection: Docking Station"),
        (5, 17, "CROSS_SELL", 0.64, 2, "Conferencing mount: Ultra HD Webcam"),
        (6, 15, "CROSS_SELL", 0.82, 1, "Thunderbolt docking for 4K display"),

        (10, 21, "CROSS_SELL", 0.85, 1, "Implementation service: Network Setup"),
        (11, 21, "CROSS_SELL", 0.88, 1, "Implementation service: Network Setup"),
        (12, 21, "CROSS_SELL", 0.94, 1, "Enterprise implementation: Network Setup"),
        (10, 20, "CROSS_SELL", 0.65, 2, "Deployment service: Data Migration"),
        (11, 20, "CROSS_SELL", 0.70, 2, "Deployment service: Data Migration"),
    ]

    relationships = []
    for rid, rel in enumerate(relationships_raw, start=1):
        relationships.append(ProductRelationship(
            id=rid, source_product_id=rel[0], target_product_id=rel[1],
            relationship_type=rel[2], strength=rel[3], priority=rel[4],
            reason=rel[5], created_at=base_time, updated_at=base_time
        ))
    session.add_all(relationships)
    session.flush()

    # -------------------------------------------------------------
    # 9. WAREHOUSES (3 records)
    # -------------------------------------------------------------
    print("Generating 3 Warehouses...")
    warehouses_data = [
        (1, "WH-A", "Mumbai Central Warehouse", "Industrial Zone, Andheri", "Mumbai", "Maharashtra", "India", "Anand Kulkarni", 15000),
        (2, "WH-B", "Bangalore Distribution Center", "Electronic City Phase 1", "Bangalore", "Karnataka", "India", "Sunita Nair", 12000),
        (3, "WH-C", "Delhi Fulfillment Center", "Okhla Industrial Area Phase 3", "Delhi", "Delhi", "India", "Rakesh Verma", 10000),
    ]
    warehouses = []
    for w in warehouses_data:
        warehouses.append(Warehouse(
            id=w[0], warehouse_code=w[1], name=w[2], location=w[3], city=w[4],
            state=w[5], country=w[6], manager_name=w[7], capacity=w[8], status="ACTIVE",
            created_at=base_time, updated_at=base_time
        ))
    session.add_all(warehouses)
    session.flush()

    # -------------------------------------------------------------
    # 10. INVENTORY STOCK (48 records: 24 products x 2 warehouses)
    # -------------------------------------------------------------
    print("Generating 48 Inventory Stock Records...")
    # Products 1 to 24 across Warehouse 1 (WH-A) and Warehouse 2 (WH-B)
    # Ensure Product 24 (Endpoint Security / physical stock simulation) is OUT_OF_STOCK (0 on hand, 0 available) in both warehouses
    # Ensure Q-1042 candidates (1, 2, 3, 8, 13, 15, 19, 22) have abundant stock available!
    stock_records = []
    sid = 1
    for p in products:
        cost = p.cost_price
        for wid in [1, 2]:
            if p.id == 24: # Specific OUT OF STOCK product test
                on_hand = 0
                reserved = 0
                available = 0
                status = "OUT_OF_STOCK"
            elif p.id in [1, 2, 3, 8, 13, 15, 19, 22]: # High stock for demo flow
                on_hand = 60 if wid == 1 else 45
                reserved = 5 if wid == 1 else 3
                available = on_hand - reserved
                status = "IN_STOCK"
            elif p.id in [10, 11, 12]:
                on_hand = 15 if wid == 1 else 10
                reserved = 2 if wid == 1 else 1
                available = on_hand - reserved
                status = "IN_STOCK"
            elif p.id == 20: # Low stock test
                on_hand = 4
                reserved = 1
                available = on_hand - reserved
                status = "LOW_STOCK"
            else:
                on_hand = 30 if wid == 1 else 25
                reserved = 4 if wid == 1 else 2
                available = on_hand - reserved
                status = "IN_STOCK"

            stock_records.append(InventoryStock(
                id=sid,
                warehouse_id=wid,
                product_id=p.id,
                quantity_on_hand=on_hand,
                quantity_reserved=reserved,
                quantity_available=available,
                reorder_level=10,
                reorder_quantity=40,
                unit_cost=cost,
                stock_status=status,
                last_restocked_at=base_time + timedelta(days=350),
                created_at=base_time,
                updated_at=base_time
            ))
            sid += 1

    session.add_all(stock_records)
    session.flush()

    # -------------------------------------------------------------
    # 11. DISCOUNT TIERS (3 records)
    # -------------------------------------------------------------
    print("Generating 3 Discount Tiers...")
    tiers_data = [
        (1, "Bronze", 0.0, 5.0, False, None, "Standard representative discretionary discount"),
        (2, "Silver", 5.0, 10.0, True, "Sales Manager", "Mid-range discount requiring Sales Manager approval"),
        (3, "Gold", 10.0, 15.0, True, "Finance/Operations", "Deep discount requiring Finance/Operations executive approval"),
    ]
    discount_tiers = []
    for dt in tiers_data:
        discount_tiers.append(DiscountTier(
            id=dt[0], name=dt[1], min_discount=dt[2], max_discount=dt[3],
            approval_required=dt[4], approval_level=dt[5], description=dt[6], status="ACTIVE",
            created_at=base_time, updated_at=base_time
        ))
    session.add_all(discount_tiers)
    session.flush()

    # -------------------------------------------------------------
    # 12. DISCOUNT RULES (8 records)
    # -------------------------------------------------------------
    print("Generating 8 Discount Rules...")
    rules_data = [
        (1, "Hardware Standard Cap", 1, None, None, 15.0, False, None, "LOW", "Standard hardware discount limit up to 15%"),
        (2, "Monitors Standard Cap", 2, None, None, 15.0, False, None, "LOW", "Standard monitors discount ceiling"),
        (3, "Services Maximum Cap", 4, None, None, 10.0, True, "Sales Manager", "HIGH", "Services discount ceiling is 10%. Higher discounts require manager approval"),
        (4, "Support Plans Cap", 5, None, None, 12.0, True, "Sales Manager", "MEDIUM", "Support plans discount limit is 12%"),
        (5, "Networking Hardware Cap", 6, None, None, 12.0, False, None, "LOW", "Standard networking devices discount limit"),
        (6, "Enterprise Tier Privilege", None, None, "ENTERPRISE", 18.0, True, "Sales Manager", "MEDIUM", "Enterprise accounts can receive up to 18% with manager sign-off"),
        (7, "Accessories Clearance Allowance", 3, None, None, 20.0, False, None, "LOW", "High-margin accessories permitted up to 20% discount"),
        (8, "Deep Discount Risk Floor", None, None, None, 20.0, True, "Finance/Operations", "CRITICAL", "Discounts over 20% strictly require Finance/Operations approval"),
    ]
    discount_rules = []
    for dr in rules_data:
        discount_rules.append(DiscountRule(
            id=dr[0], name=dr[1], category_id=dr[2], product_id=dr[3], customer_tier=dr[4],
            max_discount_percent=dr[5], approval_required=dr[6], approval_role=dr[7],
            risk_level=dr[8], rule_description=dr[9], status="ACTIVE",
            created_at=base_time, updated_at=base_time
        ))
    session.add_all(discount_rules)
    session.flush()

    # -------------------------------------------------------------
    # 13. HISTORICAL ORDERS (50 records) & 14. HISTORICAL ORDER LINES (80 records)
    # -------------------------------------------------------------
    print("Generating 50 Historical Orders and 80 Lines with Realistic Co-Purchase & Upgrade Patterns...")
    # Patterns:
    # 20 orders have Laptop Pro 14 (Prod 1)
    # Of those 20:
    # - 13 orders also buy Wireless Mouse (Prod 13) -> 13/20 = 65% co-purchase rate!
    # - 9 orders also buy Docking Station (Prod 15) -> 9/20 = 45% co-purchase rate!
    # - 6 orders also buy Extended Warranty (Prod 22) -> 6/20 = 30% co-purchase rate!
    # - 5 orders also buy Premium Care 2yr (Prod 8) -> 5/20 = 25% co-purchase rate!
    # Upgrade sequence over time:
    # Customers 1, 2, 3, 5, 7, 8, 12, 14 bought Laptop Pro 14 in Jan/Feb/Mar 2025.
    # Customers 1, 2, 5 (3 out of 8 = 37.5%) later bought Laptop Pro 16 in Aug/Sep/Oct 2025 -> ~35-40% upgrade rate!
    # Customer 3 (1 out of 8 = 12.5%) later bought Laptop Pro 18 in Nov 2025 -> ~12.5-15% upgrade rate!

    hist_orders = []
    hist_lines = []
    hl_id = 1

    # Define the 50 orders
    # We will distribute 80 lines across these 50 orders (average 1.6 lines per order: 30 multi-line orders, 20 single-line orders)
    order_blueprints = []

    # Cluster A: 20 orders involving Laptop Pro 14 (Orders 1 to 20)
    # 20 base lines + 28 co-purchase lines = 48 lines across 20 orders
    for i in range(1, 21):
        cust_id = ((i - 1) % 8) + 1  # 8 unique customers (1 to 8)
        rep_id = 1 if i % 2 == 1 else 2
        odate = base_time + timedelta(days=i * 6)
        items = [(1, 2 if i == 1 else 1, 0.0)] # Laptop Pro 14

        # Add co-purchases to match target frequencies:
        if i in [1, 2, 3, 5, 6, 8, 9, 11, 13, 14, 16, 17, 19]: # 13 orders -> 13/20 = 65%
            items.append((13, 1, 0.0)) # Wireless Mouse
        if i in [1, 3, 4, 7, 8, 10, 12, 15]: # 8 orders -> 8/20 = 40%
            items.append((15, 1, 0.0)) # Docking Station
        if i in [1, 4, 9, 14]: # 4 orders -> 4/20 = 20%
            items.append((22, 1, 0.0)) # Extended Warranty
        if i in [2, 7, 11]: # 3 orders -> 3/20 = 15%
            items.append((8, 1, 0.0)) # Premium Care 2yr

        order_blueprints.append((i, cust_id, rep_id, odate, items))

    # Cluster B: Upgrade Orders (Orders 21 to 25 = 5 orders, 5 lines)
    # Customers 1, 2, 5 upgrading to Laptop Pro 16 (3/8 = 37.5%); Customer 3 upgrading to Laptop Pro 18 (1/8 = 12.5%)
    upgrade_items = [
        (21, 1, 1, base_time + timedelta(days=240), [(2, 2, 0.0)]), # Customer 1 (Acme) upgrades to Laptop Pro 16!
        (22, 2, 2, base_time + timedelta(days=250), [(2, 1, 0.0)]), # Customer 2 upgrades to Laptop Pro 16!
        (23, 5, 1, base_time + timedelta(days=265), [(2, 1, 0.0)]), # Customer 5 upgrades to Laptop Pro 16!
        (24, 3, 1, base_time + timedelta(days=280), [(3, 1, 0.0)]), # Customer 3 upgrades to Laptop Pro 18!
        (25, 7, 2, base_time + timedelta(days=290), [(5, 2, 0.0)]), # Customer 7 upgrades monitor to Pro 27
    ]
    order_blueprints.extend(upgrade_items)

    # Total lines so far: 48 (Cluster A) + 5 (Cluster B) = 53 lines across 25 orders.
    # Total target: 80 lines across 50 orders.
    # Need 27 lines across the remaining 25 orders (Orders 26 to 50).
    # 23 orders get 1 line (23 lines) + 2 orders get 2 lines (4 lines) = 27 lines.
    chosen_pids = [4, 10, 11, 14, 16, 17, 18, 21]
    for i in range(26, 51):
        cust_id = ((i - 1) % 35) + 1
        rep_id = 1 if i % 2 == 1 else 2
        odate = base_time + timedelta(days=i * 7)
        num_items = 2 if i in [26, 27] else 1

        p1 = chosen_pids[(i - 26) % len(chosen_pids)]
        items = [(p1, 1, 0.0)]
        if num_items == 2:
            p2 = chosen_pids[(i - 25) % len(chosen_pids)]
            items.append((p2, 1, 0.0))

        order_blueprints.append((i, cust_id, rep_id, odate, items))

    # Now build HistoricalOrder and HistoricalOrderLine instances
    prod_map = {p.id: p for p in products}

    for bp in order_blueprints:
        oid, cid, rid, odate, items = bp
        order_subtotal = 0.0
        order_cost = 0.0
        order_disc = 0.0

        for it in items:
            pid, qty, disc_pct = it
            prod = prod_map[pid]
            unit_price = prod.unit_price
            unit_cost = prod.cost_price
            disc_amt = round(qty * unit_price * (disc_pct / 100.0), 2)
            rev = round(qty * unit_price - disc_amt, 2)
            cost = round(qty * unit_cost, 2)
            margin = round(rev - cost, 2)
            margin_pct = round((margin / rev) * 100, 2) if rev > 0 else 0.0

            hist_lines.append(HistoricalOrderLine(
                id=hl_id,
                historical_order_id=oid,
                product_id=pid,
                quantity=qty,
                unit_price=unit_price,
                discount_percent=disc_pct,
                discount_amount=disc_amt,
                unit_cost=unit_cost,
                line_revenue=rev,
                line_cost=cost,
                line_margin=margin,
                line_margin_percent=margin_pct,
                created_at=odate,
                updated_at=odate
            ))
            hl_id += 1
            order_subtotal += (qty * unit_price)
            order_disc += disc_amt
            order_cost += cost

        tax = round((order_subtotal - order_disc) * 0.08, 2)
        total = round((order_subtotal - order_disc) + tax, 2)
        status = "CANCELLED" if oid in [28, 44] else "COMPLETED"

        hist_orders.append(HistoricalOrder(
            id=oid,
            order_number=f"ORD-{oid:04d}",
            customer_id=cid,
            sales_rep_id=rid,
            order_date=odate,
            status=status,
            currency="USD",
            subtotal=round(order_subtotal, 2),
            discount_amount=round(order_disc, 2),
            tax_amount=tax,
            total_amount=total,
            payment_status="PAID" if status == "COMPLETED" else "CANCELLED",
            created_at=odate,
            updated_at=odate
        ))

    session.add_all(hist_orders)
    session.add_all(hist_lines)
    session.flush()

    # -------------------------------------------------------------
    # 15. QUOTATIONS (60 records) & 16. QUOTATION LINES (120 records)
    # -------------------------------------------------------------
    print("Generating 60 Quotations and 120 Quotation Lines (Featuring Q-1042)...")
    quotations = []
    quotation_lines = []
    ql_id = 1

    # Demo Quote Q-1042: Quotation ID 1
    # Customer = 1 (Acme Corp), Sales Rep = 1 (Aarav Sharma)
    # Exact lines from specification:
    # 1) Laptop Pro 14: qty=2, unit_price=1200.0, disc=12%, limit=15%, status=OK
    # 2) Onsite Setup Service: qty=1, unit_price=450.0, disc=18%, limit=10%, status=OVER_LIMIT
    # 3) Extended Warranty: qty=1, unit_price=180.0, disc=10%, limit=15%, status=OK

    q1042_lines_def = [
        (1, 2, 1200.0, 12.0, 15.0, "OK"),
        (19, 1, 450.0, 18.0, 10.0, "OVER_LIMIT"),
        (22, 1, 180.0, 10.0, 15.0, "OK"),
    ]

    # We need 60 quotations and 120 lines total.
    # Q-1042 has 3 lines.
    # The remaining 59 quotations will have 117 lines.
    # 58 quotations with 2 lines (116 lines) + 1 quotation with 1 line (1 line) = 117 lines!
    # Total lines = 3 + 117 = 120 lines exactly!

    quote_plans = []
    # Q-1042
    quote_plans.append((1, "Q-1042", 1, 1, base_time + timedelta(days=380), "PENDING_APPROVAL", True, "PENDING", 64.0, q1042_lines_def))

    statuses_cycle = ["DRAFT", "PENDING_APPROVAL", "APPROVED", "SUBMITTED", "SENT", "ACCEPTED", "EXPIRED", "CANCELLED", "REJECTED"]

    # Pre-select some quotations to have discount violations to satisfy requirement:
    # "At least 10 quotation lines should be over their individual discount limit."
    # "At least 5 quotations should require approval."
    over_limit_quotes = [1, 2, 5, 8, 12, 18, 25, 33, 41, 47, 53, 58]

    for qid in range(2, 61):
        # Ensure Q-1042 is unique to Quote 1
        num_suffix = 1000 + qid if (1000 + qid) != 1042 else 1099
        qnum = f"Q-{num_suffix}"
        cid = ((qid - 1) % 40) + 1
        rid = 1 if qid % 2 == 1 else 2
        qdate = base_time + timedelta(days=200 + qid * 3)
        st = "PENDING_APPROVAL" if qid in over_limit_quotes[:5] else statuses_cycle[(qid - 2) % len(statuses_cycle)]
        app_req = True if qid in over_limit_quotes[:5] else False
        app_st = "PENDING" if app_req else ("APPROVED" if st == "APPROVED" else None)
        health = 60.0 if app_req else float(random.randint(70, 95))

        lines_count = 1 if qid == 60 else 2
        lines_def = []

        # Product selection
        p1 = ((qid * 2) % 24) + 1
        p2 = (((qid * 2) + 1) % 24) + 1

        # Check if this quote should have an over-limit line
        if qid in over_limit_quotes:
            disc1 = 22.0
            limit1 = 15.0
            stat1 = "OVER_LIMIT"
        else:
            disc1 = 5.0
            limit1 = 15.0
            stat1 = "OK"

        prod1 = prod_map[p1]
        lines_def.append((p1, 1, prod1.unit_price, disc1, limit1, stat1))

        if lines_count == 2:
            prod2 = prod_map[p2]
            lines_def.append((p2, 1, prod2.unit_price, 5.0, 15.0, "OK"))

        quote_plans.append((qid, qnum, cid, rid, qdate, st, app_req, app_st, health, lines_def))

    # Process all quotations and lines
    for qplan in quote_plans:
        qid, qnum, cid, rid, qdate, st, app_req, app_st, health, lines_def = qplan
        q_subtotal = 0.0
        q_disc = 0.0
        q_cost = 0.0

        for ld in lines_def:
            pid, qty, uprice, disc_pct, limit_pct, dstat = ld
            prod = prod_map[pid]
            ucost = prod.cost_price
            disc_amt = round(qty * uprice * (disc_pct / 100.0), 2)
            l_sub = round(qty * uprice - disc_amt, 2)
            l_cost = round(qty * ucost, 2)
            l_margin = round(l_sub - l_cost, 2)
            l_margin_pct = round((l_margin / l_sub) * 100, 2) if l_sub > 0 else 0.0

            quotation_lines.append(QuotationLine(
                id=ql_id,
                quotation_id=qid,
                product_id=pid,
                quantity=qty,
                unit_price=uprice,
                discount_percent=disc_pct,
                discount_amount=disc_amt,
                line_subtotal=l_sub,
                unit_cost=ucost,
                line_cost=l_cost,
                line_margin=l_margin,
                line_margin_percent=l_margin_pct,
                discount_limit_percent=limit_pct,
                discount_status=dstat,
                created_at=qdate,
                updated_at=qdate
            ))
            ql_id += 1
            q_subtotal += (qty * uprice)
            q_disc += disc_amt
            q_cost += l_cost

        tax = round((q_subtotal - q_disc) * 0.08, 2)
        total = round((q_subtotal - q_disc) + tax, 2)
        gross_margin = round((q_subtotal - q_disc) - q_cost, 2)
        net_rev = q_subtotal - q_disc
        margin_pct = round((gross_margin / net_rev) * 100, 2) if net_rev > 0 else 0.0
        overall_disc_pct = round((q_disc / q_subtotal) * 100, 2) if q_subtotal > 0 else 0.0

        quotations.append(Quotation(
            id=qid,
            quote_number=qnum,
            customer_id=cid,
            sales_rep_id=rid,
            price_list_id=1,
            quote_date=qdate,
            valid_until=qdate + timedelta(days=30),
            status=st,
            currency="USD",
            subtotal=round(q_subtotal, 2),
            discount_amount=round(q_disc, 2),
            tax_amount=tax,
            total_amount=total,
            total_cost=round(q_cost, 2),
            gross_margin=gross_margin,
            margin_percent=margin_pct,
            discount_percent=overall_disc_pct,
            approval_required=app_req,
            approval_status=app_st,
            deal_health_score=health,
            customer_notes=f"Standard quotation terms for {qnum}.",
            internal_notes="Review discount thresholds and margins." if app_req else "Standard deal.",
            created_at=qdate,
            updated_at=qdate
        ))

    session.add_all(quotations)
    session.add_all(quotation_lines)
    session.flush()

    # -------------------------------------------------------------
    # 17. APPROVALS (25 records) & 18. APPROVAL STEPS (40 records)
    # -------------------------------------------------------------
    print("Generating 25 Approvals and 40 Approval Steps...")
    approvals = []
    approval_steps = []
    ast_id = 1

    # Approval 1: Specifically for Q-1042
    # Quotation 1 (Q-1042)
    # Chain: Sales Rep (1) -> Sales Manager (3) -> Finance/Operations (5)
    approvals.append(Approval(
        id=1,
        approval_number="APP-1042",
        quotation_id=1,
        requested_by=1,
        assigned_to=3,
        approval_type="DISCOUNT",
        reason="Onsite Setup Service discount 18% exceeds category ceiling of 10%",
        risk_score=68.0,
        status="PENDING",
        requested_at=base_time + timedelta(days=381),
        resolved_at=None,
        decision_comment=None,
        created_at=base_time + timedelta(days=381),
        updated_at=base_time + timedelta(days=381)
    ))
    approval_steps.append(ApprovalStep(
        id=ast_id, approval_id=1, step_number=1, approver_id=3, approver_role="Sales Manager",
        threshold_type="DISCOUNT_PERCENT", threshold_value=10.0, status="PENDING",
        actioned_at=None, comment="Pending Sales Manager review for services discount.",
        created_at=base_time + timedelta(days=381), updated_at=base_time + timedelta(days=381)
    ))
    ast_id += 1
    approval_steps.append(ApprovalStep(
        id=ast_id, approval_id=1, step_number=2, approver_id=5, approver_role="Finance/Operations",
        threshold_type="DISCOUNT_PERCENT", threshold_value=15.0, status="PENDING",
        actioned_at=None, comment="Second level approval required if manager approves.",
        created_at=base_time + timedelta(days=381), updated_at=base_time + timedelta(days=381)
    ))
    ast_id += 1

    # Remaining 24 approvals (total 25 approvals)
    # We need 40 steps total. Approval 1 has 2 steps.
    # So 24 approvals need 38 steps total:
    # 14 approvals with 2 steps (28 steps) + 10 approvals with 1 step (10 steps) = 38 steps!
    # Total steps = 2 + 38 = 40 steps!

    app_types = ["DISCOUNT", "MARGIN_RISK", "DEAL_RISK", "NEGOTIATION_CHANGE"]
    app_statuses = ["APPROVED", "PENDING", "REJECTED", "CANCELLED"]

    for aid in range(2, 26):
        qid = aid # Link to quotations 2 to 25
        atype = app_types[(aid - 2) % len(app_types)]
        astat = app_statuses[(aid - 2) % len(app_statuses)]
        req_at = base_time + timedelta(days=300 + aid * 3)
        res_at = req_at + timedelta(hours=8) if astat in ["APPROVED", "REJECTED"] else None
        comment = "Approved within acceptable risk tolerance." if astat == "APPROVED" else ("Discount rejected due to excessive margin compression." if astat == "REJECTED" else None)

        approvals.append(Approval(
            id=aid,
            approval_number=f"APP-{1000 + aid}",
            quotation_id=qid,
            requested_by=1 if aid % 2 == 1 else 2,
            assigned_to=3 if aid % 3 != 0 else 5,
            approval_type=atype,
            reason=f"Approval required for {atype.lower().replace('_', ' ')} on Quote Q-{1000 + qid}.",
            risk_score=float(random.randint(45, 80)),
            status=astat,
            requested_at=req_at,
            resolved_at=res_at,
            decision_comment=comment,
            created_at=req_at,
            updated_at=req_at
        ))

        # Steps allocation: 14 approvals get 2 steps (aid from 2 to 15), 10 approvals get 1 step (aid from 16 to 25)
        num_steps = 2 if aid <= 15 else 1

        for snum in range(1, num_steps + 1):
            role = "Sales Manager" if snum == 1 else "Finance/Operations"
            approver = 3 if snum == 1 else 5
            step_stat = astat if (snum == 1 or astat != "REJECTED") else "SKIPPED"
            approval_steps.append(ApprovalStep(
                id=ast_id,
                approval_id=aid,
                step_number=snum,
                approver_id=approver,
                approver_role=role,
                threshold_type="DISCOUNT_PERCENT",
                threshold_value=10.0 if snum == 1 else 15.0,
                status=step_stat,
                actioned_at=res_at if step_stat in ["APPROVED", "REJECTED"] else None,
                comment=f"Step {snum} actioned by {role}." if step_stat != "PENDING" else "Awaiting action.",
                created_at=req_at,
                updated_at=req_at
            ))
            ast_id += 1

    session.add_all(approvals)
    session.add_all(approval_steps)
    session.flush()

    # -------------------------------------------------------------
    # 19. FULFILLMENT ORDERS (35 records) & 20. FULFILLMENT LINES (60 records)
    # -------------------------------------------------------------
    print("Generating 35 Fulfillment Orders and 60 Fulfillment Lines...")
    # Requirements:
    # - At least 5 orders demonstrate multi-warehouse allocation.
    # - At least 3 orders demonstrate partial fulfillment / backorders.
    # - Rules: fulfilled_quantity <= allocated_quantity <= ordered_quantity
    # - backordered_quantity = ordered_quantity - fulfilled_quantity
    # Total 35 orders, 60 lines.
    # Distribution: 25 orders with 2 lines (50 lines) + 10 orders with 1 line (10 lines) = 60 lines!

    fulfillment_orders = []
    fulfillment_lines = []
    fl_id = 1

    fo_statuses = ["DELIVERED", "SHIPPED", "PARTIALLY_FULFILLED", "ALLOCATED", "PENDING", "BACKORDERED"]
    multi_wh_orders = [1, 2, 3, 4, 5, 6, 7] # 7 multi-warehouse orders
    partial_orders = [3, 5, 8, 12] # 4 partial fulfillment / backorder orders

    for foid in range(1, 36):
        qid = ((foid - 1) % 40) + 1
        cid = ((foid - 1) % 40) + 1
        fdate = base_time + timedelta(days=250 + foid * 3)

        if foid in partial_orders:
            st = "PARTIALLY_FULFILLED"
            strat = "MULTI_WAREHOUSE" if foid in multi_wh_orders else "BACKORDER"
        elif foid in multi_wh_orders:
            st = "SHIPPED"
            strat = "MULTI_WAREHOUSE"
        else:
            st = fo_statuses[(foid - 1) % len(fo_statuses)]
            strat = "SINGLE_WAREHOUSE"

        shipped = fdate + timedelta(days=2) if st in ["SHIPPED", "DELIVERED", "PARTIALLY_FULFILLED"] else None
        delivered = fdate + timedelta(days=5) if st == "DELIVERED" else None
        track = f"TRK-{foid:04d}-IND" if shipped else None

        fulfillment_orders.append(FulfillmentOrder(
            id=foid,
            fulfillment_number=f"FO-{foid:04d}",
            quotation_id=qid,
            customer_id=cid,
            status=st,
            warehouse_strategy=strat,
            shipping_address=f"Distribution Hub {cid}, Industrial Park, City",
            requested_date=fdate,
            promised_date=fdate + timedelta(days=7),
            shipped_date=shipped,
            delivered_date=delivered,
            tracking_number=track,
            created_at=fdate,
            updated_at=fdate
        ))

        # Lines allocation: 25 orders get 2 lines, 10 get 1 line
        num_lines = 2 if foid <= 25 else 1

        for lidx in range(1, num_lines + 1):
            prod_id = ((foid + lidx) % 24) + 1
            prod = prod_map[prod_id]
            qline_id = ((foid + lidx) % 120) + 1
            ordered = 10 if foid in partial_orders else 5

            # Multi-warehouse allocation test:
            if strat == "MULTI_WAREHOUSE" and lidx == 2:
                wh_id = 2 # Allocated from Warehouse B
            else:
                wh_id = 1 # Allocated from Warehouse A

            if foid in partial_orders:
                allocated = 7
                fulfilled = 7
                backordered = ordered - fulfilled # 3 backordered!
                line_st = "PARTIALLY_FULFILLED"
            elif st in ["DELIVERED", "SHIPPED"]:
                allocated = ordered
                fulfilled = ordered
                backordered = ordered - fulfilled # 0 backordered
                line_st = "FULFILLED"
            else:
                allocated = ordered
                fulfilled = 0
                backordered = ordered - fulfilled # ordered backordered
                line_st = "ALLOCATED"

            fulfillment_lines.append(FulfillmentLine(
                id=fl_id,
                fulfillment_order_id=foid,
                quotation_line_id=qline_id,
                product_id=prod_id,
                warehouse_id=wh_id,
                ordered_quantity=ordered,
                allocated_quantity=allocated,
                fulfilled_quantity=fulfilled,
                backordered_quantity=backordered,
                status=line_st,
                unit_price=prod.unit_price,
                unit_cost=prod.cost_price,
                created_at=fdate,
                updated_at=fdate
            ))
            fl_id += 1

    session.add_all(fulfillment_orders)
    session.add_all(fulfillment_lines)
    session.flush()

    # -------------------------------------------------------------
    # 21. SUBSCRIPTIONS (15 records) & 22. SUBSCRIPTION LINES (25 records)
    # -------------------------------------------------------------
    print("Generating 15 Subscriptions and 25 Subscription Lines...")
    # 15 subscriptions. 25 lines total.
    # 10 subscriptions with 2 lines (20 lines) + 5 subscriptions with 1 line (5 lines) = 25 lines!
    subscriptions = []
    subscription_lines = []
    subl_id = 1

    sub_plans = [
        (7, "Basic Care Plan", "MONTHLY", 120.0),
        (8, "Premium Support Suite", "YEARLY", 250.0),
        (9, "Enterprise Care SLA", "YEARLY", 450.0),
        (23, "Workstation Cloud Backup", "MONTHLY", 150.0),
        (24, "Managed Endpoint Security", "QUARTERLY", 200.0)
    ]
    sub_statuses = ["ACTIVE", "ACTIVE", "ACTIVE", "TRIAL", "PAUSED", "CANCELLED", "EXPIRED"]

    for sub_id in range(1, 16):
        cid = ((sub_id - 1) % 40) + 1
        qid = sub_id
        plan_info = sub_plans[(sub_id - 1) % len(sub_plans)]
        pid, pname, freq, price = plan_info
        s_date = base_time + timedelta(days=100 + sub_id * 15)
        e_date = s_date + timedelta(days=365)
        st = sub_statuses[(sub_id - 1) % len(sub_statuses)]
        next_bill = s_date + timedelta(days=30) if st in ["ACTIVE", "TRIAL"] else None

        num_lines = 2 if sub_id <= 10 else 1
        recurring_total = 0.0

        for lidx in range(1, num_lines + 1):
            line_pid = pid if lidx == 1 else (23 if pid != 23 else 24)
            line_prod = prod_map[line_pid]
            line_price = line_prod.unit_price
            line_disc = 10.0 if sub_id % 3 == 0 else 0.0
            line_tot = round(1 * line_price * (1.0 - line_disc / 100.0), 2)
            recurring_total += line_tot

            subscription_lines.append(SubscriptionLine(
                id=subl_id,
                subscription_id=sub_id,
                product_id=line_pid,
                description=f"{line_prod.name} Recurring Subscription",
                quantity=1,
                unit_price=line_price,
                discount_percent=line_disc,
                line_total=line_tot,
                billing_frequency=freq,
                start_date=s_date,
                end_date=e_date,
                created_at=s_date,
                updated_at=s_date
            ))
            subl_id += 1

        subscriptions.append(Subscription(
            id=sub_id,
            subscription_number=f"SUB-{sub_id:04d}",
            customer_id=cid,
            quotation_id=qid,
            product_id=pid,
            plan_name=pname,
            start_date=s_date,
            end_date=e_date,
            billing_frequency=freq,
            quantity=1,
            unit_price=price,
            discount_percent=10.0 if sub_id % 3 == 0 else 0.0,
            recurring_amount=round(recurring_total, 2),
            status=st,
            next_billing_date=next_bill,
            auto_renew=True,
            created_at=s_date,
            updated_at=s_date
        ))

    session.add_all(subscriptions)
    session.add_all(subscription_lines)
    session.flush()

    # -------------------------------------------------------------
    # 23. INVOICES (40 records) & 24. INVOICE LINES (60 records)
    # -------------------------------------------------------------
    print("Generating 40 Invoices and 60 Invoice Lines...")
    # Exact consistency: invoice totals = sum of invoice lines
    # 40 invoices, 60 lines.
    # 20 invoices with 2 lines (40 lines) + 20 invoices with 1 line (20 lines) = 60 lines!
    invoices = []
    invoice_lines = []
    invl_id = 1

    inv_types = ["CUSTOMER_INVOICE", "CUSTOMER_INVOICE", "CUSTOMER_INVOICE", "SUBSCRIPTION_INVOICE", "CREDIT_NOTE"]
    inv_statuses = ["PAID", "PAID", "PARTIALLY_PAID", "POSTED", "SENT", "OVERDUE", "DRAFT"]

    invoice_data_plans = []

    for inv_id in range(1, 41):
        cid = ((inv_id - 1) % 40) + 1
        qid = inv_id if inv_id <= 30 else None
        sub_id = (inv_id - 30) if inv_id > 30 else None
        itype = inv_types[(inv_id - 1) % len(inv_types)]
        idate = base_time + timedelta(days=220 + inv_id * 4)
        due_date = idate + timedelta(days=30)
        istat = inv_statuses[(inv_id - 1) % len(inv_statuses)]

        num_lines = 2 if inv_id <= 20 else 1
        lines_calc = []

        for lidx in range(1, num_lines + 1):
            pid = ((inv_id * 2 + lidx) % 24) + 1
            prod = prod_map[pid]
            qty = 2 if lidx == 1 else 1
            uprice = prod.unit_price
            disc_pct = 5.0 if inv_id % 4 == 0 else 0.0
            disc_amt = round(qty * uprice * (disc_pct / 100.0), 2)
            tax_pct = 8.0
            subtot = round(qty * uprice - disc_amt, 2)
            tot = round(subtot * (1.0 + tax_pct / 100.0), 2)

            lines_calc.append((pid, prod.name, qty, uprice, disc_pct, disc_amt, tax_pct, subtot, tot))

        invoice_data_plans.append((inv_id, cid, qid, sub_id, itype, idate, due_date, istat, lines_calc))

    for idp in invoice_data_plans:
        inv_id, cid, qid, sub_id, itype, idate, due_date, istat, lines_calc = idp
        inv_sub = 0.0
        inv_disc = 0.0
        inv_tot = 0.0

        for lc in lines_calc:
            pid, pname, qty, uprice, disc_pct, disc_amt, tax_pct, subtot, tot = lc
            invoice_lines.append(InvoiceLine(
                id=invl_id,
                invoice_id=inv_id,
                product_id=pid,
                description=f"{pname} Billing Line",
                quantity=qty,
                unit_price=uprice,
                discount_percent=disc_pct,
                discount_amount=disc_amt,
                tax_percent=tax_pct,
                line_subtotal=subtot,
                line_total=tot,
                created_at=idate,
                updated_at=idate
            ))
            invl_id += 1
            inv_sub += subtot
            inv_disc += disc_amt
            inv_tot += tot

        inv_tax = round(inv_tot - inv_sub, 2)
        inv_tot = round(inv_tot, 2)

        # Payment determination
        if istat == "PAID":
            amt_paid = inv_tot
            amt_due = 0.0
            pay_stat = "PAID"
        elif istat == "PARTIALLY_PAID":
            amt_paid = round(inv_tot * 0.5, 2)
            amt_due = round(inv_tot - amt_paid, 2)
            pay_stat = "PARTIAL"
        elif istat in ["OVERDUE", "POSTED", "SENT", "DRAFT"]:
            amt_paid = 0.0
            amt_due = inv_tot
            pay_stat = "UNPAID"

        invoices.append(Invoice(
            id=inv_id,
            invoice_number=f"INV-{inv_id:04d}",
            customer_id=cid,
            quotation_id=qid,
            subscription_id=sub_id,
            invoice_type=itype,
            invoice_date=idate,
            due_date=due_date,
            subtotal=round(inv_sub, 2),
            discount_amount=round(inv_disc, 2),
            tax_amount=inv_tax,
            total_amount=inv_tot,
            amount_paid=amt_paid,
            amount_due=amt_due,
            currency="USD",
            status=istat,
            payment_status=pay_stat,
            created_at=idate,
            updated_at=idate
        ))

    session.add_all(invoices)
    session.add_all(invoice_lines)
    session.flush()

    # -------------------------------------------------------------
    # 25. PAYMENTS (35 records)
    # -------------------------------------------------------------
    print("Generating 35 Payments Matching Invoice Totals...")
    # Exactly match amount_paid on invoices
    # We have invoices that are PAID (approx 12 invoices) and PARTIALLY_PAID (approx 6 invoices)
    payments = []
    pay_methods = ["BANK_TRANSFER", "CARD", "UPI", "OTHER"]

    # We will generate payments for invoices:
    # 25 fully paid invoices (or 1st payment of partially paid) + 10 secondary payments / failed payments = 35 payments!
    pay_id = 1
    inv_map = {inv.id: inv for inv in invoices}

    for inv in invoices:
        if pay_id > 35:
            break
        if inv.amount_paid > 0:
            if inv.payment_status == "PARTIAL":
                # Partial payment
                payments.append(Payment(
                    id=pay_id,
                    payment_number=f"PAY-{pay_id:04d}",
                    invoice_id=inv.id,
                    customer_id=inv.customer_id,
                    payment_date=inv.invoice_date + timedelta(days=5),
                    amount=inv.amount_paid,
                    currency="USD",
                    payment_method=pay_methods[(pay_id - 1) % len(pay_methods)],
                    transaction_reference=f"TXN-PART-{pay_id:05d}",
                    status="SUCCESS",
                    notes="Partial installment payment received.",
                    created_at=inv.invoice_date + timedelta(days=5),
                    updated_at=inv.invoice_date + timedelta(days=5)
                ))
                pay_id += 1
            else:
                # Fully paid
                payments.append(Payment(
                    id=pay_id,
                    payment_number=f"PAY-{pay_id:04d}",
                    invoice_id=inv.id,
                    customer_id=inv.customer_id,
                    payment_date=inv.invoice_date + timedelta(days=4),
                    amount=inv.amount_paid,
                    currency="USD",
                    payment_method=pay_methods[(pay_id - 1) % len(pay_methods)],
                    transaction_reference=f"TXN-FULL-{pay_id:05d}",
                    status="SUCCESS",
                    notes="Full payment settled via wire transfer.",
                    created_at=inv.invoice_date + timedelta(days=4),
                    updated_at=inv.invoice_date + timedelta(days=4)
                ))
                pay_id += 1

    # If pay_id <= 35, fill remaining payments with pending or failed payments on unpaid/overdue invoices (amount_paid remains 0 for failed!)
    while pay_id <= 35:
        target_inv = invoices[(pay_id * 3) % len(invoices)]
        payments.append(Payment(
            id=pay_id,
            payment_number=f"PAY-{pay_id:04d}",
            invoice_id=target_inv.id,
            customer_id=target_inv.customer_id,
            payment_date=target_inv.due_date + timedelta(days=2),
            amount=round(target_inv.amount_due * 0.2, 2) if target_inv.amount_due > 0 else 100.0,
            currency="USD",
            payment_method="CARD",
            transaction_reference=f"TXN-FAIL-{pay_id:05d}",
            status="FAILED",
            notes="Credit card processing declined by bank.",
            created_at=target_inv.due_date + timedelta(days=2),
            updated_at=target_inv.due_date + timedelta(days=2)
        ))
        pay_id += 1

    session.add_all(payments)
    session.flush()

    # -------------------------------------------------------------
    # 26. NEGOTIATIONS (15 records) & 27. NEGOTIATION MESSAGES (25 records)
    # -------------------------------------------------------------
    print("Generating 15 Negotiations and 25 Negotiation Messages...")
    # At least 3 negotiations request a discount higher than the allowed threshold
    negotiations = []
    negotiation_messages = []
    nmsg_id = 1

    neg_statuses = ["OPEN", "COUNTERED", "ACCEPTED", "REJECTED", "EXPIRED"]

    for nid in range(1, 16):
        qid = nid
        quote = quotations[qid - 1]
        cid = quote.customer_id
        rep_id = quote.sales_rep_id
        curr_disc = quote.discount_percent
        # Negotiation 1, 2, 3 have aggressive requests exceeding 15% threshold:
        req_disc = 22.0 if nid in [1, 2, 3] else (curr_disc + 5.0)
        curr_tot = quote.total_amount
        req_tot = round(quote.subtotal * (1.0 - req_disc / 100.0) * 1.08, 2)
        nst = "COUNTERED" if nid == 1 else neg_statuses[(nid - 1) % len(neg_statuses)]

        negotiations.append(Negotiation(
            id=nid,
            negotiation_number=f"NEG-{nid:04d}",
            quotation_id=qid,
            customer_id=cid,
            initiated_by=6 if nid == 1 else (6 if cid == 1 else 7),
            current_discount_percent=round(curr_disc, 2),
            requested_discount_percent=round(req_disc, 2),
            current_total=curr_tot,
            requested_total=req_tot,
            customer_message=f"We would like an additional discount of {req_disc}% for our volume rollout.",
            sales_response="We cannot offer 22% on hardware, but we can include Premium Care at a special rate." if nid in [1, 2, 3] else "We have reviewed your request.",
            status=nst,
            risk_score=75.0 if nid in [1, 2, 3] else 45.0,
            created_at=quote.created_at + timedelta(days=2),
            updated_at=quote.created_at + timedelta(days=2)
        ))

    # 25 messages across the 15 negotiations:
    # 5 negotiations with 3 messages (15 messages) + 10 negotiations with 1 message (10 messages) = 25 messages!
    for nid in range(1, 16):
        neg = negotiations[nid - 1]
        num_msgs = 3 if nid <= 5 else 1

        # Customer initial message
        negotiation_messages.append(NegotiationMessage(
            id=nmsg_id,
            negotiation_id=nid,
            sender_type="CUSTOMER",
            sender_id=neg.initiated_by,
            message=f"We would like a {neg.requested_discount_percent}% discount for this deployment.",
            requested_discount_percent=neg.requested_discount_percent,
            proposed_discount_percent=None,
            timestamp=neg.created_at,
            created_at=neg.created_at,
            updated_at=neg.created_at
        ))
        nmsg_id += 1

        if num_msgs == 3:
            # System warning message
            negotiation_messages.append(NegotiationMessage(
                id=nmsg_id,
                negotiation_id=nid,
                sender_type="SYSTEM",
                sender_id=None,
                message="Requested discount exceeds standard allowed discount threshold for this tier.",
                requested_discount_percent=neg.requested_discount_percent,
                proposed_discount_percent=None,
                timestamp=neg.created_at + timedelta(minutes=5),
                created_at=neg.created_at + timedelta(minutes=5),
                updated_at=neg.created_at + timedelta(minutes=5)
            ))
            nmsg_id += 1

            # Sales Rep counter message
            negotiation_messages.append(NegotiationMessage(
                id=nmsg_id,
                negotiation_id=nid,
                sender_type="SALES_REP",
                sender_id=1,
                message="Instead of increasing the unit discount to 22%, we can include Premium Support 2yr at 15% off.",
                requested_discount_percent=neg.requested_discount_percent,
                proposed_discount_percent=14.0,
                timestamp=neg.created_at + timedelta(hours=2),
                created_at=neg.created_at + timedelta(hours=2),
                updated_at=neg.created_at + timedelta(hours=2)
            ))
            nmsg_id += 1

    session.add_all(negotiations)
    session.add_all(negotiation_messages)
    session.flush()

    # -------------------------------------------------------------
    # 28. DEAL HEALTH SNAPSHOTS (60 records)
    # -------------------------------------------------------------
    print("Generating 60 Deal Health Snapshots (With Q-1042 Trend)...")
    # For Q-1042: snapshots showing progression:
    # 1) Initial: 82.0
    # 2) After high discount: 64.0
    # 3) After recommended bundle: 78.0
    # 4) After approval: 85.0
    # That is 4 snapshots for Q-1042 (Quote ID 1).
    # Remaining 56 snapshots distributed across quotes 2 to 57 (1 each = 56 snapshots).
    # Total = 4 + 56 = 60 snapshots!

    health_snapshots = []
    snap_id = 1

    q1042_trend = [
        (base_time + timedelta(days=378), 82.0, 85.0, 90.0, 80.0, 85.0, 90.0, 10.0, 88.0, "LOW", "No significant risk identified", "Proceed with client review"),
        (base_time + timedelta(days=380), 64.0, 68.0, 50.0, 75.0, 80.0, 85.0, 45.0, 75.0, "MEDIUM", "Services discount exceeds 10% ceiling", "Submit discount approval request"),
        (base_time + timedelta(days=382), 78.0, 79.0, 70.0, 85.0, 85.0, 88.0, 25.0, 84.0, "LOW", "Cross-sell bundle improves margin profile", "Present bundle options to buyer"),
        (base_time + timedelta(days=384), 85.0, 84.0, 85.0, 90.0, 85.0, 92.0, 15.0, 89.0, "LOW", "Deal approved by sales manager", "Finalize quote and issue to customer"),
    ]

    for tr in q1042_trend:
        sdate, hscore, mscore, dscore, cscore, fscore, pscore, ascore, rscore, rlvl, trisk, raction = tr
        health_snapshots.append(DealHealthSnapshot(
            id=snap_id,
            quotation_id=1,
            snapshot_date=sdate,
            health_score=hscore,
            margin_score=mscore,
            discount_risk_score=dscore,
            customer_engagement_score=cscore,
            fulfillment_score=fscore,
            payment_score=pscore,
            anomaly_score=ascore,
            revenue_score=rscore,
            risk_level=rlvl,
            top_risk=trisk,
            recommended_action=raction,
            created_at=sdate,
            updated_at=sdate
        ))
        snap_id += 1

    # Next 56 snapshots for quotations 2 to 57
    for qid in range(2, 58):
        quote = quotations[qid - 1]
        sdate = quote.created_at + timedelta(days=1)
        hscore = quote.deal_health_score
        rlvl = "HIGH" if hscore < 65 else ("MEDIUM" if hscore < 75 else "LOW")
        health_snapshots.append(DealHealthSnapshot(
            id=snap_id,
            quotation_id=qid,
            snapshot_date=sdate,
            health_score=hscore,
            margin_score=hscore + 2.0,
            discount_risk_score=hscore - 3.0,
            customer_engagement_score=80.0,
            fulfillment_score=85.0,
            payment_score=90.0,
            anomaly_score=100.0 - hscore,
            revenue_score=hscore,
            risk_level=rlvl,
            top_risk="Discount variance" if rlvl != "LOW" else "Healthy deal profile",
            recommended_action="Review approval state" if rlvl != "LOW" else "Continue standard process",
            created_at=sdate,
            updated_at=sdate
        ))
        snap_id += 1

    session.add_all(health_snapshots)
    session.flush()

    # -------------------------------------------------------------
    # 29. DEAL ANOMALIES (15 records)
    # -------------------------------------------------------------
    print("Generating 15 Deal Anomalies...")
    anomalies_raw = [
        (1, 1, "HIGH_DISCOUNT", "HIGH", "Services discount of 18% exceeds authorized 10% limit", 10.0, 18.0, 81.0, "OPEN"),
        (2, 2, "MARGIN_DROP", "MEDIUM", "Quote gross margin dropped below 22% floor", 25.0, 20.5, 450.0, "ACKNOWLEDGED"),
        (3, 5, "UNUSUAL_DISCOUNT_PATTERN", "HIGH", "Multiple discretionary discounts applied in sequence", 5.0, 22.0, 320.0, "OPEN"),
        (4, 8, "CUSTOMER_NEGOTIATION", "MEDIUM", "Customer countered with 22% discount", 10.0, 22.0, 580.0, "OPEN"),
        (5, 12, "FULFILLMENT_DELAY", "MEDIUM", "Delivery date pushed by 5 days due to stock transit", 2.0, 7.0, 0.0, "RESOLVED"),
        (6, 15, "LOW_STOCK", "LOW", "Inventory buffer dropped below reorder threshold", 10.0, 4.0, 0.0, "RESOLVED"),
        (7, 18, "PAYMENT_DELAY", "HIGH", "Customer payment overdue past net-30 terms", 30.0, 52.0, 1250.0, "OPEN"),
        (8, 20, "REVENUE_DROP", "LOW", "Deal size decreased after line item removal", 4500.0, 3200.0, 1300.0, "ACKNOWLEDGED"),
        (9, 25, "HIGH_DISCOUNT", "CRITICAL", "Hardware line discount exceeded 25% boundary", 15.0, 26.0, 950.0, "OPEN"),
        (10, 28, "FULFILLMENT_DELAY", "HIGH", "Backorder line awaiting factory replenishment", 5.0, 15.0, 0.0, "OPEN"),
        (11, 33, "MARGIN_DROP", "MEDIUM", "Bundle configuration eroded margin by 4.2%", 30.0, 25.8, 280.0, "RESOLVED"),
        (12, 35, "UNUSUAL_DISCOUNT_PATTERN", "LOW", "Consecutive discounts on low-margin SKUs", 5.0, 12.0, 150.0, "ACKNOWLEDGED"),
        (13, 40, "LOW_STOCK", "MEDIUM", "Regional warehouse depleted of 16-inch models", 20.0, 2.0, 0.0, "RESOLVED"),
        (14, 44, "PAYMENT_DELAY", "HIGH", "Second overdue notice issued to accounts payable", 30.0, 65.0, 3400.0, "OPEN"),
        (15, 50, "HIGH_DISCOUNT", "HIGH", "Special non-standard discount applied to enterprise customer", 15.0, 22.0, 680.0, "OPEN"),
    ]
    anomalies = []
    for an in anomalies_raw:
        aid, qid, atype, sev, desc, exp_v, act_v, imp_amt, astat = an
        anomalies.append(DealAnomaly(
            id=aid,
            quotation_id=qid,
            anomaly_type=atype,
            severity=sev,
            detected_at=base_time + timedelta(days=350 + aid),
            description=desc,
            expected_value=exp_v,
            actual_value=act_v,
            impact_amount=imp_amt,
            status=astat,
            resolved_at=base_time + timedelta(days=355 + aid) if astat == "RESOLVED" else None,
            resolution_note="Adjusted pricing in line with governance policy" if astat == "RESOLVED" else None,
            created_at=base_time + timedelta(days=350 + aid),
            updated_at=base_time + timedelta(days=350 + aid)
        ))
    session.add_all(anomalies)
    session.flush()

    # -------------------------------------------------------------
    # 30. AUDIT LOGS (50 records)
    # -------------------------------------------------------------
    print("Generating 50 Audit Logs...")
    audit_actions = [
        ("quotation", 1, "CREATE", None, "Quotation Q-1042 initialized for Acme Corp"),
        ("quotation", 1, "ADD_PRODUCT", None, "Added 2x Laptop Pro 14 @ $1,200 (12% discount)"),
        ("quotation", 1, "ADD_PRODUCT", None, "Added 1x Onsite Setup Service @ $450 (18% discount)"),
        ("quotation", 1, "ADD_PRODUCT", None, "Added 1x Extended Warranty @ $180 (10% discount)"),
        ("quotation", 1, "SUBMIT", "DRAFT", "PENDING_APPROVAL"),
        ("approval", 1, "CREATE", None, "Approval APP-1042 triggered for discount threshold violation"),
        ("user", 1, "LOGIN", None, "User Aarav Sharma logged into Sales Workspace"),
        ("user", 3, "LOGIN", None, "User Rohan Kapoor logged into Manager Workspace"),
        ("user", 5, "LOGIN", None, "User Vikram Malhotra logged into Finance Workspace"),
        ("user", 6, "LOGIN", None, "User Kavita Rao logged into Customer Portal"),
    ]
    # Expand to 50 records
    audit_logs = []
    for i in range(1, 51):
        if i <= len(audit_actions):
            etype, eid, act, old_v, new_v = audit_actions[i - 1]
        else:
            etype = "quotation" if i % 2 == 0 else ("approval" if i % 3 == 0 else "payment")
            eid = (i % 25) + 1
            act = "UPDATE" if i % 2 == 0 else ("APPROVE" if i % 3 == 0 else "PAYMENT")
            old_v = "Status: PENDING"
            new_v = "Status: COMPLETED"

        uid = ((i - 1) % 8) + 1
        atime = base_time + timedelta(days=360 + i)
        ip = f"10.0.0.{10 + (i % 20)}"

        audit_logs.append(AuditLog(
            id=i,
            user_id=uid,
            entity_type=etype,
            entity_id=eid,
            action=act,
            old_value=old_v,
            new_value=new_v,
            ip_address=ip,
            timestamp=atime,
            created_at=atime,
            updated_at=atime
        ))

    session.add_all(audit_logs)
    session.flush()

    # Commit all
    session.commit()
    session.close()

    # Auto-export to CSV and PostgreSQL SQL files
    try:
        from export_csv import export_all_to_csv
        export_all_to_csv()
    except Exception as e:
        print(f"Note: CSV export notice: {e}")

    try:
        from export_postgres_sql import generate_postgres_sql
        generate_postgres_sql()
    except Exception as e:
        print(f"Note: PostgreSQL SQL export notice: {e}")

    print("=" * 60)
    print("Database Seeding Completed Successfully!")
    print("=" * 60)

if __name__ == "__main__":
    seed_database()
