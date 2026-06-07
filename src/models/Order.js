const mongoose = require("mongoose");

const orderLineSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    variantSku: { type: String, required: true },
    nameSnapshot: { type: String, required: true },
    unitPrice: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
  },
  { _id: false }
);

const statusEventSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ["placed", "confirmed", "shipped", "delivered", "cancelled", "returned"],
      required: true
    },
    at: { type: Date, default: Date.now },
    note: String
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    lines: [orderLineSchema],
    status: {
      type: String,
      enum: ["placed", "confirmed", "shipped", "delivered", "cancelled", "returned"],
      default: "placed"
    },
    statusHistory: [statusEventSchema],
    subtotal: { type: Number, required: true, min: 0 },
    tax: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    shippingAddress: { type: Object, required: true },
    paymentStatus: { type: String, enum: ["pending", "authorized", "captured", "failed"], default: "authorized" }
  },
  { timestamps: true }
);

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ "lines.seller": 1, createdAt: -1 });

module.exports = mongoose.model("Order", orderSchema);
