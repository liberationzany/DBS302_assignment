const express = require("express");
const Category = require("../models/Category");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const categories = await Category.find({}).sort({ parent: 1, name: 1 }).populate("parent", "name slug");
    res.json(categories);
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id).populate("parent", "name slug");
    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }
    res.json(category);
  } catch (err) {
    next(err);
  }
});

router.post("/", requireAuth, requireRole("administrator"), async (req, res, next) => {
  try {
    const category = await Category.create(req.body);
    res.status(201).json(category);
  } catch (err) {
    if (err.code === 11000) {
      err.status = 409;
      err.message = "Category slug already exists";
    }
    next(err);
  }
});

router.patch("/:id", requireAuth, requireRole("administrator"), async (req, res, next) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }
    res.json(category);
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", requireAuth, requireRole("administrator"), async (req, res, next) => {
  try {
    const childCount = await Category.countDocuments({ parent: req.params.id });
    if (childCount > 0) {
      return res.status(409).json({ error: "Cannot delete category with child categories" });
    }

    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
