import AppShell from "@/components/AppShell";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import { supabase } from "@/lib/lib/supabase";
import Sidebar from "@/components/sidebar";

const grotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-grotesk" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.replace("/login");
      else setReady(true);
    });
  }, [router]);

  if (!ready) {
    return <div className="p-6 text-cyan-300">Loading...</div>;
  }

  return (
    <div className={`${grotesk.variable} ${mono.variable} flex min-h-screen`}>
      <Sidebar />
      <main className="flex-1">{children}</main>
    </div>
  );
}