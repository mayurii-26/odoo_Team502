'use client'

import { useState } from 'react'
import styles from './Dashboard.module.css'

export interface UserSession {
  email: string
  fullName: string
  role: 'admin' | 'sales_rep' | 'sales_manager' | 'customer'
  companyName?: string
}

interface DashboardProps {
  user: UserSession
  onLogout: () => void
  onSwitchRole: (newRole: UserSession['role']) => void
}

export default function Dashboard({ user, onLogout, onSwitchRole }: DashboardProps) {
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  
  // Demo quotation state
  const [quotations, setQuotations] = useState([
    {
      id: 'Q-2026-081',
      customer: 'Apex Logistics Corp',
      items: 'Enterprise Fleet Tracker + 250 IoT Sensors',
      value: '$84,500',
      discount: '14.5%',
      risk: 'Low',
      riskScore: 24,
      status: 'Approved',
      rep: 'Jane Smith',
    },
    {
      id: 'Q-2026-082',
      customer: 'Nexus Global Systems',
      items: 'DealFlow Platform SaaS (12mo) + Onboarding',
      value: '$142,000',
      discount: '22.0%',
      risk: 'High',
      riskScore: 78,
      status: 'Under Review',
      rep: 'Alex Rivera',
    },
    {
      id: 'Q-2026-083',
      customer: 'Vanguard Health Solutions',
      items: 'Compliance Security Engine Suite',
      value: '$65,000',
      discount: '8.0%',
      risk: 'Low',
      riskScore: 12,
      status: 'Customer Review',
      rep: 'Jane Smith',
    },
    {
      id: 'Q-2026-084',
      customer: 'Hyperion Energy',
      items: 'Smart Meter Integration Module',
      value: '$118,500',
      discount: '18.5%',
      risk: 'Medium',
      riskScore: 45,
      status: 'Negotiating',
      rep: 'Marcus Vance',
    },
  ])

  // Internal users for admin view
  const [usersList, setUsersList] = useState([
    { id: 1, name: 'Sarah Connor (You)', email: 'admin@dealflow360.com', role: 'Admin', status: 'Active' },
    { id: 2, name: 'Alex Rivera', email: 'manager@dealflow360.com', role: 'Sales Manager', status: 'Active' },
    { id: 3, name: 'Jane Smith', email: 'sales@dealflow360.com', role: 'Sales Rep', status: 'Active' },
    { id: 4, name: 'David Miller', email: 'david.m@dealflow360.com', role: 'Finance / Ops', status: 'Active' },
    { id: 5, name: 'Elena Rostova', email: 'elena.r@enterprise.org', role: 'Sales Rep', status: 'Pending Invite' },
  ])

  function showToast(msg: string) {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  function handleApprove(id: string) {
    setQuotations(prev =>
      prev.map(q => q.id === id ? { ...q, status: 'Approved', risk: 'Low' } : q)
    )
    showToast(`Quotation ${id} has been approved and forwarded to fulfillment.`)
  }

  function handleAcceptCustomerDeal(id: string) {
    setQuotations(prev =>
      prev.map(q => q.id === id ? { ...q, status: 'Confirmed' } : q)
    )
    showToast(`Quotation ${id} accepted! Sent to billing & warehouse dispatch.`)
  }

  function handleInviteModal() {
    const email = prompt('Enter employee email to send invite token:')
    if (email) {
      setUsersList(prev => [
        ...prev,
        { id: Date.now(), name: 'Invited Member', email, role: 'Sales Rep', status: 'Pending Invite' },
      ])
      showToast(`One-time activation invite sent to ${email} (expires in 48h).`)
    }
  }

  const roleLabelMap: Record<UserSession['role'], string> = {
    admin: 'Administrator',
    sales_manager: 'Sales Manager',
    sales_rep: 'Sales Representative',
    customer: 'Customer Portal',
  }

  const badgeClassMap: Record<UserSession['role'], string> = {
    admin: styles.roleBadgeAdmin,
    sales_manager: styles.roleBadgeSales,
    sales_rep: styles.roleBadgeSales,
    customer: styles.roleBadgeCustomer,
  }

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
                ? `Customer Portal — ${user.companyName || 'Acme Corp'}`
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
              <button className={styles.btnPrimary} onClick={handleInviteModal}>
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

        {/* AI Deal Intelligence Recommendation Banner */}
        {user.role !== 'customer' && (
          <section className={styles.aiBanner}>
            <div className={styles.aiContent}>
              <span className={styles.aiIcon}>✨</span>
              <div>
                <div className={styles.aiTitle}>
                  AI Recommendation & Anomaly Engine Active
                </div>
                <div className={styles.aiDesc}>
                  Quotation <strong>Q-2026-082</strong> exceeds the 18% discount ceiling. ML model suggests bundling 
                  1-Year 24/7 SLA Support ($18k) to protect gross margin while keeping customer pricing competitive.
                </div>
              </div>
            </div>
            <button
              className={styles.aiActionBtn}
              onClick={() => showToast('Applied AI Bundle suggestion: Gross margin restored to 34.8%!')}
            >
              Apply AI Bundle
            </button>
          </section>
        )}

        {/* KPI Metrics */}
        <section className={styles.metricsGrid}>
          {user.role !== 'customer' ? (
            <>
              <div className={styles.metricCard}>
                <div className={styles.metricLabel}>Total Pipeline Value</div>
                <div className={styles.metricValue}>$410,000</div>
                <div className={`${styles.metricTrend} ${styles.trendPositive}`}>
                  ↑ 14.2% vs last month
                </div>
              </div>
              <div className={styles.metricCard}>
                <div className={styles.metricLabel}>Pending Approval Queue</div>
                <div className={styles.metricValue}>
                  {quotations.filter(q => q.status === 'Under Review').length} Deals
                </div>
                <div className={`${styles.metricTrend} ${styles.trendWarning}`}>
                  Requires Level-1 & Level-2 Review
                </div>
              </div>
              <div className={styles.metricCard}>
                <div className={styles.metricLabel}>Avg. Governed Discount</div>
                <div className={styles.metricValue}>15.7%</div>
                <div className={`${styles.metricTrend} ${styles.trendPositive}`}>
                  Within 20% system ceiling
                </div>
              </div>
              <div className={styles.metricCard}>
                <div className={styles.metricLabel}>Self-Governing Deal Health</div>
                <div className={styles.metricValue}>94.2%</div>
                <div className={`${styles.metricTrend} ${styles.trendPositive}`}>
                  0 Stalled negotiations
                </div>
              </div>
            </>
          ) : (
            <>
              <div className={styles.metricCard}>
                <div className={styles.metricLabel}>Active Quotations</div>
                <div className={styles.metricValue}>2 Proposals</div>
                <div className={`${styles.metricTrend} ${styles.trendPositive}`}>
                  Valid until Sept 30, 2026
                </div>
              </div>
              <div className={styles.metricCard}>
                <div className={styles.metricLabel}>Pending Your Action</div>
                <div className={styles.metricValue}>1 Quotation</div>
                <div className={`${styles.metricTrend} ${styles.trendWarning}`}>
                  Ready for electronic signature
                </div>
              </div>
              <div className={styles.metricCard}>
                <div className={styles.metricLabel}>Total Proposed Value</div>
                <div className={styles.metricValue}>$183,500</div>
                <div className={`${styles.metricTrend} ${styles.trendPositive}`}>
                  Includes pre-approved volume discount
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
                  <th>Products & Solutions</th>
                  <th>Value</th>
                  <th>Discount</th>
                  <th>Risk Score</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {quotations.map(q => (
                  <tr key={q.id}>
                    <td><strong>{q.id}</strong></td>
                    <td>{q.customer}</td>
                    <td style={{ maxWidth: 280 }}>{q.items}</td>
                    <td><strong>{q.value}</strong></td>
                    <td>{q.discount}</td>
                    <td>
                      <span
                        className={`${styles.badge} ${
                          q.risk === 'Low'
                            ? styles.badgeRiskLow
                            : q.risk === 'Medium'
                            ? styles.badgeRiskMedium
                            : styles.badgeRiskHigh
                        }`}
                      >
                        {q.risk} ({q.riskScore})
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
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Admin-only Section: User & Role Management (per memory.md specs) */}
        {user.role === 'admin' && (
          <section className={styles.tableCard}>
            <div className={styles.tableHeaderBar}>
              <div>
                <h2 className={styles.tableTitle}>Internal Team Management (Admin Governed)</h2>
                <p className={styles.tableSubtitle}>
                  Internal roles are invite-only. Role escalation is restricted to Administrators.
                </p>
              </div>
              <button className={styles.btnSecondary} onClick={handleInviteModal}>
                + Invite User
              </button>
            </div>

            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email Address</th>
                    <th>Assigned Role</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {usersList.map(u => (
                    <tr key={u.id}>
                      <td><strong>{u.name}</strong></td>
                      <td>{u.email}</td>
                      <td>
                        <span className={styles.badgeInfo}>
                          {u.role}
                        </span>
                      </td>
                      <td>
                        <span className={u.status === 'Active' ? styles.badgeSuccess : styles.badgeWarning}>
                          {u.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {u.status === 'Pending Invite' ? (
                          <button
                            className={styles.btnAction}
                            onClick={() => showToast(`Resent activation link to ${u.email}`)}
                          >
                            Resend Token
                          </button>
                        ) : (
                          <button
                            className={styles.btnAction}
                            onClick={() => showToast(`Editing role permissions for ${u.name}`)}
                          >
                            Edit Permissions
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
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
