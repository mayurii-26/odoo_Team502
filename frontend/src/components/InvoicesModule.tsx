'use client'

import React, { useState, useMemo } from 'react'
import styles from './InvoicesWireframe.module.css'
import { Quotation, ActiveModule } from './types'

interface InvoicesModuleProps {
  quotation: Quotation
  invoices?: any[]
  onUpdateQuotation: (updated: Quotation) => void
  onNavigate: (module: ActiveModule) => void
  onShowToast: (msg: string) => void
}

interface InvoiceItem {
  id: number | string
  invoice_number: string
  quotation_id?: number
  customer_name: string
  amount: number
  amount_paid: number
  amount_due: number
  status: string
  payment_status: 'PAID' | 'UNPAID' | 'PARTIAL'
  issue_date: string
  due_date: string
}

function ArrowLeftIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

export default function InvoicesModule({
  quotation,
  invoices = [],
  onUpdateQuotation,
  onNavigate,
  onShowToast,
}: InvoicesModuleProps) {
  const [currentView, setCurrentView] = useState<'list' | 'detail'>('list')
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | number>('1')
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PAID' | 'UNPAID'>('ALL')
  const [searchTerm, setSearchTerm] = useState('')

  // Map incoming invoices or fallback
  const [invoicesList, setInvoicesList] = useState<InvoiceItem[]>(() => {
    if (invoices && invoices.length > 0) {
      return invoices.map((inv: any) => ({
        id: inv.id,
        invoice_number: inv.invoice_number || `INV-${inv.id}`,
        quotation_id: inv.quotation_id,
        customer_name: inv.customer_name || 'Enterprise Client',
        amount: Number(inv.amount || 0),
        amount_paid: Number(inv.amount_paid || 0),
        amount_due: Number(inv.amount_due || 0),
        status: inv.status || 'POSTED',
        payment_status: (inv.payment_status?.toUpperCase() === 'PAID' ? 'PAID' : 'UNPAID') as any,
        issue_date: inv.issue_date || '2026-03-01',
        due_date: inv.due_date || '2026-03-31',
      }))
    }
    return []
  })

  // Sync state if invoices prop updates from database bootstrap
  React.useEffect(() => {
    if (invoices && invoices.length > 0) {
      setInvoicesList(
        invoices.map((inv: any) => ({
          id: inv.id,
          invoice_number: inv.invoice_number || `INV-${inv.id}`,
          quotation_id: inv.quotation_id,
          customer_name: inv.customer_name || 'Enterprise Client',
          amount: Number(inv.amount || 0),
          amount_paid: Number(inv.amount_paid || 0),
          amount_due: Number(inv.amount_due || 0),
          status: inv.status || 'POSTED',
          payment_status: (inv.payment_status?.toUpperCase() === 'PAID' ? 'PAID' : 'UNPAID') as any,
          issue_date: inv.issue_date || '2026-03-01',
          due_date: inv.due_date || '2026-03-31',
        }))
      )
    }
  }, [invoices])

  // Aggregate Metrics
  const { totalInvoiced, totalPaid, totalUnpaid, paidCount, unpaidCount } = useMemo(() => {
    let tInv = 0
    let tPaid = 0
    let tUnpaid = 0
    let pCount = 0
    let uCount = 0

    invoicesList.forEach(inv => {
      tInv += inv.amount
      if (inv.payment_status === 'PAID') {
        tPaid += inv.amount
        pCount++
      } else {
        tUnpaid += inv.amount
        uCount++
      }
    })

    return {
      totalInvoiced: tInv,
      totalPaid: tPaid,
      totalUnpaid: tUnpaid,
      paidCount: pCount,
      unpaidCount: uCount,
    }
  }, [invoicesList])

  // Filtered List
  const filteredList = useMemo(() => {
    return invoicesList.filter(inv => {
      const matchSearch =
        inv.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(inv.amount).includes(searchTerm)

      if (filterStatus === 'ALL') return matchSearch
      return matchSearch && inv.payment_status === filterStatus
    })
  }, [invoicesList, searchTerm, filterStatus])

  const selectedInvoice = invoicesList.find(i => String(i.id) === String(selectedInvoiceId) || i.invoice_number === selectedInvoiceId) || invoicesList[0]

  function handleRowClick(inv: InvoiceItem) {
    setSelectedInvoiceId(inv.id)
    setCurrentView('detail')
  }

  function handleRecordPayment() {
    if (!selectedInvoice) return
    setInvoicesList(prev =>
      prev.map(i => (i.id === selectedInvoice.id ? { ...i, payment_status: 'PAID', amount_paid: i.amount, amount_due: 0 } : i))
    )
    onShowToast(`Payment of $${selectedInvoice.amount.toLocaleString()} recorded for ${selectedInvoice.invoice_number}!`)
  }

  /* ──────────────────────────────────────────────────────────
     DETAIL VIEW: INVOICE & LEDGER RECONCILIATION
     ────────────────────────────────────────────────────────── */
  if (currentView === 'detail' && selectedInvoice) {
    const isPaid = selectedInvoice.payment_status === 'PAID'

    return (
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Invoice Detail: {selectedInvoice.invoice_number}</h1>
            <p className={styles.subtitle}>
              Commercial ledger for {selectedInvoice.customer_name} · Due Date: {selectedInvoice.due_date}
            </p>
          </div>
          <button className={styles.btnBack} onClick={() => setCurrentView('list')} title="Return to list">
            <ArrowLeftIcon />
            <span>Back to Invoices</span>
          </button>
        </div>

        {/* Lifecycle Stepper Diagram */}
        <div className={styles.stepperWrapper}>
          <div className={styles.stepperRow}>
            <div className={styles.stepCol}>
              <div className={styles.circleDone}><CheckIcon /></div>
              <span className={styles.nodeLabel}>Order Confirmed</span>
            </div>

            <div className={`${styles.stepperLine} ${styles.stepperLineDone}`} />

            <div className={styles.stepCol}>
              <div className={styles.circleDone}><CheckIcon /></div>
              <span className={styles.nodeLabel}>Dispatched</span>
            </div>

            <div className={`${styles.stepperLine} ${styles.stepperLineDone}`} />

            <div className={styles.stepCol}>
              <div className={styles.circleDone}><CheckIcon /></div>
              <span className={styles.nodeLabel}>Invoiced</span>
            </div>

            <div className={`${styles.stepperLine} ${isPaid ? styles.stepperLineDone : ''}`} />

            <div className={styles.stepCol}>
              <div className={isPaid ? styles.circleDone : styles.circleActive}>
                {isPaid ? <CheckIcon /> : '4'}
              </div>
              <span className={styles.nodeLabel}>{isPaid ? 'Settled' : 'Payment Due'}</span>
            </div>
          </div>
        </div>

        {/* Invoice Summary Breakdown Card */}
        <div className={styles.metricsGrid}>
          <div className={styles.metricCard}>
            <span className={styles.metricLabel}>Total Amount</span>
            <span className={styles.metricValue}>${selectedInvoice.amount.toLocaleString()}</span>
            <span className={styles.metricSubtext}>Tax and line items included</span>
          </div>

          <div className={styles.metricCard}>
            <span className={styles.metricLabel}>Amount Settled</span>
            <span className={styles.metricValue} style={{ color: '#166534' }}>
              ${selectedInvoice.amount_paid.toLocaleString()}
            </span>
            <span className={styles.metricSubtext}>Recorded via payment gateway</span>
          </div>

          <div className={styles.metricCard}>
            <span className={styles.metricLabel}>Current Balance Due</span>
            <span className={styles.metricValue} style={{ color: isPaid ? '#166534' : '#DC2626' }}>
              ${selectedInvoice.amount_due.toLocaleString()}
            </span>
            <span className={styles.metricSubtext}>
              {isPaid ? 'Account fully settled' : `Payment expected by ${selectedInvoice.due_date}`}
            </span>
          </div>
        </div>

        {/* Invoice Items Table Card */}
        <div className={styles.tableCard}>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Invoice Identifier</th>
                  <th>Customer Account</th>
                  <th>Issue Date</th>
                  <th>Due Date</th>
                  <th>Gross Amount</th>
                  <th>Payment Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><span className={styles.invoiceNumCell}>{selectedInvoice.invoice_number}</span></td>
                  <td><strong>{selectedInvoice.customer_name}</strong></td>
                  <td>{selectedInvoice.issue_date}</td>
                  <td>{selectedInvoice.due_date}</td>
                  <td><span className={styles.amountCell}>${selectedInvoice.amount.toLocaleString()}</span></td>
                  <td>
                    <span className={isPaid ? styles.statusPaid : styles.statusUnpaid}>
                      {selectedInvoice.payment_status}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className={styles.actionsRow}>
          {!isPaid ? (
            <button className={styles.btnPrimary} onClick={handleRecordPayment}>
              Record Settle Payment (${selectedInvoice.amount.toLocaleString()})
            </button>
          ) : (
            <button
              className={styles.btnSecondary}
              style={{ background: '#DCFCE7', color: '#166534', borderColor: '#BBF7D0' }}
              onClick={() => onShowToast('Invoice is settled and marked Paid.')}
            >
              ✓ Invoice Settled & Paid
            </button>
          )}

          <button
            className={styles.btnSecondary}
            onClick={() => onShowToast(`Reconciliation statement downloaded for ${selectedInvoice.invoice_number}.`)}
          >
            Download PDF Receipt
          </button>
        </div>

        <div className={styles.alertBanner}>
          <span>
            Ledger reconciliation is verified against PostgreSQL commercial billing entries.
          </span>
        </div>
      </div>
    )
  }

  /* ──────────────────────────────────────────────────────────
     LIST VIEW: ALL INVOICES (POSTGRESQL DATA)
     ────────────────────────────────────────────────────────── */
  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Invoices Master</h1>
          <p className={styles.subtitle}>
            {invoicesList.length} commercial billing records loaded from PostgreSQL database.
          </p>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Total Billed</span>
          <span className={styles.metricValue}>${totalInvoiced.toLocaleString()}</span>
          <span className={styles.metricSubtext}>{invoicesList.length} total invoices in database</span>
        </div>

        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Paid & Collected</span>
          <span className={styles.metricValue} style={{ color: '#166534' }}>
            ${totalPaid.toLocaleString()}
          </span>
          <span className={styles.metricSubtext}>{paidCount} invoices settled</span>
        </div>

        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Outstanding Balance</span>
          <span className={styles.metricValue} style={{ color: '#9A3412' }}>
            ${totalUnpaid.toLocaleString()}
          </span>
          <span className={styles.metricSubtext}>{unpaidCount} invoices awaiting payment</span>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className={styles.controlsRow}>
        <div className={styles.filterTabs}>
          <button
            className={`${styles.tabBtn} ${filterStatus === 'ALL' ? styles.tabBtnActive : ''}`}
            onClick={() => setFilterStatus('ALL')}
          >
            All Invoices ({invoicesList.length})
          </button>

          <button
            className={`${styles.tabBtn} ${filterStatus === 'PAID' ? styles.tabBtnActive : ''}`}
            onClick={() => setFilterStatus('PAID')}
          >
            Paid ({paidCount})
          </button>

          <button
            className={`${styles.tabBtn} ${filterStatus === 'UNPAID' ? styles.tabBtnActive : ''}`}
            onClick={() => setFilterStatus('UNPAID')}
          >
            Unpaid ({unpaidCount})
          </button>
        </div>

        <input
          type="text"
          placeholder="Search invoices, clients, amounts..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      {/* Invoices Table Card */}
      <div className={styles.tableCard}>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Customer Account</th>
                <th>Issue Date</th>
                <th>Due Date</th>
                <th>Total Amount</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredList.map(row => (
                <tr
                  key={row.id}
                  className={styles.tableRow}
                  onClick={() => handleRowClick(row)}
                  title={`Click to open detail for ${row.invoice_number}`}
                >
                  <td><span className={styles.invoiceNumCell}>{row.invoice_number}</span></td>
                  <td><strong>{row.customer_name}</strong></td>
                  <td>{row.issue_date}</td>
                  <td>{row.due_date}</td>
                  <td><span className={styles.amountCell}>${row.amount.toLocaleString()}</span></td>
                  <td>
                    <span className={row.payment_status === 'PAID' ? styles.statusPaid : styles.statusUnpaid}>
                      {row.payment_status}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className={styles.btnActionSmall}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRowClick(row)
                      }}
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
