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
            <div className={styles.cardCount}>6 Accounts Active</div>
          </div>

          <div
            className={styles.card}
            onClick={() => onNavigate('admin_access')}
            title="Click to manage role access"
          >
            <div className={styles.cardTitle}>Role Access & Provisioning</div>
            <div className={styles.cardCount}>5 Roles Governed</div>
          </div>

          <div
            className={styles.card}
            onClick={() => onNavigate('admin_messages')}
            title="Click to compose message"
          >
            <div className={styles.cardTitle}>Direct Announcements</div>
            <div className={styles.cardCount}>3 Broadcasts Sent</div>
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
            <li className={styles.activityItem}>
              <span className={styles.activityDot} />
              <span>Security policy updated: 15% discount threshold configured for Sales Manager role</span>
            </li>
            <li className={styles.activityItem}>
              <span className={styles.activityDot} />
              <span>Direct announcement dispatched to all active Sales Representatives</span>
            </li>
            <li className={styles.activityItem}>
              <span className={styles.activityDot} />
              <span>User account &apos;David Miller&apos; provisioned with Finance &amp; Audit privileges</span>
            </li>
          </ul>
        </div>
      </div>
    )
  }

  /* ── 2. Customer Dashboard ──────────────────────────────── */
  if (role === 'customer') {
    return (
      <div className={styles.canvas}>
        <div className={styles.header}>
          <h1 className={styles.title}>Customer Portal Dashboard</h1>
          <p className={styles.subtitle}>
            Welcome {user?.companyName || 'Acme Corp'}. Review your active quotation, counter-offers, and negotiation terms
          </p>
        </div>

        <div className={styles.cardsRow}>
          <div
            className={styles.card}
            onClick={() => onNavigate('customer_portal')}
            title="Click to view quotation"
          >
            <div className={styles.cardTitle}>My Active Quotation</div>
            <div className={styles.cardCount}>{firstQuoteId} — $124,500</div>
          </div>

          <div
            className={styles.card}
            onClick={() => onNavigate('customer_portal')}
            title="Click to view negotiation status"
          >
            <div className={styles.cardTitle}>Negotiation Status</div>
            <div className={styles.cardCount}>In Review (Counter-Offer)</div>
          </div>

          <div
            className={styles.card}
            onClick={() => onNavigate('messages')}
            title="Click to view messages"
          >
            <div className={styles.cardTitle}>Direct Messages</div>
            <div className={styles.cardCount}>2 New Messages</div>
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
            <li className={styles.activityItem}>
              <span className={styles.activityDot} />
              <span>Sales Rep Jane Smith submitted proposal {firstQuoteId} with bundle discounts</span>
            </li>
            <li className={styles.activityItem}>
              <span className={styles.activityDot} />
              <span>Counter-offer submitted requesting 15% discount on Extended Warranty</span>
            </li>
            <li className={styles.activityItem}>
              <span className={styles.activityDot} />
              <span>Requested delivery timeline adjusted to October 15, 2026</span>
            </li>
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
            <li className={styles.activityItem}>
              <span className={styles.activityDot} />
              <span>Discount escalation: Jane Smith requested 18% discount for Acme Corp</span>
            </li>
            <li className={styles.activityItem}>
              <span className={styles.activityDot} />
              <span>Deal Q-1043 approved and dispatched for customer signature</span>
            </li>
            <li className={styles.activityItem}>
              <span className={styles.activityDot} />
              <span>Monthly team quota pacing currently at 114% of target</span>
            </li>
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
            <div className={styles.cardCount}>3 Awaiting Payment</div>
          </div>

          <div
            className={styles.card}
            onClick={() => onNavigate('deal_health')}
            title="Click to view deal health"
          >
            <div className={styles.cardTitle}>Margin Risk Warnings</div>
            <div className={styles.cardCount}>{atRiskDealsCount} low-margin quotes</div>
          </div>

          <div
            className={styles.card}
            onClick={() => onNavigate('governance')}
            title="Click to view governance"
          >
            <div className={styles.cardTitle}>Governance Limits</div>
            <div className={styles.cardCount}>20% Max Threshold</div>
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
            <li className={styles.activityItem}>
              <span className={styles.activityDot} />
              <span>Invoice INV-2026-081 marked as Paid via Automated Bank Wire</span>
            </li>
            <li className={styles.activityItem}>
              <span className={styles.activityDot} />
              <span>Deal Q-1044 audited with blended margin confirmed at 36.4%</span>
            </li>
            <li className={styles.activityItem}>
              <span className={styles.activityDot} />
              <span>Quarterly revenue recognition batch scheduled for midnight</span>
            </li>
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
          Welcome {user?.fullName || 'Jane Smith'}. Personal deal pipeline, active customer quotes, and execution queue
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
          <div className={styles.cardCount}>{pendingApprovalsCount} quotations</div>
        </div>

        {/* Card 2: Open Quotations */}
        <div
          className={styles.card}
          onClick={() => onNavigate('quotations')}
          title="Click to view quotations"
        >
          <div className={styles.cardTitle}>My Open Quotations</div>
          <div className={styles.cardCount}>{openQuotationsCount} active deals</div>
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
            onSelectQuotation(firstQuoteId)
            onNavigate('builder')
          }}
        >
          Create Quotation
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
