import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Msg = { role: string; content: unknown };

// 대화 한 줄의 텍스트를 추출(이미지 첨부는 [사진]으로 표기)
function textOf(content: unknown): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((c) => {
        const part = c as { type?: string; text?: string };
        if (part?.type === "text") return part.text ?? "";
        if (part?.type === "image_url") return "[사진]";
        return "";
      })
      .filter(Boolean)
      .join(" ");
  }
  return "";
}

export async function POST(req: NextRequest) {
  let body: { history?: Msg[]; page?: string; offline?: boolean };
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const history = body.history ?? [];
  const webhook = process.env.SLACK_WEBHOOK_URL;

  if (webhook) {
    const convo = history
      .map((m) => `${m.role === "user" ? "🙋 고객" : "🤖 봇"}: ${textOf(m.content)}`)
      .join("\n");
    const text = [
      body.offline ? "*영업시간 외 연락 요청* — 영업시간에 회신 필요" : "*새 상담사 연결 요청*",
      "",
      "*대화 내용*",
      convo || "(대화 내용 없음)",
      "",
      body.page ? `고객이 문의한 페이지: ${body.page}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    try {
      const r = await fetch(webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!r.ok) console.error("슬랙 전송 실패:", r.status);
    } catch (e) {
      console.error("슬랙 전송 오류:", e);
    }
  } else {
    console.warn("SLACK_WEBHOOK_URL 미설정 — 슬랙 알림 건너뜀.");
  }

  return NextResponse.json({ ok: true });
}
