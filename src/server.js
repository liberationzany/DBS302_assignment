const app = require("./app");
const env = require("./config/env");
const { connectMongo } = require("./config/mongo");
const redis = require("./config/redis");

async function start() {
  await connectMongo();
  await redis.ping();

  app.listen(env.port, () => {
    console.log(`API listening on port ${env.port}`);
  });
}

start().catch((err) => {
  console.error("Failed to start API:", err);
  process.exit(1);
});
