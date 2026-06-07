const mongoose = require("mongoose");

const variantSchema = new mongoose.Schema(
  {
    sku: { type: String, required: true },
    size: String,
    color: String,
    price: { type: Number, required: true, min: 0 },
    active: { type: Boolean, default: true }
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    seller: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, required: true },
    tags: [String],
    brand: String,
    basePrice: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "USD" },
    attributes: { type: Map, of: mongoose.Schema.Types.Mixed, default: {} },
    variants: [variantSchema],
    status: { type: String, enum: ["draft", "active", "archived"], default: "active" },
    ratingAverage: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 }
  },
  { timestamps: true }
);

productSchema.index({ category: 1, status: 1, basePrice: 1 });
productSchema.index({ seller: 1, createdAt: -1 });
productSchema.index({ name: "text", description: "text", tags: "text" });

module.exports = mongoose.model("Product", productSchema);
