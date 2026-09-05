'use client'

import React, { useState, useEffect } from 'react'
import styles from './AppShell.module.css'
import {
  UserSession,
  ActiveModule,
  Quotation,
  QuotationStatus,
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
import { fetchWorkspaceBootstrap, updateQuotationLive } from '@/lib/api'

/* ── Module Component Imports ─────────────────────────────── */
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
import AdminModule from './AdminModule'

/* ── Minimalist Clean SVG Icons ───────────────────────────── */
function LayoutDashboardIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect width="7" height="9" x="3" y="3" rx="1" />
      <rect width="7" height="5" x="14" y="3" rx="1" />
      <rect width="7" height="9" x="14" y="12" rx="1" />
      <rect width="7" height="5" x="3" y="16" rx="1" />
    </svg>
  )
}

function FileTextIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" x2="8" y1="13" y2="13" />
      <line x1="16" x2="8" y1="17" y2="17" />
      <line x1="10" x2="8" y1="9" y2="9" />
    </svg>
  )
}

function CheckSquareIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 11 12 14 22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  )
}

function PackageIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="m7.5 4.27 9 5.15" />
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m3.3 7 8.7 5 8.7-5" />
      <path d="M12 22V12" />
    </svg>
  )
}

function RepeatIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="m17 2 4 4-4 4" />
      <path d="M3 11v-1a4 4 0 0 1 4-4h14" />
      <path d="m7 22-4-4 4-4" />
      <path d="M21 13v1a4 4 0 0 1-4 4H3" />
    </svg>
  )
}

function CreditCardIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="14" x="2" y="5" rx="2" />
      <line x1="2" x2="22" y1="10" y2="10" />
    </svg>
  )
}

function ActivityIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  )
}

function BarChartIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" x2="12" y1="20" y2="10" />
      <line x1="18" x2="18" y1="20" y2="4" />
      <line x1="6" x2="6" y1="20" y2="16" />
    </svg>
  )
}

function TagIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z" />
      <path d="M7 7h.01" />
    </svg>
  )
}

function UsersIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function ShieldIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  )
}

function MessageSquareIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
}

function SendIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  )
}

function UserIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

function LogOutIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" x2="9" y1="12" y2="12" />
    </svg>
  )
}

function RotateCwIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
    </svg>
  )
}

interface AppShellProps {
  user: UserSession
  onLogout: () => void
  onSwitchRole: (role: UserRole) => void
}

export default function AppShell({ user, onLogout, onSwitchRole }: AppShellProps) {
  // Domain state with robust fallbacks
  const [quotations, setQuotations] = useState<Quotation[]>(INITIAL_QUOTATIONS)
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS)
  const [warehouses, setWarehouses] = useState<Warehouse[]>(INITIAL_WAREHOUSES)
  const [governance, setGovernance] = useState<GovernanceRule>(INITIAL_GOVERNANCE)
  const [users, setUsers] = useState<UserAccount[]>(INITIAL_USERS)
  const [invoices, setInvoices] = useState<any[]>([])
  const [subscriptions, setSubscriptions] = useState<any[]>([])
  const [approvals, setApprovals] = useState<any[]>([])
  const [isDbLoaded, setIsDbLoaded] = useState<boolean>(true)
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false)

  // Role permissions
  const role = user.role || 'sales_rep'
  const isAdmin = role === 'admin'
  const isCustomer = role === 'customer'

  function mapBackendStatusToFrontend(backendStatus: string): QuotationStatus {
    const s = (backendStatus || '').toUpperCase()
    if (s === 'PENDING_APPROVAL' || s === 'UNDER_REVIEW' || s === 'REVIEW') return 'Under Review'
    if (s === 'APPROVED') return 'Approved'
    if (s === 'SENT' || s === 'NEGOTIATING' || s === 'NEGOTIATION') return 'Negotiating'
    if (s === 'ACCEPTED' || s === 'CONFIRMED' || s === 'FULFILLED' || s === 'WON') return 'Confirmed'
    return 'Draft'
  }

  function mapFrontendStatusToBackend(frontendStatus: string): string {
    const s = (frontendStatus || '').toLowerCase()
    if (s.includes('review') || s.includes('pending')) return 'PENDING_APPROVAL'
    if (s.includes('approved')) return 'APPROVED'
    if (s.includes('negotiat') || s.includes('sent')) return 'SENT'
    if (s.includes('confirm') || s.includes('accept') || s.includes('fulfill')) return 'ACCEPTED'
    return 'DRAFT'
  }

  // Active view: Defaults according to role
  const [activeModule, setActiveModule] = useState<ActiveModule>('dashboard')
  const [selectedQuotationId, setSelectedQuotationId] = useState<string>('Q-1042')
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  function showToast(msg: string) {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  function handleNavigateModule(mod: ActiveModule) {
    setActiveModule(mod)
  }

  // Fetch live PostgreSQL database data on mount
  async function loadDatabaseData(isManual = false) {
    if (isManual) setIsRefreshing(true)
    try {
      const data = await fetchWorkspaceBootstrap()
      if (data) {
        if (data.quotations && data.quotations.length > 0) {
          const adaptedQuotes: Quotation[] = data.quotations.map((dq: any) => ({
            id: dq.quote_number || dq.id,
            dealName: `${dq.customer_company || dq.customer_name} - $${Number(dq.total_amount).toLocaleString()}`,
            customerName: dq.customer_company || dq.customer_name,
            customerTier: 'Gold',
            salesRep: dq.sales_rep || 'Jane Smith',
            status: mapBackendStatusToFrontend(dq.status),
            createdAt: dq.created_at || '2026-03-01',
            validUntil: dq.expires_at || '2026-04-01',
            blendedRiskScore: dq.deal_health_score || 80,
            riskLevel: (dq.deal_health_score || 80) < 60 ? 'High' : (dq.deal_health_score || 80) < 75 ? 'Medium' : 'Low',
            items: (dq.lines && dq.lines.length > 0) ? dq.lines.map((l: any) => ({
              id: String(l.id),
              productId: String(l.product_id),
              name: l.product_name,
              category: 'Hardware',
              type: 'one_time',
              qty: l.quantity,
              unitPrice: l.unit_price,
              discountPct: l.discount_percent,
              costPrice: l.unit_cost || l.unit_price * 0.65,
            })) : [
              {
                id: '1',
                productId: '1',
                name: 'CloudScale Engine',
                category: 'Software',
                type: 'recurring',
                billingInterval: 'annual',
                qty: 1,
                unitPrice: dq.total_amount || 12400,
                discountPct: dq.discount_percent || 0,
                costPrice: (dq.total_amount || 12400) * 0.6,
              }
            ],
          }))
          setQuotations(adaptedQuotes)
          if (adaptedQuotes[0]) {
            setSelectedQuotationId(adaptedQuotes[0].id)
          }
        }

        if (data.products && data.products.length > 0) {
          const adaptedProds: Product[] = data.products.map((dp: any) => ({
            id: String(dp.id),
            sku: dp.sku,
            name: dp.name,
            category: dp.category === 'Software' ? 'Software' : dp.category === 'Services' ? 'Services' : 'Hardware',
            type: dp.name.toLowerCase().includes('subscription') || dp.name.toLowerCase().includes('cloud') ? 'recurring' : 'one_time',
            unitPrice: dp.unit_price,
            costPrice: dp.cost_price,
            stock: dp.stock_quantity || 50,
            description: dp.description || '',
          }))
          setProducts(adaptedProds)
        }

        if (data.warehouses && data.warehouses.length > 0) {
          const adaptedWarehouses: Warehouse[] = data.warehouses.map((dw: any) => ({
            id: String(dw.id),
            name: dw.name,
            location: dw.location,
            inventory: { '1': dw.current_stock || 150 },
          }))
          setWarehouses(adaptedWarehouses)
        }

        if (data.users && data.users.length > 0) {
          setUsers(data.users)
        }
        if (data.invoices && data.invoices.length > 0) {
          setInvoices(data.invoices)
        }
        if (data.subscriptions && data.subscriptions.length > 0) {
          setSubscriptions(data.subscriptions)
        }
        if (data.approvals && data.approvals.length > 0) {
          setApprovals(data.approvals)
        }

        setIsDbLoaded(true)
        if (isManual) showToast('Database synchronized.')
      }
    } catch (e) {
      console.warn('Backend live sync offline, using rich mock data')
    } finally {
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    loadDatabaseData()
  }, [])

  async function handleUpdateQuotation(updated: Quotation) {
    setQuotations(prev => prev.map(q => (q.id === updated.id ? updated : q)))
    try {
      const backendStatus = mapFrontendStatusToBackend(updated.status)
      await updateQuotationLive(updated.id, {
        status: backendStatus,
        notes: updated.managerComment || updated.customerComment,
      }).catch(() => null)
    } catch {}
  }

  function handleAddProduct(prod: Product) {
    setProducts(prev => [prod, ...prev])
  }

  function handleAddUser(u: UserAccount) {
    setUsers(prev => [u, ...prev])
  }

  const selectedQuote =
    quotations.find(q => q.id === selectedQuotationId) || quotations[0]

  const moduleTitles: Record<ActiveModule, string> = {
    dashboard: 'Dashboard',
    quotations: 'Quotations',
    builder: `Quotation Builder (${selectedQuotationId})`,
    approvals: 'Approvals Hub',
    customer_portal: 'Customer Portal',
    fulfillment: 'Fulfillment & Stock',
    subscriptions: 'Subscriptions',
    invoices: 'Invoices',
    billing: 'Billing',
    deal_health: 'Deal Health',
    catalog: 'Product Master',
    governance: 'Governance Rules',
    users: 'Team & Users',
    reports: 'Reports & Analytics',
    messages: 'Customer Messages',
    profile: 'Customer Profile',
    admin_access: 'Role Access & Provisioning',
    admin_messages: 'Message Anyone',
    admin_directory: 'All Users & Directory',
  }

  const roleLabelMap: Record<UserRole, string> = {
    admin: 'Administrator',
    sales_rep: 'Sales Rep',
    sales_manager: 'Sales Manager',
    finance: 'Finance',
    customer: 'Customer',
  }

  const pendingApprovalsCount = quotations.filter(q => q.status === 'Under Review').length

  return (
    <div className={styles.shell}>
      {/* ── Left Clean Enterprise Sidebar (Chinmay B2B Layout) ─── */}
      <aside className={styles.sidebar}>
        {/* Header Branding */}
        <div className={styles.sidebarHeader}>
          <div className={styles.brandWrap} onClick={() => handleNavigateModule('dashboard')}>
            <div className={styles.brandLogo}>D</div>
            <div className={styles.brandInfo}>
              <span className={styles.brandName}>
                DealFlow<span>360</span>
              </span>
              <span className={styles.brandTagline}>Sales Operations</span>
            </div>
          </div>
        </div>

        {/* User Persona Badge */}
        <div className={styles.userBadgeCard}>
          <div className={styles.userAvatar}>
            {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className={styles.userInfo}>
            <div className={styles.userName} title={user.fullName || user.email}>
              {user.fullName || user.email}
            </div>
            <span className={styles.userRolePill}>
              {roleLabelMap[user.role] || user.role}
            </span>
          </div>
        </div>

        {/* Grouped Navigation Links (Dynamically Adapting to User Role) */}
        <div className={styles.navScroll}>
          {/* ─── Role: Customer Navigation ─── */}
          {isCustomer ? (
            <div className={styles.navGroup}>
              <span className={styles.groupLabel}>Customer Portal</span>
              <button
                className={`${styles.navLink} ${activeModule === 'dashboard' ? styles.navLinkActive : ''}`}
                onClick={() => handleNavigateModule('dashboard')}
              >
                <div className={styles.navLinkContent}>
                  <span className={styles.navIconWrap}><LayoutDashboardIcon /></span>
                  <span>Portal Overview</span>
                </div>
              </button>

              <button
                className={`${styles.navLink} ${activeModule === 'customer_portal' ? styles.navLinkActive : ''}`}
                onClick={() => handleNavigateModule('customer_portal')}
              >
                <div className={styles.navLinkContent}>
                  <span className={styles.navIconWrap}><FileTextIcon /></span>
                  <span>My Quotation</span>
                </div>
              </button>

              <button
                className={`${styles.navLink} ${activeModule === 'messages' ? styles.navLinkActive : ''}`}
                onClick={() => handleNavigateModule('messages')}
              >
                <div className={styles.navLinkContent}>
                  <span className={styles.navIconWrap}><MessageSquareIcon /></span>
                  <span>Messages</span>
                </div>
              </button>

              <button
                className={`${styles.navLink} ${activeModule === 'profile' ? styles.navLinkActive : ''}`}
                onClick={() => handleNavigateModule('profile')}
              >
                <div className={styles.navLinkContent}>
                  <span className={styles.navIconWrap}><UserIcon /></span>
                  <span>Account Profile</span>
                </div>
              </button>
            </div>
          ) : isAdmin ? (
            /* ─── Role: Admin Navigation ─── */
            <>
              <div className={styles.navGroup}>
                <span className={styles.groupLabel}>Administration</span>
                <button
                  className={`${styles.navLink} ${activeModule === 'dashboard' ? styles.navLinkActive : ''}`}
                  onClick={() => handleNavigateModule('dashboard')}
                >
                  <div className={styles.navLinkContent}>
                    <span className={styles.navIconWrap}><LayoutDashboardIcon /></span>
                    <span>Admin Dashboard</span>
                  </div>
                </button>

                <button
                  className={`${styles.navLink} ${activeModule === 'admin_access' ? styles.navLinkActive : ''}`}
                  onClick={() => handleNavigateModule('admin_access')}
                >
                  <div className={styles.navLinkContent}>
                    <span className={styles.navIconWrap}><ShieldIcon /></span>
                    <span>Role Access</span>
                  </div>
                </button>

                <button
                  className={`${styles.navLink} ${activeModule === 'admin_messages' ? styles.navLinkActive : ''}`}
                  onClick={() => handleNavigateModule('admin_messages')}
                >
                  <div className={styles.navLinkContent}>
                    <span className={styles.navIconWrap}><SendIcon /></span>
                    <span>Message Anyone</span>
                  </div>
                </button>

                <button
                  className={`${styles.navLink} ${activeModule === 'admin_directory' ? styles.navLinkActive : ''}`}
                  onClick={() => handleNavigateModule('admin_directory')}
                >
                  <div className={styles.navLinkContent}>
                    <span className={styles.navIconWrap}><UsersIcon /></span>
                    <span>All Users &amp; Directory</span>
                  </div>
                </button>
              </div>

              <div className={styles.navGroup}>
                <span className={styles.groupLabel}>Governance &amp; Controls</span>
                <button
                  className={`${styles.navLink} ${activeModule === 'governance' ? styles.navLinkActive : ''}`}
                  onClick={() => handleNavigateModule('governance')}
                >
                  <div className={styles.navLinkContent}>
                    <span className={styles.navIconWrap}><ShieldIcon /></span>
                    <span>Governance Rules</span>
                  </div>
                </button>

                <button
                  className={`${styles.navLink} ${activeModule === 'users' ? styles.navLinkActive : ''}`}
                  onClick={() => handleNavigateModule('users')}
                >
                  <div className={styles.navLinkContent}>
                    <span className={styles.navIconWrap}><UsersIcon /></span>
                    <span>Team Management</span>
                  </div>
                </button>
              </div>

              <div className={styles.navGroup}>
                <span className={styles.groupLabel}>Sales Audit</span>
                <button
                  className={`${styles.navLink} ${activeModule === 'quotations' ? styles.navLinkActive : ''}`}
                  onClick={() => handleNavigateModule('quotations')}
                >
                  <div className={styles.navLinkContent}>
                    <span className={styles.navIconWrap}><FileTextIcon /></span>
                    <span>All Quotations</span>
                  </div>
                  <span className={styles.navBadge}>{quotations.length}</span>
                </button>

                <button
                  className={`${styles.navLink} ${activeModule === 'reports' ? styles.navLinkActive : ''}`}
                  onClick={() => handleNavigateModule('reports')}
                >
                  <div className={styles.navLinkContent}>
                    <span className={styles.navIconWrap}><BarChartIcon /></span>
                    <span>Executive Reports</span>
                  </div>
                </button>
              </div>
            </>
          ) : (
            /* ─── Role: Sales Representative / Manager / Finance (Chinmay Sales Module) ─── */
            <>
              {/* Section 1: Sales Operations */}
              <div className={styles.navGroup}>
                <span className={styles.groupLabel}>Sales &amp; Pipeline</span>
                <button
                  className={`${styles.navLink} ${activeModule === 'dashboard' ? styles.navLinkActive : ''}`}
                  onClick={() => handleNavigateModule('dashboard')}
                >
                  <div className={styles.navLinkContent}>
                    <span className={styles.navIconWrap}><LayoutDashboardIcon /></span>
                    <span>Dashboard</span>
                  </div>
                </button>

                <button
                  className={`${styles.navLink} ${activeModule === 'quotations' ? styles.navLinkActive : ''}`}
                  onClick={() => handleNavigateModule('quotations')}
                >
                  <div className={styles.navLinkContent}>
                    <span className={styles.navIconWrap}><FileTextIcon /></span>
                    <span>Quotations</span>
                  </div>
                  <span className={`${styles.navBadge} ${activeModule === 'quotations' ? styles.navBadgeActive : ''}`}>
                    {quotations.length}
                  </span>
                </button>

                <button
                  className={`${styles.navLink} ${activeModule === 'approvals' ? styles.navLinkActive : ''}`}
                  onClick={() => handleNavigateModule('approvals')}
                >
                  <div className={styles.navLinkContent}>
                    <span className={styles.navIconWrap}><CheckSquareIcon /></span>
                    <span>Approvals</span>
                  </div>
                  {pendingApprovalsCount > 0 && (
                    <span className={`${styles.navBadge} ${styles.navBadgeActive}`}>
                      {pendingApprovalsCount}
                    </span>
                  )}
                </button>
              </div>

              {/* Section 2: Commerce & Execution */}
              <div className={styles.navGroup}>
                <span className={styles.groupLabel}>Commerce &amp; Ledger</span>
                <button
                  className={`${styles.navLink} ${activeModule === 'fulfillment' ? styles.navLinkActive : ''}`}
                  onClick={() => handleNavigateModule('fulfillment')}
                >
                  <div className={styles.navLinkContent}>
                    <span className={styles.navIconWrap}><PackageIcon /></span>
                    <span>Fulfillment</span>
                  </div>
                </button>

                <button
                  className={`${styles.navLink} ${activeModule === 'subscriptions' ? styles.navLinkActive : ''}`}
                  onClick={() => handleNavigateModule('subscriptions')}
                >
                  <div className={styles.navLinkContent}>
                    <span className={styles.navIconWrap}><RepeatIcon /></span>
                    <span>Subscriptions</span>
                  </div>
                </button>

                <button
                  className={`${styles.navLink} ${activeModule === 'invoices' || activeModule === 'billing' ? styles.navLinkActive : ''}`}
                  onClick={() => handleNavigateModule('invoices')}
                >
                  <div className={styles.navLinkContent}>
                    <span className={styles.navIconWrap}><CreditCardIcon /></span>
                    <span>Invoices</span>
                  </div>
                </button>
              </div>

              {/* Section 3: Intelligence & Master Catalog */}
              <div className={styles.navGroup}>
                <span className={styles.groupLabel}>Intelligence &amp; Master</span>
                <button
                  className={`${styles.navLink} ${activeModule === 'deal_health' ? styles.navLinkActive : ''}`}
                  onClick={() => handleNavigateModule('deal_health')}
                >
                  <div className={styles.navLinkContent}>
                    <span className={styles.navIconWrap}><ActivityIcon /></span>
                    <span>Deal Health</span>
                  </div>
                </button>

                <button
                  className={`${styles.navLink} ${activeModule === 'reports' ? styles.navLinkActive : ''}`}
                  onClick={() => handleNavigateModule('reports')}
                >
                  <div className={styles.navLinkContent}>
                    <span className={styles.navIconWrap}><BarChartIcon /></span>
                    <span>Reports</span>
                  </div>
                </button>

                <button
                  className={`${styles.navLink} ${activeModule === 'catalog' ? styles.navLinkActive : ''}`}
                  onClick={() => handleNavigateModule('catalog')}
                >
                  <div className={styles.navLinkContent}>
                    <span className={styles.navIconWrap}><TagIcon /></span>
                    <span>Products</span>
                  </div>
                  <span className={styles.navBadge}>{products.length}</span>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Sidebar Footer */}
        <div className={styles.sidebarFooter}>
          <div className={styles.dbStatusPill}>
            <span className={styles.dbDot} />
            <span>Database Live {isDbLoaded ? `(${quotations.length} deals)` : 'Connecting...'}</span>
          </div>

          <button onClick={onLogout} className={styles.logoutBtn} title="Sign out of DealFlow360">
            <LogOutIcon />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ── Main Layout Canvas ───────────────────────────────────── */}
      <div className={styles.mainLayout}>
        {/* Top Header Bar */}
        <header className={styles.topBar}>
          <div className={styles.breadcrumbs}>
            <span className={styles.breadRoot}>DealFlow360</span>
            <span className={styles.breadDivider}>/</span>
            <span className={styles.breadCurrent}>{moduleTitles[activeModule] || 'Workspace'}</span>
          </div>

          <div className={styles.topBarRight}>
            {/* Quick Role Switcher for instant role preview */}
            <select
              className={styles.roleSwitcherSelect}
              value={user.role}
              onChange={e => {
                const newRole = e.target.value as UserRole
                onSwitchRole(newRole)
                showToast(`Switched view to ${roleLabelMap[newRole]}`)
                setActiveModule('dashboard')
              }}
              title="Switch user perspective"
            >
              <option value="sales_rep">Sales Representative</option>
              <option value="admin">Administrator</option>
              <option value="customer">Customer (Acme Corp)</option>
              <option value="sales_manager">Sales Manager</option>
              <option value="finance">Finance</option>
            </select>

            <button
              className={styles.refreshBtn}
              onClick={() => loadDatabaseData(true)}
              disabled={isRefreshing}
              title="Refresh data from database"
            >
              <RotateCwIcon className={isRefreshing ? styles.refreshIconRotating : ''} />
              <span>{isRefreshing ? 'Syncing...' : 'Sync DB'}</span>
            </button>
          </div>
        </header>

        {/* Module Content Body */}
        <main className={styles.workspace}>
          {/* Dashboard Module (dynamically adapts according to user.role) */}
          {activeModule === 'dashboard' && (
            <DashboardModule
              user={user}
              quotations={quotations}
              onNavigate={handleNavigateModule}
              onSelectQuotation={setSelectedQuotationId}
            />
          )}

          {/* Customer Portal Modules (from Local Stash) */}
          {(activeModule === 'customer_portal' || activeModule === 'messages' || activeModule === 'profile') && (
            <CustomerPortalModule
              quotation={selectedQuote}
              customerTab={
                activeModule === 'messages'
                  ? 'messages'
                  : activeModule === 'profile'
                  ? 'profile'
                  : 'quotation'
              }
              onUpdateQuotation={handleUpdateQuotation}
              onNavigate={handleNavigateModule}
              onShowToast={showToast}
            />
          )}

          {/* Root Admin Modules (from Local Stash) */}
          {(activeModule === 'admin_access' || activeModule === 'admin_messages' || activeModule === 'admin_directory') && (
            <AdminModule
              adminTab={
                activeModule === 'admin_messages'
                  ? 'messages'
                  : activeModule === 'admin_directory'
                  ? 'directory'
                  : 'access'
              }
              onNavigateTab={tab =>
                handleNavigateModule(
                  tab === 'messages'
                    ? 'admin_messages'
                    : tab === 'directory'
                    ? 'admin_directory'
                    : 'admin_access'
                )
              }
              onSwitchRole={onSwitchRole}
              onShowToast={showToast}
            />
          )}

          {/* Sales Representative Modules (pushed by Chinmay) */}
          {activeModule === 'quotations' && (
            <QuotationsListModule
              quotations={quotations}
              onSelectQuotation={setSelectedQuotationId}
              onNavigate={handleNavigateModule}
              onUpdateQuotation={handleUpdateQuotation}
              onShowToast={showToast}
            />
          )}

          {activeModule === 'builder' && (
            <QuotationBuilderModule
              quotation={selectedQuote}
              products={products}
              onUpdateQuotation={handleUpdateQuotation}
              onNavigate={handleNavigateModule}
              onShowToast={showToast}
            />
          )}

          {activeModule === 'approvals' && (
            <ApprovalsModule
              quotations={quotations}
              approvals={approvals}
              onUpdateQuotation={handleUpdateQuotation}
              onNavigate={handleNavigateModule}
              onShowToast={showToast}
            />
          )}

          {activeModule === 'fulfillment' && (
            <FulfillmentModule
              quotation={selectedQuote}
              warehouses={warehouses}
              quotations={quotations}
              onUpdateQuotation={handleUpdateQuotation}
              onNavigate={handleNavigateModule}
              onShowToast={showToast}
            />
          )}

          {activeModule === 'subscriptions' && (
            <SubscriptionsModule
              subscriptions={subscriptions}
              onNavigate={handleNavigateModule}
              onShowToast={showToast}
            />
          )}

          {(activeModule === 'invoices' || activeModule === 'billing') && (
            <InvoicesModule
              quotation={selectedQuote}
              invoices={invoices}
              onUpdateQuotation={handleUpdateQuotation}
              onNavigate={handleNavigateModule}
              onShowToast={showToast}
            />
          )}

          {activeModule === 'deal_health' && (
            <DealHealthModule
              quotations={quotations}
              onNavigate={handleNavigateModule}
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
              onNavigate={handleNavigateModule}
              onShowToast={showToast}
            />
          )}
        </main>
      </div>

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
