import ContentItem from "../models/ContentItem.js";
import Job from "../models/Job.js";
import Source from "../models/Source.js";
import { normalizeUrl } from "../utils/urlNormalizer.js";
import facebookCrawler from "./facebookCrawler.js";

class FacebookService {
  /**
   * Extract page identifier from Facebook Page URL
   * @param {string} url - Facebook Page URL
   * @returns {string} Page identifier
   */
  parsePageUrl(url) {
    try {
      const parsed = new URL(url.trim());
      const pathParts = parsed.pathname.split("/").filter(Boolean);
      if (pathParts.length > 0) {
        const first = pathParts[0];
        if (first === "pages" && pathParts.length >= 2) {
          return pathParts[1];
        }
        return first;
      }
    } catch {
      // Fallback if URL parsing fails
    }
    const match = url.trim().match(/facebook\.com\/([a-zA-Z0-9._-]+)/);
    if (match) return match[1];
    return url.trim();
  }

  /**
   * Main crawl orchestrator for Facebook Pages, wrapping execution in a Job transaction.
   * @param {string} sourceId - MongoDB Source reference ID
   * @param {string} pageUrl - Monitored Facebook Page URL
   * @returns {Promise<Array>} List of saved ContentItems
   */
  async crawlPage(sourceId, pageUrl) {
    console.log(`📡 Starting Facebook Page crawl workflow for: ${pageUrl}`);

    const source = await Source.findById(sourceId);
    if (!source) throw new Error(`Source not found: ${sourceId}`);
    const userId = source.userId;

    const job = new Job({
      sourceId,
      userId,
      status: "running",
      startedAt: new Date()
    });
    await job.save();

    try {
      const pageId = this.parsePageUrl(pageUrl);
      if (!pageId) {
        throw new Error("Could not extract Facebook page identifier from URL");
      }

      // Format page name nicely for author field (e.g. programmingHero -> Programming Hero)
      const pageName = pageId
         .split(/[._-]/)
         .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
         .join(" ");

      // Retrieve real posts using Playwright crawler with exponential backoff retries
      const realPosts = await facebookCrawler.scrapeFacebookPageWithRetry(pageUrl);

      const savedItems = [];
      for (const post of realPosts) {
        const normalizedUrl = normalizeUrl(post.postUrl);

        const exists = await ContentItem.findOne({ externalId: normalizedUrl });
        if (exists) {
          console.log(`⏭️ Skipping duplicate Facebook post: ${normalizedUrl}`);
          continue;
        }

        const contentItem = new ContentItem({
          sourceId,
          userId,
          externalId: normalizedUrl,
          title: post.caption.substring(0, 60) + (post.caption.length > 60 ? "..." : ""),
          description: post.caption,
          url: normalizedUrl,
          thumbnail: post.imageUrls[0] || "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=500",
          author: pageName,
          publishedAt: post.postedDate,
          rawText: `[Engagement Metrics: Likes: ${post.reactionCount || 0}, Comments: ${post.commentCount || 0}, Shares: ${post.shareCount || 0}]
[Media - Images: ${post.imageUrls.join(", ")}]
[Media - Videos: ${post.videoUrls.join(", ")}]

${post.caption}`,
          processedStatus: "pending"
        });

        await contentItem.save();
        savedItems.push(contentItem);
      }

      // Mark Job completed
      job.status = "completed";
      job.finishedAt = new Date();
      await job.save();

      console.log(`✅ Facebook Page crawl completed. Ingested ${savedItems.length} posts.`);
      return savedItems;
    } catch (error) {
      console.error(`❌ Facebook Ingestion failed for source ${pageUrl}: ${error.message}`);
      job.status = "failed";
      job.error = error.message;
      job.finishedAt = new Date();
      await job.save();
      throw error;
    }
  }
}

export default new FacebookService();
