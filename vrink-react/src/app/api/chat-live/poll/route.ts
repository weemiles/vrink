import { NextRequest, NextResponse } from "next/server";

import { createServiceSupabaseClient } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 위젯이 2초마다 호출. 상담사(agent)/시스템(system) 메시지 중 after id 이후의 새 메시지를 돌려준다.
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  const after = Number(url.searchParams.get("after") || 0);
  if (!token) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const supa = createServiceSupabaseClient();
  const { data: session } = await supa
    .from("chat_sessions")
    .select("id, status, agent_joined, agent_typing_at")
    .eq("token", token)
    .single();

  if (!session) {
    return NextResponse.json({ error: "session_not_found" }, { status: 404 });
  }

  // 하트비트: 위젯이 살아있는 동안 갱신. 끊기면 콘솔이 이탈로 판단해 자동 종료.
  if (session.status === "active") {
    await supa
      .from("chat_sessions")
      .update({ last_seen_at: new Date().toISOString() })
      .eq("id", session.id);
  }

  const { data: msgs } = await supa
    .from("chat_messages")
    .select("id, sender, content, created_at, image_url")
    .eq("session_id", session.id)
    .in("sender", ["agent", "system"])
    .gt("id", after)
    .order("id", { ascending: true });

  // 상담사가 최근 5초 내 타이핑했으면 "입력 중"으로 본다.
  const agentTyping =
    !!session.agent_typing_at &&
    Date.now() - new Date(session.agent_typing_at).getTime() < 5000;

  return NextResponse.json({
    messages: msgs ?? [],
    status: session.status,
    agentJoined: session.agent_joined,
    agentTyping,
  });
}
