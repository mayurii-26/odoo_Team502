'use client'

import React, { useState, useMemo } from 'react'
import styles from './ProductsWireframe.module.css'
import { Product } from './types'
import { useCurrency } from '@/context/CurrencyContext'

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
  const { formatPrice } = useCurrency()
  const [currentView, setCurrentView] = useState<'dashboard' | 'details'>('dashboard')

  // Map from live PostgreSQL products if available
  const productList = useMemo<ProductItem[]>(() => {
    if (products && products.length > 0) {
      return products.map(p => ({
        id: p.id,
        name: p.name,
        category: p.category,
        variants: p.category === 'Hardware' ? 'Standard' : '-',
        price: formatPrice(p.unitPrice),
        unit: p.type === 'recurring' ? 'Recurring' : 'Each',
        tax: '15%',
        status: 'Active',
        description: p.description || '',
        isSubscription: p.type === 'recurring',
        recurringInterval: 'Monthly',
        quantityOnHand: p.stock || 50,
      }))
    }
    return []
  }, [products])

  const emptyProduct: ProductItem = {
    id: '',
    name: '',
    category: 'Hardware',
    variants: 'Standard',
    price: '$0.00',
    unit: 'Each',
    tax: '15%',
    status: 'Active',
    description: '',
    isSubscription: false,
    quantityOnHand: 0,
  }

  const [selectedProduct, setSelectedProduct] = useState<ProductItem>(productList[0] || emptyProduct)

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
    onAddProduct({
      id: selectedProduct.id,
      name: selectedProduct.name,
      sku: `SKU-${selectedProduct.id}`,
      category: selectedProduct.category as any,
      type: selectedProduct.isSubscription ? 'recurring' : 'one_time',
      unitPrice: parseFloat(selectedProduct.price.replace(/[^0-9.]/g, '')) || 100,
      costPrice: (parseFloat(selectedProduct.price.replace(/[^0-9.]/g, '')) || 100) * 0.65,
      stock: selectedProduct.quantityOnHand,
      description: selectedProduct.description || '',
    })
    onShowToast(`Saved product "${selectedProduct.name || 'New Product'}".`)
    setCurrentView('dashboard')
  }

  if (currentView === 'details') {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Product Details & Pricing</h1>
            <p className={styles.subtitle}>Configure SKU, base price, tax rate, and inventory rules</p>
          </div>
          <button className={styles.btnBack} onClick={() => setCurrentView('dashboard')}>
            Back to Products
          </button>
        </div>

        <div className={styles.detailsCard}>
          <div className={styles.formGrid}>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Product Name</label>
              <input
                className={styles.input}
                value={selectedProduct.name}
                onChange={e => setSelectedProduct({ ...selectedProduct, name: e.target.value })}
                placeholder="Product name"
              />
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Category</label>
              <select
                className={styles.select}
                value={selectedProduct.category}
                onChange={e => setSelectedProduct({ ...selectedProduct, category: e.target.value })}
              >
                <option value="Hardware">Hardware</option>
                <option value="Software">Software</option>
                <option value="Services">Services</option>
                <option value="Subscription">Subscription</option>
              </select>
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Base Price</label>
              <input
                className={styles.input}
                value={selectedProduct.price}
                onChange={e => setSelectedProduct({ ...selectedProduct, price: e.target.value })}
                placeholder="$0.00"
              />
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Stock on Hand</label>
              <input
                type="number"
                className={styles.input}
                value={selectedProduct.quantityOnHand}
                onChange={e => setSelectedProduct({ ...selectedProduct, quantityOnHand: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className={styles.fieldGroupFull}>
              <label className={styles.label}>Description</label>
              <textarea
                className={styles.textarea}
                value={selectedProduct.description}
                onChange={e => setSelectedProduct({ ...selectedProduct, description: e.target.value })}
                placeholder="Enter product specifications and features"
              />
            </div>
          </div>

          <button className={styles.btnSave} onClick={handleSaveProduct}>
            Save Changes
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Product Master Catalog</h1>
          <p className={styles.subtitle}>
            {productList.length} products available across hardware, software, and subscriptions
          </p>
        </div>
      </div>

      <div className={styles.topActionsRow}>
        <button className={styles.btnNew} onClick={handleNewProduct}>
          Create Product
        </button>
      </div>

      <div className={styles.tableCard}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Product Name</th>
              <th>Category</th>
              <th>Unit Price</th>
              <th>Stock</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {productList.map(p => (
              <tr key={p.id} className={styles.tableRow} onClick={() => handleRowClick(p)}>
                <td><span className={styles.productNameCell}>{p.name}</span></td>
                <td>{p.category}</td>
                <td><span className={styles.priceCell}>{p.price}</span></td>
                <td>{p.quantityOnHand} units</td>
                <td><span className={styles.statusActive}>{p.status}</span></td>
                <td style={{ textAlign: 'right' }}>
                  <button
                    className={styles.btnBack}
                    style={{ padding: '3px 10px', fontSize: 12 }}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleRowClick(p)
                    }}
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
