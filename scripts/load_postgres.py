"""
DealFlow360 - Direct PostgreSQL Loader Script
Loads data/dealflow360_postgres.sql directly into a target PostgreSQL database.
Usage:
    python scripts/load_postgres.py
Or configure DATABASE_URL in backend/.env:
    DATABASE_URL=postgresql://username:password@localhost:5432/dealflow360
"""

import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend')))

from app.core.database import DATABASE_URL

def load_into_postgres():
    sql_file = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'data', 'dealflow360_postgres.sql'))

    if not os.path.exists(sql_file):
        print(f"Error: SQL file {sql_file} does not exist. Run scripts/export_postgres_sql.py first.")
        return False

    print("=" * 65)
    print("DealFlow360 PostgreSQL Database Loader")
    print(f"Target Database: {DATABASE_URL}")
    print(f"Source Script:   {sql_file}")
    print("=" * 65)

    try:
        import psycopg2
        # Parse connection params from DATABASE_URL
        conn = psycopg2.connect(DATABASE_URL)
        conn.autocommit = True
        cursor = conn.cursor()

        print("Executing PostgreSQL DDL and Data Inserts...")
        with open(sql_file, mode='r', encoding='utf-8') as f:
            sql_content = f.read()

        cursor.execute(sql_content)

        # Verify record count
        cursor.execute("""
            SELECT
                (SELECT count(*) FROM users) +
                (SELECT count(*) FROM customers) +
                (SELECT count(*) FROM customer_contacts) +
                (SELECT count(*) FROM product_categories) +
                (SELECT count(*) FROM products) +
                (SELECT count(*) FROM pricelists) +
                (SELECT count(*) FROM promotions) +
                (SELECT count(*) FROM product_relationships) +
                (SELECT count(*) FROM warehouses) +
                (SELECT count(*) FROM inventory_stock) +
                (SELECT count(*) FROM discount_tiers) +
                (SELECT count(*) FROM discount_rules) +
                (SELECT count(*) FROM quotations) +
                (SELECT count(*) FROM quotation_lines) +
                (SELECT count(*) FROM approvals) +
                (SELECT count(*) FROM approval_steps) +
                (SELECT count(*) FROM fulfillment_orders) +
                (SELECT count(*) FROM fulfillment_lines) +
                (SELECT count(*) FROM subscriptions) +
                (SELECT count(*) FROM subscription_lines) +
                (SELECT count(*) FROM invoices) +
                (SELECT count(*) FROM invoice_lines) +
                (SELECT count(*) FROM payments) +
                (SELECT count(*) FROM negotiations) +
                (SELECT count(*) FROM negotiation_messages) +
                (SELECT count(*) FROM deal_health_snapshots) +
                (SELECT count(*) FROM deal_anomalies) +
                (SELECT count(*) FROM audit_logs) +
                (SELECT count(*) FROM historical_orders) +
                (SELECT count(*) FROM historical_order_lines) AS total_records;
        """)
        total = cursor.fetchone()[0]
        print(f"PostgreSQL Database Loaded Successfully! Total Records: {total}")
        cursor.close()
        conn.close()
        return True

    except Exception as e:
        print(f"\n[PostgreSQL Connection Info] Could not connect directly to {DATABASE_URL}: {e}")
        print("\nTo load this script into your PostgreSQL instance:")
        print(f"  psql -h localhost -U <user> -d dealflow360 -f \"{sql_file}\"")
        return False

if __name__ == "__main__":
    load_into_postgres()
