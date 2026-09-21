// Storefront content (categories, banners, contact info…) now lives in the database and is served by
// /api/site — see @/lib/site-types for the shapes and @/context/SiteContext (useSite) to read it.

export type { Product } from "@/lib/catalog";
export type { Category } from "@/lib/site-types";
