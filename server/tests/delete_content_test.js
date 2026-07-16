import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";
import Source from "../models/Source.js";
import ContentItem from "../models/ContentItem.js";
import Summary from "../models/Summary.js";
import Recommendation from "../models/Recommendation.js";
import contentController from "../controllers/contentController.js";

dotenv.config();

async function runDeleteContentTest() {
  console.log("=========================================");
  console.log("🗑️ Running Content Item Purge & Delete Asserts");
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
    console.log("📡 Connected to Database for delete testing");

    // Clean up test records
    await User.deleteMany({ email: { $in: ["userA@delete.com", "userB@delete.com"] } });

    // 1. Setup User A and User B
    const userA = new User({ name: "User A", email: "userA@delete.com", passwordHash: "h" });
    await userA.save();
    const userB = new User({ name: "User B", email: "userB@delete.com", passwordHash: "h" });
    await userB.save();

    // 2. Setup Source with required category field
    const sourceA = new Source({
      userId: userA._id,
      name: "Test Source",
      type: "website",
      category: "general",
      url: "https://example.com/source"
    });
    await sourceA.save();

    // 3. Setup User A's ContentItem, Summary, and Recommendation
    const itemA = new ContentItem({
      userId: userA._id,
      sourceId: sourceA._id,
      externalId: "item_a_test",
      title: "Title A",
      url: "https://example.com/a"
    });
    await itemA.save();

    const summaryA = new Summary({
      userId: userA._id,
      contentId: itemA._id,
      summary: "Summary A text",
      topics: [],
      keywords: []
    });
    await summaryA.save();

    const recA = new Recommendation({
      userId: userA._id,
      contentId: itemA._id,
      recommendationData: {}
    });
    await recA.save();

    // 4. Test multi-tenant ownership: User B trying to delete User A's item
    let req = {
      user: { userId: userB._id.toString() },
      params: { id: itemA._id.toString() }
    };
    let res = {
      status: (code) => {
        assert(code === 403, "Attempt to delete another user's content returns 403 Forbidden");
        return {
          json: (data) => {}
        };
      }
    };
    let next = (err) => {
      if (err) {
        assert(err.status === 403, `Caught expected error with status: ${err.status}`);
      }
    };

    await contentController.deleteItem(req, res, next);

    // 5. Test actual deletion by owner (User A)
    req = {
      user: { userId: userA._id.toString() },
      params: { id: itemA._id.toString() }
    };
    res = {
      status: (code) => {
        assert(code === 200, "Successful deletion returns 200 OK status code");
        return {
          json: (data) => {
            assert(data.success === true, "Response payload indicates success is true");
          }
        };
      }
    };
    next = (err) => {
      if (err) {
        console.error("Unexpected error in delete:", err);
      }
    };

    await contentController.deleteItem(req, res, next);

    // 6. Verify database purges (cascading deletes)
    const checkItem = await ContentItem.findById(itemA._id);
    const checkSummary = await Summary.findOne({ contentId: itemA._id });
    const checkRec = await Recommendation.findOne({ contentId: itemA._id });

    assert(!checkItem, "ContentItem successfully removed from database");
    assert(!checkSummary, "Associated Summary successfully purged from database");
    assert(!checkRec, "Associated Recommendation successfully purged from database");

    // Clean up
    await Source.deleteMany({ userId: userA._id });
    await User.deleteMany({ email: { $in: ["userA@delete.com", "userB@delete.com"] } });
    await mongoose.disconnect();

    console.log("=========================================");
    console.log(`🏁 Delete Asserts Finished: ${passed} Passed, ${failed} Failed.`);
    console.log("=========================================");
    
    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (err) {
    console.error("❌ Delete test crashed:", err);
    await mongoose.disconnect();
    process.exit(1);
  }
}

runDeleteContentTest();
