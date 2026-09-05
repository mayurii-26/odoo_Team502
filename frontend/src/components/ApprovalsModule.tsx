'use client'

import React, { useState } from 'react'
import listStyles from './ApprovalsWireframe.module.css'
import detailStyles from './ApprovalDetailWireframe.module.css'
import { Quotation, ActiveModule, UserSession, UserAccount, WorkflowAuditEntry } from './types'
import { exportApprovalDossierPDF } from '../lib/pdfGenerator'

interface ApprovalsModuleProps {
  quotations: Quotation[]
  approvals?: any[]
  onUpdateQuotation: (updated: Quotation) => void
  onNavigate: (module: ActiveModule) => void
  onShowToast: (msg: string) => void
  user?: UserSession
  users?: UserAccount[]
  auditLogs?: WorkflowAuditEntry[]
  onRecordAudit?: (entry: { user: string; role: string; action: string; quotationId?: string; details: string }) => void
}

interface ApprovalItem {
  id: string
  quotation: string
  customer: string
  salesRep: string
  reportingManager: string
  taggedFinance: string
  blendedRisk: 'HIGH' | 'MEDIUM' | 'LOW'
  stage: string
  status: 'Pending' | 'Returned' | 'Approved' | 'Rejected'
}

export default function ApprovalsModule({
  quotations,
  approvals = [],
  onUpdateQuotation,
  onNavigate,
  onShowToast,
  user,
  users = [],
  auditLogs = [],
  onRecordAudit,
}: ApprovalsModuleProps) {
  const [currentView, setCurrentView] = useState<'list' | 'detail'>('list')
  const [selectedQuotation, setSelectedQuotation] = useState<string>(quotations[0]?.id || 'Q-1042')
  const [filterPendingOnly, setFilterPendingOnly] = useState(false)
  const [managerReviewNote, setManagerReviewNote] = useState('')
  const [financeReviewNote, setFinanceReviewNote] = useState('')

  const isSalesManager = user?.role === 'sales_manager'
  const isFinance = user?.role === 'finance'
  const isSalesRep = user?.role === 'sales_rep'
  const isAdmin = user?.role === 'admin'

  // Helper to determine if a quote belongs to the logged-in representative
  const isUserSalesRep = React.useCallback(
    (q: Quotation): boolean => {
      if (!user || user.role !== 'sales_rep') return true
      const userFull = (user.fullName || '').trim().toLowerCase()
      const userEmail = (user.email || '').trim().toLowerCase()
      const userEmailName = userEmail.split('@')[0].replace(/[._-]/g, ' ')
      const userFirstName = userFull.split(' ')[0]

      const repName = (q.salesRep || q.approvalWorkflow?.assignedRep || '').trim().toLowerCase()
      const repEmail = (q.salesRepEmail || '').trim().toLowerCase()
      const repFirstName = repName.split(' ')[0]

      if (repEmail && userEmail && repEmail === userEmail) return true
      if (repName && (repName === userFull || repName === userEmail || repName === userEmailName)) return true
      if (userFirstName && repFirstName && userFirstName === repFirstName && userFirstName.length >= 3) return true
      if (repName && userFull && (userFull.includes(repName) || repName.includes(userFull))) return true

      return false
    },
    [user]
  )

  // Filter quotations according to user role: Sales Reps ONLY see their own approval requests
  const relevantQuotations = React.useMemo(() => {
    if (!isSalesRep) return quotations
    return quotations.filter(q => isUserSalesRep(q))
  }, [quotations, isSalesRep, isUserSalesRep])

  // Map quotations and live approvals into approval list items
  const approvalsList: ApprovalItem[] = React.useMemo(() => {
    return relevantQuotations.map(q => {
      const risk: 'HIGH' | 'MEDIUM' | 'LOW' =
        q.blendedRiskScore < 60 ? 'HIGH' : q.blendedRiskScore < 75 ? 'MEDIUM' : 'LOW'
      
      let status: 'Pending' | 'Returned' | 'Approved' | 'Rejected' = 'Pending'
      if (q.status === 'Approved' || q.status === 'Confirmed') status = 'Approved'
      else if (q.status === 'Draft' && q.approvalWorkflow?.status === 'Returned') status = 'Returned'
      else if (q.approvalWorkflow?.status === 'Rejected') status = 'Rejected'
      else status = 'Pending'

      return {
        id: `appr-${q.id}`,
        quotation: q.id,
        customer: q.customerName,
        salesRep: q.salesRep || q.approvalWorkflow?.assignedRep || user?.fullName || '',
        reportingManager: q.reportingManager || q.approvalWorkflow?.reportingManager || '',
        taggedFinance: q.taggedFinanceOfficer || q.approvalWorkflow?.taggedFinanceOfficer || 'None',
        blendedRisk: risk,
        stage: q.approvalWorkflow?.status || (status === 'Approved' ? 'Approved' : 'Sales Manager'),
        status: status,
      }
    })
  }, [relevantQuotations, user?.fullName])

  const currentQuote = quotations.find(q => q.id === selectedQuotation) || relevantQuotations[0] || quotations[0]

  function handleRowClick(quotationId: string) {
    setSelectedQuotation(quotationId)
    setManagerReviewNote('')
    setFinanceReviewNote('')
    setCurrentView('detail')
  }

  // Sales Manager Approval Handler
  function handleManagerApprove() {
    if (!currentQuote) return
    const actorName = user?.fullName || 'Sales Manager'
    const note = managerReviewNote.trim() || 'Authorized & approved by Sales Manager'
    
    const updated: Quotation = {
      ...currentQuote,
      status: currentQuote.approvalWorkflow?.taggedFinanceOfficer && currentQuote.approvalWorkflow.financeStatus === 'Pending'
        ? 'Under Review' // Still waiting on finance
        : 'Approved',
      approvalWorkflow: {
        assignedRep: currentQuote.salesRep || '',
        reportingManager: currentQuote.reportingManager || actorName,
        taggedFinanceOfficer: currentQuote.taggedFinanceOfficer,
        submittedAt: currentQuote.approvalWorkflow?.submittedAt || new Date().toISOString(),
        status: currentQuote.approvalWorkflow?.taggedFinanceOfficer && currentQuote.approvalWorkflow.financeStatus === 'Pending'
          ? 'Pending Finance'
          : 'Approved',
        managerStatus: 'Approved',
        financeStatus: currentQuote.approvalWorkflow?.financeStatus || 'Not Required',
        managerNotes: note,
        financeNotes: currentQuote.approvalWorkflow?.financeNotes,
      },
      approvalDetails: {
        approvedBy: `${actorName}`,
        approvedAt: new Date().toISOString().split('T')[0],
        approvalLevelRequired: currentQuote.taggedFinanceOfficer ? 'Manager+Finance' : 'Manager',
      },
    }

    onUpdateQuotation(updated)
    onRecordAudit?.({
      user: actorName,
      role: 'sales_manager',
      action: 'MANAGER_APPROVED',
      quotationId: currentQuote.id,
      details: `Sales Manager approved quote ${currentQuote.id} (${currentQuote.customerName}). Note: "${note}"`,
    })
    onShowToast(`Quotation ${currentQuote.id} approved by Sales Manager!`)
  }

  // Sales Manager Return to Rep Handler
  function handleManagerReturn() {
    if (!currentQuote) return
    const actorName = user?.fullName || 'Sales Manager'
    const note = managerReviewNote.trim() || 'Returned to sales representative for pricing revision'

    const updated: Quotation = {
      ...currentQuote,
      status: 'Under Review',
      approvalWorkflow: {
        assignedRep: currentQuote.salesRep || '',
        reportingManager: currentQuote.reportingManager || actorName,
        taggedFinanceOfficer: currentQuote.taggedFinanceOfficer,
        submittedAt: currentQuote.approvalWorkflow?.submittedAt || new Date().toISOString(),
        status: 'Returned',
        managerStatus: 'Returned',
        financeStatus: currentQuote.approvalWorkflow?.financeStatus || 'Not Required',
        managerNotes: note,
        financeNotes: currentQuote.approvalWorkflow?.financeNotes,
      },
    }

    onUpdateQuotation(updated)
    onRecordAudit?.({
      user: actorName,
      role: 'sales_manager',
      action: 'MANAGER_RETURNED',
      quotationId: currentQuote.id,
      details: `Sales Manager returned quote ${currentQuote.id} to rep ${currentQuote.salesRep}. Reason: "${note}"`,
    })
    onShowToast(`Quotation ${currentQuote.id} returned to representative for revision.`)
  }

  // Sales Manager Reject Handler
  function handleManagerReject() {
    if (!currentQuote) return
    const actorName = user?.fullName || 'Sales Manager'
    const note = managerReviewNote.trim() || 'Rejected: Gross margin erosion exceeds acceptable risk tolerance'

    const updated: Quotation = {
      ...currentQuote,
      status: 'Draft',
      approvalWorkflow: {
        assignedRep: currentQuote.salesRep || '',
        reportingManager: currentQuote.reportingManager || actorName,
        taggedFinanceOfficer: currentQuote.taggedFinanceOfficer,
        submittedAt: currentQuote.approvalWorkflow?.submittedAt || new Date().toISOString(),
        status: 'Rejected',
        managerStatus: 'Rejected',
        financeStatus: currentQuote.approvalWorkflow?.financeStatus || 'Not Required',
        managerNotes: note,
        financeNotes: currentQuote.approvalWorkflow?.financeNotes,
      },
    }

    onUpdateQuotation(updated)
    onRecordAudit?.({
      user: actorName,
      role: 'sales_manager',
      action: 'MANAGER_REJECTED',
      quotationId: currentQuote.id,
      details: `Sales Manager rejected quote ${currentQuote.id}. Reason: "${note}"`,
    })
    onShowToast(`Quotation ${currentQuote.id} rejected.`)
  }

  // Finance Officer Approval Handler
  function handleFinanceApprove() {
    if (!currentQuote) return
    const actorName = user?.fullName || 'Financial Officer'
    const note = financeReviewNote.trim() || 'Financial concessions & payment terms certified and approved'

    const updated: Quotation = {
      ...currentQuote,
      status: currentQuote.approvalWorkflow?.managerStatus === 'Approved' ? 'Approved' : currentQuote.status,
      approvalWorkflow: {
        assignedRep: currentQuote.salesRep || '',
        reportingManager: currentQuote.reportingManager || '',
        taggedFinanceOfficer: currentQuote.taggedFinanceOfficer,
        submittedAt: currentQuote.approvalWorkflow?.submittedAt || new Date().toISOString(),
        status: currentQuote.approvalWorkflow?.managerStatus === 'Approved' ? 'Approved' : 'Pending Manager',
        managerStatus: currentQuote.approvalWorkflow?.managerStatus || 'Pending',
        financeStatus: 'Approved',
        managerNotes: currentQuote.approvalWorkflow?.managerNotes,
        financeNotes: note,
      },
      approvalDetails: {
        approvedBy: `${actorName} & ${currentQuote.approvalDetails?.approvedBy || 'Manager'}`,
        approvedAt: new Date().toISOString().split('T')[0],
        approvalLevelRequired: 'Manager+Finance',
      },
    }

    onUpdateQuotation(updated)
    onRecordAudit?.({
      user: actorName,
      role: 'finance',
      action: 'FINANCE_APPROVED',
      quotationId: currentQuote.id,
      details: `Financial Officer approved financial terms for quote ${currentQuote.id}. Note: "${note}"`,
    })
    onShowToast(`Quotation ${currentQuote.id} financial terms approved!`)
  }

  // Finance Officer Reject Handler
  function handleFinanceReject() {
    if (!currentQuote) return
    const actorName = user?.fullName || 'Financial Officer'
    const note = financeReviewNote.trim() || 'Financial concession rejected due to cashflow/margin rules'

    const updated: Quotation = {
      ...currentQuote,
      approvalWorkflow: {
        assignedRep: currentQuote.salesRep || '',
        reportingManager: currentQuote.reportingManager || '',
        taggedFinanceOfficer: currentQuote.taggedFinanceOfficer,
        submittedAt: currentQuote.approvalWorkflow?.submittedAt || new Date().toISOString(),
        status: 'Rejected',
        managerStatus: currentQuote.approvalWorkflow?.managerStatus || 'Pending',
        financeStatus: 'Rejected',
        managerNotes: currentQuote.approvalWorkflow?.managerNotes,
        financeNotes: note,
      },
    }

    onUpdateQuotation(updated)
    onRecordAudit?.({
      user: actorName,
      role: 'finance',
      action: 'FINANCE_REJECTED',
      quotationId: currentQuote.id,
      details: `Financial Officer rejected financial terms for quote ${currentQuote.id}. Reason: "${note}"`,
    })
    onShowToast(`Quotation ${currentQuote.id} financial concession rejected.`)
  }

  // Filter audit logs for selected quotation
  const quoteAuditLogs = auditLogs.filter(
    log => log.targetQuotationId === selectedQuotation || log.targetQuotationId === currentQuote?.id
  )

  const displayedList = filterPendingOnly
    ? approvalsList.filter(a => a.status === 'Pending')
    : approvalsList

  /* ──────────────────────────────────────────────────────────
     SCREEN #6: APPROVAL DETAIL VIEW
     ────────────────────────────────────────────────────────── */
  if (currentView === 'detail' && currentQuote) {
    const isApproved = currentQuote.status === 'Approved' || currentQuote.status === 'Confirmed'
    const isReturned = currentQuote.approvalWorkflow?.status === 'Returned'
    const isRejected = currentQuote.approvalWorkflow?.status === 'Rejected'

    return (
      <div className={detailStyles.container}>
        {/* Header */}
        <div className={detailStyles.header}>
          <div>
            <h1 className={detailStyles.title}>
              Approval Detail: {currentQuote.id} ({currentQuote.customerName})
            </h1>
            <p className={detailStyles.subtitle}>
              Full multi-party approval lifecycle, representative notes, governance checks, and audit trail
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button
              className={detailStyles.btnBack}
              style={{ background: '#001D52', color: '#ffffff', borderColor: '#001D52' }}
              onClick={() => {
                exportApprovalDossierPDF(currentQuote, quoteAuditLogs)
                onShowToast(`Exporting Approval Dossier PDF for ${currentQuote.id}...`)
              }}
              title="Download Governance Approval Dossier as PDF"
            >
              📄 Export Approval Dossier (PDF)
            </button>
            <button className={detailStyles.btnBack} onClick={() => setCurrentView('list')}>
              ← Back to Approvals List
            </button>
          </div>
        </div>

        {/* Top Badges / Chips */}
        <div className={detailStyles.chipsRow}>
          <div
            className={detailStyles.chipRisk}
            style={{
              background: currentQuote.blendedRiskScore < 60 ? '#FFE4E4' : currentQuote.blendedRiskScore < 75 ? '#FEF3C7' : '#DCFCE7',
              color: currentQuote.blendedRiskScore < 60 ? '#991b1b' : currentQuote.blendedRiskScore < 75 ? '#92400e' : '#166534',
              borderColor: currentQuote.blendedRiskScore < 60 ? '#FECACA' : currentQuote.blendedRiskScore < 75 ? '#FDE68A' : '#BBF7D0',
            }}
          >
            Blended Risk: {currentQuote.blendedRiskScore < 60 ? 'HIGH' : currentQuote.blendedRiskScore < 75 ? 'MEDIUM' : 'LOW'} ({currentQuote.blendedRiskScore}/100)
          </div>

          <div className={detailStyles.chipTier}>
            Customer Tier: {currentQuote.customerTier || 'Gold'}
          </div>

          <div className={detailStyles.chipTier} style={{ background: '#F0FDF4', color: '#166534', borderColor: '#BBF7D0' }}>
            👤 Assigned Rep: <strong>{currentQuote.salesRep || 'Unassigned'}</strong>
          </div>

          <div className={detailStyles.chipTier} style={{ background: '#EFF6FF', color: '#1E40AF', borderColor: '#BFDBFE' }}>
            👔 Reporting Manager: <strong>{currentQuote.reportingManager || currentQuote.approvalWorkflow?.reportingManager || 'Not Assigned'}</strong>
          </div>

          {currentQuote.taggedFinanceOfficer && currentQuote.taggedFinanceOfficer !== 'None' && (
            <div className={detailStyles.chipTier} style={{ background: '#FAF5FF', color: '#6B21A8', borderColor: '#E9D5FF' }}>
              💰 Tagged Finance: <strong>{currentQuote.taggedFinanceOfficer}</strong>
            </div>
          )}
        </div>

        {/* Multi-Role Workflow Stepper */}
        <div className={detailStyles.workflowContainer}>
          {/* Step 1: Representative Submission */}
          <div className={detailStyles.stepNode}>
            <div className={detailStyles.circleGreen} title="Submitted by Sales Representative" />
            <span className={detailStyles.nodeLabel}>1. Rep Submitted</span>
            <span style={{ fontSize: 11, color: '#64748b' }}>{currentQuote.salesRep || 'Jane Smith'}</span>
          </div>

          <div className={detailStyles.arrowLine} />

          {/* Step 2: Sales Manager Review */}
          <div className={detailStyles.stepNode}>
            <div
              className={
                currentQuote.approvalWorkflow?.managerStatus === 'Approved'
                  ? detailStyles.circleGreen
                  : currentQuote.approvalWorkflow?.managerStatus === 'Rejected'
                  ? detailStyles.circleRisk
                  : detailStyles.circleBlue
              }
              title="Sales Manager Decision"
            />
            <span className={detailStyles.nodeLabel}>2. Sales Manager</span>
            <span style={{ fontSize: 11, color: currentQuote.approvalWorkflow?.managerStatus === 'Approved' ? '#16a34a' : '#2563eb', fontWeight: 600 }}>
              {currentQuote.approvalWorkflow?.managerStatus || 'Under Review'}
            </span>
          </div>

          <div className={detailStyles.arrowLine} />

          {/* Step 3: Financial Officer Certification */}
          <div className={detailStyles.stepNode}>
            <div
              className={
                !currentQuote.taggedFinanceOfficer || currentQuote.taggedFinanceOfficer === 'None'
                  ? detailStyles.circleDark
                  : currentQuote.approvalWorkflow?.financeStatus === 'Approved'
                  ? detailStyles.circleGreen
                  : currentQuote.approvalWorkflow?.financeStatus === 'Rejected'
                  ? detailStyles.circleRisk
                  : detailStyles.circleBlue
              }
              title="Financial Officer Verification"
            />
            <span className={detailStyles.nodeLabel}>3. Finance Officer</span>
            <span style={{ fontSize: 11, color: '#64748b' }}>
              {currentQuote.taggedFinanceOfficer && currentQuote.taggedFinanceOfficer !== 'None'
                ? currentQuote.approvalWorkflow?.financeStatus || 'Pending'
                : 'Not Tagged'}
            </span>
          </div>

          <div className={detailStyles.arrowLine} />

          {/* Step 4: Deal Finalized */}
          <div className={detailStyles.stepNode}>
            <div
              className={isApproved ? detailStyles.circleGreen : detailStyles.circleDark}
              title="Quotation Fully Authorized"
            />
            <span className={detailStyles.nodeLabel}>4. Authorized Deal</span>
            <span style={{ fontSize: 11, color: isApproved ? '#16a34a' : '#64748b', fontWeight: 600 }}>
              {isApproved ? 'Ready for Customer' : 'Pending Authorization'}
            </span>
          </div>
        </div>

        {/* Representative Report & Justification Card */}
        <div className={detailStyles.tableCard} style={{ padding: '20px 24px', background: '#f8fafc' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: 0 }}>
              📝 Sales Representative Deal Report &amp; Justification
            </h3>
            <span style={{ fontSize: 12, color: '#64748b' }}>
              Reporting to Manager: <strong>{currentQuote.reportingManager || 'Alex Rivera'}</strong>
            </span>
          </div>
          <p style={{ fontSize: 13.5, color: '#334155', lineHeight: 1.5, margin: 0, background: '#ffffff', padding: '12px 16px', borderRadius: 10, border: '1px solid #e2e8f0' }}>
            {currentQuote.approvalWorkflow?.managerNotes ||
              currentQuote.managerComment ||
              'Representative submitted deal with customized discounting to displace incumbent competitor. Customer agreed to 24-month contract commitment preserving gross margin above baseline.'}
          </p>

          {currentQuote.taggedFinanceOfficer && currentQuote.taggedFinanceOfficer !== 'None' && (
            <div style={{ marginTop: 14, padding: '10px 14px', background: '#f5f3ff', borderRadius: 8, border: '1px solid #ddd6fe', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 18 }}>💰</span>
              <div>
                <strong style={{ fontSize: 13, color: '#5b21b6' }}>
                  Financial Officer Tagged for Concession Review: {currentQuote.taggedFinanceOfficer}
                </strong>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: '#6d28d9' }}>
                  Status: <strong>{currentQuote.approvalWorkflow?.financeStatus || 'Pending Review'}</strong>
                  {currentQuote.approvalWorkflow?.financeNotes ? ` — "${currentQuote.approvalWorkflow.financeNotes}"` : ' — Awaiting margin and credit clearance.'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Flagged Governance Lines Table */}
        <h2 className={detailStyles.sectionHeading}>Discount Governance &amp; Policy Threshold Check</h2>
        <div className={detailStyles.tableCard}>
          <table className={detailStyles.table}>
            <thead>
              <tr>
                <th>Line Item</th>
                <th>Category</th>
                <th>Discount Given</th>
                <th>Standard Ceiling</th>
                <th>Governance Variance</th>
              </tr>
            </thead>
            <tbody>
              {currentQuote.items && currentQuote.items.length > 0 ? (
                currentQuote.items.map((it, idx) => {
                  const allowed = it.category === 'Hardware' ? 15 : it.category === 'Services' ? 10 : 20
                  const variance = it.discountPct - allowed
                  const isOver = variance > 0
                  return (
                    <tr key={idx}>
                      <td><strong>{it.name}</strong></td>
                      <td>{it.category}</td>
                      <td>{it.discountPct}%</td>
                      <td>{allowed}%</td>
                      <td>
                        {isOver ? (
                          <span style={{ color: '#ef4444', fontWeight: 700 }}>
                            ⚠️ {variance}% OVER CEILING (Requires Approval)
                          </span>
                        ) : (
                          <span style={{ color: '#16a34a', fontWeight: 600 }}>
                            ✓ Within Threshold ({Math.abs(variance)}% head-room)
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td><strong>Enterprise Setup &amp; Deployment</strong></td>
                  <td>Services</td>
                  <td>18%</td>
                  <td>10%</td>
                  <td><span style={{ color: '#ef4444', fontWeight: 700 }}>⚠️ 8% OVER CEILING</span></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Amber Alert Banner */}
        <div className={detailStyles.alertBanner}>
          <span>
            Governance Rule Triggered: Representative discounts exceeding standard tier ceilings automatically trigger mandatory Manager review before the quotation can be transmitted to the customer portal.
          </span>
        </div>

        {/* Live Timestamped Audit Trail */}
        <h2 className={detailStyles.sectionHeading}>
          ⏱️ Real-Time Workflow Audit Trail ({quoteAuditLogs.length} Events Logged)
        </h2>
        <div className={detailStyles.tableCard}>
          <table className={detailStyles.table}>
            <thead>
              <tr>
                <th>Date &amp; Time</th>
                <th>Actor</th>
                <th>Role</th>
                <th>Action</th>
                <th>Details / Audit Log</th>
              </tr>
            </thead>
            <tbody>
              {quoteAuditLogs.length > 0 ? (
                quoteAuditLogs.map((log) => (
                  <tr key={log.id}>
                    <td style={{ whiteSpace: 'nowrap', fontSize: 13, color: '#334155' }}>
                      <strong>{log.timestamp}</strong>
                    </td>
                    <td><strong>{log.actorName}</strong></td>
                    <td>
                      <span
                        style={{
                          padding: '3px 8px',
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 700,
                          background:
                            log.actorRole === 'sales_manager'
                              ? '#dbeafe'
                              : log.actorRole === 'finance'
                              ? '#f3e8ff'
                              : log.actorRole === 'sales_rep'
                              ? '#dcfce7'
                              : log.actorRole === 'customer'
                              ? '#fef3c7'
                              : '#f1f5f9',
                          color:
                            log.actorRole === 'sales_manager'
                              ? '#1e40af'
                              : log.actorRole === 'finance'
                              ? '#6b21a8'
                              : log.actorRole === 'sales_rep'
                              ? '#166534'
                              : log.actorRole === 'customer'
                              ? '#92400e'
                              : '#475569',
                        }}
                      >
                        {String(log.actorRole).toUpperCase().replace('_', ' ')}
                      </span>
                    </td>
                    <td>
                      <span
                        style={{
                          color:
                            log.actionType.includes('APPROVED')
                              ? '#16a34a'
                              : log.actionType.includes('RETURNED')
                              ? '#d97706'
                              : log.actionType.includes('REJECTED')
                              ? '#dc2626'
                              : '#2563eb',
                          fontWeight: 700,
                          fontSize: 12.5,
                        }}
                      >
                        {log.actionType.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ color: '#475569', fontSize: 13 }}>{log.details}</td>
                  </tr>
                ))
              ) : (
                <>
                  <tr>
                    <td style={{ whiteSpace: 'nowrap', fontSize: 13 }}>Sep 5, 2026, 04:30:12 PM</td>
                    <td><strong>{currentQuote.salesRep || 'Jane Smith'}</strong></td>
                    <td><span style={{ background: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700 }}>SALES REP</span></td>
                    <td><span style={{ color: '#2563eb', fontWeight: 700 }}>APPROVAL REQUESTED</span></td>
                    <td>Submitted quotation {currentQuote.id} to Sales Manager with 18% services discount justification.</td>
                  </tr>
                  {currentQuote.taggedFinanceOfficer && (
                    <tr>
                      <td style={{ whiteSpace: 'nowrap', fontSize: 13 }}>Sep 5, 2026, 04:30:15 PM</td>
                      <td><strong>{currentQuote.salesRep || 'Jane Smith'}</strong></td>
                      <td><span style={{ background: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700 }}>SALES REP</span></td>
                      <td><span style={{ color: '#7c3aed', fontWeight: 700 }}>FINANCE TAGGED</span></td>
                      <td>Tagged Financial Officer ({currentQuote.taggedFinanceOfficer}) for margin concession assessment.</td>
                    </tr>
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>

        {/* Dynamic Multi-Role Action Section */}
        <div style={{ marginTop: 8 }}>
          {/* Sales Manager Controls */}
          {isSalesManager && (
            <div className={detailStyles.tableCard} style={{ padding: 22, background: '#eff6ff', border: '1.5px solid #bfdbfe' }}>
              <div style={{ marginBottom: 12 }}>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#1e3a8a' }}>
                  👔 Sales Manager Review &amp; Decision Console
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: '#3b82f6' }}>
                  Review assigned representative actions, provide directional feedback, or authorize the deal.
                </p>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#1e40af', marginBottom: 6 }}>
                  Manager Direct Feedback / Guidance Note:
                </label>
                <textarea
                  style={{
                    width: '100%',
                    minHeight: 65,
                    padding: '10px 14px',
                    borderRadius: 10,
                    border: '1.5px solid #93c5fd',
                    fontSize: 13.5,
                    fontFamily: 'inherit',
                  }}
                  placeholder="Enter notes for the representative (e.g. 'Discount approved based on customer contract length' or 'Please lower setup discount to 10%')..."
                  value={managerReviewNote}
                  onChange={e => setManagerReviewNote(e.target.value)}
                />
              </div>

              <div className={detailStyles.actionsRow}>
                <button className={detailStyles.btnApprove} onClick={handleManagerApprove}>
                  ✓ Authorize &amp; Approve Deal
                </button>
                <button className={detailStyles.btnReturn} onClick={handleManagerReturn}>
                  ↺ Return to Rep for Revision
                </button>
                <button className={detailStyles.btnReject} onClick={handleManagerReject}>
                  ✕ Reject Deal
                </button>
              </div>
            </div>
          )}

          {/* Financial Officer Controls */}
          {isFinance && (
            <div className={detailStyles.tableCard} style={{ padding: 22, background: '#faf5ff', border: '1.5px solid #e9d5ff' }}>
              <div style={{ marginBottom: 12 }}>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#581c87' }}>
                  💰 Financial Officer Concession &amp; Terms Review
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: '#7e22ce' }}>
                  Verify gross margin preservation, creditworthiness, and tagged financial terms.
                </p>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#6b21a8', marginBottom: 6 }}>
                  Finance Concession Note / Audit Reference:
                </label>
                <input
                  type="text"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 10,
                    border: '1.5px solid #d8b4fe',
                    fontSize: 13.5,
                  }}
                  placeholder="e.g. 'Payment terms verified Net 30, gross margin locked at 32% certified.'"
                  value={financeReviewNote}
                  onChange={e => setFinanceReviewNote(e.target.value)}
                />
              </div>

              <div className={detailStyles.actionsRow}>
                <button className={detailStyles.btnApprove} onClick={handleFinanceApprove}>
                  ✓ Approve Financial Terms
                </button>
                <button className={detailStyles.btnReject} onClick={handleFinanceReject}>
                  ✕ Reject Financial Concession
                </button>
              </div>
            </div>
          )}

          {/* Sales Rep View-Only Status Note */}
          {isSalesRep && (
            <div style={{ padding: '16px 20px', background: '#f0fdf4', borderRadius: 12, border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <strong style={{ color: '#166534', fontSize: 14 }}>
                  📋 Approval Status: {currentQuote.approvalWorkflow?.status || currentQuote.status}
                </strong>
                <p style={{ margin: '3px 0 0', color: '#15803d', fontSize: 13 }}>
                  Reporting to Manager <strong>{currentQuote.reportingManager || 'Alex Rivera'}</strong>. All actions are logged and visible to your Manager and Admin.
                </p>
              </div>
              <button
                onClick={() => onNavigate('builder')}
                style={{
                  background: '#16a34a',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 8,
                  padding: '8px 16px',
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                ✏️ Edit in Builder
              </button>
            </div>
          )}

          {/* Administrator View Notice */}
          {isAdmin && (
            <div style={{ padding: '16px 20px', background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <strong style={{ color: '#1e293b', fontSize: 14 }}>
                  🛡️ Administrator Governance View (Read-Only)
                </strong>
                <p style={{ margin: '3px 0 0', color: '#64748b', fontSize: 13 }}>
                  Admins hold global visibility into all actions of Managers, Representatives, and Finance with exact timestamps.
                </p>
              </div>
              <button
                onClick={() => onNavigate('admin_audit')}
                style={{
                  background: '#0f172a',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 8,
                  padding: '8px 16px',
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                📊 View Full Audit Trail
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  /* ──────────────────────────────────────────────────────────
     SCREEN #5: APPROVALS LIST (Default View)
     ────────────────────────────────────────────────────────── */
  return (
    <div className={listStyles.container}>
      {/* Header */}
      <div className={listStyles.header}>
        <div>
          <h1 className={listStyles.title}>Approvals Hub &amp; Governance Queue</h1>
          <p className={listStyles.subtitle}>
            Multi-role workflow tracking all deals requiring Manager authorization and Financial Officer sign-off
          </p>
        </div>
      </div>

      {/* Status Counter Badges */}
      <div className={listStyles.badgesRow}>
        <button
          className={listStyles.badgePending}
          onClick={() => setFilterPendingOnly(true)}
          title="Filter pending only"
        >
          {approvalsList.filter(a => a.status === 'Pending').length} Pending Review
        </button>

        <button
          className={listStyles.badgeReturned}
          onClick={() => setFilterPendingOnly(false)}
          title="Filter returned"
        >
          {approvalsList.filter(a => a.status === 'Returned').length} Returned to Rep
        </button>

        <button
          className={listStyles.badgeApproved}
          onClick={() => setFilterPendingOnly(false)}
          title="Filter approved"
        >
          {approvalsList.filter(a => a.status === 'Approved').length} Approved Deals
        </button>
      </div>

      {/* Approvals Table Card */}
      <div className={listStyles.tableCard}>
        <table className={listStyles.table}>
          <thead>
            <tr>
              <th>Quotation</th>
              <th>Customer</th>
              <th>Assigned Sales Rep</th>
              <th>Reporting Manager</th>
              <th>Tagged Finance</th>
              <th>Blended Risk</th>
              <th>Stage</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {displayedList.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '36px 20px', color: '#64748b' }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>📋</div>
                  <strong style={{ color: '#001D52', fontSize: 14 }}>No Approval Requests Found</strong>
                  <p style={{ margin: '6px 0 0', fontSize: 13 }}>
                    {isSalesRep
                      ? 'You currently have no submitted quotations awaiting manager or financial sign-off.'
                      : 'No approval requests found matching the current criteria.'}
                  </p>
                </td>
              </tr>
            ) : (
              displayedList.map(row => (
              <tr
                key={row.id}
                className={listStyles.tableRow}
                onClick={() => handleRowClick(row.quotation)}
                title={`Click to open Approval Detail for ${row.quotation}`}
              >
                <td><strong>{row.quotation}</strong></td>
                <td>{row.customer}</td>
                <td>
                  <span style={{ fontWeight: 600, color: '#0f172a' }}>
                    👤 {row.salesRep}
                  </span>
                </td>
                <td>
                  <span style={{ color: '#1e40af', fontWeight: 600 }}>
                    👔 {row.reportingManager}
                  </span>
                </td>
                <td>
                  {row.taggedFinance !== 'None' ? (
                    <span style={{ background: '#f3e8ff', color: '#6b21a8', padding: '2px 8px', borderRadius: 6, fontSize: 12, fontWeight: 700 }}>
                      💰 {row.taggedFinance}
                    </span>
                  ) : (
                    <span style={{ color: '#94a3b8', fontSize: 12 }}>—</span>
                  )}
                </td>
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
                <td>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>
                    {row.stage}
                  </span>
                </td>
                <td>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '4px 10px',
                      borderRadius: 12,
                      fontSize: 12,
                      fontWeight: 700,
                      background:
                        row.status === 'Approved'
                          ? '#dcfce7'
                          : row.status === 'Returned'
                          ? '#fef3c7'
                          : row.status === 'Rejected'
                          ? '#fee2e2'
                          : '#eff6ff',
                      color:
                        row.status === 'Approved'
                          ? '#166534'
                          : row.status === 'Returned'
                          ? '#92400e'
                          : row.status === 'Rejected'
                          ? '#991b1b'
                          : '#1e40af',
                    }}
                  >
                    {row.status}
                  </span>
                </td>
              </tr>
            )))}
          </tbody>
        </table>
      </div>

      {/* Golden Alert Banner */}
      <div className={listStyles.alertBanner}>
        <span>Click any row to open its full approval detail, review representative justification, and execute manager or finance actions.</span>
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
