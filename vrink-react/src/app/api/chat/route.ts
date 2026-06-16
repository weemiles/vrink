import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

import { SYSTEM_PROMPT } from "@/lib/chatbot/prompt";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ChatMsg = OpenAI.Chat.Completions.ChatCompletionMessageParam;

// OPENAI_API_KEY 는 첫 호출 시점에 읽는다(키 없어도 빌드/기동은 되도록).
let client: OpenAI | null = null;
function getClient() {
  if (!client) client = new OpenAI();
  return client;
}

// 악용 방지: IP당 1분에 20회로 제한
const WINDOW_MS = 60_000;
const MAX_REQ = 20;
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

function getIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return req.headers.get("x-real-ip") ?? "unknown";
}

export async function POST(req: NextRequest) {
  if (rateLimited(getIp(req))) {
    return NextResponse.json(
      { error: "요청이 많습니다. 잠시 후 다시 시도해 주세요." },
      { status: 429 },
    );
  }

  let body: { messages?: ChatMsg[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "요청 형식이 올바르지 않습니다." }, { status: 400 });
  }

  const messages = body.messages;
  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "messages 배열이 필요합니다." }, { status: 400 });
  }

  try {
    const completion = await getClient().chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 1024,
      messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
    });
    const text = completion.choices[0]?.message?.content ?? "";
    return NextResponse.json({ text });
  } catch (err) {
    console.error("OpenAI API 오류:", err);
    return NextResponse.json(
      { error: "일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요." },
      { status: 500 },
    );
  }
}
