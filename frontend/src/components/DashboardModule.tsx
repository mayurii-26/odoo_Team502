'use client'

import React from 'react'
import styles from './DashboardWireframe.module.css'
import { Quotation, ActiveModule, UserSession } from './types'

interface DashboardModuleProps {
  quotations: Quotation[]
  onNavigate: (module: ActiveModule) => void
  onSelectQuotation: (id: string) => void
  user?: UserSession
}

export default function DashboardModule({
  quotations,
  onNavigate,
  onSelectQuotation,
  user,
}: DashboardModuleProps) {
  const role = user?.role || 'sales_rep'
  const pendingApprovalsCount = quotations.filter(q => q.status === 'Under Review').length
  const openQuotationsCount = quotations.filter(q => q.status !== 'Fulfilled' && q.status !== 'Rejected').length
  const atRiskDealsCount = quotations.filter(q => q.riskLevel === 'High').length

  // First available quote ID
  const firstQuoteId = quotations[0]?.id || 'Q-1042'

  /* ── 1. Admin Dashboard ─────────────────────────────────── */
  if (role === 'admin') {
    return (
      <div className={styles.canvas}>
        <div className={styles.header}>
          <h1 className={styles.title}>Root Admin Command Center</h1>
          <p className={styles.subtitle}>
            System-wide user provisioning, role-based access governance, and direct messaging
          </p>
        </div>

        <div className={styles.cardsRow}>
          <div
            className={styles.card}
            onClick={() => onNavigate('admin_directory')}
            title="Click to view all users"
          >
            <div className={styles.cardTitle}>Total Users & Directory</div>
            <div className={styles.cardCount}>{openQuotationsCount > 0 ? `${openQuotationsCount} Active Accounts` : 'View Directory'}</div>
          </div>

          <div
            className={styles.card}
            onClick={() => onNavigate('admin_access')}
            title="Click to manage role access"
          >
            <div className={styles.cardTitle}>Role Access & Provisioning</div>
            <div className={styles.cardCount}>Manage Roles</div>
          </div>

          <div
            className={styles.card}
            onClick={() => onNavigate('admin_messages')}
            title="Click to compose message"
          >
            <div className={styles.cardTitle}>Direct Announcements</div>
            <div className={styles.cardCount}>Broadcast Message</div>
          </div>
        </div>

        <div className={styles.actionsRow}>
          <button
            className={styles.btnNewQuote}
            onClick={() => onNavigate('admin_access')}
          >
            Manage Role Access
          </button>
          <button
            className={styles.btnViewApprovals}
            onClick={() => onNavigate('admin_messages')}
          >
            Broadcast Message
          </button>
          <button
            className={styles.btnViewApprovals}
            onClick={() => onNavigate('admin_directory')}
          >
            View User Directory
          </button>
        </div>

        <div className={styles.activitySection}>
          <h2 className={styles.activityTitle}>System Governance & Admin Logs</h2>
          <ul className={styles.activityList}>
            {quotations.slice(0, 3).map((q, i) => (
              <li key={i} className={styles.activityItem}>
                <span className={styles.activityDot} />
                <span>
                  {q.id} — {q.customerName}: {q.status}
                  {q.approvalWorkflow?.managerNotes ? ` — "${q.approvalWorkflow.managerNotes}"` : ''}
                </span>
              </li>
            ))}
            {quotations.length === 0 && (
              <li className={styles.activityItem}>
                <span className={styles.activityDot} />
                <span>No recent system activity. Data loads from PostgreSQL backend.</span>
              </li>
            )}
          </ul>
        </div>
      </div>
    )
  }

  /* ── 2. Customer / Standard User Dashboard ─────────────── */
  if (role === 'customer' || role === 'user') {
    return (
      <div className={styles.canvas}>
        <div className={styles.header}>
          <h1 className={styles.title}>{role === 'user' ? 'User Portal Dashboard' : 'Customer Portal Dashboard'}</h1>
          <p className={styles.subtitle}>
            Welcome {user?.fullName || user?.companyName || 'User'}. Review your active quotation, proposals, and deal communications
          </p>
        </div>

        <div className={styles.cardsRow}>
          <div
            className={styles.card}
            onClick={() => onNavigate('customer_portal')}
            title="Click to view quotation"
          >
            <div className={styles.cardTitle}>My Active Quotation</div>
            <div className={styles.cardCount}>
              {firstQuoteId !== 'Q-1042' ? firstQuoteId : openQuotationsCount > 0 ? `${openQuotationsCount} Proposal${openQuotationsCount !== 1 ? 's' : ''}` : 'No active proposals'}
            </div>
          </div>

          <div
            className={styles.card}
            onClick={() => onNavigate('customer_portal')}
            title="Click to view negotiation status"
          >
            <div className={styles.cardTitle}>Negotiation Status</div>
            <div className={styles.cardCount}>
              {pendingApprovalsCount > 0 ? `${pendingApprovalsCount} Under Review` : 'Up to date'}
            </div>
          </div>

          <div
            className={styles.card}
            onClick={() => onNavigate('messages')}
            title="Click to view messages"
          >
            <div className={styles.cardTitle}>Direct Messages</div>
            <div className={styles.cardCount}>View Messages</div>
          </div>
        </div>

        <div className={styles.actionsRow}>
          <button
            className={styles.btnNewQuote}
            onClick={() => onNavigate('customer_portal')}
          >
            Review &amp; Sign Quotation
          </button>
          <button
            className={styles.btnViewApprovals}
            onClick={() => onNavigate('messages')}
          >
            Message Sales Rep
          </button>
          <button
            className={styles.btnViewApprovals}
            onClick={() => onNavigate('profile')}
          >
            Company Profile
          </button>
        </div>

        <div className={styles.activitySection}>
          <h2 className={styles.activityTitle}>Quotation &amp; Deal History</h2>
          <ul className={styles.activityList}>
            {quotations.slice(0, 3).map((q, i) => (
              <li key={i} className={styles.activityItem}>
                <span className={styles.activityDot} />
                <span>
                  {q.id} — {q.customerName}: {q.status}
                  {q.createdAt ? ` (${q.createdAt})` : ''}
                </span>
              </li>
            ))}
            {quotations.length === 0 && (
              <li className={styles.activityItem}>
                <span className={styles.activityDot} />
                <span>No quotation history available yet.</span>
              </li>
            )}
          </ul>
        </div>
      </div>
    )
  }

  /* ── 3. Sales Manager Dashboard ─────────────────────────── */
  if (role === 'sales_manager') {
    return (
      <div className={styles.canvas}>
        <div className={styles.header}>
          <h1 className={styles.title}>Sales Management &amp; Approvals</h1>
          <p className={styles.subtitle}>
            Supervise team pipeline, discount threshold approvals, and revenue risk
          </p>
        </div>

        <div className={styles.cardsRow}>
          <div
            className={styles.card}
            onClick={() => onNavigate('approvals')}
            title="Click to review approvals"
          >
            <div className={styles.cardTitle}>Pending Approvals</div>
            <div className={styles.cardCount}>{pendingApprovalsCount} requiring action</div>
          </div>

          <div
            className={styles.card}
            onClick={() => onNavigate('quotations')}
            title="Click to view pipeline"
          >
            <div className={styles.cardTitle}>Team Active Deals</div>
            <div className={styles.cardCount}>{openQuotationsCount} in pipeline</div>
          </div>

          <div
            className={styles.card}
            onClick={() => onNavigate('deal_health')}
            title="Click to view deal health"
          >
            <div className={styles.cardTitle}>High Risk Deals</div>
            <div className={styles.cardCount}>{atRiskDealsCount} flagged</div>
          </div>
        </div>

        <div className={styles.actionsRow}>
          <button
            className={styles.btnNewQuote}
            onClick={() => onNavigate('approvals')}
          >
            Review Approvals Queue
          </button>
          <button
            className={styles.btnViewApprovals}
            onClick={() => onNavigate('quotations')}
          >
            View Pipeline Kanban
          </button>
          <button
            className={styles.btnViewApprovals}
            onClick={() => onNavigate('reports')}
          >
            Executive Reports
          </button>
        </div>

        <div className={styles.activitySection}>
          <h2 className={styles.activityTitle}>Management Activity</h2>
          <ul className={styles.activityList}>
            {quotations.slice(0, 3).map((q, i) => (
              <li key={i} className={styles.activityItem}>
                <span className={styles.activityDot} />
                <span>
                  {q.id} — {q.customerName}: {q.status}
                  {q.salesRep ? ` (Rep: ${q.salesRep})` : ''}
                </span>
              </li>
            ))}
            {quotations.length === 0 && (
              <li className={styles.activityItem}>
                <span className={styles.activityDot} />
                <span>No recent pipeline activity. Data loads from PostgreSQL backend.</span>
              </li>
            )}
          </ul>
        </div>
      </div>
    )
  }

  /* ── 4. Finance Dashboard ───────────────────────────────── */
  if (role === 'finance') {
    return (
      <div className={styles.canvas}>
        <div className={styles.header}>
          <h1 className={styles.title}>Finance &amp; Ledger Operations</h1>
          <p className={styles.subtitle}>
            Invoices ledger, payment reconciliations, and margin governance
          </p>
        </div>

        <div className={styles.cardsRow}>
          <div
            className={styles.card}
            onClick={() => onNavigate('invoices')}
            title="Click to view invoices"
          >
            <div className={styles.cardTitle}>Invoices Ledger</div>
            <div className={styles.cardCount}>{pendingApprovalsCount > 0 ? `${pendingApprovalsCount} Awaiting Payment` : 'View Ledger'}</div>
          </div>

          <div
            className={styles.card}
            onClick={() => onNavigate('deal_health')}
            title="Click to view deal health"
          >
            <div className={styles.cardTitle}>Margin Risk Warnings</div>
            <div className={styles.cardCount}>{atRiskDealsCount} low-margin quote{atRiskDealsCount !== 1 ? 's' : ''}</div>
          </div>

          <div
            className={styles.card}
            onClick={() => onNavigate('governance')}
            title="Click to view governance"
          >
            <div className={styles.cardTitle}>Governance Limits</div>
            <div className={styles.cardCount}>View Rules</div>
          </div>
        </div>

        <div className={styles.actionsRow}>
          <button
            className={styles.btnNewQuote}
            onClick={() => onNavigate('invoices')}
          >
            Invoices &amp; Ledger
          </button>
          <button
            className={styles.btnViewApprovals}
            onClick={() => onNavigate('governance')}
          >
            Governance Rules
          </button>
          <button
            className={styles.btnViewApprovals}
            onClick={() => onNavigate('reports')}
          >
            Financial Reports
          </button>
        </div>

        <div className={styles.activitySection}>
          <h2 className={styles.activityTitle}>Financial Reconciliation Logs</h2>
          <ul className={styles.activityList}>
            {quotations.filter(q => q.status === 'Fulfilled' || q.status === 'Confirmed').slice(0, 3).map((q, i) => (
              <li key={i} className={styles.activityItem}>
                <span className={styles.activityDot} />
                <span>
                  {q.id} — {q.customerName}: {q.status}
                  {q.billing?.invoiceId ? ` · Invoice ${q.billing.invoiceId}` : ''}
                </span>
              </li>
            ))}
            {quotations.filter(q => q.status === 'Fulfilled' || q.status === 'Confirmed').length === 0 && (
              <li className={styles.activityItem}>
                <span className={styles.activityDot} />
                <span>No completed transactions yet. Financial data loads from PostgreSQL backend.</span>
              </li>
            )}
          </ul>
        </div>
      </div>
    )
  }

  /* ── 5. Sales Representative Dashboard (Default) ────────── */
  return (
    <div className={styles.canvas}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>Sales Representative Pipeline</h1>
        <p className={styles.subtitle}>
          Welcome {user?.fullName || user?.email || 'Sales Rep'}. Personal deal pipeline, active customer quotes, and execution queue
        </p>
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
          <div className={styles.cardCount}>{pendingApprovalsCount} quotation{pendingApprovalsCount !== 1 ? 's' : ''}</div>
        </div>

        {/* Card 2: Open Quotations */}
        <div
          className={styles.card}
          onClick={() => onNavigate('quotations')}
          title="Click to view quotations"
        >
          <div className={styles.cardTitle}>My Open Quotations</div>
          <div className={styles.cardCount}>{openQuotationsCount} active deal{openQuotationsCount !== 1 ? 's' : ''}</div>
        </div>

        {/* Card 3: At-Risk Deals */}
        <div
          className={styles.card}
          onClick={() => onNavigate('deal_health')}
          title="Click to view deal health"
        >
          <div className={styles.cardTitle}>At-Risk Quotes Flagged</div>
          <div className={styles.cardCount}>{atRiskDealsCount} flagged</div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className={styles.actionsRow}>
        <button
          className={styles.btnNewQuote}
          onClick={() => {
            onSelectQuotation('new')
            onNavigate('builder')
          }}
        >
          + Create Quotation
        </button>

        <button
          className={styles.btnViewApprovals}
          onClick={() => onNavigate('quotations')}
        >
          Quotations Kanban
        </button>

        <button
          className={styles.btnViewApprovals}
          onClick={() => onNavigate('approvals')}
        >
          Approvals Queue
        </button>
      </div>

      {/* Recent Activity Section */}
      <div className={styles.activitySection}>
        <h2 className={styles.activityTitle}>Recent Pipeline Activity</h2>
        <ul className={styles.activityList}>
          {quotations.slice(0, 3).map((q, i) => (
            <li key={i} className={styles.activityItem}>
              <span className={styles.activityDot} />
              <span>
                {q.id} — {q.customerName}: {q.status}
                {q.createdAt ? ` (${q.createdAt})` : ''}
              </span>
            </li>
          ))}
          {quotations.length === 0 && (
            <li className={styles.activityItem}>
              <span className={styles.activityDot} />
              <span>No pipeline activity yet. Create your first quotation to get started.</span>
            </li>
          )}
        </ul>
      </div>
    </div>
  )
}
