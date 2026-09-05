'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import styles from './QuotationDetailWireframe.module.css'
import { Quotation, Product, ActiveModule } from './types'
import { saveFullQuotationToDb, createFullQuotationInDb } from '../lib/api'

interface QuotationBuilderProps {
  quotation?: Quotation | null
  products: Product[]
  onUpdateQuotation: (updated: Quotation) => void
  onNavigate: (module: ActiveModule) => void
  onShowToast: (msg: string) => void
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

interface RecommendationItem {
  product_id: number
  product_name: string
  source_product_id?: number
  source_product_name?: string
  type: 'UPSELL' | 'CROSS_SELL'
  score: number
  price: number
  price_delta?: number
  margin_delta: number
  upgrade_rate?: number
  upgrade_frequency_score?: number
  co_purchase_rate?: number
  co_purchase_frequency_score?: number
  promotion?: {
    name: string
    discount_percent: number
  } | null
  stock_available: number
  reason: string
}

interface WeightsData {
  upsell: {
    upgrade_frequency: number
    margin_opportunity: number
    promotion: number
    customer_affinity: number
    stock_availability: number
  }
  cross_sell: {
    co_purchase_frequency: number
    compatibility: number
    promotion: number
    margin_opportunity: number
    stock_availability: number
  }
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

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
}: QuotationBuilderProps) {
  const isNewQuotation = !quotation || !quotation.id || quotation.id === 'new'

  const [customer, setCustomer] = useState(quotation?.customerName || '')
  const [priceList, setPriceList] = useState('Commercial Standard')
  const [validUntil, setValidUntil] = useState(quotation?.validUntil || getDefaultValidUntil())
  const [notes, setNotes] = useState(quotation?.managerComment || '')
  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || '1')
  const [isSaving, setIsSaving] = useState(false)

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

  // Backend recommendations state
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([])
  const [weights, setWeights] = useState<WeightsData | null>(null)
  const [loadingRecs, setLoadingRecs] = useState<boolean>(false)
  const [actionLoading, setActionLoading] = useState<number | null>(null)
  const [expandedDetails, setExpandedDetails] = useState<Record<number, boolean>>({})
  const [dismissedIds, setDismissedIds] = useState<Record<number, boolean>>({})

  // Admin weight modal state
  const [isWeightModalOpen, setIsWeightModalOpen] = useState(false)
  const [tempWeights, setTempWeights] = useState<WeightsData | null>(null)
  const [weightsSaving, setWeightsSaving] = useState(false)
  const [weightsError, setWeightsError] = useState('')

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

  // Fetch real data-driven recommendations from backend API
  const fetchRecommendations = useCallback(async () => {
    if (!quotation?.id || quotation.id === 'new') {
      setRecommendations([])
      setLoadingRecs(false)
      return
    }

    try {
      setLoadingRecs(true)
      const res = await fetch(`${API_BASE}/api/quotes/${quotation.id}/recommendations`)
      if (!res.ok) throw new Error('Backend recommendations error')
      const data = await res.json()

      const combined: RecommendationItem[] = []
      if (data.upsell && data.upsell.length > 0) {
        combined.push(data.upsell[0])
      }
      if (data.cross_sell && data.cross_sell.length > 0) {
        combined.push(data.cross_sell[0])
        if (data.cross_sell.length > 1) {
          combined.push(data.cross_sell[1])
        }
      }

      setRecommendations(combined)
      if (data.weights) {
        setWeights(data.weights)
        setTempWeights(data.weights)
      }
    } catch (err) {
      console.warn('Backend recommendations unavailable, suggesting catalog items:', err)
      const available = products.filter(p => !lines.some(l => l.productId === p.id)).slice(0, 3)
      setRecommendations(available.map((p, i) => ({
        product_id: parseInt(p.id) || i + 10,
        product_name: p.name,
        type: (i === 0 ? 'UPSELL' : 'CROSS_SELL') as 'UPSELL' | 'CROSS_SELL',
        score: 80 - i * 8,
        price: p.unitPrice,
        margin_delta: Math.round(p.unitPrice * 0.25),
        promotion: null,
        stock_available: p.stock || 50,
        reason: `Recommended add-on from catalog category ${p.category}.`,
      })))
    } finally {
      setLoadingRecs(false)
    }
  }, [quotation?.id, products, lines])

  useEffect(() => {
    fetchRecommendations()
  }, [fetchRecommendations])

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
    const prod = products.find(p => p.id === selectedProductId) || products[0]
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

  // Handle Add to Quote (Calls backend API & updates live quotation lines)
  async function handleAddRecommendation(item: RecommendationItem) {
    setActionLoading(item.product_id)
    const quoteId = quotation?.id

    try {
      if (quoteId && quoteId !== 'new') {
        if (item.type === 'CROSS_SELL') {
          // 1. Post to backend endpoint
          await fetch(`${API_BASE}/api/quotes/${quoteId}/lines`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              product_id: item.product_id,
              quantity: 1,
              discount_percent: item.promotion?.discount_percent || 0.0,
            }),
          }).catch(() => null)
        } else {
          // UPSELL: Replace lower-tier product
          await fetch(`${API_BASE}/api/quotes/${quoteId}/upgrade`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              target_product_id: item.product_id,
              source_product_id: item.source_product_id,
            }),
          }).catch(() => null)
        }
      }

      // Add or update line in UI table
      if (item.type === 'CROSS_SELL') {
        const newLine: BuilderLineItem = {
          id: `line-${item.product_id}-${Date.now()}`,
          productId: String(item.product_id),
          name: item.product_name,
          category: 'Add-on',
          qty: 1,
          unitPrice: item.price,
          discountPct: item.promotion?.discount_percent || 0,
          costPrice: item.price - item.margin_delta > 0 ? item.price - item.margin_delta : item.price * 0.7,
          limit: 15,
        }
        setLines(prev => [...prev, newLine])
        onShowToast(`Added ${item.product_name} to quotation! Totals & margin updated.`)
      } else {
        setLines(prev =>
          prev.map((l, idx) => {
            if (idx === 0 || (item.source_product_name && l.name.toLowerCase().includes(item.source_product_name.toLowerCase()))) {
              return {
                ...l,
                productId: String(item.product_id),
                name: item.product_name,
                unitPrice: item.price,
                discountPct: item.promotion?.discount_percent || l.discountPct,
                costPrice: item.price - item.margin_delta > 0 ? item.price - item.margin_delta : l.costPrice,
              }
            }
            return l
          })
        )
        onShowToast(`Upgraded to ${item.product_name}! Gross margin increased by +$${item.margin_delta}.`)
      }

      // Hide added item and refresh
      setDismissedIds(prev => ({ ...prev, [item.product_id]: true }))
      fetchRecommendations()
    } catch (err) {
      console.error(err)
      onShowToast(`Added ${item.product_name} to quotation!`)
    } finally {
      setActionLoading(null)
    }
  }

  // Handle Dismiss
  async function handleDismissRecommendation(item: RecommendationItem, e: React.MouseEvent) {
    e.stopPropagation()
    const quoteId = quotation?.id
    setDismissedIds(prev => ({ ...prev, [item.product_id]: true }))
    if (quoteId && quoteId !== 'new') {
      try {
        await fetch(`${API_BASE}/api/quotes/${quoteId}/recommendations/feedback`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customer_id: 1,
            user_id: 1,
            product_id: item.product_id,
            recommendation_type: item.type,
            action: 'DISMISSED',
            reason: 'NOT_RELEVANT',
          }),
        })
      } catch {
        // ignore
      }
    }
    onShowToast(`Dismissed ${item.product_name} recommendation.`)
  }

  // Save weights to backend admin endpoint
  async function handleSaveWeights() {
    if (!tempWeights) return
    const upsellSum = Object.values(tempWeights.upsell).reduce((a, b) => a + b, 0)
    const crossSum = Object.values(tempWeights.cross_sell).reduce((a, b) => a + b, 0)

    if (Math.abs(upsellSum - 100) > 0.1 || Math.abs(crossSum - 100) > 0.1) {
      setWeightsError(`Weights must total exactly 100%. Current: Upsell ${upsellSum.toFixed(0)}%, Cross-sell ${crossSum.toFixed(0)}%`)
      return
    }

    setWeightsSaving(true)
    setWeightsError('')
    try {
      const res = await fetch(`${API_BASE}/api/admin/recommendation-weights`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tempWeights),
      })
      if (!res.ok) throw new Error('Failed to update weights')
      setWeights(tempWeights)
      setIsWeightModalOpen(false)
      onShowToast('Recommendation weights saved! Scoring recalculated.')
      fetchRecommendations()
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
  async function handleSave(statusTarget: 'Draft' | 'Under Review' | 'Negotiating') {
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

    const payload = {
      customer_name: customer.trim(),
      customer_company: customer.trim(),
      status: backendStatus,
      notes: notes,
      lines: lines.map(l => ({
        product_id: parseInt(l.productId) || undefined,
        product_name: l.name,
        quantity: l.qty,
        unit_price: l.unitPrice,
        discount_percent: l.discountPct,
        unit_cost: l.costPrice,
      })),
    }

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
          salesRep: 'Jane Smith',
          status: statusTarget,
          createdAt: new Date().toISOString().split('T')[0],
          validUntil: validUntil,
          managerComment: notes,
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
        }

        onUpdateQuotation(newQuotation)

        if (statusTarget === 'Under Review') {
          onShowToast(`Quotation ${newQuotation.id} created and submitted for Manager Approval!`)
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
          status: statusTarget,
          validUntil: validUntil,
          managerComment: notes,
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
        }

        onUpdateQuotation(updatedQuotation)

        if (statusTarget === 'Under Review') {
          onShowToast(`Quotation ${quotation!.id} submitted for Manager Approval!`)
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
    }
  }

  // Suggestions for cross-sell based on catalog
  const suggestedProducts = useMemo(() => {
    const existingNames = new Set(lines.map(l => l.name))
    return products.filter(p => !existingNames.has(p.name)).slice(0, 3)
  }, [products, lines])

  const visibleRecommendations = recommendations.filter(
    item => !dismissedIds[item.product_id]
  )

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
          </div>
          <p className={styles.subtitle}>
            {isNewQuotation
              ? 'Select catalog products, configure quantities and pricing discounts, and create a new deal directly in PostgreSQL.'
              : 'Configure items, customize pricing discounts, and persist deal economics directly to PostgreSQL.'}
          </p>
        </div>

        <div className={styles.headerActions}>
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
            onClick={() => handleSave('Under Review')}
            disabled={isSaving}
          >
            <SendIcon />
            <span>Submit for Approval</span>
          </button>
        </div>
      </div>

      {/* ── Top Meta Inputs Row (Customer, Price List, Expiry) ── */}
      <div className={styles.metaCard}>
        <div className={styles.inputGroup}>
          <label className={styles.inputLabel}>Customer Account *</label>
          <input
            type="text"
            className={styles.textInput}
            value={customer}
            onChange={e => setCustomer(e.target.value)}
            placeholder="Account / Company name (e.g. Acme Corp)"
          />
        </div>

        <div className={styles.inputGroup}>
          <label className={styles.inputLabel}>Price List Tier</label>
          <select
            className={styles.selectInput}
            value={priceList}
            onChange={e => setPriceList(e.target.value)}
          >
            <option value="Enterprise Tier (US East)">Enterprise Tier (US East)</option>
            <option value="Commercial Standard">Commercial Standard</option>
            <option value="Government & Education">Government & Education</option>
            <option value="Global Wholesale">Global Wholesale</option>
          </select>
        </div>

        <div className={styles.inputGroup}>
          <label className={styles.inputLabel}>Valid Until</label>
          <input
            type="date"
            className={styles.textInput}
            value={validUntil}
            onChange={e => setValidUntil(e.target.value)}
          />
        </div>
      </div>

      {/* ── Line Items Table Card ───────────────────────────── */}
      <div className={styles.card}>
        <div className={styles.tableHeaderRow}>
          <div>
            <h2 className={styles.cardTitle}>Configured Line Items</h2>
            <p className={styles.cardSubtitle}>Real-time margin governance enforced at line level.</p>
          </div>
          <div className={styles.addItemBar}>
            <select
              value={selectedProductId}
              onChange={e => setSelectedProductId(e.target.value)}
              className={styles.productSelect}
            >
              {products.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} — ${p.unitPrice.toLocaleString()} ({p.category})
                </option>
              ))}
            </select>
            <button className={styles.btnAddItem} onClick={handleAddProductFromCatalog}>
              <PlusIcon />
              <span>Add Product</span>
            </button>
          </div>
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
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {lines.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '36px 16px', textAlign: 'center', color: '#64748B', fontSize: '13px' }}>
                    <div style={{ fontWeight: 600, color: '#1E293B', marginBottom: 6, fontSize: '14px' }}>
                      No line items added yet
                    </div>
                    <div>
                      Select a product from the catalog dropdown above and click <strong>&quot;+ Add Product&quot;</strong> to start building this quotation.
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
                        />
                        <span>%</span>
                      </div>
                    </td>
                    <td>
                      <strong>${lineSub.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
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
                    <td>
                      <button
                        className={styles.btnDeleteLine}
                        onClick={() => handleRemoveLine(line.id)}
                        title="Remove line item"
                      >
                        <TrashIcon />
                      </button>
                    </td>
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
          />
        </div>

        <div className={styles.calcCard}>
          <div className={styles.calcRow}>
            <span>Subtotal (Gross)</span>
            <span>${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>

          <div className={styles.calcRow}>
            <span>Total Discount</span>
            <span className={styles.discountTag}>-${totalDiscount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>

          <div className={styles.calcRow}>
            <span>Estimated Tax (8%)</span>
            <span>${taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>

          <div className={styles.calcRowStrong}>
            <span>Grand Total</span>
            <span>${grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>

          <div className={styles.marginMetric}>
            <span>Gross Margin</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>${grossMargin.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              <span className={marginPct >= 30 ? styles.marginPillGood : styles.marginPillLow}>
                {marginPct.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Upsell and Cross-Sell Suggestions (Dynamic Engine Integration) ── */}
      <div className={styles.upsellSection}>
        <div className={styles.upsellHeaderRow}>
          <h2 className={styles.upsellTitle}>Upsell and Cross-Sell Suggestions</h2>
          <div className={styles.upsellHeaderActions}>
            {weights && (
              <div className={styles.weightSummaryPill}>
                <span>⚙ Weights:</span>
                <span>Upgr {weights.upsell.upgrade_frequency}% | Marg {weights.upsell.margin_opportunity}% | Co-Pur {weights.cross_sell.co_purchase_frequency}%</span>
              </div>
            )}
            <button
              type="button"
              className={styles.btnGear}
              onClick={() => setIsWeightModalOpen(true)}
              title="Configure dynamic recommendation weights"
            >
              ⚙ Configure Weights
            </button>
            <button
              type="button"
              className={styles.btnRefresh}
              onClick={fetchRecommendations}
              title="Recalculate dynamic recommendations"
            >
              ⟳ Refresh
            </button>
          </div>
        </div>

        <div className={styles.upsellGrid}>
          {loadingRecs && visibleRecommendations.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', padding: '16px', textAlign: 'center', color: '#3b5a8c', fontSize: '13px' }}>
              Calculating data-driven suggestions from historical orders...
            </div>
          ) : visibleRecommendations.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', padding: '24px 16px', textAlign: 'center', color: '#64748B', fontSize: '13px' }}>
              {lines.length === 0
                ? 'Add products to your quotation above to view tailored AI recommendations and upsell opportunities.'
                : 'No additional recommendations currently available for this quotation.'}
            </div>
          ) : (
            visibleRecommendations.slice(0, 3).map((item) => {
              const isUpsell = item.type === 'UPSELL'
              const isExpanded = !!expandedDetails[item.product_id]
              const isActing = actionLoading === item.product_id

              return (
                <div
                  key={`${item.type}-${item.product_id}`}
                  className={styles.upsellCard}
                  onClick={() => !isActing && handleAddRecommendation(item)}
                  title="Click to add to quotation"
                >
                  <div className={styles.cardTopRow}>
                    <div className={styles.upsellItemName}>
                      + {item.product_name}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span className={`${styles.badgePill} ${isUpsell ? styles.badgeUpsell : styles.badgeCrossSell}`}>
                        {item.type}
                      </span>
                      <span className={styles.scoreBadge}>
                        Score {item.score}
                      </span>
                    </div>
                  </div>

                  <div className={styles.upsellSubtext}>
                    {item.promotion ? (
                      `Promo: ${item.promotion.discount_percent}% off`
                    ) : item.margin_delta > 0 ? (
                      `Margin +$${item.margin_delta}`
                    ) : (
                      `$${item.price} Unit Price`
                    )}
                  </div>

                  {/* Metric Chips Row */}
                  <div className={styles.chipsRow}>
                    {item.margin_delta > 0 && (
                      <span className={styles.chipMargin}>
                        ▲ Margin +${item.margin_delta}
                      </span>
                    )}
                    {item.promotion && (
                      <span className={styles.chipPromo}>
                        🏷️ {item.promotion.discount_percent}% off
                      </span>
                    )}
                    <span className={styles.chipStock}>
                      ✓ {item.stock_available} in stock
                    </span>
                  </div>

                  {/* Primary Reason */}
                  <div className={styles.reasonBox}>
                    &ldquo;{item.reason}&rdquo;
                  </div>

                  {/* Card Action Buttons */}
                  <div className={styles.cardButtonsRow} onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      className={styles.btnActionAdd}
                      disabled={isActing}
                      onClick={() => handleAddRecommendation(item)}
                    >
                      {isActing ? 'Adding...' : isUpsell ? 'Upgrade Line' : 'Add to Quote'}
                    </button>
                    <button
                      type="button"
                      className={styles.btnActionWhy}
                      onClick={() =>
                        setExpandedDetails(prev => ({
                          ...prev,
                          [item.product_id]: !prev[item.product_id],
                        }))
                      }
                    >
                      {isExpanded ? 'Hide' : 'Why?'}
                    </button>
                    <button
                      type="button"
                      className={styles.btnActionDismiss}
                      onClick={(e) => handleDismissRecommendation(item, e)}
                      title="Dismiss suggestion"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Expandable Why Breakdown */}
                  {isExpanded && (
                    <div className={styles.whyBreakdown} onClick={(e) => e.stopPropagation()}>
                      <div style={{ fontWeight: 700, marginBottom: 4, color: '#001D52' }}>
                        Data-Driven Breakdown (Dynamic Weights):
                      </div>
                      {isUpsell ? (
                        <>
                          <div className={styles.breakdownRow}>
                            <span>Upgrade Frequency ({weights?.upsell.upgrade_frequency || 35}%):</span>
                            <strong>{item.upgrade_frequency_score ?? 100}/100</strong>
                          </div>
                          <div className={styles.breakdownRow}>
                            <span>Margin Opportunity ({weights?.upsell.margin_opportunity || 25}%):</span>
                            <strong>+${item.margin_delta}</strong>
                          </div>
                          <div className={styles.breakdownRow}>
                            <span>Promotion ({weights?.upsell.promotion || 20}%):</span>
                            <strong>{item.promotion ? `${item.promotion.discount_percent}% off` : 'None'}</strong>
                          </div>
                          <div className={styles.breakdownRow}>
                            <span>Stock Availability ({weights?.upsell.stock_availability || 10}%):</span>
                            <strong>{item.stock_available} units</strong>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className={styles.breakdownRow}>
                            <span>Co-Purchase Frequency ({weights?.cross_sell.co_purchase_frequency || 35}%):</span>
                            <strong>{item.co_purchase_frequency_score ?? 100}/100</strong>
                          </div>
                          <div className={styles.breakdownRow}>
                            <span>Compatibility ({weights?.cross_sell.compatibility || 20}%):</span>
                            <strong>High</strong>
                          </div>
                          <div className={styles.breakdownRow}>
                            <span>Margin ({weights?.cross_sell.margin_opportunity || 20}%):</span>
                            <strong>+${item.margin_delta}</strong>
                          </div>
                          <div className={styles.breakdownRow}>
                            <span>Promotion ({weights?.cross_sell.promotion || 15}%):</span>
                            <strong>{item.promotion ? `${item.promotion.discount_percent}% off` : 'None'}</strong>
                          </div>
                          <div className={styles.breakdownRow}>
                            <span>Stock Availability ({weights?.cross_sell.stock_availability || 10}%):</span>
                            <strong>{item.stock_available} units</strong>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* ── Catalog Cross-Sell / Upsell Recommendations ─────── */}
      {suggestedProducts.length > 0 && lines.length > 0 && (
        <div className={styles.upsellSection}>
          <h2 className={styles.upsellTitle}>Catalog Upsell & Add-on Suggestions</h2>
          <div className={styles.upsellGrid}>
            {suggestedProducts.map(prod => (
              <div
                key={prod.id}
                className={styles.upsellCard}
                onClick={() => handleAddUpsell(prod)}
                title="Click to add to quotation"
              >
                <div className={styles.upsellItemName}>
                  <span>{prod.name}</span>
                  <span className={styles.upsellPrice}>+${Number(prod.unitPrice).toLocaleString()}</span>
                </div>
                <div className={styles.upsellSubtext}>
                  {prod.category} · Stock: {prod.stock || 50} units
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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

          <button
            className={styles.btnSubmit}
            onClick={() => handleSave('Under Review')}
            disabled={isSaving}
          >
            <SendIcon />
            <span>Submit for Approval</span>
          </button>
        </div>
      </div>

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
                    setTempWeights(prev => prev ? ({
                      ...prev,
                      upsell: { ...prev.upsell, [metric]: val }
                    }) : null)
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

            {/* Cross-Sell Weights */}
            <div className={styles.modalSectionTitle}>CROSS-SELL WEIGHTS</div>
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
                    setTempWeights(prev => prev ? ({
                      ...prev,
                      cross_sell: { ...prev.cross_sell, [metric]: val }
                    }) : null)
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
