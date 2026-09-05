import { Quotation, Product, Warehouse, GovernanceRule, UserAccount, HistoricalOrder } from './types'

// ============================================================
// DealFlow360 — Realistic Sample Data & Mock Datasets
// ============================================================

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-laptop-basic',
    sku: 'LP-BSC',
    name: 'Laptop Basic',
    category: 'Hardware',
    type: 'one_time',
    unitPrice: 50000,
    costPrice: 35000,
    stock: 80,
    productFamily: 'Laptop',
    tier: 1,
    upgradeFrom: [],
    compatibleWith: [],
    isPromoted: false,
    description: '14-inch essential business laptop, Intel Core i5, 16GB RAM, 512GB NVMe SSD.',
  },
  {
    id: 'prod-laptop-pro',
    sku: 'LP-PRO',
    name: 'Laptop Pro',
    category: 'Hardware',
    type: 'one_time',
    unitPrice: 75000,
    costPrice: 50000,
    stock: 45,
    productFamily: 'Laptop',
    tier: 2,
    upgradeFrom: ['prod-laptop-basic', '1', 'LP-BSC'],
    compatibleWith: [],
    isPromoted: true,
    promotionDiscountPct: 10,
    description: '16-inch high-performance laptop, Intel Core i7, 32GB RAM, dedicated GPU.',
  },
  {
    id: 'prod-laptop-ent',
    sku: 'LP-ENT',
    name: 'Laptop Enterprise',
    category: 'Hardware',
    type: 'one_time',
    unitPrice: 120000,
    costPrice: 75000,
    stock: 25,
    productFamily: 'Laptop',
    tier: 3,
    upgradeFrom: ['prod-laptop-pro', 'prod-laptop-basic', '2', '1', 'LP-PRO', 'LP-BSC'],
    compatibleWith: [],
    isPromoted: false,
    description: 'Workstation powerhouse laptop, Intel Core i9, 64GB RAM, 4K OLED display.',
  },
  {
    id: 'prod-mouse',
    sku: 'ACC-MOU',
    name: 'Mouse',
    category: 'Hardware',
    type: 'one_time',
    unitPrice: 2500,
    costPrice: 1200,
    stock: 150,
    compatibleWith: ['prod-laptop-basic', 'prod-laptop-pro', 'prod-laptop-ent', '1', '2', '3', 'prod-dock', 'prod-monitor'],
    isPromoted: false,
    description: 'Ergonomic dual-mode Bluetooth & 2.4GHz wireless precision optical mouse.',
  },
  {
    id: 'prod-bag',
    sku: 'ACC-BAG',
    name: 'Laptop Bag',
    category: 'Hardware',
    type: 'one_time',
    unitPrice: 4000,
    costPrice: 1800,
    stock: 95,
    compatibleWith: ['prod-laptop-basic', 'prod-laptop-pro', 'prod-laptop-ent', '1', '2', '3'],
    isPromoted: false,
    description: 'Water-resistant shock-absorbing ballistic nylon protective laptop sleeve & bag.',
  },
  {
    id: 'prod-dock',
    sku: 'ACC-DOC',
    name: 'Docking Station',
    category: 'Hardware',
    type: 'one_time',
    unitPrice: 18000,
    costPrice: 10000,
    stock: 35,
    compatibleWith: ['prod-laptop-basic', 'prod-laptop-pro', 'prod-laptop-ent', '1', '2', '3'],
    isPromoted: true,
    promotionDiscountPct: 15,
    description: 'Thunderbolt 4 universal dock with dual 4K DisplayPort/HDMI, Gigabit LAN, 100W PD.',
  },
  {
    id: 'prod-warranty',
    sku: 'SRV-WAR',
    name: 'Extended Warranty',
    category: 'Services',
    type: 'recurring',
    unitPrice: 12000,
    costPrice: 3000,
    stock: 500,
    compatibleWith: ['prod-laptop-basic', 'prod-laptop-pro', 'prod-laptop-ent', '1', '2', '3', 'prod-dock', 'prod-monitor'],
    isPromoted: true,
    promotionDiscountPct: 10,
    description: '3-Year 24/7 next-business-day on-site replacement and accidental damage protection.',
  },
  {
    id: 'prod-monitor',
    sku: 'HW-MON',
    name: 'Monitor',
    category: 'Hardware',
    type: 'one_time',
    unitPrice: 28000,
    costPrice: 18000,
    stock: 40,
    compatibleWith: ['prod-laptop-basic', 'prod-laptop-pro', 'prod-laptop-ent', '1', '2', '3', 'prod-dock'],
    isPromoted: false,
    description: '27-inch 4K IPS ultra-narrow bezel monitor with 99% sRGB and USB-C upstream.',
  },
  {
    id: 'prod-keyboard',
    sku: 'ACC-KBD',
    name: 'Keyboard',
    category: 'Hardware',
    type: 'one_time',
    unitPrice: 5500,
    costPrice: 2800,
    stock: 110,
    compatibleWith: ['prod-laptop-basic', 'prod-laptop-pro', 'prod-laptop-ent', '1', '2', '3', 'prod-dock', 'prod-monitor'],
    isPromoted: false,
    description: 'Low-profile wireless mechanical keyboard with quiet tactile switches and multi-device pairing.',
  },
  {
    id: 'prod-oos-keyboard',
    sku: 'ACC-OOS',
    name: 'Mechanical RGB Keyboard Pro',
    category: 'Hardware',
    type: 'one_time',
    unitPrice: 9500,
    costPrice: 5000,
    stock: 0, // OUT OF STOCK for testing hard-filter!
    compatibleWith: ['prod-laptop-basic', 'prod-laptop-pro', 'prod-laptop-ent', '1', '2', '3'],
    isPromoted: true,
    description: 'Premium RGB mechanical keyboard with hot-swappable switches (Currently Out of Stock).',
  },
]

// ============================================================
// Historical Orders for Deterministic Co-Purchase & Upgrade Scoring
// ============================================================
function generateRealisticHistoricalOrders(): HistoricalOrder[] {
  const orders: HistoricalOrder[] = []

  // Customer accounts
  const customers = [
    { id: 'CUST-TCS', name: 'TCS' },
    { id: 'CUST-INFY', name: 'Infosys Ltd' },
    { id: 'CUST-WIPRO', name: 'Wipro Technologies' },
    { id: 'CUST-HCL', name: 'HCL Technologies' },
    { id: 'CUST-TECHM', name: 'Tech Mahindra' },
    { id: 'CUST-RELIANCE', name: 'Reliance Industries' },
    { id: 'CUST-ACME', name: 'Acme Enterprise' },
  ]

  let ordCount = 1

  // 1. TCS Historical Orders (contains Laptop, Extended Warranty, and Mouse)
  orders.push({
    id: `ORD-${String(ordCount++).padStart(4, '0')}`,
    customerId: 'CUST-TCS',
    customerName: 'TCS',
    orderDate: '2025-06-15',
    lines: [
      { productId: 'prod-laptop-basic', quantity: 20, unitPrice: 50000 },
      { productId: 'prod-warranty', quantity: 20, unitPrice: 12000 },
      { productId: 'prod-mouse', quantity: 20, unitPrice: 2500 },
    ],
  })

  orders.push({
    id: `ORD-${String(ordCount++).padStart(4, '0')}`,
    customerId: 'CUST-TCS',
    customerName: 'TCS',
    orderDate: '2025-09-20',
    lines: [
      { productId: 'prod-laptop-pro', quantity: 15, unitPrice: 75000 },
      { productId: 'prod-warranty', quantity: 15, unitPrice: 12000 },
      { productId: 'prod-dock', quantity: 15, unitPrice: 18000 },
    ],
  })

  // 2. 100 historical orders with Laptop Basic:
  // - 70 orders contain Mouse (70% co-purchase)
  // - 65 orders contain Bag (65% co-purchase)
  // - 45 orders contain Warranty (45% co-purchase)
  // - 20 orders contain Monitor
  // - 25 orders contain Keyboard
  // - 15 orders contain Docking Station
  for (let i = 1; i <= 100; i++) {
    const cust = customers[i % customers.length]
    const lines: HistoricalOrder['lines'] = [
      { productId: 'prod-laptop-basic', quantity: 1 + (i % 5), unitPrice: 50000 },
    ]

    if (i <= 70) {
      // 70% contain Mouse
      lines.push({ productId: 'prod-mouse', quantity: 1 + (i % 5), unitPrice: 2500 })
    }
    if (i <= 65) {
      // 65% contain Bag
      lines.push({ productId: 'prod-bag', quantity: 1 + (i % 5), unitPrice: 4000 })
    }
    if (i <= 45) {
      // 45% contain Warranty
      lines.push({ productId: 'prod-warranty', quantity: 1 + (i % 5), unitPrice: 12000 })
    }
    if (i <= 25) {
      // 25% contain Keyboard
      lines.push({ productId: 'prod-keyboard', quantity: 1 + (i % 3), unitPrice: 5500 })
    }
    if (i <= 20) {
      // 20% contain Monitor
      lines.push({ productId: 'prod-monitor', quantity: 1, unitPrice: 28000 })
    }
    if (i <= 15) {
      // 15% contain Dock
      lines.push({ productId: 'prod-dock', quantity: 1, unitPrice: 18000 })
    }

    orders.push({
      id: `ORD-${String(ordCount++).padStart(4, '0')}`,
      customerId: cust.id,
      customerName: cust.name,
      orderDate: `2025-${String((i % 12) + 1).padStart(2, '0')}-10`,
      lines,
    })
  }

  // 3. 50 historical orders with Laptop Pro:
  // - 38 orders contain Docking Station (76% co-purchase)
  // - 32 orders contain Warranty (64% co-purchase)
  // - 28 orders contain Mouse
  for (let j = 1; j <= 50; j++) {
    const cust = customers[j % customers.length]
    const lines: HistoricalOrder['lines'] = [
      { productId: 'prod-laptop-pro', quantity: 2, unitPrice: 75000 },
    ]
    if (j <= 38) {
      lines.push({ productId: 'prod-dock', quantity: 2, unitPrice: 18000 })
    }
    if (j <= 32) {
      lines.push({ productId: 'prod-warranty', quantity: 2, unitPrice: 12000 })
    }
    if (j <= 28) {
      lines.push({ productId: 'prod-mouse', quantity: 2, unitPrice: 2500 })
    }

    orders.push({
      id: `ORD-${String(ordCount++).padStart(4, '0')}`,
      customerId: cust.id,
      customerName: cust.name,
      orderDate: `2025-${String((j % 12) + 1).padStart(2, '0')}-18`,
      lines,
    })
  }

  // 4. Upgrade History: customers who purchased Laptop Basic and later upgraded to Laptop Pro / Enterprise
  // Out of customers who purchased Basic, ~72% later purchased Laptop Pro
  const upgradeCusts = ['CUST-TCS', 'CUST-INFY', 'CUST-WIPRO', 'CUST-HCL', 'CUST-TECHM']
  upgradeCusts.forEach((cId, idx) => {
    orders.push({
      id: `ORD-${String(ordCount++).padStart(4, '0')}`,
      customerId: cId,
      customerName: customers.find(c => c.id === cId)?.name || 'Enterprise Customer',
      orderDate: '2026-01-15',
      lines: [
        { productId: 'prod-laptop-pro', quantity: 10 + idx, unitPrice: 75000 },
        { productId: 'prod-dock', quantity: 10 + idx, unitPrice: 18000 },
      ],
    })
  })

  return orders
}

export const INITIAL_HISTORICAL_ORDERS: HistoricalOrder[] = generateRealisticHistoricalOrders()

export const INITIAL_GOVERNANCE: GovernanceRule = {
  tierLimits: {
    Bronze: 5,
    Silver: 10,
    Gold: 15,
    Platinum: 20,
    ENTERPRISE: 25,
  },
  categoryLimits: {
    Hardware: 15,
    Software: 20,
    Services: 25,
  },
  approvalLevels: {
    managerThreshold: 15,
    financeThreshold: 20,
  },
}

export const INITIAL_WAREHOUSES: Warehouse[] = [
  {
    id: 'wh-mumbai',
    name: 'Mumbai Central Logistics Hub',
    location: 'Mumbai, MH',
    inventory: {
      'prod-laptop-basic': 50,
      'prod-laptop-pro': 25,
      'prod-laptop-ent': 15,
      'prod-mouse': 100,
      'prod-bag': 60,
      'prod-dock': 20,
      'prod-warranty': 300,
      'prod-monitor': 25,
      'prod-keyboard': 70,
      'prod-oos-keyboard': 0,
      '1': 60,
      '2': 30,
      '3': 20,
      '13': 80,
      '14': 40,
      '15': 30,
      '16': 40,
      '22': 80,
      '4': 30,
      '24': 0,
    },
  },
  {
    id: 'wh-blr',
    name: 'Bengaluru Tech Warehouse',
    location: 'Bengaluru, KA',
    inventory: {
      'prod-laptop-basic': 30,
      'prod-laptop-pro': 20,
      'prod-laptop-ent': 10,
      'prod-mouse': 50,
      'prod-bag': 35,
      'prod-dock': 15,
      'prod-warranty': 200,
      'prod-monitor': 15,
      'prod-keyboard': 40,
      'prod-oos-keyboard': 0,
      '1': 37,
      '2': 67,
      '3': 77,
      '13': 17,
      '14': 9,
      '15': 67,
      '16': 9,
      '22': 17,
      '4': 19,
      '24': 0,
    },
  },
]

export const INITIAL_QUOTATIONS: Quotation[] = [
  {
    id: 'Q-1042',
    dealName: 'Acme Corporation - $100,000',
    customerName: 'Acme Corporation',
    customerTier: 'Enterprise',
    salesRep: 'Sarah Jenkins',
    salesRepEmail: 'sarah.j@dealflow360.com',
    reportingManager: 'Alex Morgan',
    taggedFinanceOfficer: 'Marcus Sterling',
    status: 'Approved',
    createdAt: '2026-03-01',
    validUntil: '2026-04-15',
    blendedRiskScore: 84,
    riskLevel: 'Low',
    items: [
      {
        id: 'item-1',
        productId: 'prod-laptop-basic',
        name: 'Laptop Basic',
        category: 'Hardware',
        type: 'one_time',
        qty: 2,
        unitPrice: 50000,
        discountPct: 5,
        costPrice: 35000,
      },
    ],
    recommendedItems: [
      {
        id: 'rec-init-dock',
        productId: 'prod-dock',
        name: 'Docking Station',
        category: 'Hardware',
        type: 'CROSS_SELL',
        unitPrice: 18000,
        costPrice: 10000,
        discountPct: 15,
        reason: '76% co-purchase frequency with Laptop models • High hardware compatibility',
        score: 76,
        marginImpact: 5300,
        customerAccepted: false,
        addedByRep: true,
      },
      {
        id: 'rec-init-mouse',
        productId: 'prod-mouse',
        name: 'Mouse',
        category: 'Hardware',
        type: 'CROSS_SELL',
        unitPrice: 2500,
        costPrice: 1200,
        discountPct: 0,
        reason: '70% co-purchase frequency with quoted products • Strong stock availability (150 units)',
        score: 78,
        marginImpact: 1300,
        customerAccepted: false,
        addedByRep: true,
      },
    ],
  },
]

export const INITIAL_USERS: UserAccount[] = []
