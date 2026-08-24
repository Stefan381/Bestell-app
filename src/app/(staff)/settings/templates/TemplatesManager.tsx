"use client";

import { useState } from "react";
import type { MessageTemplateItem } from "@/lib/types";

const PLACEHOLDERS = ["kundeVorname", "kundeNachname", "artikel", "filiale", "abholhinweis"];

function TemplateForm({
  template,
  onSave,
  onDelete,
}: {
  template: MessageTemplateItem;
  onSave: (patch: Partial<MessageTemplateItem>) => void;
  onDelete: () => void;
}) {
  const [name, setName] = useState(template.name);
  const [subject, setSubject] = useState(template.subject ?? "");
  const [body, setBody] = useState(template.body);
  const [isDefault, setIsDefault] = useState(template.isDefault);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    await onSave({ name, subject: subject || null, body, isDefault });
    setSaving(false);
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-center justify-between">
        <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand-dark">
          {template.channel === "EMAIL" ? "E-Mail" : "WhatsApp"}
        </span>
        <button onClick={onDelete} className="text-xs text-red-600 hover:underline">
          Löschen
        </button>
      </div>
      <label className="mt-3 flex flex-col gap-1 text-sm">
        Name
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-lg border border-border px-2 py-1.5"
        />
      </label>
      {template.channel === "EMAIL" && (
        <label className="mt-2 flex flex-col gap-1 text-sm">
          Betreff
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="rounded-lg border border-border px-2 py-1.5"
          />
        </label>
      )}
      <label className="mt-2 flex flex-col gap-1 text-sm">
        Nachricht
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          className="rounded-lg border border-border px-2 py-1.5 font-mono text-xs"
        />
      </label>
      <label className="mt-2 flex items-center gap-2 text-sm">
        <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} />
        Standardvorlage für diesen Kanal
      </label>
      <button
        onClick={save}
        disabled={saving}
        className="mt-3 rounded-lg bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60"
      >
        {saving ? "Speichert…" : "Speichern"}
      </button>
    </div>
  );
}

export function TemplatesManager({ initialTemplates }: { initialTemplates: MessageTemplateItem[] }) {
  const [templates, setTemplates] = useState(initialTemplates);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(id: string, patch: Partial<MessageTemplateItem>) {
    const res = await fetch(`/api/templates/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Speichern fehlgeschlagen.");
      return;
    }
    setTemplates((prev) => prev.map((t) => (t.id === id ? data.template : t)));
  }

  async function handleDelete(id: string) {
    if (!confirm("Vorlage wirklich löschen?")) return;
    await fetch(`/api/templates/${id}`, { method: "DELETE" });
    setTemplates((prev) => prev.filter((t) => t.id !== id));
  }

  async function createTemplate(channel: "EMAIL" | "WHATSAPP") {
    const res = await fetch("/api/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: `Neue ${channel === "EMAIL" ? "E-Mail" : "WhatsApp"}-Vorlage`,
        channel,
        body: "Hallo {{kundeVorname}}, Ihre Bestellung ({{artikel}}) ist abholbereit.",
      }),
    });
    const data = await res.json();
    if (res.ok) setTemplates((prev) => [...prev, data.template]);
  }

  return (
    <div>
      <p className="text-sm text-foreground/60">
        Platzhalter: {PLACEHOLDERS.map((p) => `{{${p}}}`).join(", ")}
      </p>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <div className="mt-3 flex gap-2">
        <button
          onClick={() => createTemplate("EMAIL")}
          className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground/70 hover:border-brand hover:text-brand"
        >
          + E-Mail-Vorlage
        </button>
        <button
          onClick={() => createTemplate("WHATSAPP")}
          className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground/70 hover:border-brand hover:text-brand"
        >
          + WhatsApp-Vorlage
        </button>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {templates.map((t) => (
          <TemplateForm
            key={t.id}
            template={t}
            onSave={(patch) => handleSave(t.id, patch)}
            onDelete={() => handleDelete(t.id)}
          />
        ))}
      </div>
    </div>
  );
}
