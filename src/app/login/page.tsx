import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { LoginForm } from "@/app/login/login-form";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ created?: string }> }) {
  const session = await auth();
  if (session?.user?.id) redirect("/");
  const { created } = await searchParams;

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
      <section className="login-content" aria-labelledby="login-heading">
        <p className="eyebrow">PDSB · CHARITY WEEK</p>
        <h1 id="login-heading">School giving,<br /><span>accounted.</span></h1>
        <p className="login-copy">Sign in with your school email to view your event account.</p>
        {created && <p className="success-message" role="status">Your account is ready. Sign in to continue.</p>}
        <LoginForm />
      </section>
      <footer className="login-footer"><span>FRASER PAY</span><span>ACCOUNT ACCESS</span></footer>
    </main>
  );
}