const express = require("express");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const env = require("../config/env");
const User = require("../models/User");
const rateLimit = require("../middleware/rateLimit");
const { saveSession } = require("../services/redis.service");

const router = express.Router();

function signToken(user) {
  return jwt.sign({ sub: user._id.toString(), roles: user.roles }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn
  });
}

router.post("/register", async (req, res, next) => {
  try {
    const user = await User.register({ ...req.body, roles: ["customer"] });
    const token = signToken(user);
    const sessionId = crypto.randomUUID();

    await saveSession(sessionId, {
      userId: user._id.toString(),
      roles: user.roles,
      createdAt: new Date().toISOString()
    });

    res.status(201).json({ token, sessionId, user: { id: user._id, email: user.email, roles: user.roles } });
  } catch (err) {
    if (err.code === 11000) {
      err.status = 409;
      err.message = "Email already registered";
    }
    next(err);
  }
});

router.post(
  "/login",
  rateLimit({ name: "login", max: env.loginRateLimitMax, windowSeconds: 60 }),
  async (req, res, next) => {
    try {
      const user = await User.findOne({ email: req.body.email }).select("+passwordHash");
      if (!user || !(await user.verifyPassword(req.body.password))) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const token = signToken(user);
      const sessionId = crypto.randomUUID();

      await saveSession(sessionId, {
        userId: user._id.toString(),
        roles: user.roles,
        createdAt: new Date().toISOString()
      });

      res.json({ token, sessionId, user: { id: user._id, email: user.email, roles: user.roles } });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
