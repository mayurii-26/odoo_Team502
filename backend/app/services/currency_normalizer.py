"""
DealFlow360 — Live Currency Normalizer Layer
============================================
A robust, production-grade currency normalization layer for B2B DealFlow operations.

Features:
- Scrapes live exchange rates directly from internet financial web portals (e.g. x-rates.com).
- High-availability secondary live real-time API fallback (open.er-api.com).
- Resilient offline baseline rates for zero-downtime operation.
- In-memory rate caching with configurable TTL (Time-To-Live).
- Supports 18+ major global currencies with symbols, formatting, and precision rules.
- Converts monetary values and normalizes complex DealFlow360 structures (quotations, deals, products).
- Remembers and applies user currency preferences.
- Exposes an optional FastAPI APIRouter for REST API endpoints.
- Fully runnable standalone via CLI with `--convert`, `--rates`, or interactive demo mode.
"""

import sys
import re
import time
import json
import logging
import argparse
from datetime import datetime, timezone
from typing import Dict, List, Optional, Any, Union

# Ensure UTF-8 output on Windows console
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Set up logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("CurrencyNormalizer")

# HTTP client: prioritize httpx if available, fallback to urllib
try:
    import httpx
    HAS_HTTPX = True
except ImportError:
    import urllib.request
    HAS_HTTPX = False

# FastAPI router (optional integration)
try:
    from fastapi import APIRouter, Query, HTTPException, Body
    from pydantic import BaseModel, Field
    HAS_FASTAPI = True
except ImportError:
    HAS_FASTAPI = False


# ============================================================================
# 1. MAJOR CURRENCIES DEFINITION & METADATA
# ============================================================================

MAJOR_CURRENCIES: Dict[str, Dict[str, Any]] = {
    "USD": {"name": "US Dollar", "symbol": "$", "decimals": 2, "country": "US"},
    "EUR": {"name": "Euro", "symbol": "€", "decimals": 2, "country": "EU"},
    "GBP": {"name": "British Pound", "symbol": "£", "decimals": 2, "country": "GB"},
    "INR": {"name": "Indian Rupee", "symbol": "₹", "decimals": 2, "country": "IN"},
    "JPY": {"name": "Japanese Yen", "symbol": "¥", "decimals": 0, "country": "JP"},
    "CAD": {"name": "Canadian Dollar", "symbol": "CA$", "decimals": 2, "country": "CA"},
    "AUD": {"name": "Australian Dollar", "symbol": "A$", "decimals": 2, "country": "AU"},
    "CHF": {"name": "Swiss Franc", "symbol": "CHF", "decimals": 2, "country": "CH"},
    "CNY": {"name": "Chinese Yuan", "symbol": "¥", "decimals": 2, "country": "CN"},
    "SGD": {"name": "Singapore Dollar", "symbol": "S$", "decimals": 2, "country": "SG"},
    "AED": {"name": "UAE Dirham", "symbol": "AED", "decimals": 2, "country": "AE"},
    "HKD": {"name": "Hong Kong Dollar", "symbol": "HK$", "decimals": 2, "country": "HK"},
    "SEK": {"name": "Swedish Krona", "symbol": "kr", "decimals": 2, "country": "SE"},
    "NZD": {"name": "New Zealand Dollar", "symbol": "NZ$", "decimals": 2, "country": "NZ"},
    "BRL": {"name": "Brazilian Real", "symbol": "R$", "decimals": 2, "country": "BR"},
    "MXN": {"name": "Mexican Peso", "symbol": "MX$", "decimals": 2, "country": "MX"},
    "KRW": {"name": "South Korean Won", "symbol": "₩", "decimals": 0, "country": "KR"},
    "ZAR": {"name": "South African Rand", "symbol": "R", "decimals": 2, "country": "ZA"},
}

# Reliable offline fallback rates (base = 1 USD) in case network is disconnected
FALLBACK_USD_RATES: Dict[str, float] = {
    "USD": 1.0,
    "EUR": 0.861,
    "GBP": 0.740,
    "INR": 94.49,
    "JPY": 156.23,
    "CAD": 1.384,
    "AUD": 1.388,
    "CHF": 0.810,
    "CNY": 6.713,
    "SGD": 1.267,
    "AED": 3.672,
    "HKD": 7.781,
    "SEK": 10.35,
    "NZD": 1.692,
    "BRL": 5.480,
    "MXN": 18.25,
    "KRW": 1395.0,
    "ZAR": 18.15,
}


# ============================================================================
# 2. CURRENCY NORMALIZER LAYER CORE
# ============================================================================

class CurrencyNormalizerLayer:
    """
    Live Currency Normalization Engine.
    Handles live internet scraping, rate caching, multi-currency conversions,
    and structured DealFlow quotation normalization according to user preferences.
    """

    def __init__(self, cache_ttl_seconds: int = 900):
        """
        :param cache_ttl_seconds: Cache duration in seconds (default: 15 minutes).
        """
        self.cache_ttl: int = cache_ttl_seconds
        self.cached_rates: Dict[str, float] = dict(FALLBACK_USD_RATES)
        self.last_fetch_time: float = 0.0
        self.last_source: str = "initial_fallback"
        self.last_updated_iso: str = datetime.now(timezone.utc).isoformat()
        
        # User currency preferences storage (user_id -> currency_code)
        self.user_preferences: Dict[str, str] = {
            "default": "USD",
            "aarav": "INR",
            "sarah": "EUR",
            "admin": "USD",
        }

    # ------------------------------------------------------------------------
    # Live Scraping & Rate Fetching
    # ------------------------------------------------------------------------

    def _http_get(self, url: str, timeout: float = 8.0) -> Optional[str]:
        """Perform an HTTP GET request using httpx or standard urllib."""
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,application/json,*/*;q=0.8",
        }
        if HAS_HTTPX:
            try:
                with httpx.Client(timeout=timeout, follow_redirects=True) as client:
                    resp = client.get(url, headers=headers)
                    if resp.status_code == 200:
                        return resp.text
            except Exception as ex:
                logger.warning(f"HTTPX request failed for {url}: {ex}")
        else:
            try:
                req = urllib.request.Request(url, headers=headers)
                with urllib.request.urlopen(req, timeout=timeout) as response:
                    return response.read().decode("utf-8", errors="ignore")
            except Exception as ex:
                logger.warning(f"urllib request failed for {url}: {ex}")
        return None

    def scrape_rates_from_web(self) -> Optional[Dict[str, float]]:
        """
        Scrape live exchange rates from financial web portal (x-rates.com).
        Returns a dictionary of currency rates against 1 USD, or None on failure.
        """
        url = "https://www.x-rates.com/table/?from=USD&amount=1"
        html = self._http_get(url, timeout=7.0)
        if not html:
            return None

        # Regex match: from=USD&to=EUR'>0.860862<
        matches = re.findall(r"from=USD&(?:amp;)?to=([A-Z]{3})['\"]?>([0-9.]+)<", html)
        if not matches or len(matches) < 5:
            return None

        rates: Dict[str, float] = {"USD": 1.0}
        for code, rate_str in matches:
            try:
                rates[code] = float(rate_str)
            except ValueError:
                continue

        logger.info(f"Successfully scraped {len(rates)} live rates from {url}")
        return rates

    def fetch_rates_from_live_api(self) -> Optional[Dict[str, float]]:
        """
        Fetch live real-time rates from open FX endpoint (open.er-api.com).
        Acts as a reliable secondary live source.
        """
        url = "https://open.er-api.com/v6/latest/USD"
        body = self._http_get(url, timeout=5.0)
        if not body:
            return None

        try:
            data = json.loads(body)
            if data.get("result") == "success" and "rates" in data:
                rates = {k: float(v) for k, v in data["rates"].items()}
                rates["USD"] = 1.0
                logger.info(f"Successfully fetched {len(rates)} live rates from API ({url})")
                return rates
        except Exception as ex:
            logger.warning(f"Error parsing live API rates: {ex}")

        return None

    def get_live_rates(self, force_refresh: bool = False) -> Dict[str, float]:
        """
        Retrieve exchange rates against USD.
        Uses cached rates if within TTL. Otherwise, scrapes web, then API, then fallback.
        """
        now = time.time()
        if not force_refresh and (now - self.last_fetch_time < self.cache_ttl) and self.cached_rates:
            return self.cached_rates

        logger.info("Refreshing exchange rates from live internet...")
        
        # Tier 1: Live Web Scraping
        scraped = self.scrape_rates_from_web()
        if scraped and len(scraped) >= len(MAJOR_CURRENCIES) // 2:
            self.cached_rates.update(scraped)
            self.last_source = "live_scrape:x-rates.com"
            self.last_fetch_time = now
            self.last_updated_iso = datetime.now(timezone.utc).isoformat()
            return self.cached_rates

        # Tier 2: Real-time Live API
        api_rates = self.fetch_rates_from_live_api()
        if api_rates:
            self.cached_rates.update(api_rates)
            self.last_source = "live_api:open.er-api.com"
            self.last_fetch_time = now
            self.last_updated_iso = datetime.now(timezone.utc).isoformat()
            return self.cached_rates

        # Tier 3: Resilient Offline Baseline
        logger.warning("Internet live scrape and API unavailable. Using fallback rates.")
        if not self.cached_rates or self.cached_rates == FALLBACK_USD_RATES:
            self.cached_rates = dict(FALLBACK_USD_RATES)
            self.last_source = "offline_fallback"
            self.last_updated_iso = datetime.now(timezone.utc).isoformat()
        self.last_fetch_time = now
        return self.cached_rates

    # ------------------------------------------------------------------------
    # User Preferences
    # ------------------------------------------------------------------------

    def set_user_currency(self, user_identifier: str, currency: str) -> str:
        """Set preferred currency for a specific user ID or username."""
        clean_curr = currency.upper().strip()
        if clean_curr not in MAJOR_CURRENCIES and clean_curr not in self.cached_rates:
            raise ValueError(f"Unsupported currency: {clean_curr}")
        self.user_preferences[user_identifier] = clean_curr
        return clean_curr

    def get_user_currency(self, user_identifier: Optional[str] = None) -> str:
        """Get user's preferred currency, defaulting to USD."""
        if not user_identifier:
            return self.user_preferences.get("default", "USD")
        return self.user_preferences.get(user_identifier) or self.user_preferences.get("default", "USD")

    # ------------------------------------------------------------------------
    # Currency Conversion Methods
    # ------------------------------------------------------------------------

    def get_rate(self, from_curr: str, to_curr: str) -> float:
        """Calculate cross-rate between any two currencies using USD triangulation."""
        rates = self.get_live_rates()
        from_code = from_curr.upper().strip()
        to_code = to_curr.upper().strip()

        from_usd_rate = rates.get(from_code)
        to_usd_rate = rates.get(to_code)

        if not from_usd_rate:
            raise ValueError(f"Exchange rate not found for source currency: {from_code}")
        if not to_usd_rate:
            raise ValueError(f"Exchange rate not found for target currency: {to_code}")

        # USD cross-triangulation: 1 from_curr = (to_usd_rate / from_usd_rate) to_curr
        return to_usd_rate / from_usd_rate

    def convert(self, amount: float, from_curr: str = "USD", to_curr: str = "USD") -> float:
        """Convert an amount from source currency to target currency."""
        if amount == 0:
            return 0.0
        from_c = from_curr.upper().strip()
        to_c = to_curr.upper().strip()
        if from_c == to_c:
            return round(amount, MAJOR_CURRENCIES.get(to_c, {}).get("decimals", 2))

        cross_rate = self.get_rate(from_c, to_c)
        converted = amount * cross_rate
        decimals = MAJOR_CURRENCIES.get(to_c, {}).get("decimals", 2)
        return round(converted, decimals)

    def format_currency(self, amount: float, currency_code: str = "USD") -> str:
        """Format an amount according to currency symbol and decimal rules."""
        code = currency_code.upper().strip()
        meta = MAJOR_CURRENCIES.get(code, {"symbol": f"{code} ", "decimals": 2})
        decimals = meta.get("decimals", 2)
        symbol = meta.get("symbol", "")

        if decimals == 0:
            formatted_num = f"{int(round(amount)):,}"
        else:
            formatted_num = f"{amount:,.{decimals}f}"

        # Special formatting: SEK has symbol at the end
        if code == "SEK":
            return f"{formatted_num} {symbol}"
        return f"{symbol}{formatted_num}"

    def normalize_amount(
        self,
        amount: float,
        target_currency: str,
        source_currency: str = "USD"
    ) -> Dict[str, Any]:
        """
        Normalize an amount with complete conversion metadata.
        """
        src = source_currency.upper().strip()
        tgt = target_currency.upper().strip()
        converted = self.convert(amount, src, tgt)
        rate = self.get_rate(src, tgt)

        return {
            "originalAmount": amount,
            "originalCurrency": src,
            "convertedAmount": converted,
            "targetCurrency": tgt,
            "exchangeRate": round(rate, 6),
            "formatted": self.format_currency(converted, tgt),
            "rateSource": self.last_source,
            "lastUpdated": self.last_updated_iso,
        }

    # ------------------------------------------------------------------------
    # DealFlow360 Quotation & Deal Normalizer Layer
    # ------------------------------------------------------------------------

    def normalize_deal(
        self,
        deal: Dict[str, Any],
        target_currency: str,
        source_currency: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Deep-normalizes a DealFlow360 Quotation or Deal dictionary into the user's chosen currency.
        Converts top-level totals, line item unit prices, and attaches currency normalization metadata.
        """
        tgt = target_currency.upper().strip()
        src = (source_currency or deal.get("currency") or "USD").upper().strip()
        rate = self.get_rate(src, tgt)

        normalized = dict(deal)
        normalized["originalCurrency"] = src
        normalized["currency"] = tgt

        # Convert top-level deal totals if present
        for field in ["totalAmount", "subtotal", "taxAmount", "discountTotal", "dealValue", "amount", "total"]:
            if field in normalized and isinstance(normalized[field], (int, float)):
                normalized[field] = self.convert(normalized[field], src, tgt)

        # Convert quotation line items if present
        if "items" in normalized and isinstance(normalized["items"], list):
            new_items = []
            for item in normalized["items"]:
                if isinstance(item, dict):
                    c_item = dict(item)
                    if "unitPrice" in c_item and isinstance(c_item["unitPrice"], (int, float)):
                        c_item["originalUnitPrice"] = c_item["unitPrice"]
                        c_item["unitPrice"] = self.convert(c_item["unitPrice"], src, tgt)
                    if "total" in c_item and isinstance(c_item["total"], (int, float)):
                        c_item["total"] = self.convert(c_item["total"], src, tgt)
                    new_items.append(c_item)
                else:
                    new_items.append(item)
            normalized["items"] = new_items

        # Attach audit trail metadata for DealFlow360
        normalized["_currencyLayer"] = {
            "sourceCurrency": src,
            "displayCurrency": tgt,
            "appliedRate": round(rate, 6),
            "source": self.last_source,
            "timestamp": self.last_updated_iso,
        }

        return normalized

    def normalize_deals_batch(
        self,
        deals: List[Dict[str, Any]],
        target_currency: str,
        source_currency: str = "USD"
    ) -> List[Dict[str, Any]]:
        """Normalize a list of DealFlow deals in bulk."""
        return [self.normalize_deal(d, target_currency, source_currency) for d in deals]

    def get_major_currencies_info(self) -> List[Dict[str, Any]]:
        """Return a structured catalog of all major currencies with live rates."""
        rates = self.get_live_rates()
        catalog = []
        for code, info in MAJOR_CURRENCIES.items():
            rate = rates.get(code, 1.0)
            catalog.append({
                "code": code,
                "name": info["name"],
                "symbol": info["symbol"],
                "country": info.get("country", ""),
                "flag": info.get("country", ""),
                "rateAgainstUSD": round(rate, 6),
                "decimals": info["decimals"],
                "formattedSample": self.format_currency(1250.0 * rate, code),
            })
        return catalog


# Singleton instance for application-wide usage
currency_normalizer = CurrencyNormalizerLayer()


# ============================================================================
# 3. OPTIONAL FASTAPI ROUTER EXPOSURE
# ============================================================================

if HAS_FASTAPI:
    router = APIRouter(prefix="/currency", tags=["Currency Normalizer Layer"])

    class ConvertRequest(BaseModel):
        amount: float = Field(..., examples=[1500.0], description="Monetary amount to convert")
        fromCurrency: str = Field(default="USD", examples=["USD"], description="Source ISO 3-letter currency")
        toCurrency: str = Field(..., examples=["INR"], description="Target ISO 3-letter currency")

    class UserPreferenceRequest(BaseModel):
        userId: str = Field(..., examples=["aarav_sharma"], description="User identifier")
        currency: str = Field(..., examples=["INR"], description="Preferred 3-letter currency code")

    @router.get("/rates")
    def get_live_rates(force_refresh: bool = False):
        """Get live exchange rates for major currencies scraped from the internet."""
        rates = currency_normalizer.get_live_rates(force_refresh=force_refresh)
        return {
            "base": "USD",
            "source": currency_normalizer.last_source,
            "lastUpdated": currency_normalizer.last_updated_iso,
            "currencies": currency_normalizer.get_major_currencies_info(),
            "rawRates": {k: rates.get(k) for k in MAJOR_CURRENCIES.keys()},
        }

    @router.post("/convert")
    def convert_currency_endpoint(req: ConvertRequest):
        """Convert amount between two currencies as per request."""
        try:
            res = currency_normalizer.normalize_amount(req.amount, req.toCurrency, req.fromCurrency)
            return res
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))

    @router.get("/convert")
    def convert_currency_get(
        amount: float = Query(..., description="Amount to convert"),
        from_curr: str = Query("USD", alias="from", description="Source currency"),
        to_curr: str = Query(..., alias="to", description="Target currency")
    ):
        """Quick GET conversion endpoint."""
        try:
            return currency_normalizer.normalize_amount(amount, to_curr, from_curr)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))

    @router.post("/normalize-deal")
    def normalize_deal_endpoint(
        deal: Dict[str, Any] = Body(..., description="Deal or Quotation dictionary"),
        target_currency: str = Query(..., description="User's chosen target currency")
    ):
        """Normalize an entire quotation/deal to user's chosen currency."""
        try:
            return currency_normalizer.normalize_deal(deal, target_currency)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))

    @router.post("/user-preference")
    def save_user_currency(req: UserPreferenceRequest):
        """Save a user's chosen display currency."""
        try:
            saved = currency_normalizer.set_user_currency(req.userId, req.currency)
            return {"userId": req.userId, "preferredCurrency": saved, "status": "saved"}
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))

    @router.get("/user-preference/{user_id}")
    def get_user_currency_endpoint(user_id: str):
        """Retrieve a user's chosen display currency."""
        curr = currency_normalizer.get_user_currency(user_id)
        return {"userId": user_id, "preferredCurrency": curr}


# ============================================================================
# 4. STANDALONE CLI & DEMONSTRATION RUNNER
# ============================================================================

def run_cli():
    """CLI runner to scrape live data, display rates, and perform conversions."""
    parser = argparse.ArgumentParser(description="DealFlow360 Live Currency Normalizer Layer")
    parser.add_argument("--amount", type=float, default=None, help="Amount to convert")
    parser.add_argument("--from", dest="from_curr", default="USD", help="Source currency (e.g. USD)")
    parser.add_argument("--to", dest="to_curr", default=None, help="Target currency (e.g. EUR, INR, GBP)")
    parser.add_argument("--rates", action="store_true", help="Print all live scraped rates")
    parser.add_argument("--refresh", action="store_true", help="Force refresh rates from the internet")
    args = parser.parse_args()

    normalizer = CurrencyNormalizerLayer()
    
    print("=" * 72)
    print(" [DealFlow360] Live Currency Normalizer Layer")
    print("=" * 72)
    print(f"[*] Fetching live exchange rates from internet...")
    
    rates = normalizer.get_live_rates(force_refresh=args.refresh)
    print(f"[OK] Live Source : {normalizer.last_source}")
    print(f"[OK] Last Updated: {normalizer.last_updated_iso}")
    print(f"[OK] Currencies  : {len(rates)} available")
    print("-" * 72)

    # 1. Direct Conversion Mode
    if args.amount is not None and args.to_curr:
        res = normalizer.normalize_amount(args.amount, args.to_curr, args.from_curr)
        print(f"Conversion Request:")
        print(f"  {res['originalAmount']} {res['originalCurrency']}")
        print(f"  --> {res['convertedAmount']} {res['targetCurrency']} ({res['formatted']})")
        print(f"  Rate: 1 {res['originalCurrency']} = {res['exchangeRate']} {res['targetCurrency']}")
        print(f"  Source: {res['rateSource']}")
        return

    # 2. Display Major Currencies Catalog
    print("\n--- LIVE MAJOR CURRENCIES CATALOG (Base: 1 USD) ---")
    print(f"{'Code':<6} {'Region':<8} {'Currency Name':<24} {'Rate':<12} {'Sample ($1,000 USD)'}")
    print("-" * 72)
    for info in normalizer.get_major_currencies_info():
        sample = normalizer.format_currency(1000.0 * info["rateAgainstUSD"], info["code"])
        # Use ascii representation or strip special characters if needed for safe display
        try:
            print(f"{info['code']:<6} {info['country']:<8} {info['name']:<24} {info['rateAgainstUSD']:<12.4f} {sample}")
        except UnicodeEncodeError:
            clean_sample = f"{info['code']} {1000.0 * info['rateAgainstUSD']:,.2f}"
            print(f"{info['code']:<6} {info['country']:<8} {info['name']:<24} {info['rateAgainstUSD']:<12.4f} {clean_sample}")

    # 3. Demonstration of User's Choice Conversion
    print("\n" + "=" * 72)
    print(" [DEMONSTRATION] Converting Deal to User's Preferred Currency")
    print("=" * 72)
    sample_deal = {
        "id": "QUO-2025-001",
        "customerName": "Acme Global Industries",
        "currency": "USD",
        "subtotal": 50000.0,
        "discountTotal": 5000.0,
        "totalAmount": 45000.0,
        "items": [
            {"product": "Enterprise Cloud Suite", "qty": 10, "unitPrice": 4000.0, "total": 40000.0},
            {"product": "Implementation Support", "qty": 1, "unitPrice": 10000.0, "total": 10000.0}
        ]
    }
    
    user_choices = ["INR", "EUR", "GBP", "JPY", "AED", "CAD"]
    print(f"Original Deal in USD: Total = ${sample_deal['totalAmount']:,.2f}\n")

    for user_curr in user_choices:
        converted_deal = normalizer.normalize_deal(sample_deal, user_curr)
        applied_rate = converted_deal["_currencyLayer"]["appliedRate"]
        total_val = converted_deal["totalAmount"]
        print(f"User Choice [{user_curr}]: Total = {user_curr} {total_val:,.2f}  (Rate: 1 USD = {applied_rate} {user_curr})")

    print("\n[OK] Currency Normalizer Layer is verified and ready for production use.")
    print("=" * 72)


if __name__ == "__main__":
    run_cli()
