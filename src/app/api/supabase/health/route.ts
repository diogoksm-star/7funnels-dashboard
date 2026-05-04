import { NextResponse } from "next/server";
import { getSupabaseServerClient, isSupabaseServerConfigured } from "@/lib/supabase-server";

export async function GET() {
  if (!isSupabaseServerConfigured()) {
    return NextResponse.json({
      ok: false,
      mode: "local",
      message: "Supabase env vars ainda não foram configuradas.",
    });
  }

  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({
      ok: false,
      mode: "local",
      message: "Cliente Supabase indisponível.",
    });
  }

  const { error } = await supabase.from("clients").select("id").limit(1);

  if (error) {
    return NextResponse.json(
      {
        ok: false,
        mode: "supabase",
        message: error.message,
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    mode: "supabase",
    message: "Supabase conectado e schema acessível.",
  });
}
