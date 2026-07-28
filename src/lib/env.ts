function decodeBase64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));

  try {
    return atob(`${normalized}${padding}`);
  } catch {
    return null;
  }
}

function getSupabaseKeyRole(key: string) {
  if (!key) {
    return null;
  }

  const payloadSegment = key.split(".")[1];
  if (!payloadSegment) {
    return null;
  }

  const decodedPayload = decodeBase64Url(payloadSegment);
  if (!decodedPayload) {
    return null;
  }

  try {
    const parsed = JSON.parse(decodedPayload) as { role?: unknown };
    return typeof parsed.role === "string" ? parsed.role : null;
  } catch {
    return null;
  }
}

function getSupabaseProjectRef(url: string) {
  if (!url) {
    return null;
  }

  try {
    const parsedUrl = new URL(url);
    const hostnameParts = parsedUrl.hostname.split(".");
    return hostnameParts[0] || null;
  } catch {
    return null;
  }
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() ?? "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? "";
const supabaseKeyRole = getSupabaseKeyRole(supabaseAnonKey);
const supabaseProjectRef = getSupabaseProjectRef(supabaseUrl);

let supabaseConfigError: string | null = null;

if (!supabaseUrl || !supabaseAnonKey) {
  supabaseConfigError =
    "Add both VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment.";
} else if (supabaseKeyRole === "service_role") {
  supabaseConfigError =
    "The frontend is using a Supabase service_role key. Replace it with the public anon/publishable key from Project Settings > API and rotate the exposed service_role key immediately.";
}

export const env = {
  supabaseUrl,
  supabaseAnonKey,
  supabaseKeyRole,
  supabaseProjectRef,
  supabaseStorageKey: `bot-drive-auth:${supabaseProjectRef ?? "default"}`,
  supabaseConfigError,
  isSupabaseConfigured: Boolean(supabaseUrl && supabaseAnonKey && !supabaseConfigError),
};
