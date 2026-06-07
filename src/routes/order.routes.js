const express = require("express");
const env = require("../config/env");
const Order = require("../models/Order");
const { requireAuth } = require("../middleware/auth");
const rateLimit = require("../middleware/rateLimit");
const { getCart } = require("../services/redis.service");
const { placeOrder } = require("../services/order.service");

const router = express.Router();

router.post(
  "/",
  requireAuth,
  rateLimit({ name: "checkout", max: env.checkoutRateLimitMax, windowSeconds: 60 }),
  async (req, res, next) => {
    try {
      const cartItems = await getCart("user", req.user._id.toString());
      const order = await placeOrder({
        user: req.user,
        cartItems,
        shippingAddress: req.body.shippingAddress || req.user.addresses[0]
      });
      res.status(201).json(order);
    } catch (err) {
      next(err);
    }
  }
);

router.get("/", requireAuth, async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    next(err);
  }
});

router.patch("/:id/status", requireAuth, async (req, res, next) => {
  try {
    const order = await Order.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      {
        status: req.body.status,
        $push: { statusHistory: { status: req.body.status, note: req.body.note } }
      },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json(order);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
