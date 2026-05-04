"use client";

import dynamic from "next/dynamic";

const ClientGate = dynamic(() => import("@/components/client-gate").then((mod) => mod.ClientGate), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-screen items-center justify-center bg-[#080A0F] px-5 text-zinc-100">
      <div className="rounded-lg border border-white/10 bg-white/[0.04] p-6 text-sm text-zinc-400">
        Carregando dashboard...
      </div>
    </div>
  ),
});

export function ClientDashboardShell({ slug }: { slug: string }) {
  return <ClientGate slug={slug} />;
}
