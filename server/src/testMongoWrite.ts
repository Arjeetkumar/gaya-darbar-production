import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("❌ DATABASE_URL is missing");
  process.exit(1);
}

async function testMongoWrite() {
  try {
    console.log("🔄 Connecting to MongoDB Atlas...");

    await mongoose.connect(databaseUrl!)

    console.log("✅ Connected!");
    console.log("Database:", mongoose.connection.name);
    console.log("Host:", mongoose.connection.host);

    const db = mongoose.connection.db;

    if (!db) {
      throw new Error("MongoDB database handle is unavailable.");
    }

    console.log("🔄 Testing database ping...");

    await db.command({ ping: 1 });

    console.log("✅ Ping successful!");

    const collection = db.collection("_gaya_darbar_connection_test");

    console.log("🔄 Testing write operation...");

    await collection.insertOne({
      test: true,
      createdAt: new Date(),
    });

    console.log("✅ INSERT successful!");

    console.log("🔄 Testing delete operation...");

    await collection.deleteMany({ test: true });

    console.log("✅ DELETE successful!");

    await mongoose.disconnect();

    console.log("🎉 MongoDB READ + WRITE + DELETE test successful!");
  } catch (error) {
    console.error("❌ MongoDB operation test FAILED.");

    if (error instanceof Error) {
      console.error(error.message);
      console.error(error.stack);
    } else {
      console.error(error);
    }

    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  }
}

testMongoWrite();