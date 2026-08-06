"use client";

import { useState } from "react";
import { Button, Field, Select, TextArea, TextInput } from "@/components/ui";
import { INDUSTRIES, PLATFORMS, SHOOT_FREQUENCIES } from "@/lib/constants";
import type { Client, Platform } from "@/lib/types";

export type ClientDraft = Omit<Client, "id" | "createdAt">;

type ConnectablePlatform = "Instagram" | "Facebook" | "LinkedIn" | "YouTube";

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

  const setConnection = (
    platform: ConnectablePlatform,
    field: "accessToken" | "accountId" | "refreshToken" | "clientId" | "clientSecret",
    value: string
  ) =>
    setDraft((d) => {
      const existing = d.connections?.[platform] ?? { accessToken: "", accountId: "" };
      return {
        ...d,
        connections: { ...d.connections, [platform]: { ...existing, [field]: value } },
      };
    });

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

      <div className="rounded-xl bg-gray-50 p-4">
        <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
          Platform Connections (Optional)
        </div>
        <p className="mb-3 text-xs text-gray-400">
          Connect this client&apos;s accounts to enable real auto-posting from
          the Scheduling Queue. Each platform needs its own developer app —
          leave any of these blank to keep the manual workflow for that
          platform (queue items are just marked Posted).
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <div className="text-xs font-semibold text-gray-600">Instagram</div>
            <Field label="IG Business Account ID">
              <TextInput
                value={draft.connections?.Instagram?.accountId ?? ""}
                onChange={(e) => setConnection("Instagram", "accountId", e.target.value)}
              />
            </Field>
            <Field label="Access Token">
              <TextInput
                type="password"
                value={draft.connections?.Instagram?.accessToken ?? ""}
                onChange={(e) => setConnection("Instagram", "accessToken", e.target.value)}
              />
            </Field>
          </div>
          <div className="space-y-2">
            <div className="text-xs font-semibold text-gray-600">Facebook</div>
            <Field label="Page ID">
              <TextInput
                value={draft.connections?.Facebook?.accountId ?? ""}
                onChange={(e) => setConnection("Facebook", "accountId", e.target.value)}
              />
            </Field>
            <Field label="Access Token">
              <TextInput
                type="password"
                value={draft.connections?.Facebook?.accessToken ?? ""}
                onChange={(e) => setConnection("Facebook", "accessToken", e.target.value)}
              />
            </Field>
          </div>
          <div className="space-y-2">
            <div className="text-xs font-semibold text-gray-600">LinkedIn</div>
            <p className="text-[11px] text-gray-400">
              Company Page posts only, text + hashtags (no image yet).
            </p>
            <Field label="Organization ID">
              <TextInput
                placeholder="the number in urn:li:organization:…"
                value={draft.connections?.LinkedIn?.accountId ?? ""}
                onChange={(e) => setConnection("LinkedIn", "accountId", e.target.value)}
              />
            </Field>
            <Field label="Access Token">
              <TextInput
                type="password"
                value={draft.connections?.LinkedIn?.accessToken ?? ""}
                onChange={(e) => setConnection("LinkedIn", "accessToken", e.target.value)}
              />
            </Field>
          </div>
          <div className="space-y-2">
            <div className="text-xs font-semibold text-gray-600">YouTube</div>
            <p className="text-[11px] text-gray-400">
              Content item needs an attached video — title/description come
              from Topic/Caption. Tokens expire hourly, so a refresh token +
              OAuth client credentials are required.
            </p>
            <Field label="Access Token">
              <TextInput
                type="password"
                value={draft.connections?.YouTube?.accessToken ?? ""}
                onChange={(e) => setConnection("YouTube", "accessToken", e.target.value)}
              />
            </Field>
            <Field label="Refresh Token">
              <TextInput
                type="password"
                value={draft.connections?.YouTube?.refreshToken ?? ""}
                onChange={(e) => setConnection("YouTube", "refreshToken", e.target.value)}
              />
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="OAuth Client ID">
                <TextInput
                  value={draft.connections?.YouTube?.clientId ?? ""}
                  onChange={(e) => setConnection("YouTube", "clientId", e.target.value)}
                />
              </Field>
              <Field label="OAuth Client Secret">
                <TextInput
                  type="password"
                  value={draft.connections?.YouTube?.clientSecret ?? ""}
                  onChange={(e) => setConnection("YouTube", "clientSecret", e.target.value)}
                />
              </Field>
            </div>
          </div>
        </div>
      </div>

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
