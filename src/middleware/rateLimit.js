const { incrementRateLimit } = require("../services/redis.service");

function rateLimit({ name, max, windowSeconds }) {
  return async (req, res, next) => {
    const principal = req.user ? req.user._id.toString() : req.ip;
    const result = await incrementRateLimit(name, principal, windowSeconds);

    res.set("X-RateLimit-Limit", String(max));
    res.set("X-RateLimit-Remaining", String(Math.max(max - result.count, 0)));
    res.set("X-RateLimit-Reset", String(result.ttl));

    if (result.count > max) {
      return res.status(429).json({ error: "Too many requests" });
    }

    next();
  };
}

module.exports = rateLimit;
