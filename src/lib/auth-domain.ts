export const ALLOWED_EMAIL_DOMAIN = "pdsb.net";

export function canSignInWithGoogle(
  provider: string | null | undefined,
  email: string | null | undefined,
  emailVerified: unknown,
): boolean {
  if (provider !== "google" || !email || emailVerified !== true) return false;

  const separator = email.indexOf("@");
  if (separator < 1 || separator !== email.lastIndexOf("@")) return false;

  return email.slice(separator + 1).toLowerCase() === ALLOWED_EMAIL_DOMAIN;
}