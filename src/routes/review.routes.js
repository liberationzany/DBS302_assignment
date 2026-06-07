const express = require("express");
const mongoose = require("mongoose");
const Review = require("../models/Review");
const Product = require("../models/Product");
const { requireAuth, requireRole } = require("../middleware/auth");
const { invalidateProduct } = require("../services/redis.service");

const router = express.Router();

async function refreshProductRating(productId) {
  const productObjectId = new mongoose.Types.ObjectId(productId);
  const [summary] = await Review.aggregate([
    { $match: { product: productObjectId, status: "published" } },
    {
      $group: {
        _id: "$product",
        ratingAverage: { $avg: "$rating" },
        ratingCount: { $sum: 1 }
      }
    }
  ]);

  await Product.findByIdAndUpdate(productId, {
    ratingAverage: summary ? Number(summary.ratingAverage.toFixed(2)) : 0,
    ratingCount: summary ? summary.ratingCount : 0
  });
  await invalidateProduct(productId.toString());
}

router.get("/products/:productId/reviews", async (req, res, next) => {
  try {
    const reviews = await Review.find({ product: req.params.productId, status: "published" })
      .sort({ createdAt: -1 })
      .populate("user", "name");
    res.json(reviews);
  } catch (err) {
    next(err);
  }
});

router.post("/products/:productId/reviews", requireAuth, async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.productId);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    const review = await Review.create({
      product: product._id,
      user: req.user._id,
      rating: req.body.rating,
      title: req.body.title,
      body: req.body.body
    });

    await refreshProductRating(product._id);
    res.status(201).json(review);
  } catch (err) {
    if (err.code === 11000) {
      err.status = 409;
      err.message = "You already reviewed this product";
    }
    next(err);
  }
});

router.patch("/reviews/:id", requireAuth, async (req, res, next) => {
  try {
    const filter = req.user.roles.includes("administrator")
      ? { _id: req.params.id }
      : { _id: req.params.id, user: req.user._id };
    const review = await Review.findOneAndUpdate(filter, req.body, { new: true, runValidators: true });

    if (!review) {
      return res.status(404).json({ error: "Review not found" });
    }

    await refreshProductRating(review.product);
    res.json(review);
  } catch (err) {
    next(err);
  }
});

router.delete("/reviews/:id", requireAuth, async (req, res, next) => {
  try {
    const filter = req.user.roles.includes("administrator")
      ? { _id: req.params.id }
      : { _id: req.params.id, user: req.user._id };
    const review = await Review.findOneAndDelete(filter);

    if (!review) {
      return res.status(404).json({ error: "Review not found" });
    }

    await refreshProductRating(review.product);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

router.get("/reviews", requireAuth, requireRole("administrator"), async (req, res, next) => {
  try {
    const reviews = await Review.find({})
      .sort({ createdAt: -1 })
      .limit(100)
      .populate("user", "name email")
      .populate("product", "name");
    res.json(reviews);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
