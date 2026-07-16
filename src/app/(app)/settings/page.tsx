"use client";

import { useEffect, useState } from "react";
import {
  Button,
  Card,
  Field,
  PageHeader,
  Spinner,
  TextInput,
} from "@/components/ui";
import { PLATFORMS } from "@/lib/constants";
import type { Platform, Settings } from "@/lib/types";

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then(setSettings)
      .catch(() => {});
  }, []);

  if (!settings) return <Spinner />;

  const save = async () => {
    setSaving(true);
    await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const reset = async () => {
    if (
      !confirm(
        "Reset ALL data to fresh sample data? This deletes every client, plan, shoot and idea."
      )
    )
      return;
    await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reset" }),
    });
    window.location.href = "/";
  };

  const setTimes = (platform: Platform, value: string) =>
    setSettings((s) =>
      s
        ? {
            ...s,
            postingTimes: {
              ...s.postingTimes,
              [platform]: value
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean),
            },
          }
        : s
    );

  const setTeam = (role: keyof Settings["team"], value: string) =>
    setSettings((s) =>
      s
        ? {
            ...s,
            team: {
              ...s.team,
              [role]: value
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean),
            },
          }
        : s
    );

  return (
    <div>
      <PageHeader
        title="Settings"
        subtitle="Agency preferences used across planning and exports"
        actions={
          <Button onClick={save} disabled={saving}>
            {saving ? "Saving…" : saved ? "✓ Saved" : "Save Settings"}
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 text-sm font-semibold text-gray-800">Agency</h2>
          <div className="space-y-4">
            <Field label="Agency Name">
              <TextInput
                value={settings.agencyName}
                onChange={(e) =>
                  setSettings({ ...settings, agencyName: e.target.value })
                }
              />
            </Field>
            <Field label="Footer Text">
              <TextInput
                value={settings.footerText}
                onChange={(e) =>
                  setSettings({ ...settings, footerText: e.target.value })
                }
              />
            </Field>
          </div>
        </Card>

        <Card>
          <h2 className="mb-1 text-sm font-semibold text-gray-800">
            Best Posting Times
          </h2>
          <p className="mb-4 text-xs text-gray-400">
            Comma-separated 24h times, rotated when generating plans.
          </p>
          <div className="space-y-4">
            {PLATFORMS.map((p) => (
              <Field key={p} label={p}>
                <TextInput
                  value={settings.postingTimes[p]?.join(", ") ?? ""}
                  onChange={(e) => setTimes(p, e.target.value)}
                  placeholder="11:00, 14:00, 19:00"
                />
              </Field>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="mb-1 text-sm font-semibold text-gray-800">Team</h2>
          <p className="mb-4 text-xs text-gray-400">
            Comma-separated names, auto-assigned when generating plans.
          </p>
          <div className="space-y-4">
            <Field label="Designers">
              <TextInput
                value={settings.team.designers.join(", ")}
                onChange={(e) => setTeam("designers", e.target.value)}
              />
            </Field>
            <Field label="Editors">
              <TextInput
                value={settings.team.editors.join(", ")}
                onChange={(e) => setTeam("editors", e.target.value)}
              />
            </Field>
            <Field label="Shooters">
              <TextInput
                value={settings.team.shooters.join(", ")}
                onChange={(e) => setTeam("shooters", e.target.value)}
              />
            </Field>
          </div>
        </Card>

        <Card>
          <h2 className="mb-1 text-sm font-semibold text-gray-800">Data</h2>
          <p className="mb-4 text-xs text-gray-400">
            All data is stored locally in <code>data/db.json</code> — easy to
            swap for a real database later.
          </p>
          <Button variant="danger" onClick={reset}>
            Reset to Sample Data
          </Button>
        </Card>
      </div>
    </div>
  );
}
