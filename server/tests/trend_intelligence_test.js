import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";
import Source from "../models/Source.js";
import ContentItem from "../models/ContentItem.js";
import Summary from "../models/Summary.js";
import Competitor from "../models/Competitor.js";
import CompetitorPost from "../models/CompetitorPost.js";
import dashboardService from "../services/dashboardService.js";

dotenv.config();

async function runTrendIntelligenceTest() {
  console.log("=========================================");
  console.log("📈 Running Trend Intelligence Asserts");
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
    await mongoose.connect(process.env.MONGO_URI);
    console.log("📡 Connected to Database for trends testing");

    // Clean up test records
    await User.deleteMany({ email: "trend_tester@example.com" });
    await ContentItem.deleteMany({ title: { $regex: "SaaS AI Test", $options: "i" } });
    await CompetitorPost.deleteMany({ title: { $regex: "SaaS AI Test", $options: "i" } });

    // 1. Setup Test User
    const user = new User({
      name: "Trend Tester",
      email: "trend_tester@example.com",
      passwordHash: "dummy",
      language: "en"
    });
    await user.save();

    // 2. Setup Source
    const source = new Source({
      userId: user._id,
      name: "Tech News Feed",
      type: "website",
      category: "technology",
      url: "https://example.com/tech"
    });
    await source.save();

    // 3. Setup ContentItem & Summary containing the target topic
    const item = new ContentItem({
      userId: user._id,
      sourceId: source._id,
      externalId: "item_trend_test",
      title: "Exploring the SaaS AI Test explosion",
      url: "https://example.com/saas-ai",
      rawText: "This post explores how SaaS AI Test is changing software."
    });
    await item.save();

    const summary = new Summary({
      userId: user._id,
      contentId: item._id,
      summary: "SaaS AI Test summary text",
      topics: ["SaaS AI Test", "Software"],
      keywords: ["saas", "artificial intelligence"]
    });
    await summary.save();

    // 4. Setup Competitor
    const competitor = new Competitor({
      userId: user._id,
      brandName: "Programming Hero",
      platform: "facebook",
      category: "technology",
      pageUrl: "https://www.facebook.com/programmingheroweb"
    });
    await competitor.save();

    // 5. Setup Competitor Post containing target topic
    const compPost = new CompetitorPost({
      userId: user._id,
      competitorId: competitor._id,
      externalId: "comp_post_trend_test",
      title: "Our take on SaaS AI Test",
      description: "How competitors use SaaS AI Test to scale.",
      url: "https://facebook.com/competitor/posts/991",
      postedAt: new Date(),
      engagement: { likes: 120, comments: 10, shares: 5 }
    });
    await compPost.save();

    // 6. Test computed trending topics list
    const topicsList = await dashboardService.getTrendingTopicsList(user._id);
    assert(topicsList.length > 0, "Successfully computed list of trending topics from MongoDB summaries");

    const targetTopic = topicsList.find(t => t.topic === "SaaS AI Test");
    assert(!!targetTopic, "Calculated list includes the topic 'SaaS AI Test'");
    if (targetTopic) {
      assert(targetTopic.articlesCount > 0, "Includes articles count for calculated topic");
      assert(targetTopic.trendScore >= 65, "Calculated trend score is in valid range");
    }

    // 7. Test trend detail panel AI analysis
    console.log("🤖 Querying Gemini for SaaS AI Test details...");
    const detail = await dashboardService.getTrendDetail(user._id, "SaaS AI Test");

    assert(!!detail, "Successfully retrieved trend detail from Gemini");
    if (detail) {
      assert(typeof detail.description === "string" && detail.description.length > 0, "Returned detailed trend description");
      assert(Array.isArray(detail.bestFormats) && detail.bestFormats.length > 0, "Returned recommended content formats list");
      assert(Array.isArray(detail.competitorIntelligence), "Returned competitor intelligence details list");
      assert(detail.contentLibrary.length > 0, "Returned real ContentItem database links mapping");
      assert(detail.contentLibrary[0].id.toString() === item._id.toString(), "Content library detail items mapped to real MongoDB Object IDs");
    }

    // 8. Test generate everything creator package
    console.log("🤖 Querying Gemini for complete creator package...");
    const pkg = await dashboardService.generateEverything(user._id, "SaaS AI Test");
    assert(!!pkg && typeof pkg.content === "string", "Successfully generated creator packages package");

    // 9. Test beat competitor strategy blueprint
    console.log("🤖 Querying Gemini for competitor beat strategy...");
    const strategy = await dashboardService.beatCompetitor(user._id, "Programming Hero", "SaaS AI Test");
    assert(!!strategy && strategy.includes("Programming Hero"), "Successfully generated competitor beat strategy blueprint");

    // Clean up
    await Source.deleteMany({ userId: user._id });
    await ContentItem.deleteMany({ userId: user._id });
    await CompetitorPost.deleteMany({ userId: user._id });
    await Competitor.deleteMany({ userId: user._id });
    await Summary.deleteMany({ userId: user._id });
    await User.deleteMany({ email: "trend_tester@example.com" });
    await mongoose.disconnect();

    console.log("=========================================");
    console.log(`🏁 Trend Asserts Finished: ${passed} Passed, ${failed} Failed.`);
    console.log("=========================================");

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (err) {
    console.error("❌ Trends test crashed:", err);
    await mongoose.disconnect();
    process.exit(1);
  }
}

runTrendIntelligenceTest();
