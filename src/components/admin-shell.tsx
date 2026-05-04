"use client";

import dynamic from "next/dynamic";

const AdminApp = dynamic(() => import("@/components/admin-app").then((mod) => mod.AdminApp), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-screen items-center justify-center bg-[#080A0F] px-5 text-zinc-100">
      <div className="rounded-lg border border-white/10 bg-white/[0.04] p-6 text-sm text-zinc-400">
        Carregando admin...
      </div>
    </div>
  ),
});

export function AdminShell() {
  return <AdminApp />;
}
