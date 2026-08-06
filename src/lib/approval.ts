import type { ApprovalLogEntry, ApprovalStatus, ContentItem } from "./types";
import { uid } from "./utils";

/** Apply an approval decision to a content item, logging it to the history trail. */
export function applyApproval(
  item: ContentItem,
  nextApproval: ApprovalStatus,
  note: string,
  by: string
): ContentItem {
  const history = item.approvalHistory ?? [];
  const trimmedNote = note.trim();
  const changed = nextApproval !== item.approval;
  if (!changed && !trimmedNote) return item;

  const entry: ApprovalLogEntry = {
    id: uid(),
    status: nextApproval,
    note: trimmedNote,
    by: by.trim() || "Team",
    at: new Date().toISOString(),
  };
  return { ...item, approval: nextApproval, approvalHistory: [...history, entry] };
}
