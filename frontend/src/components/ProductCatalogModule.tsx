'use client'

import React, { useState } from 'react'
import styles from './ProductsWireframe.module.css'
import { Product } from './types'

interface ProductCatalogProps {
  products: Product[]
  onAddProduct: (prod: Product) => void
  onShowToast: (msg: string) => void
}

interface ProductItem {
  id: string
  name: string
  category: string
  variants: string
  price: string
  unit: string
  tax: string
  status: string
  description?: string
  isSubscription: boolean
  recurringInterval?: string
  quantityOnHand: number
}

export default function ProductCatalogModule({
  products,
  onAddProduct,
  onShowToast,
}: ProductCatalogProps) {
  const [currentView, setCurrentView] = useState<'dashboard' | 'details'>('dashboard')

  // Products list for Screen #16
  const [productList, setProductList] = useState<ProductItem[]>([
    {
      id: 'prod-1',
      name: 'Laptop Pro 14',
      category: 'Hardware',
      variants: '3(RAM)',
      price: '$1,200',
      unit: 'Each',
      tax: '15%',
      status: 'Active',
      description: 'Enterprise ultra-portable 14" laptop with high-performance processor',
      isSubscription: false,
      recurringInterval: 'Monthly',
      quantityOnHand: 45,
    },
    {
      id: 'prod-2',
      name: 'Onsite Setup Service',
      category: 'Services',
      variants: '-',
      price: '$450',
      unit: 'Each',
      tax: '10%',
      status: 'Active',
      description: 'Certified engineer on-site installation, configuration and diagnostics',
      isSubscription: false,
      recurringInterval: 'Monthly',
      quantityOnHand: 99,
    },
    {
      id: 'prod-3',
      name: 'Docking Station',
      category: 'Hardware',
      variants: '2(color)',
      price: '$180',
      unit: 'Each',
      tax: '15%',
      status: 'Active',
      description: 'Thunderbolt 4 universal docking hub with dual 4K display outputs',
      isSubscription: false,
      recurringInterval: 'Monthly',
      quantityOnHand: 80,
    },
    {
      id: 'prod-4',
      name: 'Care Plan 2 years',
      category: 'Subscription',
      variants: '-',
      price: '$40/month',
      unit: 'Recurring',
      tax: '0%',
      status: 'Active',
      description: '24/7 priority enterprise maintenance, remote telemetry, and instant swap',
      isSubscription: true,
      recurringInterval: 'Monthly',
      quantityOnHand: 999,
    },
  ])

  // Screen #17 active editable product
  const [selectedProduct, setSelectedProduct] = useState<ProductItem>(productList[0])

  function handleRowClick(prod: ProductItem) {
    setSelectedProduct(prod)
    setCurrentView('details')
  }

  function handleNewProduct() {
    const fresh: ProductItem = {
      id: `prod-${Date.now()}`,
      name: '',
      category: 'Hardware',
      variants: '-',
      price: '$0.00',
      unit: 'Each',
      tax: '15%',
      status: 'Active',
      description: '',
      isSubscription: false,
      recurringInterval: 'Monthly',
      quantityOnHand: 0,
    }
    setSelectedProduct(fresh)
    setCurrentView('details')
  }

  function handleSaveProduct() {
    setProductList(prev => {
      const exists = prev.find(p => p.id === selectedProduct.id)
      if (exists) {
        return prev.map(p => (p.id === selectedProduct.id ? selectedProduct : p))
      }
      return [selectedProduct, ...prev]
    })
    onShowToast(`Saved product "${selectedProduct.name || 'New Product'}" and updated pricelists!`)
    setCurrentView('dashboard')
  }

  /* ──────────────────────────────────────────────────────────
     SCREEN #17: PRODUCT DETAILS PAGE (Product and pricelist)
     ────────────────────────────────────────────────────────── */
  if (currentView === 'details') {
    return (
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Product and pricelist</h1>
          </div>
          <button
            className={styles.btnBack}
            onClick={() => setCurrentView('dashboard')}
            title="Return to Product Dashboard"
          >
            ← Back to Product Catalog
          </button>
        </div>

        {/* Section 1: General info Form */}
        <div className={styles.sectionBlock}>
          <h2 className={styles.sectionHeading}>General info</h2>
          <div className={styles.formCard}>
            <div className={styles.twoColGrid}>
              {/* Left Column */}
              <div className={styles.formCol}>
                <div className={styles.formRow}>
                  <label className={styles.label}>Product name</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={selectedProduct.name}
                    onChange={e =>
                      setSelectedProduct({ ...selectedProduct, name: e.target.value })
                    }
                    placeholder="e.g. Laptop Pro 14"
                  />
                </div>

                <div className={styles.formRow}>
                  <label className={styles.label}>Category</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={selectedProduct.category}
                    onChange={e =>
                      setSelectedProduct({ ...selectedProduct, category: e.target.value })
                    }
                    placeholder="Hardware / Services / Subscription"
                  />
                </div>

                <div className={styles.formRow}>
                  <label className={styles.label}>Price</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={selectedProduct.price}
                    onChange={e =>
                      setSelectedProduct({ ...selectedProduct, price: e.target.value })
                    }
                    placeholder="$1,200"
                  />
                </div>

                <div className={styles.formRow}>
                  <label className={styles.label}>Unit</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={selectedProduct.unit}
                    onChange={e =>
                      setSelectedProduct({ ...selectedProduct, unit: e.target.value })
                    }
                    placeholder="Each / Recurring / Hours"
                  />
                </div>

                <div className={styles.formRow}>
                  <label className={styles.label}>Description</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={selectedProduct.description || ''}
                    onChange={e =>
                      setSelectedProduct({ ...selectedProduct, description: e.target.value })
                    }
                    placeholder="Detailed specifications and notes"
                  />
                </div>
              </div>

              {/* Right Column */}
              <div className={styles.formCol}>
                <div className={styles.formRow}>
                  <label className={styles.label}>Tax %</label>
                  <input
                    type="text"
                    className={styles.inputSmall}
                    value={selectedProduct.tax}
                    onChange={e =>
                      setSelectedProduct({ ...selectedProduct, tax: e.target.value })
                    }
                    placeholder="15%"
                  />
                </div>

                <div className={styles.formRow}>
                  <label className={styles.label}>Subscription</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <button
                      type="button"
                      className={`${styles.togglePill} ${
                        selectedProduct.isSubscription ? styles.togglePillActive : ''
                      }`}
                      onClick={() =>
                        setSelectedProduct({
                          ...selectedProduct,
                          isSubscription: !selectedProduct.isSubscription,
                        })
                      }
                    >
                      {selectedProduct.isSubscription ? 'Yes' : 'NO'}
                    </button>
                    <span className={styles.inlineHelper}>
                      If subscription yes then recurring will be visible
                    </span>
                  </div>
                </div>

                {selectedProduct.isSubscription && (
                  <div className={styles.formRow}>
                    <label className={styles.label}>Recurring</label>
                    <select
                      className={styles.input}
                      value={selectedProduct.recurringInterval || 'Monthly'}
                      onChange={e =>
                        setSelectedProduct({
                          ...selectedProduct,
                          recurringInterval: e.target.value,
                        })
                      }
                    >
                      <option value="Monthly">Monthly</option>
                      <option value="Yearly">Yearly</option>
                      <option value="Weekly">Weekly</option>
                    </select>
                  </div>
                )}

                <div className={styles.formRow}>
                  <label className={styles.label}>Quantity on hand</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                    <input
                      type="number"
                      className={styles.inputSmall}
                      value={selectedProduct.quantityOnHand}
                      onChange={e =>
                        setSelectedProduct({
                          ...selectedProduct,
                          quantityOnHand: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                    <span className={styles.inlineHelper}>(Integer field)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Product Variants */}
        <div className={styles.sectionBlock}>
          <h2 className={styles.sectionHeading}>Product Variants</h2>
          <div className={styles.tableCard}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Attribute</th>
                  <th>Values</th>
                  <th>Extra price</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Color</td>
                  <td>Blue, Black</td>
                  <td>0</td>
                </tr>
                <tr>
                  <td>RAM</td>
                  <td>4GB, 8GB</td>
                  <td>+$30</td>
                </tr>
                <tr>
                  <td>Manufacturer</td>
                  <td>Dell, HP</td>
                  <td>+$100</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 3: Pricelists */}
        <div className={styles.sectionBlock}>
          <h2 className={styles.sectionHeading}>Pricelists</h2>
          <div className={styles.tableCard}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Tier</th>
                  <th>Currency</th>
                  <th>Price Rule</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Bronze</td>
                  <td>USD</td>
                  <td>Price, no adjustment</td>
                </tr>
                <tr>
                  <td>Gold</td>
                  <td>USD/EUR</td>
                  <td>Price minus 10 percent base</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Save Product Action */}
        <button className={styles.btnSaveProduct} onClick={handleSaveProduct}>
          Save Product & Pricelist
        </button>

        {/* Golden / Amber Alert Banner */}
        <div className={styles.alertBanner}>
          <span>Product details should be filled.</span>
          <span>Recurring order with this product will be invoiced at the beginning of the period.</span>
        </div>
      </div>
    )
  }

  /* ──────────────────────────────────────────────────────────
     SCREEN #16: PRODUCT DASHBOARD (Product catalog)
     ────────────────────────────────────────────────────────── */
  return (
    <div className={styles.container}>
      {/* ── Header ────────────────────────────────────────── */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Product catalog</h1>
          <p className={styles.subtitle}>
            Every product, variant and price list in one place
          </p>
        </div>
      </div>

      {/* ── Top Action Buttons Row ────────────────────────── */}
      <div className={styles.topActionsRow}>
        <button
          className={styles.btnNewProduct}
          onClick={handleNewProduct}
          title="Create a new product"
        >
          + New Product
        </button>
        <button
          className={styles.btnManagePrice}
          onClick={() => onShowToast('Opened Price Field Configuration and Tier Rules.')}
          title="Manage price lists and custom currency fields"
        >
          Manage Price fields
        </button>
      </div>

      {/* ── Summary Metric Cards (Row of 3) ───────────────── */}
      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <h2 className={styles.cardTitle}>Total Products</h2>
          <p className={styles.cardSubtitle}>125 active, 6 archived</p>
        </div>

        <div className={styles.summaryCard}>
          <h2 className={styles.cardTitle}>Pricelists</h2>
          <p className={styles.cardSubtitle}>3 tiers, 2 Currencies</p>
        </div>

        <div className={styles.summaryCard}>
          <h2 className={styles.cardTitle}>Variants</h2>
          <p className={styles.cardSubtitle}>340 SKUs across all products</p>
        </div>
      </div>

      {/* ── Section Tag / Pill ────────────────────────────── */}
      <div className={styles.sectionTag}>Products</div>

      {/* ── Products Table Card ───────────────────────────── */}
      <div className={styles.tableCard}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Product name</th>
              <th>Category</th>
              <th>Variants</th>
              <th>Price</th>
              <th>Unit</th>
              <th>Tax</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {productList.map(prod => (
              <tr
                key={prod.id}
                className={styles.tableRow}
                onClick={() => handleRowClick(prod)}
                title={`Click to open details for ${prod.name}`}
              >
                <td>
                  <strong>{prod.name}</strong>
                </td>
                <td>{prod.category}</td>
                <td>{prod.variants}</td>
                <td>
                  <strong>{prod.price}</strong>
                </td>
                <td>{prod.unit}</td>
                <td>{prod.tax}</td>
                <td>
                  <span style={{ color: '#4ade80', fontWeight: 600 }}>{prod.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Amber Callout Banner ──────────────────────────── */}
      <div className={styles.alertBanner}>
        <span>Click a product row to open general info, variants and tier/currency price lists.</span>
      </div>
    </div>
  )
}
