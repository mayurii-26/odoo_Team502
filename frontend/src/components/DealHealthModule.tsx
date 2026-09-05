'use client'

import React, { useState } from 'react'
import styles from './DealHealthWireframe.module.css'
import { ActiveModule } from './types'

interface DealHealthProps {
  onNavigate: (module: ActiveModule) => void
  onSelectQuotation: (id: string) => void
  onShowToast: (msg: string) => void
}

interface DealIssue {
  id: string
  deal: string
  issue: string
  flagged: string
  action: string
}

export default function DealHealthModule({
  onNavigate,
  onSelectQuotation,
  onShowToast,
}: DealHealthProps) {
  const [selectedDealId, setSelectedDealId] = useState<string>('deal-1')

  const [dealIssues, setDealIssues] = useState<DealIssue[]>([
    {
      id: 'deal-1',
      deal: 'Zenith Co',
      issue: 'Idle 9 days',
      flagged: 'Aug 24',
      action: 'Nudge sent',
    },
    {
      id: 'deal-2',
      deal: 'Delta LLC',
      issue: 'Discount 22% vs avg 8%',
      flagged: 'Aug 25',
      action: 'Escalated to Manager',
    },
  ])

  function handleEscalate() {
    const target = dealIssues.find(d => d.id === selectedDealId) || dealIssues[1]
    setDealIssues(prev =>
      prev.map(d =>
        d.id === target.id
          ? { ...d, action: 'Escalated to Manager' }
          : d
      )
    )
    onShowToast(`Escalated ${target.deal} to Sales Manager for expedited approval and review!`)
  }

  function handleNudgeRep() {
    const target = dealIssues.find(d => d.id === selectedDealId) || dealIssues[0]
    setDealIssues(prev =>
      prev.map(d =>
        d.id === target.id
          ? { ...d, action: 'Nudge sent' }
          : d
      )
    )
    onShowToast(`Nudge sent to Account Executive for ${target.deal}! Automated follow-up triggered.`)
  }

  return (
    <div className={styles.container}>
      {/* ── Header ────────────────────────────────────────── */}
      <div className={styles.header}>
        <h1 className={styles.title}>Deal Health and Anomaly Dashboard</h1>
        <p className={styles.subtitle}>
          Real-time flags for stalled deals and unusual discount patterns
        </p>
      </div>

      {/* ── Summary Metric Cards (Row of 3) ───────────────── */}
      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <h2 className={styles.cardTitle}>Stalled Deals</h2>
          <p className={styles.cardSubtitle}>5 quotes idle 7+ days</p>
        </div>

        <div className={styles.summaryCard}>
          <h2 className={styles.cardTitle}>Discount Anomalies</h2>
          <p className={styles.cardSubtitle}>2 above rep average</p>
        </div>

        <div className={styles.summaryCard}>
          <h2 className={styles.cardTitle}>Delivery Slippage</h2>
          <p className={styles.cardSubtitle}>3 promise dates at risk</p>
        </div>
      </div>

      {/* ── Anomaly Deals Table ───────────────────────────── */}
      <div className={styles.tableCard}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Deal</th>
              <th>Issue</th>
              <th>Flagged</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {dealIssues.map(row => {
              const isSelected = row.id === selectedDealId
              return (
                <tr
                  key={row.id}
                  className={`${styles.tableRow} ${isSelected ? styles.tableRowSelected : ''}`}
                  onClick={() => setSelectedDealId(row.id)}
                  title={`Click to select ${row.deal}`}
                >
                  <td>
                    <strong>{row.deal}</strong>
                  </td>
                  <td>{row.issue}</td>
                  <td>{row.flagged}</td>
                  <td>
                    <span className={styles.actionBadge}>{row.action}</span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* ── Action Buttons Row ────────────────────────────── */}
      <div className={styles.actionsRow}>
        <button
          className={styles.btnEscalate}
          onClick={handleEscalate}
          title="Escalate selected deal to sales manager"
        >
          Escalate
        </button>

        <button
          className={styles.btnNudge}
          onClick={handleNudgeRep}
          title="Send reminder nudge to assigned sales rep"
        >
          Nudge Rep
        </button>
      </div>
    </div>
  )
}
