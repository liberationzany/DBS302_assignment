const jwt = require("jsonwebtoken");
const env = require("../config/env");
const User = require("../models/User");

async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const payload = jwt.verify(token, env.jwtSecret);
    const user = await User.findById(payload.sub);

    if (!user) {
      return res.status(401).json({ error: "Invalid token subject" });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

async function optionalAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) {
      return next();
    }

    const payload = jwt.verify(token, env.jwtSecret);
    req.user = await User.findById(payload.sub);
    return next();
  } catch (err) {
    return next();
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    const hasRole = req.user && req.user.roles.some((role) => roles.includes(role));
    if (!hasRole) {
      return res.status(403).json({ error: "Insufficient role" });
    }
    next();
  };
}

module.exports = { requireAuth, optionalAuth, requireRole };
