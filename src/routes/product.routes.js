const express = require("express");
const Product = require("../models/Product");
const Category = require("../models/Category");
const { requireAuth, optionalAuth, requireRole } = require("../middleware/auth");
const {
  getCachedProduct,
  invalidateProduct,
  trackProductView,
  getTrending,
  getRecentlyViewed
} = require("../services/redis.service");

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const page = Math.max(Number(req.query.page || 1), 1);
    const limit = Math.min(Math.max(Number(req.query.limit || 20), 1), 100);
    const filter = { status: "active" };

    if (req.query.category) {
      const category = await Category.findOne({ slug: req.query.category });
      if (category) filter.category = category._id;
    }

    if (req.query.minPrice || req.query.maxPrice) {
      filter.basePrice = {};
      if (req.query.minPrice) filter.basePrice.$gte = Number(req.query.minPrice);
      if (req.query.maxPrice) filter.basePrice.$lte = Number(req.query.maxPrice);
    }

    if (req.query.q) {
      filter.$text = { $search: req.query.q };
    }

    const sort = req.query.sort === "price" ? { basePrice: 1 } : { createdAt: -1 };
    const products = await Product.find(filter)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("category", "name slug");

    res.json({ page, limit, products });
  } catch (err) {
    next(err);
  }
});

router.post("/", requireAuth, requireRole("seller", "administrator"), async (req, res, next) => {
  try {
    const product = await Product.create({ ...req.body, seller: req.user._id });
    res.status(201).json(product);
  } catch (err) {
    next(err);
  }
});

router.get("/trending", async (req, res, next) => {
  try {
    const raw = await getTrending(Number(req.query.limit || 10));
    const rows = [];
    for (let i = 0; i < raw.length; i += 2) {
      rows.push({ productId: raw[i], score: Number(raw[i + 1]) });
    }
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.get("/recently-viewed", requireAuth, async (req, res, next) => {
  try {
    res.json(await getRecentlyViewed(req.user._id.toString()));
  } catch (err) {
    next(err);
  }
});

router.get("/:id", optionalAuth, async (req, res, next) => {
  try {
    const { value, cache } = await getCachedProduct(req.params.id, async () => {
      const product = await Product.findById(req.params.id).populate("category", "name slug").lean();
      return product;
    });

    if (!value) {
      return res.status(404).json({ error: "Product not found" });
    }

    const userId = req.user ? req.user._id.toString() : null;
    await trackProductView(req.params.id, userId, req.headers["x-visitor-id"] || req.ip);
    res.set("X-Cache", cache);
    res.json(value);
  } catch (err) {
    next(err);
  }
});

router.patch("/:id", requireAuth, requireRole("seller", "administrator"), async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    await invalidateProduct(req.params.id);
    res.json(product);
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", requireAuth, requireRole("administrator"), async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, { status: "archived" }, { new: true });
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    await invalidateProduct(req.params.id);
    res.json(product);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
