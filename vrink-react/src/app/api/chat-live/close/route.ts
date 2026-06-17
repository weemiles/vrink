import { NextRequest, NextResponse } from "next/server";

import { createServiceSupabaseClient } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 고객이 페이지를 떠나거나 상담을 나가면 호출(sendBeacon). 세션을 종료한다.
export async function POST(req: NextRequest) {
  let token: string | undefined;
  try {
    token = (await req.json())?.token;
  } catch {
    token = undefined;
  }
  if (!token) return NextResponse.json({ error: "bad_request" }, { status: 400 });

  const supa = createServiceSupabaseClient();
  const { data: session } = await supa
    .from("chat_sessions")
    .select("id, status")
    .eq("token", token)
    .single();
  if (!session) return NextResponse.json({ error: "session_not_found" }, { status: 404 });

  if (session.status === "active") {
    await supa
      .from("chat_messages")
      .insert({ session_id: session.id, sender: "system", content: "고객이 상담을 나갔어요." });
    await supa.from("chat_sessions").update({ status: "closed" }).eq("id", session.id);
  }
  return NextResponse.json({ ok: true });
}
