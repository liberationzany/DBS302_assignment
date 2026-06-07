const fs = require("fs");
const path = require("path");

const requiredFiles = [
  "src/models/User.js",
  "src/models/Product.js",
  "src/models/Order.js",
  "src/models/Inventory.js",
  "src/services/redis.service.js",
  "src/services/order.service.js",
  "src/routes/analytics.routes.js",
  "src/routes/category.routes.js",
  "src/routes/review.routes.js",
  "src/routes/user.routes.js",
  "public/index.html",
  "public/styles.css",
  "public/app.js",
  "README.md",
  "report.md"
];

for (const file of requiredFiles) {
  const absolute = path.join(process.cwd(), file);
  if (!fs.existsSync(absolute)) {
    throw new Error(`Missing required file: ${file}`);
  }
}

console.log("Smoke test passed: required project files exist.");
