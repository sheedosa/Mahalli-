/** Storefront themes (ported from the Claude Design prototype). A seller picks
 *  one; it sets the CSS-variable palette on their storefront. The class names
 *  match the `.theme-*` rules in globals.css. */

export const THEME_IDS = [
  "cream",
  "mono",
  "pastel",
  "noir",
  "sage",
  "blush",
  "ocean",
] as const;

export type ThemeId = (typeof THEME_IDS)[number];

export const DEFAULT_THEME: ThemeId = "cream";

export function isThemeId(v: string | null | undefined): v is ThemeId {
  return !!v && (THEME_IDS as readonly string[]).includes(v);
}

export function themeClass(v: string | null | undefined): string {
  return `theme-${isThemeId(v) ? v : DEFAULT_THEME}`;
}

export type ThemeMeta = {
  id: ThemeId;
  swatch: string;
  surface: string;
  name: { ar: string; en: string };
  tag: { ar: string; en: string };
};

export const THEMES: ThemeMeta[] = [
  {
    id: "cream", swatch: "#0d9488", surface: "#f5efe4",
    name: { ar: "إيديتوريال كريم", en: "Editorial Cream" },
    tag: { ar: "كريمي + تركوازي · هادئ وراقٍ", en: "Cream + teal · calm & refined" },
  },
  {
    id: "mono", swatch: "#f97316", surface: "#ffffff",
    name: { ar: "مونو مينيمال", en: "Mono Minimal" },
    tag: { ar: "أبيض + أسود/برتقالي · جريء", en: "White + black/orange · bold minimal" },
  },
  {
    id: "pastel", swatch: "#7c3aed", surface: "#f3edff",
    name: { ar: "سوفت باستيل", en: "Soft Pastel" },
    tag: { ar: "تدرّج بنفسجي · شبابي ومرح", en: "Lavender gradient · youthful & fun" },
  },
  {
    id: "noir", swatch: "#d4a24e", surface: "#16161c",
    name: { ar: "نوار لوكس", en: "Noir Luxe" },
    tag: { ar: "داكن + ذهبي · فخم وأنيق", en: "Dark + gold · luxe & elegant" },
  },
  {
    id: "sage", swatch: "#5f7a4f", surface: "#f1f4ec",
    name: { ar: "سيج غاردن", en: "Sage Garden" },
    tag: { ar: "أخضر مريمية · طبيعي وعضوي", en: "Sage green · natural & organic" },
  },
  {
    id: "blush", swatch: "#e0567a", surface: "#fdf4f3",
    name: { ar: "بلاش روز", en: "Blush Rose" },
    tag: { ar: "وردي خوخي · ناعم ودافئ", en: "Blush pink · soft & warm" },
  },
  {
    id: "ocean", swatch: "#2563eb", surface: "#f3f7fc",
    name: { ar: "أوشن بلو", en: "Ocean Blue" },
    tag: { ar: "أبيض + أزرق · نظيف وعصري", en: "White + blue · clean & modern" },
  },
];
