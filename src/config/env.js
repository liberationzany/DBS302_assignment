require("dotenv").config();

module.exports = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 3000),
  mongoUri: process.env.MONGODB_URI || "mongodb://localhost:27017/xyz_shop",
  redisUrl: process.env.REDIS_URL || "redis://localhost:6379",
  redisPassword: process.env.REDIS_PASSWORD || "",
  jwtSecret: process.env.JWT_SECRET || "development-secret-change-me",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "2h",
  bcryptRounds: Number(process.env.BCRYPT_ROUNDS || 10),
  cacheProductTtlSeconds: Number(process.env.CACHE_PRODUCT_TTL_SECONDS || 300),
  sessionTtlSeconds: Number(process.env.SESSION_TTL_SECONDS || 86400),
  loginRateLimitMax: Number(process.env.RATE_LIMIT_LOGIN_MAX || 5),
  checkoutRateLimitMax: Number(process.env.RATE_LIMIT_CHECKOUT_MAX || 10)
};
