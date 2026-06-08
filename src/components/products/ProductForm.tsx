"use client";

import { useActionState, useState } from "react";
import {
  saveProduct,
  type ProductFormState,
} from "@/app/(dashboard)/products/actions";
import { useI18n } from "@/i18n/provider";
import { Input, Textarea, Field } from "@/components/ui/Input";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { Card } from "@/components/ui/Card";
import { ImageUpload } from "@/components/products/ImageUpload";
import { VariantsEditor, type VariantRow } from "@/components/products/VariantsEditor";

export type ProductInitial = {
  id?: string;
  name: string;
  description: string;
  price: string;
  category: string;
  stock: string;
  active: boolean;
  imageUrl: string | null;
  variants: VariantRow[];
};

export function ProductForm({
  sellerId,
  initial,
}: {
  sellerId: string;
  initial: ProductInitial;
}) {
  const { dict } = useI18n();
  const t = dict.products;
  const isEdit = Boolean(initial.id);

  const [active, setActive] = useState(initial.active);
  const [state, formAction] = useActionState<ProductFormState, FormData>(
    saveProduct,
    {},
  );

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {initial.id && <input type="hidden" name="id" value={initial.id} />}
      <input type="hidden" name="active" value={active ? "true" : "false"} />

      <Card className="space-y-4">
        <ImageUpload sellerId={sellerId} initialUrl={initial.imageUrl} />

        <Field label={t.name} htmlFor="name">
          <Input
            id="name"
            name="name"
            required
            maxLength={200}
            placeholder={t.namePlaceholder}
            defaultValue={initial.name}
          />
        </Field>

        <Field
          label={t.description}
          htmlFor="description"
          optional={dict.common.optional}
        >
          <Textarea
            id="description"
            name="description"
            maxLength={2000}
            placeholder={t.descriptionPlaceholder}
            defaultValue={initial.description}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label={t.price} htmlFor="price">
            <Input
              id="price"
              name="price"
              type="number"
              inputMode="decimal"
              min={0}
              step="0.01"
              required
              dir="ltr"
              defaultValue={initial.price}
            />
          </Field>
          <Field label={t.stock} htmlFor="stock" hint={t.stockHint}>
            <Input
              id="stock"
              name="stock"
              type="number"
              inputMode="numeric"
              min={0}
              required
              dir="ltr"
              defaultValue={initial.stock}
            />
          </Field>
        </div>

        <Field label={t.category} htmlFor="category" optional={dict.common.optional}>
          <Input
            id="category"
            name="category"
            maxLength={80}
            placeholder={t.categoryPlaceholder}
            defaultValue={initial.category}
          />
        </Field>

        <label className="flex items-center justify-between gap-3">
          <span className="text-sm font-medium text-zinc-700">{t.visible}</span>
          <button
            type="button"
            role="switch"
            aria-checked={active}
            onClick={() => setActive((v) => !v)}
            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
              active ? "bg-zinc-900" : "bg-zinc-300"
            }`}
          >
            <span
              className={`absolute top-0.5 size-5 rounded-full bg-white transition-all ${
                active ? "start-[1.375rem]" : "start-0.5"
              }`}
            />
          </button>
        </label>
      </Card>

      <Card>
        <VariantsEditor initial={initial.variants} />
      </Card>

      {state.error && (
        <p className="text-sm text-red-600">{t.saveError}</p>
      )}

      <SubmitButton size="lg" pendingLabel={dict.common.saving}>
        {isEdit ? t.saveChanges : t.create}
      </SubmitButton>
    </form>
  );
}
