import { PrismaClient } from "@prisma/client";

const [rawEmail, role] = process.argv.slice(2);
const email = rawEmail?.trim().toLowerCase();
const validEmail = typeof email === "string" && /^[^\s@]+@pdsb\.net$/.test(email);

if (!validEmail || !["STUDENT", "SAC_ADMIN", "ADMIN"].includes(role)) {
  console.error("Usage: npm run user:role -- <user@pdsb.net> <STUDENT|SAC_ADMIN|ADMIN>");
  process.exitCode = 2;
} else {
  const prisma = new PrismaClient();
  try {
    const user = await prisma.user.update({ where: { email }, data: { role } });
    console.log(`${user.email} role set to ${user.role}.`);
  } catch (error) {
    const code = error?.code;
    console.error(code === "P2025" ? "No account exists for that school email." : "Role update failed.");
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}