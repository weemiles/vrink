import { randomUUID } from "node:crypto";

import { NextRequest, NextResponse } from "next/server";

import { createServiceSupabaseClient } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Msg = { role?: string; content?: string };

// 상담사 연결 시 호출. 라이브 상담 세션을 만들고, 그때까지의 대화(매크로/AI)를 함께 저장한다.
// 새 세션은 슬랙으로 알림 + ERP 상담 콘솔 링크를 보낸다.
export async function POST(req: NextRequest) {
  let body: { transcript?: Msg[]; page?: string };
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const transcript = Array.isArray(body.transcript) ? body.transcript : [];
  const supa = createServiceSupabaseClient();

  // 추측이 어렵도록 긴 랜덤 토큰. 위젯은 이 토큰으로만 자기 세션에 접근한다.
  const token = `${randomUUID()}${randomUUID().replace(/-/g, "")}`;
  const label = `고객-${randomUUID().slice(0, 4).toUpperCase()}`;

  const { data: session, error } = await supa
    .from("chat_sessions")
    .insert({ token, page_url: body.page ?? null, customer_label: label })
    .select("id")
    .single();

  if (error || !session) {
    console.error("[chat-live/start] 세션 생성 실패:", error);
    return NextResponse.json({ error: "session_create_failed" }, { status: 500 });
  }

  // 그때까지의 대화 기록 저장(빠른메뉴 칩 + AI 상담 모두)
  const rows = transcript
    .filter((m) => m && typeof m.content === "string" && m.content.trim())
    .map((m) => ({
      session_id: session.id,
      sender: m.role === "user" ? "customer" : "bot",
      content: String(m.content).slice(0, 2000),
    }));
  if (rows.length) {
    const { error: msgErr } = await supa.from("chat_messages").insert(rows);
    if (msgErr) console.error("[chat-live/start] 기존 대화 저장 실패:", msgErr);
  }

  // 슬랙 알림 + 상담 콘솔 링크
  const webhook = process.env.SLACK_WEBHOOK_URL;
  if (webhook) {
    const base = process.env.ERP_CONSOLE_URL || "https://erp.vrink.kr";
    const consoleUrl = `${base}/erp/chat?s=${session.id}`;
    const lastUser = [...rows].reverse().find((r) => r.sender === "customer");
    const text = [
      `*🔴 새 실시간 상담 요청* (${label})`,
      lastUser ? `최근 문의: ${lastUser.content.slice(0, 120)}` : null,
      `상담 콘솔에서 응대해 주세요 👉 ${consoleUrl}`,
    ]
      .filter(Boolean)
      .join("\n");
    try {
      await fetch(webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
    } catch (e) {
      console.error("[chat-live/start] 슬랙 알림 실패:", e);
    }
  }

  return NextResponse.json({ sessionId: session.id, token, label });
}
