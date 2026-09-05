"""
Export all DealFlow360 database tables to CSV format.
Generates:
1. Individual CSV files in data/csv/<table_name>.csv for each of the 30 tables.
2. A single comprehensive CSV file in data/dealflow360_all_records.csv with all 1,042 records.
"""

import os
import sys
import csv
import json

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend')))

from app.core.database import SessionLocal, engine
from sqlalchemy import inspect
from app.models import (
    User, Customer, CustomerContact, ProductCategory, Product,
    Pricelist, Promotion, ProductRelationship, Warehouse, InventoryStock,
    DiscountTier, DiscountRule, Quotation, QuotationLine, HistoricalOrder,
    HistoricalOrderLine, RecommendationFeedback, Approval, ApprovalStep,
    FulfillmentOrder, FulfillmentLine, Subscription, SubscriptionLine,
    Invoice, InvoiceLine, Payment, Negotiation, NegotiationMessage,
    DealHealthSnapshot, DealAnomaly, AuditLog
)

TABLE_MODELS = [
    ("users", User),
    ("customers", Customer),
    ("customer_contacts", CustomerContact),
    ("product_categories", ProductCategory),
    ("products", Product),
    ("pricelists", Pricelist),
    ("promotions", Promotion),
    ("product_relationships", ProductRelationship),
    ("warehouses", Warehouse),
    ("inventory_stock", InventoryStock),
    ("discount_tiers", DiscountTier),
    ("discount_rules", DiscountRule),
    ("quotations", Quotation),
    ("quotation_lines", QuotationLine),
    ("approvals", Approval),
    ("approval_steps", ApprovalStep),
    ("fulfillment_orders", FulfillmentOrder),
    ("fulfillment_lines", FulfillmentLine),
    ("subscriptions", Subscription),
    ("subscription_lines", SubscriptionLine),
    ("invoices", Invoice),
    ("invoice_lines", InvoiceLine),
    ("payments", Payment),
    ("negotiations", Negotiation),
    ("negotiation_messages", NegotiationMessage),
    ("deal_health_snapshots", DealHealthSnapshot),
    ("deal_anomalies", DealAnomaly),
    ("audit_logs", AuditLog),
    ("historical_orders", HistoricalOrder),
    ("historical_order_lines", HistoricalOrderLine),
]

def export_all_to_csv():
    output_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'data', 'csv'))
    os.makedirs(output_dir, exist_ok=True)
    master_file = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'data', 'dealflow360_all_records.csv'))

    session = SessionLocal()

    master_rows = []
    master_header = ["table_name", "record_id", "record_data_json"]

    total_records = 0
    print("=" * 60)
    print("Exporting DealFlow360 Records to CSV")
    print("=" * 60)

    for table_name, model in TABLE_MODELS:
        file_path = os.path.join(output_dir, f"{table_name}.csv")
        records = session.query(model).all()
        count = len(records)
        total_records += count

        # Inspect column names
        mapper = inspect(model)
        columns = [col.key for col in mapper.attrs if hasattr(col, 'columns')]

        with open(file_path, mode='w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow(columns)
            for rec in records:
                row = []
                data_dict = {}
                for col in columns:
                    val = getattr(rec, col)
                    row.append(val)
                    data_dict[col] = str(val) if val is not None else None
                writer.writerow(row)

                rec_id = getattr(rec, 'id', None)
                master_rows.append([table_name, rec_id, json.dumps(data_dict)])

        print(f"Exported {count:3d} records -> data/csv/{table_name}.csv")

    # Write master file
    with open(master_file, mode='w', newline='', encoding='utf-8') as mf:
        mwriter = csv.writer(mf)
        mwriter.writerow(master_header)
        mwriter.writerows(master_rows)

    session.close()

    print("=" * 60)
    print(f"Master CSV exported -> {master_file}")
    print(f"Total Tables: {len(TABLE_MODELS)}")
    print(f"Total Records Exported: {total_records}")
    print("=" * 60)

if __name__ == "__main__":
    export_all_to_csv()
