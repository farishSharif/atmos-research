import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabaseClient";
import { ALL_ITEM_KEYS } from "@/lib/questions";

// Server-only read endpoint. The dashboard POSTs the admin password here.
// Rows are read with the Supabase SERVICE ROLE key (bypasses RLS) so the
// browser never gets read access to the table directly.

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let password = "";
  try {
    const body = await req.json();
    password = typeof body?.password === "string" ? body.password : "";
  } catch {
    // ignore malformed body
  }

  // Default demo password is "admin123" when ADMIN_PASSWORD is not set.
  const expected = process.env.ADMIN_PASSWORD || "admin123";
  if (password !== expected) {
    return NextResponse.json({ ok: false, error: "Invalid password" }, { status: 401 });
  }

  const supabase = getServiceClient();
  if (!supabase) {
    // No DB configured — authorised, but there is nothing server-side to read.
    // The dashboard will fall back to local + demo data in the browser.
    return NextResponse.json({ ok: true, configured: false, rows: [] });
  }

  const columns = [
    "id",
    "created_at",
    "age_group",
    "gender",
    "experience",
    "sector",
    ...ALL_ITEM_KEYS,
  ].join(",");

  const { data, error } = await supabase
    .from("responses")
    .select(columns)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, configured: true, rows: data ?? [] });
}
