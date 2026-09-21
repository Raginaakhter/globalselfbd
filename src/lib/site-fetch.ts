import { apiFetch } from "@/lib/api";
import { EMPTY_SITE, type SiteData } from "@/lib/site-types";

/** Server-side helper: load storefront content from /api/site, falling back to safe empty defaults. */
export async function fetchSite(): Promise<SiteData> {
  try {
    return await apiFetch<SiteData>("/api/site");
  } catch (e) {
    console.error("Failed to fetch site data:", e);
    return EMPTY_SITE;
  }
}
