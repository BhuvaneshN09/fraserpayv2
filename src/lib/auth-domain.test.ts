import { describe, expect, it } from "vitest";
import { canSignInWithGoogle } from "@/lib/auth-domain";

describe("Google sign-in policy", () => {
  it("allows verified addresses at the exact approved domain", () => {
    expect(canSignInWithGoogle("google", "student@pdsb.net", true)).toBe(true);
    expect(canSignInWithGoogle("google", "STUDENT@PDSB.NET", true)).toBe(true);
  });

  it.each([
    ["different domain", "student@gmail.com", true],
    ["subdomain", "student@mail.pdsb.net", true],
    ["lookalike domain", "student@pdsb.net.example.com", true],
    ["malformed address", "student@other@pdsb.net", true],
    ["unverified address", "student@pdsb.net", false],
    ["different provider", "student@pdsb.net", true, "github"],
    ["missing address", null, true],
  ])("rejects %s", (_reason, email, verified, provider = "google") => {
    expect(canSignInWithGoogle(provider, email, verified)).toBe(false);
  });
});