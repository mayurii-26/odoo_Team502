# ============================================================
# DealFlow360 - B5 Upsell & Cross-sell Recommendation Engine
# Deterministic, data-driven calculation from database history
# ============================================================
from datetime import datetime
from typing import Dict, List, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models import (
    Quotation, QuotationLine, Product, ProductRelationship,
    Promotion, InventoryStock, HistoricalOrder, HistoricalOrderLine, Customer
)

class RecommendationEngine:
    def __init__(self, db: Session):
        self.db = db

    def get_recommendations(self, quotation_id: int) -> Dict[str, List[Dict[str, Any]]]:
        """
        Calculate data-driven upsell and cross-sell recommendations for a quotation.
        Derived deterministically from:
        - Quotation lines
        - Historical orders & co-purchases
        - Upgrade sequences
        - Product relationships
        - Active promotions
        - Customer purchase affinity
        - Real-time stock levels
        """
        # 1. Fetch quotation and current products
        quote = self.db.query(Quotation).filter(Quotation.id == quotation_id).first()
        if not quote:
            # Fallback check by quote_number if numeric ID passed as string or vice versa
            quote = self.db.query(Quotation).filter(Quotation.quote_number == str(quotation_id)).first()
        if not quote:
            return {"upsell": [], "cross_sell": []}

        quote_lines = self.db.query(QuotationLine).filter(QuotationLine.quotation_id == quote.id).all()
        current_product_ids = [line.product_id for line in quote_lines]
        if not current_product_ids:
            return {"upsell": [], "cross_sell": []}

        customer_id = quote.customer_id
        customer = self.db.query(Customer).filter(Customer.id == customer_id).first()
        customer_name = customer.company_name if customer else "Customer"

        # 2. Pre-load inventory stock availability
        # Available stock per product = SUM(quantity_available across warehouses)
        stock_query = self.db.query(
            InventoryStock.product_id,
            func.sum(InventoryStock.quantity_available).label("total_available")
        ).group_by(InventoryStock.product_id).all()
        stock_map = {row.product_id: int(row.total_available or 0) for row in stock_query}

        # 3. Pre-load active promotions
        now = datetime.utcnow()
        active_promos = self.db.query(Promotion).filter(
            Promotion.status == "ACTIVE",
            Promotion.valid_from <= now,
            Promotion.valid_to >= now
        ).all()
        promo_by_product = {}
        for pr in active_promos:
            if pr.product_id:
                promo_by_product[pr.product_id] = pr

        # 4. Pre-load historical order lines & customer purchases
        all_hist_orders = self.db.query(HistoricalOrder).filter(HistoricalOrder.status == "COMPLETED").all()
        hist_lines = self.db.query(HistoricalOrderLine).all()
        order_to_products = {}
        order_to_customer = {}
        order_to_date = {}
        for ho in all_hist_orders:
            order_to_products[ho.id] = set()
            order_to_customer[ho.id] = ho.customer_id
            order_to_date[ho.id] = ho.order_date

        for hl in hist_lines:
            if hl.historical_order_id in order_to_products:
                order_to_products[hl.historical_order_id].add(hl.product_id)

        # Customer's historical purchases
        cust_hist_pids = set()
        for oid, c_id in order_to_customer.items():
            if c_id == customer_id:
                cust_hist_pids.update(order_to_products.get(oid, set()))

        # =========================================================
        # 5. CALCULATE UPSELL RECOMMENDATIONS
        # =========================================================
        # Eligible candidates: same product family, higher tier, available stock > 0
        upsell_candidates = []

        for ql in quote_lines:
            src_prod = self.db.query(Product).filter(Product.id == ql.product_id).first()
            if not src_prod or not src_prod.tier:
                continue

            # Find higher-tier products in same family
            target_prods = self.db.query(Product).filter(
                Product.product_family == src_prod.product_family,
                Product.tier > src_prod.tier,
                Product.is_active == True,
                Product.is_sellable == True
            ).all()

            for tgt in target_prods:
                if tgt.id in current_product_ids:
                    continue # Already in quote

                stock_avail = stock_map.get(tgt.id, 0)
                # CRITICAL RULE: If available stock == 0, REMOVE candidate from recommendation list
                if stock_avail <= 0:
                    continue

                # Calculate Upgrade Rate from Historical Orders:
                # customers who purchased source product and later purchased target higher-tier product / customers who purchased source
                src_customers = set()
                upgraded_customers = set()

                for ho in all_hist_orders:
                    pids = order_to_products.get(ho.id, set())
                    if src_prod.id in pids:
                        c_id = order_to_customer[ho.id]
                        src_customers.add(c_id)
                        # Check if this customer later purchased target product
                        order_time = order_to_date[ho.id]
                        for later_ho in all_hist_orders:
                            if later_ho.customer_id == c_id and later_ho.order_date > order_time:
                                if tgt.id in order_to_products.get(later_ho.id, set()):
                                    upgraded_customers.add(c_id)

                upgrade_rate = (len(upgraded_customers) / len(src_customers)) if src_customers else 0.0

                # Margin Delta
                # Margin difference when upgrading 1 unit
                margin_delta = round(tgt.margin_amount - src_prod.margin_amount, 2)
                margin_pct_delta = round(tgt.margin_percent - src_prod.margin_percent, 2)
                price_delta = round(tgt.unit_price - src_prod.unit_price, 2)

                # Promotion check
                promo = promo_by_product.get(tgt.id)

                # Customer affinity
                cust_affinity = 0.9 if tgt.id in cust_hist_pids or any(
                    p in cust_hist_pids for p in [src_prod.id, tgt.id]
                ) else 0.4

                upsell_candidates.append({
                    "source_product": src_prod,
                    "target_product": tgt,
                    "upgrade_rate": upgrade_rate,
                    "margin_delta": margin_delta,
                    "margin_pct_delta": margin_pct_delta,
                    "price_delta": price_delta,
                    "stock_avail": stock_avail,
                    "promo": promo,
                    "cust_affinity": cust_affinity
                })

        # Score & Rank Upsell Candidates
        ranked_upsell = []
        if upsell_candidates:
            max_upgrade = max([c["upgrade_rate"] for c in upsell_candidates] + [0.001])
            max_margin = max([c["margin_delta"] for c in upsell_candidates] + [1.0])

            for idx, c in enumerate(upsell_candidates, start=1):
                tgt = c["target_product"]
                src = c["source_product"]

                # Normalized component scores (0-100)
                norm_upgrade = min(100.0, (c["upgrade_rate"] / max_upgrade) * 100.0) if max_upgrade > 0 else 50.0
                norm_margin = min(100.0, max(0.0, (c["margin_delta"] / max_margin) * 100.0))
                norm_promo = 85.0 if c["promo"] else 15.0
                norm_affinity = c["cust_affinity"] * 100.0
                norm_stock = min(100.0, (c["stock_avail"] / 50.0) * 100.0)

                # Formula:
                # upsell_score = 35% upgrade_frequency + 25% margin_opportunity + 20% promotion + 10% customer_affinity + 10% stock_availability
                final_score = int(round(
                    0.35 * norm_upgrade +
                    0.25 * norm_margin +
                    0.20 * norm_promo +
                    0.10 * norm_affinity +
                    0.10 * norm_stock
                ))

                # Structured explainability reason
                rate_pct = int(round(c["upgrade_rate"] * 100))
                promo_text = f" An active {int(c['promo'].discount_percent)}% promotion is available." if c["promo"] else ""
                affinity_text = f" {customer_name} has previous purchasing history in this tier." if c["cust_affinity"] > 0.5 else ""
                reason = f"{rate_pct}% of customers purchasing {src.name} later upgraded to {tgt.name}.{affinity_text}{promo_text} Adds ${c['margin_delta']} expected margin."

                ranked_upsell.append({
                    "id": idx,
                    "product_id": tgt.id,
                    "product_name": tgt.name,
                    "type": "UPSELL",
                    "score": final_score,
                    "price": tgt.unit_price,
                    "price_delta": c["price_delta"],
                    "margin_delta": c["margin_delta"],
                    "margin_percent_delta": c["margin_pct_delta"],
                    "promotion": {
                        "name": c["promo"].name,
                        "code": c["promo"].promotion_code,
                        "discount_percent": c["promo"].discount_percent
                    } if c["promo"] else None,
                    "upgrade_rate": round(c["upgrade_rate"], 3),
                    "co_purchase_rate": None,
                    "customer_affinity": round(c["cust_affinity"], 2),
                    "stock_available": c["stock_avail"],
                    "reason": reason
                })

            ranked_upsell.sort(key=lambda x: x["score"], reverse=True)

        # =========================================================
        # 6. CALCULATE CROSS-SELL RECOMMENDATIONS
        # =========================================================
        # Candidates: complementary products from product_relationships (CROSS_SELL),
        # not in quote, stock > 0
        cross_sell_candidates = []

        # Find defined relationships from quote products
        rels = self.db.query(ProductRelationship).filter(
            ProductRelationship.source_product_id.in_(current_product_ids),
            ProductRelationship.relationship_type == "CROSS_SELL"
        ).all()

        seen_targets = set()

        for rel in rels:
            target_pid = rel.target_product_id
            if target_pid in current_product_ids or target_pid in seen_targets:
                continue
            seen_targets.add(target_pid)

            target_prod = self.db.query(Product).filter(Product.id == target_pid).first()
            if not target_prod or not target_prod.is_active:
                continue

            stock_avail = stock_map.get(target_pid, 0)
            # CRITICAL RULE: If stock available == 0, remove candidate
            if stock_avail <= 0:
                continue

            # Calculate co-purchase rate:
            # orders containing source + target / orders containing source
            orders_with_source = [
                oid for oid, pids in order_to_products.items()
                if rel.source_product_id in pids
            ]
            orders_with_both = [
                oid for oid in orders_with_source
                if target_pid in order_to_products[oid]
            ]
            co_purchase_rate = (len(orders_with_both) / len(orders_with_source)) if orders_with_source else 0.0

            # Calculate overall purchase rate for lift
            total_orders = len(all_hist_orders) or 1
            orders_with_target = [oid for oid, pids in order_to_products.items() if target_pid in pids]
            target_pop_rate = len(orders_with_target) / total_orders
            lift = (co_purchase_rate / target_pop_rate) if target_pop_rate > 0 else 1.0

            promo = promo_by_product.get(target_pid)
            margin_delta = target_prod.margin_amount

            cross_sell_candidates.append({
                "relationship": rel,
                "target_product": target_prod,
                "co_purchase_rate": co_purchase_rate,
                "lift": lift,
                "margin_delta": margin_delta,
                "compatibility": rel.strength,
                "promo": promo,
                "stock_avail": stock_avail
            })

        ranked_cross_sell = []
        if cross_sell_candidates:
            max_copurchase = max([c["co_purchase_rate"] for c in cross_sell_candidates] + [0.001])
            max_margin = max([c["margin_delta"] for c in cross_sell_candidates] + [1.0])

            for idx, c in enumerate(cross_sell_candidates, start=1):
                tgt = c["target_product"]
                rel = c["relationship"]
                src_prod = self.db.query(Product).filter(Product.id == rel.source_product_id).first()
                src_name = src_prod.name if src_prod else "quotation products"

                # Normalized component scores (0-100)
                norm_copurchase = min(100.0, (c["co_purchase_rate"] / max_copurchase) * 100.0) if max_copurchase > 0 else 50.0
                norm_compat = min(100.0, c["compatibility"] * 100.0)
                norm_promo = 85.0 if c["promo"] else 15.0
                norm_margin = min(100.0, (c["margin_delta"] / max_margin) * 100.0)
                norm_stock = min(100.0, (c["stock_avail"] / 50.0) * 100.0)

                # Formula:
                # cross_sell_score = 35% co_purchase + 20% compatibility + 15% promotion + 20% margin_opportunity + 10% stock_availability
                final_score = int(round(
                    0.35 * norm_copurchase +
                    0.20 * norm_compat +
                    0.15 * norm_promo +
                    0.20 * norm_margin +
                    0.10 * norm_stock
                ))

                co_pct = int(round(c["co_purchase_rate"] * 100))
                promo_text = f" An active {int(c['promo'].discount_percent)}% promotion is available." if c["promo"] else ""
                reason = f"{co_pct}% of customers purchasing {src_name} also purchased {tgt.name}.{promo_text} Adding this product increases expected margin by ${c['margin_delta']}."

                ranked_cross_sell.append({
                    "id": idx,
                    "product_id": tgt.id,
                    "product_name": tgt.name,
                    "type": "CROSS_SELL",
                    "score": final_score,
                    "price": tgt.unit_price,
                    "price_delta": 0.0,
                    "margin_delta": c["margin_delta"],
                    "margin_percent_delta": 0.0,
                    "promotion": {
                        "name": c["promo"].name,
                        "code": c["promo"].promotion_code,
                        "discount_percent": c["promo"].discount_percent
                    } if c["promo"] else None,
                    "upgrade_rate": None,
                    "co_purchase_rate": round(c["co_purchase_rate"], 3),
                    "customer_affinity": 0.5,
                    "stock_available": c["stock_avail"],
                    "reason": reason
                })

            ranked_cross_sell.sort(key=lambda x: x["score"], reverse=True)

        return {
            "upsell": ranked_upsell,
            "cross_sell": ranked_cross_sell
        }
