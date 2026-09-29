"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction } from "@/app/login/actions";

export function LoginForm() {
  const [message, action, pending] = useActionState(loginAction, null);

  return (
    <form className="auth-form" action={action}>
      <label htmlFor="email">PDSB email</label>
      <input id="email" name="email" type="email" autoComplete="email" placeholder="you@pdsb.net" pattern=".+@pdsb\.net" required />
      <label htmlFor="password">Password</label>
      <input id="password" name="password" type="password" autoComplete="current-password" required />
      {message && <p className="form-message" role="alert">{message}</p>}
      <button className="google-button" type="submit" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
        <span className="button-arrow" aria-hidden="true">↗</span>
      </button>
      <p className="auth-switch">New to FraserPay? <Link href="/register">Create an account</Link></p>
    </form>
  );
}