import type {
  ApprovalStatus,
  ContentStatus,
  ContentType,
  Platform,
  Settings,
  ShootFrequency,
} from "./types";

export const PLATFORMS: Platform[] = ["Instagram", "Facebook", "LinkedIn"];

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
