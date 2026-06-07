require("dotenv").config();

const { connectMongo, mongoose } = require("../src/config/mongo");
const redis = require("../src/config/redis");
const User = require("../src/models/User");
const Category = require("../src/models/Category");
const Product = require("../src/models/Product");
const Inventory = require("../src/models/Inventory");
const Order = require("../src/models/Order");
const Review = require("../src/models/Review");

const categories = [
  {
    name: "Laptops",
    slug: "laptops",
    attributeDefinitions: [
      { key: "ramGb", label: "RAM", type: "number", unit: "GB" },
      { key: "storageGb", label: "Storage", type: "number", unit: "GB" },
      { key: "processor", label: "Processor", type: "string" }
    ]
  },
  {
    name: "Clothing",
    slug: "clothing",
    attributeDefinitions: [
      { key: "fabric", label: "Fabric", type: "string" },
      { key: "gender", label: "Gender", type: "enum", allowedValues: ["men", "women", "unisex"] }
    ]
  },
  {
    name: "Home",
    slug: "home",
    attributeDefinitions: [
      { key: "material", label: "Material", type: "string" },
      { key: "warrantyYears", label: "Warranty", type: "number", unit: "years" }
    ]
  }
];

function slugify(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

async function reset() {
  await Promise.all([
    User.deleteMany({}),
    Category.deleteMany({}),
    Product.deleteMany({}),
    Inventory.deleteMany({}),
    Order.deleteMany({}),
    Review.deleteMany({})
  ]);
  await redis.flushdb();
}

async function seedUsers() {
  const users = [];
  users.push(
    await User.register({
      name: "Admin User",
      email: "admin@xyzshop.test",
      password: "Password123!",
      roles: ["administrator"]
    })
  );
  users.push(
    await User.register({
      name: "Seller User",
      email: "seller@xyzshop.test",
      password: "Password123!",
      roles: ["seller"]
    })
  );

  for (let i = 1; i <= 8; i += 1) {
    users.push(
      await User.register({
        name: `Customer ${i}`,
        email: `customer${i}@xyzshop.test`,
        password: "Password123!",
        roles: ["customer"]
      })
    );
  }

  await User.updateMany(
    {},
    {
      $set: {
        addresses: [
          {
            label: "Home",
            line1: "123 Market Street",
            city: "Thimphu",
            country: "Bhutan",
            postalCode: "11001"
          }
        ],
        paymentPreferences: [{ provider: "cod" }]
      }
    }
  );

  return User.find({});
}

async function seedProducts(categoryDocs, seller) {
  const products = [];
  const categoryBySlug = Object.fromEntries(categoryDocs.map((category) => [category.slug, category]));

  for (let i = 1; i <= 50; i += 1) {
    const category =
      i % 3 === 0 ? categoryBySlug.home : i % 3 === 1 ? categoryBySlug.laptops : categoryBySlug.clothing;
    const name = `${category.name.slice(0, -1)} Product ${i}`;
    const price = i % 3 === 1 ? 599 + i * 12 : i % 3 === 2 ? 24 + i : 45 + i * 3;
    const sku = `SKU-${String(i).padStart(3, "0")}`;

    const attributes =
      category.slug === "laptops"
        ? { ramGb: [8, 16, 32][i % 3], storageGb: [256, 512, 1024][i % 3], processor: "Ryzen" }
        : category.slug === "clothing"
          ? { fabric: ["cotton", "polyester", "wool"][i % 3], gender: ["men", "women", "unisex"][i % 3] }
          : { material: ["wood", "steel", "bamboo"][i % 3], warrantyYears: 1 + (i % 4) };

    const product = await Product.create({
      seller: seller._id,
      category: category._id,
      name,
      slug: `${slugify(name)}-${i}`,
      description: `Production sample ${name} with flexible category attributes and seeded inventory.`,
      tags: [category.slug, "sale", i % 2 === 0 ? "featured" : "new"],
      brand: ["Aster", "Northline", "Karma Goods"][i % 3],
      basePrice: price,
      attributes,
      variants: [
        { sku, size: "standard", color: ["black", "blue", "white"][i % 3], price },
        { sku: `${sku}-ALT`, size: "plus", color: ["red", "green", "grey"][i % 3], price: price + 10 }
      ]
    });

    await Inventory.create({
      product: product._id,
      variantSku: sku,
      warehouseCode: "WH-BTN-01",
      quantityOnHand: 20 + i,
      reorderLevel: 10
    });
    await Inventory.create({
      product: product._id,
      variantSku: `${sku}-ALT`,
      warehouseCode: "WH-BTN-01",
      quantityOnHand: 8 + i,
      reorderLevel: 10
    });

    products.push(product);
  }

  return products;
}

async function seedOrders(users, products) {
  const customers = users.filter((user) => user.roles.includes("customer"));

  for (let i = 1; i <= 20; i += 1) {
    const user = customers[i % customers.length];
    const product = products[i % products.length];
    const variant = product.variants[0];
    const quantity = 1 + (i % 3);
    const subtotal = variant.price * quantity;
    const tax = Number((subtotal * 0.08).toFixed(2));

    await Order.create({
      orderNumber: `SEED-${String(i).padStart(4, "0")}`,
      user: user._id,
      lines: [
        {
          product: product._id,
          variantSku: variant.sku,
          nameSnapshot: product.name,
          unitPrice: variant.price,
          quantity,
          seller: product.seller
        }
      ],
      status: i % 5 === 0 ? "delivered" : "placed",
      statusHistory: [{ status: "placed", note: "Seed order" }],
      subtotal,
      tax,
      total: Number((subtotal + tax).toFixed(2)),
      shippingAddress: user.addresses[0],
      paymentStatus: "captured",
      createdAt: new Date(Date.now() - i * 86400000)
    });
  }
}

async function main() {
  await connectMongo();
  await reset();

  const users = await seedUsers();
  const categoryDocs = await Category.insertMany(categories);
  const seller = users.find((user) => user.roles.includes("seller"));
  const products = await seedProducts(categoryDocs, seller);
  await seedOrders(users, products);

  console.log("Seed complete: 10 users, 3 categories, 50 products, 100 inventory rows, 20 orders.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
    redis.disconnect();
  });
