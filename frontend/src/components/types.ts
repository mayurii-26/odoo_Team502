// ============================================================
// DealFlow360 — Global Domain Types
// ============================================================

export type UserRole = 'admin' | 'sales_rep' | 'sales_manager' | 'finance' | 'customer' | 'user'

export interface UserSession {
  id?: number | string
  email: string
  fullName: string
  role: UserRole
  companyName?: string
}

export type QuotationStatus =
  | 'Draft'
  | 'Under Review'
  | 'Approved'
  | 'Negotiating'
  | 'Confirmed'
  | 'Fulfilled'
  | 'Rejected'

export interface QuotationLineItem {
  id: string
  productId: string
  name: string
  category: 'Hardware' | 'Software' | 'Services'
  type: 'one_time' | 'recurring'
  billingInterval?: 'monthly' | 'annual'
  qty: number
  unitPrice: number
  discountPct: number
  costPrice: number
}

export interface QuotationRecommendedItem {
  id: string
  productId: string
  name: string
  category?: 'Hardware' | 'Software' | 'Services' | string
  type: 'UPSELL' | 'CROSS_SELL'
  unitPrice: number
  costPrice: number
  discountPct?: number
  reason: string
  score: number
  marginImpact?: number
  customerAccepted?: boolean
  addedByRep?: boolean
}

export interface Quotation {
  id: string
  dealName: string
  customerName: string
  customerEmail?: string
  customerTier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'ENTERPRISE' | 'MID_MARKET' | 'SMB' | string
  currency?: string
  salesRep: string
  salesRepEmail?: string
  reportingManager?: string
  taggedFinanceOfficer?: string
  status: QuotationStatus
  createdAt: string
  validUntil: string
  items: QuotationLineItem[]
  recommendedItems?: QuotationRecommendedItem[]
  managerComment?: string
  customerComment?: string
  blendedRiskScore: number
  riskLevel: 'Low' | 'Medium' | 'High'
  aiRecommendation?: {
    suggestedItem: string
    reason: string
    marginImpact: string
    applied: boolean
  }
  approvalWorkflow?: {
    assignedRep: string
    reportingManager: string
    taggedFinanceOfficer?: string
    submittedAt: string
    status: 'Pending Manager' | 'Pending Finance' | 'Approved' | 'Rejected' | 'Returned'
    managerStatus: 'Pending' | 'Approved' | 'Rejected' | 'Returned'
    financeStatus?: 'Pending' | 'Approved' | 'Rejected' | 'Not Required'
    managerNotes?: string
    financeNotes?: string
  }
  approvalDetails?: {
    approvedBy?: string
    approvedAt?: string
    approvalLevelRequired: 'None' | 'Manager' | 'Manager+Finance'
  }
  fulfillment?: {
    status: 'Pending' | 'Allocated' | 'Dispatched'
    allocations: Array<{
      warehouse: string
      item: string
      qty: number
      available: number
    }>
  }
  billing?: {
    invoiceId: string
    oneTimeTotal: number
    recurringTotal: number
    recurringPeriod: string
    paymentStatus: 'Pending' | 'Paid' | 'Failed'
    paidAt?: string
  }
}

export interface Product {
  id: string
  sku: string
  name: string
  category: 'Hardware' | 'Software' | 'Services'
  type: 'one_time' | 'recurring'
  unitPrice: number
  costPrice: number
  stock: number
  description: string
  productFamily?: string
  tier?: number
  upgradeFrom?: string[]
  compatibleWith?: string[]
  isPromoted?: boolean
  promotionDiscountPct?: number
  minMarginPercent?: number
}

export interface Warehouse {
  id: string
  name: string
  location: string
  inventory: Record<string, number> // productId -> stock
}

export interface GovernanceRule {
  tierLimits: Record<string, number>
  categoryLimits: Record<string, number>
  approvalLevels: {
    managerThreshold: number
    financeThreshold: number
  }
}

export interface UserAccount {
  id: number
  name: string
  email: string
  role: string
  reporting_manager?: string
  status: 'Active' | 'Pending Invite'
  inviteExpires?: string
}

export interface DirectoryUser {
  id: string
  name: string
  email: string
  role: UserRole
  roleLabel: string
  company: string
  reportingManager?: string
  status: 'Active' | 'Pending Invite' | 'Suspended'
  lastActive: string
  avatarInitials: string
}

export type ActiveModule =
  | 'dashboard'
  | 'quotations'
  | 'builder'
  | 'approvals'
  | 'customer_portal'
  | 'fulfillment'
  | 'subscriptions'
  | 'invoices'
  | 'billing'
  | 'deal_health'
  | 'catalog'
  | 'governance'
  | 'users'
  | 'reports'
  | 'messages'
  | 'profile'
  | 'admin_access'
  | 'admin_messages'
  | 'admin_directory'
  | 'admin_recommendations'
  | 'admin_audit'

export interface WorkflowAuditEntry {
  id: string
  timestamp: string // Formatted ISO / date-time e.g. "Sep 6, 2026, 12:45:10 AM"
  actorName: string
  actorRole: UserRole | string
  actionType:
    | 'DEAL_ASSIGNED'
    | 'APPROVAL_REQUESTED'
    | 'MANAGER_APPROVED'
    | 'MANAGER_RETURNED'
    | 'MANAGER_REJECTED'
    | 'FINANCE_TAGGED'
    | 'FINANCE_APPROVED'
    | 'FINANCE_REJECTED'
    | 'CUSTOMER_PROPOSAL'
    | 'CUSTOMER_ACCEPTED'
    | 'QUOTE_CREATED'
    | 'QUOTE_UPDATED'
  targetQuotationId: string
  customerName: string
  details: string
}

export interface RecommendationWeights {
  upsell: {
    upgrade_frequency: number
    margin_opportunity: number
    promotion: number
    customer_affinity: number
    stock_availability: number
  }
  cross_sell: {
    co_purchase_frequency: number
    compatibility: number
    promotion: number
    margin_opportunity: number
    stock_availability: number
  }
}

export interface Recommendation {
  productId: string
  productName: string
  type: 'UPSELL' | 'CROSS_SELL'
  score: number // 0 - 100
  reasons: string[]
  marginPerUnit: number
  marginPercent: number
  marginImpactPerQuotedUnit: number
  marginImpactTotal: number
  stockQuantity: number
  isPromoted: boolean
  price: number
  costPrice: number
  upgradeFromProductId?: string
  upgradeFromProductName?: string
  promotionDiscountPct?: number
  category?: 'Hardware' | 'Software' | 'Services' | string
}

export interface HistoricalOrderLine {
  productId: string
  quantity: number
  unitPrice: number
}

export interface HistoricalOrder {
  id: string
  customerId: string
  customerName: string
  orderDate: string
  lines: HistoricalOrderLine[]
}

export interface RecommendationRequest {
  customerId?: string
  customerName?: string
  quoteProductIds: string[]
  quoteLines?: QuotationLineItem[]
  products: Product[]
  historicalOrders?: HistoricalOrder[]
  warehouses?: Warehouse[]
  weights?: RecommendationWeights
}

export interface RecommendationResponse {
  upsell: Recommendation[]
  crossSell: Recommendation[]
}

export interface ChatUser {
  id: number
  name: string
  email: string
  role: string
  status?: string
  reporting_manager?: string
}

export interface ChatMessage {
  id: number
  conversation_id: number
  sender_id: number
  receiver_id: number
  message_type: 'text' | 'image' | 'pdf'
  content?: string
  file_url?: string
  file_name?: string
  file_size?: number
  mime_type?: string
  is_read: boolean
  created_at: string
  temp_id?: string
}

export interface ChatConversation {
  id: number
  user1_id: number
  user2_id: number
  last_message?: string
  last_message_type?: string
  last_message_at?: string
  unread_count: number
  recipient: ChatUser
}



