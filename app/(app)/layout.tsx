import { supabase } from "@/lib/lib/supabase";
"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import Sidebar from "@/components/sidebar";
// KEEP your original line 5 here, the one that imports supabase, for example:
// import { supabase } from "@/lib/supabase";

const sans = Space_Grotesk({ subsets: ["latin"], variable: "--font-sans" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const path = usePathname();
  const [email, setEmail] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.replace("/login");
      else setEmail(data.session.user.email ?? "");
    });
  }, [router]);

  // Login page gets no sidebar
  if (path.startsWith("/login")) {
    return <div className={`${sans.variable} ${mono.variable}`}>{children}</div>;
  }

  return (
    <div className={`${sans.variable} ${mono.variable} min-h-screen md:flex`}>
      <Sidebar />
      <main className="relative min-w-0 flex-1 overflow-hidden p-4 md:p-8">
        <div className="grid-bg" />
        <div className="relative">
          <p className="mono mb-4 text-right text-xs text-[var(--mute)]">{email}</p>
          {children}
        </div>
      </main>
    </div>
  );
}