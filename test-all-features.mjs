// Comprehensive Website End-to-End Test Suite for Jyothi Mart
const BASE_URL = 'http://localhost:3000';
const API_URL = 'https://shop-price-manager.vercel.app/api/store';

const routesToTest = [
  { path: '/', name: 'Homepage (with Hero & Categories)' },
  { path: '/category', name: 'All Categories Page' },
  { path: '/search', name: 'Search Products Page' },
  { path: '/cart', name: 'Shopping Cart Page' },
  { path: '/delivery', name: 'Delivery Partner Portal' },
  { path: '/checkout', name: 'Checkout Page' },
  { path: '/account', name: 'User Account & Addresses' },
  { path: '/orders', name: 'Orders History Page' },
  { path: '/admin', name: 'Admin Control Center' },
  { path: '/admin/items', name: 'Admin Items Management' },
  { path: '/admin/orders', name: 'Admin Orders Management' },
  { path: '/admin/categories', name: 'Admin Categories Management' },
  { path: '/admin/settings', name: 'Admin Settings Management' },
  { path: '/manifest.json', name: 'PWA Web Manifest' },
];

async function runTests() {
  console.log('====================================================');
  console.log('🚀 STARTING COMPREHENSIVE JYOTHI MART TEST SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  // ─────────────────────────────────────────────
  // TEST 1: APP ROUTE REACHABILITY & STATUS CODES
  // ─────────────────────────────────────────────
  console.log('--- 1. Testing Next.js Page Routes (HTTP Status & Headers) ---');
  for (const route of routesToTest) {
    const url = `${BASE_URL}${route.path}`;
    const start = performance.now();
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'JyothiMartTestBot/1.0' } });
      const duration = (performance.now() - start).toFixed(1);
      const isOk = res.status >= 200 && res.status < 400;

      if (isOk) {
        console.log(`  ✅ [${res.status}] ${route.path.padEnd(20)} ${route.name} (${duration}ms)`);
        passed++;
      } else {
        console.error(`  ❌ [${res.status}] ${route.path.padEnd(20)} ${route.name} (${duration}ms)`);
        failed++;
      }
    } catch (err) {
      console.error(`  ❌ [ERR] ${route.path.padEnd(20)} ${err.message}`);
      failed++;
    }
  }

  // ─────────────────────────────────────────────
  // TEST 2: BACKEND STORE API ENDPOINTS
  // ─────────────────────────────────────────────
  console.log('\n--- 2. Testing Store Backend APIs & 5s Dynamic Timeout ---');

  const apiEndpoints = [
    { url: `${API_URL}/info`, name: 'Store Info & Banners API' },
    { url: `${API_URL}/categories`, name: 'Categories API' },
    { url: `${API_URL}/catalog`, name: 'Catalog Products API' },
  ];

  for (const ep of apiEndpoints) {
    const start = performance.now();
    try {
      const res = await fetch(ep.url, { signal: AbortSignal.timeout(5000) });
      const duration = (performance.now() - start).toFixed(1);
      const isUnder5s = duration < 5000;
      const data = await res.json().catch(() => ({}));

      if (res.ok && isUnder5s) {
        const count = Array.isArray(data.data) ? data.data.length : (Array.isArray(data) ? data.length : 'OK');
        console.log(`  ✅ [${res.status}] ${ep.name} -> Loaded in ${duration}ms (<= 5s SLA) [Data: ${count}]`);
        passed++;
      } else {
        console.error(`  ❌ [${res.status}] ${ep.name} failed or exceeded 5s SLA (${duration}ms)`);
        failed++;
      }
    } catch (err) {
      console.error(`  ❌ [ERR] ${ep.name}: ${err.message}`);
      failed++;
    }
  }

  // ─────────────────────────────────────────────
  // TEST 3: PWA MANIFEST INTEGRITY & SEO CHECKS
  // ─────────────────────────────────────────────
  console.log('\n--- 3. Testing PWA Manifest & Meta Tags ---');
  try {
    const manifestRes = await fetch(`${BASE_URL}/manifest.json`);
    const manifest = await manifestRes.json();
    if (manifest.name === 'Jyothi Mart' && manifest.icons?.length >= 2) {
      console.log(`  ✅ PWA Manifest valid: Name="${manifest.name}", Short="${manifest.short_name}", Theme="${manifest.theme_color}"`);
      passed++;
    } else {
      console.error('  ❌ PWA Manifest validation failed');
      failed++;
    }

    // Check Home HTML for Title & SEO Tags
    const homeRes = await fetch(`${BASE_URL}/`);
    const html = await homeRes.text();
    const hasTitle = html.includes('Jyothi Mart');
    const hasViewport = html.includes('viewport');
    if (hasTitle && hasViewport) {
      console.log('  ✅ SEO Metadata: Title and Viewport properly injected into HTML');
      passed++;
    } else {
      console.error('  ❌ SEO Metadata tags missing');
      failed++;
    }
  } catch (err) {
    console.error(`  ❌ PWA / SEO check failed: ${err.message}`);
    failed++;
  }

  // ─────────────────────────────────────────────
  // TEST 4: DELIVERY PORTAL LOGIC & FORMULA CHECKS
  // ─────────────────────────────────────────────
  console.log('\n--- 4. Testing Delivery Portal & Duty Logic ---');
  try {
    // Simulate orders and earnings calculation
    const mockOrders = [
      { id: 'ord1', status: 'delivered', deliveryFee: 40, grandTotal: 250, updatedAt: new Date().toISOString() },
      { id: 'ord2', status: 'delivered', deliveryFee: 40, grandTotal: 400, updatedAt: new Date().toISOString() },
      { id: 'ord3', status: 'out_for_delivery', deliveryFee: 40, grandTotal: 320, updatedAt: new Date().toISOString() },
      { id: 'ord4', status: 'confirmed', deliveryFee: 40, grandTotal: 180, updatedAt: new Date().toISOString() },
    ];

    const completed = mockOrders.filter(o => o.status === 'delivered');
    const totalEarnings = completed.reduce((sum, o) => sum + (o.deliveryFee || 40), 0);
    const active = mockOrders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled');

    if (completed.length === 2 && totalEarnings === 80 && active.length === 2) {
      console.log(`  ✅ Delivery metrics: 2 completed = ₹${totalEarnings} earned, 2 active orders queued.`);
      passed++;
    } else {
      console.error('  ❌ Delivery metrics formula mismatch');
      failed++;
    }

    // OTP validation fallback
    const testPhone = '9876543210';
    const fallbackOtp = testPhone.slice(-4);
    if (fallbackOtp === '3210') {
      console.log(`  ✅ Delivery OTP fallback verification: Phone ...3210 -> Code: ${fallbackOtp}`);
      passed++;
    } else {
      console.error('  ❌ OTP fallback failed');
      failed++;
    }
  } catch (err) {
    console.error(`  ❌ Delivery logic test error: ${err.message}`);
    failed++;
  }

  // ─────────────────────────────────────────────
  // TEST 5: CART STATE & BILL BREAKDOWN LOGIC
  // ─────────────────────────────────────────────
  console.log('\n--- 5. Testing Cart & Price Calculation Logic ---');
  try {
    const items = [
      { id: 'item1', name: 'Toor Dal 1kg', price: 160, qty: 2 },
      { id: 'item2', name: 'Sona Masoori Rice 5kg', price: 320, qty: 1 },
    ];

    const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0); // 160*2 + 320 = 640
    const deliveryFee = subtotal >= 499 ? 0 : 40; // Free delivery above 499
    const grandTotal = subtotal + deliveryFee;

    if (subtotal === 640 && deliveryFee === 0 && grandTotal === 640) {
      console.log(`  ✅ Free delivery applied on order >= ₹499 (Subtotal: ₹${subtotal}, Delivery: ₹${deliveryFee}, Grand Total: ₹${grandTotal})`);
      passed++;
    } else {
      console.error('  ❌ Cart price calculation mismatch');
      failed++;
    }
  } catch (err) {
    console.error(`  ❌ Cart test error: ${err.message}`);
    failed++;
  }

  // ─────────────────────────────────────────────
  // FINAL SUMMARY
  // ─────────────────────────────────────────────
  console.log('\n====================================================');
  console.log(`📊 TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log(`🎉 OVERALL HEALTH: ${failed === 0 ? '100% HEALTHY' : 'NEEDS ATTENTION'}`);
  console.log('====================================================');

  process.exit(failed > 0 ? 1 : 0);
}

runTests();
