import { NextRequest, NextResponse } from "next/server";

import { env } from "@/lib/env";
import { createServiceSupabaseClient } from "@/lib/supabase-server";
import { leadInquirySchema } from "@/lib/validation/lead";

const requestLog = new Map<string, number[]>();

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const validAfter = now - env.leadRateLimitWindowMs;

  const recentRequests = (requestLog.get(key) ?? []).filter(
    (timestamp) => timestamp > validAfter,
  );

  if (recentRequests.length >= env.leadRateLimitMax) {
    requestLog.set(key, recentRequests);
    return true;
  }

  recentRequests.push(now);
  requestLog.set(key, recentRequests);
  return false;
}

function getRequesterIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }

  return request.headers.get("x-real-ip") ?? "unknown";
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, message: "요청 형식이 올바르지 않습니다." },
      { status: 400 },
    );
  }

  const parsed = leadInquirySchema.safeParse(body);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0]?.message ?? "입력값을 확인해주세요.";
    return NextResponse.json(
      { ok: false, message: firstIssue },
      { status: 400 },
    );
  }

  const payload = parsed.data;

  if (payload.honeypot.trim().length > 0) {
    return NextResponse.json({
      ok: true,
      message: "문의가 접수되었습니다. 확인 후 연락드리겠습니다.",
    });
  }

  const ip = getRequesterIp(request);

  if (isRateLimited(ip)) {
    return NextResponse.json(
      {
        ok: false,
        message: "요청이 많습니다. 잠시 후 다시 시도해주세요.",
      },
      { status: 429 },
    );
  }

  try {
    const supabase = createServiceSupabaseClient();

    const { error } = await supabase.from("lead_inquiries").insert({
      company: payload.company,
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      message: payload.message,
      source: "website",
      client_ip: ip,
      user_agent: request.headers.get("user-agent") ?? "",
    });

    if (error) {
      return NextResponse.json(
        {
          ok: false,
          message: "문의 저장에 실패했습니다. 잠시 후 다시 시도해주세요.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        ok: true,
        message: "문의가 접수되었습니다. 확인 후 연락드리겠습니다.",
      },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      {
        ok: false,
        message: "서버 설정을 확인해주세요. Supabase 연결 정보가 필요합니다.",
      },
      { status: 500 },
    );
  }
}
