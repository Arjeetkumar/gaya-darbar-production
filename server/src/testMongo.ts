import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("❌ DATABASE_URL is missing from server/.env");
  process.exit(1);
}

async function testMongoConnection() {
  try {
    console.log("🔄 Testing MongoDB Atlas connection...");
    console.log(
      "Target:",
      databaseUrl!.replace(/\/\/([^:]+):([^@]+)@/, "//***:***@")
    );

    await mongoose.connect(databaseUrl!, {
      serverSelectionTimeoutMS: 15000,
    });

    console.log("✅ MongoDB Atlas connection SUCCESSFUL!");
    console.log("Database:", mongoose.connection.name);
    console.log("Host:", mongoose.connection.host);
    console.log("Ready State:", mongoose.connection.readyState);

    // Simple database operation to verify actual access
    const collections = await mongoose.connection.db?.listCollections().toArray();

    console.log(
      `✅ Database is accessible. Collections found: ${collections?.length ?? 0}`
    );

    if (collections) {
      console.log(
        "Collections:",
        collections.map((collection) => collection.name)
      );
    }

    await mongoose.disconnect();

    console.log("🔌 MongoDB connection closed.");
    process.exit(0);
  } catch (error) {
    console.error("❌ MongoDB Atlas connection FAILED.");

    if (error instanceof Error) {
      console.error("Error:", error.message);
    } else {
      console.error(error);
    }

    await mongoose.disconnect().catch(() => {});

    process.exit(1);
  }
}

testMongoConnection();