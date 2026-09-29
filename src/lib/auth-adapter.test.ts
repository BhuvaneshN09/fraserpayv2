import { beforeEach, describe, expect, it, vi } from "vitest";
import type { PrismaClient } from "@prisma/client";
import { fraserPayAdapter } from "@/lib/auth-adapter";

const { createUser } = vi.hoisted(() => ({ createUser: vi.fn() }));

vi.mock("@auth/prisma-adapter", () => ({
  PrismaAdapter: () => ({ createUser }),
}));

describe("FraserPay Auth.js adapter", () => {
  beforeEach(() => createUser.mockReset());

  it("creates first-login users with a zero balance", async () => {
    const savedUser = { id: "user-1", balance: "0", email: "student@pdsb.net" };
    const userCreate = vi.fn().mockResolvedValue(savedUser);
    const client = { user: { create: userCreate } } as unknown as PrismaClient;
    const adapter = fraserPayAdapter(client);
    const newUser = {
      id: "user-1",
      name: "Student",
      email: "student@pdsb.net",
      emailVerified: null,
      image: null,
    };

    await expect(adapter.createUser(newUser)).resolves.toEqual(savedUser);
    expect(userCreate).toHaveBeenCalledWith({ data: { ...newUser, balance: 0 } });
  });
});