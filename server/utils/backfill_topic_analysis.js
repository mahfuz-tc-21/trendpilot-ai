/**
 * Migration: Backfill topicAnalysis onto ContentItems from their existing Summary documents.
 * Run once: node utils/backfill_topic_analysis.js
 *
 * For items that already have a Summary with topics[], we create a best-effort topicAnalysis
 * by using the top topic as primaryTopic and the rest as secondaryTopics.
 * Items that already have topicAnalysis.primaryTopic set are skipped.
 */
import mongoose from "mongoose";
import dotenv from "dotenv";
import ContentItem from "../models/ContentItem.js";
import Summary from "../models/Summary.js";

dotenv.config();

const STOP_WORDS = new Set([
  "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
  "of", "with", "by", "from", "is", "are", "was", "were", "be", "been",
  "have", "has", "had", "do", "does", "did", "will", "would", "could",
  "should", "may", "might", "shall", "can", "this", "that", "these",
  "those", "it", "its", "not", "no", "so", "as", "up", "out", "if",
  "then", "than", "when", "how", "what", "who", "which", "where", "why",
  "facebook", "youtube", "linkedin", "twitter", "instagram", "blog",
  "website", "page", "post", "article", "video", "channel", "content",
  "january", "february", "march", "april", "may", "june", "july",
  "august", "september", "october", "november", "december"
]);

function isValidTopic(topic) {
  if (!topic || typeof topic !== "string") return false;
  const t = topic.trim();
  if (t.length < 3) return false;
  const lower = t.toLowerCase();
  if (STOP_WORDS.has(lower)) return false;
  // Must have at least one "real" word (not a stop word)
  const words = lower.split(/\s+/);
  if (words.length === 1 && words[0].length < 4) return false;
  return true;
}

async function backfillTopicAnalysis() {
  console.log("===========================================");
  console.log("🔄 Starting topicAnalysis Backfill Migration");
  console.log("===========================================");

  await mongoose.connect(process.env.MONGO_URI);
  console.log("📡 Connected to MongoDB");

  // Find all ContentItems that don't yet have a primaryTopic set
  const items = await ContentItem.find({
    $or: [
      { "topicAnalysis.primaryTopic": { $exists: false } },
      { "topicAnalysis.primaryTopic": "" },
      { "topicAnalysis.primaryTopic": null }
    ],
    processedStatus: "completed"
  }).select("_id title userId");

  console.log(`📦 Found ${items.length} ContentItems to backfill`);

  let updated = 0;
  let skipped = 0;

  for (const item of items) {
    const summary = await Summary.findOne({ contentId: item._id });

    if (!summary || !summary.topics || summary.topics.length === 0) {
      skipped++;
      continue;
    }

    const validTopics = summary.topics.filter(isValidTopic);
    if (validTopics.length === 0) {
      skipped++;
      continue;
    }

    const primaryTopic = validTopics[0];
    const secondaryTopics = validTopics.slice(1, 5); // max 4 secondary

    await ContentItem.updateOne(
      { _id: item._id },
      {
        $set: {
          "topicAnalysis.primaryTopic": primaryTopic,
          "topicAnalysis.secondaryTopics": secondaryTopics,
          "topicAnalysis.industry": summary.audience || "",
          "topicAnalysis.category": summary.difficulty || "",
          "topicAnalysis.confidence": Math.round((summary.confidenceScore || 0.7) * 100)
        }
      }
    );

    updated++;
    if (updated % 50 === 0) {
      console.log(`✅ Backfilled ${updated}/${items.length}...`);
    }
  }

  console.log("===========================================");
  console.log(`✅ Backfill complete: ${updated} updated, ${skipped} skipped (no summary or empty topics)`);
  console.log("===========================================");

  await mongoose.connection.close();
}

backfillTopicAnalysis().catch(err => {
  console.error("❌ Backfill migration failed:", err);
  mongoose.connection.close();
});
