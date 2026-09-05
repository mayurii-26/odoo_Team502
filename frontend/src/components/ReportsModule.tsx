'use client'

import React, { useState } from 'react'
import styles from './ReportsWireframe.module.css'
import { Quotation, ActiveModule } from './types'
import { exportReportsPDF, exportReportsCSV } from '../lib/pdfGenerator'
import { useCurrency } from '@/context/CurrencyContext'

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
  const { formatPrice } = useCurrency()
  const [period, setPeriod] = useState('this_month')
  const [salesTeam, setSalesTeam] = useState('all')
  const [approvalStatus, setApprovalStatus] = useState('all')
  const [product, setProduct] = useState('all')

  // Live PostgreSQL Analytics Values
  const quotesCount = quotations.length > 0 ? quotations.length : (reportsData?.total_quotes ?? null)
  const totalRevRaw = reportsData?.total_revenue ?? null
  const totalRev = totalRevRaw != null ? formatPrice(totalRevRaw, undefined, { compact: true }) : null
  const winRateRaw = reportsData?.win_rate ?? null
  const winRate = winRateRaw != null ? `${winRateRaw}%` : null
  const avgDealRaw = reportsData?.avg_deal_size ?? null
  const avgDeal = avgDealRaw != null ? formatPrice(avgDealRaw, undefined, { maximumFractionDigits: 0, minimumFractionDigits: 0 }) : null

  const quotesCreated = quotesCount != null ? `${quotesCount} deals in database` : 'Loading...'

  const avgApprovalTime =
    approvalStatus === 'approved'
      ? reportsData?.avg_approval_time_approved || 'N/A'
      : salesTeam === 'enterprise'
      ? reportsData?.avg_approval_time_enterprise || 'N/A'
      : reportsData?.avg_approval_time || 'N/A'

  const topProduct =
    product === 'hardware'
      ? reportsData?.top_product_hardware || 'N/A'
      : product === 'software'
      ? reportsData?.top_product_software || 'N/A'
      : reportsData?.top_product || 'N/A'

  function handleExportPDF() {
    exportReportsPDF(reportsData, quotations, {
      period,
      salesTeam,
      approvalStatus,
      product,
    })
    onShowToast('Executive Reporting Dashboard exported as PDF!')
  }

  function handleExportXLS() {
    exportReportsCSV(reportsData, quotations)
    onShowToast('Exported metrics spreadsheet (.csv) successfully.')
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
          <h2 className={styles.cardTitle}>Total Revenue</h2>
          <p className={styles.cardSubtitle}>{totalRev ?? 'Loading...'}</p>
        </div>

        <div className={styles.summaryCard}>
          <h2 className={styles.cardTitle}>Win Rate</h2>
          <p className={styles.cardSubtitle}>{winRate ?? 'Loading...'}</p>
        </div>
      </div>

      <div className={styles.summaryGrid} style={{ marginTop: 0 }}>
        <div className={styles.summaryCard}>
          <h2 className={styles.cardTitle}>Avg Deal Size</h2>
          <p className={styles.cardSubtitle}>{avgDeal ?? 'Loading...'}</p>
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
