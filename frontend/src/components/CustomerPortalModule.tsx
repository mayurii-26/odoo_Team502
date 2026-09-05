'use client'

import React, { useState } from 'react'
import styles from './AppShell.module.css'
import { Quotation, ActiveModule } from './types'

interface CustomerPortalProps {
  quotation: Quotation
  onUpdateQuotation: (updated: Quotation) => void
  onNavigate: (module: ActiveModule) => void
  onShowToast: (msg: string) => void
}

export default function CustomerPortalModule({
  quotation,
  onUpdateQuotation,
  onNavigate,
  onShowToast,
}: CustomerPortalProps) {
  const [commentText, setCommentText] = useState('')
  const [commentsThread, setCommentsThread] = useState([
    {
      sender: 'Jane Smith (DealFlow Sales Rep)',
      text: 'Hello John, enclosed is your enterprise proposal including fleet hardware, 200 telemetry sensors, and the annual platform license.',
      time: 'Today, 10:15 AM',
      isCustomer: false,
    },
  ])
  const [isPayModalOpen, setIsPayModalOpen] = useState(false)
  const [paymentSuccess, setPaymentSuccess] = useState(quotation.billing?.paymentStatus === 'Paid')

  const totalContract = quotation.items.reduce(
    (sum, item) => sum + item.qty * item.unitPrice * (1 - item.discountPct / 100),
    0
  )

  function handleSendComment() {
    if (!commentText.trim()) return
    setCommentsThread([
      ...commentsThread,
      {
        sender: 'John Davis (Acme Corp)',
        text: commentText,
        time: 'Just now',
        isCustomer: true,
      },
    ])
    setCommentText('')
    onShowToast('Negotiation note transmitted to Sales Rep!')
  }

  function handleAcceptQuotation() {
    onUpdateQuotation({
      ...quotation,
      status: 'Confirmed',
    })
    onShowToast('Quotation formally accepted & signed! Order confirmed.')
  }

  function handleSimulatePayment() {
    setIsPayModalOpen(false)
    setPaymentSuccess(true)
    onUpdateQuotation({
      ...quotation,
      billing: quotation.billing
        ? {
            ...quotation.billing,
            paymentStatus: 'Paid',
            paidAt: new Date().toISOString().split('T')[0],
          }
        : undefined,
    })
    onShowToast('Payment received via Stripe / ACH! Receipt #REC-8849 generated.')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Portal Top Bar */}
      <div className={styles.moduleHeader}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 20 }}>🏢</span>
            <h1 className={styles.moduleTitle}>Customer Quotation & Negotiation Portal</h1>
          </div>
          <p className={styles.moduleSubtitle}>
            Dedicated portal for <strong>Acme Corporation</strong> | Proposal Ref: <strong>{quotation.id}</strong>
          </p>
        </div>

        <div className={styles.btnGroup}>
          {quotation.status === 'Confirmed' && (
            <span className={`${styles.badge} ${styles.badgeConfirmed}`} style={{ fontSize: 13, padding: '6px 12px' }}>
              ✓ Legally Signed & Confirmed
            </span>
          )}
          {quotation.status !== 'Confirmed' && (
            <button className={`${styles.btnPrimary} ${styles.btnSuccess}`} onClick={handleAcceptQuotation}>
              ✓ Accept & Sign Quotation
            </button>
          )}
        </div>
      </div>

      {/* Security Isolation Notice */}
      <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: '10px 16px', fontSize: 12.5, color: '#1e40af', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span>🔒</span>
        <span>
          <strong>Isolated Customer Security Sandbox:</strong> Internal margin formulas, cost bases, and internal approval notes are strictly isolated and not rendered in this portal.
        </span>
      </div>

      {/* Quotation Specs Card */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div>
            <strong style={{ fontSize: 15, color: '#0f172a' }}>{quotation.dealName}</strong>
            <div style={{ fontSize: 12, color: '#64748b' }}>
              Prepared by: {quotation.salesRep} | Valid through: {quotation.validUntil}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 12, color: '#64748b' }}>Total Investment:</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#2563eb' }}>
              ${Math.round(totalContract).toLocaleString()}
            </div>
          </div>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Item & Description</th>
                <th>Category</th>
                <th>Billing Model</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th style={{ textAlign: 'right' }}>Line Total</th>
              </tr>
            </thead>
            <tbody>
              {quotation.items.map(item => {
                const total = item.qty * item.unitPrice * (1 - item.discountPct / 100)
                return (
                  <tr key={item.id}>
                    <td>
                      <strong>{item.name}</strong>
                    </td>
                    <td>{item.category}</td>
                    <td>{item.type === 'recurring' ? 'Recurring (Annual)' : 'One-time Capital'}</td>
                    <td>{item.qty} units</td>
                    <td>${item.unitPrice.toLocaleString()}</td>
                    <td style={{ textAlign: 'right' }}>
                      <strong>${Math.round(total).toLocaleString()}</strong>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Negotiation & Counter-Offer Thread */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 18 }}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>💬 Interactive Terms Negotiation</span>
          </div>
          <div className={styles.cardBody} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 220, overflowY: 'auto' }}>
              {commentsThread.map((c, i) => (
                <div
                  key={i}
                  style={{
                    background: c.isCustomer ? '#eff6ff' : '#f8fafc',
                    border: c.isCustomer ? '1px solid #bfdbfe' : '1px solid #e2e8f0',
                    borderRadius: 6,
                    padding: 10,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, marginBottom: 4 }}>
                    <strong style={{ color: c.isCustomer ? '#1d4ed8' : '#334155' }}>{c.sender}</strong>
                    <span style={{ color: '#94a3b8' }}>{c.time}</span>
                  </div>
                  <div style={{ fontSize: 12.5, color: '#1e293b' }}>{c.text}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                placeholder="Ask a question or propose terms (e.g. Can we bundle 3 years of SLA support?)..."
                className={styles.formInput}
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSendComment() }}
              />
              <button className={styles.btnSecondary} onClick={handleSendComment}>
                Send Note
              </button>
            </div>
          </div>
        </div>

        {/* Payment & Invoicing View */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardTitle}>💳 Billing, Invoicing & Payment</span>
            {paymentSuccess ? (
              <span className={`${styles.badge} ${styles.badgeConfirmed}`}>Paid via ACH</span>
            ) : (
              <span className={`${styles.badge} ${styles.badgeReview}`}>Invoice Due</span>
            )}
          </div>
          <div className={styles.cardBody} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: '#64748b' }}>One-time Hardware & Onboarding:</span>
              <strong>$78,900.00</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: '#64748b' }}>Annual Cloud Subscription:</span>
              <strong>$27,000.00 / yr</strong>
            </div>
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10, display: 'flex', justifyContent: 'space-between', fontSize: 15 }}>
              <span>Initial Invoice Total:</span>
              <strong style={{ color: '#2563eb' }}>${Math.round(totalContract).toLocaleString()}</strong>
            </div>

            {paymentSuccess ? (
              <div style={{ background: '#f0fdf4', padding: 12, borderRadius: 6, fontSize: 12.5, color: '#15803d', textAlign: 'center' }}>
                ✓ Invoice #INV-1042 settled. Hardware fulfillment allocated to warehouse hubs.
              </div>
            ) : (
              <button
                className={`${styles.btnPrimary} ${styles.btnSuccess}`}
                style={{ width: '100%', justifyContent: 'center', marginTop: 6 }}
                onClick={() => setIsPayModalOpen(true)}
              >
                Pay Now ($105,900.00) →
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Payment Gateway Simulator Modal */}
      {isPayModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99,
          }}
        >
          <div style={{ background: '#fff', borderRadius: 8, padding: 24, maxWidth: 440, width: '90%', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>B2B Payment Gateway (Stripe / ACH)</h3>
            <p style={{ fontSize: 12.5, color: '#64748b', marginBottom: 16 }}>
              Acme Corporation | Invoice #INV-1042
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className={styles.formField}>
                <label className={styles.formLabel}>Payment Method</label>
                <select className={styles.formInput}>
                  <option>Corporate ACH Transfer (JPMorgan Chase ****8122)</option>
                  <option>Corporate Visa / Mastercard (Ending in 4092)</option>
                  <option>Wire Transfer Reference</option>
                </select>
              </div>

              <div className={styles.formField}>
                <label className={styles.formLabel}>Remittance Amount</label>
                <input type="text" className={styles.formInput} value={`$${Math.round(totalContract).toLocaleString()} USD`} readOnly />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
                <button className={styles.btnSecondary} onClick={() => setIsPayModalOpen(false)}>
                  Cancel
                </button>
                <button className={`${styles.btnPrimary} ${styles.btnSuccess}`} onClick={handleSimulatePayment}>
                  Authorize & Pay Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
