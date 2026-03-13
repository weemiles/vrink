import { NextResponse } from "next/server";

import { uploadRequestSchema } from "@/lib/brand/contracts";
import { createBrandKnowledgeRepository } from "@/lib/brand/repository";
import { BrandExtractionService } from "@/lib/brand/services";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "요청 본문을 읽을 수 없습니다." }, { status: 400 });
  }

  const parsed = uploadRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "잘못된 업로드 요청입니다." },
      { status: 400 },
    );
  }

  const repository = createBrandKnowledgeRepository();
  const items = repository.addUploads(parsed.data.files);
  const knowledge = new BrandExtractionService().summarize(repository);

  return NextResponse.json({
    items,
    summary:
      items.length === 1
        ? `${items[0].name} 소스를 등록했습니다. ${knowledge.note}`
        : `${items.length}개의 소스를 등록했습니다. ${knowledge.note}`,
    sourceCount: repository.getSources().length,
  });
}
