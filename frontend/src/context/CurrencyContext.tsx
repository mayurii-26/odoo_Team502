'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'

export interface CurrencyMeta {
  code: string
  symbol: string
  name: string
  decimals: number
  flag: string
}

export const SUPPORTED_CURRENCIES: Record<string, CurrencyMeta> = {
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', decimals: 2, flag: '🇺🇸' },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', decimals: 2, flag: '🇪🇺' },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound', decimals: 2, flag: '🇬🇧' },
  INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee', decimals: 2, flag: '🇮🇳' },
  JPY: { code: 'JPY', symbol: '¥', name: 'Japanese Yen', decimals: 0, flag: '🇯🇵' },
  CAD: { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar', decimals: 2, flag: '🇨🇦' },
  AUD: { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', decimals: 2, flag: '🇦🇺' },
  CHF: { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', decimals: 2, flag: '🇨🇭' },
  CNY: { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', decimals: 2, flag: '🇨🇳' },
  SGD: { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', decimals: 2, flag: '🇸🇬' },
  AED: { code: 'AED', symbol: 'AED', name: 'UAE Dirham', decimals: 2, flag: '🇦🇪' },
}

export const BASELINE_RATES: Record<string, number> = {
  USD: 1.0,
  EUR: 0.924,
  GBP: 0.791,
  INR: 86.82,
  JPY: 154.25,
  CAD: 1.385,
  AUD: 1.542,
  CHF: 0.902,
  CNY: 7.245,
  SGD: 1.354,
  AED: 3.6725,
}

export interface FormatPriceOptions {
  minimumFractionDigits?: number
  maximumFractionDigits?: number
  showCode?: boolean
  compact?: boolean
}

export interface CurrencyContextType {
  currency: string
  setCurrency: (curr: string) => void
  rates: Record<string, number>
  ratesSource: string
  ratesTimestamp: string | null
  ratesLoading: boolean
  refreshRates: () => Promise<void>
  formatPrice: (
    amountInUSD: number,
    targetCurr?: string,
    options?: FormatPriceOptions
  ) => string
  convertAmount: (amount: number, fromCurr: string, toCurr: string) => number
  getRate: (fromCurr: string, toCurr: string) => number
  currencies: Record<string, CurrencyMeta>
  currencyMeta: CurrencyMeta
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined)

const STORAGE_KEY = 'dealflow360_active_currency'

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<string>('USD')
  const [rates, setRates] = useState<Record<string, number>>(BASELINE_RATES)
  const [ratesSource, setRatesSource] = useState<string>('Live Scraped (x-rates.com)')
  const [ratesTimestamp, setRatesTimestamp] = useState<string | null>(null)
  const [ratesLoading, setRatesLoading] = useState<boolean>(false)

  // Load user's preferred currency from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved && SUPPORTED_CURRENCIES[saved]) {
        setCurrencyState(saved)
      }
    } catch {
      // Ignore localStorage errors in SSR or restricted environments
    }
  }, [])

  const setCurrency = useCallback((newCurr: string) => {
    if (SUPPORTED_CURRENCIES[newCurr]) {
      setCurrencyState(newCurr)
      try {
        localStorage.setItem(STORAGE_KEY, newCurr)
      } catch {
        // Ignore
      }
    }
  }, [])

  // Fetch live exchange rates from backend (scraped from x-rates.com with API fallback)
  const refreshRates = useCallback(async () => {
    setRatesLoading(true)
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'
      const res = await fetch(`${apiBase}/api/v1/currency/rates`)
      if (res.ok) {
        const data = await res.json()
        if (data.rawRates && typeof data.rawRates === 'object' && !Array.isArray(data.rawRates)) {
          setRates(prev => ({ ...prev, ...data.rawRates }))
        } else if (Array.isArray(data.rates)) {
          const mapped: Record<string, number> = {}
          data.rates.forEach((r: any) => {
            if (r.code && r.rateAgainstUSD) {
              mapped[r.code] = r.rateAgainstUSD
            }
          })
          setRates(prev => ({ ...prev, ...mapped }))
        } else if (data.rates && typeof data.rates === 'object') {
          setRates(prev => ({ ...prev, ...data.rates }))
        }
        if (data.source) setRatesSource(data.source)
        if (data.last_updated) setRatesTimestamp(data.last_updated)
      }
    } catch (err) {
      console.warn('Unable to load live rates from backend, using baseline rates:', err)
    } finally {
      setRatesLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshRates()
  }, [refreshRates])

  const getRate = useCallback(
    (fromCurr: string, toCurr: string): number => {
      const fromRate = rates[fromCurr] || 1.0
      const toRate = rates[toCurr] || 1.0
      return toRate / fromRate
    },
    [rates]
  )

  const convertAmount = useCallback(
    (amount: number, fromCurr: string, toCurr: string): number => {
      if (fromCurr === toCurr) return amount
      const rate = getRate(fromCurr, toCurr)
      return amount * rate
    },
    [getRate]
  )

  const formatPrice = useCallback(
    (
      amountInUSD: number,
      targetCurr?: string,
      options?: FormatPriceOptions
    ): string => {
      const curr = targetCurr || currency
      const meta = SUPPORTED_CURRENCIES[curr] || SUPPORTED_CURRENCIES.USD
      const rate = rates[curr] || 1.0
      const converted = (amountInUSD || 0) * rate

      const defaultDecimals = meta.decimals
      const minDec = options?.minimumFractionDigits !== undefined ? options.minimumFractionDigits : defaultDecimals
      const maxDec = options?.maximumFractionDigits !== undefined ? options.maximumFractionDigits : defaultDecimals

      // Support compact formatting (e.g. 1.25M)
      if (options?.compact && Math.abs(converted) >= 1_000_000) {
        const inMillions = converted / 1_000_000
        const formatted = `${meta.symbol}${inMillions.toFixed(2)}M`
        return options.showCode ? `${formatted} ${curr}` : formatted
      }

      const formatted = `${meta.symbol}${converted.toLocaleString(undefined, {
        minimumFractionDigits: minDec,
        maximumFractionDigits: maxDec,
      })}`

      return options?.showCode ? `${formatted} ${curr}` : formatted
    },
    [currency, rates]
  )

  const currencyMeta = useMemo(() => {
    return SUPPORTED_CURRENCIES[currency] || SUPPORTED_CURRENCIES.USD
  }, [currency])

  const value = useMemo(
    () => ({
      currency,
      setCurrency,
      rates,
      ratesSource,
      ratesTimestamp,
      ratesLoading,
      refreshRates,
      formatPrice,
      convertAmount,
      getRate,
      currencies: SUPPORTED_CURRENCIES,
      currencyMeta,
    }),
    [
      currency,
      setCurrency,
      rates,
      ratesSource,
      ratesTimestamp,
      ratesLoading,
      refreshRates,
      formatPrice,
      convertAmount,
      getRate,
      currencyMeta,
    ]
  )

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>
}

export function useCurrency(): CurrencyContextType {
  const context = useContext(CurrencyContext)
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider')
  }
  return context
}
