'use client'

import React, { useState } from 'react'
import styles from './InvoicesWireframe.module.css'
import { Quotation, ActiveModule } from './types'

interface InvoicesModuleProps {
  quotation: Quotation
  onUpdateQuotation: (updated: Quotation) => void
  onNavigate: (module: ActiveModule) => void
  onShowToast: (msg: string) => void
}

interface InvoiceRow {
  invoiceNum: string
  customer: string
  amount: string
  status: 'Unpaid' | 'Paid'
  dueDate: string
}

export default function InvoicesModule({
  quotation,
  onUpdateQuotation,
  onNavigate,
  onShowToast,
}: InvoicesModuleProps) {
  // Starts on Screen #12 (List); clicking any row opens Screen #13 (Detail)
  const [currentView, setCurrentView] = useState<'list' | 'detail'>('list')
  const [selectedInvoice, setSelectedInvoice] = useState<string>('INV-1042')
  const [selectedCustomer, setSelectedCustomer] = useState<string>('Acme Corp')
  const [filterStatus, setFilterStatus] = useState<string | null>(null)

  // Invoices List (Screen #12)
  const [invoicesList, setInvoicesList] = useState<InvoiceRow[]>([
    {
      invoiceNum: 'INV-1042',
      customer: 'Acme Corp',
      amount: '$2,730',
      status: 'Unpaid',
      dueDate: 'Sep 10',
    },
    {
      invoiceNum: 'INV-1043',
      customer: 'Acme Corp',
      amount: '$40',
      status: 'Paid',
      dueDate: 'Sep 15',
    },
    {
      invoiceNum: 'INV-1038',
      customer: 'Nova Retail',
      amount: '$9,750',
      status: 'Paid',
      dueDate: 'Aug 30',
    },
  ])

  // Screen #13 detailed line items for INV-1042
  const [detailRows, setDetailRows] = useState([
    { invoiceNum: 'INV-1042', amount: '$2,730', status: 'Unpaid', dueDate: 'Sep 10' },
    { invoiceNum: 'INV-1043 (Recurring)', amount: '$40', status: 'Paid', dueDate: 'Sep 15' },
  ])

  const isMainInvoicePaid = detailRows.find(d => d.invoiceNum === 'INV-1042')?.status === 'Paid'

  function handleRowClick(row: InvoiceRow) {
    setSelectedInvoice(row.invoiceNum)
    setSelectedCustomer(row.customer)
    setCurrentView('detail')
  }

  function handleRecordPayment() {
    setDetailRows(prev =>
      prev.map(r => (r.invoiceNum === 'INV-1042' ? { ...r, status: 'Paid' } : r))
    )
    setInvoicesList(prev =>
      prev.map(r => (r.invoiceNum === 'INV-1042' ? { ...r, status: 'Paid' } : r))
    )
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
    onShowToast('Payment of $2,730 recorded successfully for Invoice INV-1042!')
  }

  function handleDownloadSummary() {
    onShowToast('Downloaded PDF reconciliation summary for INV-1042.')
  }

  const displayedList = filterStatus
    ? invoicesList.filter(i => i.status === filterStatus)
    : invoicesList

  /* ──────────────────────────────────────────────────────────
     SCREEN #13: INVOICE DETAIL
     Opened by clicking a row on the Invoices list
     ────────────────────────────────────────────────────────── */
  if (currentView === 'detail') {
    return (
      <div className={styles.container}>
        {/* Header with Title and Back Button */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Invoice Detail: {selectedInvoice} ({selectedCustomer})</h1>
            <p className={styles.subtitle}>
              Opened by clicking a row on the Invoices list
            </p>
          </div>
          <button className={styles.btnBack} onClick={() => setCurrentView('list')} title="Return to Invoices List">
            ← Back to Invoices List
          </button>
        </div>

        {/* Lifecycle Stepper Diagram */}
        <div className={styles.stepperWrapper}>
          <div className={styles.stepperRow}>
            {/* Step 1: Order Confirmed */}
            <div className={styles.stepCol}>
              <div className={styles.circleGreen} />
              <span className={styles.nodeLabel}>Order Confirmed</span>
            </div>

            <div className={styles.arrowWrapper}>
              <div className={styles.arrowLine} />
              <div className={styles.arrowTip} />
            </div>

            {/* Step 2: Shipped */}
            <div className={styles.stepCol}>
              <div className={styles.circleGreen} />
              <span className={styles.nodeLabel}>Shipped</span>
            </div>

            <div className={styles.arrowWrapper}>
              <div className={styles.arrowLine} />
              <div className={styles.arrowTip} />
            </div>

            {/* Step 3: Invoiced */}
            <div className={styles.stepCol}>
              <div className={styles.circleBlue} />
              <span className={styles.nodeLabel}>Invoiced</span>
            </div>

            <div className={styles.arrowWrapper}>
              <div className={styles.arrowLine} />
              <div className={styles.arrowTip} />
            </div>

            {/* Step 4: Paid */}
            <div className={styles.stepCol}>
              <div className={isMainInvoicePaid ? styles.circleGreen : styles.circleDark} />
              <span className={styles.nodeLabel}>Paid</span>
            </div>
          </div>
        </div>

        {/* Invoice Split Breakdown Table */}
        <div className={styles.tableCard}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Due Date</th>
              </tr>
            </thead>
            <tbody>
              {detailRows.map((row, idx) => (
                <tr key={idx}>
                  <td><strong>{row.invoiceNum}</strong></td>
                  <td><strong>{row.amount}</strong></td>
                  <td>
                    <span
                      style={{
                        fontWeight: 600,
                        color: row.status === 'Paid' ? '#4ade80' : '#f87171',
                      }}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td>{row.dueDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Action Buttons Row */}
        <div className={styles.actionsRow}>
          {!isMainInvoicePaid ? (
            <button className={styles.btnRecordPayment} onClick={handleRecordPayment}>
              Record Payment
            </button>
          ) : (
            <button
              className={styles.btnRecordPayment}
              style={{ background: '#052e16', color: '#86efac', border: '1.5px solid #16a34a' }}
              onClick={() => onShowToast('Invoice INV-1042 is already settled and marked Paid.')}
            >
              ✓ Payment Recorded
            </button>
          )}

          <button className={styles.btnDownloadSummary} onClick={handleDownloadSummary}>
            Download Summary
          </button>
        </div>

        {/* Golden / Amber Alert Banner */}
        <div className={styles.alertBanner}>
          <span>
            Partial invoicing stays reconciled with partial delivery, nothing is billed before it ships.
          </span>
        </div>
      </div>
    )
  }

  /* ──────────────────────────────────────────────────────────
     SCREEN #12: INVOICES (LIST)
     Every invoice generated from one-time and recurring orders
     ────────────────────────────────────────────────────────── */
  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Invoices (List)</h1>
          <p className={styles.subtitle}>
            Every invoice generated from one-time and recurring orders
          </p>
        </div>
      </div>

      {/* Status Counter Badges / Pills Row */}
      <div className={styles.badgesRow}>
        <button
          className={styles.badgeUnpaid}
          onClick={() => setFilterStatus(filterStatus === 'Unpaid' ? null : 'Unpaid')}
          title="Filter unpaid invoices"
          style={filterStatus === 'Unpaid' ? { outline: '2px solid #ffffff' } : {}}
        >
          4 Unpaid
        </button>

        <button
          className={styles.badgePaid}
          onClick={() => setFilterStatus(filterStatus === 'Paid' ? null : 'Paid')}
          title="Filter paid invoices"
          style={filterStatus === 'Paid' ? { outline: '2px solid #ffffff' } : {}}
        >
          21 Paid
        </button>

        {filterStatus && (
          <button
            className={styles.btnBack}
            onClick={() => setFilterStatus(null)}
            style={{ color: '#38bdf8', borderColor: '#38bdf8' }}
          >
            Show All Invoices
          </button>
        )}
      </div>

      {/* Invoices Table Card */}
      <div className={styles.tableCard}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Invoice #</th>
              <th>Customer</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Due Date</th>
            </tr>
          </thead>
          <tbody>
            {displayedList.map(row => (
              <tr
                key={row.invoiceNum}
                className={styles.tableRow}
                onClick={() => handleRowClick(row)}
                title={`Click to open detail for ${row.invoiceNum}`}
              >
                <td><strong>{row.invoiceNum}</strong></td>
                <td>{row.customer}</td>
                <td><strong>{row.amount}</strong></td>
                <td>
                  <span
                    style={{
                      fontWeight: 600,
                      color: row.status === 'Paid' ? '#4ade80' : '#f87171',
                    }}
                  >
                    {row.status}
                  </span>
                </td>
                <td>{row.dueDate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Golden Alert Banner */}
      <div className={styles.alertBanner}>
        <span>Click an invoice row to open its full payment and delivery reconciliation detail.</span>
      </div>
    </div>
  )
}
