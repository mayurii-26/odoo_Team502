import { Quotation, Product, Warehouse, GovernanceRule, UserAccount } from './types'

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    sku: 'HW-IOT-100',
    name: 'Industrial IoT Telemetry Sensor',
    category: 'Hardware',
    type: 'one_time',
    unitPrice: 240,
    costPrice: 130,
    stock: 850,
    description: 'Ruggedized IP67 edge vibration and temperature sensor.',
  },
  {
    id: 'prod-2',
    sku: 'HW-GW-500',
    name: 'Fleet Edge Gateway Hub v2',
    category: 'Hardware',
    type: 'one_time',
    unitPrice: 1250,
    costPrice: 650,
    stock: 140,
    description: '5G cellular router with CAN bus telematics interface.',
  },
  {
    id: 'prod-3',
    sku: 'SW-PLT-ENT',
    name: 'DealFlow Platform SaaS (Enterprise)',
    category: 'Software',
    type: 'recurring',
    unitPrice: 2500, // per month
    costPrice: 200,
    stock: 9999,
    description: 'Cloud dashboard, AI anomaly detection & real-time dispatch.',
  },
  {
    id: 'prod-4',
    sku: 'SRV-SLA-247',
    name: 'Mission-Critical 24/7 SLA Support',
    category: 'Services',
    type: 'recurring',
    unitPrice: 1500, // per month
    costPrice: 400,
    stock: 9999,
    description: '15-minute response SLA with dedicated Solutions Architect.',
  },
  {
    id: 'prod-5',
    sku: 'SRV-IMP-PRO',
    name: 'Turnkey Enterprise Onboarding & Training',
    category: 'Services',
    type: 'one_time',
    unitPrice: 8500,
    costPrice: 3500,
    stock: 9999,
    description: 'Complete on-site sensor mounting, CAN calibration, and team training.',
  },
]

export const INITIAL_GOVERNANCE: GovernanceRule = {
  tierLimits: {
    Bronze: 5,
    Silver: 10,
    Gold: 15,
    Platinum: 20,
  },
  categoryLimits: {
    Hardware: 15,
    Software: 25,
    Services: 20,
  },
  approvalLevels: {
    managerThreshold: 15,
    financeThreshold: 20,
  },
}

export const INITIAL_WAREHOUSES: Warehouse[] = [
  {
    id: 'wh-austin',
    name: 'Austin Central Distribution Hub',
    location: 'Austin, TX',
    inventory: {
      'prod-1': 500,
      'prod-2': 90,
    },
  },
  {
    id: 'wh-chicago',
    name: 'Chicago Midwest Fulfillment',
    location: 'Chicago, IL',
    inventory: {
      'prod-1': 250,
      'prod-2': 35,
    },
  },
  {
    id: 'wh-seattle',
    name: 'Seattle Pacific Logistics Hub',
    location: 'Seattle, WA',
    inventory: {
      'prod-1': 100,
      'prod-2': 15,
    },
  },
]

export const INITIAL_QUOTATIONS: Quotation[] = [
  {
    id: 'Q-1042',
    dealName: 'Acme Corp — Global Fleet Telematics Expansion',
    customerName: 'Acme Corporation',
    customerTier: 'Gold',
    salesRep: 'Jane Smith',
    status: 'Draft',
    createdAt: '2026-09-05',
    validUntil: '2026-09-30',
    items: [
      {
        id: 'li-1',
        productId: 'prod-2',
        name: 'Fleet Edge Gateway Hub v2',
        category: 'Hardware',
        type: 'one_time',
        qty: 40,
        unitPrice: 1250,
        discountPct: 22.0, // Exceeds 15% hardware ceiling! Triggers approval
        costPrice: 650,
      },
      {
        id: 'li-2',
        productId: 'prod-1',
        name: 'Industrial IoT Telemetry Sensor',
        category: 'Hardware',
        type: 'one_time',
        qty: 200,
        unitPrice: 240,
        discountPct: 15.0,
        costPrice: 130,
      },
      {
        id: 'li-3',
        productId: 'prod-3',
        name: 'DealFlow Platform SaaS (Enterprise)',
        category: 'Software',
        type: 'recurring',
        billingInterval: 'annual',
        qty: 1,
        unitPrice: 30000, // Annual: 2500*12
        discountPct: 10.0,
        costPrice: 2400,
      },
      {
        id: 'li-4',
        productId: 'prod-5',
        name: 'Turnkey Enterprise Onboarding & Training',
        category: 'Services',
        type: 'one_time',
        qty: 1,
        unitPrice: 8500,
        discountPct: 0,
        costPrice: 3500,
      },
    ],
    blendedRiskScore: 68,
    riskLevel: 'High',
    managerComment: '',
    customerComment: '',
    aiRecommendation: {
      suggestedItem: 'Mission-Critical 24/7 SLA Support (Annual)',
      reason: 'Gateway discount is 22% (above 15% limit). Bundling 24/7 SLA ($18k/yr) raises gross margin from 29.4% to 37.2%.',
      marginImpact: '+7.8% Gross Margin',
      applied: false,
    },
    approvalDetails: {
      approvalLevelRequired: 'Manager+Finance',
    },
    fulfillment: {
      status: 'Pending',
      allocations: [
        { warehouse: 'Austin Central Hub', item: 'Fleet Edge Gateway Hub v2', qty: 30, available: 90 },
        { warehouse: 'Chicago Midwest Fulfillment', item: 'Fleet Edge Gateway Hub v2', qty: 10, available: 35 },
        { warehouse: 'Austin Central Hub', item: 'Industrial IoT Telemetry Sensor', qty: 200, available: 500 },
      ],
    },
    billing: {
      invoiceId: 'INV-1042',
      oneTimeTotal: 78900,
      recurringTotal: 27000,
      recurringPeriod: 'Annual',
      paymentStatus: 'Pending',
    },
  },
  {
    id: 'Q-1040',
    dealName: 'Apex Logistics — IoT Sensor Deployment',
    customerName: 'Apex Logistics',
    customerTier: 'Platinum',
    salesRep: 'Alex Rivera',
    status: 'Confirmed',
    createdAt: '2026-09-02',
    validUntil: '2026-09-25',
    items: [
      {
        id: 'li-10',
        productId: 'prod-1',
        name: 'Industrial IoT Telemetry Sensor',
        category: 'Hardware',
        type: 'one_time',
        qty: 150,
        unitPrice: 240,
        discountPct: 12.0,
        costPrice: 130,
      },
    ],
    blendedRiskScore: 18,
    riskLevel: 'Low',
    fulfillment: {
      status: 'Dispatched',
      allocations: [
        { warehouse: 'Austin Central Hub', item: 'Industrial IoT Telemetry Sensor', qty: 150, available: 300 },
      ],
    },
    billing: {
      invoiceId: 'INV-1040',
      oneTimeTotal: 31680,
      recurringTotal: 0,
      recurringPeriod: 'N/A',
      paymentStatus: 'Paid',
      paidAt: '2026-09-03',
    },
  },
  {
    id: 'Q-1039',
    dealName: 'Nexus Global — Smart Grid Pilot',
    customerName: 'Nexus Global',
    customerTier: 'Silver',
    salesRep: 'Jane Smith',
    status: 'Under Review',
    createdAt: '2026-08-28',
    validUntil: '2026-09-20',
    items: [
      {
        id: 'li-20',
        productId: 'prod-2',
        name: 'Fleet Edge Gateway Hub v2',
        category: 'Hardware',
        type: 'one_time',
        qty: 25,
        unitPrice: 1250,
        discountPct: 18.0,
        costPrice: 650,
      },
    ],
    blendedRiskScore: 54,
    riskLevel: 'Medium',
    approvalDetails: {
      approvalLevelRequired: 'Manager',
    },
  },
]

export const INITIAL_USERS: UserAccount[] = [
  { id: 1, name: 'Sarah Connor', email: 'admin@dealflow360.com', role: 'Admin', status: 'Active' },
  { id: 2, name: 'Alex Rivera', email: 'manager@dealflow360.com', role: 'Sales Manager', status: 'Active' },
  { id: 3, name: 'Jane Smith', email: 'sales@dealflow360.com', role: 'Sales Rep', status: 'Active' },
  { id: 4, name: 'David Miller', email: 'finance@dealflow360.com', role: 'Finance', status: 'Active' },
  { id: 5, name: 'John Davis', email: 'customer@acme.com', role: 'Customer', status: 'Active' },
  { id: 6, name: 'Marcus Vance', email: 'marcus.v@dealflow360.com', role: 'Sales Rep', status: 'Pending Invite', inviteExpires: '2026-09-07' },
]
