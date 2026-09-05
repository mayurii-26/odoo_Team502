"""
DealFlow360 - PostgreSQL SQL Generator
Generates a complete PostgreSQL-compatible SQL dump: data/dealflow360_postgres.sql
Includes:
- Schema creation (DDL) with PostgreSQL types and constraints
- INSERT statements for all 1,042 records across 30 tables
- Sequence updates for PostgreSQL auto-incrementing PKs
"""

import os
import sys
import json
from datetime import datetime

# Helper to escape SQL values for PostgreSQL
def sql_escape(val):
    if val is None:
        return "NULL"
    if isinstance(val, bool):
        return "TRUE" if val else "FALSE"
    if isinstance(val, (int, float)):
        return str(val)
    if isinstance(val, datetime):
        return f"'{val.strftime('%Y-%m-%d %H:%M:%S')}'"
    # string
    s = str(val).replace("'", "''")
    return f"'{s}'"

def generate_postgres_sql():
    sql_file = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'data', 'dealflow360_postgres.sql'))

    # Load data from the generated CSV files
    import csv
    csv_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'data', 'csv'))

    TABLE_ORDER = [
        "users",
        "customers",
        "customer_contacts",
        "product_categories",
        "products",
        "pricelists",
        "promotions",
        "product_relationships",
        "warehouses",
        "inventory_stock",
        "discount_tiers",
        "discount_rules",
        "quotations",
        "quotation_lines",
        "historical_orders",
        "historical_order_lines",
        "approvals",
        "approval_steps",
        "fulfillment_orders",
        "fulfillment_lines",
        "subscriptions",
        "subscription_lines",
        "invoices",
        "invoice_lines",
        "payments",
        "negotiations",
        "negotiation_messages",
        "deal_health_snapshots",
        "deal_anomalies",
        "audit_logs",
        "recommendation_feedback"
    ]

    DDL_STATEMENTS = """-- ============================================================
-- DealFlow360 - Complete PostgreSQL Relational Database Schema
-- Target: 1,042 Relational Records across 30 Tables
-- Generated for PostgreSQL 14 / 15 / 16 / 17 / 18
-- ============================================================

BEGIN;

-- Drop existing tables in reverse dependency order
DROP TABLE IF EXISTS recommendation_feedback CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS deal_anomalies CASCADE;
DROP TABLE IF EXISTS deal_health_snapshots CASCADE;
DROP TABLE IF EXISTS negotiation_messages CASCADE;
DROP TABLE IF EXISTS negotiations CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS invoice_lines CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS subscription_lines CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS fulfillment_lines CASCADE;
DROP TABLE IF EXISTS fulfillment_orders CASCADE;
DROP TABLE IF EXISTS approval_steps CASCADE;
DROP TABLE IF EXISTS approvals CASCADE;
DROP TABLE IF EXISTS historical_order_lines CASCADE;
DROP TABLE IF EXISTS historical_orders CASCADE;
DROP TABLE IF EXISTS quotation_lines CASCADE;
DROP TABLE IF EXISTS quotations CASCADE;
DROP TABLE IF EXISTS discount_rules CASCADE;
DROP TABLE IF EXISTS discount_tiers CASCADE;
DROP TABLE IF EXISTS inventory_stock CASCADE;
DROP TABLE IF EXISTS warehouses CASCADE;
DROP TABLE IF EXISTS product_relationships CASCADE;
DROP TABLE IF EXISTS promotions CASCADE;
DROP TABLE IF EXISTS pricelists CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS product_categories CASCADE;
DROP TABLE IF EXISTS customer_contacts CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 1. Users Table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    last_login_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX ix_users_email ON users(email);

-- 2. Customers Table
CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    customer_code VARCHAR(50) UNIQUE NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    industry VARCHAR(100) NOT NULL,
    company_size VARCHAR(50) NOT NULL,
    country VARCHAR(100) NOT NULL DEFAULT 'United States',
    state VARCHAR(100),
    city VARCHAR(100),
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    customer_tier VARCHAR(50) NOT NULL,
    sales_owner_id INTEGER NOT NULL REFERENCES users(id),
    credit_limit DOUBLE PRECISION NOT NULL DEFAULT 50000.0,
    payment_terms_days INTEGER NOT NULL DEFAULT 30,
    lifetime_value DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX ix_customers_code ON customers(customer_code);

-- 3. Customer Contacts Table
CREATE TABLE customer_contacts (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES customers(id),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    job_title VARCHAR(100) NOT NULL,
    department VARCHAR(100),
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    portal_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. Product Categories Table
CREATE TABLE product_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(255),
    parent_category_id INTEGER REFERENCES product_categories(id),
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 5. Products Table
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    sku VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description VARCHAR(500),
    category_id INTEGER NOT NULL REFERENCES product_categories(id),
    product_family VARCHAR(100) NOT NULL,
    product_type VARCHAR(50) NOT NULL,
    tier INTEGER,
    parent_product_id INTEGER REFERENCES products(id),
    unit_price DOUBLE PRECISION NOT NULL,
    cost_price DOUBLE PRECISION NOT NULL,
    margin_amount DOUBLE PRECISION NOT NULL,
    margin_percent DOUBLE PRECISION NOT NULL,
    is_subscription BOOLEAN NOT NULL DEFAULT FALSE,
    subscription_plan_id VARCHAR(50),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_sellable BOOLEAN NOT NULL DEFAULT TRUE,
    is_service BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX ix_products_sku ON products(sku);

-- 6. Pricelists Table
CREATE TABLE pricelists (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    customer_tier VARCHAR(50),
    discount_percent DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    valid_from TIMESTAMP NOT NULL,
    valid_to TIMESTAMP,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 7. Promotions Table
CREATE TABLE promotions (
    id SERIAL PRIMARY KEY,
    promotion_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description VARCHAR(500),
    promotion_type VARCHAR(50) NOT NULL,
    product_id INTEGER REFERENCES products(id),
    category_id INTEGER REFERENCES product_categories(id),
    discount_percent DOUBLE PRECISION DEFAULT 0.0,
    discount_amount DOUBLE PRECISION DEFAULT 0.0,
    minimum_quantity INTEGER NOT NULL DEFAULT 1,
    valid_from TIMESTAMP NOT NULL,
    valid_to TIMESTAMP,
    priority INTEGER NOT NULL DEFAULT 1,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 8. Product Relationships Table
CREATE TABLE product_relationships (
    id SERIAL PRIMARY KEY,
    source_product_id INTEGER NOT NULL REFERENCES products(id),
    target_product_id INTEGER NOT NULL REFERENCES products(id),
    relationship_type VARCHAR(50) NOT NULL,
    strength DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    priority INTEGER NOT NULL DEFAULT 1,
    reason VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 9. Warehouses Table
CREATE TABLE warehouses (
    id SERIAL PRIMARY KEY,
    warehouse_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100),
    country VARCHAR(100) NOT NULL DEFAULT 'India',
    manager_name VARCHAR(100),
    capacity INTEGER NOT NULL DEFAULT 10000,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 10. Inventory Stock Table
CREATE TABLE inventory_stock (
    id SERIAL PRIMARY KEY,
    warehouse_id INTEGER NOT NULL REFERENCES warehouses(id),
    product_id INTEGER NOT NULL REFERENCES products(id),
    quantity_on_hand INTEGER NOT NULL DEFAULT 0,
    quantity_reserved INTEGER NOT NULL DEFAULT 0,
    quantity_available INTEGER NOT NULL DEFAULT 0,
    reorder_level INTEGER NOT NULL DEFAULT 10,
    reorder_quantity INTEGER NOT NULL DEFAULT 50,
    unit_cost DOUBLE PRECISION NOT NULL,
    stock_status VARCHAR(50) NOT NULL DEFAULT 'IN_STOCK',
    last_restocked_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 11. Discount Tiers Table
CREATE TABLE discount_tiers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    min_discount DOUBLE PRECISION NOT NULL,
    max_discount DOUBLE PRECISION NOT NULL,
    approval_required BOOLEAN NOT NULL DEFAULT FALSE,
    approval_level VARCHAR(50),
    description VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 12. Discount Rules Table
CREATE TABLE discount_rules (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category_id INTEGER REFERENCES product_categories(id),
    product_id INTEGER REFERENCES products(id),
    customer_tier VARCHAR(50),
    max_discount_percent DOUBLE PRECISION NOT NULL,
    approval_required BOOLEAN NOT NULL DEFAULT FALSE,
    approval_role VARCHAR(50),
    risk_level VARCHAR(50) NOT NULL DEFAULT 'LOW',
    rule_description VARCHAR(500),
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 13. Quotations Table
CREATE TABLE quotations (
    id SERIAL PRIMARY KEY,
    quote_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id INTEGER NOT NULL REFERENCES customers(id),
    sales_rep_id INTEGER NOT NULL REFERENCES users(id),
    price_list_id INTEGER REFERENCES pricelists(id),
    quote_date TIMESTAMP NOT NULL,
    valid_until TIMESTAMP NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    subtotal DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    discount_amount DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    tax_amount DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    total_amount DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    total_cost DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    gross_margin DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    margin_percent DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    discount_percent DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    approval_required BOOLEAN NOT NULL DEFAULT FALSE,
    approval_status VARCHAR(50),
    deal_health_score DOUBLE PRECISION NOT NULL DEFAULT 80.0,
    customer_notes VARCHAR(500),
    internal_notes VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX ix_quotations_number ON quotations(quote_number);

-- 14. Quotation Lines Table
CREATE TABLE quotation_lines (
    id SERIAL PRIMARY KEY,
    quotation_id INTEGER NOT NULL REFERENCES quotations(id),
    product_id INTEGER NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DOUBLE PRECISION NOT NULL,
    discount_percent DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    discount_amount DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    line_subtotal DOUBLE PRECISION NOT NULL,
    unit_cost DOUBLE PRECISION NOT NULL,
    line_cost DOUBLE PRECISION NOT NULL,
    line_margin DOUBLE PRECISION NOT NULL,
    line_margin_percent DOUBLE PRECISION NOT NULL,
    discount_limit_percent DOUBLE PRECISION NOT NULL DEFAULT 15.0,
    discount_status VARCHAR(50) NOT NULL DEFAULT 'OK',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 15. Historical Orders Table
CREATE TABLE historical_orders (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id INTEGER NOT NULL REFERENCES customers(id),
    sales_rep_id INTEGER NOT NULL REFERENCES users(id),
    order_date TIMESTAMP NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'COMPLETED',
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    subtotal DOUBLE PRECISION NOT NULL,
    discount_amount DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    tax_amount DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    total_amount DOUBLE PRECISION NOT NULL,
    payment_status VARCHAR(50) NOT NULL DEFAULT 'PAID',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 16. Historical Order Lines Table
CREATE TABLE historical_order_lines (
    id SERIAL PRIMARY KEY,
    historical_order_id INTEGER NOT NULL REFERENCES historical_orders(id),
    product_id INTEGER NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DOUBLE PRECISION NOT NULL,
    discount_percent DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    discount_amount DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    unit_cost DOUBLE PRECISION NOT NULL,
    line_revenue DOUBLE PRECISION NOT NULL,
    line_cost DOUBLE PRECISION NOT NULL,
    line_margin DOUBLE PRECISION NOT NULL,
    line_margin_percent DOUBLE PRECISION NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 17. Approvals Table
CREATE TABLE approvals (
    id SERIAL PRIMARY KEY,
    approval_number VARCHAR(50) UNIQUE NOT NULL,
    quotation_id INTEGER NOT NULL REFERENCES quotations(id),
    requested_by INTEGER NOT NULL REFERENCES users(id),
    assigned_to INTEGER NOT NULL REFERENCES users(id),
    approval_type VARCHAR(50) NOT NULL,
    reason VARCHAR(500) NOT NULL,
    risk_score DOUBLE PRECISION NOT NULL DEFAULT 50.0,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    requested_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP,
    decision_comment VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 18. Approval Steps Table
CREATE TABLE approval_steps (
    id SERIAL PRIMARY KEY,
    approval_id INTEGER NOT NULL REFERENCES approvals(id),
    step_number INTEGER NOT NULL,
    approver_id INTEGER NOT NULL REFERENCES users(id),
    approver_role VARCHAR(50) NOT NULL,
    threshold_type VARCHAR(50) NOT NULL,
    threshold_value DOUBLE PRECISION NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    actioned_at TIMESTAMP,
    comment VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 19. Fulfillment Orders Table
CREATE TABLE fulfillment_orders (
    id SERIAL PRIMARY KEY,
    fulfillment_number VARCHAR(50) UNIQUE NOT NULL,
    quotation_id INTEGER NOT NULL REFERENCES quotations(id),
    customer_id INTEGER NOT NULL REFERENCES customers(id),
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    warehouse_strategy VARCHAR(50) NOT NULL DEFAULT 'SINGLE_WAREHOUSE',
    shipping_address VARCHAR(500),
    requested_date TIMESTAMP NOT NULL,
    promised_date TIMESTAMP,
    shipped_date TIMESTAMP,
    delivered_date TIMESTAMP,
    tracking_number VARCHAR(100),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 20. Fulfillment Lines Table
CREATE TABLE fulfillment_lines (
    id SERIAL PRIMARY KEY,
    fulfillment_order_id INTEGER NOT NULL REFERENCES fulfillment_orders(id),
    quotation_line_id INTEGER NOT NULL REFERENCES quotation_lines(id),
    product_id INTEGER NOT NULL REFERENCES products(id),
    warehouse_id INTEGER NOT NULL REFERENCES warehouses(id),
    ordered_quantity INTEGER NOT NULL,
    allocated_quantity INTEGER NOT NULL,
    fulfilled_quantity INTEGER NOT NULL,
    backordered_quantity INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    unit_price DOUBLE PRECISION NOT NULL,
    unit_cost DOUBLE PRECISION NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 21. Subscriptions Table
CREATE TABLE subscriptions (
    id SERIAL PRIMARY KEY,
    subscription_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id INTEGER NOT NULL REFERENCES customers(id),
    quotation_id INTEGER REFERENCES quotations(id),
    product_id INTEGER NOT NULL REFERENCES products(id),
    plan_name VARCHAR(100) NOT NULL,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP,
    billing_frequency VARCHAR(50) NOT NULL DEFAULT 'MONTHLY',
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DOUBLE PRECISION NOT NULL,
    discount_percent DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    recurring_amount DOUBLE PRECISION NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    next_billing_date TIMESTAMP,
    auto_renew BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 22. Subscription Lines Table
CREATE TABLE subscription_lines (
    id SERIAL PRIMARY KEY,
    subscription_id INTEGER NOT NULL REFERENCES subscriptions(id),
    product_id INTEGER NOT NULL REFERENCES products(id),
    description VARCHAR(255),
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DOUBLE PRECISION NOT NULL,
    discount_percent DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    line_total DOUBLE PRECISION NOT NULL,
    billing_frequency VARCHAR(50) NOT NULL DEFAULT 'MONTHLY',
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 23. Invoices Table
CREATE TABLE invoices (
    id SERIAL PRIMARY KEY,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id INTEGER NOT NULL REFERENCES customers(id),
    quotation_id INTEGER REFERENCES quotations(id),
    subscription_id INTEGER REFERENCES subscriptions(id),
    invoice_type VARCHAR(50) NOT NULL DEFAULT 'CUSTOMER_INVOICE',
    invoice_date TIMESTAMP NOT NULL,
    due_date TIMESTAMP NOT NULL,
    subtotal DOUBLE PRECISION NOT NULL,
    discount_amount DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    tax_amount DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    total_amount DOUBLE PRECISION NOT NULL,
    amount_paid DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    amount_due DOUBLE PRECISION NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    status VARCHAR(50) NOT NULL DEFAULT 'POSTED',
    payment_status VARCHAR(50) NOT NULL DEFAULT 'UNPAID',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 24. Invoice Lines Table
CREATE TABLE invoice_lines (
    id SERIAL PRIMARY KEY,
    invoice_id INTEGER NOT NULL REFERENCES invoices(id),
    product_id INTEGER NOT NULL REFERENCES products(id),
    description VARCHAR(255),
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DOUBLE PRECISION NOT NULL,
    discount_percent DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    discount_amount DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    tax_percent DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    line_subtotal DOUBLE PRECISION NOT NULL,
    line_total DOUBLE PRECISION NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 25. Payments Table
CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    payment_number VARCHAR(50) UNIQUE NOT NULL,
    invoice_id INTEGER NOT NULL REFERENCES invoices(id),
    customer_id INTEGER NOT NULL REFERENCES customers(id),
    payment_date TIMESTAMP NOT NULL,
    amount DOUBLE PRECISION NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    payment_method VARCHAR(50) NOT NULL,
    transaction_reference VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'SUCCESS',
    notes VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 26. Negotiations Table
CREATE TABLE negotiations (
    id SERIAL PRIMARY KEY,
    negotiation_number VARCHAR(50) UNIQUE NOT NULL,
    quotation_id INTEGER NOT NULL REFERENCES quotations(id),
    customer_id INTEGER NOT NULL REFERENCES customers(id),
    initiated_by INTEGER NOT NULL REFERENCES users(id),
    current_discount_percent DOUBLE PRECISION NOT NULL,
    requested_discount_percent DOUBLE PRECISION NOT NULL,
    current_total DOUBLE PRECISION NOT NULL,
    requested_total DOUBLE PRECISION NOT NULL,
    customer_message VARCHAR(500),
    sales_response VARCHAR(500),
    status VARCHAR(50) NOT NULL DEFAULT 'OPEN',
    risk_score DOUBLE PRECISION NOT NULL DEFAULT 50.0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 27. Negotiation Messages Table
CREATE TABLE negotiation_messages (
    id SERIAL PRIMARY KEY,
    negotiation_id INTEGER NOT NULL REFERENCES negotiations(id),
    sender_type VARCHAR(50) NOT NULL,
    sender_id INTEGER REFERENCES users(id),
    message VARCHAR(1000) NOT NULL,
    requested_discount_percent DOUBLE PRECISION,
    proposed_discount_percent DOUBLE PRECISION,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 28. Deal Health Snapshots Table
CREATE TABLE deal_health_snapshots (
    id SERIAL PRIMARY KEY,
    quotation_id INTEGER NOT NULL REFERENCES quotations(id),
    snapshot_date TIMESTAMP NOT NULL,
    health_score DOUBLE PRECISION NOT NULL,
    margin_score DOUBLE PRECISION NOT NULL,
    discount_risk_score DOUBLE PRECISION NOT NULL,
    customer_engagement_score DOUBLE PRECISION NOT NULL,
    fulfillment_score DOUBLE PRECISION NOT NULL,
    payment_score DOUBLE PRECISION NOT NULL,
    anomaly_score DOUBLE PRECISION NOT NULL,
    revenue_score DOUBLE PRECISION NOT NULL,
    risk_level VARCHAR(50) NOT NULL,
    top_risk VARCHAR(255),
    recommended_action VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 29. Deal Anomalies Table
CREATE TABLE deal_anomalies (
    id SERIAL PRIMARY KEY,
    quotation_id INTEGER NOT NULL REFERENCES quotations(id),
    anomaly_type VARCHAR(50) NOT NULL,
    severity VARCHAR(50) NOT NULL,
    detected_at TIMESTAMP NOT NULL,
    description VARCHAR(500) NOT NULL,
    expected_value DOUBLE PRECISION,
    actual_value DOUBLE PRECISION,
    impact_amount DOUBLE PRECISION,
    status VARCHAR(50) NOT NULL DEFAULT 'OPEN',
    resolved_at TIMESTAMP,
    resolution_note VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 30. Audit Logs Table
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    entity_type VARCHAR(50) NOT NULL,
    entity_id INTEGER NOT NULL,
    action VARCHAR(50) NOT NULL,
    old_value TEXT,
    new_value TEXT,
    ip_address VARCHAR(50) NOT NULL DEFAULT '10.0.0.1',
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 31. Recommendation Feedback Table (Optional governance feedback)
CREATE TABLE recommendation_feedback (
    id SERIAL PRIMARY KEY,
    quotation_id INTEGER NOT NULL REFERENCES quotations(id),
    customer_id INTEGER NOT NULL REFERENCES customers(id),
    product_id INTEGER NOT NULL REFERENCES products(id),
    user_id INTEGER NOT NULL REFERENCES users(id),
    recommendation_type VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    reason VARCHAR(100),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

"""

    with open(sql_file, mode='w', encoding='utf-8') as f:
        f.write(DDL_STATEMENTS)
        f.write("\n-- ============================================================\n")
        f.write("-- DATA INSERT STATEMENTS (EXACTLY 1,042 RECORDS)\n")
        f.write("-- ============================================================\n\n")

        total_sql_records = 0

        for tname in TABLE_ORDER:
            csv_path = os.path.join(csv_dir, f"{tname}.csv")
            if not os.path.exists(csv_path):
                continue

            with open(csv_path, mode='r', encoding='utf-8') as cf:
                reader = csv.DictReader(cf)
                rows = list(reader)

            if not rows:
                continue

            cols = list(rows[0].keys())
            f.write(f"-- Table: {tname} ({len(rows)} records)\n")

            for r in rows:
                val_strs = []
                for c in cols:
                    val = r[c]
                    if val == "" or val is None:
                        val_strs.append("NULL")
                    elif val.upper() in ["TRUE", "FALSE"]:
                        val_strs.append(val.upper())
                    elif val.replace(".", "", 1).isdigit() or (val.startswith("-") and val[1:].replace(".", "", 1).isdigit()):
                        val_strs.append(val)
                    else:
                        clean_str = val.replace("'", "''")
                        val_strs.append(f"'{clean_str}'")

                col_list = ", ".join(cols)
                val_list = ", ".join(val_strs)
                f.write(f"INSERT INTO {tname} ({col_list}) VALUES ({val_list});\n")
                total_sql_records += 1

            f.write("\n")

        # Update sequences for all tables
        f.write("-- ============================================================\n")
        f.write("-- SEQUENCE RESETS FOR POSTGRESQL AUTO-INCREMENTING SERIALS\n")
        f.write("-- ============================================================\n")
        for tname in TABLE_ORDER:
            f.write(f"SELECT setval(pg_get_serial_sequence('{tname}', 'id'), coalesce(max(id), 1)) FROM {tname};\n")

        f.write("\nCOMMIT;\n")

    print(f"Generated PostgreSQL SQL script -> {sql_file}")
    print(f"Total SQL Inserts: {total_sql_records}")

if __name__ == "__main__":
    generate_postgres_sql()
