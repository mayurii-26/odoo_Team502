'use client'

import React, { useState, useMemo } from 'react'
import styles from './SubscriptionsWireframe.module.css'
import { ActiveModule } from './types'
import { useCurrency } from '@/context/CurrencyContext'

interface SubscriptionsModuleProps {
  subscriptions?: any[]
  onNavigate: (module: ActiveModule) => void
  onShowToast: (msg: string) => void
}

interface SubscriptionItem {
  id: number | string
  subscription_number: string
  customer_name: string
  plan_name: string
  billing_frequency: string
  recurring_amount: number
  status: 'ACTIVE' | 'PAUSED' | 'CANCELLED'
  start_date: string
  next_billing_date: string
}

function ArrowLeftIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  )
}

export default function SubscriptionsModule({
  subscriptions = [],
  onNavigate,
  onShowToast,
}: SubscriptionsModuleProps) {
  const { formatPrice } = useCurrency()
  const [currentView, setCurrentView] = useState<'list' | 'detail'>('list')
  const [selectedSubId, setSelectedSubId] = useState<string | number>('1')
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'PAUSED'>('ALL')
  const [searchTerm, setSearchTerm] = useState('')

  // Map incoming subscriptions from PostgreSQL
  const [subscriptionsList, setSubscriptionsList] = useState<SubscriptionItem[]>(() => {
    if (subscriptions && subscriptions.length > 0) {
      return subscriptions.map((s: any) => ({
        id: s.id,
        subscription_number: s.subscription_number || `SUB-${s.id}`,
        customer_name: s.customer_name || '',
        plan_name: s.plan_name || '',
        billing_frequency: s.billing_frequency || 'MONTHLY',
        recurring_amount: Number(s.recurring_amount || 0),
        status: (s.status?.toUpperCase() === 'PAUSED' ? 'PAUSED' : 'ACTIVE') as any,
        start_date: s.start_date || '',
        next_billing_date: s.next_billing_date || '',
      }))
    }
    return []
  })

  // Sync state when subscriptions prop updates
  React.useEffect(() => {
    if (subscriptions && subscriptions.length > 0) {
      setSubscriptionsList(
        subscriptions.map((s: any) => ({
          id: s.id,
          subscription_number: s.subscription_number || `SUB-${s.id}`,
          customer_name: s.customer_name || '',
          plan_name: s.plan_name || '',
          billing_frequency: s.billing_frequency || 'MONTHLY',
          recurring_amount: Number(s.recurring_amount || 0),
          status: (s.status?.toUpperCase() === 'PAUSED' ? 'PAUSED' : 'ACTIVE') as any,
          start_date: s.start_date || '',
          next_billing_date: s.next_billing_date || '',
        }))
      )
    }
  }, [subscriptions])

  // Summary Metrics
  const { totalMRR, activeCount, pausedCount } = useMemo(() => {
    let mrr = 0
    let aCount = 0
    let pCount = 0

    subscriptionsList.forEach(s => {
      const monthlyAmount = s.billing_frequency === 'ANNUAL' ? s.recurring_amount / 12 : s.recurring_amount
      if (s.status === 'ACTIVE') {
        mrr += monthlyAmount
        aCount++
      } else {
        pCount++
      }
    })

    return {
      totalMRR: Math.round(mrr),
      activeCount: aCount,
      pausedCount: pCount,
    }
  }, [subscriptionsList])

  // Filtered List
  const filteredList = useMemo(() => {
    return subscriptionsList.filter(s => {
      const matchSearch =
        s.subscription_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.plan_name.toLowerCase().includes(searchTerm.toLowerCase())

      if (filterStatus === 'ALL') return matchSearch
      return matchSearch && s.status === filterStatus
    })
  }, [subscriptionsList, searchTerm, filterStatus])

  const selectedSub = subscriptionsList.find(s => String(s.id) === String(selectedSubId) || s.subscription_number === selectedSubId) || subscriptionsList[0]

  function handleRowClick(sub: SubscriptionItem) {
    setSelectedSubId(sub.id)
    setCurrentView('detail')
  }

  function handleToggleStatus() {
    if (!selectedSub) return
    const newStatus = selectedSub.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE'
    setSubscriptionsList(prev =>
      prev.map(s => (s.id === selectedSub.id ? { ...s, status: newStatus } : s))
    )
    onShowToast(`Subscription ${selectedSub.subscription_number} status updated to ${newStatus}.`)
  }

  function handleModifyFrequency() {
    if (!selectedSub) return
    const newFreq = selectedSub.billing_frequency === 'MONTHLY' ? 'ANNUAL' : 'MONTHLY'
    const newAmt = newFreq === 'ANNUAL' ? selectedSub.recurring_amount * 10 : Math.round(selectedSub.recurring_amount / 10)
    setSubscriptionsList(prev =>
      prev.map(s => (s.id === selectedSub.id ? { ...s, billing_frequency: newFreq, recurring_amount: newAmt } : s))
    )
    onShowToast(`Billing schedule updated to ${newFreq} (${formatPrice(newAmt)}/cycle).`)
  }

  /* ──────────────────────────────────────────────────────────
     DETAIL VIEW: SUBSCRIPTION CONTRACT DETAILS
     ────────────────────────────────────────────────────────── */
  if (currentView === 'detail' && selectedSub) {
    const isActive = selectedSub.status === 'ACTIVE'

    return (
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Subscription Detail: {selectedSub.subscription_number}</h1>
            <p className={styles.subtitle}>
              Contract terms for {selectedSub.customer_name} · Plan: {selectedSub.plan_name}
            </p>
          </div>
          <button className={styles.btnBack} onClick={() => setCurrentView('list')} title="Return to list">
            <ArrowLeftIcon />
            <span>Back to Subscriptions</span>
          </button>
        </div>

        {/* Contract Summary Metrics */}
        <div className={styles.metricsGrid}>
          <div className={styles.metricCard}>
            <span className={styles.metricLabel}>Recurring Value</span>
            <span className={styles.metricValue}>{formatPrice(selectedSub.recurring_amount)}</span>
            <span className={styles.metricSubtext}>Billed {selectedSub.billing_frequency.toLowerCase()}</span>
          </div>

          <div className={styles.metricCard}>
            <span className={styles.metricLabel}>Contract Status</span>
            <span className={styles.metricValue} style={{ color: isActive ? '#166534' : '#92400E' }}>
              {selectedSub.status}
            </span>
            <span className={styles.metricSubtext}>Next renewal: {selectedSub.next_billing_date}</span>
          </div>

          <div className={styles.metricCard}>
            <span className={styles.metricLabel}>Effective Start Date</span>
            <span className={styles.metricValue} style={{ color: '#0F172A' }}>
              {selectedSub.start_date}
            </span>
            <span className={styles.metricSubtext}>Auto-renew policy enabled</span>
          </div>
        </div>

        {/* Contract Specs Card */}
        <div className={styles.detailCard}>
          <h2 className={styles.sectionHeading}>Subscription Metadata & SLA Specifications</h2>
          <div className={styles.detailGrid}>
            <div className={styles.detailField}>
              <span className={styles.detailLabel}>Contract Reference</span>
              <span className={styles.detailValue}>{selectedSub.subscription_number}</span>
            </div>

            <div className={styles.detailField}>
              <span className={styles.detailLabel}>Client Account</span>
              <span className={styles.detailValue}>{selectedSub.customer_name}</span>
            </div>

            <div className={styles.detailField}>
              <span className={styles.detailLabel}>Service Tier</span>
              <span className={styles.detailValue}>{selectedSub.plan_name}</span>
            </div>

            <div className={styles.detailField}>
              <span className={styles.detailLabel}>Billing Frequency</span>
              <span className={styles.detailValue}>{selectedSub.billing_frequency}</span>
            </div>
          </div>
        </div>

        {/* Actions Row */}
        <div className={styles.actionsRow}>
          <button className={styles.btnModify} onClick={handleModifyFrequency}>
            Switch Billing Cycle (to {selectedSub.billing_frequency === 'MONTHLY' ? 'Annual' : 'Monthly'})
          </button>

          <button
            className={styles.btnCancelSub}
            onClick={handleToggleStatus}
            style={{
              color: isActive ? '#DC2626' : '#166534',
              borderColor: isActive ? '#FECACA' : '#BBF7D0',
              background: isActive ? '#FEF2F2' : '#DCFCE7',
            }}
          >
            {isActive ? 'Pause Subscription' : 'Reactivate Subscription'}
          </button>
        </div>
      </div>
    )
  }

  /* ──────────────────────────────────────────────────────────
     LIST VIEW: ALL SUBSCRIPTIONS (POSTGRESQL DATA)
     ────────────────────────────────────────────────────────── */
  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Subscriptions Master</h1>
          <p className={styles.subtitle}>
            {subscriptionsList.length} recurring contracts loaded from PostgreSQL database.
          </p>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Monthly Recurring Revenue</span>
          <span className={styles.metricValue}>{formatPrice(totalMRR)}/mo</span>
          <span className={styles.metricSubtext}>Normalized aggregate MRR</span>
        </div>

        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Active Subscriptions</span>
          <span className={styles.metricValue} style={{ color: '#166534' }}>
            {activeCount}
          </span>
          <span className={styles.metricSubtext}>Currently generating revenue</span>
        </div>

        <div className={styles.metricCard}>
          <span className={styles.metricLabel}>Paused Contracts</span>
          <span className={styles.metricValue} style={{ color: '#92400E' }}>
            {pausedCount}
          </span>
          <span className={styles.metricSubtext}>Suspended or awaiting renewal</span>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className={styles.controlsRow}>
        <div className={styles.filterTabs}>
          <button
            className={`${styles.tabBtn} ${filterStatus === 'ALL' ? styles.tabBtnActive : ''}`}
            onClick={() => setFilterStatus('ALL')}
          >
            All Subscriptions ({subscriptionsList.length})
          </button>

          <button
            className={`${styles.tabBtn} ${filterStatus === 'ACTIVE' ? styles.tabBtnActive : ''}`}
            onClick={() => setFilterStatus('ACTIVE')}
          >
            Active ({activeCount})
          </button>

          <button
            className={`${styles.tabBtn} ${filterStatus === 'PAUSED' ? styles.tabBtnActive : ''}`}
            onClick={() => setFilterStatus('PAUSED')}
          >
            Paused ({pausedCount})
          </button>
        </div>

        <input
          type="text"
          placeholder="Search contracts, plans, clients..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      {/* Subscriptions Table Card */}
      <div className={styles.tableCard}>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Subscription #</th>
                <th>Customer Account</th>
                <th>Service Plan</th>
                <th>Billing Cycle</th>
                <th>Recurring Amount</th>
                <th>Next Billing Date</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredList.map(row => (
                <tr
                  key={row.id}
                  className={styles.tableRow}
                  onClick={() => handleRowClick(row)}
                  title={`Click to open detail for ${row.subscription_number}`}
                >
                  <td><span className={styles.subNumCell}>{row.subscription_number}</span></td>
                  <td><strong>{row.customer_name}</strong></td>
                  <td>{row.plan_name}</td>
                  <td>{row.billing_frequency}</td>
                  <td><span className={styles.amountCell}>{formatPrice(row.recurring_amount)}</span></td>
                  <td>{row.next_billing_date}</td>
                  <td>
                    <span className={row.status === 'ACTIVE' ? styles.statusActive : styles.statusPaused}>
                      {row.status}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className={styles.btnActionSmall}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRowClick(row)
                      }}
                    >
                      Manage Plan
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
