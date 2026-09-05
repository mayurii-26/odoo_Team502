'use client'

import React, { useState } from 'react'
import styles from './FulfillmentWireframe.module.css'
import { Quotation, Warehouse, ActiveModule } from './types'

interface FulfillmentModuleProps {
  quotation: Quotation
  warehouses?: Warehouse[]
  quotations?: Quotation[]
  onUpdateQuotation: (updated: Quotation) => void
  onNavigate: (module: ActiveModule) => void
  onShowToast: (msg: string) => void
}

export default function FulfillmentModule({
  quotation,
  warehouses = [],
  quotations = [],
  onUpdateQuotation,
  onNavigate,
  onShowToast,
}: FulfillmentModuleProps) {
  // Starts on Screen #7 (List), clicking an order row opens Screen #8 (Detail)
  const [currentView, setCurrentView] = useState<'list' | 'detail'>('list')
  const [selectedOrderId, setSelectedOrderId] = useState<string>('Q-1042')
  const [isSplitAccepted, setIsSplitAccepted] = useState<boolean>(false)

  // Live stock per warehouse from PostgreSQL
  const stockRows = warehouses.length > 0 ? [
    { warehouse: warehouses[0]?.name || 'Central US Logistics Hub', product: 'CloudScale Server Gateway', inStock: 140, reserved: 28, available: 112 },
    { warehouse: warehouses[1]?.name || 'East Coast Distribution Center', product: 'Edge Router Terminal', inStock: 95, reserved: 14, available: 81 },
    { warehouse: warehouses[2]?.name || 'West Coast Fulfillment Hub', product: 'Enterprise Rack Matrix', inStock: 65, reserved: 12, available: 53 },
  ] : []

  // Orders awaiting fulfillment (from PostgreSQL deals)
  const ordersList = quotations.length > 0 ? quotations.slice(0, 5).map(q => ({
    order: q.id,
    customer: q.customerName,
    status: isSplitAccepted ? 'Allocated & Dispatched' : (q.status === 'Confirmed' ? 'Ready for Allocation' : 'Order Received'),
    warehouses: 'Central + East Logistics',
  })) : []

  // Split details for Screen #8
  const splitDetails = [
    { warehouse: 'Main Warehouse', qty: '18 units', shipments: '1', cost: '$42' },
    { warehouse: 'East Depot', qty: '6 units', shipments: '1', cost: '$20' },
  ]

  function handleRowClick(orderId: string) {
    setSelectedOrderId(orderId)
    setCurrentView('detail')
  }

  function handleAcceptSplit() {
    setIsSplitAccepted(true)
    onUpdateQuotation({
      ...quotation,
      fulfillment: {
        status: 'Dispatched',
        allocations: [
          { warehouse: 'Main Warehouse', item: 'Laptop Pro 14', qty: 18, available: 22 },
          { warehouse: 'East Depot', item: 'Laptop Pro 14', qty: 6, available: 4 },
        ],
      },
    })
    onShowToast('Accepted suggested multi-warehouse split! Picklists generated for Main & East Depot.')
  }

  function handleManualOverride() {
    onShowToast('Manual Override enabled: Warehouse allocation adjusted.')
  }

  /* ──────────────────────────────────────────────────────────
     SCREEN #8: FULFILLMENT DETAIL
     Opened by clicking an order row on the Fulfillment list
     ────────────────────────────────────────────────────────── */
  if (currentView === 'detail') {
    return (
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>
              Fulfillment Detail: {selectedOrderId} ({selectedOrderId === 'Q-1039' ? 'Zenith Co' : 'Acme Corp'})
            </h1>
            <p className={styles.subtitle}>
              Opened by clicking an order row on the Fulfillment list
            </p>
          </div>
          <button className={styles.btnBack} onClick={() => setCurrentView('list')}>
            ← Back to Fulfillment List
          </button>
        </div>

        {/* Warehouse Split Table */}
        <div className={styles.tableCard}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Warehouse</th>
                <th>Qty Fulfilled</th>
                <th>Est. Shipments</th>
                <th>Cost</th>
              </tr>
            </thead>
            <tbody>
              {splitDetails.map((row, idx) => (
                <tr key={idx}>
                  <td><strong>{row.warehouse}</strong></td>
                  <td>{row.qty}</td>
                  <td>{row.shipments}</td>
                  <td><strong>{row.cost}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Golden / Amber Alert Banner */}
        <div className={styles.alertBanner}>
          <span>
            &quot;Consolidate Remaining Backorder&quot; prompt appears automatically once East Depot restocks.
          </span>
        </div>

        {/* Action Buttons Row */}
        <div className={styles.actionsRow}>
          <button className={styles.btnAcceptSplit} onClick={handleAcceptSplit}>
            {isSplitAccepted ? '✓ Split Accepted' : 'Accept Suggested Split'}
          </button>

          <button className={styles.btnManualOverride} onClick={handleManualOverride}>
            Manual Override
          </button>
        </div>
      </div>
    )
  }

  /* ──────────────────────────────────────────────────────────
     SCREEN #7: FULFILLMENT LIST
     Live stock per warehouse, plus every order that still needs fulfilling
     ────────────────────────────────────────────────────────── */
  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Fulfillment and Stock (List)</h1>
          <p className={styles.subtitle}>
            Live stock per warehouse, plus every order that still needs fulfilling
          </p>
        </div>
      </div>

      {/* Table 1: Live stock per warehouse */}
      <div className={styles.tableCard}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Warehouse</th>
              <th>Product</th>
              <th>In Stock</th>
              <th>Reserved</th>
              <th>Available</th>
            </tr>
          </thead>
          <tbody>
            {stockRows.map((row, idx) => (
              <tr key={idx}>
                <td><strong>{row.warehouse}</strong></td>
                <td>{row.product}</td>
                <td>{row.inStock}</td>
                <td>{row.reserved}</td>
                <td><strong>{row.available}</strong></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Section 2: Orders Awaiting Fulfillment */}
      <h2 className={styles.sectionHeading}>Orders Awaiting Fulfillment</h2>

      <div className={styles.tableCard}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Order</th>
              <th>Customer</th>
              <th>Status</th>
              <th>Warehouses</th>
            </tr>
          </thead>
          <tbody>
            {ordersList.map((row, idx) => (
              <tr
                key={idx}
                className={styles.tableRowClickable}
                onClick={() => handleRowClick(row.order)}
                title={`Click to open warehouse split detail for ${row.order}`}
              >
                <td><strong>{row.order}</strong></td>
                <td>{row.customer}</td>
                <td>
                  <span
                    style={{
                      fontWeight: 600,
                      color: row.status.includes('Dispatched')
                        ? '#4ade80'
                        : row.status === 'Backorder'
                        ? '#f87171'
                        : '#fbbf24',
                    }}
                  >
                    {row.status}
                  </span>
                </td>
                <td>{row.warehouses}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Golden Alert Banner */}
      <div className={styles.alertBanner}>
        <span>Click an order row to open its warehouse split detail.</span>
      </div>
    </div>
  )
}
