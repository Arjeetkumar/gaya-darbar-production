import mongoose from "mongoose";
import dotenv from "dotenv";
import { MenuItem } from "./models/MenuItem.js";
dotenv.config();
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
    console.error("❌ DATABASE_URL is missing");
    process.exit(1);
}
async function testMenuModel() {
    try {
        console.log("🔄 Connecting to MongoDB Atlas...");
        await mongoose.connect(databaseUrl, {
            serverSelectionTimeoutMS: 15000,
        });
        console.log("✅ Connected!");
        console.log("Database:", mongoose.connection.name);
        console.log("Host:", mongoose.connection.host);
        console.log("🔄 Testing MenuItem.countDocuments()...");
        const count = await MenuItem.countDocuments();
        console.log(`✅ MenuItem count successful: ${count}`);
        console.log("🔄 Testing MenuItem.deleteMany()...");
        const result = await MenuItem.deleteMany({});
        console.log(`✅ MenuItem.deleteMany() successful.`);
        console.log(`Deleted: ${result.deletedCount}`);
        await mongoose.disconnect();
        console.log("🎉 MenuItem model test successful!");
    }
    catch (error) {
        console.error("❌ MenuItem model test FAILED.");
        if (error instanceof Error) {
            console.error(error.message);
            console.error(error.stack);
        }
        else {
            console.error(error);
        }
        await mongoose.disconnect().catch(() => { });
        process.exit(1);
    }
}
testMenuModel();
