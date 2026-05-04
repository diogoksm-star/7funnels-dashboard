"use client";

import { useMemo, useState } from "react";
import { KeyRound } from "lucide-react";
import { Dashboard } from "@/components/dashboard";
import { loadState } from "@/lib/local-store";
import { applyMappings } from "@/lib/mappings";

export function ClientGate({ slug }: { slug: string }) {
  const [state] = useState(() => loadState());
  const [password, setPassword] = useState("");
  const [authorized, setAuthorized] = useState(
    () => typeof window !== "undefined" && window.sessionStorage.getItem(`dashboard-${slug}`) === "ok",
  );
  const client = useMemo(() => state.clients.find((item) => item.slug === slug), [slug, state]);
  const rows = useMemo(() => {
    const clientRows = state.rows.filter((row) => row.clientId === client?.id);
    const clientMappings = state.mappings.filter((mapping) => mapping.clientId === client?.id);
    return applyMappings(clientRows, clientMappings);
  }, [client?.id, state]);

  if (!client) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#080A0F] px-5 text-zinc-100">
        <div className="max-w-md rounded-lg border border-white/10 bg-white/[0.04] p-8 text-center">
          <h1 className="text-xl font-semibold">Dashboard não encontrado</h1>
          <p className="mt-2 text-sm text-zinc-500">Crie este cliente no admin ou confira o slug da URL.</p>
        </div>
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#080A0F] px-5 text-zinc-100">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (password === client.password) {
              window.sessionStorage.setItem(`dashboard-${slug}`, "ok");
              setAuthorized(true);
            }
          }}
          className="w-full max-w-sm rounded-lg border border-white/10 bg-white/[0.04] p-6"
        >
          <KeyRound className="text-cyan-300" size={26} />
          <h1 className="mt-4 text-2xl font-semibold">{client.name}</h1>
          <p className="mt-2 text-sm text-zinc-500">{client.subtitle}</p>
          <label className="mt-6 block">
            <span className="text-sm text-zinc-400">Senha</span>
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              className="mt-2 w-full rounded-md border border-white/10 bg-[#0B0E14] px-3 py-2 outline-none focus:border-cyan-300/70"
              autoFocus
            />
          </label>
          <button className="mt-4 w-full rounded-md bg-cyan-300 px-3 py-2 font-semibold text-slate-950 hover:bg-cyan-200">
            Entrar
          </button>
          <p className="mt-3 text-xs text-zinc-600">Demo: a senha fica no cadastro do admin.</p>
        </form>
      </div>
    );
  }

  return <Dashboard client={client} rows={rows} />;
}
