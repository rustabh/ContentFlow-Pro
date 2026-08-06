"use client";

import { useEffect, useState } from "react";
import {
  Badge,
  Button,
  Field,
  Modal,
  Select,
  TextArea,
  TextInput,
} from "@/components/ui";
import {
  APPROVAL_STATUSES,
  CONTENT_TYPES,
  PLATFORMS,
  STATUSES,
} from "@/lib/constants";
import type { ContentItem, Settings } from "@/lib/types";
import { formatDate, formatTime } from "@/lib/utils";

/**
 * Shared editor for a content item — used by the Planner table and the
 * Calendar view. Covers the full workflow: Idea → Shoot → Editing →
 * Approval → Scheduled → Published.
 */
export default function ContentEditModal({
  item,
  onClose,
  onSaved,
  onDeleted,
}: {
  item: ContentItem | null;
  onClose: () => void;
  onSaved: (item: ContentItem) => void;
  onDeleted: (id: string) => void;
}) {
  const [draft, setDraft] = useState<ContentItem | null>(item);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);
  const [approvalNote, setApprovalNote] = useState("");
  const [approvedBy, setApprovedBy] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  useEffect(() => {
    setDraft(item);
    setApprovalNote("");
    setApprovedBy("");
  }, [item]);
  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then(setSettings)
      .catch(() => {});
  }, []);

  if (!draft) return null;
  const set = <K extends keyof ContentItem>(key: K, value: ContentItem[K]) =>
    setDraft((d) => (d ? { ...d, [key]: value } : d));

  const save = async () => {
    setSaving(true);
    const res = await fetch(`/api/content/${draft.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...draft, approvalNote, approvedBy }),
    });
    setSaving(false);
    if (res.ok) {
      onSaved(await res.json());
      onClose();
    }
  };

  const remove = async () => {
    if (!confirm("Delete this content item?")) return;
    await fetch(`/api/content/${draft.id}`, { method: "DELETE" });
    onDeleted(draft.id);
    onClose();
  };

  const uploadMedia = async (file: File) => {
    setUploadError("");
    setUploading(true);
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/media", { method: "POST", body: form });
    setUploading(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setUploadError(body.error ?? "Upload failed");
      return;
    }
    const { key, contentType } = await res.json();
    set("mediaKey", key);
    set("mediaContentType", contentType);
  };

  const removeMedia = () => {
    setDraft((d) => (d ? { ...d, mediaKey: undefined, mediaContentType: undefined } : d));
  };

  const teamSelect = (
    label: string,
    key: "designer" | "editor" | "shooter",
    people: string[]
  ) => (
    <Field label={label}>
      <Select value={draft[key]} onChange={(e) => set(key, e.target.value)}>
        <option value="">Unassigned</option>
        {[...new Set([...(people ?? []), draft[key]].filter(Boolean))].map(
          (p) => (
            <option key={p}>{p}</option>
          )
        )}
      </Select>
    </Field>
  );

  return (
    <Modal open onClose={onClose} title="Edit Content" wide>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Field label="Date">
            <TextInput
              type="date"
              value={draft.date}
              onChange={(e) => set("date", e.target.value)}
            />
          </Field>
          <Field label="Time">
            <TextInput
              type="time"
              value={draft.time}
              onChange={(e) => set("time", e.target.value)}
            />
          </Field>
          <Field label="Platform">
            <Select
              value={draft.platform}
              onChange={(e) => set("platform", e.target.value as ContentItem["platform"])}
            >
              {PLATFORMS.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </Select>
          </Field>
          <Field label="Type">
            <Select
              value={draft.type}
              onChange={(e) => set("type", e.target.value as ContentItem["type"])}
            >
              {CONTENT_TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </Select>
          </Field>
        </div>

        <Field label="Topic">
          <TextInput
            value={draft.topic}
            onChange={(e) => set("topic", e.target.value)}
          />
        </Field>
        <Field label="Caption">
          <TextArea
            value={draft.caption}
            onChange={(e) => set("caption", e.target.value)}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Hashtags">
            <TextArea
              rows={2}
              value={draft.hashtags}
              onChange={(e) => set("hashtags", e.target.value)}
            />
          </Field>
          <Field label="CTA">
            <TextArea
              rows={2}
              value={draft.cta}
              onChange={(e) => set("cta", e.target.value)}
            />
          </Field>
        </div>

        <Field label="Attachment (image or video, up to 25MB)">
          {draft.mediaKey ? (
            <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50/60 p-2">
              {draft.mediaContentType?.startsWith("video/") ? (
                <video
                  src={`/api/media/${draft.mediaKey}`}
                  controls
                  className="h-20 w-20 rounded-lg object-cover"
                />
              ) : (
                <img
                  src={`/api/media/${draft.mediaKey}`}
                  alt="Attachment"
                  className="h-20 w-20 rounded-lg object-cover"
                />
              )}
              <Button variant="secondary" onClick={removeMedia}>
                Remove
              </Button>
            </div>
          ) : (
            <input
              type="file"
              accept="image/*,video/*"
              disabled={uploading}
              onChange={(e) => e.target.files?.[0] && uploadMedia(e.target.files[0])}
              className="block w-full text-sm text-gray-500 file:mr-3 file:rounded-lg file:border-0 file:bg-primary-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-primary-600 hover:file:bg-primary-100"
            />
          )}
          {uploading && <p className="mt-1 text-xs text-gray-400">Uploading…</p>}
          {uploadError && <p className="mt-1 text-xs text-red-500">{uploadError}</p>}
        </Field>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {teamSelect("Designer", "designer", settings?.team.designers ?? [])}
          {teamSelect("Editor", "editor", settings?.team.editors ?? [])}
          {teamSelect("Shooter", "shooter", settings?.team.shooters ?? [])}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Approval">
            <Select
              value={draft.approval}
              onChange={(e) => set("approval", e.target.value as ContentItem["approval"])}
            >
              {APPROVAL_STATUSES.map((a) => (
                <option key={a}>{a}</option>
              ))}
            </Select>
          </Field>
          <Field label="Publish Status">
            <Select
              value={draft.status}
              onChange={(e) => set("status", e.target.value as ContentItem["status"])}
            >
              {STATUSES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </Select>
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Reviewer name (optional)">
            <TextInput
              placeholder="e.g. Rustabh"
              value={approvedBy}
              onChange={(e) => setApprovedBy(e.target.value)}
            />
          </Field>
          <Field label="Note for this approval change (optional)">
            <TextInput
              placeholder="Reason, feedback, or context…"
              value={approvalNote}
              onChange={(e) => setApprovalNote(e.target.value)}
            />
          </Field>
        </div>

        {draft.approvalHistory && draft.approvalHistory.length > 0 && (
          <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
              Approval History
            </div>
            <div className="max-h-36 space-y-2 overflow-y-auto">
              {[...draft.approvalHistory].reverse().map((h) => (
                <div key={h.id} className="flex items-start gap-2 text-xs">
                  <Badge
                    color={
                      h.status === "Approved"
                        ? "bg-green-50 text-green-700"
                        : h.status === "Rejected"
                          ? "bg-red-50 text-red-600"
                          : "bg-gray-100 text-gray-500"
                    }
                  >
                    {h.status}
                  </Badge>
                  <div className="min-w-0 flex-1 text-gray-600">
                    {h.note && <span>{h.note} — </span>}
                    <span className="text-gray-400">
                      {h.by} · {formatDate(h.at.slice(0, 10))} {formatTime(h.at.slice(11, 16))}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {draft.postedAt && (
          <p className="text-xs text-gray-400">
            Posted {formatDate(draft.postedAt.slice(0, 10))} at{" "}
            {formatTime(draft.postedAt.slice(11, 16))}
          </p>
        )}

        <div className="flex items-center justify-between pt-2">
          <Button variant="danger" onClick={remove}>
            Delete
          </Button>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
