'use client'

import React, { useState } from 'react'
import styles from './CustomerPortalWireframe.module.css'
import { Quotation, ActiveModule, UserSession, QuotationLineItem, QuotationRecommendedItem } from './types'
import { exportQuotationPDF } from '../lib/pdfGenerator'
import { useCurrency } from '@/context/CurrencyContext'
import ChatModule from './ChatModule'

interface CustomerPortalProps {
  quotation: Quotation
  onUpdateQuotation: (updated: Quotation) => void
  onNavigate: (module: ActiveModule) => void
  onShowToast: (msg: string) => void
  customerTab?: 'quotation' | 'messages' | 'profile'
  user?: UserSession
  users?: any[]
  onRecordAudit?: (entry: { user: string; role: string; action: string; quotationId?: string; details: string }) => void
}

interface NegotiationLine {
  id: string
  line: string
  customerComment: string
}

export default function CustomerPortalModule({
  quotation,
  onUpdateQuotation,
  onNavigate,
  onShowToast,
  customerTab = 'quotation',
  user,
  users,
  onRecordAudit,
}: CustomerPortalProps) {
  const { formatPrice } = useCurrency()
  const repName = quotation?.salesRep || 'Your Sales Rep'
  const repEmail = quotation?.salesRepEmail || ''
  const managerName = quotation?.reportingManager || ''
  const customerDisplayName = user?.companyName || user?.fullName || quotation?.customerName || 'Customer'

  const proposalTotal = quotation?.items && quotation.items.length > 0
    ? quotation.items.reduce((s, it) => s + it.qty * it.unitPrice * (1 - (it.discountPct || 0) / 100), 0)
    : 0

  // Optional recommendations attached by the Sales Representative
  const [recommendedItems, setRecommendedItems] = useState<QuotationRecommendedItem[]>(() => {
    return quotation?.recommendedItems || []
  })

  React.useEffect(() => {
    if (quotation?.recommendedItems) {
      setRecommendedItems(quotation.recommendedItems)
    }
  }, [quotation?.id, quotation?.recommendedItems])

  function handleAddRecommendedToOrder(rec: QuotationRecommendedItem) {
    const existingItems = quotation?.items || []
    const isAlreadyInOrder = existingItems.some(it => it.productId === rec.productId)
    if (isAlreadyInOrder) {
      onShowToast(`${rec.name} is already in your order.`)
      return
    }

    const newLineItem: QuotationLineItem = {
      id: `line-${rec.productId}-${Date.now()}`,
      productId: rec.productId,
      name: rec.name,
      category: (rec.category as any) || (rec.type === 'UPSELL' ? 'Hardware' : 'Services'),
      type: 'one_time',
      qty: 1,
      unitPrice: rec.unitPrice,
      discountPct: rec.discountPct || 0,
      costPrice: rec.costPrice,
    }

    const updatedItems = [...existingItems, newLineItem]
    const updatedRecs = (quotation.recommendedItems || recommendedItems).map(r =>
      r.productId === rec.productId ? { ...r, customerAccepted: true } : r
    )

    setRecommendedItems(updatedRecs)

    const updatedQuotation: Quotation = {
      ...quotation,
      items: updatedItems,
      recommendedItems: updatedRecs,
    }

    onUpdateQuotation(updatedQuotation)

    onRecordAudit?.({
      user: customerDisplayName,
      role: 'customer',
      action: 'CUSTOMER_ACCEPTED',
      quotationId: quotation.id,
      details: `Customer added recommended add-on "${rec.name}" to quotation ${quotation.id}.`,
    })

    onShowToast(`Added ${rec.name} to your order! Proposal total updated.`)
  }

  function handleRemoveRecommendedFromOrder(rec: QuotationRecommendedItem) {
    const existingItems = quotation?.items || []
    const updatedItems = existingItems.filter(it => it.productId !== rec.productId)
    const updatedRecs = (quotation.recommendedItems || recommendedItems).map(r =>
      r.productId === rec.productId ? { ...r, customerAccepted: false } : r
    )

    setRecommendedItems(updatedRecs)

    const updatedQuotation: Quotation = {
      ...quotation,
      items: updatedItems,
      recommendedItems: updatedRecs,
    }

    onUpdateQuotation(updatedQuotation)

    onRecordAudit?.({
      user: customerDisplayName,
      role: 'customer',
      action: 'CUSTOMER_PROPOSAL',
      quotationId: quotation.id,
      details: `Customer removed recommendation "${rec.name}" from quotation ${quotation.id}.`,
    })

    onShowToast(`Removed ${rec.name} from order.`)
  }

  // Negotiation items matching wireframe or live quotation items
  const [lines, setLines] = useState<NegotiationLine[]>(() => {
    if (quotation?.items && quotation.items.length > 0) {
      return quotation.items.map((item, idx) => ({
        id: `neg-${item.id || idx + 1}`,
        line: item.name,
        customerComment: idx === 0 ? 'Requesting additional volume discount.' : 'Terms acceptable.',
      }))
    }
    return []
  })

  React.useEffect(() => {
    if (quotation?.items && quotation.items.length > 0) {
      setLines(
        quotation.items.map((item, idx) => ({
          id: `neg-${item.id || idx + 1}`,
          line: item.name,
          customerComment: idx === 0 ? 'Requesting additional volume discount.' : 'Terms acceptable.',
        }))
      )
    }
  }, [quotation?.id, quotation?.items])

  const [counterDiscount, setCounterDiscount] = useState('15')
  const [requestedDeliveryDate, setRequestedDeliveryDate] = useState('')
  const [negotiationStatus, setNegotiationStatus] = useState<'Under Negotiation' | 'Confirmed'>('Under Negotiation')

  // Messages Thread State tailored to dedicated sales rep
  const [chatInput, setChatInput] = useState('')
  const [messages, setMessages] = useState([
    {
      sender: `${repName} (Your Dedicated Sales Rep)`,
      text: `Hello! I have assembled this tailored quotation for your review. Please let me know if any line adjustments or schedule preferences are needed.`,
      time: '',
      isCustomer: false,
    },
  ])

  function handleSubmitRequest() {
    onUpdateQuotation({
      ...quotation,
      status: 'Negotiating',
      customerComment: `Counter discount: ${counterDiscount}%, Requested date: ${requestedDeliveryDate}`,
    })

    onRecordAudit?.({
      user: customerDisplayName,
      role: 'customer',
      action: 'CUSTOMER_PROPOSAL',
      quotationId: quotation.id,
      details: `Customer submitted counter-proposal (${counterDiscount}% discount${requestedDeliveryDate ? `, delivery: ${requestedDeliveryDate}` : ''}) to assigned sales representative ${repName}.`,
    })

    onShowToast(`Negotiation request submitted! Your dedicated sales representative (${repName}) has been notified.`)
  }

  function handleConfirmQuotation() {
    setNegotiationStatus('Confirmed')
    onUpdateQuotation({
      ...quotation,
      status: 'Confirmed',
    })

    onRecordAudit?.({
      user: customerDisplayName,
      role: 'customer',
      action: 'CUSTOMER_ACCEPTED',
      quotationId: quotation.id,
      details: `Customer accepted and confirmed quotation ${quotation.id} with dedicated sales representative ${repName}. Order released to fulfillment.`,
    })

    onShowToast('Quotation Confirmed! Order is now approved and moving to fulfillment.')
  }

  function handleSendMessage() {
    if (!chatInput.trim()) return
    const text = chatInput.trim()

    setMessages(prev => [
      ...prev,
      {
        sender: customerDisplayName,
        text: text,
        time: 'Just now',
        isCustomer: true,
      },
    ])

    onRecordAudit?.({
      user: customerDisplayName,
      role: 'customer',
      action: 'CUSTOMER_PROPOSAL',
      quotationId: quotation.id,
      details: `Customer sent live negotiation message to representative ${repName}: "${text}"`,
    })

    setChatInput('')
    onShowToast(`Message transmitted directly to ${repName}!`)
  }

  /* ──────────────────────────────────────────────────────────
     TAB: MESSAGES
     ────────────────────────────────────────────────────────── */
  if (customerTab === 'messages') {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Messages &amp; Direct Communication</h1>
            <p className={styles.subtitle}>
              Live WhatsApp-style messaging, quotation document sharing, and negotiation channel with your dedicated representative
            </p>
          </div>
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '8px 16px', borderRadius: 10 }}>
            <span style={{ fontSize: 13, color: '#166534', fontWeight: 600 }}>
              👤 Dedicated Rep: <strong>{repName}</strong> ({repEmail})
            </span>
          </div>
        </div>

        <ChatModule
          currentUser={
            user || {
              email: 'customer1@acme.demo',
              fullName: customerDisplayName,
              role: 'customer',
            }
          }
          users={users}
          onShowToast={onShowToast}
          initialRecipientEmail={repEmail}
        />
      </div>
    )
  }

  /* ──────────────────────────────────────────────────────────
     TAB: PROFILE
     ────────────────────────────────────────────────────────── */
  if (customerTab === 'profile') {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Customer Account Profile</h1>
          <p className={styles.subtitle}>Registered organization credentials, contact leads, and dedicated sales representative</p>
        </div>

        <div className={styles.cardBox}>
          <div className={styles.profileGrid}>
            <div className={styles.profileItem}>
              <label>Organization / Account</label>
              <span className={styles.profileVal}>{user?.companyName || quotation?.customerName || 'Your Organization'}</span>
            </div>

            <div className={styles.profileItem}>
              <label>Authorized Signatory</label>
              <span className={styles.profileVal}>{user?.fullName || 'Account Contact'}</span>
            </div>

            <div className={styles.profileItem}>
              <label>Registered Email</label>
              <span className={styles.profileVal}>{user?.email || ''}</span>
            </div>

            <div className={styles.profileItem}>
              <label>Payment Terms</label>
              <span className={styles.profileVal}>Net 30 Days (Direct ACH / Stripe Invoice)</span>
            </div>

            <div className={styles.profileItem}>
              <label>Billing &amp; Delivery Address</label>
              <span className={styles.profileVal}>450 Enterprise Way, Suite 800, Austin, TX 78701</span>
            </div>

            <div className={styles.profileItem} style={{ background: '#f8fafc', padding: 12, borderRadius: 10, border: '1.5px solid #cbd5e1' }}>
              <label style={{ color: '#0f172a', fontWeight: 700 }}>Dedicated Sales Representative</label>
              <span className={styles.profileVal} style={{ color: '#2563eb', fontWeight: 700 }}>
                👤 {repName} ({repEmail})
              </span>
              <span style={{ display: 'block', fontSize: 11.5, color: '#64748b', marginTop: 3 }}>
                Reporting Manager: {managerName}
              </span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  /* ──────────────────────────────────────────────────────────
     TAB: MY QUOTATION (Customer Portal Negotiation Screen)
     ────────────────────────────────────────────────────────── */
  return (
    <div className={styles.container}>
      {/* ── Header ────────────────────────────────────────── */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Customer Portal Negotiation Screen</h1>
          <p className={styles.subtitle}>
            Review deal terms, propose adjustments, or confirm your agreement directly with your dedicated representative
          </p>
        </div>
        <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', padding: '8px 16px', borderRadius: 10 }}>
          <span style={{ fontSize: 13, color: '#1e40af', fontWeight: 600 }}>
            👤 Dedicated Sales Rep: <strong>{repName}</strong>
          </span>
        </div>
      </div>

      {/* ── Status Pill ───────────────────────────────────── */}
      <div className={styles.statusBadge}>
        Status: {negotiationStatus} • Total Value: {formatPrice(proposalTotal)}
      </div>

      {/* ── Negotiation Items Table ───────────────────────── */}
      <div className={styles.tableCard}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th style={{ width: '35%' }}>Line</th>
              <th>Customer Comment</th>
            </tr>
          </thead>
          <tbody>
            {lines.map(row => (
              <tr key={row.id}>
                <td><strong>{row.line}</strong></td>
                <td>
                  <input
                    type="text"
                    value={row.customerComment}
                    onChange={e => {
                      const val = e.target.value
                      setLines(prev =>
                        prev.map(l => (l.id === row.id ? { ...l, customerComment: val } : l))
                      )
                    }}
                    className={styles.inputBox}
                    style={{ padding: '7px 12px', fontSize: 13.5 }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Optional Recommendations Attached by Sales Rep ────────────── */}
      {recommendedItems.length > 0 && (
        <div className={styles.recommendationsCard}>
          <div className={styles.recSectionHeader}>
            <div>
              <div className={styles.recSectionTitle}>
                <span>💡</span> Recommended Add-Ons by Your Sales Representative ({repName})
              </div>
              <div className={styles.recSectionSubtitle}>
                Your representative suggested these optional items based on your selected solution. You may add them to your order below.
              </div>
            </div>
          </div>

          <div className={styles.portalRecGrid}>
            {recommendedItems.map(rec => {
              const isAccepted =
                Boolean(rec.customerAccepted) ||
                (quotation.items || []).some(it => String(it.productId) === String(rec.productId))

              return (
                <div key={rec.id} className={styles.portalRecCard}>
                  <div>
                    <div className={styles.portalRecTop}>
                      <div>
                        <div className={styles.portalRecTitle}>{rec.name}</div>
                        <span
                          className={
                            rec.type === 'UPSELL'
                              ? `${styles.portalRecBadge} ${styles.portalRecBadgeUpsell}`
                              : `${styles.portalRecBadge} ${styles.portalRecBadgeCross}`
                          }
                        >
                          {rec.type === 'UPSELL' ? 'Higher-tier Alternative' : 'Suggested Complement'}
                        </span>
                      </div>
                      <div className={styles.portalRecPrice}>
                        {formatPrice(rec.unitPrice)}
                      </div>
                    </div>

                    <div className={styles.portalRecReasons} style={{ marginTop: 12 }}>
                      <div className={styles.portalRecReasonHeader}>
                        <span>⭐</span> Rep&apos;s Recommendation Rationale:
                      </div>
                      <div>{rec.reason}</div>
                    </div>
                  </div>

                  <div className={styles.portalRecActions}>
                    {isAccepted ? (
                      <div className={styles.btnAddedWrap}>
                        <span className={styles.btnAddedOrder}>
                          ✓ Included in Your Order
                        </span>
                        <button
                          type="button"
                          className={styles.btnRemoveOrder}
                          onClick={() => handleRemoveRecommendedFromOrder(rec)}
                          title="Remove from your order"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className={styles.btnAddOrder}
                        onClick={() => handleAddRecommendedToOrder(rec)}
                      >
                        ＋ Add to My Order
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Counter Discount & Delivery Date Inputs ───────── */}
      <div className={styles.inputsRow}>
        <div className={styles.inputField}>
          <label className={styles.inputLabel}>Counter Discount %</label>
          <input
            type="text"
            className={styles.inputBox}
            value={counterDiscount}
            onChange={e => setCounterDiscount(e.target.value)}
            placeholder="e.g. 15"
          />
        </div>

        <div className={styles.inputField}>
          <label className={styles.inputLabel}>Requested Delivery Date</label>
          <input
            type="date"
            className={styles.inputBox}
            value={requestedDeliveryDate}
            onChange={e => setRequestedDeliveryDate(e.target.value)}
          />
        </div>
      </div>

      {/* ── Actions Row ───────────────────────────────────── */}
      <div className={styles.actionsRow}>
        <button
          className={styles.btnSubmitRequest}
          style={{ background: '#001D52', color: '#ffffff', borderColor: '#001D52' }}
          onClick={() => {
            exportQuotationPDF(quotation)
            onShowToast('Official DealFlow360 Quotation PDF downloaded!')
          }}
          title="Download official quotation document as PDF"
        >
          📄 Download Official Quote PDF
        </button>

        <button className={styles.btnSubmitRequest} onClick={handleSubmitRequest}>
          Submit Request to {repName.split(' ')[0]}
        </button>

        <button className={styles.btnConfirm} onClick={handleConfirmQuotation}>
          Confirm Quotation
        </button>
      </div>

      {/* ── Alert Banner ──────────────────────────────────── */}
      <div className={styles.alertBanner}>
        <span>
          If counter-terms exceed standard pricing guidelines, your proposal is automatically routed to {repName}&apos;s Sales Manager ({managerName}) for authorized clearance.
        </span>
      </div>
    </div>
  )
}
