"use client";

import { useEffect, useState } from "react";
import {
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

  useEffect(() => setDraft(item), [item]);
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
      body: JSON.stringify(draft),
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
