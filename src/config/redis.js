const Redis = require("ioredis");
const env = require("./env");

const redis = new Redis(env.redisUrl, {
  maxRetriesPerRequest: 3,
  enableReadyCheck: true
});

redis.on("error", (err) => {
  console.error("Redis error:", err.message);
});

module.exports = redis;
