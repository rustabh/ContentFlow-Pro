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
