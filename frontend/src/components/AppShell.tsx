'use client'

import React, { useState } from 'react'
import styles from './AppShell.module.css'
import {
  UserSession,
  ActiveModule,
  Quotation,
  Product,
  Warehouse,
  GovernanceRule,
  UserAccount,
  UserRole,
} from './types'
import {
  INITIAL_QUOTATIONS,
  INITIAL_PRODUCTS,
  INITIAL_WAREHOUSES,
  INITIAL_GOVERNANCE,
  INITIAL_USERS,
} from './mockData'

import DashboardModule from './DashboardModule'
import QuotationsListModule from './QuotationsListModule'
import QuotationBuilderModule from './QuotationBuilderModule'
import ApprovalsModule from './ApprovalsModule'
import CustomerPortalModule from './CustomerPortalModule'
import FulfillmentModule from './FulfillmentModule'
import SubscriptionsModule from './SubscriptionsModule'
import InvoicesModule from './InvoicesModule'
import BillingModule from './BillingModule'
import DealHealthModule from './DealHealthModule'
import ProductCatalogModule from './ProductCatalogModule'
import GovernanceModule from './GovernanceModule'
import UsersModule from './UsersModule'
import ReportsModule from './ReportsModule'

interface AppShellProps {
  user: UserSession
  onLogout: () => void
  onSwitchRole: (role: UserRole) => void
}

export default function AppShell({ user, onLogout, onSwitchRole }: AppShellProps) {
  // Domain state
  const [quotations, setQuotations] = useState<Quotation[]>(INITIAL_QUOTATIONS)
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS)
  const [warehouses, setWarehouses] = useState<Warehouse[]>(INITIAL_WAREHOUSES)
  const [governance, setGovernance] = useState<GovernanceRule>(INITIAL_GOVERNANCE)
  const [users, setUsers] = useState<UserAccount[]>(INITIAL_USERS)

  // Active view: Defaults to 'dashboard'
  const [activeModule, setActiveModule] = useState<ActiveModule>(
    user.role === 'customer' ? 'customer_portal' : 'dashboard'
  )
  const [selectedQuotationId, setSelectedQuotationId] = useState<string>('Q-1042')
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  function showToast(msg: string) {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  function handleUpdateQuotation(updated: Quotation) {
    setQuotations(prev => prev.map(q => (q.id === updated.id ? updated : q)))
  }

  function handleAddProduct(prod: Product) {
    setProducts(prev => [prod, ...prev])
  }

  function handleAddUser(u: UserAccount) {
    setUsers(prev => [u, ...prev])
  }

  const selectedQuote =
    quotations.find(q => q.id === selectedQuotationId) || quotations[0]

  return (
    <div className={styles.shell}>
      {/* ── Single-Row Vibrant Blue Navigation Bar (Matches Wireframe Exactly) ── */}
      <header className={styles.topNavSingleRow}>
        <div className={styles.brandNavLeft}>
          <span
            className={styles.brandText}
            onClick={() => setActiveModule('dashboard')}
            title="DealFlow360 Home"
          >
            DealFlow<span>360</span>
          </span>

          <nav className={styles.navItemsList}>
            <button
              className={`${styles.navBtn} ${activeModule === 'dashboard' ? styles.navBtnActive : ''}`}
              onClick={() => setActiveModule('dashboard')}
            >
              Dashboard
            </button>
            <button
              className={`${styles.navBtn} ${activeModule === 'quotations' || activeModule === 'builder' ? styles.navBtnActive : ''}`}
              onClick={() => setActiveModule('quotations')}
            >
              Quotations
            </button>
            <button
              className={`${styles.navBtn} ${activeModule === 'approvals' ? styles.navBtnActive : ''}`}
              onClick={() => setActiveModule('approvals')}
            >
              Approvals
            </button>
            <button
              className={`${styles.navBtn} ${activeModule === 'fulfillment' ? styles.navBtnActive : ''}`}
              onClick={() => setActiveModule('fulfillment')}
            >
              Fulfillment
            </button>
            <button
              className={`${styles.navBtn} ${activeModule === 'subscriptions' ? styles.navBtnActive : ''}`}
              onClick={() => setActiveModule('subscriptions')}
            >
              Subscriptions
            </button>
            <button
              className={`${styles.navBtn} ${activeModule === 'invoices' || activeModule === 'billing' ? styles.navBtnActive : ''}`}
              onClick={() => setActiveModule('invoices')}
            >
              Invoices
            </button>
            <button
              className={`${styles.navBtn} ${activeModule === 'deal_health' ? styles.navBtnActive : ''}`}
              onClick={() => setActiveModule('deal_health')}
            >
              Deal Health
            </button>
            <button
              className={`${styles.navBtn} ${activeModule === 'reports' ? styles.navBtnActive : ''}`}
              onClick={() => setActiveModule('reports')}
            >
              Reports
            </button>
            <button
              className={`${styles.navBtn} ${activeModule === 'catalog' ? styles.navBtnActive : ''}`}
              onClick={() => setActiveModule('catalog')}
            >
              Products
            </button>
          </nav>
        </div>

        <div className={styles.navRightTools}>
          <button onClick={onLogout} className={styles.logoutBtnCompact} title="Sign out">
            Log Out
          </button>
        </div>
      </header>

      {/* ── Main Workspace Body (Dark Canvas) ─────────────────── */}
      <main className={styles.workspace}>
        {activeModule === 'dashboard' && (
          <DashboardModule
            quotations={quotations}
            onNavigate={setActiveModule}
            onSelectQuotation={setSelectedQuotationId}
          />
        )}

        {activeModule === 'quotations' && (
          <QuotationsListModule
            quotations={quotations}
            onSelectQuotation={setSelectedQuotationId}
            onNavigate={setActiveModule}
          />
        )}

        {activeModule === 'builder' && (
          <QuotationBuilderModule
            quotation={selectedQuote}
            products={products}
            onUpdateQuotation={handleUpdateQuotation}
            onNavigate={setActiveModule}
            onShowToast={showToast}
          />
        )}

        {activeModule === 'approvals' && (
          <ApprovalsModule
            quotations={quotations}
            onUpdateQuotation={handleUpdateQuotation}
            onNavigate={setActiveModule}
            onShowToast={showToast}
          />
        )}

        {activeModule === 'customer_portal' && (
          <CustomerPortalModule
            quotation={selectedQuote}
            onUpdateQuotation={handleUpdateQuotation}
            onNavigate={setActiveModule}
            onShowToast={showToast}
          />
        )}

        {activeModule === 'fulfillment' && (
          <FulfillmentModule
            quotation={selectedQuote}
            warehouses={warehouses}
            onUpdateQuotation={handleUpdateQuotation}
            onNavigate={setActiveModule}
            onShowToast={showToast}
          />
        )}

        {activeModule === 'subscriptions' && (
          <SubscriptionsModule
            onNavigate={setActiveModule}
            onShowToast={showToast}
          />
        )}

        {(activeModule === 'invoices' || activeModule === 'billing') && (
          <InvoicesModule
            quotation={selectedQuote}
            onUpdateQuotation={handleUpdateQuotation}
            onNavigate={setActiveModule}
            onShowToast={showToast}
          />
        )}

        {activeModule === 'deal_health' && (
          <DealHealthModule
            onNavigate={setActiveModule}
            onSelectQuotation={setSelectedQuotationId}
            onShowToast={showToast}
          />
        )}

        {activeModule === 'catalog' && (
          <ProductCatalogModule
            products={products}
            onAddProduct={handleAddProduct}
            onShowToast={showToast}
          />
        )}

        {activeModule === 'governance' && (
          <GovernanceModule
            governance={governance}
            onUpdateGovernance={setGovernance}
            onShowToast={showToast}
          />
        )}

        {activeModule === 'users' && (
          <UsersModule
            users={users}
            onAddUser={handleAddUser}
            onShowToast={showToast}
          />
        )}

        {activeModule === 'reports' && (
          <ReportsModule
            onNavigate={setActiveModule}
            onShowToast={showToast}
          />
        )}
      </main>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className={styles.toast}>
          <span>✓</span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  )
}
