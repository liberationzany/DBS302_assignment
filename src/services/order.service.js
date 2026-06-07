const crypto = require("crypto");
const { mongoose } = require("../config/mongo");
const Product = require("../models/Product");
const Inventory = require("../models/Inventory");
const Order = require("../models/Order");
const { clearCart, recordOrderLeaderboards } = require("./redis.service");

async function placeOrder({ user, cartItems, shippingAddress }) {
  if (!cartItems.length) {
    const err = new Error("Cart is empty");
    err.status = 400;
    throw err;
  }

  const session = await mongoose.startSession();

  try {
    let createdOrder;

    await session.withTransaction(async () => {
      const lines = [];

      for (const item of cartItems) {
        const product = await Product.findById(item.productId).session(session);
        if (!product || product.status !== "active") {
          throw Object.assign(new Error(`Product unavailable: ${item.productId}`), { status: 409 });
        }

        const variant = product.variants.find((row) => row.sku === item.variantSku);
        if (!variant || !variant.active) {
          throw Object.assign(new Error(`Variant unavailable: ${item.variantSku}`), { status: 409 });
        }

        const inventory = await Inventory.findOneAndUpdate(
          {
            product: product._id,
            variantSku: item.variantSku,
            quantityOnHand: { $gte: item.quantity }
          },
          { $inc: { quantityOnHand: -item.quantity, reserved: item.quantity } },
          { new: true, session }
        );

        if (!inventory) {
          throw Object.assign(new Error(`Insufficient stock for ${product.name}`), { status: 409 });
        }

        lines.push({
          product: product._id,
          variantSku: item.variantSku,
          nameSnapshot: product.name,
          unitPrice: variant.price,
          quantity: item.quantity,
          seller: product.seller
        });
      }

      const subtotal = lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
      const tax = Number((subtotal * 0.08).toFixed(2));
      const total = Number((subtotal + tax).toFixed(2));
      const orderNumber = `ORD-${Date.now()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;

      const [order] = await Order.create(
        [
          {
            orderNumber,
            user: user._id,
            lines,
            subtotal,
            tax,
            total,
            shippingAddress,
            statusHistory: [{ status: "placed", note: "Order placed transactionally" }]
          }
        ],
        { session }
      );

      createdOrder = order;
    });

    await clearCart("user", user._id.toString());
    await recordOrderLeaderboards(user._id, createdOrder);
    return createdOrder;
  } finally {
    await session.endSession();
  }
}

module.exports = { placeOrder };
