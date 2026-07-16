"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearch } from "@/components/layout/SearchProvider";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  Modal,
  PageHeader,
  Select,
  Spinner,
  TextArea,
  TextInput,
} from "@/components/ui";
import type { Client, Shoot } from "@/lib/types";
import { currentMonth, formatDate, formatTime, monthLabel, monthOptions, todayISO } from "@/lib/utils";

const EMPTY_SHOOT = (clientId: string): Omit<Shoot, "id" | "month"> => ({
  clientId,
  date: todayISO(),
  time: "10:00",
  location: "",
  products: "",
  models: "",
  equipment: "",
  shotList: "",
  referenceLink: "",
  completed: false,
});

export default function ShootsPage() {
  const [clients, setClients] = useState<Client[] | null>(null);
  const [shoots, setShoots] = useState<Shoot[] | null>(null);
  const [clientId, setClientId] = useState("");
  const [month, setMonth] = useState(currentMonth());
  const [editing, setEditing] = useState<Partial<Shoot> | null>(null);
  const [saving, setSaving] = useState(false);
  const { query } = useSearch();

  useEffect(() => {
    fetch("/api/clients")
      .then((r) => r.json())
      .then(setClients)
      .catch(() => {});
  }, []);

  const load = useCallback(() => {
    const params = new URLSearchParams({ month });
    if (clientId) params.set("clientId", clientId);
    fetch(`/api/shoots?${params}`)
      .then((r) => r.json())
      .then(setShoots)
      .catch(() => {});
  }, [clientId, month]);

  useEffect(load, [load]);

  const clientName = useCallback(
    (id: string) => {
      const c = clients?.find((x) => x.id === id);
      return c ? c.brandName || c.name : "—";
    },
    [clients]
  );

  const filtered = useMemo(() => {
    if (!shoots) return null;
    const q = query.toLowerCase();
    if (!q) return shoots;
    return shoots.filter((s) =>
      `${clientName(s.clientId)} ${s.location} ${s.shotList} ${s.products}`
        .toLowerCase()
        .includes(q)
    );
  }, [shoots, query, clientName]);

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    const isEdit = Boolean(editing.id);
    await fetch(isEdit ? `/api/shoots/${editing.id}` : "/api/shoots", {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editing),
    });
    setSaving(false);
    setEditing(null);
    load();
  };

  const toggleComplete = async (shoot: Shoot) => {
    await fetch(`/api/shoots/${shoot.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: !shoot.completed }),
    });
    load();
  };

  const remove = async (shoot: Shoot) => {
    if (!confirm("Delete this shoot?")) return;
    await fetch(`/api/shoots/${shoot.id}`, { method: "DELETE" });
    load();
  };

  if (!clients || !filtered) return <Spinner />;

  const set = <K extends keyof Shoot>(key: K, value: Shoot[K]) =>
    setEditing((e) => (e ? { ...e, [key]: value } : e));

  return (
    <div>
      <PageHeader
        title="Shoot Planner"
        subtitle={`${filtered.length} shoot${filtered.length === 1 ? "" : "s"} in ${monthLabel(month)}`}
        actions={
          <Button
            onClick={() => setEditing(EMPTY_SHOOT(clientId || clients[0]?.id || ""))}
            disabled={clients.length === 0}
          >
            + Add Shoot
          </Button>
        }
      />

      <Card className="mb-4">
        <div className="grid grid-cols-2 gap-3 lg:max-w-lg">
          <Select value={clientId} onChange={(e) => setClientId(e.target.value)}>
            <option value="">All clients</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.brandName || c.name}
              </option>
            ))}
          </Select>
          <Select value={month} onChange={(e) => setMonth(e.target.value)}>
            {monthOptions().map((m) => (
              <option key={m} value={m}>
                {monthLabel(m)}
              </option>
            ))}
          </Select>
        </div>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState
          title="No shoots planned"
          hint="Shoots are auto-generated from each client's package. You can also add one manually."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((shoot) => (
            <Card key={shoot.id} className={shoot.completed ? "opacity-70" : ""}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm font-semibold text-gray-900">
                    {clientName(shoot.clientId)}
                  </div>
                  <div className="mt-0.5 text-xs text-gray-400">
                    {formatDate(shoot.date)} · {formatTime(shoot.time)}
                  </div>
                </div>
                <Badge
                  color={
                    shoot.completed
                      ? "bg-green-50 text-green-700"
                      : "bg-amber-50 text-amber-700"
                  }
                >
                  {shoot.completed ? "Completed" : "Scheduled"}
                </Badge>
              </div>

              <div className="mt-3 space-y-1.5 text-xs text-gray-500">
                <InfoRow label="Location" value={shoot.location} />
                <InfoRow label="Products" value={shoot.products} />
                <InfoRow label="Models" value={shoot.models} />
                <InfoRow label="Equipment" value={shoot.equipment} />
                <InfoRow label="Shot list" value={shoot.shotList} />
                {shoot.referenceLink && (
                  <div>
                    <span className="font-medium text-gray-400">Reference: </span>
                    <a
                      href={shoot.referenceLink}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary-500 hover:underline"
                    >
                      {shoot.referenceLink}
                    </a>
                  </div>
                )}
              </div>

              <div className="mt-4 flex gap-2">
                <Button
                  variant={shoot.completed ? "secondary" : "primary"}
                  className="flex-1 justify-center"
                  onClick={() => toggleComplete(shoot)}
                >
                  {shoot.completed ? "Reopen" : "✓ Mark Complete"}
                </Button>
                <Button variant="secondary" onClick={() => setEditing(shoot)}>
                  Edit
                </Button>
                <Button variant="danger" onClick={() => remove(shoot)}>
                  ✕
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing?.id ? "Edit Shoot" : "Add Shoot"}
        wide
      >
        {editing && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <Field label="Client">
                <Select
                  value={editing.clientId}
                  onChange={(e) => set("clientId", e.target.value)}
                >
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.brandName || c.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Date">
                <TextInput
                  type="date"
                  value={editing.date ?? ""}
                  onChange={(e) => set("date", e.target.value)}
                />
              </Field>
              <Field label="Time">
                <TextInput
                  type="time"
                  value={editing.time ?? ""}
                  onChange={(e) => set("time", e.target.value)}
                />
              </Field>
            </div>
            <Field label="Location">
              <TextInput
                value={editing.location ?? ""}
                onChange={(e) => set("location", e.target.value)}
                placeholder="Studio A, client store, outdoor…"
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Required Products">
                <TextArea
                  rows={2}
                  value={editing.products ?? ""}
                  onChange={(e) => set("products", e.target.value)}
                />
              </Field>
              <Field label="Models Required">
                <TextArea
                  rows={2}
                  value={editing.models ?? ""}
                  onChange={(e) => set("models", e.target.value)}
                />
              </Field>
            </div>
            <Field label="Equipment">
              <TextInput
                value={editing.equipment ?? ""}
                onChange={(e) => set("equipment", e.target.value)}
                placeholder="Camera, tripod, lighting kit…"
              />
            </Field>
            <Field label="Shot List">
              <TextArea
                value={editing.shotList ?? ""}
                onChange={(e) => set("shotList", e.target.value)}
                placeholder="1. Hero product close-up&#10;2. Lifestyle wide shot&#10;3. Reel b-roll"
              />
            </Field>
            <Field label="Reference Link">
              <TextInput
                type="url"
                value={editing.referenceLink ?? ""}
                onChange={(e) => set("referenceLink", e.target.value)}
                placeholder="https://…"
              />
            </Field>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setEditing(null)}>
                Cancel
              </Button>
              <Button onClick={save} disabled={saving}>
                {saving ? "Saving…" : "Save Shoot"}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div>
      <span className="font-medium text-gray-400">{label}: </span>
      {value}
    </div>
  );
}
