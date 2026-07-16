import type {
  ApprovalStatus,
  ContentStatus,
  ContentType,
  Platform,
  Settings,
  ShootFrequency,
} from "./types";

export const PLATFORMS: Platform[] = [
  "Instagram",
  "Facebook",
  "LinkedIn",
  "YouTube",
  "Pinterest",
  "TikTok",
  "X (Twitter)",
  "Threads",
];

/** Platforms that support vertical video (Reels / Shorts). */
export const REEL_PLATFORMS: Platform[] = [
  "Instagram",
  "TikTok",
  "YouTube",
  "Facebook",
];

/** Platforms that support ephemeral Stories. */
export const STORY_PLATFORMS: Platform[] = ["Instagram", "Facebook"];

export const CONTENT_TYPES: ContentType[] = [
  "Post",
  "Reel",
  "Carousel",
  "Story",
];

export const STATUSES: ContentStatus[] = [
  "Planned",
  "Shoot Pending",
  "Editing",
  "Approval",
  "Scheduled",
  "Posted",
];

export const APPROVAL_STATUSES: ApprovalStatus[] = [
  "Pending",
  "Approved",
  "Rejected",
];

export const SHOOT_FREQUENCIES: ShootFrequency[] = [
  "Weekly",
  "Bi-Weekly",
  "Monthly",
  "Custom",
];

export const INDUSTRIES = [
  "Fashion",
  "Food & Beverage",
  "Fitness",
  "Beauty",
  "Real Estate",
  "Technology",
  "Education",
  "Healthcare",
  "Travel",
  "E-commerce",
  "Other",
];

/** Suggested best posting times per platform, in rotation order. */
export const BEST_TIMES: Record<Platform, string[]> = {
  Instagram: ["11:00", "14:00", "19:00"],
  Facebook: ["09:00", "13:00", "16:00"],
  LinkedIn: ["08:00", "12:00", "17:00"],
  YouTube: ["12:00", "15:00", "20:00"],
  Pinterest: ["08:00", "14:00", "21:00"],
  TikTok: ["07:00", "12:00", "19:00"],
  "X (Twitter)": ["08:00", "12:00", "18:00"],
  Threads: ["10:00", "13:00", "19:00"],
};

/** Brand-tinted badge styles per platform. */
export const PLATFORM_COLORS: Record<Platform, string> = {
  Instagram: "bg-pink-50 text-pink-700",
  Facebook: "bg-blue-50 text-blue-700",
  LinkedIn: "bg-sky-50 text-sky-700",
  YouTube: "bg-red-50 text-red-700",
  Pinterest: "bg-rose-50 text-rose-700",
  TikTok: "bg-slate-100 text-slate-800",
  "X (Twitter)": "bg-gray-100 text-gray-800",
  Threads: "bg-neutral-100 text-neutral-700",
};

export const DEFAULT_SETTINGS: Settings = {
  agencyName: "Incinc Media",
  footerText: "Designed by Incinc Media",
  postingTimes: BEST_TIMES,
  team: {
    designers: ["Aisha", "Rohan"],
    editors: ["Maya", "Dev"],
    shooters: ["Karan", "Lena"],
  },
};

export const STATUS_COLORS: Record<ContentStatus, string> = {
  Planned: "bg-gray-100 text-gray-700",
  "Shoot Pending": "bg-amber-50 text-amber-700",
  Editing: "bg-blue-50 text-blue-700",
  Approval: "bg-purple-50 text-purple-700",
  Scheduled: "bg-teal-50 text-teal-700",
  Posted: "bg-green-50 text-green-700",
};

export const TYPE_COLORS: Record<ContentType, string> = {
  Post: "bg-primary-50 text-primary-700",
  Reel: "bg-rose-50 text-rose-700",
  Carousel: "bg-indigo-50 text-indigo-700",
  Story: "bg-orange-50 text-orange-700",
};
