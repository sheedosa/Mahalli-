export type StorefrontVariant = {
  id: string;
  label: string;
  price_override: number | null;
  stock: number;
};

export type StorefrontProduct = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category: string | null;
  stock: number;
  variants: StorefrontVariant[];
};

export type DeliveryArea = { area: string; fee: number };

export type StorefrontShop = {
  name: string;
  slug: string;
  city: string | null;
  logo_url: string | null;
  contact_phone: string | null;
  lang: "ar" | "en";
  delivery_areas: DeliveryArea[];
};

export type StorefrontData = {
  shop: StorefrontShop;
  products: StorefrontProduct[];
};

export type CartLineInput = {
  product_id: string;
  variant_id: string | null;
  qty: number;
};
