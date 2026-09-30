import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { RegisterForm } from "@/app/register/register-form";

export default async function RegisterPage() {
  const session = await auth();
  if (session?.user?.id) redirect("/");

  return (
    <main className="login-shell">
      <div className="login-orbit orbit-one" />
      <div className="login-orbit orbit-two" />
      <header className="login-header">
        <Link className="wordmark" href="/" aria-label="FraserPay home">
          <span className="brand-mark">F</span>
          <span>fraser<span className="wordmark-light">pay</span></span>
        </Link>
      </header>
      <section className="login-content" aria-labelledby="register-heading">
        <p className="eyebrow">PDSB · CHARITY WEEK</p>
        <h1 id="register-heading">Create your<br /><span>account.</span></h1>
        <p className="login-copy">Use your @pdsb.net email. Student accounts cannot record deposits.</p>
        <RegisterForm />
        <p className="auth-switch">Do you already have an account? <Link href="/login">Sign in</Link></p>
      </section>
      <footer className="login-footer"><span>FRASER PAY</span><span>ACCOUNT ACCESS</span></footer>
    </main>
  );
}
