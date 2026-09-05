"""
DealFlow360 — Currency Normalizer Entry Point
Re-exports and runs the Currency Normalizer Layer from app.services.currency_normalizer.
"""

from app.services.currency_normalizer import (
    CurrencyNormalizerLayer,
    currency_normalizer,
    MAJOR_CURRENCIES,
    FALLBACK_USD_RATES,
    run_cli,
)

__all__ = [
    "CurrencyNormalizerLayer",
    "currency_normalizer",
    "MAJOR_CURRENCIES",
    "FALLBACK_USD_RATES",
    "run_cli",
]

if __name__ == "__main__":
    run_cli()
