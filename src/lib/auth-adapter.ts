import { PrismaAdapter } from "@auth/prisma-adapter";
import type { PrismaClient } from "@prisma/client";
import type { AdapterUser } from "next-auth/adapters";

export function fraserPayAdapter(client: PrismaClient) {
  const adapter = PrismaAdapter(client);

  return {
    ...adapter,
    async createUser(
      user: Parameters<NonNullable<typeof adapter.createUser>>[0],
    ): Promise<AdapterUser> {
      const createdUser = await client.user.create({ data: { ...user, balance: 0 } });
      return { ...createdUser, email: user.email };
    },
  };
}