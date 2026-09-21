"use client";

import React, { createContext, useContext } from "react";
import { EMPTY_SITE, type SiteData } from "@/lib/site-types";

const SiteContext = createContext<SiteData>(EMPTY_SITE);

// Storefront content (categories, contact info, banners…) fetched from /api/site by the root layout.
export function SiteProvider({ value, children }: { value: SiteData; children: React.ReactNode }) {
  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>;
}

export function useSite(): SiteData {
  return useContext(SiteContext);
}
