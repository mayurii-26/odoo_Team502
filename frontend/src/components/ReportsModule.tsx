'use client'

import React, { useState } from 'react'
import styles from './ReportsWireframe.module.css'
import { Quotation, ActiveModule } from './types'

interface ReportsProps {
  reportsData?: any
  quotations?: Quotation[]
  onNavigate: (module: ActiveModule) => void
  onShowToast: (msg: string) => void
}

export default function ReportsModule({
  reportsData,
  quotations = [],
  onShowToast,
}: ReportsProps) {
  const [period, setPeriod] = useState('this_month')
  const [salesTeam, setSalesTeam] = useState('all')
  const [approvalStatus, setApprovalStatus] = useState('all')
  const [product, setProduct] = useState('all')

  // Live PostgreSQL Analytics Values
  const quotesCount = quotations.length > 0 ? quotations.length : (reportsData?.total_quotes || 60)
  const totalRev = reportsData?.total_revenue ? `$${(reportsData.total_revenue / 1000000).toFixed(2)}M` : '$1.45M'
  const winRate = reportsData?.win_rate ? `${reportsData.win_rate}%` : '64.2%'
  const avgDeal = reportsData?.avg_deal_size ? `$${reportsData.avg_deal_size.toLocaleString()}` : '$24,500'

  const quotesCreated = `${quotesCount} deals in database`

  const avgApprovalTime =
    approvalStatus === 'approved'
      ? '4.2 hours'
      : salesTeam === 'enterprise'
      ? '8.1 hours'
      : '6.4 hours'

  const topProduct =
    product === 'hardware'
      ? 'Industrial IoT Gateway'
      : product === 'software'
      ? 'Platform Enterprise 1yr'
      : 'Care Plan 2yr'

  function handleExportPDF() {
    onShowToast('Exporting Admin / Reporting Dashboard as PDF...')
  }

  function handleExportXLS() {
    onShowToast('Exporting Admin / Reporting metrics to Excel (.xlsx)...')
  }

  return (
    <div className={styles.container}>
      {/* ── Header ────────────────────────────────────────── */}
      <div className={styles.header}>
        <h1 className={styles.title}>Admin / Reporting Dashboard (Optional)</h1>
        <p className={styles.subtitle}>
          Sales trends, approval bottlenecks and platform usage
        </p>
      </div>

      {/* ── Filter Row (4 Selects) ────────────────────────── */}
      <div className={styles.filtersRow}>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Period</label>
          <select
            className={styles.filterSelect}
            value={period}
            onChange={e => setPeriod(e.target.value)}
          >
            <option value="this_month">This Month</option>
            <option value="last_month">Last Month</option>
            <option value="quarter">Quarter to Date (Q3)</option>
            <option value="year">Full Year 2026</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Sales Team</label>
          <select
            className={styles.filterSelect}
            value={salesTeam}
            onChange={e => setSalesTeam(e.target.value)}
          >
            <option value="all">All Teams</option>
            <option value="enterprise">Enterprise NA</option>
            <option value="emea">Mid-Market EMEA</option>
            <option value="apac">APAC Direct</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Approval Status</label>
          <select
            className={styles.filterSelect}
            value={approvalStatus}
            onChange={e => setApprovalStatus(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="pending_mgr">Pending Manager</option>
            <option value="pending_fin">Pending Finance</option>
            <option value="approved">Approved</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Product</label>
          <select
            className={styles.filterSelect}
            value={product}
            onChange={e => setProduct(e.target.value)}
          >
            <option value="all">All Products</option>
            <option value="hardware">Hardware & Sensors</option>
            <option value="software">Cloud SaaS Subscriptions</option>
            <option value="services">Care Plans & SLAs</option>
          </select>
        </div>
      </div>

      {/* ── Summary Metric Cards (Row of 3) ───────────────── */}
      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <h2 className={styles.cardTitle}>Quotes Created</h2>
          <p className={styles.cardSubtitle}>{quotesCreated}</p>
        </div>

        <div className={styles.summaryCard}>
          <h2 className={styles.cardTitle}>Avg Approval Time</h2>
          <p className={styles.cardSubtitle}>{avgApprovalTime}</p>
        </div>

        <div className={styles.summaryCard}>
          <h2 className={styles.cardTitle}>Top Upsold Product</h2>
          <p className={styles.cardSubtitle}>{topProduct}</p>
        </div>
      </div>

      {/* ── Export Buttons Row ────────────────────────────── */}
      <div className={styles.actionsRow}>
        <button
          className={styles.btnExport}
          onClick={handleExportPDF}
          title="Download reporting dashboard as PDF"
        >
          Export PDF
        </button>

        <button
          className={styles.btnExport}
          onClick={handleExportXLS}
          title="Export reporting metrics to Excel (.xlsx)"
        >
          Export XLS
        </button>
      </div>
    </div>
  )
}
