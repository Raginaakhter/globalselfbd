// Internal API fetch helper for server components.
// In server components, relative URLs don't work — this resolves the full base URL.

const getBaseUrl = () => {
  // Server-side: use the app URL from env, fallback to localhost
  if (typeof window === "undefined") {
    return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  }
  // Client-side: relative URLs work
  return "";
};

/**
 * Fetch wrapper for calling internal Next.js API routes from server components.
 * Handles base URL resolution and standard error handling.
 */
export async function apiFetch<T = unknown>(path: string, init?: RequestInit): Promise<T> {
  const url = `${getBaseUrl()}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? `API error ${res.status}`);
  }

  const json = await res.json();
  return json.data ?? json;
}

/**
 * Same as apiFetch but returns the full response shape { success, data, message }.
 */
export async function apiFetchRaw(path: string, init?: RequestInit) {
  const url = `${getBaseUrl()}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  return res.json();
}
