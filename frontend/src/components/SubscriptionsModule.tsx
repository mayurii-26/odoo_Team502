'use client'

import React, { useState } from 'react'
import styles from './SubscriptionsWireframe.module.css'
import { ActiveModule } from './types'

interface SubscriptionsModuleProps {
  onNavigate: (module: ActiveModule) => void
  onShowToast: (msg: string) => void
}

interface SubscriptionRow {
  id: string
  customer: string
  plan: string
  cycle: string
  nextBill: string
  status: 'Active' | 'Paused' | 'Cancelled'
}

export default function SubscriptionsModule({
  onNavigate,
  onShowToast,
}: SubscriptionsModuleProps) {
  // Starts on Screen #9 (List), clicking a row opens Screen #10 (Detail)
  const [currentView, setCurrentView] = useState<'list' | 'detail'>('list')
  const [selectedCustomer, setSelectedCustomer] = useState<string>('Acme Corp')
  const [selectedPlan, setSelectedPlan] = useState<string>('Care Plan 2yr')
  const [filterStatus, setFilterStatus] = useState<string | null>(null)

  // Subscriptions List (Screen #9)
  const [subscriptionsList, setSubscriptionsList] = useState<SubscriptionRow[]>([
    {
      id: 'sub-1',
      customer: 'Acme Corp',
      plan: 'Care Plan 2yr',
      cycle: 'Monthly',
      nextBill: 'Sep 15',
      status: 'Active',
    },
    {
      id: 'sub-2',
      customer: 'Beta Industries',
      plan: 'Support SLA',
      cycle: 'Quarterly',
      nextBill: 'Nov 1',
      status: 'Active',
    },
    {
      id: 'sub-3',
      customer: 'Delta LLC',
      plan: 'Care Plan 1yr',
      cycle: 'Monthly',
      nextBill: '-',
      status: 'Paused',
    },
  ])

  // One-time originating lines (Screen #10)
  const oneTimeLines = [
    { product: 'Laptop Pro 14', qty: 2, amount: '$2,280' },
    { product: 'Onsite Setup', qty: 1, amount: '$450' },
  ]

  // Recurring lines (Screen #10)
  const [recurringLines, setRecurringLines] = useState([
    { plan: 'Care Plan 2yr', cycle: 'Monthly', nextBillDate: 'Sep 15', amount: '$46' },
    { plan: 'Support SLA', cycle: 'Quarterly', nextBillDate: 'Nov 1', amount: '$300' },
  ])

  function handleRowClick(customer: string, plan: string) {
    setSelectedCustomer(customer)
    setSelectedPlan(plan)
    setCurrentView('detail')
  }

  function handleModifySubscription() {
    const newCycle = prompt('Enter new billing cycle (Monthly / Annual / Quarterly):', 'Annual')
    if (newCycle) {
      setRecurringLines(prev =>
        prev.map(r => (r.plan === selectedPlan ? { ...r, cycle: newCycle } : r))
      )
      onShowToast(`Subscription modified: cycle updated to ${newCycle}.`)
    }
  }

  function handleCancelSubscription() {
    const confirmCancel = confirm(`Are you sure you want to cancel ${selectedPlan} for ${selectedCustomer}?`)
    if (confirmCancel) {
      setSubscriptionsList(prev =>
        prev.map(s => (s.customer === selectedCustomer ? { ...s, status: 'Cancelled', nextBill: '-' } : s))
      )
      onShowToast(`Subscription cancelled for ${selectedCustomer}.`)
      setCurrentView('list')
    }
  }

  function handleCreateNewPlan() {
    const planName = prompt('Enter new plan name (e.g. 24/7 SLA Premium):')
    if (planName) {
      const created: SubscriptionRow = {
        id: `sub-${Date.now()}`,
        customer: 'Acme Corp',
        plan: planName,
        cycle: 'Monthly',
        nextBill: 'Oct 01',
        status: 'Active',
      }
      setSubscriptionsList(prev => [created, ...prev])
      onShowToast(`Created plan: ${planName}`)
    }
  }

  const displayedList = filterStatus
    ? subscriptionsList.filter(s => s.status === filterStatus)
    : subscriptionsList

  /* ──────────────────────────────────────────────────────────
     SCREEN #10: BILLING DETAIL
     Opened by clicking a row on the Subscriptions list
     ────────────────────────────────────────────────────────── */
  if (currentView === 'detail') {
    return (
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>
              Billing Detail: {selectedCustomer} - {selectedPlan}
            </h1>
            <p className={styles.subtitle}>
              Opened by clicking a row on the Subscriptions list
            </p>
          </div>
          <button className={styles.btnBack} onClick={() => setCurrentView('list')}>
            ← Back to Subscriptions List
          </button>
        </div>

        {/* Section 1: One-Time Lines */}
        <h2 className={styles.sectionHeading}>One-Time Lines (from originating order)</h2>

        <div className={styles.tableCard}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Product</th>
                <th>Qty</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {oneTimeLines.map((row, idx) => (
                <tr key={idx}>
                  <td><strong>{row.product}</strong></td>
                  <td>{row.qty}</td>
                  <td><strong>{row.amount}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Section 2: Recurring Lines */}
        <h2 className={styles.sectionHeading}>Recurring Lines</h2>

        <div className={styles.tableCard}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Plan</th>
                <th>Cycle</th>
                <th>Next Bill Date</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {recurringLines.map((row, idx) => (
                <tr key={idx}>
                  <td><strong>{row.plan}</strong></td>
                  <td>{row.cycle}</td>
                  <td>{row.nextBillDate}</td>
                  <td><strong>{row.amount}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Action Buttons Row */}
        <div className={styles.actionsRow}>
          <button className={styles.btnModify} onClick={handleModifySubscription}>
            Modify Subscription
          </button>

          <button className={styles.btnCancelSub} onClick={handleCancelSubscription}>
            Cancel Subscription
          </button>
        </div>
      </div>
    )
  }

  /* ──────────────────────────────────────────────────────────
     SCREEN #9: SUBSCRIPTIONS (LIST)
     Every recurring plan across every customer, regardless of which order it came from
     ────────────────────────────────────────────────────────── */
  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>Subscriptions (List)</h1>
        <p className={styles.subtitle}>
          Every recurring plan across every customer, regardless of which order it came from
        </p>
      </div>

      {/* Status Counter Badges / Pills Row */}
      <div className={styles.badgesRow}>
        <button
          className={styles.badgeActive}
          onClick={() => setFilterStatus(filterStatus === 'Active' ? null : 'Active')}
          title="Filter active subscriptions"
        >
          18 Active
        </button>

        <button
          className={styles.badgePaused}
          onClick={() => setFilterStatus(filterStatus === 'Paused' ? null : 'Paused')}
          title="Filter paused subscriptions"
        >
          2 Paused
        </button>

        <button
          className={styles.badgeCancelled}
          onClick={() => setFilterStatus(filterStatus === 'Cancelled' ? null : 'Cancelled')}
          title="Filter cancelled subscriptions"
        >
          3 Cancelled
        </button>
      </div>

      {/* Subscriptions Table Card */}
      <div className={styles.tableCard}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Customer</th>
              <th>Plan</th>
              <th>Cycle</th>
              <th>Next Bill</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {displayedList.map(row => (
              <tr
                key={row.id}
                className={styles.tableRow}
                onClick={() => handleRowClick(row.customer, row.plan)}
                title={`Click to open billing detail for ${row.customer}`}
              >
                <td><strong>{row.customer}</strong></td>
                <td>{row.plan}</td>
                <td>{row.cycle}</td>
                <td>{row.nextBill}</td>
                <td>
                  <span
                    style={{
                      fontWeight: 600,
                      color:
                        row.status === 'Active'
                          ? '#4ade80'
                          : row.status === 'Paused'
                          ? '#fbbf24'
                          : '#f87171',
                    }}
                  >
                    {row.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Golden Alert Banner */}
      <div className={styles.alertBanner}>
        <span>Click a subscription row to open its billing detail and proration history.</span>
      </div>

      {/* Action Buttons Row */}
      <div className={styles.actionsRow}>
        <button className={styles.btnNewPlan} onClick={handleCreateNewPlan}>
          + New Plan (Admin)
        </button>

        {filterStatus && (
          <button
            className={styles.btnNewPlan}
            onClick={() => setFilterStatus(null)}
            style={{ color: '#38bdf8', borderColor: '#38bdf8' }}
          >
            Clear Filter (Show All)
          </button>
        )}
      </div>
    </div>
  )
}
