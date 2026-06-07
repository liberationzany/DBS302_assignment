const mongoose = require("mongoose");

const inventorySchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    variantSku: { type: String, required: true },
    warehouseCode: { type: String, required: true },
    quantityOnHand: { type: Number, required: true, min: 0 },
    reserved: { type: Number, default: 0, min: 0 },
    reorderLevel: { type: Number, default: 10, min: 0 }
  },
  { timestamps: true }
);

inventorySchema.index({ product: 1, variantSku: 1, warehouseCode: 1 }, { unique: true });
inventorySchema.index({ quantityOnHand: 1, reorderLevel: 1 });

module.exports = mongoose.model("Inventory", inventorySchema);
