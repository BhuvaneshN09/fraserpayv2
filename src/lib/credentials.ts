import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export function normalizeSchoolEmail(email: string) {
  return email.trim().toLowerCase();
}

export function isValidSchoolEmail(email: string) {
  const [localPart, domain, ...extra] = email.split("@");
  return Boolean(
    localPart &&
    localPart.length <= 64 &&
    !localPart.startsWith(".") &&
    !localPart.endsWith(".") &&
    !localPart.includes("..") &&
    domain === "pdsb.net" &&
    extra.length === 0 &&
    /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+$/.test(localPart),
  );
}

export async function createCredentialsUser(email: string, name: string, passwordHash: string) {
  return prisma.user.create({
    data: { email, name, passwordHash, balance: 0, role: "STUDENT" },
  });
}

export async function authenticateCredentials(email: string, password: string) {
  const normalizedEmail = normalizeSchoolEmail(email);
  if (!isValidSchoolEmail(normalizedEmail) || password.length === 0) return null;

  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (!user?.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) return null;

  return { id: user.id, name: user.name, email: user.email };
}