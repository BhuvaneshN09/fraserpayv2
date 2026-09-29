"use server";

import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { redirect } from "next/navigation";
import { createCredentialsUser, isValidSchoolEmail, normalizeSchoolEmail } from "@/lib/credentials";

export async function registerAction(_previousState: string | null, formData: FormData) {
  const rawName = formData.get("name");
  const rawEmail = formData.get("email");
  const password = formData.get("password");
  const confirmPassword = formData.get("confirmPassword");

  if (
    typeof rawName !== "string" || typeof rawEmail !== "string" ||
    typeof password !== "string" || typeof confirmPassword !== "string"
  ) {
    return "Complete all fields to create your account.";
  }

  const name = rawName.trim();
  const email = normalizeSchoolEmail(rawEmail);
  if (!name || name.length > 80) return "Enter a name up to 80 characters long.";
  if (!isValidSchoolEmail(email)) return "Use your @pdsb.net school email address.";
  if (password.length < 12) return "Choose a password with at least 12 characters.";
  if (password.length > 72) return "Password must be 72 characters or fewer.";
  if (password !== confirmPassword) return "The passwords do not match.";
  if (!process.env.DATABASE_URL) {
    console.error("Account creation unavailable: DATABASE_URL is not configured.");
    return "The database is not configured. Set DATABASE_URL and apply the database migrations.";
  }

  const passwordHash = await bcrypt.hash(password, 12);
  try {
    await createCredentialsUser(email, name, passwordHash);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return "An account already exists for that email address.";
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError && ["P2021", "P2022"].includes(error.code)) {
      console.error("Account creation failed: database schema is not up to date.", error.code);
      return "The database needs its latest migrations. Apply them, then try again.";
    }
    console.error("Account creation failed.", {
      errorType: error instanceof Error ? error.name : "UnknownError",
      prismaCode: error instanceof Prisma.PrismaClientKnownRequestError ? error.code : undefined,
    });
    return "Account creation is temporarily unavailable. Check the database connection and try again.";
  }

  redirect("/login?created=1");
}