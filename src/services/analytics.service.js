const Order = require("../models/Order");
const Product = require("../models/Product");
const Inventory = require("../models/Inventory");

async function monthlyRevenue() {
  return Order.aggregate([
    { $match: { status: { $in: ["placed", "confirmed", "shipped", "delivered"] } } },
    {
      $group: {
        _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
        revenue: { $sum: "$total" },
        orders: { $sum: 1 }
      }
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } }
  ]);
}

async function productPurchaseAnalysis() {
  return Order.aggregate([
    { $unwind: "$lines" },
    {
      $group: {
        _id: "$lines.product",
        purchasedUnits: { $sum: "$lines.quantity" },
        revenue: { $sum: { $multiply: ["$lines.quantity", "$lines.unitPrice"] } }
      }
    },
    {
      $lookup: {
        from: Product.collection.name,
        localField: "_id",
        foreignField: "_id",
        as: "product"
      }
    },
    { $unwind: "$product" },
    {
      $project: {
        productId: "$_id",
        name: "$product.name",
        purchasedUnits: 1,
        revenue: 1
      }
    },
    { $sort: { purchasedUnits: -1 } },
    { $limit: 20 }
  ]);
}

async function lowStock() {
  return Inventory.aggregate([
    { $match: { $expr: { $lte: ["$quantityOnHand", "$reorderLevel"] } } },
    {
      $lookup: {
        from: Product.collection.name,
        localField: "product",
        foreignField: "_id",
        as: "product"
      }
    },
    { $unwind: "$product" },
    {
      $project: {
        product: "$product.name",
        variantSku: 1,
        warehouseCode: 1,
        quantityOnHand: 1,
        reorderLevel: 1
      }
    },
    { $sort: { quantityOnHand: 1 } }
  ]);
}

module.exports = { monthlyRevenue, productPurchaseAnalysis, lowStock };
