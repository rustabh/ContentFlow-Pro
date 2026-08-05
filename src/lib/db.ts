import { eq } from "drizzle-orm";
import { database } from "../../db";
import { appState } from "../../db/schema";
import { DEFAULT_SETTINGS } from "./constants";
import { generateIdeas, generateMonthlyPlan, generateShootPlan } from "./generator";
import type { Client, Database } from "./types";
import { currentMonth, toMonthKey, todayISO, uid } from "./utils";

const APP_STATE_ID = "default";

function emptyDb(): Database {
  return {
    clients: [],
    content: [],
    shoots: [],
    ideas: [],
    settings: DEFAULT_SETTINGS,
  };
}

function seedDb(): Database {
  const db = emptyDb();
  const now = new Date();
  const start = todayISO().slice(0, 8) + "01";
  const end = toMonthKey(new Date(now.getFullYear(), now.getMonth() + 6, 1)) + "-28";

  const sampleClients: Client[] = [
    {
      id: uid(),
      name: "Aurora Skin Clinic",
      brandName: "Aurora Skin",
      industry: "Beauty",
      contactPerson: "Dr. Nadia Rahman",
      phone: "+1 555 0142",
      email: "nadia@auroraskin.com",
      packageStart: start,
      packageEnd: end,
      monthlyPosts: 12,
      monthlyReels: 8,
      monthlyStories: 20,
      shootDays: 4,
      shootFrequency: "Weekly",
      platforms: ["Instagram", "Facebook", "Pinterest", "TikTok"],
      notes: "Focus on before/after results and skincare education.",
      createdAt: new Date().toISOString(),
    },
    {
      id: uid(),
      name: "Brick & Vine Realty",
      brandName: "Brick & Vine",
      industry: "Real Estate",
      contactPerson: "Marcus Cole",
      phone: "+1 555 0198",
      email: "marcus@brickandvine.com",
      packageStart: start,
      packageEnd: end,
      monthlyPosts: 8,
      monthlyReels: 6,
      monthlyStories: 12,
      shootDays: 2,
      shootFrequency: "Bi-Weekly",
      platforms: ["Instagram", "Facebook", "LinkedIn", "YouTube"],
      notes: "Weekly property walkthroughs; LinkedIn for market insights.",
      createdAt: new Date().toISOString(),
    },
  ];

  const month = currentMonth();
  for (const client of sampleClients) {
    db.clients.push(client);
    db.content.push(
      ...generateMonthlyPlan(client, month, db.settings.postingTimes, db.settings.team)
    );
    db.shoots.push(...generateShootPlan(client, month));
    db.ideas.push(...generateIdeas(client, 4));
  }

  // Give the seeded plan some workflow variety so the dashboard feels alive.
  const today = todayISO();
  for (const item of db.content) {
    if (item.date < today) {
      item.status = "Posted";
      item.approval = "Approved";
    }
  }
  for (const shoot of db.shoots) {
    if (shoot.date < today) shoot.completed = true;
  }

  return db;
}

export async function readDb(): Promise<Database> {
  let [row] = await database
    .select({ data: appState.data })
    .from(appState)
    .where(eq(appState.id, APP_STATE_ID))
    .limit(1);

  if (!row) {
    const seeded = seedDb();
    await database.insert(appState).values({ id: APP_STATE_ID, data: seeded }).onConflictDoNothing();
    [row] = await database
      .select({ data: appState.data })
      .from(appState)
      .where(eq(appState.id, APP_STATE_ID))
      .limit(1);
  }

  const db = row?.data ?? seedDb();
  // Backfill settings for older data files (deep-merged so newly added
  // platforms get their default posting times).
  db.settings = {
    ...DEFAULT_SETTINGS,
    ...db.settings,
    postingTimes: {
      ...DEFAULT_SETTINGS.postingTimes,
      ...(db.settings?.postingTimes ?? {}),
    },
    team: { ...DEFAULT_SETTINGS.team, ...(db.settings?.team ?? {}) },
  };
  return db;
}

export async function writeDb(db: Database): Promise<void> {
  await database
    .insert(appState)
    .values({ id: APP_STATE_ID, data: db, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: appState.id,
      set: { data: db, updatedAt: new Date() },
    });
}

export async function resetDb(): Promise<Database> {
  const db = seedDb();
  await writeDb(db);
  return db;
}
