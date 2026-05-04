import Link from "next/link";
import { ArrowRight, BarChart3, Database, LockKeyhole, Upload } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#080A0F] text-zinc-100">
      <section className="mx-auto grid min-h-screen max-w-7xl content-center gap-10 px-5 py-12 lg:grid-cols-[1fr_0.9fr] lg:items-center">
        <div>
          <p className="text-sm font-medium text-cyan-300">Facebook Ads Dashboard</p>
          <h1 className="mt-4 max-w-3xl text-5xl font-semibold tracking-normal text-zinc-50">
            Relatórios visuais por cliente, campanha, público e criativo.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-zinc-400">
            Importe os CSVs do Meta Ads, defina metas manuais e entregue um dashboard com senha exclusiva para cada cliente.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/admin" className="inline-flex items-center gap-2 rounded-md bg-cyan-300 px-4 py-3 font-semibold text-slate-950 hover:bg-cyan-200">
              Abrir admin
              <ArrowRight size={18} />
            </Link>
            <Link href="/clube-carvao" className="inline-flex items-center gap-2 rounded-md border border-white/10 px-4 py-3 font-semibold text-zinc-100 hover:bg-white/[0.04]">
              Ver demo cliente
            </Link>
          </div>
        </div>

        <div className="grid gap-3">
          {[
            ["Upload inteligente", "CSV/XLSX de campanha, conjunto e anúncio.", Upload],
            ["Login por dashboard", "Rota /cliente + senha simples para cada cliente.", LockKeyhole],
            ["Supabase preparado", "Schema Postgres e storage para evolução do produto.", Database],
            ["Análise visual", "Geral, objetivos, campanhas, públicos, criativos e alertas.", BarChart3],
          ].map(([title, body, Icon]) => (
            <div key={String(title)} className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
              <Icon className="text-cyan-300" size={22} />
              <h2 className="mt-4 text-lg font-semibold">{title as string}</h2>
              <p className="mt-2 text-sm text-zinc-500">{body as string}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
