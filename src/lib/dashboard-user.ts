import { prisma } from "@/lib/prisma";

export async function getDashboardUser(sessionUserId: string | undefined) {
  if (!sessionUserId) return null;

  return prisma.user.findUnique({
    where: { id: sessionUserId },
    select: { id: true, name: true, email: true, balance: true, role: true },
  });
}