"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Badge,
  Button,
  Card,
  Field,
  PageHeader,
  Spinner,
  TextInput,
} from "@/components/ui";
import { PLATFORMS } from "@/lib/constants";
import type { Platform, PublicUser, Settings } from "@/lib/types";
import { formatDate } from "@/lib/utils";

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
        "Reset content data to fresh sample data? This deletes every client, plan, shoot and idea. Team logins are not affected."
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
            <Field label="Support Email">
              <TextInput
                type="email"
                value={settings.agencyEmail ?? ""}
                onChange={(e) =>
                  setSettings({ ...settings, agencyEmail: e.target.value })
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
            All app data lives in a Postgres database (Netlify DB).
          </p>
          <Button variant="danger" onClick={reset}>
            Reset to Sample Data
          </Button>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <UsersCard />
        <ChangePasswordCard />
      </div>
    </div>
  );
}

function UsersCard() {
  const [users, setUsers] = useState<PublicUser[] | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = () => {
    fetch("/api/users")
      .then((r) => r.json())
      .then(setUsers)
      .catch(() => {});
  };

  useEffect(load, []);

  const addUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    setSaving(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Failed to add user");
      return;
    }
    setUsername("");
    setPassword("");
    load();
  };

  const removeUser = async (id: string) => {
    if (!confirm("Remove this login? They won't be able to sign in anymore.")) return;
    const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      alert(body.error ?? "Failed to remove user");
      return;
    }
    load();
  };

  return (
    <Card>
      <h2 className="mb-1 text-sm font-semibold text-gray-800">Team Logins</h2>
      <p className="mb-4 text-xs text-gray-400">
        Add a username/password for each team member. No email delivery —
        share the password with them directly; they can change it after
        signing in.
      </p>

      {!users ? (
        <Spinner />
      ) : (
        <div className="mb-4 space-y-2">
          {users.map((u) => (
            <div
              key={u.id}
              className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2"
            >
              <div>
                <div className="text-sm font-medium text-gray-800">{u.username}</div>
                <div className="text-xs text-gray-400">
                  Added {formatDate(u.createdAt.slice(0, 10))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {users.length === 1 && <Badge>Only login</Badge>}
                <Button
                  variant="danger"
                  onClick={() => removeUser(u.id)}
                  className={users.length === 1 ? "pointer-events-none opacity-40" : ""}
                >
                  Remove
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={addUser} className="grid grid-cols-2 gap-3">
        <Field label="Username" className="col-span-1">
          <TextInput value={username} onChange={(e) => setUsername(e.target.value)} />
        </Field>
        <Field label="Password (min 8 chars)" className="col-span-1">
          <TextInput
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
        {error && <p className="col-span-2 text-xs text-red-500">{error}</p>}
        <div className="col-span-2">
          <Button type="submit" disabled={saving}>
            {saving ? "Adding…" : "+ Add Team Login"}
          </Button>
        </div>
      </form>
    </Card>
  );
}

function ChangePasswordCard() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [ok, setOk] = useState(false);
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setOk(false);
    setSaving(true);
    const res = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    setSaving(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Failed to change password");
      return;
    }
    setCurrentPassword("");
    setNewPassword("");
    setOk(true);
    setTimeout(() => setOk(false), 2000);
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <Card>
      <h2 className="mb-1 text-sm font-semibold text-gray-800">My Account</h2>
      <p className="mb-4 text-xs text-gray-400">Change your own password.</p>
      <form onSubmit={submit} className="space-y-3">
        <Field label="Current Password">
          <TextInput
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
        </Field>
        <Field label="New Password (min 8 chars)">
          <TextInput
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </Field>
        {error && <p className="text-xs text-red-500">{error}</p>}
        <div className="flex items-center justify-between pt-1">
          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : ok ? "✓ Changed" : "Change Password"}
          </Button>
          <Button variant="secondary" onClick={logout}>
            Log Out
          </Button>
        </div>
      </form>
    </Card>
  );
}
