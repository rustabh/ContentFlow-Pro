"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import ClientForm, { ClientDraft } from "@/components/clients/ClientForm";
import { useSearch } from "@/components/layout/SearchProvider";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Modal,
  PageHeader,
  Spinner,
} from "@/components/ui";
import type { Client } from "@/lib/types";
import { formatDate, isClientActive } from "@/lib/utils";

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[] | null>(null);
  const [modal, setModal] = useState<"add" | Client | null>(null);
  const [saving, setSaving] = useState(false);
  const { query } = useSearch();

  const load = useCallback(() => {
    fetch("/api/clients")
      .then((r) => r.json())
      .then(setClients)
      .catch(() => {});
  }, []);

  useEffect(load, [load]);

  const filtered = useMemo(() => {
    if (!clients) return null;
    const q = query.toLowerCase();
    if (!q) return clients;
    return clients.filter((c) =>
      `${c.name} ${c.brandName} ${c.industry} ${c.contactPerson}`
        .toLowerCase()
        .includes(q)
    );
  }, [clients, query]);

  const save = async (draft: ClientDraft) => {
    setSaving(true);
    const isEdit = modal !== "add" && modal !== null;
    await fetch(isEdit ? `/api/clients/${(modal as Client).id}` : "/api/clients", {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });
    setSaving(false);
    setModal(null);
    load();
  };

  const remove = async (client: Client) => {
    if (
      !confirm(
        `Delete ${client.name}? This removes their content plan, shoots and ideas.`
      )
    )
      return;
    await fetch(`/api/clients/${client.id}`, { method: "DELETE" });
    load();
  };

  if (!filtered) return <Spinner />;

  return (
    <div>
      <PageHeader
        title="Clients"
        subtitle={`${filtered.length} client${filtered.length === 1 ? "" : "s"}`}
        actions={<Button onClick={() => setModal("add")}>+ Add Client</Button>}
      />

      {filtered.length === 0 ? (
        <EmptyState
          title={query ? "No clients match your search" : "No clients yet"}
          hint={
            query
              ? "Try a different search term."
              : "Add your first client — their monthly plan, shoots and starter ideas are generated automatically."
          }
          action={
            !query && <Button onClick={() => setModal("add")}>+ Add Client</Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((client) => {
            const active = isClientActive(client.packageStart, client.packageEnd);
            return (
              <Card key={client.id} className="flex flex-col">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate text-base font-semibold text-gray-900">
                        {client.brandName || client.name}
                      </h3>
                      <Badge
                        color={
                          active
                            ? "bg-green-50 text-green-700"
                            : "bg-gray-100 text-gray-500"
                        }
                      >
                        {active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div className="mt-0.5 text-xs text-gray-400">
                      {client.name} · {client.industry}
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-4 gap-2 text-center">
                  {[
                    ["Posts", client.monthlyPosts],
                    ["Reels", client.monthlyReels],
                    ["Stories", client.monthlyStories],
                    ["Shoots", client.shootDays],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-xl bg-gray-50 py-2">
                      <div className="text-sm font-bold text-gray-800">{value}</div>
                      <div className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
                        {label}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 space-y-1.5 text-xs text-gray-500">
                  {client.contactPerson && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">👤</span>
                      {client.contactPerson}
                      {client.phone ? ` · ${client.phone}` : ""}
                    </div>
                  )}
                  {client.email && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">✉️</span>
                      {client.email}
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">📅</span>
                    {client.packageStart ? formatDate(client.packageStart) : "—"} →{" "}
                    {client.packageEnd ? formatDate(client.packageEnd) : "—"}
                  </div>
                  <div className="flex items-center gap-1.5 pt-1">
                    {client.platforms.map((p) => (
                      <Badge key={p} color="bg-primary-50 text-primary-600">
                        {p}
                      </Badge>
                    ))}
                  </div>
                </div>

                {client.notes && (
                  <p className="mt-3 line-clamp-2 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-500">
                    {client.notes}
                  </p>
                )}

                <div className="mt-auto flex gap-2 pt-4">
                  <Button
                    variant="secondary"
                    className="flex-1 justify-center"
                    onClick={() => setModal(client)}
                  >
                    Edit
                  </Button>
                  <Button variant="danger" onClick={() => remove(client)}>
                    Delete
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        open={modal !== null}
        onClose={() => setModal(null)}
        title={modal === "add" ? "Add Client" : "Edit Client"}
        wide
      >
        {modal !== null && (
          <ClientForm
            key={modal === "add" ? "add" : modal.id}
            initial={modal === "add" ? undefined : modal}
            onSave={save}
            onCancel={() => setModal(null)}
            saving={saving}
          />
        )}
      </Modal>
    </div>
  );
}
