import { randomUUID } from "node:crypto";

import type {
  AgentAction,
  BrandAsset,
  BrandKnowledgeStatus,
  ChatMessage,
  ChatRequest,
  ChatResponse,
  GenerationRequest,
  GenerationResult,
} from "@/lib/brand/contracts";
import type { BrandKnowledgeRepository } from "@/lib/brand/repository";

function createAction(label: string, intent: AgentAction["intent"], prompt: string): AgentAction {
  return {
    id: randomUUID(),
    label,
    intent,
    prompt,
  };
}

function createMessage(
  content: string,
  status: ChatMessage["status"],
  evidence: string[],
  actionList: AgentAction[],
  assetIds: string[] = [],
): ChatMessage {
  return {
    id: randomUUID(),
    role: "assistant",
    content,
    createdAt: new Date().toISOString(),
    evidence,
    actionList,
    assetIds,
    status,
  };
}

function getKnowledgeStatus(repository: BrandKnowledgeRepository): BrandKnowledgeStatus {
  const sourceCount = repository.getSources().length;
  const ruleCount = repository.getRules().length;

  if (sourceCount === 0) return "empty";
  if (ruleCount === 0) return "pending";
  return "ready";
}

function isSearchLogoIntent(query: string) {
  return /(logo|brand mark|wordmark|lockup|로고|심볼)/i.test(query);
}

function isPaletteIntent(query: string) {
  return /(palette|color|hex|swatch|컬러|색상|팔레트)/i.test(query);
}

function isFontIntent(query: string) {
  return /(font|typeface|typography|폰트|타이포)/i.test(query);
}

function isGenerationIntent(query: string) {
  return /(generate|banner|variation|visual|social|creative|생성|배너|비주얼|시안)/i.test(query);
}

function isRequestIntent(query: string) {
  return /(request|need|missing|send me|요청|필요|없어요|받고 싶)/i.test(query);
}

function defaultActions() {
  return [
    createAction("Find logo", "search_assets", "Find logo"),
    createAction("Generate banner", "generate_preview", "Generate banner"),
    createAction("Show color palette", "show_palette", "Show color palette"),
    createAction("Request asset", "request_asset", "Request asset"),
  ];
}

export class BrandExtractionService {
  summarize(repository: BrandKnowledgeRepository) {
    const sources = repository.getSources();
    const rules = repository.getRules();

    if (sources.length === 0) {
      return {
        knowledgeStatus: "empty" as const,
        note: "브랜드 지식이 아직 비어 있습니다. 업로드된 기준 자료만 단일 진실원으로 사용합니다.",
        evidence: ["Figma 스크린샷, Pencil 보드, PDF 업로드 필요", "추출된 규칙 0개"],
      };
    }

    if (rules.length === 0) {
      return {
        knowledgeStatus: "pending" as const,
        note: "자료는 수집되었지만 실제 규칙 추출 엔진이 아직 연결되지 않았습니다.",
        evidence: [
          `업로드된 기준 자료 ${sources.length}개`,
          "확인된 브랜드 규칙 0개",
          "색상/폰트/스타일 추정 금지 모드 유지",
        ],
      };
    }

    return {
      knowledgeStatus: "ready" as const,
      note: "확인된 브랜드 규칙이 준비되었습니다.",
      evidence: [`업로드된 기준 자료 ${sources.length}개`, `확인된 브랜드 규칙 ${rules.length}개`],
    };
  }
}

export class BrandAgentService {
  constructor(
    private readonly repository: BrandKnowledgeRepository,
    private readonly extractionService: BrandExtractionService,
  ) {}

  reply(input: ChatRequest): ChatResponse {
    const knowledge = this.extractionService.summarize(this.repository);
    const assets = this.repository.listAssets();
    const normalizedQuery = input.query.trim();

    if (isRequestIntent(normalizedQuery)) {
      this.repository.registerAssetRequest(normalizedQuery);

      const message = createMessage(
        "요청 항목으로 기록했습니다. 지금 단계에서는 실제 티켓 시스템 대신 내부 메모로만 보관하며, 업로드된 기준 자료가 연결된 뒤 우선순위를 다시 계산합니다.",
        "success",
        [
          `요청 내용: ${normalizedQuery}`,
          ...knowledge.evidence,
        ],
        defaultActions(),
      );

      return {
        message,
        suggestedAssetIds: [],
        suggestedPreviewAssetId: null,
        knowledgeStatus: knowledge.knowledgeStatus,
      };
    }

    if (isSearchLogoIntent(normalizedQuery)) {
      const logoAssets = this.repository.listAssets({ kind: "logo" });

      const message = logoAssets.length
        ? createMessage(
            `기록된 로고 자산 ${logoAssets.length}개를 찾았습니다. 현재는 플레이스홀더/모의 결과만 있을 수 있으니, 실제 확정본 여부는 근거 배지를 확인해 주세요.`,
            "default",
            [...knowledge.evidence, `${logoAssets.length}개의 로고 자산 반환`],
            defaultActions(),
            logoAssets.map((asset) => asset.id),
          )
        : createMessage(
            "업로드된 기준 자료에서 아직 확인된 로고 자산이 없습니다. 추정 로고를 만들어 보여주지 않고, 실제 근거가 준비될 때까지 빈 결과로 유지합니다.",
            "warning",
            knowledge.evidence,
            defaultActions(),
          );

      return {
        message,
        suggestedAssetIds: logoAssets.map((asset) => asset.id),
        suggestedPreviewAssetId: logoAssets[0]?.id ?? null,
        knowledgeStatus: knowledge.knowledgeStatus,
      };
    }

    if (isPaletteIntent(normalizedQuery)) {
      const paletteAssets = this.repository.listAssets({ kind: "palette" });

      const message = paletteAssets.length
        ? createMessage(
            "확인된 팔레트 자산을 불러왔습니다. 소스가 연결된 결과만 노출하고, 근거 없는 HEX 값은 표시하지 않습니다.",
            "default",
            [...knowledge.evidence, `${paletteAssets.length}개의 팔레트 자산 반환`],
            defaultActions(),
            paletteAssets.map((asset) => asset.id),
          )
        : createMessage(
            "업로드된 기준 자료에서 아직 확인되지 않음. 색상 규칙이 비어 있는 상태라 HEX 값을 추정하거나 임의 팔레트를 구성하지 않습니다.",
            "warning",
            knowledge.evidence,
            defaultActions(),
          );

      return {
        message,
        suggestedAssetIds: paletteAssets.map((asset) => asset.id),
        suggestedPreviewAssetId: paletteAssets[0]?.id ?? null,
        knowledgeStatus: knowledge.knowledgeStatus,
      };
    }

    if (isFontIntent(normalizedQuery)) {
      const message = createMessage(
        "업로드된 기준 자료에서 아직 확인되지 않음. 현재는 폰트명, 굵기, 타이포 규칙을 추정하지 않고 실제 추출 결과가 들어올 때까지 비워 둡니다.",
        "warning",
        knowledge.evidence,
        defaultActions(),
      );

      return {
        message,
        suggestedAssetIds: [],
        suggestedPreviewAssetId: null,
        knowledgeStatus: knowledge.knowledgeStatus,
      };
    }

    if (isGenerationIntent(normalizedQuery)) {
      const bannerAssets = this.repository.listAssets({ kind: "banner" });
      const latestAsset = bannerAssets[0] ?? assets[0] ?? null;

      const message = createMessage(
        "생성 요청으로 이해했습니다. 실제 생성 엔진 대신 데모 프리뷰만 만들 수 있으며, 업로드된 기준 자료와 추출 규칙이 연결되기 전에는 확정 산출물로 취급하지 않습니다.",
        knowledge.knowledgeStatus === "empty" ? "warning" : "default",
        [
          ...knowledge.evidence,
          "Demo preview 또는 Placeholder output 배지가 붙은 결과만 허용",
        ],
        defaultActions(),
        latestAsset ? [latestAsset.id] : [],
      );

      return {
        message,
        suggestedAssetIds: latestAsset ? [latestAsset.id] : [],
        suggestedPreviewAssetId: latestAsset?.id ?? null,
        knowledgeStatus: knowledge.knowledgeStatus,
      };
    }

    const message = createMessage(
      knowledge.note,
      knowledge.knowledgeStatus === "empty" ? "warning" : "default",
      knowledge.evidence,
      defaultActions(),
      assets.slice(0, 1).map((asset) => asset.id),
    );

    return {
      message,
      suggestedAssetIds: assets.slice(0, 3).map((asset) => asset.id),
      suggestedPreviewAssetId: assets[0]?.id ?? null,
      knowledgeStatus: getKnowledgeStatus(this.repository),
    };
  }
}

export class BrandGenerationService {
  constructor(
    private readonly repository: BrandKnowledgeRepository,
    private readonly extractionService: BrandExtractionService,
  ) {}

  generate(input: GenerationRequest): GenerationResult {
    const knowledge = this.extractionService.summarize(this.repository);
    const now = new Date().toISOString();
    const grounded = input.sourceIds.length > 0;

    const asset: BrandAsset = this.repository.addGeneratedAsset({
      id: randomUUID(),
      name: grounded ? "On-brand banner preview" : "Placeholder banner preview",
      kind: "banner",
      status: "placeholder",
      formats: ["svg", "png", "pdf"],
      summary: grounded
        ? "업로드된 기준 자료를 첨부한 상태의 데모 프리뷰입니다."
        : "업로드된 기준 자료 없이 만든 데모 프리뷰입니다.",
      description:
        "실제 생성 엔진 전 단계의 플레이스홀더 결과입니다. 업로드된 이미지/PDF에서 추출한 규칙이 연결되기 전에는 확정본으로 사용할 수 없습니다.",
      sourceIds: input.sourceIds,
      sourceStatus: grounded ? "pending" : "ungrounded",
      previewMode: "placeholder",
      badges: grounded
        ? ["Placeholder output", "Source files attached", "Rules pending"]
        : ["Placeholder output", "No source grounding"],
      placeholder: true,
      downloadBaseName: grounded ? "on-brand-banner-preview" : "placeholder-banner-preview",
      createdAt: now,
    });

    const message = createMessage(
      grounded
        ? "데모 프리뷰를 만들었습니다. 업로드된 기준 자료는 연결되어 있지만, 실제 규칙 추출이 끝나기 전이라 브랜드 확정 결과로 취급하지 않습니다."
        : "데모 프리뷰를 만들었습니다. 아직 업로드된 기준 자료가 없어 온브랜드 검증은 불가능하며, 결과는 플레이스홀더로만 제공됩니다.",
      grounded ? "default" : "warning",
      [
        ...knowledge.evidence,
        `생성 프롬프트: ${input.prompt}`,
        grounded ? "소스 파일 연결됨" : "업로드된 기준 자료 없음",
      ],
      defaultActions(),
      [asset.id],
    );

    return {
      status: "completed",
      asset,
      message,
      suggestedPreviewAssetId: asset.id,
    };
  }
}
