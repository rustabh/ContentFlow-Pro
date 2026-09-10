import type { Config } from "@netlify/functions";
import { processDueQueue } from "../../src/lib/queueProcessor";

/**
 * Runs on Netlify's own clock every 15 minutes so scheduled content
 * actually goes out automatically, instead of relying on someone opening
 * the Queue page and clicking "Run Due Posts". Unauthenticated by design —
 * Netlify Scheduled Functions are only reachable by Netlify's scheduler,
 * not the public internet (a direct HTTP request to this endpoint is
 * rejected with 401 unless it carries Netlify's internal invocation
 * secret), so this doesn't need its own login check.
 */
export default async () => {
  const result = await processDueQueue();
  console.log(
    `[auto-publish] processed=${result.processed} failed=${result.failed} ids=${result.ids.join(",")}`
  );
  return new Response(JSON.stringify(result), {
    headers: { "content-type": "application/json" },
  });
};

export const config: Config = {
  schedule: "*/15 * * * *",
};
