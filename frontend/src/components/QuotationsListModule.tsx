'use client'

import React, { useState, useMemo } from 'react'
import styles from './QuotationsWireframe.module.css'
import { Quotation, QuotationStatus, ActiveModule, UserSession } from './types'
import { exportQuotationPDF } from '../lib/pdfGenerator'
import { useCurrency } from '@/context/CurrencyContext'

interface QuotationsListProps {
  quotations: Quotation[]
  onSelectQuotation: (id: string) => void
  onNavigate: (module: ActiveModule) => void
  onUpdateQuotation?: (updated: Quotation) => void
  onShowToast?: (msg: string) => void
  readOnly?: boolean
  user?: UserSession
}

type KanbanColStatus = 'Draft' | 'Pending Approval' | 'Approved' | 'Negotiation' | 'Confirmed'

export default function QuotationsListModule({
  quotations,
  onSelectQuotation,
  onNavigate,
  onUpdateQuotation,
  onShowToast,
  readOnly = false,
  user,
}: QuotationsListProps) {
  const { formatPrice } = useCurrency()
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [draggedDealId, setDraggedDealId] = useState<string | null>(null)
  const [dragOverCol, setDragOverCol] = useState<KanbanColStatus | null>(null)

  // Normalizer for quotation statuses to columns
  function mapStatusToCol(status: string): KanbanColStatus {
    const s = status.toLowerCase()
    if (s.includes('draft')) return 'Draft'
    if (s.includes('review') || s.includes('pending')) return 'Pending Approval'
    if (s.includes('approved')) return 'Approved'
    if (s.includes('negotiat') || s.includes('sent')) return 'Negotiation'
    if (s.includes('confirm') || s.includes('accept') || s.includes('fulfill')) return 'Confirmed'
    return 'Draft'
  }

  function mapColToStatus(col: KanbanColStatus): QuotationStatus {
    switch (col) {
      case 'Draft':
        return 'Draft'
      case 'Pending Approval':
        return 'Under Review'
      case 'Approved':
        return 'Approved'
      case 'Negotiation':
        return 'Negotiating'
      case 'Confirmed':
        return 'Confirmed'
      default:
        return 'Draft'
    }
  }

  // Filter deals
  const filteredQuotations = useMemo(() => {
    return quotations.filter(q => {
      const matchSearch =
        q.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.salesRep.toLowerCase().includes(searchTerm.toLowerCase())

      if (statusFilter === 'ALL') return matchSearch
      return matchSearch && mapStatusToCol(q.status) === statusFilter
    })
  }, [quotations, searchTerm, statusFilter])

  const columns: Array<{
    status: KanbanColStatus
    title: string
  }> = [
    { status: 'Draft', title: 'Drafting' },
    { status: 'Pending Approval', title: 'Pending Approval' },
    { status: 'Approved', title: 'Approved' },
    { status: 'Negotiation', title: 'Negotiation' },
    { status: 'Confirmed', title: 'Confirmed' },
  ]

  function handleOpenDeal(dealId: string) {
    onSelectQuotation(dealId)
    onNavigate('builder')
  }

  function getDealTotal(q: Quotation): number {
    return q.items.reduce((sum, item) => {
      const disc = item.discountPct ? item.unitPrice * (item.discountPct / 100) : 0
      return sum + (item.unitPrice - disc) * item.qty
    }, 0)
  }

  // ── Drag & Drop Handlers ────────────────────────────────────
  function handleDragStart(e: React.DragEvent, dealId: string) {
    if (readOnly) {
      e.preventDefault()
      return
    }
    setDraggedDealId(dealId)
    e.dataTransfer.setData('text/plain', dealId)
    e.dataTransfer.effectAllowed = 'move'
  }

  function handleDragEnd() {
    setDraggedDealId(null)
    setDragOverCol(null)
  }

  function handleDragOver(e: React.DragEvent, colStatus: KanbanColStatus) {
    if (readOnly) return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (dragOverCol !== colStatus) {
      setDragOverCol(colStatus)
    }
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault()
  }

  function handleDrop(e: React.DragEvent, targetCol: KanbanColStatus) {
    e.preventDefault()
    setDragOverCol(null)
    if (readOnly) {
      if (onShowToast) onShowToast('Admin perspective: Quotations are view-only.')
      return
    }
    const dealId = e.dataTransfer.getData('text/plain') || draggedDealId
    setDraggedDealId(null)

    if (!dealId) return

    const targetDeal = quotations.find(q => q.id === dealId)
    if (!targetDeal) return

    const currentCol = mapStatusToCol(targetDeal.status)
    if (currentCol === targetCol) return // No change

    const newStatus = mapColToStatus(targetCol)
    const updatedDeal: Quotation = {
      ...targetDeal,
      status: newStatus,
    }

    if (onUpdateQuotation) {
      onUpdateQuotation(updatedDeal)
    }

    const colTitle = columns.find(c => c.status === targetCol)?.title || targetCol
    if (onShowToast) {
      onShowToast(`Moved deal ${targetDeal.id} (${targetDeal.customerName}) to ${colTitle}!`)
    }
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 className={styles.title}>Quotations Master</h1>
            {readOnly && (
              <span className={styles.viewOnlyBadge}>👁️ View Only (Admin Audit)</span>
            )}
          </div>
          <p className={styles.subtitle}>
            {readOnly
              ? `${filteredQuotations.length} deals loaded from database. View deal economics and customer pipeline.`
              : `${filteredQuotations.length} deals loaded from database. Drag and drop cards to move stages or click to open.`}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Search deals, accounts, reps..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
          <button
            className={styles.btnSwitchView}
            onClick={() => setViewMode(viewMode === 'kanban' ? 'table' : 'kanban')}
          >
            {viewMode === 'kanban' ? 'Table View' : 'Kanban View'}
          </button>
          {!readOnly && (
            <button
              className={styles.btnNewQuote}
              onClick={() => {
                onSelectQuotation('new')
                onNavigate('builder')
              }}
              title="Create a new quotation"
            >
              + New Quotation
            </button>
          )}
        </div>
      </div>

      {viewMode === 'kanban' ? (
        /* ── 5 Interactive Draggable Kanban Columns ── */
        <div className={styles.kanbanGrid}>
          {columns.map(col => {
            const dealsInCol = filteredQuotations.filter(d => mapStatusToCol(d.status) === col.status)
            const colTotal = dealsInCol.reduce((acc, d) => acc + getDealTotal(d), 0)
            const isTarget = dragOverCol === col.status

            return (
              <div
                key={col.status}
                className={`${styles.column} ${isTarget ? styles.columnDragOver : ''}`}
                onDragOver={(e) => handleDragOver(e, col.status)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, col.status)}
              >
                <div className={styles.columnTitle}>
                  <span>{col.title}</span>
                  <span className={styles.columnCountBadge}>
                    {dealsInCol.length} • {formatPrice(colTotal, undefined, { maximumFractionDigits: 0, minimumFractionDigits: 0 })}
                  </span>
                </div>
                <div className={styles.cardsContainer}>
                  {dealsInCol.map(deal => {
                    const totalVal = getDealTotal(deal)
                    const isDragging = draggedDealId === deal.id

                    return (
                      <div
                        key={deal.id}
                        draggable={!readOnly}
                        onDragStart={(e) => handleDragStart(e, deal.id)}
                        onDragEnd={handleDragEnd}
                        className={`${styles.dealCard} ${isDragging ? styles.dealCardDragging : ''}`}
                        onClick={() => handleOpenDeal(deal.id)}
                        style={{ cursor: readOnly ? 'pointer' : 'grab' }}
                        title={readOnly ? `Click to view deal ${deal.id} - ${deal.customerName}` : `Drag to move stage or click to open ${deal.id} - ${deal.customerName}`}
                      >
                        <div className={styles.dealCardHeader}>
                          <span className={styles.dealId}>{deal.id}</span>
                          <span className={styles.dealValue}>
                            {formatPrice(totalVal, undefined, { maximumFractionDigits: 0, minimumFractionDigits: 0 })}
                          </span>
                        </div>
                        <div className={styles.dealCustomer}>
                          {deal.customerName}
                        </div>
                        <div className={styles.dealFooter}>
                          <span className={styles.dealRep}>{deal.salesRep}</span>
                          <span className={
                            deal.riskLevel === 'Low' ? styles.healthPillLow :
                            deal.riskLevel === 'Medium' ? styles.healthPillMed :
                            styles.healthPillHigh
                          }>
                            {deal.blendedRiskScore} Health
                          </span>
                        </div>
                      </div>
                    )
                  })}
                  {dealsInCol.length === 0 && (
                    <div className={styles.emptyColText}>
                      Drag deals here
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* ── Live Table View ── */
        <div className={styles.tableCard}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Deal ID</th>
                <th>Customer Account</th>
                <th>Sales Rep</th>
                <th>Contract Value</th>
                <th>Deal Health</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredQuotations.map(d => {
                const val = getDealTotal(d)
                return (
                  <tr key={d.id} onClick={() => handleOpenDeal(d.id)} className={styles.tableRow}>
                    <td><span className={styles.dealId}>{d.id}</span></td>
                    <td><span className={styles.customerNameCell}>{d.customerName}</span></td>
                    <td>{d.salesRep}</td>
                    <td><span className={styles.dealValue}>{formatPrice(val, undefined, { maximumFractionDigits: 0, minimumFractionDigits: 0 })}</span></td>
                    <td>
                      <span className={
                        d.riskLevel === 'Low' ? styles.healthPillLow :
                        d.riskLevel === 'Medium' ? styles.healthPillMed :
                        styles.healthPillHigh
                      }>
                        {d.blendedRiskScore} Score
                      </span>
                    </td>
                    <td>
                      <span className={styles.statusPill}>
                        {d.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className={styles.btnActionSmall}
                        style={{ marginRight: 6 }}
                        onClick={(e) => {
                          e.stopPropagation()
                          exportQuotationPDF(d)
                          onShowToast?.(`Exporting PDF for quotation ${d.id}...`)
                        }}
                        title="Download Quotation PDF"
                      >
                        📄 PDF
                      </button>
                      <button
                        className={styles.btnActionSmall}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleOpenDeal(d.id)
                        }}
                      >
                        {readOnly ? 'View Deal' : 'Open Deal'}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Action Buttons ── */}
      {!readOnly && (
        <div className={styles.actionsRow}>
          <button
            className={styles.btnNewQuote}
            onClick={() => {
              onSelectQuotation('new')
              onNavigate('builder')
            }}
          >
            + Create New Quotation
          </button>
        </div>
      )}
    </div>
  )
}
