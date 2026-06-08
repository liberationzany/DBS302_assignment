# System Architecture

Diagram files:

- Excalidraw: [diagrams/system-architecture.excalidraw](diagrams/system-architecture.excalidraw)
- PlantUML: [diagrams/system-architecture.puml](diagrams/system-architecture.puml)

```mermaid
flowchart TB
  subgraph Client["Client Layer"]
    User["User"]
    Browser["Browser Frontend<br/>HTML, CSS, JavaScript<br/>localhost:3000"]
    User --> Browser
  end

  subgraph App["Application Layer"]
    API["Express API Server<br/>Node.js<br/>localhost:3000"]
    Routes["API Routes<br/>auth, products, categories,<br/>cart, orders, users, reviews, analytics"]
    Middleware["Middleware<br/>JWT auth, RBAC, rate limiting,<br/>Helmet, request logging"]
    Services["Service Layer<br/>order transaction, Redis operations,<br/>analytics pipelines"]
    API --> Middleware
    Middleware --> Routes
    Routes --> Services
  end

  subgraph Data["Data Layer"]
    Mongo["MongoDB Replica Set<br/>rs0"]
    Mongo1["mongo1"]
    Mongo2["mongo2"]
    Mongo3["mongo3"]
    Collections["Collections<br/>users, categories, products,<br/>inventories, orders, reviews"]
    Redis["Redis<br/>password protected"]
    RedisData["Redis Data<br/>cache, sessions, carts,<br/>rate limits, leaderboards,<br/>recently viewed, HyperLogLog"]
    Mongo --> Mongo1
    Mongo --> Mongo2
    Mongo --> Mongo3
    Mongo --> Collections
    Redis --> RedisData
  end

  subgraph Tools["Database Inspection Tools"]
    MongoExpress["Mongo Express<br/>localhost:8081"]
    RedisCommander["Redis Commander<br/>localhost:8082"]
  end

  Browser --> API
  Services --> Mongo
  Services --> Redis
  MongoExpress --> Mongo
  RedisCommander --> Redis
```

## Explanation

The architecture is split into four clear parts: client layer, application layer, data layer, and database inspection tools.

The client layer is the browser-based frontend. It sends all requests to the Express API. It does not connect directly to MongoDB or Redis.

The application layer contains the Express backend. The backend is divided into routes, middleware, and services. Routes receive API requests, middleware handles authentication and security checks, and services contain the main business logic such as order placement, Redis caching, and analytics.

MongoDB stores the permanent data:

- users
- categories
- products
- inventories
- orders
- reviews

Redis stores fast temporary data and real-time data:

- product cache
- sessions
- carts
- rate limits
- trending products
- top sellers and buyers
- recently viewed products
- unique visitor estimates

Mongo Express is used to inspect MongoDB collections during the demo. Redis Commander is used to inspect Redis keys during the demo.

This design follows a layered client-server architecture with polyglot persistence. MongoDB is the main database, while Redis is used for speed and real-time features.
