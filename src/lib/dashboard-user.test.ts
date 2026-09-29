import { beforeEach, describe, expect, it, vi } from "vitest";

const { findUnique } = vi.hoisted(() => ({ findUnique: vi.fn() }));

vi.mock("@/lib/prisma", () => ({
  prisma: { user: { findUnique } },
}));

import { getDashboardUser } from "@/lib/dashboard-user";

describe("dashboard account access", () => {
  beforeEach(() => findUnique.mockReset());

  it("does not query the database without a signed-in user", async () => {
    await expect(getDashboardUser(undefined)).resolves.toBeNull();
    expect(findUnique).not.toHaveBeenCalled();
  });

  it("loads only the account identified by the authenticated session", async () => {
    findUnique.mockResolvedValue({ id: "session-user", balance: "0" });

    await getDashboardUser("session-user");

    expect(findUnique).toHaveBeenCalledWith({
      where: { id: "session-user" },
      select: { id: true, name: true, email: true, balance: true, role: true },
    });
  });
});