# XYZ Shop Data Layer

DBS302 assignment backend for a production-ready e-commerce data layer using MongoDB and Redis. The API demonstrates product catalogue queries, token authentication, Redis-backed carts and sessions, product caching, rate limiting, transactional order placement, real-time leaderboards, HyperLogLog visitor estimates, and MongoDB aggregation reports.

## Tech Stack

- Node.js 20, Express
- MongoDB 7 with Mongoose
- Redis 7 with ioredis
- Docker Compose for a 3-node MongoDB replica set, Redis, and API runtime
- JWT authentication and bcrypt password hashing

## Local Setup

1. Copy environment values:

```bash
cp .env.example .env
```

2. Start services:

```bash
docker compose up -d mongo1 mongo2 mongo3 mongo-init redis
```

3. Install dependencies and seed the database:

```bash
npm install
npm run seed
```

4. Start the API:

```bash
npm run dev
```

The API runs at `http://localhost:3000`.

The simple frontend is served by the same Express app:

```text
http://localhost:3000
```

Docker-only option:

```bash
docker compose up api
```

## Seed Accounts

All seeded users use password `Password123!`.

- Administrator: `admin@xyzshop.test`
- Seller: `seller@xyzshop.test`
- Customers: `customer1@xyzshop.test` through `customer8@xyzshop.test`

The seed script creates 10 users, 3 categories, 50 products, 100 inventory rows, and 20 orders.

## API Overview

Authentication:

- `POST /api/auth/register`
- `POST /api/auth/login`

Products:

- `GET /api/products?q=laptop&category=laptops&sort=price&page=1&limit=20`
- `GET /api/products/:id`
- `POST /api/products` with seller or administrator JWT
- `PATCH /api/products/:id` with seller or administrator JWT
- `DELETE /api/products/:id` with administrator JWT
- `GET /api/products/trending`
- `GET /api/products/recently-viewed` with JWT

Cart:

- `GET /api/cart`
- `PUT /api/cart/items/:productId`
- `DELETE /api/cart/items/:productId`
- `DELETE /api/cart`

Orders:

- `POST /api/orders`
- `GET /api/orders`
- `PATCH /api/orders/:id/status`

Analytics, administrator only:

- `GET /api/analytics/monthly-revenue`
- `GET /api/analytics/product-purchases`
- `GET /api/analytics/low-stock`
- `GET /api/analytics/unique-visitors/:date`
- `GET /api/analytics/redis-info`

## Demo Flow

1. Login as `customer1@xyzshop.test`.
2. Open `http://localhost:3000`, browse products, then open the same product detail twice.
3. Confirm `X-Cache: miss` on first detail request and `X-Cache: hit` on the second request.
4. Add the product to Redis cart with `PUT /api/cart/items/:productId`.
5. Place an order with `POST /api/orders`; MongoDB transaction decrements inventory and creates the order.
6. Check `GET /api/products/trending` and administrator analytics endpoints.

## MongoDB Features

Collections:

- `users`
- `categories`
- `products`
- `inventories`
- `orders`
- `reviews`

Indexes include:

- Unique user email index
- Unique product slug index
- Product compound index `{ category: 1, status: 1, basePrice: 1 }`
- Product text index on `name`, `description`, and `tags`
- Order history index `{ user: 1, createdAt: -1 }`
- Inventory uniqueness index `{ product: 1, variantSku: 1, warehouseCode: 1 }`

Advanced features:

- Multi-document transaction in `src/services/order.service.js`
- Aggregation pipelines in `src/services/analytics.service.js`
- Replica set in `docker-compose.yml`
- Sharding plan documented in `report.md`

## Redis Features

Redis key patterns:

- `cache:product:{id}` string cache with TTL
- `session:{id}` string session with TTL
- `cart:{ownerType}:{ownerId}` hash
- `leaderboard:trending_products` sorted set
- `leaderboard:top_sellers` sorted set
- `leaderboard:top_buyers` sorted set
- `recently_viewed:{userId}` list
- `rate:{name}:{principal}` counter string with expiry
- `hll:unique_visitors:{yyyy-mm-dd}` HyperLogLog

Redis persistence uses AOF every second plus RDB snapshots. The configured eviction policy is `allkeys-lru`.

## Validation

```bash
npm run test:smoke
```

For a fuller check, run Docker services, seed data, start the API, and exercise the demo flow with Postman or curl.
