"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { saveOrderNote } from "@/app/(dashboard)/orders/actions";
import { useI18n } from "@/i18n/provider";
import { Textarea } from "@/components/ui/Input";

export function OrderNote({
  orderId,
  initial,
}: {
  orderId: string;
  initial: string;
}) {
  const { dict } = useI18n();
  const t = dict.orders;
  const [notes, setNotes] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function onSave() {
    setSaving(true);
    setSaved(false);
    const res = await saveOrderNote(orderId, notes);
    setSaving(false);
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-zinc-900">{t.notes}</p>
      <Textarea
        value={notes}
        onChange={(e) => {
          setNotes(e.target.value);
          setSaved(false);
        }}
        maxLength={2000}
        placeholder={t.notesPlaceholder}
      />
      <div className="flex items-center gap-3">
        <button
          onClick={onSave}
          disabled={saving || notes === initial}
          className="rounded-xl border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 disabled:opacity-50"
        >
          {saving ? dict.common.saving : t.saveNote}
        </button>
        {saved && (
          <span className="inline-flex items-center gap-1 text-sm text-emerald-600">
            <Check className="size-4" /> {t.noteSaved}
          </span>
        )}
      </div>
    </div>
  );
}
