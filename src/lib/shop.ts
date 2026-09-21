
export type ShippingZone = "dhaka" | "outside";

export const formatPrice = (n: number) => `৳${n.toLocaleString("en-US")}`;

export type CartLine = { id: string; qty: number };

// Product shape as returned by the cart/calculate API — a subset of the full Product
export type CartProduct = {
  id: string;
  name: string;
  brand: string;
  category: string;
  size: string;
  price: number;
  rrp?: number | null;
  emoji: string;
  tint: string;
  image?: string | null;
  badge?: string | null;
  rating: number;
  reviews: number;
  stock: number;
};

export type DetailedLine = { product: CartProduct; qty: number; lineTotal: number };


export type PaymentMethod = "cod";
