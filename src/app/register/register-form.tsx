"use client";

import { useActionState } from "react";
import { registerAction } from "@/app/register/actions";

export function RegisterForm() {
  const [message, action, pending] = useActionState(registerAction, null);

  return (
    <form className="auth-form" action={action}>
      <label htmlFor="name">Student name</label>
      <input id="name" name="name" autoComplete="name" required maxLength={80} />
      <label htmlFor="email">PDSB email</label>
      <input id="email" name="email" type="email" autoComplete="email" placeholder="you@pdsb.net" pattern=".+@pdsb\.net" required />
      <label htmlFor="password">Password</label>
      <input id="password" name="password" type="password" autoComplete="new-password" required minLength={12} maxLength={72} />
      <label htmlFor="confirmPassword">Confirm password</label>
      <input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required minLength={12} maxLength={72} />
      {message && <p className="form-message" role="alert">{message}</p>}
      <button className="google-button" type="submit" disabled={pending}>
        {pending ? "Creating account…" : "Create account"}
        <span className="button-arrow" aria-hidden="true">↗</span>
      </button>
    </form>
  );
}