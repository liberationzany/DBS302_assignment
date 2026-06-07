const express = require("express");
const { optionalAuth } = require("../middleware/auth");
const { upsertCartItem, removeCartItem, getCart, clearCart } = require("../services/redis.service");

const router = express.Router();

function owner(req) {
  if (req.user) {
    return { type: "user", id: req.user._id.toString() };
  }
  return { type: "guest", id: req.headers["x-cart-id"] || req.ip };
}

router.use(optionalAuth);

router.get("/", async (req, res, next) => {
  try {
    const current = owner(req);
    res.json(await getCart(current.type, current.id));
  } catch (err) {
    next(err);
  }
});

router.put("/items/:productId", async (req, res, next) => {
  try {
    const current = owner(req);
    await upsertCartItem(current.type, current.id, req.params.productId, {
      variantSku: req.body.variantSku,
      quantity: Number(req.body.quantity || 1),
      addedAt: new Date().toISOString()
    });
    res.json(await getCart(current.type, current.id));
  } catch (err) {
    next(err);
  }
});

router.delete("/items/:productId", async (req, res, next) => {
  try {
    const current = owner(req);
    await removeCartItem(current.type, current.id, req.params.productId);
    res.json(await getCart(current.type, current.id));
  } catch (err) {
    next(err);
  }
});

router.delete("/", async (req, res, next) => {
  try {
    const current = owner(req);
    await clearCart(current.type, current.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
