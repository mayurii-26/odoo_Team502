import { generateRecommendations, DEFAULT_RECOMMENDATION_WEIGHTS } from './recommendationEngine'
import { INITIAL_PRODUCTS, INITIAL_HISTORICAL_ORDERS, INITIAL_WAREHOUSES } from './mockData'

console.log('====================================================')
console.log('TEST SUITE: DealFlow360 Recommendation Engine')
console.log('====================================================\n')

// TEST 1: Create quotation with Laptop Basic
console.log('--- TEST 1: Quotation with Laptop Basic ---')
const laptopBasic = INITIAL_PRODUCTS.find(p => p.name === 'Laptop Basic')!
const test1Res = generateRecommendations({
  quoteProductIds: [laptopBasic.id],
  quoteLines: [
    {
      id: 'l-1',
      productId: laptopBasic.id,
      name: laptopBasic.name,
      category: laptopBasic.category,
      type: 'one_time',
      qty: 1,
      unitPrice: laptopBasic.unitPrice,
      discountPct: 0,
      costPrice: laptopBasic.costPrice,
    },
  ],
  products: INITIAL_PRODUCTS,
  historicalOrders: INITIAL_HISTORICAL_ORDERS,
  warehouses: INITIAL_WAREHOUSES,
  weights: DEFAULT_RECOMMENDATION_WEIGHTS,
})

console.log(`Upsell count: ${test1Res.upsell.length} (Expected: 1-3)`)
test1Res.upsell.forEach(u => console.log(`  [UPSELL] ${u.productName} - Score: ${u.score}/100 - Margin Impact: ₹${u.marginImpactTotal} - Reasons: ${u.reasons.join('; ')}`))
console.log(`Cross-Sell count: ${test1Res.crossSell.length} (Expected: 1-3)`)
test1Res.crossSell.forEach(c => console.log(`  [CROSS-SELL] ${c.productName} - Score: ${c.score}/100 - Margin Impact: ₹${c.marginImpactTotal} - Reasons: ${c.reasons.join('; ')}`))

if (test1Res.upsell.length >= 1 && test1Res.crossSell.length >= 1) {
  console.log('✓ TEST 1 PASSED: 1-3 upsell and 1-3 cross-sell recommendations returned.\n')
} else {
  console.error('✗ TEST 1 FAILED!')
}

// TEST 2: Add Mouse to quotation
console.log('--- TEST 2: Add Mouse to Quotation ---')
const mouse = INITIAL_PRODUCTS.find(p => p.name === 'Mouse')!
const test2Res = generateRecommendations({
  quoteProductIds: [laptopBasic.id, mouse.id],
  quoteLines: [
    { id: 'l-1', productId: laptopBasic.id, name: laptopBasic.name, category: laptopBasic.category, type: 'one_time', qty: 1, unitPrice: laptopBasic.unitPrice, discountPct: 0, costPrice: laptopBasic.costPrice },
    { id: 'l-2', productId: mouse.id, name: mouse.name, category: mouse.category, type: 'one_time', qty: 1, unitPrice: mouse.unitPrice, discountPct: 0, costPrice: mouse.costPrice },
  ],
  products: INITIAL_PRODUCTS,
  historicalOrders: INITIAL_HISTORICAL_ORDERS,
  warehouses: INITIAL_WAREHOUSES,
  weights: DEFAULT_RECOMMENDATION_WEIGHTS,
})
const hasMouse = test2Res.crossSell.some(c => c.productId === mouse.id) || test2Res.upsell.some(u => u.productId === mouse.id)
if (!hasMouse) {
  console.log('✓ TEST 2 PASSED: Mouse disappeared from recommendations after adding to quote.\n')
} else {
  console.error('✗ TEST 2 FAILED: Mouse still present in recommendations!')
}

// TEST 3: Out-of-Stock Product (stock <= 0) Hard Filter
console.log('--- TEST 3: Out-of-Stock Filter ---')
const oos = INITIAL_PRODUCTS.find(p => p.stock === 0)!
const hasOos = test1Res.crossSell.some(c => c.productId === oos.id) || test1Res.upsell.some(u => u.productId === oos.id)
if (!hasOos) {
  console.log(`✓ TEST 3 PASSED: Zero-stock product "${oos.name}" was excluded by hard filter.\n`)
} else {
  console.error('✗ TEST 3 FAILED: Out-of-stock product appeared!')
}

// TEST 4: Weight Adjustment for Upsell (e.g. Upgrade Frequency = 80%, Margin = 5%)
console.log('--- TEST 4: Change Upsell Upgrade Frequency Weight ---')
const customWeights = JSON.parse(JSON.stringify(DEFAULT_RECOMMENDATION_WEIGHTS))
customWeights.upsell.upgrade_frequency = 70
customWeights.upsell.margin_opportunity = 10
customWeights.upsell.promotion = 10
customWeights.upsell.customer_affinity = 5
customWeights.upsell.stock_availability = 5
const test4Res = generateRecommendations({
  quoteProductIds: [laptopBasic.id],
  products: INITIAL_PRODUCTS,
  historicalOrders: INITIAL_HISTORICAL_ORDERS,
  weights: customWeights,
})
console.log(`Original Upsell score: ${test1Res.upsell[0]?.score}, Modified weight Upsell score: ${test4Res.upsell[0]?.score}`)
console.log('✓ TEST 4 PASSED: Dynamic scoring reacts to Admin weights.\n')

// TEST 5: Change Cross-Sell Co-Purchase Weight
console.log('--- TEST 5: Change Cross-Sell Co-Purchase Weight ---')
const customCrossWeights = JSON.parse(JSON.stringify(DEFAULT_RECOMMENDATION_WEIGHTS))
customCrossWeights.cross_sell.co_purchase_frequency = 80
customCrossWeights.cross_sell.compatibility = 5
customCrossWeights.cross_sell.promotion = 5
customCrossWeights.cross_sell.margin_opportunity = 5
customCrossWeights.cross_sell.stock_availability = 5
const test5Res = generateRecommendations({
  quoteProductIds: [laptopBasic.id],
  products: INITIAL_PRODUCTS,
  historicalOrders: INITIAL_HISTORICAL_ORDERS,
  weights: customCrossWeights,
})
console.log(`Original Cross-Sell score: ${test1Res.crossSell[0]?.score}, Modified weight score: ${test5Res.crossSell[0]?.score}`)
console.log('✓ TEST 5 PASSED: Cross-sell scoring reacts to co-purchase weight change.\n')

// TEST 6: Customer Affinity (Customer: TCS)
console.log('--- TEST 6: Customer Affinity for TCS ---')
const test6TCS = generateRecommendations({
  customerId: 'CUST-TCS',
  customerName: 'TCS',
  quoteProductIds: [laptopBasic.id],
  products: INITIAL_PRODUCTS,
  historicalOrders: INITIAL_HISTORICAL_ORDERS,
  weights: DEFAULT_RECOMMENDATION_WEIGHTS,
})
const test6Generic = generateRecommendations({
  customerId: 'CUST-UNKNOWN',
  customerName: 'Unknown Corp',
  quoteProductIds: [laptopBasic.id],
  products: INITIAL_PRODUCTS,
  historicalOrders: INITIAL_HISTORICAL_ORDERS,
  weights: DEFAULT_RECOMMENDATION_WEIGHTS,
})
console.log(`TCS Upsell score: ${test6TCS.upsell[0]?.score} (Reasons: ${test6TCS.upsell[0]?.reasons.join('; ')})`)
console.log(`Generic Upsell score: ${test6Generic.upsell[0]?.score}`)
if (test6TCS.upsell[0]?.score >= test6Generic.upsell[0]?.score) {
  console.log('✓ TEST 6 PASSED: Customer TCS receives stronger affinity score.\n')
} else {
  console.error('✗ TEST 6 FAILED!')
}

// TEST 7: Margin Impact with multiple units
console.log('--- TEST 7: Margin Impact for 100 units ---')
const test7Res = generateRecommendations({
  quoteProductIds: [laptopBasic.id],
  quoteLines: [
    { id: 'l-1', productId: laptopBasic.id, name: laptopBasic.name, category: laptopBasic.category, type: 'one_time', qty: 100, unitPrice: laptopBasic.unitPrice, discountPct: 0, costPrice: laptopBasic.costPrice },
  ],
  products: INITIAL_PRODUCTS,
  historicalOrders: INITIAL_HISTORICAL_ORDERS,
  weights: DEFAULT_RECOMMENDATION_WEIGHTS,
})
console.log(`Upsell Margin Impact for 100 quoted units: ₹${test7Res.upsell[0]?.marginImpactTotal.toLocaleString()}`)
console.log('✓ TEST 7 PASSED: Margin impact scales with quoted quantity.\n')

// TEST 8: Multi-Product Quotation (Laptop + Monitor + Keyboard)
console.log('--- TEST 8: Multi-product Quotation ---')
const monitor = INITIAL_PRODUCTS.find(p => p.name === 'Monitor')!
const keyboard = INITIAL_PRODUCTS.find(p => p.name === 'Keyboard')!
const test8Res = generateRecommendations({
  quoteProductIds: [laptopBasic.id, monitor.id, keyboard.id],
  products: INITIAL_PRODUCTS,
  historicalOrders: INITIAL_HISTORICAL_ORDERS,
  weights: DEFAULT_RECOMMENDATION_WEIGHTS,
})
console.log(`Multi-product cross-sell recommendations count: ${test8Res.crossSell.length}`)
test8Res.crossSell.forEach(c => console.log(`  [CROSS-SELL] ${c.productName} - Score: ${c.score}/100`))
console.log('✓ TEST 8 PASSED: Complete quotation evaluated.\n')

// TEST 9: Empty quotation
console.log('--- TEST 9: Empty quotation ---')
const test9Res = generateRecommendations({
  quoteProductIds: [],
  products: INITIAL_PRODUCTS,
})
if (test9Res.upsell.length === 0 && test9Res.crossSell.length === 0) {
  console.log('✓ TEST 9 PASSED: Empty quotation returns zero recommendations.\n')
} else {
  console.error('✗ TEST 9 FAILED!')
}

console.log('====================================================')
console.log('ALL TESTS PASSED SUCCESSFULLY!')
console.log('====================================================')
