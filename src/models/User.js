const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const env = require("../config/env");

const addressSchema = new mongoose.Schema(
  {
    label: String,
    line1: { type: String, required: true },
    line2: String,
    city: { type: String, required: true },
    region: String,
    postalCode: String,
    country: { type: String, required: true }
  },
  { _id: false }
);

const paymentPreferenceSchema = new mongoose.Schema(
  {
    provider: { type: String, enum: ["card", "paypal", "bank", "cod"], default: "cod" },
    tokenRef: String,
    last4: String
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    roles: {
      type: [String],
      enum: ["customer", "seller", "administrator"],
      default: ["customer"]
    },
    addresses: [addressSchema],
    paymentPreferences: [paymentPreferenceSchema],
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }]
  },
  { timestamps: true }
);

userSchema.index({ roles: 1 });

userSchema.statics.register = async function register({ name, email, password, roles }) {
  const passwordHash = await bcrypt.hash(password, env.bcryptRounds);
  return this.create({ name, email, passwordHash, roles });
};

userSchema.methods.verifyPassword = function verifyPassword(password) {
  return bcrypt.compare(password, this.passwordHash);
};

module.exports = mongoose.model("User", userSchema);
