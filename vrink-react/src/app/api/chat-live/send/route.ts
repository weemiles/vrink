import { NextRequest, NextResponse } from "next/server";

import { createServiceSupabaseClient } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 악용 방지: IP당 1분 60회(라이브 채팅이라 chat보다 여유)
const WINDOW_MS = 60_000;
const MAX_REQ = 60;
const hits = new Map<string, number[]>();
function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => t > now - WINDOW_MS);
  if (recent.length >= MAX_REQ) {
    hits.set(ip, recent);
    return true;
  }
  recent.push(now);
  hits.set(ip, recent);
  return false;
}

// 고객이 라이브 모드에서 보낸 메시지를 세션에 저장한다.
export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";
  if (rateLimited(ip)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  let body: { token?: string; content?: string };
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const token = body.token;
  const content = (body.content ?? "").trim();
  if (!token || !content) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const supa = createServiceSupabaseClient();
  const { data: session } = await supa
    .from("chat_sessions")
    .select("id, status")
    .eq("token", token)
    .single();

  if (!session) {
    return NextResponse.json({ error: "session_not_found" }, { status: 404 });
  }
  if (session.status !== "active") {
    return NextResponse.json({ error: "session_closed" }, { status: 409 });
  }

  const { error } = await supa.from("chat_messages").insert({
    session_id: session.id,
    sender: "customer",
    content: content.slice(0, 2000),
  });
  if (error) {
    console.error("[chat-live/send] 저장 실패:", error);
    return NextResponse.json({ error: "save_failed" }, { status: 500 });
  }

  await supa
    .from("chat_sessions")
    .update({ last_message_at: new Date().toISOString() })
    .eq("id", session.id);

  return NextResponse.json({ ok: true });
}
