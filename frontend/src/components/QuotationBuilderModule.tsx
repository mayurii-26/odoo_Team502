'use client'

import React, { useState, useEffect, useMemo } from 'react'
import styles from './QuotationDetailWireframe.module.css'
import { Quotation, Product, ActiveModule } from './types'
import { saveFullQuotationToDb } from '../lib/api'

interface QuotationBuilderProps {
  quotation: Quotation
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
  const [customer, setCustomer] = useState(quotation?.customerName || 'Acme Corp')
  const [priceList, setPriceList] = useState('Enterprise Tier (US East)')
  const [validUntil, setValidUntil] = useState(quotation?.validUntil || '2026-04-15')
  const [notes, setNotes] = useState(quotation?.managerComment || '')
  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || '1')
  const [isSaving, setIsSaving] = useState(false)

  // Map incoming quotation items dynamically from DB
  const [lines, setLines] = useState<BuilderLineItem[]>(() => {
    if (quotation?.items && quotation.items.length > 0) {
      return quotation.items.map((it, idx) => ({
        id: it.id || `line-${idx + 1}`,
        productId: it.productId || String(idx + 1),
        name: it.name || 'Enterprise Service',
        category: it.category || 'Hardware',
        qty: it.qty || 1,
        unitPrice: it.unitPrice || 1200,
        discountPct: it.discountPct || 0,
        costPrice: it.costPrice || (it.unitPrice ? it.unitPrice * 0.65 : 780),
        limit: 15,
      }))
    }
    return [
      {
        id: 'line-1',
        productId: '1',
        name: 'Enterprise Cloud Infrastructure',
        category: 'Software',
        qty: 2,
        unitPrice: 2400,
        discountPct: 10,
        costPrice: 1440,
        limit: 15,
      },
    ]
  })

  // Sync state whenever the selected quotation prop updates
  useEffect(() => {
    if (quotation) {
      setCustomer(quotation.customerName || 'Acme Corp')
      setValidUntil(quotation.validUntil || '2026-04-15')
      setNotes(quotation.managerComment || '')
      if (quotation.items && quotation.items.length > 0) {
        setLines(
          quotation.items.map((it, idx) => ({
            id: it.id || `line-${idx + 1}`,
            productId: it.productId || String(idx + 1),
            name: it.name,
            category: it.category || 'Hardware',
            qty: it.qty || 1,
            unitPrice: it.unitPrice || 1000,
            discountPct: it.discountPct || 0,
            costPrice: it.costPrice || (it.unitPrice ? it.unitPrice * 0.65 : 650),
            limit: 15,
          }))
        )
      }
    }
  }, [quotation?.id])

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
    if (lines.length <= 1) {
      onShowToast('A quotation must contain at least one line item.')
      return
    }
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
    setIsSaving(true)
    const backendStatus =
      statusTarget === 'Under Review' ? 'PENDING_APPROVAL' :
      statusTarget === 'Negotiating' ? 'SENT' : 'DRAFT'

    const payload = {
      customer_name: customer,
      customer_company: customer,
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
      const savedResult = await saveFullQuotationToDb(quotation.id, payload)
      
      const updatedQuotation: Quotation = {
        ...quotation,
        customerName: customer,
        dealName: `${customer} - $${grandTotal.toLocaleString()}`,
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
        onShowToast(`Quotation ${quotation.id} submitted for Manager Approval and saved to DB.`)
        onNavigate('quotations')
      } else {
        onShowToast(`Quotation ${quotation.id} saved to PostgreSQL database successfully.`)
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
            <h1 className={styles.title}>Quotation Detail: {quotation?.id || 'Q-1042'}</h1>
            <span className={`${styles.statusPill} ${statusClass}`}>
              {quotation?.status || 'Draft'}
            </span>
          </div>
          <p className={styles.subtitle}>
            Configure items, customize pricing discounts, and persist deal economics directly to PostgreSQL.
          </p>
        </div>

        <div className={styles.headerActions}>
          <button
            className={styles.btnSecondary}
            onClick={() => handleSave('Draft')}
            disabled={isSaving}
          >
            <SaveIcon />
            <span>{isSaving ? 'Saving...' : 'Save Draft'}</span>
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

      {/* ── Metadata Inputs (Customer, Price List, Dates) ──── */}
      <div className={styles.metaCard}>
        <div className={styles.inputsRow}>
          <div className={styles.inputField}>
            <label className={styles.inputLabel}>Customer Account</label>
            <input
              type="text"
              className={styles.inputBox}
              value={customer}
              onChange={e => setCustomer(e.target.value)}
              placeholder="e.g. Acme Corp"
            />
          </div>

          <div className={styles.inputField}>
            <label className={styles.inputLabel}>Price List Tier</label>
            <input
              type="text"
              className={styles.inputBox}
              value={priceList}
              onChange={e => setPriceList(e.target.value)}
              placeholder="e.g. Enterprise Tier"
            />
          </div>

          <div className={styles.inputField}>
            <label className={styles.inputLabel}>Sales Representative</label>
            <input
              type="text"
              className={styles.inputBox}
              value={quotation?.salesRep || 'Jane Smith'}
              disabled
            />
          </div>

          <div className={styles.inputField}>
            <label className={styles.inputLabel}>Expiration Date</label>
            <input
              type="date"
              className={styles.inputBox}
              value={validUntil}
              onChange={e => setValidUntil(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* ── Line Items Table Card ─────────────────────────── */}
      <div className={styles.tableCard}>
        <div className={styles.tableHeaderBar}>
          <h2 className={styles.tableTitle}>Quotation Line Items ({lines.length})</h2>
          
          <div className={styles.addProductRow}>
            <select
              className={styles.productSelect}
              value={selectedProductId}
              onChange={e => setSelectedProductId(e.target.value)}
            >
              {products.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} (${Number(p.unitPrice).toLocaleString()})
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
              {lines.map(line => {
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
              })}
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

      {/* ── Catalog Cross-Sell / Upsell Recommendations ─────── */}
      {suggestedProducts.length > 0 && (
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
            <span>{isSaving ? 'Saving Changes...' : 'Save Draft to DB'}</span>
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
    </div>
  )
}
