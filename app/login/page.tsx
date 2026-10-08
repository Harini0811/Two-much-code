"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import { supabase } from "@/lib/lib/supabase";

const sans = Space_Grotesk({ subsets: ["latin"], variable: "--font-sans" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export default function Login() {
  const router = useRouter();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    const { error } =
      mode === "in"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });
    setBusy(false);
    if (error) return setMsg(error.message);
    if (mode === "up") return setMsg("Account created. Check your email to confirm, then sign in.");
    router.replace("/dashboard");
  }

  const input =
    "w-full rounded-lg border border-[var(--line)] bg-[var(--ink)] px-3 py-2.5 outline-none focus:border-[var(--cyan)] focus:shadow-[0_0_0_1px_var(--cyan)]";

  return (
    <div className={`${sans.variable} ${mono.variable} relative grid min-h-screen place-items-center overflow-hidden p-5`}>
      <div className="grid-bg" />
      <form onSubmit={submit} className="panel relative w-full max-w-sm space-y-4 p-7">
        <div className="flex items-center gap-2 text-lg font-semibold">
          <span className="h-3 w-3 rounded-full bg-[var(--cyan)] shadow-[0_0_14px_var(--cyan)]" />
          CloudGuard <span className="neon-text">AI</span>
        </div>
        <h1 className="text-2xl font-semibold">{mode === "in" ? "Sign in" : "Create account"}</h1>

        <label className="block text-sm text-[var(--mute)]">
          Email
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={`${input} mt-1 text-white`} />
        </label>
        <label className="block text-sm text-[var(--mute)]">
          Password
          <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className={`${input} mt-1 text-white`} />
        </label>

        {msg && <p className="text-sm text-[var(--pink)]">{msg}</p>}

        <button disabled={busy} className="btn-neon w-full rounded-lg px-4 py-3 font-semibold text-white disabled:opacity-50">
          {busy ? "Please wait…" : mode === "in" ? "Sign in" : "Create account"}
        </button>
        <button type="button" onClick={() => { setMode(mode === "in" ? "up" : "in"); setMsg(""); }}
          className="w-full text-sm text-[var(--mute)] hover:text-white">
          {mode === "in" ? "New here? Create an account" : "Already have an account? Sign in"}
        </button>
      </form>
    </div>
  );
}