import { NextRequest, NextResponse } from "next/server";

import { createServiceSupabaseClient } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 고객이 입력 중일 때 위젯이 호출(throttle). customer_typing_at 갱신 → 상담사 콘솔이 "입력 중" 표시.
export async function POST(req: NextRequest) {
  let body: { token?: string };
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const token = body.token;
  if (!token) return NextResponse.json({ error: "bad_request" }, { status: 400 });

  const supa = createServiceSupabaseClient();
  const { data: session } = await supa
    .from("chat_sessions")
    .select("id")
    .eq("token", token)
    .single();
  if (!session) return NextResponse.json({ error: "session_not_found" }, { status: 404 });

  await supa
    .from("chat_sessions")
    .update({ customer_typing_at: new Date().toISOString() })
    .eq("id", session.id);

  return NextResponse.json({ ok: true });
}
