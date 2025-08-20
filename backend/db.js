// backend/db.js
const mongoose = require("mongoose");

async function connectToDB() {
  mongoose.set("strictQuery", false);
  mongoose.set("bufferCommands", false);
  mongoose.set("bufferTimeoutMS", 0);
  // ensure indexes while we’re debugging
  if (process.env.NODE_ENV !== "production") mongoose.set("autoIndex", true);

  const uri = process.env.MONGODB_URI;
  const dbName = process.env.DB_NAME || "newrun-db";   // <-- set to 'test' if that’s what you view in Atlas

  if (!uri) throw new Error("MONGODB_URI is not set in .env");

  await mongoose.connect(uri, {
    dbName,
    serverSelectionTimeoutMS: 8000,
    socketTimeoutMS: 15000,
    family: 4,
  });

  const { host, name } = mongoose.connection;
  console.log(`✅ Mongo connected: host=${host} db=${name}`); // <-- you should see db=test (or whatever you expect)
}

module.exports = { connectToDB };
