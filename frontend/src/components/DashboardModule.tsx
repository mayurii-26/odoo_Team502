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
  const pendingApprovalsCount = quotations.filter(q => q.status === 'Under Review').length
  const openQuotationsCount = quotations.filter(q => q.status !== 'Fulfilled' && q.status !== 'Rejected').length
  const atRiskDealsCount = quotations.filter(q => q.riskLevel === 'High').length

  return (
    <div className={styles.canvas}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>Sales Overview</h1>
        <p className={styles.subtitle}>Executive summary of pipeline activity and active deals</p>
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
          <div className={styles.cardCount}>{pendingApprovalsCount} quotations</div>
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
          <div className={styles.cardCount}>{atRiskDealsCount} flagged</div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className={styles.actionsRow}>
        <button
          className={styles.btnNewQuote}
          onClick={() => {
            const firstId = quotations[0]?.id || 'Q-1042'
            onSelectQuotation(firstId)
            onNavigate('builder')
          }}
        >
          Create Quotation
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
          <li className={styles.activityItem}>
            <span className={styles.activityDot} />
            <span>Acme Corp quotation approved by Sales Operations</span>
          </li>
          <li className={styles.activityItem}>
            <span className={styles.activityDot} />
            <span>Beta Industries requested volume pricing revision</span>
          </li>
          <li className={styles.activityItem}>
            <span className={styles.activityDot} />
            <span>North America warehouse inventory allocated for Order #2291</span>
          </li>
        </ul>
      </div>
    </div>
  )
}
