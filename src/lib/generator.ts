import { BEST_TIMES } from "./constants";
import type {
  Client,
  ContentItem,
  ContentType,
  Idea,
  Platform,
  Shoot,
} from "./types";
import { daysInMonth, dateInMonth, uid } from "./utils";

/* ------------------------------------------------------------------ */
/* Scheduling                                                          */
/* ------------------------------------------------------------------ */

/**
 * Spread `count` items evenly across a month, avoiding consecutive days
 * unless the volume makes that impossible.
 */
export function distributeDays(count: number, totalDays: number): number[] {
  if (count <= 0) return [];
  if (count >= totalDays) {
    return Array.from({ length: count }, (_, i) => (i % totalDays) + 1);
  }
  const step = totalDays / count;
  const days = Array.from({ length: count }, (_, i) =>
    Math.min(totalDays, Math.max(1, Math.round(step * i + step / 2)))
  );
  // Nudge forward any duplicates/consecutive collisions when there is room.
  const canSpace = count * 2 - 1 <= totalDays;
  for (let i = 1; i < days.length; i++) {
    const minGap = canSpace ? 2 : 1;
    if (days[i] - days[i - 1] < minGap) {
      days[i] = Math.min(totalDays, days[i - 1] + minGap);
    }
  }
  return days;
}

/** Interleave the per-type schedules so the month mixes formats evenly. */
function buildTypeSchedule(client: Client): ContentType[] {
  const items: ContentType[] = [];
  // Every 4th post becomes a carousel for variety.
  for (let i = 0; i < client.monthlyPosts; i++) {
    items.push((i + 1) % 4 === 0 ? "Carousel" : "Post");
  }
  for (let i = 0; i < client.monthlyReels; i++) items.push("Reel");
  for (let i = 0; i < client.monthlyStories; i++) items.push("Story");
  // Round-robin interleave: sort by fractional position within their own type count.
  const byType = new Map<ContentType, number>();
  const withPos = items.map((type) => {
    const seen = (byType.get(type) ?? 0) + 1;
    byType.set(type, seen);
    const total = items.filter((t) => t === type).length;
    return { type, pos: seen / (total + 1) };
  });
  withPos.sort((a, b) => a.pos - b.pos);
  return withPos.map((x) => x.type);
}

/**
 * Generate a full monthly content plan for a client.
 * Distributes all deliverables evenly, rotates platforms, and assigns
 * suggested best posting times per platform.
 */
export function generateMonthlyPlan(
  client: Client,
  month: string,
  postingTimes: Record<Platform, string[]> = BEST_TIMES,
  team?: { designers: string[]; editors: string[]; shooters: string[] }
): ContentItem[] {
  const types = buildTypeSchedule(client);
  const total = types.length;
  if (total === 0) return [];

  const days = distributeDays(total, daysInMonth(month));
  const platforms: Platform[] =
    client.platforms.length > 0 ? client.platforms : ["Instagram"];

  const timeCursor: Record<string, number> = {};

  return types.map((type, i) => {
    // Stories & reels lean Instagram; other formats rotate across the client's platforms.
    const platform: Platform =
      type === "Story" || type === "Reel"
        ? platforms.includes("Instagram")
          ? "Instagram"
          : platforms[i % platforms.length]
        : platforms[i % platforms.length];

    const times = postingTimes[platform] ?? BEST_TIMES[platform];
    const cursor = timeCursor[platform] ?? 0;
    timeCursor[platform] = cursor + 1;

    const copy = placeholderCopy(client, type, i);

    return {
      id: uid(),
      clientId: client.id,
      month,
      date: dateInMonth(month, days[i]),
      time: times[cursor % times.length],
      platform,
      type,
      topic: copy.topic,
      caption: copy.caption,
      hashtags: copy.hashtags,
      cta: copy.cta,
      designer: team?.designers[i % Math.max(1, team.designers.length)] ?? "",
      editor:
        type === "Reel"
          ? (team?.editors[i % Math.max(1, team.editors.length)] ?? "")
          : "",
      shooter: "",
      approval: "Pending",
      status: "Planned",
    };
  });
}

/**
 * Generate shoot days for a client's month based on the package.
 * Shoots are placed evenly and slightly ahead of content batches.
 */
export function generateShootPlan(client: Client, month: string): Shoot[] {
  const count = Math.max(0, client.shootDays);
  if (count === 0) return [];
  const days = distributeDays(count, daysInMonth(month)).map((d) =>
    // Bias shoots earlier in their window so edits happen before posting.
    Math.max(1, d - 2)
  );
  return days.map((day, i) => ({
    id: uid(),
    clientId: client.id,
    month,
    date: dateInMonth(month, day),
    time: "10:00",
    location: "",
    products: "",
    models: "",
    equipment: "Camera, Tripod, Lighting Kit, Lav Mic",
    shotList: `Shoot ${i + 1}: cover upcoming posts & reels batch`,
    referenceLink: "",
    completed: false,
  }));
}

/* ------------------------------------------------------------------ */
/* Placeholder copy                                                    */
/* ------------------------------------------------------------------ */

interface IdeaTemplate {
  topic: string;
  hook: string;
  script: string;
  caption: string;
  cta: string;
  hashtags: string;
}

const GENERIC_IDEAS: IdeaTemplate[] = [
  {
    topic: "Behind the scenes",
    hook: "Ever wondered what happens behind the scenes at {brand}?",
    script:
      "Open with a fast-cut montage of the workspace. Voiceover introduces the team. Show 3 quick moments of the process. End on the finished result.",
    caption:
      "A little peek behind the curtain at {brand} — this is where the magic happens. ✨",
    cta: "Follow for more behind-the-scenes moments",
    hashtags: "#BehindTheScenes #{brandTag} #SmallBusiness #TeamWork",
  },
  {
    topic: "Customer story / testimonial",
    hook: "Don't take our word for it — hear it from our customers.",
    script:
      "Show the customer's problem, their experience with {brand}, and the outcome. Close with their favorite thing about working with us.",
    caption:
      "Stories like this are why we do what we do. Thank you for trusting {brand}. 💜",
    cta: "DM us to share your experience",
    hashtags: "#Testimonial #CustomerLove #{brandTag} #Trusted",
  },
  {
    topic: "Meet the team",
    hook: "The people who make {brand} what it is.",
    script:
      "Introduce one team member. Their role, one fun fact, and what they love about the work. Keep it warm and personal.",
    caption: "Say hello to the humans behind {brand}! 👋",
    cta: "Drop a 👋 in the comments",
    hashtags: "#MeetTheTeam #{brandTag} #TeamSpotlight",
  },
  {
    topic: "Tips & how-to",
    hook: "3 things you're probably getting wrong — and how to fix them.",
    script:
      "Hook with the common mistake. Deliver three quick, practical tips with on-screen text. Recap and invite saves.",
    caption:
      "Save this one for later — three quick wins you can apply today. 📌",
    cta: "Save this post & share it with a friend",
    hashtags: "#TipsAndTricks #HowTo #{brandTag} #LearnSomethingNew",
  },
  {
    topic: "Product / service spotlight",
    hook: "This is the one everyone keeps asking about.",
    script:
      "Close-up shots of the product/service in use. Highlight 3 benefits. End with availability and how to get it.",
    caption:
      "Meet the fan favorite — crafted with care by {brand}, loved by you. 💫",
    cta: "Tap the link in bio to learn more",
    hashtags: "#Spotlight #{brandTag} #MustHave #NewIn",
  },
  {
    topic: "Myth vs fact",
    hook: "Let's bust the biggest myth in {industry}.",
    script:
      "State the myth boldly. Explain why it's wrong with one clear example. Give the fact and what to do instead.",
    caption: "Myth: busted. 👊 Here's what's actually true in {industry}.",
    cta: "Comment a myth you want us to bust next",
    hashtags: "#MythVsFact #{brandTag} #DidYouKnow",
  },
];

const INDUSTRY_IDEAS: Record<string, IdeaTemplate[]> = {
  Fashion: [
    {
      topic: "Style it 3 ways",
      hook: "One piece, three completely different looks.",
      script:
        "Quick transitions showing the same item styled casual, office, and evening. Text overlay names each look.",
      caption:
        "One piece, endless possibilities. Which look is your favorite — 1, 2 or 3? 👗",
      cta: "Comment your favorite look below",
      hashtags: "#StyleInspo #OOTD #{brandTag} #FashionReels #StyleIt3Ways",
    },
    {
      topic: "New drop teaser",
      hook: "Something new is coming. Here's your first look.",
      script:
        "Moody close-ups of fabric and details. Reveal one hero shot at the end with the launch date.",
      caption: "The wait is almost over. New collection drops soon. 🖤",
      cta: "Turn on notifications so you don't miss the drop",
      hashtags: "#NewDrop #ComingSoon #{brandTag} #FashionLaunch",
    },
    {
      topic: "Trend take",
      hook: "This trend is everywhere — here's how to wear it right.",
      script:
        "Show the trend, then 2-3 styling do's with real outfits. Close with a signature {brand} twist.",
      caption: "Trends come and go — style is how you wear them. ✨",
      cta: "Share this with your most fashionable friend",
      hashtags: "#TrendAlert #FashionTips #{brandTag}",
    },
  ],
  "Food & Beverage": [
    {
      topic: "Signature dish reveal",
      hook: "The dish our regulars refuse to skip.",
      script:
        "Sizzle shots of preparation, the pour/plating moment in slow motion, first bite reaction.",
      caption: "Some things never go out of taste. 🍽️ Have you tried it yet?",
      cta: "Tag who you're bringing next visit",
      hashtags: "#Foodie #FoodReels #{brandTag} #EatLocal",
    },
    {
      topic: "Recipe / how it's made",
      hook: "Here's exactly how we make it — step by step.",
      script:
        "Fast-paced steps with ingredient callouts on screen. Finish with the final plate and a taste test.",
      caption: "From our kitchen to your feed. Made fresh, always. 👨‍🍳",
      cta: "Save this and try it at home",
      hashtags: "#Recipe #BehindTheKitchen #{brandTag} #FoodLover",
    },
    {
      topic: "Weekend special announcement",
      hook: "This weekend only — you don't want to miss this.",
      script:
        "Announce the special with appetizing close-ups, availability window, and how to order/book.",
      caption: "Weekend plans: sorted. Limited portions, unlimited cravings. 😍",
      cta: "Book your table now — link in bio",
      hashtags: "#WeekendSpecial #{brandTag} #FoodieAlert",
    },
  ],
  Fitness: [
    {
      topic: "Workout of the week",
      hook: "This 15-minute routine hits harder than an hour of cardio.",
      script:
        "Demo 4 exercises with reps on screen. Show correct form vs common mistake for one move.",
      caption:
        "No excuses — 15 minutes is all you need. Try this and tell us how it went. 💪",
      cta: "Save this workout for your next session",
      hashtags: "#WorkoutOfTheWeek #FitnessMotivation #{brandTag} #Training",
    },
    {
      topic: "Client transformation",
      hook: "6 months of showing up. Here's what happened.",
      script:
        "Before/after with the client's own words about the journey. Highlight consistency over intensity.",
      caption:
        "Progress isn't loud — it's consistent. Proud of this journey. 🔥",
      cta: "DM 'START' to begin your transformation",
      hashtags: "#Transformation #FitnessJourney #{brandTag} #Results",
    },
    {
      topic: "Nutrition myth busting",
      hook: "Stop believing this nutrition myth.",
      script:
        "State the myth, explain the science simply, give the practical takeaway in one line.",
      caption: "Your results start in the kitchen — let's get the facts right. 🥗",
      cta: "Comment a myth you want debunked",
      hashtags: "#NutritionTips #FitFacts #{brandTag}",
    },
  ],
  Beauty: [
    {
      topic: "Get ready with us",
      hook: "GRWM using only our bestsellers.",
      script:
        "Step-by-step application with product names on screen. Before/after glow reveal at the end.",
      caption: "Glow, but make it effortless. ✨ Every product linked in bio.",
      cta: "Shop the full routine — link in bio",
      hashtags: "#GRWM #BeautyRoutine #{brandTag} #GlowUp",
    },
    {
      topic: "Ingredient spotlight",
      hook: "This one ingredient changed everything.",
      script:
        "Macro shots of the product. Explain what the ingredient does in plain words, who it's for, and how to use it.",
      caption: "Skincare that works starts with ingredients that matter. 🌿",
      cta: "Comment your skin type for a recommendation",
      hashtags: "#SkincareScience #IngredientSpotlight #{brandTag}",
    },
    {
      topic: "Before & after",
      hook: "Real results — no filters, no tricks.",
      script:
        "Split-screen before/after. Timeline of usage. Client quote about the change.",
      caption: "The results speak for themselves. Real skin, real results. 💜",
      cta: "Book your consultation today",
      hashtags: "#BeforeAndAfter #RealResults #{brandTag} #BeautyCare",
    },
  ],
  "Real Estate": [
    {
      topic: "Property walkthrough",
      hook: "This home has a feature you've never seen before.",
      script:
        "Cinematic walkthrough hitting 3 hero features. End with location, price band, and viewing invite.",
      caption:
        "Home isn't a place — it's a feeling. Schedule your private tour today. 🏡",
      cta: "DM 'TOUR' to book a viewing",
      hashtags: "#PropertyTour #DreamHome #{brandTag} #RealEstate",
    },
    {
      topic: "Buyer tips",
      hook: "3 things every first-time buyer should know.",
      script:
        "Three quick tips with on-screen text: budgeting, location trade-offs, paperwork pitfalls.",
      caption:
        "Buying your first home? Read this before you sign anything. 📋",
      cta: "Save this checklist for house-hunting day",
      hashtags: "#HomeBuyingTips #FirstTimeBuyer #{brandTag}",
    },
    {
      topic: "Neighborhood spotlight",
      hook: "Why everyone is moving to this neighborhood.",
      script:
        "Showcase cafes, parks, schools, and commute times. Close with available listings.",
      caption: "Location, lifestyle, community — this area has it all. 📍",
      cta: "Ask us about listings in this area",
      hashtags: "#NeighborhoodGuide #{brandTag} #LocationSpotlight",
    },
  ],
  Technology: [
    {
      topic: "Feature demo",
      hook: "This feature saves our users 5 hours a week.",
      script:
        "Screen recording of the feature in action. Problem → solution → result, in under 30 seconds.",
      caption:
        "Work smarter, not harder. See what {brand} can automate for you. ⚡",
      cta: "Start your free trial — link in bio",
      hashtags: "#TechTips #Productivity #{brandTag} #SaaS",
    },
    {
      topic: "Industry insight",
      hook: "The biggest shift happening in {industry} right now.",
      script:
        "One trend, one stat, one practical implication for the audience. Keep it sharp and quotable.",
      caption: "The future belongs to teams that adapt early. 🚀",
      cta: "Follow for weekly industry insights",
      hashtags: "#TechTrends #Innovation #{brandTag}",
    },
    {
      topic: "Customer use case",
      hook: "How one team cut costs by 40% with {brand}.",
      script:
        "The customer's challenge, the setup, the measurable outcome. End with a quote.",
      caption: "Real teams, real results. This is what success looks like. 📈",
      cta: "Book a demo to see it live",
      hashtags: "#CaseStudy #CustomerSuccess #{brandTag}",
    },
  ],
};

function templatesFor(industry: string): IdeaTemplate[] {
  return [...(INDUSTRY_IDEAS[industry] ?? []), ...GENERIC_IDEAS];
}

function fillTemplate(text: string, client: Client): string {
  const brandTag = (client.brandName || client.name).replace(/[^a-zA-Z0-9]/g, "");
  return text
    .replaceAll("{brand}", client.brandName || client.name)
    .replaceAll("{brandTag}", brandTag)
    .replaceAll("{industry}", client.industry || "your industry");
}

/** Placeholder topic/caption/hashtags/CTA for a generated content item. */
export function placeholderCopy(
  client: Client,
  type: ContentType,
  index: number
): { topic: string; caption: string; hashtags: string; cta: string } {
  const templates = templatesFor(client.industry);
  const t = templates[index % templates.length];
  const typeLabel =
    type === "Story" ? " (Story teaser)" : type === "Carousel" ? " (Carousel)" : "";
  return {
    topic: fillTemplate(t.topic, client) + typeLabel,
    caption: fillTemplate(t.caption, client),
    hashtags: fillTemplate(t.hashtags, client),
    cta: fillTemplate(t.cta, client),
  };
}

/** Generate a batch of content ideas based on the client's industry. */
export function generateIdeas(client: Client, count = 6): Idea[] {
  const templates = templatesFor(client.industry);
  return templates.slice(0, count).map((t) => ({
    id: uid(),
    clientId: client.id,
    industry: client.industry,
    topic: fillTemplate(t.topic, client),
    hook: fillTemplate(t.hook, client),
    script: fillTemplate(t.script, client),
    caption: fillTemplate(t.caption, client),
    cta: fillTemplate(t.cta, client),
    hashtags: fillTemplate(t.hashtags, client),
    createdAt: new Date().toISOString(),
  }));
}
