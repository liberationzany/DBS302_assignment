# XYZ Shop Demo Script

Target length: 10-15 minutes

## 1. Introduction

Hello, my name is [your name]. This is my DBS302 assignment project, called XYZ Shop.

In this project, I built an e-commerce backend data layer using MongoDB and Redis. MongoDB is used as the main database for permanent data, and Redis is used for faster temporary data such as product cache, sessions, carts, rate limits, trending products, recently viewed products, and unique visitor counts.

The project also includes a simple frontend so I can demonstrate the main features clearly.

## 2. Project Structure

First, I will briefly show the project files.

In the project folder:

- `src/` contains the backend code.
- `src/models/` contains MongoDB models.
- `src/routes/` contains the API routes.
- `src/services/` contains Redis logic, analytics logic, and order transaction logic.
- `public/` contains the simple frontend.
- `scripts/seed.js` creates dummy data.
- `docker-compose.yml` starts MongoDB, Redis, the API, Mongo Express, and Redis Commander.
- `report.md` contains the technical report.
- `README.md` contains setup instructions, API documentation, screenshots, and validation steps.

## 3. Start The System

Now I will show that the system is running.

The Docker setup includes:

- Three MongoDB containers for a replica set
- One Redis container
- The API container
- Mongo Express for viewing MongoDB collections
- Redis Commander for viewing Redis keys

The frontend is available at:

```text
http://localhost:3000
```

I will open the application in the browser.

## 4. MongoDB Data Model

Next, I will show the MongoDB collections.

Open Mongo Express:

```text
http://localhost:8081
```

In the `xyz_shop` database, the six main collections are:

- `users`
- `categories`
- `products`
- `inventories`
- `orders`
- `reviews`

These collections cover the main e-commerce data.

The `products` collection stores product details and flexible attributes. The `inventories` collection stores stock separately because stock changes often. The `orders` collection stores order details and line item snapshots, so old orders still keep the correct price and product name from the time of purchase.

## 5. Login

Now I will demonstrate login.

I will login as a customer:

```text
customer1@xyzshop.test
Password123!
```

The backend checks the user, verifies the hashed password, and returns a JWT token. The frontend then uses that token for protected actions such as cart and order placement.

## 6. Product Browsing And Search

Now I will browse products.

The product list comes from MongoDB. The products support:

- category filtering
- text search
- sorting
- pagination
- flexible category attributes

I will click a product to open the product detail panel.

## 7. Redis Product Cache

This part shows Redis caching.

When I open a product for the first time, the frontend shows:

```text
Cache: miss
```

This means the product was not in Redis yet, so the API loaded it from MongoDB and then saved it into Redis.

Now I will click the same product again.

This time the frontend shows:

```text
Cache: hit
```

This means the product was served from Redis. This improves performance for frequently viewed products.

## 8. Cart With Redis

Now I will add the product to the cart.

The cart is stored in Redis using a hash. This is useful because cart data changes often and needs fast updates.

I will click:

```text
Add first variant to cart
```

Now the cart panel shows the product ID, variant SKU, and quantity.

## 9. Transactional Order Placement

Now I will place an order.

When I click:

```text
Place order
```

the backend reads the cart from Redis, checks the product and variant in MongoDB, decreases inventory, and creates the order.

This is done using a MongoDB transaction. The reason I used a transaction is that stock decrement and order creation must happen together. If there is not enough stock, the order should not be created.

After the order succeeds, the Redis cart is cleared and Redis leaderboards are updated.

## 10. Real-Time Redis Features

Now I will show the real-time panel.

Redis is used for:

- trending products
- recently viewed products
- buyer and seller leaderboards
- unique visitor estimation

The trending products use a Redis sorted set. Recently viewed products use a Redis list.

I will open Redis Commander:

```text
http://localhost:8082
```

Here we can see Redis keys such as:

- `cache:product`
- `session`
- `cart`
- `leaderboard`
- `recently_viewed`
- `rate`
- `hll:unique_visitors`

This shows that Redis is actively being used by the application.

## 11. Admin Analytics

Now I will logout and login as an administrator:

```text
admin@xyzshop.test
Password123!
```

Then I will scroll to Admin Analytics and click:

```text
Load analytics
```

This shows reports from MongoDB aggregation pipelines:

- monthly revenue
- low-stock products

The backend also includes product purchase analysis.

## 12. Extra API Coverage

The project also includes API routes for:

- category CRUD
- profile update
- wishlist management
- product reviews

These routes make the backend more complete and closer to the assignment requirements.

## 13. Security

For security, I implemented:

- bcrypt password hashing
- JWT login tokens
- role-based access control
- Helmet security middleware
- Redis password support in Docker Compose

For production, the report explains that MongoDB authentication, TLS, Redis ACLs, and stronger secret management should be added.

## 14. Smoke Tests

I also added smoke tests.

The file smoke test checks that important project files exist:

```bash
npm run test:smoke
```

The API smoke test checks:

- health endpoint
- login
- products
- cache hit and miss
- categories
- profile
- wishlist
- reviews
- Redis features
- analytics

```bash
npm run test:api
```

Both tests pass.

## 15. Conclusion

To conclude, this project demonstrates a MongoDB and Redis based e-commerce backend.

MongoDB stores the main business data, such as users, products, inventory, orders, categories, and reviews. Redis improves performance and supports real-time features such as cache, sessions, carts, trending products, rate limits, recently viewed products, and unique visitor counting.

The most important workflow is order placement, where I used a MongoDB transaction to keep stock updates and order creation safe.

Thank you.
