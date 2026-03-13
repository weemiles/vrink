"use client";

import { startTransition, useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  ArrowDownToLine,
  ArrowUpRight,
  FilePlus2,
  FileText,
  ImageIcon,
  LoaderCircle,
  Palette,
  Plus,
  Search,
  Sparkles,
  Upload,
  X,
} from "lucide-react";

import type {
  AgentAction,
  AssetFormat,
  BrandAsset,
  BrandSourceKind,
  ChatMessage,
  ChatResponse,
  GenerationRequest,
  GenerationResult,
  SourceStatus,
  UploadResponse,
} from "@/lib/brand/contracts";
import { assetKindLabels, sourceKindLabels } from "@/lib/brand/contracts";
import { formatBytes, timeAgoLabel } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type ClientUploadEntry = {
  clientId: string;
  sourceId: string | null;
  name: string;
  kind: BrandSourceKind;
  mimeType: string;
  size: number;
  status: SourceStatus;
  note: string;
  uploadedAt: string | null;
  previewUrl: string | null;
};

const QUICK_ACTIONS: AgentAction[] = [
  { id: "find-logo", label: "Find logo", intent: "search_assets", prompt: "Find logo" },
  { id: "generate-banner", label: "Generate banner", intent: "generate_preview", prompt: "Generate banner" },
  { id: "show-palette", label: "Show color palette", intent: "show_palette", prompt: "Show color palette" },
  { id: "request-asset", label: "Request asset", intent: "request_asset", prompt: "Request asset" },
];

const INITIAL_MESSAGE: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "브랜드 에이전트는 업로드된 Figma 스크린샷, Pencil 보드, PDF만 단일 진실원으로 사용합니다. 현재 브랜드 지식이 아직 비어 있습니다.",
  createdAt: new Date().toISOString(),
  evidence: [
    "브랜드 지식이 아직 비어 있음",
    "추정 색상/폰트/스타일 금지",
    "Upload your Figma and Pencil images now",
  ],
  actionList: QUICK_ACTIONS,
  assetIds: [],
  status: "warning",
};

function createClientId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function inferSourceKind(file: File): BrandSourceKind {
  const fileName = file.name.toLowerCase();

  if (file.type === "application/pdf" || fileName.endsWith(".pdf")) return "pdf";
  if (fileName.includes("figma")) return "figma-screenshot";
  if (fileName.includes("pencil")) return "pencil-board";
  if (file.type.startsWith("image/")) return "guideline-image";
  return "other";
}

function createPreviewLabel(file: File, kind: BrandSourceKind) {
  if (kind === "pdf") return "PDF";
  if (file.type.startsWith("image/")) return "Image";
  return sourceKindLabels[kind];
}

function messageStatusVariant(status: ChatMessage["status"]) {
  if (status === "warning") return "warning";
  if (status === "success") return "success";
  return "default";
}

function uploadStatusVariant(status: SourceStatus) {
  if (status === "failed") return "warning";
  if (status === "ready") return "success";
  return "default";
}

function uploadStatusLabel(status: SourceStatus) {
  switch (status) {
    case "queued":
      return "Queued";
    case "uploading":
      return "Uploading";
    case "processing":
      return "Processing";
    case "ready":
      return "Ready";
    case "failed":
      return "Failed";
    default:
      return status;
  }
}

function isGenerationPrompt(prompt: string) {
  return /(generate|banner|variation|visual|social|creative|생성|배너|시안|비주얼)/i.test(prompt);
}

function mergeAssets(previous: BrandAsset[], incoming: BrandAsset[]) {
  const merged = new Map<string, BrandAsset>();
  [...incoming, ...previous].forEach((asset) => merged.set(asset.id, asset));
  return [...merged.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function makeUserMessage(content: string): ChatMessage {
  return {
    id: createClientId(),
    role: "user",
    content,
    createdAt: new Date().toISOString(),
    evidence: [],
    actionList: [],
    assetIds: [],
    status: "default",
  };
}

function makeLocalAssistantMessage(content: string, evidence: string[], status: ChatMessage["status"]): ChatMessage {
  return {
    id: createClientId(),
    role: "assistant",
    content,
    createdAt: new Date().toISOString(),
    evidence,
    actionList: QUICK_ACTIONS,
    assetIds: [],
    status,
  };
}

function assetSourceBadge(asset: BrandAsset) {
  if (asset.sourceStatus === "grounded") return "Grounded";
  if (asset.sourceStatus === "pending") return "Source files attached";
  return "No source grounding";
}

function buildPlaceholderSvg(asset: BrandAsset) {
  const title = escapeXml(asset.name);
  const summary = escapeXml(asset.summary);
  const badge = escapeXml(asset.placeholder ? "Placeholder output" : "Brand asset");

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900" fill="none">
  <rect width="1600" height="900" rx="48" fill="#F7F6F2"/>
  <rect x="48" y="48" width="1504" height="804" rx="40" fill="#FFFFFF" stroke="#DAD5CA"/>
  <rect x="96" y="96" width="188" height="40" rx="20" fill="#F2EFE7"/>
  <text x="124" y="122" fill="#2B2822" font-family="Arial, Helvetica, sans-serif" font-size="20" font-weight="700">${badge}</text>
  <text x="96" y="244" fill="#1E1B16" font-family="Arial, Helvetica, sans-serif" font-size="74" font-weight="700">${title}</text>
  <text x="96" y="318" fill="#6B665D" font-family="Arial, Helvetica, sans-serif" font-size="28">${summary}</text>
  <rect x="96" y="396" width="1408" height="360" rx="28" fill="#F5F3EE" stroke="#DDD7CB" stroke-dasharray="10 10"/>
  <rect x="148" y="452" width="420" height="252" rx="24" fill="#ECE8DE"/>
  <rect x="608" y="452" width="420" height="112" rx="24" fill="#EFEADF"/>
  <rect x="608" y="592" width="420" height="112" rx="24" fill="#EFEADF"/>
  <rect x="1068" y="452" width="284" height="252" rx="24" fill="#F0ECE3"/>
  <text x="1160" y="588" fill="#686258" font-family="Arial, Helvetica, sans-serif" font-size="26" font-weight="700">DEMO</text>
  <text x="96" y="818" fill="#6B665D" font-family="Arial, Helvetica, sans-serif" font-size="24">Our Brand Agent placeholder preview. Replace with grounded output after extraction.</text>
</svg>`.trim();
}

function escapeXml(text: string) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

function createPdfBlob(asset: BrandAsset) {
  const textLines = [
    "Our Brand Agent Preview",
    `Asset: ${asset.name}`,
    `Status: ${asset.placeholder ? "Placeholder output" : "Ready"}`,
    `Source: ${assetSourceBadge(asset)}`,
  ];

  const content = textLines
    .map((line, index) => `BT /F1 ${index === 0 ? 24 : 12} Tf 72 ${760 - index * 28} Td (${line.replace(/[()\\]/g, "\\$&")}) Tj ET`)
    .join("\n");

  const objects = [
    "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj",
    "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj",
    "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj",
    `4 0 obj << /Length ${content.length} >> stream\n${content}\nendstream endobj`,
    "5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj",
  ];

  const header = "%PDF-1.4\n";
  let offset = header.length;
  const xref = ["0000000000 65535 f "];

  const body = objects
    .map((object) => {
      xref.push(`${String(offset).padStart(10, "0")} 00000 n `);
      offset += object.length + 1;
      return object;
    })
    .join("\n");

  const xrefStart = header.length + body.length + 1;
  const pdf = `${header}${body}\nxref\n0 ${objects.length + 1}\n${xref.join("\n")}\ntrailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  return new Blob([pdf], { type: "application/pdf" });
}

async function downloadAsset(asset: BrandAsset, format: AssetFormat) {
  const baseName = asset.downloadBaseName || asset.name.toLowerCase().replace(/\s+/g, "-");

  if (format === "svg") {
    downloadBlob(new Blob([buildPlaceholderSvg(asset)], { type: "image/svg+xml" }), `${baseName}.svg`);
    return;
  }

  if (format === "pdf") {
    downloadBlob(createPdfBlob(asset), `${baseName}.pdf`);
    return;
  }

  const svg = buildPlaceholderSvg(asset);
  const svgBlob = new Blob([svg], { type: "image/svg+xml" });
  const svgUrl = URL.createObjectURL(svgBlob);

  try {
    const image = new window.Image();
    image.crossOrigin = "anonymous";

    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("PNG export failed"));
      image.src = svgUrl;
    });

    const canvas = document.createElement("canvas");
    canvas.width = 1600;
    canvas.height = 900;
    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("Canvas context unavailable");
    }

    context.fillStyle = "#F7F6F2";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));

    if (!blob) {
      throw new Error("PNG export failed");
    }

    downloadBlob(blob, `${baseName}.png`);
  } finally {
    URL.revokeObjectURL(svgUrl);
  }
}

async function readJsonResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as T;
  return payload;
}

function PreviewSurface({ asset }: { asset: BrandAsset }) {
  if (asset.previewMode === "palette") {
    return (
      <div className="grid h-full min-h-[260px] gap-3 rounded-[28px] border border-dashed border-[var(--border-strong)] bg-[var(--surface-2)] p-6 md:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="flex flex-col justify-between rounded-[22px] border border-[var(--border)] bg-[var(--surface-1)] p-4"
          >
            <div className="h-20 rounded-[18px] border border-dashed border-[var(--border-strong)] bg-[linear-gradient(135deg,#faf8f3,#efebe1)]" />
            <div className="pt-4">
              <p className="text-xs font-semibold text-[var(--ink)]">Unconfirmed</p>
              <p className="pt-1 text-[11px] text-[var(--ink-subtle)]">업로드된 기준 자료에서 아직 확인되지 않음</p>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (asset.previewMode === "document") {
    return (
      <div className="flex min-h-[260px] flex-col rounded-[28px] border border-[var(--border)] bg-[var(--surface-2)] p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--surface-1)]">
            <FileText className="h-5 w-5 text-[var(--ink-muted)]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--ink)]">{asset.name}</p>
            <p className="text-xs text-[var(--ink-subtle)]">{asset.description}</p>
          </div>
        </div>
        <div className="mt-6 flex flex-1 flex-col gap-3 rounded-[24px] border border-dashed border-[var(--border-strong)] bg-[var(--surface-1)] p-5">
          <div className="h-4 w-2/5 rounded-full bg-[var(--surface-3)]" />
          <div className="h-4 w-full rounded-full bg-[var(--surface-3)]" />
          <div className="h-4 w-4/5 rounded-full bg-[var(--surface-3)]" />
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <div className="h-24 rounded-[20px] bg-[var(--surface-2)]" />
            <div className="h-24 rounded-[20px] bg-[var(--surface-2)]" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[260px] overflow-hidden rounded-[32px] border border-[var(--border)] bg-[linear-gradient(135deg,#faf8f3_0%,#f0ebe1_100%)] p-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.85),transparent_32%),linear-gradient(180deg,rgba(255,255,255,0.32),transparent)]" />
      <div className="relative z-10 flex h-full flex-col justify-between gap-6">
        <div className="flex items-center justify-between">
          <Badge variant="default">{asset.placeholder ? "Placeholder output" : "Grounded asset"}</Badge>
          <Badge variant="subtle">{assetSourceBadge(asset)}</Badge>
        </div>
        <div className="grid gap-4 md:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[28px] border border-[rgba(23,21,19,0.08)] bg-white/80 p-6 shadow-[var(--shadow-inner)]">
            <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-subtle)]">
              <Sparkles className="h-4 w-4" />
              Demo Layout
            </div>
            <h3 className="pt-6 text-[1.75rem] font-semibold tracking-[-0.04em] text-[var(--ink)] md:text-[2.35rem]">
              {asset.name}
            </h3>
            <p className="max-w-[32ch] pt-3 text-sm leading-6 text-[var(--ink-muted)]">{asset.summary}</p>
            <div className="mt-6 flex flex-wrap gap-2">
              {asset.badges.map((badge) => (
                <Badge key={badge} variant="subtle">
                  {badge}
                </Badge>
              ))}
            </div>
          </div>
          <div className="grid gap-3">
            <div className="rounded-[26px] border border-[rgba(23,21,19,0.08)] bg-white/70 p-5">
              <div className="h-6 w-24 rounded-full bg-[var(--surface-3)]" />
              <div className="mt-5 h-28 rounded-[20px] border border-dashed border-[var(--border-strong)] bg-[linear-gradient(135deg,#f6f3ec,#e9e2d4)]" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-[24px] border border-[rgba(23,21,19,0.08)] bg-white/70 p-4">
                <div className="h-5 w-14 rounded-full bg-[var(--surface-3)]" />
                <div className="mt-4 h-12 rounded-2xl bg-[var(--surface-2)]" />
              </div>
              <div className="rounded-[24px] border border-[rgba(23,21,19,0.08)] bg-white/70 p-4">
                <div className="h-5 w-20 rounded-full bg-[var(--surface-3)]" />
                <div className="mt-4 h-12 rounded-2xl bg-[var(--surface-2)]" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function BrandAgentShell() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const objectUrlsRef = useRef<string[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [draft, setDraft] = useState("");
  const [assets, setAssets] = useState<BrandAsset[]>([]);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [uploads, setUploads] = useState<ClientUploadEntry[]>([]);
  const [assetSearch, setAssetSearch] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshingAssets, setIsRefreshingAssets] = useState(false);

  const selectedAsset = assets.find((asset) => asset.id === selectedAssetId) ?? null;
  const filteredAssets = assets.filter((asset) => {
    const query = assetSearch.trim().toLowerCase();
    if (!query) return true;
    return `${asset.name} ${asset.summary} ${asset.description}`.toLowerCase().includes(query);
  });
  const readySourceIds = uploads
    .filter((item) => item.status === "ready" && item.sourceId)
    .map((item) => item.sourceId as string);

  useEffect(() => {
    void refreshAssets();

    return () => {
      objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      objectUrlsRef.current = [];
    };
    // refreshAssets is intentionally invoked only once on mount for the initial hydrate pass.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function refreshAssets() {
    setIsRefreshingAssets(true);

    try {
      const response = await fetch("/api/assets", { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Failed to load assets");
      }

      const payload = (await readJsonResponse<{ assets: BrandAsset[] }>(response)).assets;
      startTransition(() => {
        setAssets((current) => mergeAssets(current, payload));
        if (!selectedAssetId && payload.length > 0) {
          setSelectedAssetId(payload[0].id);
        }
      });
    } catch {
      // Silent fallback. The app still works from the local state.
    } finally {
      setIsRefreshingAssets(false);
    }
  }

  function appendAssistantMessage(message: ChatMessage) {
    startTransition(() => {
      setMessages((current) => [...current, message]);
    });
  }

  function appendUserMessage(content: string) {
    startTransition(() => {
      setMessages((current) => [...current, makeUserMessage(content)]);
    });
  }

  async function handleSmartSubmit(prompt: string) {
    const query = prompt.trim();
    if (!query) return;

    appendUserMessage(query);
    setDraft("");
    setIsSubmitting(true);

    try {
      if (isGenerationPrompt(query)) {
        const generationPayload: GenerationRequest = {
          prompt: query,
          intent: "banner",
          selectedAssetId,
          sourceIds: readySourceIds,
        };

        const response = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(generationPayload),
        });

        if (!response.ok) {
          throw new Error("Generation failed");
        }

        const payload = await readJsonResponse<{ result: GenerationResult }>(response);
        startTransition(() => {
          setAssets((current) => mergeAssets(current, [payload.result.asset]));
          setSelectedAssetId(payload.result.suggestedPreviewAssetId);
        });
        appendAssistantMessage(payload.result.message);
      } else {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query,
            selectedAssetId,
            sourceSummaries: uploads.map((item) => ({
              id: item.sourceId ?? item.clientId,
              name: item.name,
              kind: item.kind,
              status: item.status,
            })),
          }),
        });

        if (!response.ok) {
          throw new Error("Chat failed");
        }

        const payload = await readJsonResponse<{ result: ChatResponse }>(response);
        appendAssistantMessage(payload.result.message);

        if (payload.result.suggestedPreviewAssetId) {
          setSelectedAssetId(payload.result.suggestedPreviewAssetId);
          await refreshAssets();
        }
      }
    } catch (error) {
      appendAssistantMessage(
        makeLocalAssistantMessage(
          "응답을 가져오는 중 문제가 생겼습니다. 현재 단계에서는 모의 API를 사용하므로 새로고침 후 다시 시도해 주세요.",
          [error instanceof Error ? error.message : "Unknown error"],
          "warning",
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList);
    if (files.length === 0) return;

    const stagedEntries = files.map<ClientUploadEntry>((file) => {
      const clientId = createClientId();
      const previewUrl = file.type.startsWith("image/") ? URL.createObjectURL(file) : null;
      if (previewUrl) objectUrlsRef.current.push(previewUrl);

      return {
        clientId,
        sourceId: null,
        name: file.name,
        kind: inferSourceKind(file),
        mimeType: file.type || "application/octet-stream",
        size: file.size,
        status: "queued",
        note: "업로드 대기 중",
        uploadedAt: null,
        previewUrl,
      };
    });

    setUploads((current) => [...stagedEntries, ...current]);

    const updateStatuses = (status: SourceStatus, note: string) => {
      setUploads((current) =>
        current.map((item) =>
          stagedEntries.some((entry) => entry.clientId === item.clientId)
            ? { ...item, status, note }
            : item,
        ),
      );
    };

    updateStatuses("uploading", "업로드 중");
    await new Promise((resolve) => setTimeout(resolve, 250));
    updateStatuses("processing", "자료 등록 후 처리 중");

    try {
      const response = await fetch("/api/uploads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          files: files.map((file, index) => ({
            clientId: stagedEntries[index].clientId,
            name: file.name,
            size: file.size,
            mimeType: file.type || "application/octet-stream",
            kind: stagedEntries[index].kind,
            previewLabel: createPreviewLabel(file, stagedEntries[index].kind),
          })),
        }),
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const payload = await readJsonResponse<UploadResponse>(response);

      startTransition(() => {
        setUploads((current) =>
          current.map((item) => {
            const uploaded = payload.items.find((candidate) => candidate.clientId === item.clientId);
            if (!uploaded) return item;

            return {
              ...item,
              sourceId: uploaded.sourceId,
              status: "ready",
              note: uploaded.note,
              uploadedAt: uploaded.uploadedAt,
            };
          }),
        );
      });

      appendAssistantMessage(
        makeLocalAssistantMessage(payload.summary, [
          `${payload.sourceCount}개 소스가 등록됨`,
          "실제 추출 엔진 연결 전이라 규칙은 아직 0개",
          "Upload your Figma and Pencil images now",
        ], "success"),
      );
    } catch (error) {
      setUploads((current) =>
        current.map((item) =>
          stagedEntries.some((entry) => entry.clientId === item.clientId)
            ? {
                ...item,
                status: "failed",
                note: error instanceof Error ? error.message : "업로드 실패",
              }
            : item,
        ),
      );

      appendAssistantMessage(
        makeLocalAssistantMessage(
          "업로드 처리 중 문제가 생겼습니다. 현재 단계에서는 파일 메타데이터만 등록하므로 잠시 후 다시 시도해 주세요.",
          [error instanceof Error ? error.message : "Unknown upload error"],
          "warning",
        ),
      );
    }
  }

  function openFilePicker() {
    fileInputRef.current?.click();
  }

  function removeUpload(clientId: string) {
    setUploads((current) => {
      const target = current.find((item) => item.clientId === clientId);
      if (target?.previewUrl) {
        URL.revokeObjectURL(target.previewUrl);
        objectUrlsRef.current = objectUrlsRef.current.filter((url) => url !== target.previewUrl);
      }

      return current.filter((item) => item.clientId !== clientId);
    });
  }

  function handleAction(action: AgentAction) {
    if (action.intent === "upload_sources") {
      openFilePicker();
      return;
    }

    if (action.intent === "generate_preview") {
      void handleSmartSubmit(action.prompt);
      return;
    }

    setDraft(action.prompt);
    void handleSmartSubmit(action.prompt);
  }

  async function handleDownload(format: AssetFormat) {
    if (!selectedAsset) return;

    try {
      await downloadAsset(selectedAsset, format);
    } catch (error) {
      appendAssistantMessage(
        makeLocalAssistantMessage(
          "다운로드 파일 생성 중 문제가 생겼습니다.",
          [error instanceof Error ? error.message : "Unknown download error"],
          "warning",
        ),
      );
    }
  }

  return (
    <div className="min-h-screen bg-[var(--page-bg)] text-[var(--ink)]">
      <div className="mx-auto flex min-h-screen max-w-[1680px] flex-col px-4 py-4 sm:px-6 lg:px-8">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-[30px] border border-[var(--border)] bg-[rgba(255,255,255,0.82)] px-5 py-4 shadow-[var(--shadow-soft)] backdrop-blur-xl">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge>Our Brand Agent</Badge>
              <Badge variant="subtle">Single source of truth</Badge>
              <Badge variant="subtle">No login v1</Badge>
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-[-0.04em] text-[var(--ink)] sm:text-[2rem]">
                Upload your Figma and Pencil images now
              </h1>
              <p className="pt-1 text-sm leading-6 text-[var(--ink-muted)]">
                업로드된 이미지와 PDF만 기준으로 검색, 요청, 생성 프리뷰를 제어합니다. 근거가 없으면 답변도 비워 둡니다.
              </p>
            </div>
          </div>
          <div className="grid gap-2 text-right">
            <span className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--ink-subtle)]">
              Team workspace
            </span>
            <span className="text-sm text-[var(--ink-muted)]">브랜드 규칙 추출 전 단계 · 프런트엔드 우선 빌드</span>
          </div>
        </header>

        <main className="mt-4 grid flex-1 gap-4 xl:grid-cols-[minmax(0,1.1fr)_420px]">
          <section
            className="relative flex min-h-[calc(100vh-148px)] flex-col overflow-hidden rounded-[36px] border border-[var(--border)] bg-[rgba(250,249,246,0.78)] shadow-[var(--shadow-card)] backdrop-blur-sm"
            onDragEnter={() => setIsDragging(true)}
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={(event) => {
              if (event.currentTarget === event.target) {
                setIsDragging(false);
              }
            }}
            onDrop={(event) => {
              event.preventDefault();
              setIsDragging(false);
              void handleFiles(event.dataTransfer.files);
            }}
          >
            <div className="border-b border-[var(--border)] px-5 py-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--ink-subtle)]">
                    Brand chat
                  </p>
                  <p className="pt-1 text-sm text-[var(--ink-muted)]">
                    좌측 채팅, 우측 프리뷰. 모바일에서는 프리뷰가 채팅 안으로 이동합니다.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {QUICK_ACTIONS.map((action) => (
                    <Button
                      key={action.id}
                      variant="secondary"
                      size="sm"
                      className="rounded-full"
                      onClick={() => handleAction(action)}
                    >
                      {action.intent === "search_assets" && <Search className="h-3.5 w-3.5" />}
                      {action.intent === "generate_preview" && <Sparkles className="h-3.5 w-3.5" />}
                      {action.intent === "show_palette" && <Palette className="h-3.5 w-3.5" />}
                      {action.intent === "request_asset" && <FilePlus2 className="h-3.5 w-3.5" />}
                      {action.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            <div className="border-b border-[var(--border)] px-5 py-4">
              <Card className={isDragging ? "border-[var(--border-strong)] bg-[var(--surface-2)]" : ""}>
                <CardHeader className="pb-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <CardTitle>자료 업로드</CardTitle>
                      <CardDescription>
                        Figma 스크린샷, Pencil 보드, PDF를 바로 채팅 안으로 넣어 주세요.
                      </CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={openFilePicker}>
                      <Upload className="h-4 w-4" />
                      파일 선택
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <button
                    type="button"
                    onClick={openFilePicker}
                    className="flex w-full flex-col items-center justify-center gap-3 rounded-[24px] border border-dashed border-[var(--border-strong)] bg-[var(--surface-2)] px-5 py-8 text-center transition hover:bg-[var(--surface-3)]"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--surface-1)]">
                      <Upload className="h-5 w-5 text-[var(--ink-muted)]" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[var(--ink)]">Drag & drop brand source files here</p>
                      <p className="pt-1 text-xs leading-5 text-[var(--ink-subtle)]">
                        업로드 전에는 브랜드 지식이 비어 있고, 업로드 후에도 실제 추출 엔진 연결 전까지 규칙은 0개로 유지됩니다.
                      </p>
                    </div>
                  </button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.pdf,.svg"
                    multiple
                    className="hidden"
                    onChange={(event) => {
                      if (event.target.files) {
                        void handleFiles(event.target.files);
                        event.target.value = "";
                      }
                    }}
                  />

                  {uploads.length > 0 && (
                    <div className="space-y-3">
                      {uploads.map((item) => (
                        <div
                          key={item.clientId}
                          className="flex items-center gap-3 rounded-[22px] border border-[var(--border)] bg-[var(--surface-1)] px-3 py-3"
                        >
                          <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-[18px] border border-[var(--border)] bg-[var(--surface-2)]">
                            {item.previewUrl ? (
                              <Image
                                src={item.previewUrl}
                                alt={item.name}
                                fill
                                unoptimized
                                className="object-cover"
                                sizes="56px"
                              />
                            ) : item.kind === "pdf" ? (
                              <FileText className="h-5 w-5 text-[var(--ink-muted)]" />
                            ) : (
                              <ImageIcon className="h-5 w-5 text-[var(--ink-muted)]" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="truncate text-sm font-semibold text-[var(--ink)]">{item.name}</p>
                              <Badge variant={uploadStatusVariant(item.status)}>{uploadStatusLabel(item.status)}</Badge>
                            </div>
                            <p className="pt-1 text-xs text-[var(--ink-subtle)]">
                              {sourceKindLabels[item.kind]} · {formatBytes(item.size)}
                              {item.uploadedAt ? ` · ${timeAgoLabel(item.uploadedAt)}` : ""}
                            </p>
                            <p className="pt-1 text-xs text-[var(--ink-muted)]">{item.note}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 rounded-full p-0"
                            onClick={() => removeUpload(item.clientId)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5">
              <div className="mx-auto flex max-w-4xl flex-col gap-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={message.role === "user" ? "ml-auto w-full max-w-2xl" : "mr-auto w-full max-w-3xl"}
                  >
                    <div
                      className={
                        message.role === "user"
                          ? "rounded-[28px] rounded-br-md bg-[var(--ink)] px-5 py-4 text-white shadow-[var(--shadow-soft)]"
                          : "rounded-[30px] rounded-bl-md border border-[var(--border)] bg-[var(--surface-1)] px-5 py-4 text-[var(--ink)] shadow-[var(--shadow-soft)]"
                      }
                    >
                      <div className="flex items-center gap-2">
                        <Badge variant={message.role === "user" ? "subtle" : messageStatusVariant(message.status)}>
                          {message.role === "user" ? "You" : "Agent"}
                        </Badge>
                        <span className={message.role === "user" ? "text-xs text-white/70" : "text-xs text-[var(--ink-subtle)]"}>
                          {timeAgoLabel(message.createdAt)}
                        </span>
                      </div>
                      <p className={message.role === "user" ? "pt-3 text-sm leading-6 text-white/92" : "pt-3 text-sm leading-6 text-[var(--ink)]"}>
                        {message.content}
                      </p>

                      {message.evidence.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {message.evidence.map((item) => (
                            <Badge
                              key={item}
                              variant={message.role === "user" ? "subtle" : messageStatusVariant(message.status)}
                            >
                              {item}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {message.assetIds.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {message.assetIds
                            .map((assetId) => assets.find((asset) => asset.id === assetId))
                            .filter(Boolean)
                            .map((asset) => (
                              <button
                                key={asset?.id}
                                type="button"
                                className="flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1.5 text-xs font-semibold text-[var(--ink)] transition hover:border-[var(--border-strong)]"
                                onClick={() => setSelectedAssetId(asset?.id ?? null)}
                              >
                                <ArrowUpRight className="h-3.5 w-3.5" />
                                {asset?.name}
                              </button>
                            ))}
                        </div>
                      )}

                      {message.role !== "user" && message.actionList.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {message.actionList.map((action) => (
                            <Button
                              key={action.id}
                              variant="ghost"
                              size="sm"
                              className="rounded-full border border-[var(--border)] bg-[var(--surface-2)]"
                              onClick={() => handleAction(action)}
                            >
                              {action.label}
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                <div className="xl:hidden">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <CardTitle>Inline asset preview</CardTitle>
                          <CardDescription>모바일에서는 프리뷰가 채팅 안으로 들어옵니다.</CardDescription>
                        </div>
                        {selectedAsset && <Badge variant="subtle">{assetKindLabels[selectedAsset.kind]}</Badge>}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {selectedAsset ? (
                        <>
                          <PreviewSurface asset={selectedAsset} />
                          <div className="grid gap-2 sm:grid-cols-3">
                            {selectedAsset.formats.map((format) => (
                              <Button key={format} variant="outline" onClick={() => void handleDownload(format)}>
                                <ArrowDownToLine className="h-4 w-4" />
                                Download {format.toUpperCase()}
                              </Button>
                            ))}
                          </div>
                        </>
                      ) : (
                        <div className="rounded-[24px] border border-dashed border-[var(--border-strong)] bg-[var(--surface-2)] px-4 py-8 text-center">
                          <p className="text-sm font-semibold text-[var(--ink)]">선택된 자산이 아직 없습니다.</p>
                          <p className="pt-2 text-xs leading-5 text-[var(--ink-subtle)]">
                            빠른 액션을 누르거나 업로드 후 질문을 보내면 프리뷰가 이 위치에 표시됩니다.
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>

            <div className="border-t border-[var(--border)] px-5 py-4">
              <form
                className="mx-auto flex max-w-4xl flex-col gap-3"
                onSubmit={(event) => {
                  event.preventDefault();
                  void handleSmartSubmit(draft);
                }}
              >
                <Textarea
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder="Ask for a logo, request a missing asset, or generate a banner preview..."
                  className="min-h-[110px] resize-none"
                />
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs leading-5 text-[var(--ink-subtle)]">
                    근거 없는 색상, 폰트, 스타일은 절대 추정하지 않습니다. 업로드된 기준 자료가 없으면 빈 결과 또는 경고만 반환합니다.
                  </p>
                  <Button type="submit" size="lg" disabled={isSubmitting || draft.trim().length === 0}>
                    {isSubmitting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    Send
                  </Button>
                </div>
              </form>
            </div>
          </section>

          <aside className="hidden min-h-[calc(100vh-148px)] flex-col gap-4 xl:flex">
            <Card className="flex flex-1 flex-col overflow-hidden">
              <CardHeader className="border-b border-[var(--border)] pb-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle>Asset preview</CardTitle>
                    <CardDescription>우측 패널은 현재 선택된 자산 또는 지식 상태를 요약합니다.</CardDescription>
                  </div>
                  <Badge variant={selectedAsset ? "default" : "warning"}>
                    {selectedAsset ? assetKindLabels[selectedAsset.kind] : "Empty"}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="flex flex-1 flex-col gap-4 overflow-y-auto pt-5">
                {selectedAsset ? (
                  <>
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge>{assetSourceBadge(selectedAsset)}</Badge>
                        {selectedAsset.badges.map((badge) => (
                          <Badge key={badge} variant="subtle">
                            {badge}
                          </Badge>
                        ))}
                      </div>
                      <div>
                        <h2 className="text-[1.65rem] font-semibold tracking-[-0.04em] text-[var(--ink)]">
                          {selectedAsset.name}
                        </h2>
                        <p className="pt-2 text-sm leading-6 text-[var(--ink-muted)]">{selectedAsset.description}</p>
                      </div>
                    </div>

                    <PreviewSurface asset={selectedAsset} />

                    <div className="grid gap-2 sm:grid-cols-3">
                      {selectedAsset.formats.map((format) => (
                        <Button key={format} variant="outline" onClick={() => void handleDownload(format)}>
                          <ArrowDownToLine className="h-4 w-4" />
                          Download {format.toUpperCase()}
                        </Button>
                      ))}
                    </div>

                    <Card className="border-dashed bg-[var(--surface-2)]">
                      <CardHeader className="pb-2">
                        <CardTitle>Grounding</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <p className="text-sm leading-6 text-[var(--ink-muted)]">{selectedAsset.summary}</p>
                        <div className="flex flex-wrap gap-2">
                          {selectedAsset.sourceIds.length > 0 ? (
                            selectedAsset.sourceIds.map((sourceId) => {
                              const source = uploads.find((item) => item.sourceId === sourceId);
                              return (
                                <Badge key={sourceId} variant="subtle">
                                  {source?.name ?? sourceId}
                                </Badge>
                              );
                            })
                          ) : (
                            <Badge variant="warning">업로드된 기준 자료에서 아직 확인되지 않음</Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </>
                ) : (
                  <Card className="border-dashed bg-[var(--surface-2)]">
                    <CardHeader>
                      <CardTitle>브랜드 지식이 아직 비어 있음</CardTitle>
                      <CardDescription>
                        업로드된 기준 자료가 없으면 검색 결과, 팔레트, 폰트, 생성물 모두 비어 있거나 플레이스홀더로만 남습니다.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-[22px] border border-[var(--border)] bg-[var(--surface-1)] px-4 py-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ink-subtle)]">
                            Uploaded sources
                          </p>
                          <p className="pt-3 text-2xl font-semibold tracking-[-0.03em] text-[var(--ink)]">{uploads.length}</p>
                        </div>
                        <div className="rounded-[22px] border border-[var(--border)] bg-[var(--surface-1)] px-4 py-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--ink-subtle)]">
                            Confirmed rules
                          </p>
                          <p className="pt-3 text-2xl font-semibold tracking-[-0.03em] text-[var(--ink)]">0</p>
                        </div>
                      </div>
                      <p className="text-sm leading-6 text-[var(--ink-muted)]">
                        실제 추출/RAG가 연결되면 이 패널에서 로고, 팔레트, 폰트, 템플릿 자산을 근거와 함께 보여주게 됩니다.
                      </p>
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <CardTitle>Available assets</CardTitle>
                        <CardDescription>검색된 기존 자산과 생성된 플레이스홀더 결과가 여기에 모입니다.</CardDescription>
                      </div>
                      {isRefreshingAssets && <LoaderCircle className="h-4 w-4 animate-spin text-[var(--ink-subtle)]" />}
                    </div>
                    <Input
                      value={assetSearch}
                      onChange={(event) => setAssetSearch(event.target.value)}
                      placeholder="Search assets"
                    />
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {filteredAssets.length > 0 ? (
                      filteredAssets.map((asset) => (
                        <button
                          key={asset.id}
                          type="button"
                          className={`w-full rounded-[24px] border px-4 py-4 text-left transition ${
                            selectedAssetId === asset.id
                              ? "border-[var(--border-strong)] bg-[var(--surface-2)]"
                              : "border-[var(--border)] bg-[var(--surface-1)] hover:bg-[var(--surface-2)]"
                          }`}
                          onClick={() => setSelectedAssetId(asset.id)}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-[var(--ink)]">{asset.name}</p>
                              <p className="pt-1 text-xs leading-5 text-[var(--ink-subtle)]">{asset.summary}</p>
                            </div>
                            <Badge variant={asset.placeholder ? "warning" : "default"}>
                              {assetKindLabels[asset.kind]}
                            </Badge>
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="rounded-[22px] border border-dashed border-[var(--border-strong)] bg-[var(--surface-2)] px-4 py-8 text-center">
                        <p className="text-sm font-semibold text-[var(--ink)]">아직 표시할 자산이 없습니다.</p>
                        <p className="pt-2 text-xs leading-5 text-[var(--ink-subtle)]">
                          현재 단계에서는 업로드 후에도 규칙 추출이 연결되기 전까지 실제 브랜드 자산이 자동 생성되지 않습니다.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </aside>
        </main>
      </div>
    </div>
  );
}
