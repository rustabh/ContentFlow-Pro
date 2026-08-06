export type Platform =
  | "Instagram"
  | "Facebook"
  | "LinkedIn"
  | "YouTube"
  | "Pinterest"
  | "TikTok"
  | "X (Twitter)"
  | "Threads";

export type ContentType = "Post" | "Reel" | "Carousel" | "Story";

export type ContentStatus =
  | "Planned"
  | "Shoot Pending"
  | "Editing"
  | "Approval"
  | "Scheduled"
  | "Posted";

export type ApprovalStatus = "Pending" | "Approved" | "Rejected";

export type ShootFrequency = "Weekly" | "Bi-Weekly" | "Monthly" | "Custom";

export interface Client {
  id: string;
  name: string;
  brandName: string;
  industry: string;
  contactPerson: string;
  phone: string;
  email: string;
  packageStart: string; // YYYY-MM-DD
  packageEnd: string; // YYYY-MM-DD
  monthlyPosts: number;
  monthlyReels: number;
  monthlyStories: number;
  shootDays: number;
  shootFrequency: ShootFrequency;
  platforms: Platform[];
  notes: string;
  createdAt: string;
  shareToken?: string; // unguessable token for the client-facing read-only approval link
  connections?: Partial<Record<Platform, PlatformConnection>>;
}

export interface PlatformConnection {
  accessToken: string;
  /** Instagram Business Account ID, or Facebook Page ID. */
  accountId: string;
}

export interface ApprovalLogEntry {
  id: string;
  status: ApprovalStatus;
  note: string;
  by: string;
  at: string; // ISO timestamp
}

export interface ContentItem {
  id: string;
  clientId: string;
  month: string; // YYYY-MM
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  platform: Platform;
  type: ContentType;
  topic: string;
  caption: string;
  hashtags: string;
  cta: string;
  designer: string;
  editor: string;
  shooter: string;
  approval: ApprovalStatus;
  status: ContentStatus;
  approvalHistory?: ApprovalLogEntry[];
  postedAt?: string; // ISO timestamp — set when the queue engine marks it Posted
  mediaKey?: string; // Netlify Blobs key for the attached image/video
  mediaContentType?: string;
  postError?: string; // set when a real platform publish attempt fails
}

export interface Shoot {
  id: string;
  clientId: string;
  month: string; // YYYY-MM
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  location: string;
  products: string;
  models: string;
  equipment: string;
  shotList: string;
  referenceLink: string;
  completed: boolean;
}

export interface Idea {
  id: string;
  clientId: string;
  industry: string;
  topic: string;
  hook: string;
  script: string;
  caption: string;
  cta: string;
  hashtags: string;
  createdAt: string;
}

export interface Settings {
  agencyName: string;
  agencyEmail: string;
  footerText: string;
  postingTimes: Record<Platform, string[]>;
  team: {
    designers: string[];
    editors: string[];
    shooters: string[];
  };
}

export interface Database {
  clients: Client[];
  content: ContentItem[];
  shoots: Shoot[];
  ideas: Idea[];
  settings: Settings;
}

export interface Notification {
  id: string;
  title: string;
  detail: string;
  href: string;
}

export interface ClientProgress {
  clientId: string;
  clientName: string;
  brandName: string;
  posts: { done: number; total: number };
  reels: { done: number; total: number };
  stories: { done: number; total: number };
  shoots: { done: number; total: number };
}

export interface DashboardData {
  totalClients: number;
  activeClients: number;
  postsRemaining: number;
  reelsRemaining: number;
  upcomingShoots: (Shoot & { clientName: string })[];
  thisWeek: (ContentItem & { clientName: string })[];
  monthItems: ContentItem[];
  progress: ClientProgress[];
  notifications: Notification[];
}

export interface QueueItem extends ContentItem {
  clientName: string;
}

/** Fields exposed on the public, token-gated client approval page — no internal team info. */
export interface PublicApprovalItem {
  id: string;
  date: string;
  time: string;
  platform: Platform;
  type: ContentType;
  topic: string;
  caption: string;
  hashtags: string;
  cta: string;
  approval: ApprovalStatus;
  status: ContentStatus;
  mediaKey?: string;
  mediaContentType?: string;
}

export interface PlatformCount {
  platform: Platform;
  count: number;
}

export interface ClientAnalytics {
  clientId: string;
  clientName: string;
  brandName: string;
  industry: string;
  plannedThisMonth: number;
  postedThisMonth: number;
  consistencyPct: number;
  platformBreakdown: PlatformCount[];
}

export interface MonthlyTrendPoint {
  month: string;
  planned: number;
  posted: number;
}

export interface AnalyticsData {
  totalPostedAllTime: number;
  plannedThisMonth: number;
  postedThisMonth: number;
  overallConsistencyPct: number;
  monthlyTrend: MonthlyTrendPoint[];
  platformBreakdown: PlatformCount[];
  clientAnalytics: ClientAnalytics[];
}
