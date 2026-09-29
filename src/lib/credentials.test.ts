import { beforeEach, describe, expect, it, vi } from "vitest";

const { findUnique, create, compare } = vi.hoisted(() => ({
  findUnique: vi.fn(),
  create: vi.fn(),
  compare: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: { user: { findUnique, create } },
}));

vi.mock("bcryptjs", () => ({ default: { compare } }));

import {
  authenticateCredentials,
  createCredentialsUser,
  isValidSchoolEmail,
  normalizeSchoolEmail,
} from "@/lib/credentials";

describe("username and password authentication", () => {
  beforeEach(() => {
    findUnique.mockReset();
    create.mockReset();
    compare.mockReset();
  });

  it("normalizes school email addresses and rejects other domains", () => {
    expect(normalizeSchoolEmail("  Student@PDSB.NET ")).toBe("student@pdsb.net");
    expect(isValidSchoolEmail("student@pdsb.net")).toBe(true);
    expect(isValidSchoolEmail("student@gmail.com")).toBe(false);
    expect(isValidSchoolEmail("student@pdsb.net.attacker.test")).toBe(false);
  });

  it("only authenticates a user when the stored password hash matches", async () => {
    findUnique.mockResolvedValue({
      id: "user-1",
      name: "Jamie",
      email: "jamie@pdsb.net",
      passwordHash: "hashed-password",
    });
    compare.mockResolvedValue(true);

    await expect(authenticateCredentials("Jamie@PDSB.NET", "correct-password")).resolves.toEqual({
      id: "user-1",
      name: "Jamie",
      email: "jamie@pdsb.net",
    });
    expect(findUnique).toHaveBeenCalledWith({ where: { email: "jamie@pdsb.net" } });

    compare.mockResolvedValue(false);
    await expect(authenticateCredentials("jamie@pdsb.net", "wrong-password")).resolves.toBeNull();
  });

  it("creates new credential accounts with a zero balance", async () => {
    create.mockResolvedValue({ id: "user-2", balance: "0" });

    await createCredentialsUser("jamie@pdsb.net", "Jamie", "bcrypt-hash");

    expect(create).toHaveBeenCalledWith({
      data: {
        email: "jamie@pdsb.net",
        name: "Jamie",
        passwordHash: "bcrypt-hash",
        balance: 0,
        role: "STUDENT",
      },
    });
  });

  it("rejects credentials outside the school domain without querying the database", async () => {
    await expect(authenticateCredentials("student@example.com", "password")).resolves.toBeNull();
    expect(findUnique).not.toHaveBeenCalled();
  });
});