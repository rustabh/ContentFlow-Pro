import { jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import type { Database } from "../src/lib/types";

export const appState = pgTable("app_state", {
  id: text().primaryKey(),
  data: jsonb().$type<Database>().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});
