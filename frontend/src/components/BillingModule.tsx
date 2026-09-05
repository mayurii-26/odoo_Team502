'use client'

import React, { useState } from 'react'
import styles from './AppShell.module.css'
import { Quotation, ActiveModule } from './types'
import { exportBillingStatementPDF } from '../lib/pdfGenerator'

interface BillingModuleProps {
  quotation: Quotation
  onUpdateQuotation: (updated: Quotation) => void
  onNavigate: (module: ActiveModule) => void
  onShowToast: (msg: string) => void
}

export default function BillingModule({
  quotation,
  onUpdateQuotation,
  onNavigate,
  onShowToast,
}: BillingModuleProps) {
  const [paymentStatus, setPaymentStatus] = useState<string>(
    quotation.billing?.paymentStatus || 'Pending'
  )

  function handleMarkPaid() {
    setPaymentStatus('Paid')
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
    onShowToast('Invoice marked as Paid! Payment verified in Ledger.')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className={styles.moduleHeader}>
        <div>
          <h1 className={styles.moduleTitle}>Commercial Billing, Invoicing & Subscriptions</h1>
          <p className={styles.moduleSubtitle}>
            Deterministic billing engine: Automatically splits one-time hardware costs from recurring cloud subscriptions and support contracts.
          </p>
        </div>
        <div className={styles.btnGroup}>
          <button
            className={styles.btnSecondary}
            onClick={() => {
              exportBillingStatementPDF(quotation)
              onShowToast('Bifurcated billing statement & invoice PDF generated.')
            }}
          >
            📄 Download Invoice PDF
          </button>
          {paymentStatus !== 'Paid' ? (
            <button className={`${styles.btnPrimary} ${styles.btnSuccess}`} onClick={handleMarkPaid}>
              ✓ Mark Paid in Full
            </button>
          ) : (
            <span className={`${styles.badge} ${styles.badgeConfirmed}`} style={{ fontSize: 13, padding: '6px 12px' }}>
              ✓ Settled via ACH
            </span>
          )}
        </div>
      </div>

      {/* Bifurcated Billing Summary */}
      <div className={styles.gridMetrics}>
        <div className={styles.cardMetric}>
          <div className={styles.metricTitle}>One-Time Capital Charges</div>
          <div className={styles.metricValue}>$78,900.00</div>
          <div className={`${styles.metricSubtext} ${styles.subtextInfo}`}>
            Hardware Gateways, Sensors & Onboarding
          </div>
        </div>

        <div className={styles.cardMetric}>
          <div className={styles.metricTitle}>Annual Recurring Revenue (ARR)</div>
          <div className={styles.metricValue}>$27,000.00 / yr</div>
          <div className={`${styles.metricSubtext} ${styles.subtextSuccess}`}>
            DealFlow Enterprise SaaS License
          </div>
        </div>

        <div className={styles.cardMetric}>
          <div className={styles.metricTitle}>Total Initial Invoice</div>
          <div className={styles.metricValue}>$105,900.00</div>
          <div className={`${styles.metricSubtext} ${styles.subtextInfo}`}>
            Due Net-30 upon hardware arrival
          </div>
        </div>

        <div className={styles.cardMetric}>
          <div className={styles.metricTitle}>Payment Status</div>
          <div className={styles.metricValue}>
            <span
              className={`${styles.badge} ${
                paymentStatus === 'Paid' ? styles.badgeConfirmed : styles.badgeReview
              }`}
              style={{ fontSize: 15, padding: '4px 10px' }}
            >
              {paymentStatus}
            </span>
          </div>
          <div style={{ fontSize: 12, color: '#64748b' }}>
            {paymentStatus === 'Paid' ? 'Paid on Sept 05, 2026' : 'Awaiting customer ACH transfer'}
          </div>
        </div>
      </div>

      {/* Invoice Breakdown */}
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <div>
            <strong style={{ fontSize: 15 }}>
              Invoice #{quotation.billing?.invoiceId || `INV-${quotation.id}`} — Line Item Bifurcation
            </strong>
            <div style={{ fontSize: 12, color: '#64748b' }}>
              Billed to: {quotation.customerName || 'Customer'} | Payment terms: Net-30
            </div>
          </div>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Item</th>
                <th>Classification</th>
                <th>Billing Schedule</th>
                <th>Quantity</th>
                <th>Price</th>
                <th style={{ textAlign: 'right' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Fleet Edge Gateway Hub v2</strong></td>
                <td><span className={styles.badgeDraft}>Hardware</span></td>
                <td>One-Time Immediate</td>
                <td>40 units</td>
                <td>$975.00</td>
                <td style={{ textAlign: 'right' }}><strong>$39,000.00</strong></td>
              </tr>
              <tr>
                <td><strong>Industrial IoT Telemetry Sensor</strong></td>
                <td><span className={styles.badgeDraft}>Hardware</span></td>
                <td>One-Time Immediate</td>
                <td>200 units</td>
                <td>$204.00</td>
                <td style={{ textAlign: 'right' }}><strong>$40,800.00</strong></td>
              </tr>
              <tr>
                <td><strong>Turnkey Enterprise Onboarding</strong></td>
                <td><span className={styles.badgeDraft}>Services</span></td>
                <td>Milestone Completion</td>
                <td>1 package</td>
                <td>$8,500.00</td>
                <td style={{ textAlign: 'right' }}><strong>$8,500.00</strong></td>
              </tr>
              <tr style={{ background: '#f8fafc' }}>
                <td><strong>DealFlow Platform SaaS</strong></td>
                <td><span className={styles.badgeApproved}>Software Subscription</span></td>
                <td>Annual Prepaid (Recurring)</td>
                <td>1 yr</td>
                <td>$27,000.00</td>
                <td style={{ textAlign: 'right' }}><strong>$27,000.00</strong></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style={{ padding: 18, background: '#fafaf9', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: 12.5, color: '#475569' }}>
              Subscription contract renews automatically on <strong>Sept 05, 2027</strong>.
            </span>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className={styles.btnSecondary} onClick={() => onNavigate('customer_portal')}>
              View in Customer Portal →
            </button>
            <button className={styles.btnPrimary} onClick={() => onNavigate('reports')}>
              View Revenue Reports →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
