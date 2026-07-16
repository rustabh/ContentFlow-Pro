"use client";

import { useState } from "react";
import { Button, Field, Select, TextArea, TextInput } from "@/components/ui";
import { INDUSTRIES, PLATFORMS, SHOOT_FREQUENCIES } from "@/lib/constants";
import type { Client, Platform } from "@/lib/types";

export type ClientDraft = Omit<Client, "id" | "createdAt">;

const EMPTY: ClientDraft = {
  name: "",
  brandName: "",
  industry: "Other",
  contactPerson: "",
  phone: "",
  email: "",
  packageStart: "",
  packageEnd: "",
  monthlyPosts: 12,
  monthlyReels: 8,
  monthlyStories: 20,
  shootDays: 4,
  shootFrequency: "Weekly",
  platforms: ["Instagram"],
  notes: "",
};

export default function ClientForm({
  initial,
  onSave,
  onCancel,
  saving,
}: {
  initial?: Client;
  onSave: (draft: ClientDraft) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [draft, setDraft] = useState<ClientDraft>(initial ?? EMPTY);
  const set = <K extends keyof ClientDraft>(key: K, value: ClientDraft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const togglePlatform = (p: Platform) =>
    set(
      "platforms",
      draft.platforms.includes(p)
        ? draft.platforms.filter((x) => x !== p)
        : [...draft.platforms, p]
    );

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave(draft);
      }}
      className="space-y-4"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Client Name *">
          <TextInput
            required
            value={draft.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Aurora Skin Clinic"
          />
        </Field>
        <Field label="Brand Name">
          <TextInput
            value={draft.brandName}
            onChange={(e) => set("brandName", e.target.value)}
            placeholder="Aurora Skin"
          />
        </Field>
        <Field label="Industry">
          <Select
            value={draft.industry}
            onChange={(e) => set("industry", e.target.value)}
          >
            {INDUSTRIES.map((i) => (
              <option key={i}>{i}</option>
            ))}
          </Select>
        </Field>
        <Field label="Contact Person">
          <TextInput
            value={draft.contactPerson}
            onChange={(e) => set("contactPerson", e.target.value)}
          />
        </Field>
        <Field label="Phone">
          <TextInput
            type="tel"
            value={draft.phone}
            onChange={(e) => set("phone", e.target.value)}
          />
        </Field>
        <Field label="Email">
          <TextInput
            type="email"
            value={draft.email}
            onChange={(e) => set("email", e.target.value)}
          />
        </Field>
        <Field label="Package Start Date">
          <TextInput
            type="date"
            value={draft.packageStart}
            onChange={(e) => set("packageStart", e.target.value)}
          />
        </Field>
        <Field label="Package End Date">
          <TextInput
            type="date"
            value={draft.packageEnd}
            onChange={(e) => set("packageEnd", e.target.value)}
          />
        </Field>
      </div>

      <div className="rounded-xl bg-gray-50 p-4">
        <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
          Monthly Package
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Field label="Posts">
            <TextInput
              type="number"
              min={0}
              value={draft.monthlyPosts}
              onChange={(e) => set("monthlyPosts", Number(e.target.value))}
            />
          </Field>
          <Field label="Reels">
            <TextInput
              type="number"
              min={0}
              value={draft.monthlyReels}
              onChange={(e) => set("monthlyReels", Number(e.target.value))}
            />
          </Field>
          <Field label="Stories">
            <TextInput
              type="number"
              min={0}
              value={draft.monthlyStories}
              onChange={(e) => set("monthlyStories", Number(e.target.value))}
            />
          </Field>
          <Field label="Shoot Days">
            <TextInput
              type="number"
              min={0}
              value={draft.shootDays}
              onChange={(e) => set("shootDays", Number(e.target.value))}
            />
          </Field>
        </div>
        <div className="mt-3 grid gap-4">
          <Field label="Shoot Frequency" className="sm:max-w-56">
            <Select
              value={draft.shootFrequency}
              onChange={(e) =>
                set("shootFrequency", e.target.value as ClientDraft["shootFrequency"])
              }
            >
              {SHOOT_FREQUENCIES.map((f) => (
                <option key={f}>{f}</option>
              ))}
            </Select>
          </Field>
          <Field label="Platforms">
            <div className="flex flex-wrap gap-2 pt-1">
              {PLATFORMS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => togglePlatform(p)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    draft.platforms.includes(p)
                      ? "bg-gradient-to-r from-brand-violet to-brand-magenta text-white"
                      : "bg-white text-gray-500 ring-1 ring-gray-200 hover:bg-gray-100"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </Field>
        </div>
      </div>

      <Field label="Notes">
        <TextArea
          value={draft.notes}
          onChange={(e) => set("notes", e.target.value)}
          placeholder="Brand guidelines, do's and don'ts, references…"
        />
      </Field>

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : initial ? "Save Changes" : "Add Client"}
        </Button>
      </div>
    </form>
  );
}
