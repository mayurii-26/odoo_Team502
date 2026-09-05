'use client'

import React from 'react'
import styles from './DashboardWireframe.module.css'
import { Quotation, ActiveModule } from './types'

interface DashboardModuleProps {
  quotations: Quotation[]
  onNavigate: (module: ActiveModule) => void
  onSelectQuotation: (id: string) => void
}

export default function DashboardModule({
  quotations,
  onNavigate,
  onSelectQuotation,
}: DashboardModuleProps) {
  const pendingApprovalsCount = quotations.filter(q => q.status === 'Under Review').length || 4
  const openQuotationsCount = quotations.filter(q => q.status !== 'Fulfilled' && q.status !== 'Rejected').length || 12
  const atRiskDealsCount = quotations.filter(q => q.riskLevel === 'High').length || 3

  return (
    <div className={styles.canvas}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>Sales Dashboard / Home</h1>
        <p className={styles.subtitle}>Central hub, links out to every module below</p>
      </div>

      {/* 3 Overview Cards Row */}
      <div className={styles.cardsRow}>
        {/* Card 1: Pending Approvals */}
        <div
          className={styles.card}
          onClick={() => onNavigate('approvals')}
          title="Click to view approvals"
        >
          <div className={styles.cardTitle}>Pending Approvals</div>
          <div className={styles.cardCount}>{pendingApprovalsCount} quotations waiting</div>
        </div>

        {/* Card 2: Open Quotations */}
        <div
          className={styles.card}
          onClick={() => onNavigate('quotations')}
          title="Click to view quotations"
        >
          <div className={styles.cardTitle}>Open Quotations</div>
          <div className={styles.cardCount}>{openQuotationsCount} active deals</div>
        </div>

        {/* Card 3: At-Risk Deals */}
        <div
          className={styles.card}
          onClick={() => onNavigate('deal_health')}
          title="Click to view deal health"
        >
          <div className={styles.cardTitle}>At-Risk Deals</div>
          <div className={styles.cardCount}>{atRiskDealsCount} flagged by Deal Health</div>
        </div>
      </div>

      {/* Action Buttons below Card 1 */}
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
          className={styles.btnViewApprovals}
          onClick={() => onNavigate('approvals')}
        >
          View Approvals
        </button>
      </div>

      {/* Recent Activity Section */}
      <div className={styles.activitySection}>
        <h2 className={styles.activityTitle}>Recent Activity</h2>
        <ul className={styles.activityList}>
          <li>- Acme Corp quotation approved by Finance</li>
          <li>- Beta Industries requested a discount change</li>
          <li>- East Depot stock updated for Order #2291</li>
        </ul>
      </div>
    </div>
  )
}
