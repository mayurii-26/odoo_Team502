'use client'

import React, { useState } from 'react'
import listStyles from './ApprovalsWireframe.module.css'
import detailStyles from './ApprovalDetailWireframe.module.css'
import { Quotation, ActiveModule } from './types'

interface ApprovalsModuleProps {
  quotations: Quotation[]
  onUpdateQuotation: (updated: Quotation) => void
  onNavigate: (module: ActiveModule) => void
  onShowToast: (msg: string) => void
}

interface ApprovalItem {
  id: string
  quotation: string
  customer: string
  blendedRisk: 'HIGH' | 'MEDIUM' | 'LOW'
  stage: string
  assignedTo: string
  status: 'Pending' | 'Returned' | 'Approved'
}

export default function ApprovalsModule({
  quotations,
  onUpdateQuotation,
  onNavigate,
  onShowToast,
}: ApprovalsModuleProps) {
  // Default view is 'list' (Screen #5), clicking a row opens 'detail' (Screen #6)
  const [currentView, setCurrentView] = useState<'list' | 'detail'>('list')
  const [selectedQuotation, setSelectedQuotation] = useState<string>('Q-1042')
  const [filterPendingOnly, setFilterPendingOnly] = useState(false)

  // Status for Q-1042
  const [q1042Status, setQ1042Status] = useState<'Pending' | 'Approved' | 'Returned' | 'Rejected'>('Pending')

  // Audit trail log state
  const [auditLog, setAuditLog] = useState([
    { user: 'J. Rao', action: 'Submitted', date: 'Aug 20', note: 'Initial 12% discount' },
    { user: 'M. Shah', action: 'Returned', date: 'Aug 21', note: 'Requested justification' },
    { user: 'J. Rao', action: 'Resubmitted', date: 'Aug 22', note: 'Added margin note' },
  ])

  // Items for Approvals (List) - Screen #5
  const [approvalsList, setApprovalsList] = useState<ApprovalItem[]>([
    {
      id: 'appr-1',
      quotation: 'Q-1042',
      customer: 'Acme Corp',
      blendedRisk: 'HIGH',
      stage: 'Sales Manager',
      assignedTo: 'M. Shah',
      status: 'Pending',
    },
    {
      id: 'appr-2',
      quotation: 'Q-1039',
      customer: 'Beta Industries',
      blendedRisk: 'MEDIUM',
      stage: 'Finance',
      assignedTo: 'R. Iyer',
      status: 'Pending',
    },
    {
      id: 'appr-3',
      quotation: 'Q-1035',
      customer: 'Nova Retail',
      blendedRisk: 'LOW',
      stage: 'Auto-Approved',
      assignedTo: '-',
      status: 'Approved',
    },
  ])

  function handleRowClick(quotationId: string) {
    setSelectedQuotation(quotationId)
    setCurrentView('detail')
  }

  function handleApprove() {
    setQ1042Status('Approved')
    setAuditLog(prev => [
      ...prev,
      { user: 'M. Shah', action: 'Approved', date: 'Just now', note: 'Authorized by Sales Manager' },
    ])
    setApprovalsList(prev =>
      prev.map(a => (a.quotation === 'Q-1042' ? { ...a, status: 'Approved', stage: 'Approved' } : a))
    )
    const matchedQuote = quotations.find(q => q.id === 'Q-1042')
    if (matchedQuote) {
      onUpdateQuotation({
        ...matchedQuote,
        status: 'Approved',
        approvalDetails: {
          approvedBy: 'M. Shah (Sales Manager)',
          approvedAt: new Date().toISOString().split('T')[0],
          approvalLevelRequired: 'Manager',
        },
      })
    }
    onShowToast('Quotation Q-1042 approved by Sales Manager (M. Shah)!')
  }

  function handleReturn() {
    setQ1042Status('Returned')
    setAuditLog(prev => [
      ...prev,
      { user: 'M. Shah', action: 'Returned', date: 'Just now', note: 'Returned to rep: Setup service discount exceeds 10% ceiling' },
    ])
    setApprovalsList(prev =>
      prev.map(a => (a.quotation === 'Q-1042' ? { ...a, status: 'Returned', stage: 'Returned' } : a))
    )
    onShowToast('Quotation Q-1042 returned to J. Rao for revision.')
  }

  function handleReject() {
    setQ1042Status('Rejected')
    setAuditLog(prev => [
      ...prev,
      { user: 'M. Shah', action: 'Rejected', date: 'Just now', note: 'Rejected: Unacceptable gross margin erosion' },
    ])
    setApprovalsList(prev =>
      prev.map(a => (a.quotation === 'Q-1042' ? { ...a, status: 'Returned', stage: 'Rejected' } : a))
    )
    onShowToast('Quotation Q-1042 rejected.')
  }

  const displayedList = filterPendingOnly
    ? approvalsList.filter(a => a.status === 'Pending')
    : approvalsList

  /* ──────────────────────────────────────────────────────────
     SCREEN #6: APPROVAL DETAIL
     Opened by clicking a row on the Approvals list
     ────────────────────────────────────────────────────────── */
  if (currentView === 'detail') {
    return (
      <div className={detailStyles.container}>
        {/* Header */}
        <div className={detailStyles.header}>
          <div>
            <h1 className={detailStyles.title}>
              Approval Detail: {selectedQuotation} ({selectedQuotation === 'Q-1039' ? 'Beta Industries' : selectedQuotation === 'Q-1035' ? 'Nova Retail' : 'Acme Corp'})
            </h1>
            <p className={detailStyles.subtitle}>
              Opened by clicking a row on the Approvals list
            </p>
          </div>
          <button className={detailStyles.btnBack} onClick={() => setCurrentView('list')}>
            ← Back to Approvals List
          </button>
        </div>

        {/* Top Badges / Chips */}
        <div className={detailStyles.chipsRow}>
          <div className={detailStyles.chipRisk}>
            Blended Risk: {selectedQuotation === 'Q-1035' ? 'LOW' : selectedQuotation === 'Q-1039' ? 'MEDIUM' : 'HIGH'}
          </div>
          <div className={detailStyles.chipTier}>
            Customer Tier: {selectedQuotation === 'Q-1035' ? 'Bronze' : selectedQuotation === 'Q-1039' ? 'Silver' : 'Gold'}
          </div>
        </div>

        {/* Section Heading */}
        <h2 className={detailStyles.sectionHeading}>Why This Quote Was Flagged</h2>

        {/* Flagged Lines Table */}
        <div className={detailStyles.tableCard}>
          <table className={detailStyles.table}>
            <thead>
              <tr>
                <th>Line</th>
                <th>Discount Given</th>
                <th>Limit Allowed</th>
                <th>Over By</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Laptop (Hardware)</strong></td>
                <td>12%</td>
                <td>15%</td>
                <td style={{ color: '#4ade80' }}>0 pt - OK</td>
              </tr>
              <tr>
                <td><strong>Setup Service (Services)</strong></td>
                <td>18%</td>
                <td>10%</td>
                <td style={{ color: '#f87171', fontWeight: 600 }}>8 pt OVER</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Golden / Amber Alert Banner */}
        <div className={detailStyles.alertBanner}>
          <span>
            Worst single line (8pt over) plus overall pattern across the order sets the blended score. One bad line is enough to require approval.
          </span>
        </div>

        {/* Approval Workflow Stepper Diagram */}
        <div className={detailStyles.workflowContainer}>
          <div className={detailStyles.stepNode}>
            <div className={detailStyles.circleGreen} />
            <span className={detailStyles.nodeLabel}>Submitted</span>
          </div>

          <div className={detailStyles.arrowLine} />

          <div className={detailStyles.stepNode}>
            <div className={detailStyles.circleBlue} />
            <span className={detailStyles.nodeLabel}>Sales Manager</span>
          </div>

          <div className={detailStyles.arrowLine} />

          <div className={detailStyles.stepNode}>
            <div className={detailStyles.circleDark} />
            <span className={detailStyles.nodeLabel}>Finance</span>
          </div>

          <div className={detailStyles.arrowLine} />

          <div className={detailStyles.stepNode}>
            <div className={detailStyles.circleDark} />
            <span className={detailStyles.nodeLabel}>Confirmed</span>
          </div>
        </div>

        {/* Audit Trail & History Table */}
        <div className={detailStyles.tableCard}>
          <table className={detailStyles.table}>
            <thead>
              <tr>
                <th>User</th>
                <th>Action</th>
                <th>Date</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              {auditLog.map((row, idx) => (
                <tr key={idx}>
                  <td><strong>{row.user}</strong></td>
                  <td>
                    <span
                      style={{
                        color:
                          row.action === 'Approved'
                            ? '#4ade80'
                            : row.action === 'Returned'
                            ? '#fbbf24'
                            : row.action === 'Rejected'
                            ? '#f87171'
                            : '#ffffff',
                        fontWeight: 600,
                      }}
                    >
                      {row.action}
                    </span>
                  </td>
                  <td>{row.date}</td>
                  <td style={{ color: '#cbd5e1' }}>{row.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Bottom Action Buttons */}
        <div className={detailStyles.actionsRow}>
          <button className={detailStyles.btnApprove} onClick={handleApprove}>
            Approve
          </button>
          <button className={detailStyles.btnReturn} onClick={handleReturn}>
            Return for Revision
          </button>
          <button className={detailStyles.btnReject} onClick={handleReject}>
            Reject
          </button>
        </div>
      </div>
    )
  }

  /* ──────────────────────────────────────────────────────────
     SCREEN #5: APPROVALS LIST (Default View)
     Clicking a row navigates to Screen #6
     ────────────────────────────────────────────────────────── */
  return (
    <div className={listStyles.container}>
      {/* Header */}
      <div className={listStyles.header}>
        <h1 className={listStyles.title}>Approvals (List)</h1>
        <p className={listStyles.subtitle}>
          Every quotation that needed, needs, or is going through discount approval
        </p>
      </div>

      {/* Status Counter Badges / Pills Row */}
      <div className={listStyles.badgesRow}>
        <button
          className={listStyles.badgePending}
          onClick={() => setFilterPendingOnly(true)}
          title="Filter pending only"
        >
          3 Pending
        </button>

        <button
          className={listStyles.badgeReturned}
          onClick={() => setFilterPendingOnly(false)}
          title="Filter returned"
        >
          1 Returned
        </button>

        <button
          className={listStyles.badgeApproved}
          onClick={() => setFilterPendingOnly(false)}
          title="Filter approved"
        >
          12 Approved
        </button>
      </div>

      {/* Approvals Table Card */}
      <div className={listStyles.tableCard}>
        <table className={listStyles.table}>
          <thead>
            <tr>
              <th>Quotation</th>
              <th>Customer</th>
              <th>Blended Risk</th>
              <th>Stage</th>
              <th>Assigned To</th>
            </tr>
          </thead>
          <tbody>
            {displayedList.map(row => (
              <tr
                key={row.id}
                className={listStyles.tableRow}
                onClick={() => handleRowClick(row.quotation)}
                title={`Click to open Approval Detail for ${row.quotation}`}
              >
                <td><strong>{row.quotation}</strong></td>
                <td>{row.customer}</td>
                <td>
                  <span
                    style={{
                      fontWeight: 700,
                      color:
                        row.blendedRisk === 'HIGH'
                          ? '#f87171'
                          : row.blendedRisk === 'MEDIUM'
                          ? '#fbbf24'
                          : '#4ade80',
                    }}
                  >
                    {row.blendedRisk}
                  </span>
                </td>
                <td>{row.stage}</td>
                <td>{row.assignedTo}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Golden Alert Banner */}
      <div className={listStyles.alertBanner}>
        <span>Click any row to open its full approval detail, risk breakdown, and audit trail.</span>
      </div>

      {/* Filter Button */}
      <div className={listStyles.filterRow}>
        <button
          className={`${listStyles.btnFilter} ${filterPendingOnly ? listStyles.btnFilterActive : ''}`}
          onClick={() => setFilterPendingOnly(!filterPendingOnly)}
        >
          {filterPendingOnly ? 'Filter: Showing Pending Only (Click to Show All)' : 'Filter: Pending Only'}
        </button>
      </div>
    </div>
  )
}
