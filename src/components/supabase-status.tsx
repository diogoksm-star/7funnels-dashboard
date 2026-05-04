"use client";

import { useEffect, useState } from "react";
import { Database } from "lucide-react";

type Health = {
  ok: boolean;
  mode: "local" | "supabase";
  message: string;
};

export function SupabaseStatus() {
  const [health, setHealth] = useState<Health>({
    ok: false,
    mode: "local",
    message: "Verificando Supabase...",
  });

  useEffect(() => {
    let alive = true;
    fetch("/api/supabase/health")
      .then((response) => response.json())
      .then((data: Health) => {
        if (alive) setHealth(data);
      })
      .catch(() => {
        if (alive) {
          setHealth({
            ok: false,
            mode: "local",
            message: "Não foi possível verificar o Supabase.",
          });
        }
      });

    return () => {
      alive = false;
    };
  }, []);

  const connected = health.ok && health.mode === "supabase";

  return (
    <div
      className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs ${
        connected
          ? "border-emerald-300/25 bg-emerald-300/10 text-emerald-100"
          : "border-amber-300/25 bg-amber-300/10 text-amber-100"
      }`}
      title={health.message}
    >
      <Database size={16} />
      {connected ? "Supabase conectado" : "Modo local ativo"}
    </div>
  );
}
