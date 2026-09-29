"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/auth";

export async function loginAction(_previousState: string | null, formData: FormData) {
  const email = formData.get("email");
  const password = formData.get("password");
  if (typeof email !== "string" || typeof password !== "string") {
    return "Enter your school email and password.";
  }

  try {
    await signIn("credentials", { email, password, redirectTo: "/" });
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.type === "CredentialsSignin") return "That username and password don't match.";
      return "Sign-in is temporarily unavailable. Check the database connection and try again.";
    }
    throw error;
  }

  return null;
}