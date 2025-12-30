# Student Marketplace — Backend

Simple Express + MongoDB backend for the Student Marketplace frontend running at http://localhost:8080.

Quick start

1. Copy .env.example to .env and edit if needed (MONGO_URI, PORT).
2. Install dependencies:

```bash
cd /Users/Apple/Documents/student-marketplace-backend
npm install
```

3. Start in development mode (requires nodemon):

```bash
npm run dev
```

4. Health check: http://localhost:5000/api/health

API

- GET /api/health — returns { status: 'ok' }
- GET /api/products — list products
- POST /api/products — create product (json body: name, description, price)
- GET /api/products/:id — get product
- PUT /api/products/:id — update product
- DELETE /api/products/:id — delete product

Seed

 Seed sample data:
 ```bash
 # make sure MONGO_URI in .env is set/accessible, then:
 npm run seed
 ```

 Quick API test (automated)

 After the server is running (see start/dev above), you can run a simple automated test that exercises the health and product CRUD endpoints:

 ```bash
 # default target: http://localhost:5001
 npm run test-api

 # or point at a different base URL:
 TEST_BASE=http://localhost:5001 npm run test-api
 ```

 The script will create one product, update it, delete it, and print request/response payloads.
