'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import styles from './QuotationDetailWireframe.module.css'
import {
  Quotation,
  Product,
  ActiveModule,
  UserSession,
  UserAccount,
  UserRole,
  WorkflowAuditEntry,
  Recommendation,
  RecommendationWeights,
  QuotationRecommendedItem,
} from './types'
import { generateRecommendations, DEFAULT_RECOMMENDATION_WEIGHTS } from './recommendationEngine'
import { INITIAL_PRODUCTS, INITIAL_HISTORICAL_ORDERS, INITIAL_WAREHOUSES } from './mockData'
import { saveFullQuotationToDb, createFullQuotationInDb } from '../lib/api'
import { exportQuotationPDF } from '../lib/pdfGenerator'
import { useCurrency } from '@/context/CurrencyContext'

interface QuotationBuilderProps {
  quotation?: Quotation | null
  products: Product[]
  onUpdateQuotation: (updated: Quotation) => void
  onNavigate: (module: ActiveModule) => void
  onShowToast: (msg: string) => void
  readOnly?: boolean
  currentUser?: UserSession
  users?: UserAccount[]
  onRecordAudit?: (entry: any) => void
}

interface BuilderLineItem {
  id: string
  productId: string
  name: string
  category: string
  qty: number
  unitPrice: number
  discountPct: number
  costPrice: number
  limit: number
}

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000').replace('localhost:8000', '127.0.0.1:8000')

const CURRENCY_CONFIG: Record<string, { symbol: string; name: string; decimals: number }> = {
  USD: { symbol: '$', name: 'US Dollar', decimals: 2 },
  EUR: { symbol: '€', name: 'Euro', decimals: 2 },
  GBP: { symbol: '£', name: 'British Pound', decimals: 2 },
  INR: { symbol: '₹', name: 'Indian Rupee', decimals: 2 },
  JPY: { symbol: '¥', name: 'Japanese Yen', decimals: 0 },
  CAD: { symbol: 'CA$', name: 'Canadian Dollar', decimals: 2 },
  AUD: { symbol: 'A$', name: 'Australian Dollar', decimals: 2 },
  AED: { symbol: 'AED ', name: 'UAE Dirham', decimals: 2 },
  CHF: { symbol: 'CHF ', name: 'Swiss Franc', decimals: 2 },
  SGD: { symbol: 'S$', name: 'Singapore Dollar', decimals: 2 },
}

const DEFAULT_RATES: Record<string, number> = {
  USD: 1.0,
  EUR: 0.8609,
  GBP: 0.7399,
  INR: 94.4898,
  JPY: 156.234,
  CAD: 1.3837,
  AUD: 1.3885,
  AED: 3.6725,
  CHF: 0.8099,
  SGD: 1.2669,
}

function getDefaultValidUntil(): string {
  const d = new Date()
  d.setDate(d.getDate() + 30)
  return d.toISOString().split('T')[0]
}

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  )
}

function SaveIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  )
}

function SendIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  )
}

function ArrowLeftIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  )
}

export default function QuotationBuilderModule({
  quotation,
  products,
  onUpdateQuotation,
  onNavigate,
  onShowToast,
  readOnly = false,
  currentUser,
  users,
  onRecordAudit,
}: QuotationBuilderProps) {
  const isNewQuotation = !quotation || !quotation.id || quotation.id === 'new'

  const {
    currency: globalCurrency,
    setCurrency: setGlobalCurrency,
    rates: globalRates,
    formatPrice: contextFormatPrice,
  } = useCurrency()

  const [customer, setCustomer] = useState(quotation?.customerName || '')
  const [assignedRep, setAssignedRep] = useState<string>(quotation?.salesRep || currentUser?.fullName || '')
  const [currency, setCurrency] = useState<string>(quotation?.currency || globalCurrency || 'USD')
  const [priceList, setPriceList] = useState('Commercial Standard')
  const [validUntil, setValidUntil] = useState(quotation?.validUntil || getDefaultValidUntil())
  const [notes, setNotes] = useState(quotation?.managerComment || '')
  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || '')
  const [isSaving, setIsSaving] = useState(false)

  // Keep local currency synced with workspace screen currency
  useEffect(() => {
    if (globalCurrency) {
      setCurrency(globalCurrency)
    }
  }, [globalCurrency])

  const exchangeRates = globalRates || DEFAULT_RATES
  const currentRate = exchangeRates[currency] || 1.0

  const formatPrice = useCallback((amountInUSD: number, targetCurr: string = currency) => {
    return contextFormatPrice(amountInUSD, targetCurr)
  }, [contextFormatPrice, currency])

  // Workflow reporting and tagging states
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false)
  const [targetManager, setTargetManager] = useState<string>(quotation?.reportingManager || '')
  const [isFinanceTagged, setIsFinanceTagged] = useState<boolean>(!!quotation?.taggedFinanceOfficer)
  const [taggedFinance, setTaggedFinance] = useState<string>(quotation?.taggedFinanceOfficer || '')
  const [submissionNotes, setSubmissionNotes] = useState<string>(quotation?.managerComment || '')

  const availableReps = useMemo(() => {
    if (users && users.length > 0) {
      const reps = users.filter(u => (u.role || '').toLowerCase().includes('rep') || (u.role || '').toLowerCase().includes('sales'))
      if (reps.length > 0) return reps
    }
    return []
  }, [users])

  const availableManagers = useMemo(() => {
    if (users && users.length > 0) {
      const mgrs = users.filter(u => (u.role || '').toLowerCase().includes('manager'))
      if (mgrs.length > 0) return mgrs
    }
    return []
  }, [users])

  const availableFinance = useMemo(() => {
    if (users && users.length > 0) {
      const fin = users.filter(u => (u.role || '').toLowerCase().includes('finance') || (u.role || '').toLowerCase().includes('treasury'))
      if (fin.length > 0) return fin
    }
    return []
  }, [users])

  // Map incoming quotation items dynamically from DB, or empty for new quote
  const [lines, setLines] = useState<BuilderLineItem[]>(() => {
    if (quotation?.items && quotation.items.length > 0) {
      return quotation.items.map((it, idx) => ({
        id: it.id || `line-${idx + 1}`,
        productId: it.productId || String(idx + 1),
        name: it.name || 'Product Item',
        category: it.category || 'Hardware',
        qty: it.qty || 1,
        unitPrice: it.unitPrice || 0,
        discountPct: it.discountPct || 0,
        costPrice: it.costPrice || (it.unitPrice ? it.unitPrice * 0.65 : 0),
        limit: 15,
      }))
    }
    return []
  })

  // Optional recommendations attached to this quotation by Sales Rep for customer selection
  const [attachedRecommendations, setAttachedRecommendations] = useState<QuotationRecommendedItem[]>(() => {
    return quotation?.recommendedItems || []
  })

  useEffect(() => {
    if (quotation?.recommendedItems) {
      setAttachedRecommendations(quotation.recommendedItems)
    }
  }, [quotation?.id, quotation?.recommendedItems])

  const attachedRecommendationsTotal = useMemo(() => {
    return attachedRecommendations.reduce((acc, it) => {
      const disc = it.discountPct ? it.unitPrice * (it.discountPct / 100) : 0
      return acc + (it.unitPrice - disc)
    }, 0)
  }, [attachedRecommendations])

  // Recommendation scoring weights from Admin configuration or localStorage
  const [weights, setWeights] = useState<RecommendationWeights>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('dealflow_recommendation_weights')
        if (saved) return JSON.parse(saved)
      } catch {}
    }
    return DEFAULT_RECOMMENDATION_WEIGHTS
  })
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Admin weight modal state
  const [isWeightModalOpen, setIsWeightModalOpen] = useState(false)
  const [tempWeights, setTempWeights] = useState<RecommendationWeights>(weights)
  const [weightsSaving, setWeightsSaving] = useState(false)
  const [weightsError, setWeightsError] = useState('')

  // Load configured weights from backend if available
  useEffect(() => {
    let isMounted = true
    async function loadWeights() {
      try {
        const res = await fetch(`${API_BASE}/api/admin/recommendation-weights`)
        if (res.ok) {
          const data = await res.json()
          if (data && isMounted) {
            setWeights(data)
            setTempWeights(data)
            if (typeof window !== 'undefined') {
              localStorage.setItem('dealflow_recommendation_weights', JSON.stringify(data))
            }
          }
        }
      } catch {}
    }
    loadWeights()
    return () => {
      isMounted = false
    }
  }, [])

  // Sync state whenever the selected quotation prop updates
  useEffect(() => {
    if (quotation && quotation.id && quotation.id !== 'new') {
      setCustomer(quotation.customerName || '')
      setValidUntil(quotation.validUntil || getDefaultValidUntil())
      setNotes(quotation.managerComment || '')
      if (quotation.items && quotation.items.length > 0) {
        setLines(
          quotation.items.map((it, idx) => ({
            id: it.id || `line-${idx + 1}`,
            productId: it.productId || String(idx + 1),
            name: it.name,
            category: it.category || 'Hardware',
            qty: it.qty || 1,
            unitPrice: it.unitPrice || 0,
            discountPct: it.discountPct || 0,
            costPrice: it.costPrice || (it.unitPrice ? it.unitPrice * 0.65 : 0),
            limit: 15,
          }))
        )
      } else {
        setLines([])
      }
    } else {
      // Clean slate for new quotation
      setCustomer('')
      setValidUntil(getDefaultValidUntil())
      setNotes('')
      setLines([])
    }
  }, [quotation?.id])

  // Combined Catalog ensuring all prompt and backend products are available
  const availableProducts = useMemo(() => {
    const list = [...products]
    INITIAL_PRODUCTS.forEach(ip => {
      if (!list.some(p => p.id === ip.id || p.name.toLowerCase() === ip.name.toLowerCase())) {
        list.push(ip)
      }
    })
    return list
  }, [products])

  // Deterministic Recommendation Engine calculation from live quotation context
  const recommendations = useMemo(() => {
    return generateRecommendations({
      customerId: customer,
      customerName: customer,
      quoteProductIds: lines.map(l => l.productId),
      quoteLines: lines.map(l => ({
        id: l.id,
        productId: l.productId,
        name: l.name,
        category: (l.category as any) || 'Hardware',
        type: 'one_time',
        qty: l.qty,
        unitPrice: l.unitPrice,
        discountPct: l.discountPct,
        costPrice: l.costPrice,
      })),
      products: availableProducts,
      historicalOrders: INITIAL_HISTORICAL_ORDERS,
      warehouses: INITIAL_WAREHOUSES,
      weights: weights || DEFAULT_RECOMMENDATION_WEIGHTS,
    })
  }, [lines, customer, availableProducts, weights])

  // Financial calculations
  const { subtotal, totalDiscount, netAmount, taxAmount, grandTotal, totalCost, grossMargin, marginPct, hasOverLimit } =
    useMemo(() => {
      let sub = 0
      let disc = 0
      let cost = 0
      let overLimit = false

      lines.forEach(line => {
        const lineGross = line.qty * line.unitPrice
        const lineDisc = lineGross * (line.discountPct / 100)
        sub += lineGross
        disc += lineDisc
        cost += line.qty * line.costPrice
        if (line.discountPct > line.limit) {
          overLimit = true
        }
      })

      const net = sub - disc
      const tax = net * 0.08
      const total = net + tax
      const margin = net - cost
      const mPct = net > 0 ? (margin / net) * 100 : 0

      return {
        subtotal: sub,
        totalDiscount: disc,
        netAmount: net,
        taxAmount: tax,
        grandTotal: total,
        totalCost: cost,
        grossMargin: margin,
        marginPct: mPct,
        hasOverLimit: overLimit,
      }
    }, [lines])

  // Line item modifications
  function updateLine(id: string, field: 'qty' | 'unitPrice' | 'discountPct', value: number) {
    setLines(prev =>
      prev.map(item => {
        if (item.id === id) {
          return { ...item, [field]: Math.max(0, value) }
        }
        return item
      })
    )
  }

  function handleRemoveLine(id: string) {
    setLines(prev => prev.filter(l => l.id !== id))
    onShowToast('Line item removed.')
  }

  function handleAddProductFromCatalog() {
    const prod = availableProducts.find(p => p.id === selectedProductId) || availableProducts[0]
    if (!prod) return

    const newLine: BuilderLineItem = {
      id: `line-${Date.now()}`,
      productId: prod.id,
      name: prod.name,
      category: prod.category,
      qty: 1,
      unitPrice: prod.unitPrice,
      discountPct: 0,
      costPrice: prod.costPrice,
      limit: 15,
    }
    setLines(prev => [...prev, newLine])
    onShowToast(`Added ${prod.name} to quotation.`)
  }

  // Handle attaching / detaching recommendation as an optional item on the quotation
  function handleToggleAttachRecommendation(item: Recommendation) {
    const isAlreadyAttached = attachedRecommendations.some(r => r.productId === item.productId)
    if (isAlreadyAttached) {
      setAttachedRecommendations(prev => prev.filter(r => r.productId !== item.productId))
      onShowToast(`Removed ${item.productName} from quote recommendations.`)
    } else {
      const newRecItem: QuotationRecommendedItem = {
        id: `rec-${item.productId}-${Date.now()}`,
        productId: item.productId,
        name: item.productName,
        category: (item.category as any) || (item.type === 'UPSELL' ? 'Hardware' : 'Services'),
        type: item.type,
        unitPrice: item.price,
        costPrice: item.costPrice,
        discountPct: item.promotionDiscountPct || 0,
        reason: item.reasons.join(' • '),
        score: item.score,
        marginImpact: item.marginImpactTotal,
        customerAccepted: false,
        addedByRep: true,
      }
      setAttachedRecommendations(prev => [...prev, newRecItem])
      onShowToast(`Attached ${item.productName} as an optional recommendation for customer.`)
    }
  }

  function handleRemoveAttachedRecommendation(recId: string) {
    setAttachedRecommendations(prev => prev.filter(r => r.id !== recId))
    onShowToast('Removed recommendation from quotation.')
  }

  // Save weights to backend admin endpoint and sync localStorage
  async function handleSaveWeights() {
    if (!tempWeights) return
    const upsellSum = Object.values(tempWeights.upsell).reduce((a, b) => a + b, 0)
    const crossSum = Object.values(tempWeights.cross_sell).reduce((a, b) => a + b, 0)

    if (Math.abs(upsellSum - 100) > 0.01 || Math.abs(crossSum - 100) > 0.01) {
      setWeightsError(
        `Both Upsell and Cross-Sell models must total exactly 100%. Current: Upsell ${upsellSum.toFixed(0)}%, Cross-Sell ${crossSum.toFixed(0)}%`
      )
      return
    }

    setWeightsSaving(true)
    setWeightsError('')
    try {
      setWeights(tempWeights)
      if (typeof window !== 'undefined') {
        localStorage.setItem('dealflow_recommendation_weights', JSON.stringify(tempWeights))
      }
      await fetch(`${API_BASE}/api/admin/recommendation-weights`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tempWeights),
      }).catch(() => null)

      setIsWeightModalOpen(false)
      onShowToast('Scoring weights saved! Recommendation rankings recalculated.')
    } catch (err) {
      setWeightsError('Failed to save weights to backend.')
    } finally {
      setWeightsSaving(false)
    }
  }

  function handleAddUpsell(prod: Product, defaultDiscount = 0) {
    const newLine: BuilderLineItem = {
      id: `upsell-${Date.now()}`,
      productId: prod.id,
      name: prod.name,
      category: prod.category,
      qty: 1,
      unitPrice: prod.unitPrice,
      discountPct: defaultDiscount,
      costPrice: prod.costPrice,
      limit: 15,
    }
    setLines(prev => [...prev, newLine])
    onShowToast(`Added ${prod.name} to quotation!`)
  }

  // Persist to Live PostgreSQL Database
  async function handleSave(statusTarget: 'Draft' | 'Under Review' | 'Negotiating', customReportingNotes?: string) {
    if (!customer.trim()) {
      onShowToast('Please enter a Customer Account name before saving.')
      return
    }

    if (lines.length === 0) {
      onShowToast('Please add at least one line item to the quotation before saving.')
      return
    }

    setIsSaving(true)
    const backendStatus =
      statusTarget === 'Under Review' ? 'PENDING_APPROVAL' :
        statusTarget === 'Negotiating' ? 'SENT' : 'DRAFT'

    const effectiveNotes = customReportingNotes !== undefined ? customReportingNotes : notes

    const payload = {
      customer_name: customer.trim(),
      customer_company: customer.trim(),
      status: backendStatus,
      notes: effectiveNotes,
      sales_rep_name: assignedRep,
      lines: lines.map(l => ({
        product_id: parseInt(l.productId) || undefined,
        product_name: l.name,
        quantity: l.qty,
        unit_price: l.unitPrice,
        discount_percent: l.discountPct,
        unit_cost: l.costPrice,
      })),
    }

    const workflowData = statusTarget === 'Under Review' ? {
      assignedRep,
      reportingManager: targetManager,
      taggedFinanceOfficer: isFinanceTagged ? taggedFinance : undefined,
      submittedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric', year: 'numeric' }),
      status: 'Pending Manager' as const,
      managerStatus: 'Pending' as const,
      financeStatus: isFinanceTagged ? ('Pending' as const) : ('Not Required' as const),
      managerNotes: effectiveNotes,
    } : quotation?.approvalWorkflow

    try {
      if (isNewQuotation) {
        // Persist new quotation to DB
        const savedResult = await createFullQuotationInDb(payload)
        const generatedId =
          savedResult?.quote_number ||
          (savedResult?.id ? `Q-${savedResult.id}` : `Q-${Math.floor(1050 + Math.random() * 8900)}`)

        const newQuotation: Quotation = {
          id: String(generatedId),
          customerName: customer.trim(),
          dealName: `${customer.trim()} - $${grandTotal.toLocaleString()}`,
          customerTier: 'Gold',
          salesRep: assignedRep,
          reportingManager: targetManager,
          taggedFinanceOfficer: isFinanceTagged ? taggedFinance : undefined,
          approvalWorkflow: workflowData,
          status: statusTarget,
          createdAt: new Date().toISOString().split('T')[0],
          validUntil: validUntil,
          managerComment: effectiveNotes,
          blendedRiskScore: marginPct >= 40 ? 92 : marginPct >= 25 ? 78 : 50,
          riskLevel: marginPct >= 40 ? 'Low' : marginPct >= 25 ? 'Medium' : 'High',
          items: lines.map(l => ({
            id: l.id,
            productId: l.productId,
            name: l.name,
            category: (l.category as any) || 'Hardware',
            type: 'one_time',
            qty: l.qty,
            unitPrice: l.unitPrice,
            discountPct: l.discountPct,
            costPrice: l.costPrice,
          })),
          recommendedItems: attachedRecommendations,
        }

        onUpdateQuotation(newQuotation)

        if (onRecordAudit) {
          onRecordAudit({
            actorName: currentUser?.fullName || assignedRep,
            actorRole: currentUser?.role || 'sales_rep',
            actionType: statusTarget === 'Under Review' ? 'APPROVAL_REQUESTED' : 'QUOTE_CREATED',
            targetQuotationId: newQuotation.id,
            customerName: customer.trim(),
            details: statusTarget === 'Under Review'
              ? `Reported to ${targetManager}${isFinanceTagged ? ` [Tagged Finance: ${taggedFinance}]` : ''}. Notes: ${effectiveNotes || 'Volume concession request'}`
              : `Created draft quotation with value $${grandTotal.toLocaleString()}`,
          })
        }

        if (statusTarget === 'Under Review') {
          onShowToast(`Quotation ${newQuotation.id} reported to ${targetManager}${isFinanceTagged ? ' & tagged Finance' : ''}!`)
        } else {
          onShowToast(`Quotation ${newQuotation.id} created and saved as Draft!`)
        }
        onNavigate('quotations')
      } else {
        // Update existing quotation in DB
        await saveFullQuotationToDb(quotation!.id, payload)

        const updatedQuotation: Quotation = {
          ...quotation!,
          customerName: customer.trim(),
          dealName: `${customer.trim()} - $${grandTotal.toLocaleString()}`,
          salesRep: assignedRep,
          reportingManager: targetManager,
          taggedFinanceOfficer: isFinanceTagged ? taggedFinance : undefined,
          approvalWorkflow: workflowData,
          status: statusTarget,
          validUntil: validUntil,
          managerComment: effectiveNotes,
          blendedRiskScore: marginPct >= 40 ? 92 : marginPct >= 25 ? 78 : 50,
          riskLevel: marginPct >= 40 ? 'Low' : marginPct >= 25 ? 'Medium' : 'High',
          items: lines.map(l => ({
            id: l.id,
            productId: l.productId,
            name: l.name,
            category: (l.category as any) || 'Hardware',
            type: 'one_time',
            qty: l.qty,
            unitPrice: l.unitPrice,
            discountPct: l.discountPct,
            costPrice: l.costPrice,
          })),
          recommendedItems: attachedRecommendations,
        }

        onUpdateQuotation(updatedQuotation)

        if (onRecordAudit) {
          onRecordAudit({
            actorName: currentUser?.fullName || assignedRep,
            actorRole: currentUser?.role || 'sales_rep',
            actionType: statusTarget === 'Under Review' ? 'APPROVAL_REQUESTED' : 'QUOTE_UPDATED',
            targetQuotationId: quotation!.id,
            customerName: customer.trim(),
            details: statusTarget === 'Under Review'
              ? `Reported to ${targetManager}${isFinanceTagged ? ` [Tagged Finance: ${taggedFinance}]` : ''}. Notes: ${effectiveNotes || 'Volume concession request'}`
              : `Updated quotation items and economics, total $${grandTotal.toLocaleString()}`,
          })
        }

        if (statusTarget === 'Under Review') {
          onShowToast(`Quotation ${quotation!.id} submitted to ${targetManager}${isFinanceTagged ? ' & tagged Finance' : ''}!`)
          onNavigate('quotations')
        } else {
          onShowToast(`Quotation ${quotation!.id} saved to PostgreSQL database successfully.`)
        }
      }
    } catch (err) {
      console.error('Save failed:', err)
      onShowToast('Could not reach backend database. Changes preserved locally.')
    } finally {
      setIsSaving(false)
      setIsSubmitModalOpen(false)
    }
  }

  function handleExportPDF() {
    const currentQuoteData: Quotation = {
      id: quotation?.id || 'Q-NEW',
      dealName: customer.trim() || 'Commercial Deal',
      customerName: customer.trim() || 'Commercial Client',
      customerTier: quotation?.customerTier || 'Enterprise',
      salesRep: assignedRep,
      reportingManager: targetManager,
      taggedFinanceOfficer: isFinanceTagged ? taggedFinance : undefined,
      status: quotation?.status || 'Draft',
      createdAt: quotation?.createdAt || new Date().toISOString().split('T')[0],
      validUntil,
      blendedRiskScore: quotation?.blendedRiskScore || 85,
      riskLevel: quotation?.riskLevel || 'Low',
      items: lines.map(l => ({
        id: l.id,
        productId: l.productId,
        name: l.name,
        category: (l.category as any) || 'Hardware',
        type: 'one_time',
        qty: l.qty,
        unitPrice: l.unitPrice,
        discountPct: l.discountPct,
        costPrice: l.costPrice,
      })),
      managerComment: notes,
    }
    exportQuotationPDF(currentQuoteData)
    onShowToast(`Exporting DealFlow360 Quotation PDF for ${currentQuoteData.id}...`)
  }



  const statusClass =
    quotation?.status === 'Approved' ? styles.statusApproved :
      quotation?.status === 'Under Review' ? styles.statusReview :
        quotation?.status === 'Confirmed' ? styles.statusConfirmed : styles.statusDraft

  return (
    <div className={styles.container}>
      {/* ── Header ────────────────────────────────────────── */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.titleRow}>
            <button className={styles.btnSecondary} onClick={() => onNavigate('quotations')} title="Back to list">
              <ArrowLeftIcon />
              <span>Back</span>
            </button>
            <h1 className={styles.title}>
              {isNewQuotation ? 'Create New Quotation' : `Quotation Detail: ${quotation?.id}`}
            </h1>
            <span className={`${styles.statusPill} ${statusClass}`}>
              {isNewQuotation ? 'New Draft' : (quotation?.status || 'Draft')}
            </span>
            {readOnly && (
              <span className={styles.readOnlyBadge}>
                👁️ View Only (Admin Audit)
              </span>
            )}
          </div>
          <p className={styles.subtitle}>
            {readOnly
              ? 'Auditing quotation line items, price discounts, and gross margin economics in read-only mode.'
              : isNewQuotation
              ? 'Select catalog products, configure quantities and pricing discounts, and create a new deal directly in PostgreSQL.'
              : 'Configure items, customize pricing discounts, and persist deal economics directly to PostgreSQL.'}
          </p>
        </div>

        <div className={styles.headerActions}>
          {/* Live Currency Normalizer Selector */}
          <div className={styles.currencyPillWrap}>
            <span className={styles.currencyIcon}>🌐</span>
            <select
              className={styles.currencySelect}
              value={currency}
              onChange={e => {
                const newCurr = e.target.value
                setCurrency(newCurr)
                setGlobalCurrency(newCurr)
                const rate = exchangeRates[newCurr] || 1.0
                onShowToast(`Screen display currency changed to ${newCurr} (1 USD = ${rate.toFixed(4)} ${newCurr})`)
              }}
              title="Display currency (Live rates scraped from web)"
            >
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
              <option value="INR">INR (₹)</option>
              <option value="JPY">JPY (¥)</option>
              <option value="CAD">CAD (CA$)</option>
              <option value="AUD">AUD (A$)</option>
              <option value="AED">AED (AED)</option>
              <option value="CHF">CHF (CHF)</option>
              <option value="SGD">SGD (S$)</option>
            </select>
            {currency !== 'USD' && (
              <span className={styles.rateTag}>
                1 USD = {currentRate.toFixed(2)} {currency}
              </span>
            )}
          </div>

          <button
            className={styles.btnSecondary}
            onClick={handleExportPDF}
            title="Export Quotation PDF with DealFlow360 branding"
          >
            <span>📄 Export PDF</span>
          </button>
          {readOnly ? (
            <div className={styles.readOnlyNotice}>
              <span>🔒 Read-Only Admin Perspective</span>
            </div>
          ) : (
            <>
              <button
                className={styles.btnSecondary}
                onClick={() => handleSave('Draft')}
                disabled={isSaving}
              >
                <SaveIcon />
                <span>{isSaving ? 'Saving...' : isNewQuotation ? 'Save New Draft' : 'Save Draft'}</span>
              </button>
              <button
                className={styles.btnSubmit}
                onClick={() => setIsSubmitModalOpen(true)}
                disabled={isSaving}
              >
                <SendIcon />
                <span>Submit for Approval</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Top Meta Inputs Row (Customer, Sales Rep, Price List, Expiry) ── */}
      <div className={styles.metaCard}>
        <div className={styles.inputsRow}>
          <div className={styles.inputField}>
            <label className={styles.inputLabel}>Customer Account *</label>
            <input
              type="text"
              className={styles.inputBox}
              value={customer}
              onChange={e => setCustomer(e.target.value)}
              placeholder="Account / Company name"
              disabled={readOnly}
            />
          </div>

          <div className={styles.inputField}>
            <label className={styles.inputLabel}>
              Assigned Sales Rep
              {currentUser?.role === 'sales_manager' && !readOnly && (
                <span style={{ fontSize: '11px', color: '#6366f1', marginLeft: 6 }}>(Manager Reassign)</span>
              )}
            </label>
            {currentUser?.role === 'sales_manager' && !readOnly ? (
              <select
                className={styles.inputBox}
                value={assignedRep}
                onChange={e => {
                  const newRep = e.target.value
                  setAssignedRep(newRep)
                  if (onRecordAudit) {
                    onRecordAudit({
                      actorName: currentUser?.fullName || 'Alex Rivera (Sales Manager)',
                      actorRole: 'sales_manager',
                      actionType: 'DEAL_ASSIGNED',
                      targetQuotationId: quotation?.id || 'New Deal',
                      customerName: customer.trim() || 'Client',
                      details: `Manager reassigned deal to ${newRep}`,
                    })
                  }
                  onShowToast(`Assigned deal to ${newRep}!`)
                }}
              >
                {availableReps.map((r: any) => (
                  <option key={r.id || r.email} value={r.name}>
                    {r.name} ({r.email})
                  </option>
                ))}
              </select>
            ) : (
              <div className={styles.repBadgeRow}>
                <span className={styles.badgeRep}>💼 {assignedRep}</span>
                {quotation?.approvalWorkflow?.taggedFinanceOfficer && (
                  <span className={styles.badgeRepFinance}>
                    💰 {quotation.approvalWorkflow.taggedFinanceOfficer.split(' ')[0]} (Tagged)
                  </span>
                )}
              </div>
            )}
          </div>

          <div className={styles.inputField}>
            <label className={styles.inputLabel}>Price List Tier</label>
            <select
              className={styles.inputBox}
              value={priceList}
              onChange={e => setPriceList(e.target.value)}
              disabled={readOnly}
            >
              <option value="Enterprise Tier (US East)">Enterprise Tier (US East)</option>
              <option value="Commercial Standard">Commercial Standard</option>
              <option value="Government & Education">Government & Education</option>
              <option value="Global Wholesale">Global Wholesale</option>
            </select>
          </div>

          <div className={styles.inputField}>
            <label className={styles.inputLabel}>Valid Until</label>
            <input
              type="date"
              className={styles.inputBox}
              value={validUntil}
              onChange={e => setValidUntil(e.target.value)}
              disabled={readOnly}
            />
          </div>
        </div>
      </div>

      {/* ── Line Items Table Card ───────────────────────────── */}
      <div className={styles.card}>
        <div className={styles.tableHeaderRow}>
          <div>
            <h2 className={styles.cardTitle}>Configured Line Items</h2>
            <p className={styles.cardSubtitle}>Real-time margin governance enforced at line level.</p>
          </div>
          {!readOnly && (
            <div className={styles.addItemBar}>
              <select
                value={selectedProductId}
                onChange={e => setSelectedProductId(e.target.value)}
                className={styles.productSelect}
              >
                {availableProducts.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {formatPrice(p.unitPrice)} ({p.category})
                  </option>
                ))}
              </select>
              <button className={styles.btnAddItem} onClick={handleAddProductFromCatalog}>
                <PlusIcon />
                <span>Add Product</span>
              </button>
            </div>
          )}
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Product Description</th>
                <th>Qty</th>
                <th>Unit Price</th>
                <th>Discount</th>
                <th>Line Subtotal</th>
                <th>Discount Limit</th>
                <th>Governance</th>
                {!readOnly && <th>Action</th>}
              </tr>
            </thead>
            <tbody>
              {lines.length === 0 ? (
                <tr>
                  <td colSpan={readOnly ? 7 : 8} style={{ padding: '36px 16px', textAlign: 'center', color: '#64748B', fontSize: '13px' }}>
                    <div style={{ fontWeight: 600, color: '#1E293B', marginBottom: 6, fontSize: '14px' }}>
                      No line items added yet
                    </div>
                    <div>
                      {readOnly
                        ? 'This quotation does not have any line items.'
                        : <>Select a product from the catalog dropdown above and click <strong>&quot;+ Add Product&quot;</strong> to start building this quotation.</>}
                    </div>
                  </td>
                </tr>
              ) : (
                lines.map(line => {
                const lineGross = line.qty * line.unitPrice
                const lineDisc = lineGross * (line.discountPct / 100)
                const lineSub = lineGross - lineDisc
                const diff = line.discountPct - line.limit
                const isOver = diff > 0

                return (
                  <tr key={line.id}>
                    <td>
                      <div className={styles.prodInfo}>
                        <span className={styles.prodName}>{line.name}</span>
                        <span className={styles.prodCategory}>{line.category}</span>
                      </div>
                    </td>
                    <td>
                      <input
                        type="number"
                        min="1"
                        value={line.qty}
                        onChange={e => updateLine(line.id, 'qty', parseInt(e.target.value) || 1)}
                        className={styles.numInput}
                        disabled={readOnly}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        step="50"
                        value={line.unitPrice}
                        onChange={e => updateLine(line.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                        className={styles.priceInput}
                        disabled={readOnly}
                      />
                    </td>
                    <td>
                      <div className={styles.discountWrap}>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.5"
                          value={line.discountPct}
                          onChange={e => updateLine(line.id, 'discountPct', parseFloat(e.target.value) || 0)}
                          className={styles.discountInput}
                          disabled={readOnly}
                        />
                        <span>%</span>
                      </div>
                    </td>
                    <td>
                      <strong>{formatPrice(lineSub)}</strong>
                    </td>
                    <td>{line.limit}%</td>
                    <td>
                      {isOver ? (
                        <span className={styles.statusOver}>
                          OVER (+{diff.toFixed(1)}%)
                        </span>
                      ) : (
                        <span className={styles.statusOk}>OK</span>
                      )}
                    </td>
                    {!readOnly && (
                      <td>
                        <button
                          className={styles.btnDeleteLine}
                          onClick={() => handleRemoveLine(line.id)}
                          title="Remove line item"
                        >
                          <TrashIcon />
                        </button>
                      </td>
                    )}
                  </tr>
                )
              }))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Real-time Discount & Margin Notice ──────────────── */}
      {hasOverLimit ? (
        <div className={`${styles.alertBanner} ${styles.alertWarning}`}>
          <span>
            <strong>Approval Required:</strong> One or more items exceed the standard 15% discount limit. Submitting will route this deal to Sales Manager approval.
          </span>
        </div>
      ) : (
        <div className={styles.alertBanner}>
          <span>
            Discounts are validated live against governance thresholds. All items currently conform to standard pricing limits.
          </span>
        </div>
      )}

      {/* ── Financial Summary & Internal Notes ──────────────── */}
      <div className={styles.summaryGrid}>
        <div className={styles.notesCard}>
          <label className={styles.inputLabel}>Deal Notes & Commercial Terms</label>
          <textarea
            className={styles.notesTextarea}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Add customer requirements, SLA specifications, or discount justification for the finance approval team..."
            disabled={readOnly}
          />
        </div>

        <div className={styles.calcCard}>
          <div className={styles.calcRow}>
            <span>Subtotal (Gross)</span>
            <span>{formatPrice(subtotal)}</span>
          </div>

          <div className={styles.calcRow}>
            <span>Total Discount</span>
            <span className={styles.discountTag}>-{formatPrice(totalDiscount)}</span>
          </div>

          <div className={styles.calcRow}>
            <span>Estimated Tax (8%)</span>
            <span>{formatPrice(taxAmount)}</span>
          </div>

          <div className={styles.calcRowStrong}>
            <span>Grand Total</span>
            <span>{formatPrice(grandTotal)}</span>
          </div>

          <div className={styles.marginMetric}>
            <span>Gross Margin</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>{formatPrice(grossMargin)}</span>
              <span className={marginPct >= 30 ? styles.marginPillGood : styles.marginPillLow}>
                {marginPct.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Upsell and Cross-Sell Recommendation Section (Section 11) ── */}
      <div className={styles.upsellSection}>
        <div className={styles.upsellHeaderRow}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h2 className={styles.upsellTitle} style={{ margin: 0 }}>
              AI Quotation Recommendations
            </h2>
            {weights && (
              <div className={styles.weightSummaryPill}>
                <span>⚙ Weights:</span>
                <span>Upgr {weights.upsell.upgrade_frequency}% | Marg {weights.upsell.margin_opportunity}% | Co-Pur {weights.cross_sell.co_purchase_frequency}%</span>
              </div>
            )}
          </div>
          <div className={styles.upsellHeaderActions}>
            <button
              type="button"
              className={styles.btnGear}
              onClick={() => {
                setTempWeights(weights)
                setIsWeightModalOpen(true)
              }}
              title="Configure dynamic recommendation weights"
            >
              ⚙ Configure Weights
            </button>
          </div>
        </div>

        {/* Attached Recommendations (Customer Optional Add-ons) */}
        {attachedRecommendations.length > 0 && (
          <div className={styles.attachedRecsSection}>
            <div className={styles.attachedRecsHeader}>
              <div className={styles.attachedRecsTitleWrap}>
                <span className={styles.attachedRecsBadge}>
                  {attachedRecommendations.length} Attached {attachedRecommendations.length === 1 ? 'Recommendation' : 'Recommendations'}
                </span>
                <span className={styles.attachedRecsSubtitle}>
                  Optional add-ons for customer review in their portal (customer can choose whether to add)
                </span>
              </div>
            </div>

            <div className={styles.attachedRecsGrid}>
              {attachedRecommendations.map(rec => (
                <div key={rec.id} className={styles.attachedRecCard}>
                  <div className={styles.attachedRecTop}>
                    <div>
                      <div className={styles.attachedRecName}>{rec.name}</div>
                      <span
                        className={
                          rec.type === 'UPSELL'
                            ? `${styles.attachedRecTypeBadge} ${styles.attachedRecTypeUpsell}`
                            : `${styles.attachedRecTypeBadge} ${styles.attachedRecTypeCross}`
                        }
                      >
                        {rec.type === 'UPSELL' ? 'Higher-tier Upgrade' : 'Cross-Sell Add-on'}
                      </span>
                    </div>
                    <div className={styles.attachedRecPrice}>
                      {contextFormatPrice(rec.unitPrice)}
                    </div>
                  </div>

                  <div className={styles.attachedRecReason}>
                    💡 {rec.reason}
                  </div>

                  <div className={styles.attachedRecFooter}>
                    <span
                      className={
                        rec.customerAccepted
                          ? styles.attachedRecStatusAccepted
                          : styles.attachedRecStatusPending
                      }
                    >
                      {rec.customerAccepted ? '✓ Added by Customer' : '⏱ Pending Customer Decision'}
                    </span>
                    {!readOnly && (
                      <button
                        type="button"
                        className={styles.attachedRecRemoveBtn}
                        onClick={() => handleRemoveAttachedRecommendation(rec.id)}
                        title="Remove from quotation recommendations"
                      >
                        ✕ Remove
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.attachedRecsSummaryBar}>
              <div>
                Base Order: <strong>{contextFormatPrice(grandTotal)}</strong> • Optional Recommendations Potential: <strong>+{contextFormatPrice(attachedRecommendationsTotal)}</strong>
              </div>
              <div className={styles.attachedRecsPotentialTotal}>
                Potential Total Value: {contextFormatPrice(grandTotal + attachedRecommendationsTotal)}
              </div>
            </div>
          </div>
        )}

        {recommendations.upsell.length === 0 && recommendations.crossSell.length === 0 ? (
          <div className={styles.noRecsMessage} style={{ marginTop: 14 }}>
            {lines.length === 0
              ? 'Add products to your quotation above to generate data-driven upsell and cross-sell recommendations.'
              : 'No recommendations available for the current quotation.'}
          </div>
        ) : (
          <>
            {/* UPSELL RECOMMENDATIONS */}
            {recommendations.upsell.length > 0 && (
              <div className={styles.recSectionBlock} style={{ marginTop: 16 }}>
                <div className={styles.recSectionTitle}>
                  <span className={styles.recSectionBadgeUpsell}>UPSELL RECOMMENDATIONS</span>
                  <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 500 }}>
                    Higher-tier alternatives with greater capability &amp; margin (Customer option)
                  </span>
                </div>
                <div className={styles.upsellGrid}>
                  {recommendations.upsell.map((item) => {
                    const isActing = actionLoading === item.productId
                    const isAttached = attachedRecommendations.some(r => r.productId === item.productId)
                    return (
                      <div key={`upsell-${item.productId}`} className={styles.recCard}>
                        <div>
                          <div className={styles.recCardHeader}>
                            <div>
                              <div className={styles.recProductName}>{item.productName}</div>
                              <div className={styles.recProductPrice}>
                                {contextFormatPrice(item.price)}
                              </div>
                            </div>
                            <div className={styles.recScoreBadge}>
                              Score: {item.score}/100
                            </div>
                          </div>

                          <div className={styles.recWhyBox} style={{ marginTop: 10 }}>
                            <div className={styles.recWhyTitle}>Why recommended:</div>
                            <ul className={styles.recWhyList}>
                              {item.reasons.map((reason, rIdx) => (
                                <li key={rIdx}>{reason}</li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        <div>
                          <div className={styles.recMarginImpactBox} style={{ marginBottom: 10 }}>
                            <span className={styles.recMarginLabel}>Margin Impact:</span>
                            <span className={styles.recMarginValue}>
                              +{contextFormatPrice(item.marginImpactTotal)}
                            </span>
                          </div>

                          <button
                            type="button"
                            className={isAttached ? styles.recBtnAttached : styles.recBtnAdd}
                            disabled={readOnly || isActing}
                            onClick={() => handleToggleAttachRecommendation(item)}
                            title={isAttached ? 'Click to remove recommendation' : 'Add as optional recommendation for customer'}
                          >
                            {isAttached ? '✓ Attached as Recommendation (Remove)' : '+ Add as Recommendation'}
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* CROSS-SELL RECOMMENDATIONS */}
            {recommendations.crossSell.length > 0 && (
              <div className={styles.recSectionBlock} style={{ marginTop: recommendations.upsell.length > 0 ? 20 : 16 }}>
                <div className={styles.recSectionTitle}>
                  <span className={styles.recSectionBadgeCross}>CROSS-SELL RECOMMENDATIONS</span>
                  <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 500 }}>
                    Complementary products frequently purchased together (Customer option)
                  </span>
                </div>
                <div className={styles.upsellGrid}>
                  {recommendations.crossSell.map((item) => {
                    const isActing = actionLoading === item.productId
                    const isAttached = attachedRecommendations.some(r => r.productId === item.productId)
                    return (
                      <div key={`cross-${item.productId}`} className={styles.recCard}>
                        <div>
                          <div className={styles.recCardHeader}>
                            <div>
                              <div className={styles.recProductName}>{item.productName}</div>
                              <div className={styles.recProductPrice}>
                                {contextFormatPrice(item.price)}
                              </div>
                            </div>
                            <div className={styles.recScoreBadge}>
                              Score: {item.score}/100
                            </div>
                          </div>

                          <div className={styles.recWhyBox} style={{ marginTop: 10 }}>
                            <div className={styles.recWhyTitle}>Why recommended:</div>
                            <ul className={styles.recWhyList}>
                              {item.reasons.map((reason, rIdx) => (
                                <li key={rIdx}>{reason}</li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        <div>
                          <div className={styles.recMarginImpactBox} style={{ marginBottom: 10 }}>
                            <span className={styles.recMarginLabel}>Margin Impact:</span>
                            <span className={styles.recMarginValue}>
                              +{contextFormatPrice(item.marginImpactTotal)}
                            </span>
                          </div>

                          <button
                            type="button"
                            className={isAttached ? styles.recBtnAttached : styles.recBtnAdd}
                            disabled={readOnly || isActing}
                            onClick={() => handleToggleAttachRecommendation(item)}
                            title={isAttached ? 'Click to remove recommendation' : 'Add as optional recommendation for customer'}
                          >
                            {isAttached ? '✓ Attached as Recommendation (Remove)' : '+ Add as Recommendation'}
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Action Buttons ─────────────────────────────────── */}
      <div className={styles.actionsRow}>
        <button className={styles.btnSecondary} onClick={() => onNavigate('quotations')}>
          Cancel
        </button>

        <div className={styles.actionsRight}>
          <button
            className={styles.btnPrimary}
            onClick={() => handleSave('Draft')}
            disabled={isSaving}
          >
            <SaveIcon />
            <span>{isSaving ? 'Saving Changes...' : isNewQuotation ? 'Save New Draft to DB' : 'Save Draft to DB'}</span>
          </button>

          {!readOnly && (
            <button
              className={styles.btnSubmit}
              onClick={() => setIsSubmitModalOpen(true)}
              disabled={isSaving}
            >
              <SendIcon />
              <span>Submit for Approval</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Report to Manager & Tag Finance Officer Modal ── */}
      {isSubmitModalOpen && (
        <div className={styles.modalBackdrop} onClick={() => setIsSubmitModalOpen(false)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                <span>📋</span> Report &amp; Submit for Manager Approval
              </h3>
              <button
                className={styles.modalCloseBtn}
                onClick={() => setIsSubmitModalOpen(false)}
                type="button"
              >
                ✕
              </button>
            </div>

            {/* Deal Snapshot Summary */}
            <div className={styles.approvalSummaryBox}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span><strong>Customer:</strong> {customer || '—'}</span>
                <span><strong>Deal Value:</strong> ${grandTotal.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span><strong>Assigned Rep:</strong> {assignedRep}</span>
                <span><strong>Gross Margin:</strong> {marginPct.toFixed(1)}%</span>
              </div>
            </div>

            {/* 1. Select Reporting Manager */}
            <div className={styles.modalFormGroup}>
              <label className={styles.modalLabel}>Select Reporting Sales Manager *</label>
              <select
                className={styles.modalSelect}
                value={targetManager}
                onChange={e => setTargetManager(e.target.value)}
              >
                {availableManagers.map((m: any) => (
                  <option key={m.id || m.email} value={m.name}>
                    {m.name} ({m.email})
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Tag Available Financial Officer (Optional / As needed) */}
            <div className={styles.modalFormGroup}>
              <label className={styles.checkboxRow}>
                <input
                  type="checkbox"
                  checked={isFinanceTagged}
                  onChange={e => setIsFinanceTagged(e.target.checked)}
                />
                <span>Tag Available Financial Officer for Fiscal Review &amp; Margin Concession</span>
              </label>
              {isFinanceTagged && (
                <div style={{ marginTop: 8 }}>
                  <label className={styles.modalLabel} style={{ fontSize: '11.5px', color: '#047857' }}>
                    Available Financial Officer
                  </label>
                  <select
                    className={styles.modalSelect}
                    value={taggedFinance}
                    onChange={e => setTaggedFinance(e.target.value)}
                  >
                    {availableFinance.map((f: any) => (
                      <option key={f.id || f.email} value={f.name}>
                        {f.name} ({f.email})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* 3. Representative's Commercial Report & Notes */}
            <div className={styles.modalFormGroup}>
              <label className={styles.modalLabel}>Representative Notes &amp; Commercial Report</label>
              <textarea
                className={styles.modalTextarea}
                placeholder="Detail customer volume commitment, multi-year term agreement, or justification for requested discounts..."
                value={submissionNotes}
                onChange={e => setSubmissionNotes(e.target.value)}
              />
            </div>

            {/* Modal Actions */}
            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={() => setIsSubmitModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.btnSubmit}
                disabled={isSaving}
                onClick={() => handleSave('Under Review', submissionNotes)}
              >
                <SendIcon />
                <span>{isSaving ? 'Submitting...' : 'Send to Manager & Tag Finance'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Admin Weights Configuration Modal ──────────────── */}
      {isWeightModalOpen && tempWeights && (
        <div className={styles.modalBackdrop} onClick={() => setIsWeightModalOpen(false)}>
          <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>⚙ Admin Weight Settings</h3>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setIsWeightModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: '13px', color: '#3b5a8c', marginTop: 0 }}>
              Adjust live scoring criteria stored in PostgreSQL database. Each recommendation type must sum to 100%.
            </p>

            {weightsError && (
              <div style={{ color: '#991b1b', background: '#fef2f2', padding: '8px 12px', borderRadius: 8, fontSize: 12, marginBottom: 10 }}>
                {weightsError}
              </div>
            )}

            {/* Upsell Weights */}
            <div className={styles.modalSectionTitle}>UPSELL WEIGHTS</div>
            {(Object.keys(tempWeights.upsell) as Array<keyof typeof tempWeights.upsell>).map((metric) => (
              <div key={metric} className={styles.weightSliderRow}>
                <span className={styles.weightSliderLabel}>
                  {metric.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                </span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  className={styles.weightSliderInput}
                  value={tempWeights.upsell[metric]}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0
                    setTempWeights(prev => ({
                      ...prev,
                      upsell: {
                        ...prev.upsell,
                        [metric]: val,
                      },
                    }))
                  }}
                />
                <span className={styles.weightSliderVal}>{tempWeights.upsell[metric]}%</span>
              </div>
            ))}
            <div className={styles.modalTotalRow}>
              <span>Total Upsell:</span>
              <span style={{ color: Object.values(tempWeights.upsell).reduce((a, b) => a + b, 0) === 100 ? '#15803d' : '#991b1b' }}>
                {Object.values(tempWeights.upsell).reduce((a, b) => a + b, 0)}%
              </span>
            </div>

            {/* Cross-sell Weights */}
            <div className={styles.modalSectionTitle} style={{ marginTop: 20 }}>CROSS-SELL WEIGHTS</div>
            {(Object.keys(tempWeights.cross_sell) as Array<keyof typeof tempWeights.cross_sell>).map((metric) => (
              <div key={metric} className={styles.weightSliderRow}>
                <span className={styles.weightSliderLabel}>
                  {metric.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                </span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  className={styles.weightSliderInput}
                  value={tempWeights.cross_sell[metric]}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0
                    setTempWeights(prev => ({
                      ...prev,
                      cross_sell: {
                        ...prev.cross_sell,
                        [metric]: val,
                      },
                    }))
                  }}
                />
                <span className={styles.weightSliderVal}>{tempWeights.cross_sell[metric]}%</span>
              </div>
            ))}
            <div className={styles.modalTotalRow}>
              <span>Total Cross-Sell:</span>
              <span style={{ color: Object.values(tempWeights.cross_sell).reduce((a, b) => a + b, 0) === 100 ? '#15803d' : '#991b1b' }}>
                {Object.values(tempWeights.cross_sell).reduce((a, b) => a + b, 0)}%
              </span>
            </div>

            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={() => setIsWeightModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.btnPrimary}
                disabled={weightsSaving}
                onClick={handleSaveWeights}
              >
                {weightsSaving ? 'Saving...' : 'Save Weights'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
