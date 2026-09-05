'use client'

import { useState } from 'react'
import styles from './Dashboard.module.css'

import { UserRole, UserSession, Quotation } from './types'

export type { UserSession }

interface DashboardProps {
  user: UserSession
  quotations?: Quotation[]
  onLogout: () => void
  onSwitchRole: (newRole: UserRole) => void
}

export default function Dashboard({ user, quotations = [], onLogout, onSwitchRole }: DashboardProps) {
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [localQuotations, setLocalQuotations] = useState<Quotation[]>(quotations)

  // Keep in sync with parent prop updates
  useState(() => {
    setLocalQuotations(quotations)
  })

  function showToast(msg: string) {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  function handleApprove(id: string) {
    setLocalQuotations(prev =>
      prev.map(q => q.id === id ? { ...q, status: 'Approved' as const, riskLevel: 'Low' as const } : q)
    )
    showToast(`Quotation ${id} has been approved and forwarded to fulfillment.`)
  }

  function handleAcceptCustomerDeal(id: string) {
    setLocalQuotations(prev =>
      prev.map(q => q.id === id ? { ...q, status: 'Confirmed' as const } : q)
    )
    showToast(`Quotation ${id} accepted! Sent to billing & warehouse dispatch.`)
  }

  const roleLabelMap: Record<UserSession['role'], string> = {
    admin: 'Administrator',
    sales_manager: 'Sales Manager',
    sales_rep: 'Sales Representative',
    finance: 'Financial Officer',
    customer: 'Customer Portal',
    user: 'Standard User',
  }

  const badgeClassMap: Record<UserSession['role'], string> = {
    admin: styles.roleBadgeAdmin,
    sales_manager: styles.roleBadgeSales,
    sales_rep: styles.roleBadgeSales,
    finance: styles.roleBadgeSales,
    customer: styles.roleBadgeCustomer,
    user: styles.roleBadgeCustomer,
  }

  // Computed metrics from live data
  const totalValue = localQuotations.reduce((sum, q) => {
    const total = q.items.reduce((s, item) => s + item.qty * item.unitPrice * (1 - item.discountPct / 100), 0)
    return sum + total
  }, 0)

  const pendingApprovals = localQuotations.filter(q => q.status === 'Under Review').length
  const avgDiscount = localQuotations.length > 0
    ? localQuotations.reduce((sum, q) => {
        const avgD = q.items.length > 0
          ? q.items.reduce((s, i) => s + i.discountPct, 0) / q.items.length
          : 0
        return sum + avgD
      }, 0) / localQuotations.length
    : 0

  // Customer-specific metrics
  const customerQuotes = localQuotations.filter(q =>
    q.customerName?.toLowerCase() === (user.companyName || '').toLowerCase() ||
    user.role === 'customer'
  )
  const customerPendingAction = customerQuotes.filter(q => q.status === 'Under Review' || q.status === 'Negotiating').length
  const customerTotalValue = customerQuotes.reduce((sum, q) => {
    const total = q.items.reduce((s, item) => s + item.qty * item.unitPrice * (1 - item.discountPct / 100), 0)
    return sum + total
  }, 0)

  return (
    <div className={styles.container}>
      {/* ── Top Header Bar ──────────────────────────────────── */}
      <header className={styles.topNav}>
        <div className={styles.brand}>
          <div className={styles.logoMark}>D</div>
          <div className={styles.logoText}>
            DealFlow<span className={styles.logoAccent}>360</span>
          </div>
          <span className={`${styles.roleBadge} ${badgeClassMap[user.role]}`}>
            {roleLabelMap[user.role]}
          </span>
        </div>

        <div className={styles.navControls}>
          <div className={styles.roleSwitcher}>
            <span>Role View:</span>
            <select
              className={styles.roleSelect}
              value={user.role}
              onChange={e => onSwitchRole(e.target.value as UserSession['role'])}
            >
              <option value="admin">Admin</option>
              <option value="sales_manager">Sales Manager</option>
              <option value="sales_rep">Sales Representative</option>
              <option value="customer">Customer Portal</option>
            </select>
          </div>

          <div className={styles.userInfo}>
            <div className={styles.avatar}>
              {user.fullName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className={styles.userName}>{user.fullName}</div>
              <div className={styles.userEmail}>{user.email}</div>
            </div>
          </div>

          <button onClick={onLogout} className={styles.logoutBtn} title="Sign out">
            Log Out
          </button>
        </div>
      </header>

      {/* ── Main Workspace ───────────────────────────────────── */}
      <main className={styles.main}>
        {/* Page Title & Quick Actions */}
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}>
              {user.role === 'customer'
                ? `Customer Portal — ${user.companyName || 'Your Account'}`
                : `${roleLabelMap[user.role]} Workspace`}
            </h1>
            <p className={styles.pageSubtitle}>
              {user.role === 'customer'
                ? 'Review, negotiate, and approve your active quotations and orders.'
                : 'Self-governing sales operations: quotations, discount governance, and fulfillment.'}
            </p>
          </div>

          <div className={styles.headerActions}>
            {user.role === 'admin' && (
              <button className={styles.btnPrimary} onClick={() => showToast('Opening user provisioning panel...')}>
                <span>+</span> Invite Internal User
              </button>
            )}
            {(user.role === 'sales_rep' || user.role === 'sales_manager') && (
              <button
                className={styles.btnPrimary}
                onClick={() => showToast('Opening Quotation Builder with AI upsell recommendations...')}
              >
                <span>+</span> Create New Quotation
              </button>
            )}
            {user.role === 'customer' && (
              <button
                className={styles.btnSecondary}
                onClick={() => showToast('Connecting to your dedicated Sales Representative...')}
              >
                💬 Contact Sales Rep
              </button>
            )}
          </div>
        </div>

        {/* KPI Metrics */}
        <section className={styles.metricsGrid}>
          {user.role !== 'customer' ? (
            <>
              <div className={styles.metricCard}>
                <div className={styles.metricLabel}>Total Pipeline Value</div>
                <div className={styles.metricValue}>
                  {totalValue > 0 ? `$${totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : '—'}
                </div>
                <div className={`${styles.metricTrend} ${styles.trendPositive}`}>
                  {localQuotations.length} active deals
                </div>
              </div>
              <div className={styles.metricCard}>
                <div className={styles.metricLabel}>Pending Approval Queue</div>
                <div className={styles.metricValue}>
                  {pendingApprovals} Deal{pendingApprovals !== 1 ? 's' : ''}
                </div>
                <div className={`${styles.metricTrend} ${styles.trendWarning}`}>
                  {pendingApprovals > 0 ? 'Requires Manager Review' : 'No pending reviews'}
                </div>
              </div>
              <div className={styles.metricCard}>
                <div className={styles.metricLabel}>Avg. Governed Discount</div>
                <div className={styles.metricValue}>
                  {localQuotations.length > 0 ? `${avgDiscount.toFixed(1)}%` : '—'}
                </div>
                <div className={`${styles.metricTrend} ${styles.trendPositive}`}>
                  Within system ceiling
                </div>
              </div>
              <div className={styles.metricCard}>
                <div className={styles.metricLabel}>Active Quotations</div>
                <div className={styles.metricValue}>{localQuotations.length}</div>
                <div className={`${styles.metricTrend} ${styles.trendPositive}`}>
                  {localQuotations.filter(q => q.riskLevel === 'High').length} high risk flagged
                </div>
              </div>
            </>
          ) : (
            <>
              <div className={styles.metricCard}>
                <div className={styles.metricLabel}>Active Quotations</div>
                <div className={styles.metricValue}>{customerQuotes.length} Proposal{customerQuotes.length !== 1 ? 's' : ''}</div>
                <div className={`${styles.metricTrend} ${styles.trendPositive}`}>
                  {customerQuotes.length > 0 ? 'Under review' : 'No active proposals'}
                </div>
              </div>
              <div className={styles.metricCard}>
                <div className={styles.metricLabel}>Pending Your Action</div>
                <div className={styles.metricValue}>{customerPendingAction} Quotation{customerPendingAction !== 1 ? 's' : ''}</div>
                <div className={`${styles.metricTrend} ${styles.trendWarning}`}>
                  {customerPendingAction > 0 ? 'Awaiting your decision' : 'No actions required'}
                </div>
              </div>
              <div className={styles.metricCard}>
                <div className={styles.metricLabel}>Total Proposed Value</div>
                <div className={styles.metricValue}>
                  {customerTotalValue > 0 ? `$${customerTotalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : '—'}
                </div>
                <div className={`${styles.metricTrend} ${styles.trendPositive}`}>
                  {customerQuotes.length > 0 ? 'Includes volume discounts' : ''}
                </div>
              </div>
            </>
          )}
        </section>

        {/* Main Quotations / Deals Table */}
        <section className={styles.tableCard}>
          <div className={styles.tableHeaderBar}>
            <div>
              <h2 className={styles.tableTitle}>
                {user.role === 'customer' ? 'Your Quotations & Proposals' : 'Active Deals & Quotations'}
              </h2>
              <p className={styles.tableSubtitle}>
                {user.role === 'customer'
                  ? 'Review specifications, negotiate terms, or approve proposals.'
                  : 'Real-time risk scoring, automated approval routing, and deal status.'}
              </p>
            </div>
          </div>

          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Deal ID</th>
                  <th>Customer / Account</th>
                  <th>Products</th>
                  <th>Value</th>
                  <th>Discount</th>
                  <th>Risk Score</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {localQuotations.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
                      No quotations loaded yet.
                    </td>
                  </tr>
                ) : (
                  localQuotations.map(q => {
                    const dealValue = q.items.reduce((s, item) => s + item.qty * item.unitPrice * (1 - item.discountPct / 100), 0)
                    const avgD = q.items.length > 0
                      ? q.items.reduce((s, i) => s + i.discountPct, 0) / q.items.length
                      : 0
                    const productNames = q.items.map(i => i.name).join(', ')

                    return (
                      <tr key={q.id}>
                        <td><strong>{q.id}</strong></td>
                        <td>{q.customerName}</td>
                        <td style={{ maxWidth: 280 }}>{productNames || q.dealName}</td>
                        <td><strong>${dealValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong></td>
                        <td>{avgD.toFixed(1)}%</td>
                        <td>
                          <span
                            className={`${styles.badge} ${
                              q.riskLevel === 'Low'
                                ? styles.badgeRiskLow
                                : q.riskLevel === 'Medium'
                                ? styles.badgeRiskMedium
                                : styles.badgeRiskHigh
                            }`}
                          >
                            {q.riskLevel} ({q.blendedRiskScore})
                          </span>
                        </td>
                        <td>
                          <span
                            className={`${styles.badge} ${
                              q.status === 'Approved' || q.status === 'Confirmed'
                                ? styles.badgeSuccess
                                : q.status === 'Under Review'
                                ? styles.badgeWarning
                                : styles.badgeInfo
                            }`}
                          >
                            {q.status}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          {user.role === 'customer' ? (
                            <div style={{ display: 'inline-flex', gap: 6 }}>
                              <button
                                className={styles.btnAction}
                                onClick={() => showToast(`Opening negotiation notes for ${q.id}...`)}
                              >
                                Counter-Offer
                              </button>
                              <button
                                className={`${styles.btnAction} ${styles.btnPrimary}`}
                                style={{ padding: '4px 10px', fontSize: 12 }}
                                onClick={() => handleAcceptCustomerDeal(q.id)}
                              >
                                Accept Deal
                              </button>
                            </div>
                          ) : (
                            <div style={{ display: 'inline-flex', gap: 6 }}>
                              {q.status === 'Under Review' && (user.role === 'sales_manager' || user.role === 'admin') && (
                                <button
                                  className={styles.btnAction}
                                  style={{ color: '#15803d', borderColor: '#bbf7d0' }}
                                  onClick={() => handleApprove(q.id)}
                                >
                                  Approve
                                </button>
                              )}
                              <button
                                className={styles.btnAction}
                                onClick={() => showToast(`Opening audit log & full breakdown for ${q.id}`)}
                              >
                                Inspect
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className={styles.toast}>
          {toastMessage}
        </div>
      )}
    </div>
  )
}
