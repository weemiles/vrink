import { NextResponse } from "next/server";

import { chatRequestSchema } from "@/lib/brand/contracts";
import { createBrandKnowledgeRepository } from "@/lib/brand/repository";
import { BrandAgentService, BrandExtractionService } from "@/lib/brand/services";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "요청 본문을 읽을 수 없습니다." }, { status: 400 });
  }

  const parsed = chatRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "잘못된 요청입니다." },
      { status: 400 },
    );
  }

  const repository = createBrandKnowledgeRepository();
  const service = new BrandAgentService(repository, new BrandExtractionService());
  const result = service.reply(parsed.data);

  return NextResponse.json({ result });
}
