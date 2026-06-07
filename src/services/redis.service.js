const redis = require("../config/redis");
const env = require("../config/env");

const keys = {
  product: (id) => `cache:product:${id}`,
  session: (id) => `session:${id}`,
  cart: (ownerType, ownerId) => `cart:${ownerType}:${ownerId}`,
  recentlyViewed: (userId) => `recently_viewed:${userId}`,
  trending: "leaderboard:trending_products",
  topSellers: "leaderboard:top_sellers",
  topBuyers: "leaderboard:top_buyers",
  rateLimit: (name, principal) => `rate:${name}:${principal}`,
  uniqueVisitors: (date) => `hll:unique_visitors:${date}`,
  stampedeLock: (id) => `lock:product:${id}`
};

async function getJson(key) {
  const raw = await redis.get(key);
  return raw ? JSON.parse(raw) : null;
}

async function setJson(key, value, ttlSeconds) {
  await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
}

async function getCachedProduct(id, loader) {
  const key = keys.product(id);
  const cached = await getJson(key);
  if (cached) {
    return { value: cached, cache: "hit" };
  }

  const lockKey = keys.stampedeLock(id);
  const lock = await redis.set(lockKey, "1", "NX", "EX", 5);
  const value = await loader();

  if (value && lock) {
    const jitter = Math.floor(Math.random() * 30);
    await setJson(key, value, env.cacheProductTtlSeconds + jitter);
    await redis.del(lockKey);
  }

  return { value, cache: "miss" };
}

async function invalidateProduct(id) {
  await redis.del(keys.product(id));
}

async function saveSession(sessionId, payload) {
  await setJson(keys.session(sessionId), payload, env.sessionTtlSeconds);
}

async function getSession(sessionId) {
  return getJson(keys.session(sessionId));
}

async function upsertCartItem(ownerType, ownerId, productId, item) {
  const key = keys.cart(ownerType, ownerId);
  await redis.hset(key, productId, JSON.stringify(item));
  await redis.expire(key, env.sessionTtlSeconds);
}

async function removeCartItem(ownerType, ownerId, productId) {
  await redis.hdel(keys.cart(ownerType, ownerId), productId);
}

async function getCart(ownerType, ownerId) {
  const rows = await redis.hgetall(keys.cart(ownerType, ownerId));
  return Object.entries(rows).map(([productId, value]) => ({
    productId,
    ...JSON.parse(value)
  }));
}

async function clearCart(ownerType, ownerId) {
  await redis.del(keys.cart(ownerType, ownerId));
}

async function trackProductView(productId, userId, visitorId) {
  const today = new Date().toISOString().slice(0, 10);
  const pipeline = redis.pipeline();
  pipeline.zincrby(keys.trending, 1, productId);
  pipeline.pfadd(keys.uniqueVisitors(today), visitorId || userId || "anonymous");

  if (userId) {
    pipeline.lrem(keys.recentlyViewed(userId), 0, productId);
    pipeline.lpush(keys.recentlyViewed(userId), productId);
    pipeline.ltrim(keys.recentlyViewed(userId), 0, 9);
  }

  await pipeline.exec();
}

async function getTrending(limit = 10) {
  return redis.zrevrange(keys.trending, 0, limit - 1, "WITHSCORES");
}

async function getRecentlyViewed(userId) {
  return redis.lrange(keys.recentlyViewed(userId), 0, 9);
}

async function recordOrderLeaderboards(userId, order) {
  const pipeline = redis.pipeline();
  pipeline.zincrby(keys.topBuyers, order.total, userId.toString());

  for (const line of order.lines) {
    pipeline.zincrby(keys.topSellers, line.quantity, line.seller.toString());
  }

  await pipeline.exec();
}

async function incrementRateLimit(name, principal, windowSeconds) {
  const key = keys.rateLimit(name, principal);
  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, windowSeconds);
  }
  const ttl = await redis.ttl(key);
  return { count, ttl };
}

async function getUniqueVisitors(date) {
  return redis.pfcount(keys.uniqueVisitors(date));
}

async function redisInfo() {
  return redis.info();
}

module.exports = {
  keys,
  getCachedProduct,
  invalidateProduct,
  saveSession,
  getSession,
  upsertCartItem,
  removeCartItem,
  getCart,
  clearCart,
  trackProductView,
  getTrending,
  getRecentlyViewed,
  recordOrderLeaderboards,
  incrementRateLimit,
  getUniqueVisitors,
  redisInfo
};
