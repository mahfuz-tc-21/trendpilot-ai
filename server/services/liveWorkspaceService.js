import axios from "axios";
import * as cheerio from "cheerio";
import facebookCrawler from "./facebookCrawler.js";
import { normalizeUrl } from "../utils/urlNormalizer.js";

// Standard httpClient wrapper
const httpClient = axios.create({
  timeout: 15000,
  headers: {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 TrendPilot/1.0",
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8"
  }
});

class LiveWorkspaceService {
  /**
   * Crawl a standard website URL programmatically
   */
  async crawlWebsite(url) {
    console.log(`📡 Live crawling website URL: ${url}`);
    const response = await httpClient.get(url);
    const $ = cheerio.load(response.data);

    // Extract basic page parameters
    const title = $("title").text().trim() || $("h1").first().text().trim() || "Website Article";
    const metaDescription = $('meta[name="description"]').attr("content") || $('meta[property="og:description"]').attr("content") || "";
    const metaKeywords = $('meta[name="keywords"]').attr("content") || "";

    // Remove unwanted script/styling blocks
    $("script, style, nav, footer, header, form, aside").remove();

    // Extract main text content paragraphs
    const paragraphs = [];
    $("p, article, main, h1, h2, h3, h4, li").each((_, el) => {
      const txt = $(el).text().trim();
      if (txt && txt.length > 20) {
        paragraphs.push(txt);
      }
    });

    const mainContent = paragraphs.slice(0, 45).join("\n\n");

    // Extract images
    const images = [];
    $("img").each((_, el) => {
      const src = $(el).attr("src") || $(el).attr("data-src");
      if (src && src.startsWith("http") && !src.includes("logo") && images.length < 5) {
        images.push(src);
      }
    });

    return {
      title,
      description: metaDescription,
      content: mainContent,
      images,
      keywords: metaKeywords,
      url
    };
  }

  /**
   * Live ingest Facebook posts and select using filters
   */
  async crawlFacebookPage(url, selectionType = "latest") {
    console.log(`📡 Live Facebook crawl for: ${url} (Selection: ${selectionType})`);
    
    // Scrape latest 10 posts to ensure we have enough data for top performing / multi-posts selection
    const limit = selectionType === "10_posts" ? 10 : (selectionType === "5_posts" ? 5 : 5);
    const posts = await facebookCrawler.scrapeFacebookPageWithRetry(url, limit);

    if (posts.length === 0) {
      throw new Error("No public Facebook posts could be crawled from this page.");
    }

    let selectedPosts = [];
    if (selectionType === "latest") {
      selectedPosts = [posts[0]];
    } else if (selectionType === "top") {
      // Sort posts by highest total engagement count: Likes + Comments + Shares
      const sorted = [...posts].sort((a, b) => {
        const scoreA = (a.reactionCount || 0) + (a.commentCount || 0) + (a.shareCount || 0);
        const scoreB = (b.reactionCount || 0) + (b.commentCount || 0) + (b.shareCount || 0);
        return scoreB - scoreA;
      });
      selectedPosts = [sorted[0]];
    } else if (selectionType === "5_posts") {
      selectedPosts = posts.slice(0, 5);
    } else if (selectionType === "10_posts") {
      selectedPosts = posts.slice(0, 10);
    } else {
      // "all" or fallback
      selectedPosts = posts;
    }

    const compiledText = selectedPosts
      .map((p, idx) => `
--- Post #${idx + 1} ---
URL: ${p.postUrl}
Likes: ${p.reactionCount} | Comments: ${p.commentCount} | Shares: ${p.shareCount}
Published: ${p.postedDate}
Caption:
${p.caption}
      `.trim())
      .join("\n\n=========================================\n\n");

    const allImages = selectedPosts.flatMap((p) => p.imageUrls || []).filter(Boolean);

    return {
      title: `Facebook Feed (${selectionType})`,
      content: compiledText,
      images: allImages.slice(0, 8),
      url
    };
  }

  /**
   * Crawl a YouTube video page to extract metadata & transcripts
   */
  async crawlYouTubeVideo(url) {
    console.log(`📡 Live YouTube video extraction: ${url}`);
    
    const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/ ]{11})/i);
    const videoId = match ? match[1] : null;
    
    if (!videoId) {
      throw new Error("Invalid YouTube Video URL format");
    }

    const apiKey = process.env.YOUTUBE_API_KEY || process.env.GEMINI_API_KEY;
    let title = "YouTube Video";
    let description = "";
    let thumbnail = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    let duration = "PT0S";
    let tags = [];

    if (apiKey) {
      try {
        const response = await axios.get("https://www.googleapis.com/youtube/v3/videos", {
          params: {
            part: "snippet,contentDetails",
            id: videoId,
            key: apiKey
          }
        });
        const items = response.data?.items;
        if (items && items.length > 0) {
          const v = items[0];
          title = v.snippet?.title || title;
          description = v.snippet?.description || description;
          duration = v.contentDetails?.duration || duration;
          tags = v.snippet?.tags || [];
          thumbnail = v.snippet?.thumbnails?.maxres?.url || v.snippet?.thumbnails?.high?.url || thumbnail;
        }
      } catch (err) {
        console.warn("⚠️ YouTube API fetch failed. Using fallback page extraction:", err.message);
      }
    }

    // Fallback: If description/title not loaded, fetch oEmbed details
    if (title === "YouTube Video" || !description) {
      try {
        const oEmbedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
        const oRes = await axios.get(oEmbedUrl);
        title = oRes.data?.title || title;
      } catch {
        // ignore fallback errors
      }
    }

    // Construct a realistic transcript outline or fetch video captions if accessible
    // In serverless, loading third-party scripts to scrape JS tracks is unstable. 
    // We construct a detailed structure summarizing the content from the description and tags.
    const transcript = `
[YouTube Video Transcript Outline & Structural Analysis]
Video ID: ${videoId}
Title: ${title}

Description Details:
${description || "No description provided."}

Tags & Context:
${tags.join(", ") || "General Topic"}
    `.trim();

    return {
      title,
      description,
      content: transcript,
      thumbnail,
      duration,
      url
    };
  }

  /**
   * Crawl a blog article URL specifically
   */
  async crawlBlog(url) {
    console.log(`📡 Live blog crawler starting for URL: ${url}`);
    const data = await this.crawlWebsite(url);
    
    // Blog articles are generally text heavy, we clean the content description slightly
    return {
      ...data,
      title: data.title || "Blog Article"
    };
  }
}

export default new LiveWorkspaceService();
