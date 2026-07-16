import ContentItem from "../models/ContentItem.js";
import Summary from "../models/Summary.js";
import User from "../models/User.js";
import StudioOutput from "../models/StudioOutput.js";
import { getAIClient, getLanguageInstruction } from "../services/aiService.js";

class AIStudioController {
  /**
   * Generates custom platform-specific social posts or articles from a source item.
   */
  async generatePost(req, res, next) {
    try {
      const { contentId, format, instructions } = req.body;

      if (!format) {
        const error = new Error("Format is required (e.g. LinkedIn, Twitter, Blog, YouTube, Newsletter)");
        error.status = 400;
        throw error;
      }

      const userId = req.user.userId;
      let contentInfoText = "";

      if (contentId) {
        const contentItem = await ContentItem.findById(contentId).populate("sourceId");
        if (!contentItem) {
          const error = new Error("Content item not found");
          error.status = 404;
          throw error;
        }

        if (contentItem.userId && contentItem.userId.toString() !== userId.toString()) {
          const error = new Error("Forbidden: Access denied");
          error.status = 403;
          throw error;
        }

        const summary = await Summary.findOne({ contentId, userId });

        contentInfoText = `
Source Title: ${contentItem.title}
Source Description: ${contentItem.description}
Source Author: ${contentItem.author || "Unknown"}
Source Category: ${contentItem.sourceId?.category || "general"}
AI Summary: ${summary?.summary || ""}
Key Takeaways: ${summary?.keyPoints?.join("\n- ") || ""}
Keywords: ${summary?.keywords?.join(", ") || ""}
`;
      } else {
        contentInfoText = "Generating custom post from scratch without source reference.";
      }

      const prompt = `You are a world-class creator, SEO copywriter, and growth marketer. 
Write a highly engaging, viral, and polished piece of content in the format of: ${format}.

Content Source Information:
${contentInfoText}

Format Specific Instructions:
- For "LinkedIn": Write a structured, professional post with spaced paragraphs, bullet points, a hook, and a relevant call to action.
- For "Twitter": Write an engaging Twitter/X thread. Separate each tweet in the thread using a clean "---" line delimiter on its own line. Make sure it has a hook thread-starter tweet.
- For "Facebook": Write a community-friendly, highly engaging post with a personal feel.
- For "Instagram": Write an engaging Instagram caption with a strong hook, custom emojis, spaced lines, and a clean tag group.
- For "Hashtags": Generate a list of 30 highly optimized hashtags grouped by popularity (broad, niche, branded).
- For "YT_Titles": Generate 5 highly viral, click-worthy YouTube titles utilizing psychological triggers.
- For "YT_Thumbnail": Generate 5 options of bold, high-contrast, 2-4 word thumbnail text overlays.
- For "YT_Desc": Write an SEO-optimized video description containing a summary, chapters placeholder, links, resources, and hashtags.
- For "YT_Timestamps": Generate a series of smart timestamps/chapters (e.g. 00:00 Intro...) based on the content sections.
- For "YT_Tags": Generate a comma-separated list of 20 video tags for YouTube search.
- For "YT_Community": Write an engaging YouTube Community post update for subscribers.
- For "YT_Script": Write a high-retention video script, containing visual scene descriptions in brackets like [Visual: show chart] and spoken voiceover text.
- For "Blog": Write a comprehensive, SEO-optimized long-form article. Include an H1 Title, Meta Description, URL Slug, Introduction, Section Headings (H2/H3), detailed paragraphs, bullet points, and an ending conclusion with Call to Action.
- For "Meta": Generate an SEO Meta Title, Meta Description (max 160 chars), and clean URL Slug.
- For "FAQ": Generate a list of 5 Frequently Asked Questions (FAQs) with detailed answers about this topic.
- For "Newsletter": Write a compelling, friendly value-packed email newsletter.
- For "Email_Campaign": Write a 3-part email nurture sequence (Welcome, Core Value, Soft Call-To-Action).
- For "CTA": Generate 10 variations of high-conversion Call-To-Action (CTA) buttons/phrases.
- For "Image_Prompt": Write 3 detailed text-to-image prompts describing custom conceptual graphics (e.g. for Midjourney).
- For "Carousel": Write slide-by-slide copy (10 slides) for a carousel post (Slide title, body text, graphic description).
- For "Rewrite": Rewrite the provided content to improve clarity, flow, tone, and overall engagement, while strictly adhering to the selected language.
- For "Translate": Translate the provided content accurately into the selected language, maintaining original tone, formatting, and keeping technical/programming terms in English where appropriate.
- For "Generate_Everything": Generate all the following assets compiled into a single master document separated by clear markdown headers:
  - Viral Titles (5 options)
  - Thumbnail Text (5 options)
  - Video Description & Tags
  - Chapters/Timestamps (based on the summary/transcript)
  - Facebook Post
  - LinkedIn Post
  - Twitter Thread (tweets separated by '---')
  - Blog Article (SEO optimized)
  - Newsletter
  - AI Image Prompt (3 options)

Custom Creator Directives:
"${instructions || "None"}"

Respond with ONLY the generated markdown content. Do not include markdown code block ticks (\`\`\`markdown) or any other conversational preambles/introductory comments. Return only the raw formatted text.`;

      const user = await User.findById(userId);
      const language = user?.language || "bn";
      const finalPrompt = prompt + getLanguageInstruction(language);

      console.log(`🤖 AI Studio generating ${format} draft...`);
      const ai = await getAIClient(req.user?.userId);
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: finalPrompt,
        config: {
          temperature: 0.7
        }
      });

      let generatedText = response.text;
      if (!generatedText) {
        throw new Error("Gemini returned an empty text response.");
      }

      generatedText = generatedText
        .replace(/^```markdown/, "")
        .replace(/^```/, "")
        .replace(/```$/, "")
        .trim();

      // Persist the output to database per user
      const studioOutput = new StudioOutput({
        userId,
        contentId: contentId || null,
        format,
        instructions: instructions || "",
        content: generatedText
      });
      await studioOutput.save();

      return res.status(200).json({
        success: true,
        message: `${format} content generated successfully`,
        data: {
          content: generatedText
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Interactively refines generated drafts using natural chat instructions.
   */
  async refinePost(req, res, next) {
    try {
      const { currentContent, chatPrompt, format } = req.body;

      if (!currentContent) {
        const error = new Error("Current content draft is required to perform refinement");
        error.status = 400;
        throw error;
      }
      if (!chatPrompt) {
        const error = new Error("Chat instruction prompt is required");
        error.status = 400;
        throw error;
      }

      const prompt = `You are an elite copy editor and content strategist. 
Refine the following draft copy based on the user's feedback/instructions.

Original Draft Content (Format: ${format || "general"}):
"""
${currentContent}
"""

User Refinement Request:
"${chatPrompt}"

Refinement Directives:
- Maintain the original intent and content subject unless explicitly instructed otherwise.
- Apply structural modifications, translation, shortening, lengthening, formatting, or tone adjustment as requested.
- For Twitter threads, preserve the "---" delimiters separating individual tweets.
- Respond with ONLY the updated draft content. Do not include markdown block ticks or chat introductions. Return the clean text draft only.`;

      const userId = req.user.userId;
      const user = await User.findById(userId);
      const language = user?.language || "bn";
      const finalPrompt = prompt + getLanguageInstruction(language);

      console.log("🤖 AI Studio refining draft via chat...");
      const ai = await getAIClient(req.user?.userId);
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: finalPrompt,
        config: {
          temperature: 0.6
        }
      });

      let refinedText = response.text;
      if (!refinedText) {
        throw new Error("Gemini returned an empty text response.");
      }

      refinedText = refinedText
        .replace(/^```markdown/, "")
        .replace(/^```/, "")
        .replace(/```$/, "")
        .trim();

      // Persist the refined output to database per user
      const studioOutput = new StudioOutput({
        userId: req.user.userId,
        contentId: null,
        format: format || "general",
        instructions: chatPrompt,
        content: refinedText
      });
      await studioOutput.save();

      return res.status(200).json({
        success: true,
        message: "Content refined successfully",
        data: {
          content: refinedText
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new AIStudioController();
