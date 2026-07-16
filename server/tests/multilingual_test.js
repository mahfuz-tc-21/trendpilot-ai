import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";
import authService from "../services/authService.js";
import { getLanguageInstruction } from "../services/aiService.js";

// Load configurations
dotenv.config();

/**
 * Runs assertions on the multilingual content generation and user preferences updates.
 */
async function runMultilingualTest() {
  console.log("=========================================");
  console.log("🇧🇩/🇬🇧 Running Multilingual Support Asserts");
  console.log("=========================================");

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${message}`);
      failed++;
    }
  }

  try {
    // Establish connection
    await mongoose.connect(process.env.MONGO_URI);
    console.log("📡 Connected to Database for multilingual testing");

    // Clean up test user
    await User.deleteMany({ email: "multilingual@test.com" });

    // 1. Create a User and verify the default language is "bn"
    const testUser = new User({
      name: "Multilingual User",
      email: "multilingual@test.com",
      passwordHash: "dummyhash"
    });
    await testUser.save();

    assert(testUser.language === "bn", "User preference 'language' defaults to 'bn' (Bangla)");

    const userId = testUser._id.toString();

    // 2. Update user profile language to English ("en")
    const updated = await authService.updateUserProfile(userId, { language: "en" });
    assert(updated.language === "en", "User preference 'language' updates to 'en' successfully");

    // Verify it is persisted in database
    const dbUser = await User.findById(userId);
    assert(dbUser.language === "en", "Language preference 'en' correctly persisted in database");

    // 3. Test getLanguageInstruction helper function
    const bnInstruction = getLanguageInstruction("bn");
    const enInstruction = getLanguageInstruction("en");

    assert(
      bnInstruction.includes("Bangla") && bnInstruction.includes("natural, modern Bangla"),
      "Bangla getLanguageInstruction includes modern Bangla constraint directives"
    );
    assert(
      enInstruction.includes("English") && enInstruction.includes("fluent, professional English"),
      "English getLanguageInstruction includes professional English directives"
    );

    // Clean up test records
    await User.deleteMany({ email: "multilingual@test.com" });

    console.log("=========================================");
    console.log(`🏁 Multilingual Asserts Finished: ${passed} Passed, ${failed} Failed.`);
    console.log("=========================================");

    await mongoose.disconnect();

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (err) {
    console.error("❌ Multilingual test crashed:", err);
    await mongoose.disconnect();
    process.exit(1);
  }
}

runMultilingualTest();
