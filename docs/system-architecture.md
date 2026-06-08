# System Architecture

```mermaid
flowchart TB
  User[User / Browser] --> Frontend[Frontend<br/>HTML, CSS, JavaScript]
  Frontend --> API[Express Backend API<br/>localhost:3000]

  API --> Auth[Authentication<br/>JWT, bcrypt]
  API --> Catalogue[Product Catalogue<br/>Search, filter, pagination]
  API --> Cart[Cart API]
  API --> Checkout[Order Checkout<br/>MongoDB transaction]
  API --> Reports[Analytics API]
  API --> Profile[Profile and Wishlist]
  API --> Reviews[Reviews API]

  Auth --> Mongo[(MongoDB Replica Set)]
  Catalogue --> Mongo
  Checkout --> Mongo
  Reports --> Mongo
  Profile --> Mongo
  Reviews --> Mongo

  Auth --> Redis[(Redis)]
  Catalogue --> Redis
  Cart --> Redis
  Checkout --> Redis

  Mongo --> M1[mongo1]
  Mongo --> M2[mongo2]
  Mongo --> M3[mongo3]

  Mongo --> Collections[MongoDB Collections<br/>users, categories, products,<br/>inventories, orders, reviews]

  Redis --> RedisFeatures[Redis Features<br/>product cache, sessions, carts,<br/>rate limits, leaderboards,<br/>recently viewed, HyperLogLog]

  MongoExpress[Mongo Express<br/>localhost:8081] --> Mongo
  RedisCommander[Redis Commander<br/>localhost:8082] --> Redis
```

## Explanation

The browser opens the frontend at `http://localhost:3000`. The frontend sends requests to the Express backend API.

MongoDB stores the permanent data:

- users
- categories
- products
- inventories
- orders
- reviews

Redis stores fast temporary data:

- product cache
- sessions
- carts
- rate limits
- trending products
- top sellers and buyers
- recently viewed products
- unique visitor estimates

Mongo Express is used to view MongoDB collections during the demo. Redis Commander is used to view Redis keys during the demo.
