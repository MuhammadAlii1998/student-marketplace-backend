// Simple endpoint tester using global fetch (Node 18+ / 24+)
// Usage: node src/test/endpointsTest.js [baseUrl]

const BASE = process.argv[2] || process.env.TEST_BASE || 'http://localhost:5001';

function log(title, data){
  console.log('\n=== ' + title + ' ===');
  if (typeof data === 'object') console.log(JSON.stringify(data, null, 2));
  else console.log(data);
}

async function run() {
  try {
    // Health
    const healthRes = await fetch(`${BASE}/api/health`);
    const health = await healthRes.json();
    log('Health', { status: healthRes.status, body: health });

    // List products
    const listRes = await fetch(`${BASE}/api/products`);
    const list = await listRes.json();
    log('Products (before)', list);

    // Create product
    const newProduct = { name: 'Test Item', description: 'Created by test script', price: 9.99 };
    const createRes = await fetch(`${BASE}/api/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newProduct)
    });
    const created = await createRes.json();
    log('Created', created);

    // Get by id
    const id = created._id;
    const getRes = await fetch(`${BASE}/api/products/${id}`);
    const got = await getRes.json();
    log('Get by id', got);

    // Update
    const upd = { name: 'Test Item (updated)', description: 'Updated by test', price: 12.5 };
    const putRes = await fetch(`${BASE}/api/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(upd)
    });
    const updated = await putRes.json();
    log('Updated', updated);

    // Delete
    const delRes = await fetch(`${BASE}/api/products/${id}`, { method: 'DELETE' });
    const delBody = await delRes.json();
    log('Deleted', delBody);

    // Final list
    const finalListRes = await fetch(`${BASE}/api/products`);
    const finalList = await finalListRes.json();
    log('Products (after)', finalList);

    console.log('\nAPI test completed successfully');
    process.exit(0);
  } catch (err) {
    console.error('API test failed:', err);
    process.exit(2);
  }
}

run();
