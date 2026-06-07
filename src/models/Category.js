const mongoose = require("mongoose");

const attributeDefinitionSchema = new mongoose.Schema(
  {
    key: { type: String, required: true },
    label: { type: String, required: true },
    type: { type: String, enum: ["string", "number", "boolean", "enum"], required: true },
    unit: String,
    allowedValues: [String],
    filterable: { type: Boolean, default: true }
  },
  { _id: false }
);

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    parent: { type: mongoose.Schema.Types.ObjectId, ref: "Category", default: null },
    attributeDefinitions: [attributeDefinitionSchema]
  },
  { timestamps: true }
);

categorySchema.index({ parent: 1, name: 1 });

module.exports = mongoose.model("Category", categorySchema);
