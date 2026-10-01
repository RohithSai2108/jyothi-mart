// Exhaustive Role-Based & End-to-End Portal Verification Test
const API_URL = 'https://shop-price-manager.vercel.app/api/store';

async function testRolesAndPortals() {
  console.log('====================================================');
  console.log('🧪 TESTING 3-ROLE AUTHENTICATION & PORTAL PIPELINE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  // 1. Role Detection Tests
  console.log('--- 1. Testing Automatic Role Detection from Backend Auth ---');

  // A. Admin Role
  try {
    const adminRes = await fetch(`${API_URL}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '1234567890', otp: '1234' }),
    });
    const adminData = await adminRes.json();
    const adminRole = adminData.data?.user?.role;
    if (adminRole === 'admin') {
      console.log('  ✅ Admin phone (1234567890) -> Automatically detected role: "admin"');
      passed++;
    } else {
      console.error(`  ❌ Expected "admin", got "${adminRole}"`);
      failed++;
    }
  } catch (err) {
    console.error('  ❌ Admin role check failed:', err.message);
    failed++;
  }

  // B. Delivery Boy Role
  let deliveryToken = '';
  let deliveryUserId = '';
  try {
    const delivRes = await fetch(`${API_URL}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '9988776655', otp: '1234' }),
    });
    const delivData = await delivRes.json();
    const delivRole = delivData.data?.user?.role;
    deliveryToken = delivData.data?.token;
    deliveryUserId = delivData.data?.user?._id;

    if (delivRole === 'delivery' && deliveryToken) {
      console.log('  ✅ Delivery Partner phone (9988776655) -> Automatically detected role: "delivery"');
      passed++;
    } else {
      console.error(`  ❌ Expected "delivery", got "${delivRole}"`);
      failed++;
    }
  } catch (err) {
    console.error('  ❌ Delivery role check failed:', err.message);
    failed++;
  }

  // C. Customer Role
  try {
    const custRes = await fetch(`${API_URL}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '9123456780', otp: '1234' }),
    });
    const custData = await custRes.json();
    const custRole = custData.data?.user?.role;
    if (custRole === 'customer') {
      console.log('  ✅ Customer phone (9123456780) -> Automatically detected role: "customer"');
      passed++;
    } else {
      console.error(`  ❌ Expected "customer", got "${custRole}"`);
      failed++;
    }
  } catch (err) {
    console.error('  ❌ Customer role check failed:', err.message);
    failed++;
  }

  // 2. End-to-End Delivery Portal Connectivity
  console.log('\n--- 2. Testing End-to-End Delivery Portal Pipeline ---');

  const adminToken = 'mock-jwt-1234567890';
  let targetOrderId = '';

  // Step A: Admin gets orders and finds an order to assign
  try {
    const ordersRes = await fetch(`${API_URL}/admin/orders`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const ordersData = await ordersRes.json();
    const ordersList = ordersData.data || [];
    if (ordersList.length > 0) {
      targetOrderId = ordersList[0]._id;
      console.log(`  ✅ Admin retrieved ${ordersList.length} orders. Target Order ID: ${targetOrderId}`);
      passed++;
    } else {
      console.error('  ❌ No orders found in admin');
      failed++;
    }
  } catch (err) {
    console.error('  ❌ Failed to get admin orders:', err.message);
    failed++;
  }

  // Step B: Admin assigns order to Ramesh Kumar (Delivery Partner)
  if (targetOrderId && deliveryUserId) {
    try {
      const assignRes = await fetch(`${API_URL}/admin/orders/${targetOrderId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'out_for_delivery',
          assignedTo: deliveryUserId,
        }),
      });
      const assignData = await assignRes.json();
      if (assignData.success && assignData.data.status === 'out_for_delivery') {
        console.log(`  ✅ Admin assigned order ${targetOrderId} to delivery partner (${deliveryUserId})`);
        passed++;
      } else {
        console.error('  ❌ Admin failed to assign order:', assignData);
        failed++;
      }
    } catch (err) {
      console.error('  ❌ Assign error:', err.message);
      failed++;
    }

    // Step C: Delivery Partner queries their assigned orders
    try {
      const delivOrdersRes = await fetch(`${API_URL}/delivery/orders`, {
        headers: { Authorization: `Bearer ${deliveryToken}` },
      });
      const delivOrdersData = await delivOrdersRes.json();
      const myOrders = delivOrdersData.data || [];
      const hasTarget = myOrders.some((o) => o._id === targetOrderId);

      if (hasTarget) {
        console.log(`  ✅ Delivery Partner received assigned order ${targetOrderId} in /delivery/orders`);
        passed++;
      } else {
        console.error('  ❌ Order not found in delivery partner list:', myOrders.map((o) => o._id));
        failed++;
      }
    } catch (err) {
      console.error('  ❌ Delivery orders query error:', err.message);
      failed++;
    }

    // Step D: Delivery Partner marks order delivered with note
    try {
      const updateRes = await fetch(`${API_URL}/delivery/orders/${targetOrderId}/status`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${deliveryToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'delivered',
          note: 'Delivered successfully with OTP 1234',
        }),
      });
      const updateData = await updateRes.json();
      if (updateData.success && updateData.data.status === 'delivered') {
        console.log(`  ✅ Delivery Partner completed order ${targetOrderId} -> status: "delivered"`);
        passed++;
      } else {
        console.error('  ❌ Delivery partner update failed:', updateData);
        failed++;
      }
    } catch (err) {
      console.error('  ❌ Delivery status update error:', err.message);
      failed++;
    }
  }

  // 3. Admin Delivery Personnel Listing
  console.log('\n--- 3. Testing Delivery Personnel Roster in Admin ---');
  try {
    const dpRes = await fetch(`${API_URL}/admin/delivery-personnel`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const dpData = await dpRes.json();
    const dpList = dpData.data || [];
    const hasRamesh = dpList.some((d) => d.phone === '9988776655');

    if (hasRamesh) {
      console.log(`  ✅ Delivery Personnel roster active with partner: ${dpList[0].name} (${dpList[0].phone})`);
      passed++;
    } else {
      console.error('  ❌ Partner not found in delivery-personnel list:', dpList);
      failed++;
    }
  } catch (err) {
    console.error('  ❌ Delivery personnel query error:', err.message);
    failed++;
  }

  console.log('\n====================================================');
  console.log(`📊 FINAL RESULT: ${passed} PASSED | ${failed} FAILED`);
  console.log(`🎉 OVERALL HEALTH: ${failed === 0 ? '100% HEALTHY' : 'ISSUES DETECTED'}`);
  console.log('====================================================\n');

  if (failed > 0) process.exit(1);
}

testRolesAndPortals();
