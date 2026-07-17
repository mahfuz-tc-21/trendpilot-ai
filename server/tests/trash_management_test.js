import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";
import Source from "../models/Source.js";
import Competitor from "../models/Competitor.js";
import ContentItem from "../models/ContentItem.js";
import CompetitorPost from "../models/CompetitorPost.js";
import dashboardService from "../services/dashboardService.js";
import trashController from "../controllers/trashController.js";

dotenv.config();

async function runTrashManagementTest() {
  console.log("=========================================");
  console.log("🗑️ Running Trash Management Tests");
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
    console.log("📡 Connected to Database for trash testing");

    // Clean up test data
    const email = "trash_tester@example.com";
    await User.deleteMany({ email });
    await ContentItem.deleteMany({ title: { $regex: "Trash Unit Test", $options: "i" } });
    await CompetitorPost.deleteMany({ title: { $regex: "Trash Unit Test", $options: "i" } });

    // 1. Setup Test User
    const user = new User({
      name: "Trash Tester",
      email,
      passwordHash: "dummyhash",
      language: "en"
    });
    await user.save();

    // 2. Setup Sources
    const source = new Source({
      userId: user._id,
      name: "Trash Test Source",
      type: "website",
      category: "technology",
      url: "https://trash-test.com"
    });
    await source.save();

    const competitor = new Competitor({
      userId: user._id,
      brandName: "Trash Test Competitor",
      name: "Trash Test Competitor",
      pageUrl: "https://fb.com/trash-test-comp",
      category: "Technology"
    });
    await competitor.save();

    // 3. Create items
    const item1 = new ContentItem({
      sourceId: source._id,
      userId: user._id,
      externalId: "trash-item-1",
      title: "Trash Unit Test - React Hooks Tutorial",
      url: "https://trash-test.com/hooks"
    });
    await item1.save();

    const competitorPost = new CompetitorPost({
      competitorId: competitor._id,
      userId: user._id,
      externalId: "trash-comp-post-1",
      title: "Trash Unit Test - Outperforming React Hooks",
      url: "https://fb.com/trash-test-comp/post-1",
      engagement: { likes: 100, comments: 20, shares: 10 }
    });
    await competitorPost.save();

    // Initial check: stats count includes items
    let stats = await dashboardService.getStats(user._id);
    assert(stats.kpis.totalContent === 1, "Initial stats count matches exactly 1 ContentItem");

    // 4. Move to Trash (Soft Delete)
    const mockReqMove = {
      user: { userId: user._id },
      body: { ids: [item1._id], type: "content" }
    };
    let mockRes = {
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data) {
        this.body = data;
        return this;
      }
    };

    await trashController.move(mockReqMove, mockRes, (err) => console.error(err));
    assert(mockRes.statusCode === 200, "Successfully moved ContentItem to trash (HTTP 200)");

    // Move competitor post to trash
    const mockReqMoveComp = {
      user: { userId: user._id },
      body: { ids: [competitorPost._id], type: "competitor" }
    };
    mockRes = {
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data) {
        this.body = data;
        return this;
      }
    };
    await trashController.move(mockReqMoveComp, mockRes, (err) => console.error(err));
    assert(mockRes.statusCode === 200, "Successfully moved CompetitorPost to trash (HTTP 200)");

    // 5. Verification: General stats and counts ignore trashed items
    stats = await dashboardService.getStats(user._id);
    assert(stats.kpis.totalContent === 0, "Stats count correctly ignored the trashed ContentItem");

    const activeContentIds = await ContentItem.find({ userId: user._id, isDeleted: { $ne: true } }).distinct("_id");
    assert(activeContentIds.length === 0, "activeContentIds list is empty after trash action");

    // 6. Verify Trash list lists them
    const mockReqList = {
      user: { userId: user._id },
      query: {}
    };
    mockRes = {
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data) {
        this.body = data;
        return this;
      }
    };
    await trashController.list(mockReqList, mockRes, (err) => console.error(err));
    assert(mockRes.statusCode === 200, "List trash endpoint works");
    assert(mockRes.body.data.length === 2, "List trash returns exactly 2 trashed items");

    // 7. Verify Cleanup suggestions (AI assisted mockup) finds duplicates
    const dupItem = new ContentItem({
      sourceId: source._id,
      userId: user._id,
      externalId: "trash-item-dup",
      title: "Duplicate Article Title Here",
      description: "This is a longer description with more than ten words to prevent short content classification.",
      rawText: "This is a longer raw text body with more than ten words to prevent short content classification.",
      url: "https://trash-test.com/dup1"
    });
    await dupItem.save();

    const dupItem2 = new ContentItem({
      sourceId: source._id,
      userId: user._id,
      externalId: "trash-item-dup-2",
      title: "Duplicate Article Title Here",
      description: "This is another longer description with more than ten words to prevent short content classification.",
      rawText: "This is another longer raw text body with more than ten words to prevent short content classification.",
      url: "https://trash-test.com/dup2"
    });
    await dupItem2.save();

    const mockReqSuggestions = {
      user: { userId: user._id }
    };
    mockRes = {
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data) {
        this.body = data;
        return this;
      }
    };
    await trashController.getCleanupSuggestions(mockReqSuggestions, mockRes, (err) => console.error(err));
    assert(mockRes.statusCode === 200, "Cleanup suggestions endpoint works");
    assert(
      mockRes.body.data.some(item => item.reason.includes("Duplicate title")),
      "AI cleanup suggestions successfully flagged duplicate titles"
    );

    // Clean up duplicates
    await ContentItem.deleteMany({ title: "Duplicate Article Title Here" });

    // 8. Restore from Trash
    const mockReqRestore = {
      user: { userId: user._id },
      body: { ids: [item1._id], type: "content" }
    };
    mockRes = {
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data) {
        this.body = data;
        return this;
      }
    };
    await trashController.restore(mockReqRestore, mockRes, (err) => console.error(err));
    assert(mockRes.statusCode === 200, "Successfully restored ContentItem from trash");

    // Verification: Stats count includes restored item again
    stats = await dashboardService.getStats(user._id);
    assert(stats.kpis.totalContent === 1, "Stats count correctly includes restored ContentItem again");

    // 9. Permanent deletion
    const mockReqDelete = {
      user: { userId: user._id },
      body: { ids: [item1._id], type: "content" }
    };
    mockRes = {
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data) {
        this.body = data;
        return this;
      }
    };
    await trashController.deletePermanently(mockReqDelete, mockRes, (err) => console.error(err));
    assert(mockRes.statusCode === 200, "Successfully deleted ContentItem permanently");

    const checkItem = await ContentItem.findById(item1._id);
    assert(checkItem === null, "ContentItem is permanently removed from MongoDB");

    // Clean up remaining test data
    await User.deleteMany({ email });
    await Source.deleteMany({ _id: source._id });
    await Competitor.deleteMany({ _id: competitor._id });
    await CompetitorPost.deleteMany({ _id: competitorPost._id });

    console.log(`=========================================`);
    console.log(`🏁 Trash Asserts Finished: ${passed} Passed, ${failed} Failed.`);
    console.log(`=========================================`);
    mongoose.connection.close();
  } catch (error) {
    console.error("❌ Exception occurred during test run:", error);
    mongoose.connection.close();
  }
}

runTrashManagementTest();
