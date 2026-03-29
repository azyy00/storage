export const BOT_ADMIN_EMAIL = "goacommunitycollege@gmail.com";

export function normalizeEmail(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? "";
}

export function isAdminEmail(value: string | null | undefined) {
  return normalizeEmail(value) === BOT_ADMIN_EMAIL;
}
