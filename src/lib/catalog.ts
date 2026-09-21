// Product shape as returned by the /api/products endpoints (data lives in the database — see prisma/seed.ts).

export type Product = {
  id: string;
  name: string;
  brand: string;
  category: string; // matches Category.slug
  size: string;
  price: number;
  rrp?: number | null;
  emoji: string;
  tint: string; // tailwind bg class for the product tile
  image?: string | null; // photo URL/path; the emoji tile is shown when empty
  badge?: string | null;
  rating: number;
  reviews: number;
  stock: number;
  description: string;
  highlights: string[];
};
