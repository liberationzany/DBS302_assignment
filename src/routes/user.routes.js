const express = require("express");
const User = require("../models/User");
const Product = require("../models/Product");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.use(requireAuth);

function publicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    roles: user.roles,
    addresses: user.addresses,
    paymentPreferences: user.paymentPreferences,
    wishlist: user.wishlist,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
}

router.get("/me", async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate("wishlist", "name slug basePrice");
    res.json(publicUser(user));
  } catch (err) {
    next(err);
  }
});

router.patch("/me", async (req, res, next) => {
  try {
    const allowed = {};
    for (const field of ["name", "addresses", "paymentPreferences"]) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        allowed[field] = req.body[field];
      }
    }

    const user = await User.findByIdAndUpdate(req.user._id, allowed, {
      new: true,
      runValidators: true
    }).populate("wishlist", "name slug basePrice");
    res.json(publicUser(user));
  } catch (err) {
    next(err);
  }
});

router.get("/me/wishlist", async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate("wishlist", "name slug basePrice");
    res.json(user.wishlist);
  } catch (err) {
    next(err);
  }
});

router.put("/me/wishlist/:productId", async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.productId);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $addToSet: { wishlist: product._id } },
      { new: true }
    ).populate("wishlist", "name slug basePrice");
    res.json(user.wishlist);
  } catch (err) {
    next(err);
  }
});

router.delete("/me/wishlist/:productId", async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $pull: { wishlist: req.params.productId } },
      { new: true }
    ).populate("wishlist", "name slug basePrice");
    res.json(user.wishlist);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
