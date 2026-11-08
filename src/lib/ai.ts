import Anthropic from "@anthropic-ai/sdk";
import type { Client, ContentItem, Idea } from "./types";
import { uid } from "./utils";

let cachedClient: Anthropic | null | undefined;

function getClient(): Anthropic | null {
  if (cachedClient !== undefined) return cachedClient;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  cachedClient = apiKey ? new Anthropic({ apiKey }) : null;
  return cachedClient;
}

interface AiIdea {
  topic: string;
  hook: string;
  script: string;
  caption: string;
  cta: string;
  hashtags: string;
}

const IDEAS_SCHEMA = {
  type: "object",
  properties: {
    ideas: {
      type: "array",
      items: {
        type: "object",
        properties: {
          topic: { type: "string" },
          hook: { type: "string" },
          script: { type: "string" },
          caption: { type: "string" },
          cta: { type: "string" },
          hashtags: { type: "string" },
        },
        required: ["topic", "hook", "script", "caption", "cta", "hashtags"],
        additionalProperties: false,
      },
    },
  },
  required: ["ideas"],
  additionalProperties: false,
} as const;

/**
 * Generate real, brand-specific content ideas via Claude. Returns null when
 * ANTHROPIC_API_KEY isn't configured (or the call fails) so callers can fall
 * back to the static templates in generator.ts — no hard dependency on AI.
 */
export async function generateAiIdeas(client: Client, count: number): Promise<Idea[] | null> {
  const anthropic = getClient();
  if (!anthropic) return null;

  try {
    const response = await anthropic.beta.messages.create({
      model: "claude-opus-5",
      max_tokens: 4096,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: {
        effort: "medium",
        format: { type: "json_schema", schema: IDEAS_SCHEMA },
      },
      messages: [
        {
          role: "user",
          content: `Generate ${count} distinct social media content ideas for "${client.brandName || client.name}", a ${client.industry} business. For each idea provide: a short topic, an attention-grabbing hook, a brief script outline, a ready-to-post caption, a call to action, and relevant hashtags (space-separated, each starting with #). Keep captions authentic and specific to the brand — avoid generic filler.`,
        },
      ],
    });

    if (response.stop_reason === "refusal") return null;

    const textBlock = response.content.find(
      (b): b is Anthropic.Beta.BetaTextBlock => b.type === "text"
    );
    if (!textBlock) return null;

    const parsed: { ideas: AiIdea[] } = JSON.parse(textBlock.text);

    return parsed.ideas.slice(0, count).map((idea) => ({
      id: uid(),
      clientId: client.id,
      industry: client.industry,
      topic: idea.topic,
      hook: idea.hook,
      script: idea.script,
      caption: idea.caption,
      cta: idea.cta,
      hashtags: idea.hashtags,
      createdAt: new Date().toISOString(),
    }));
  } catch {
    return null;
  }
}

interface AiCaption {
  caption: string;
  hashtags: string;
  cta: string;
}

const CAPTION_SCHEMA = {
  type: "object",
  properties: {
    caption: { type: "string" },
    hashtags: { type: "string" },
    cta: { type: "string" },
  },
  required: ["caption", "hashtags", "cta"],
  additionalProperties: false,
} as const;

/**
 * Rewrite a single content item's caption/hashtags/CTA via Claude, keeping
 * the same topic and platform but sharpening the copy. Returns null when
 * ANTHROPIC_API_KEY isn't configured (or the call fails) so callers can show
 * an error instead of a broken rewrite.
 */
export async function generateAiCaption(
  client: Client,
  item: ContentItem
): Promise<AiCaption | null> {
  const anthropic = getClient();
  if (!anthropic) return null;

  try {
    const response = await anthropic.beta.messages.create({
      model: "claude-opus-5",
      max_tokens: 2048,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: {
        effort: "medium",
        format: { type: "json_schema", schema: CAPTION_SCHEMA },
      },
      messages: [
        {
          role: "user",
          content: `Rewrite the caption for a ${item.platform} ${item.type} for "${client.brandName || client.name}", a ${client.industry} business. Topic: "${item.topic || "(no topic given)"}". Current caption (improve on this, don't just rephrase it — make it sharper and more specific): "${item.caption || "(none yet)"}". Return a ready-to-post caption, a call to action, and relevant hashtags (space-separated, each starting with #). Keep it authentic and specific to the brand — avoid generic filler.`,
        },
      ],
    });

    if (response.stop_reason === "refusal") return null;

    const textBlock = response.content.find(
      (b): b is Anthropic.Beta.BetaTextBlock => b.type === "text"
    );
    if (!textBlock) return null;

    return JSON.parse(textBlock.text) as AiCaption;
  } catch {
    return null;
  }
}
