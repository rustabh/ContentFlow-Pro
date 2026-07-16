"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearch } from "@/components/layout/SearchProvider";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  PageHeader,
  Select,
  Spinner,
} from "@/components/ui";
import type { Client, Idea } from "@/lib/types";

export default function IdeasPage() {
  const [clients, setClients] = useState<Client[] | null>(null);
  const [ideas, setIdeas] = useState<Idea[] | null>(null);
  const [clientId, setClientId] = useState("");
  const [generating, setGenerating] = useState(false);
  const { query } = useSearch();

  useEffect(() => {
    fetch("/api/clients")
      .then((r) => r.json())
      .then((list: Client[]) => {
        setClients(list);
        if (list.length > 0) setClientId((id) => id || list[0].id);
      })
      .catch(() => {});
  }, []);

  const load = useCallback(() => {
    const params = clientId ? `?clientId=${clientId}` : "";
    fetch(`/api/ideas${params}`)
      .then((r) => r.json())
      .then(setIdeas)
      .catch(() => {});
  }, [clientId]);

  useEffect(load, [load]);

  const client = clients?.find((c) => c.id === clientId);

  const filtered = useMemo(() => {
    if (!ideas) return null;
    const q = query.toLowerCase();
    if (!q) return ideas;
    return ideas.filter((i) =>
      `${i.topic} ${i.hook} ${i.caption} ${i.script}`.toLowerCase().includes(q)
    );
  }, [ideas, query]);

  const generate = async () => {
    if (!clientId) return;
    setGenerating(true);
    await fetch("/api/ideas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId, count: 6 }),
    });
    setGenerating(false);
    load();
  };

  const remove = async (idea: Idea) => {
    await fetch(`/api/ideas/${idea.id}`, { method: "DELETE" });
    load();
  };

  if (!clients || !filtered) return <Spinner />;

  return (
    <div>
      <PageHeader
        title="Content Ideas"
        subtitle={
          client
            ? `Ideas for ${client.brandName || client.name} · ${client.industry}`
            : "Industry-based idea generator"
        }
        actions={
          <div className="flex gap-2">
            <Select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="!w-48"
            >
              <option value="">All clients</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.brandName || c.name}
                </option>
              ))}
            </Select>
            <Button onClick={generate} disabled={!clientId || generating}>
              {generating ? "Generating…" : "💡 Generate Ideas"}
            </Button>
          </div>
        }
      />

      {filtered.length === 0 ? (
        <EmptyState
          title="No ideas yet"
          hint="Pick a client and generate ideas tailored to their industry — complete with hook, script, caption, CTA and hashtags."
          action={
            clientId ? (
              <Button onClick={generate} disabled={generating}>
                {generating ? "Generating…" : "💡 Generate Ideas"}
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((idea) => (
            <Card key={idea.id} className="flex flex-col">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-semibold text-gray-900">
                  {idea.topic}
                </h3>
                <Badge color="bg-primary-50 text-primary-600">
                  {idea.industry || "General"}
                </Badge>
              </div>

              <div className="mt-3 space-y-2.5 text-xs">
                <IdeaBlock label="Hook" text={idea.hook} highlight />
                <IdeaBlock label="Script" text={idea.script} />
                <IdeaBlock label="Caption" text={idea.caption} />
                <IdeaBlock label="CTA" text={idea.cta} />
                <div className="text-primary-500">{idea.hashtags}</div>
              </div>

              <div className="mt-auto pt-4">
                <Button
                  variant="ghost"
                  className="text-xs text-gray-400 hover:text-red-500"
                  onClick={() => remove(idea)}
                >
                  Remove
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function IdeaBlock({
  label,
  text,
  highlight = false,
}: {
  label: string;
  text: string;
  highlight?: boolean;
}) {
  return (
    <div className={highlight ? "rounded-lg bg-primary-50 p-2.5" : ""}>
      <div className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
        {label}
      </div>
      <p className={`mt-0.5 leading-relaxed ${highlight ? "font-medium text-primary-700" : "text-gray-600"}`}>
        {text}
      </p>
    </div>
  );
}
