'use client'

import React, { useState } from 'react'
import styles from './QuotationDetailWireframe.module.css'
import { Quotation, Product, ActiveModule } from './types'

interface QuotationBuilderProps {
  quotation: Quotation
  products: Product[]
  onUpdateQuotation: (updated: Quotation) => void
  onNavigate: (module: ActiveModule) => void
  onShowToast: (msg: string) => void
}

interface QuotationLine {
  id: string
  product: string
  qty: number
  price: number
  discount: number
  limit: number
}

export default function QuotationBuilderModule({
  quotation,
  products,
  onUpdateQuotation,
  onNavigate,
  onShowToast,
}: QuotationBuilderProps) {
  const [customer, setCustomer] = useState(quotation.customerName || 'Acme Corp')
  const [priceList, setPriceList] = useState('Enterprise Tier (US East)')

  // Exact wireframe default lines
  const [lines, setLines] = useState<QuotationLine[]>([
    {
      id: 'line-1',
      product: 'Laptop Pro 14',
      qty: 2,
      price: 1200,
      discount: 12,
      limit: 15,
    },
    {
      id: 'line-2',
      product: 'Onsite Setup Service',
      qty: 1,
      price: 450,
      discount: 18,
      limit: 10,
    },
    {
      id: 'line-3',
      product: 'Extended Warranty',
      qty: 1,
      price: 180,
      discount: 10,
      limit: 15,
    },
  ])

  function updateLine(id: string, field: 'qty' | 'discount', value: number) {
    setLines(prev =>
      prev.map(item => {
        if (item.id === id) {
          return { ...item, [field]: Math.max(0, value) }
        }
        return item
      })
    )
  }

  function handleAddUpsell(name: string, price: number, discount: number, limit: number) {
    const newLine: QuotationLine = {
      id: `upsell-${Date.now()}`,
      product: name,
      qty: 1,
      price,
      discount,
      limit,
    }
    setLines(prev => [...prev, newLine])
    onShowToast(`Added ${name} to quotation!`)
  }

  function handleSaveDraft() {
    onUpdateQuotation({
      ...quotation,
      status: 'Draft',
    })
    onShowToast('Draft saved successfully!')
  }

  function handleSubmitForApproval() {
    onUpdateQuotation({
      ...quotation,
      status: 'Under Review',
    })
    onShowToast('Quotation Q-1042 submitted for Manager Approval!')
    onNavigate('approvals')
  }

  return (
    <div className={styles.container}>
      {/* ── Header ────────────────────────────────────────── */}
      <div className={styles.header}>
        <h1 className={styles.title}>Quotation Detail: Q-1042 (Acme Corp)</h1>
        <p className={styles.subtitle}>
          Opened by clicking a row on the Quotations list. Add products, apply discounts, review upsells.
        </p>
      </div>

      {/* ── Customer & Price List Inputs ──────────────────── */}
      <div className={styles.inputsRow}>
        <div className={styles.inputField}>
          <label className={styles.inputLabel}>Customer</label>
          <input
            type="text"
            className={styles.inputBox}
            value={customer}
            onChange={e => setCustomer(e.target.value)}
            placeholder="e.g. Acme Corp"
          />
        </div>

        <div className={styles.inputField}>
          <label className={styles.inputLabel}>Price List</label>
          <input
            type="text"
            className={styles.inputBox}
            value={priceList}
            onChange={e => setPriceList(e.target.value)}
            placeholder="e.g. Enterprise Tier"
          />
        </div>
      </div>

      {/* ── Quotation Items Table ─────────────────────────── */}
      <div className={styles.tableCard}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Product</th>
              <th>Qty</th>
              <th>Price</th>
              <th>Discount</th>
              <th>Limit</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {lines.map(line => {
              const diff = line.discount - line.limit
              const isOver = diff > 0
              return (
                <tr key={line.id}>
                  <td><strong>{line.product}</strong></td>
                  <td>
                    <input
                      type="number"
                      min="1"
                      value={line.qty}
                      onChange={e => updateLine(line.id, 'qty', parseInt(e.target.value) || 1)}
                      className={styles.qtyInput}
                    />
                  </td>
                  <td>${line.price.toLocaleString()}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={line.discount}
                        onChange={e => updateLine(line.id, 'discount', parseFloat(e.target.value) || 0)}
                        className={styles.discountInput}
                      />
                      <span>%</span>
                    </div>
                  </td>
                  <td>{line.limit}%</td>
                  <td>
                    {isOver ? (
                      <span className={styles.statusOver}>
                        OVER (+{diff}pt)
                      </span>
                    ) : (
                      <span className={styles.statusOk}>OK</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* ── Amber / Golden Alert Banner ───────────────────── */}
      <div className={styles.alertBanner}>
        <span>
          Discount is checked against each line&apos;s own limit live, as soon as it is entered, not only at submit time.
        </span>
      </div>

      {/* ── Upsell and Cross-Sell Suggestions ──────────────── */}
      <div className={styles.upsellSection}>
        <h2 className={styles.upsellTitle}>Upsell and Cross-Sell Suggestions</h2>
        <div className={styles.upsellGrid}>
          {/* Card 1: Wireless Mouse */}
          <div
            className={styles.upsellCard}
            onClick={() => handleAddUpsell('Wireless Mouse', 45, 0, 15)}
            title="Click to add to quotation"
          >
            <div className={styles.upsellItemName}>+ Wireless Mouse</div>
            <div className={styles.upsellSubtext}>Margin +$18</div>
          </div>

          {/* Card 2: Docking Station */}
          <div
            className={styles.upsellCard}
            onClick={() => handleAddUpsell('Docking Station', 220, 12, 15)}
            title="Click to add to quotation"
          >
            <div className={styles.upsellItemName}>+ Docking Station</div>
            <div className={styles.upsellSubtext}>Promo: 12% off</div>
          </div>

          {/* Card 3: Care Plan 2yr */}
          <div
            className={styles.upsellCard}
            onClick={() => handleAddUpsell('Care Plan 2yr', 350, 5, 15)}
            title="Click to add to quotation"
          >
            <div className={styles.upsellItemName}>+ Care Plan 2yr</div>
            <div className={styles.upsellSubtext}>Margin +$46</div>
          </div>
        </div>
      </div>

      {/* ── Action Buttons ─────────────────────────────────── */}
      <div className={styles.actionsRow}>
        <button className={styles.btnSaveDraft} onClick={handleSaveDraft}>
          Save Draft
        </button>

        <button className={styles.btnSubmitApproval} onClick={handleSubmitForApproval}>
          Submit for Approval
        </button>
      </div>
    </div>
  )
}
