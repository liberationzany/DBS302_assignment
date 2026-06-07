const express = require("express");
const { requireAuth, requireRole } = require("../middleware/auth");
const { monthlyRevenue, productPurchaseAnalysis, lowStock } = require("../services/analytics.service");
const { getUniqueVisitors, redisInfo } = require("../services/redis.service");

const router = express.Router();

router.use(requireAuth, requireRole("administrator"));

router.get("/monthly-revenue", async (req, res, next) => {
  try {
    res.json(await monthlyRevenue());
  } catch (err) {
    next(err);
  }
});

router.get("/product-purchases", async (req, res, next) => {
  try {
    res.json(await productPurchaseAnalysis());
  } catch (err) {
    next(err);
  }
});

router.get("/low-stock", async (req, res, next) => {
  try {
    res.json(await lowStock());
  } catch (err) {
    next(err);
  }
});

router.get("/unique-visitors/:date", async (req, res, next) => {
  try {
    res.json({ date: req.params.date, estimate: await getUniqueVisitors(req.params.date) });
  } catch (err) {
    next(err);
  }
});

router.get("/redis-info", async (req, res, next) => {
  try {
    const info = await redisInfo();
    res.type("text/plain").send(info);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
