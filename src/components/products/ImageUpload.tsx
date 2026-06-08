"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ImagePlus, Loader2, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/i18n/provider";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];
const BUCKET = "product-images";

/** Extract the storage object path from a public bucket URL. */
function pathFromUrl(url: string): string | null {
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const i = url.indexOf(marker);
  return i === -1 ? null : url.slice(i + marker.length);
}

/**
 * Uploads a product photo to Supabase Storage under `<sellerId>/<uuid>.<ext>`
 * (storage RLS only permits the seller's own folder) and exposes the resulting
 * public URL via a hidden input named `image_url`.
 */
export function ImageUpload({
  sellerId,
  initialUrl,
}: {
  sellerId: string;
  initialUrl?: string | null;
}) {
  const { dict } = useI18n();
  const t = dict.products;
  const inputRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState<string | null>(initialUrl ?? null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onPick(file: File) {
    setError(null);
    if (!ALLOWED.includes(file.type)) return setError(t.imageType);
    if (file.size > MAX_BYTES) return setError(t.imageTooLarge);

    setUploading(true);
    const supabase = createClient();
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${sellerId}/${crypto.randomUUID()}.${ext}`;

    const { error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { cacheControl: "31536000", upsert: false });

    if (upErr) {
      setUploading(false);
      return setError(t.imageFailed);
    }

    // Remove the previously uploaded image (best effort) before swapping.
    const prev = url ? pathFromUrl(url) : null;
    if (prev) await supabase.storage.from(BUCKET).remove([prev]);

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    setUrl(data.publicUrl);
    setUploading(false);
  }

  async function onRemove() {
    if (url) {
      const path = pathFromUrl(url);
      if (path) {
        const supabase = createClient();
        await supabase.storage.from(BUCKET).remove([path]);
      }
    }
    setUrl(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="space-y-1.5">
      <span className="text-sm font-medium text-zinc-700">{t.image}</span>
      <input type="hidden" name="image_url" value={url ?? ""} />

      <div className="flex items-center gap-3">
        <div className="relative size-20 shrink-0 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50">
          {url ? (
            <Image src={url} alt="" fill sizes="80px" className="object-cover" />
          ) : (
            <div className="flex size-full items-center justify-center text-zinc-300">
              <ImagePlus className="size-6" />
            </div>
          )}
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/70">
              <Loader2 className="size-5 animate-spin text-zinc-500" />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
          >
            {uploading ? t.uploading : url ? t.changeImage : t.uploadImage}
          </button>
          {url && !uploading && (
            <button
              type="button"
              onClick={onRemove}
              className="inline-flex items-center gap-1 text-sm text-red-600"
            >
              <X className="size-3.5" /> {t.removeImage}
            </button>
          )}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED.join(",")}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onPick(file);
        }}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
