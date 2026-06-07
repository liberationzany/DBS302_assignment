const mongoose = require("mongoose");
const env = require("./env");

async function connectMongo() {
  mongoose.set("strictQuery", true);
  await mongoose.connect(env.mongoUri, {
    serverSelectionTimeoutMS: 10000
  });
}

module.exports = { connectMongo, mongoose };
