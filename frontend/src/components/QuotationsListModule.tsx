'use client'

import React, { useState } from 'react'
import styles from './QuotationsWireframe.module.css'
import { Quotation, ActiveModule } from './types'

interface QuotationsListProps {
  quotations: Quotation[]
  onSelectQuotation: (id: string) => void
  onNavigate: (module: ActiveModule) => void
}

interface WireframeDeal {
  id: string
  label: string
  customer: string
  value: string
  status: 'Draft' | 'Pending Approval' | 'Approved' | 'Negotiation' | 'Confirmed'
}

export default function QuotationsListModule({
  quotations,
  onSelectQuotation,
  onNavigate,
}: QuotationsListProps) {
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban')

  // Exact deals shown in the wireframe
  const wireframeDeals: WireframeDeal[] = [
    { id: 'Q-1042', label: 'Acme Corp - $12,400', customer: 'Acme Corp', value: '$12,400', status: 'Draft' },
    { id: 'Q-1043', label: 'Delta LLC - $3,200', customer: 'Delta LLC', value: '$3,200', status: 'Draft' },
    { id: 'Q-1039', label: 'Beta Industries - $28,900', customer: 'Beta Industries', value: '$28,900', status: 'Pending Approval' },
    { id: 'Q-1044', label: 'Nova Retail - $9,750', customer: 'Nova Retail', value: '$9,750', status: 'Approved' },
    { id: 'Q-1045', label: 'Zenith Co - $15,300', customer: 'Zenith Co', value: '$15,300', status: 'Negotiation' },
    { id: 'Q-1040', label: 'Orion Ltd - $41,000', customer: 'Orion Ltd', value: '$41,000', status: 'Confirmed' },
  ]

  const columns: Array<{
    status: WireframeDeal['status']
    title: string
  }> = [
    { status: 'Draft', title: 'Draft' },
    { status: 'Pending Approval', title: 'Pending Approval' },
    { status: 'Approved', title: 'Approved' },
    { status: 'Negotiation', title: 'Negotiation' },
    { status: 'Confirmed', title: 'Confirmed' },
  ]

  function handleOpenDeal(dealId: string) {
    onSelectQuotation(dealId)
    onNavigate('builder')
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>Quotations (List)</h1>
        <p className={styles.subtitle}>
          Every quotation in the system, one row per quotation, click a row to open it
        </p>
      </div>

      {viewMode === 'kanban' ? (
        /* ── 5 Tall Kanban Columns Matching Wireframe Screen #3 ── */
        <div className={styles.kanbanGrid}>
          {columns.map(col => {
            const dealsInCol = wireframeDeals.filter(d => d.status === col.status)
            return (
              <div key={col.status} className={styles.column}>
                <div className={styles.columnTitle}>{col.title}</div>
                <div className={styles.cardsContainer}>
                  {dealsInCol.map(deal => (
                    <div
                      key={deal.id}
                      className={styles.dealCard}
                      onClick={() => handleOpenDeal(deal.id)}
                      title={`Click to open ${deal.label}`}
                    >
                      {deal.label}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* ── Alternate Table View ── */
        <div className={styles.tableCard}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Deal ID</th>
                <th>Customer / Account</th>
                <th>Contract Value</th>
                <th>Pipeline Status</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {wireframeDeals.map(d => (
                <tr key={d.id} onClick={() => handleOpenDeal(d.id)}>
                  <td><strong>{d.id}</strong></td>
                  <td>{d.customer}</td>
                  <td><strong>{d.value}</strong></td>
                  <td>{d.status}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className={styles.btnSwitchView}
                      style={{ padding: '4px 12px', fontSize: 12 }}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleOpenDeal(d.id)
                      }}
                    >
                      Open Quotation →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Action Buttons under Column 1 ── */}
      <div className={styles.actionsRow}>
        <button
          className={styles.btnNewQuote}
          onClick={() => {
            onSelectQuotation('Q-1042')
            onNavigate('builder')
          }}
        >
          + New Quotation
        </button>

        <button
          className={styles.btnSwitchView}
          onClick={() => setViewMode(viewMode === 'kanban' ? 'table' : 'kanban')}
        >
          {viewMode === 'kanban' ? 'Switch to Table View' : 'Switch to Kanban View'}
        </button>
      </div>
    </div>
  )
}
