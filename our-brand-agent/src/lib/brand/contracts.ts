import { z } from "zod";

export const brandSourceKindValues = [
  "figma-screenshot",
  "pencil-board",
  "pdf",
  "guideline-image",
  "other",
] as const;

export const brandRuleCategoryValues = [
  "color",
  "font",
  "logo",
  "spacing",
  "tone",
  "template",
  "general",
] as const;

export const assetKindValues = [
  "logo",
  "palette",
  "font",
  "template",
  "moodboard",
  "banner",
  "guideline",
] as const;

export const assetFormatValues = ["svg", "png", "pdf"] as const;
export const sourceStatusValues = [
  "queued",
  "uploading",
  "processing",
  "ready",
  "failed",
] as const;

export const knowledgeStatusValues = ["empty", "pending", "ready"] as const;
export const generationIntentValues = [
  "banner",
  "social",
  "variation",
  "marketing-visual",
] as const;

export type BrandSourceKind = (typeof brandSourceKindValues)[number];
export type BrandRuleCategory = (typeof brandRuleCategoryValues)[number];
export type AssetKind = (typeof assetKindValues)[number];
export type AssetFormat = (typeof assetFormatValues)[number];
export type SourceStatus = (typeof sourceStatusValues)[number];
export type BrandKnowledgeStatus = (typeof knowledgeStatusValues)[number];
export type GenerationIntent = (typeof generationIntentValues)[number];

export type AgentActionIntent =
  | "search_assets"
  | "generate_preview"
  | "show_palette"
  | "request_asset"
  | "upload_sources";

export type MessageStatus = "default" | "warning" | "success";
export type AssetPreviewMode = "placeholder" | "palette" | "document";

export interface BrandSource {
  id: string;
  name: string;
  kind: BrandSourceKind;
  mimeType: string;
  size: number;
  uploadedAt: string;
  status: Extract<SourceStatus, "ready" | "processing" | "failed">;
  extractedRuleCount: number;
  note: string;
  previewLabel: string;
}

export interface BrandRule {
  id: string;
  category: BrandRuleCategory;
  label: string;
  value: string;
  sourceIds: string[];
  status: "confirmed" | "missing" | "pending";
  evidence: string;
}

export interface BrandAsset {
  id: string;
  name: string;
  kind: AssetKind;
  status: "ready" | "placeholder" | "missing";
  formats: AssetFormat[];
  summary: string;
  description: string;
  sourceIds: string[];
  sourceStatus: "grounded" | "pending" | "ungrounded";
  previewMode: AssetPreviewMode;
  badges: string[];
  placeholder: boolean;
  downloadBaseName: string;
  createdAt: string;
}

export interface AgentAction {
  id: string;
  label: string;
  intent: AgentActionIntent;
  prompt: string;
}

export interface ChatMessage {
  id: string;
  role: "assistant" | "user" | "system";
  content: string;
  createdAt: string;
  evidence: string[];
  actionList: AgentAction[];
  assetIds: string[];
  status: MessageStatus;
}

export interface SourceSummary {
  id: string;
  name: string;
  kind: BrandSourceKind;
  status: SourceStatus;
}

export interface UploadFilePayload {
  clientId: string;
  name: string;
  size: number;
  mimeType: string;
  kind: BrandSourceKind;
  previewLabel: string;
}

export interface UploadItem {
  id: string;
  clientId: string;
  sourceId: string;
  name: string;
  kind: BrandSourceKind;
  mimeType: string;
  size: number;
  status: Extract<SourceStatus, "ready" | "failed">;
  note: string;
  uploadedAt: string;
}

export interface ChatRequest {
  query: string;
  selectedAssetId: string | null;
  sourceSummaries: SourceSummary[];
}

export interface ChatResponse {
  message: ChatMessage;
  suggestedAssetIds: string[];
  suggestedPreviewAssetId: string | null;
  knowledgeStatus: BrandKnowledgeStatus;
}

export interface UploadResponse {
  items: UploadItem[];
  summary: string;
  sourceCount: number;
}

export interface GenerationRequest {
  prompt: string;
  intent: GenerationIntent;
  selectedAssetId: string | null;
  sourceIds: string[];
}

export interface GenerationResult {
  status: "completed";
  asset: BrandAsset;
  message: ChatMessage;
  suggestedPreviewAssetId: string;
}

export const uploadFilePayloadSchema = z.object({
  clientId: z.string().min(1),
  name: z.string().min(1),
  size: z.number().nonnegative(),
  mimeType: z.string().min(1),
  kind: z.enum(brandSourceKindValues),
  previewLabel: z.string().min(1),
});

export const sourceSummarySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  kind: z.enum(brandSourceKindValues),
  status: z.enum(sourceStatusValues),
});

export const chatRequestSchema = z.object({
  query: z.string().trim().min(1),
  selectedAssetId: z.string().nullable(),
  sourceSummaries: z.array(sourceSummarySchema).default([]),
});

export const uploadRequestSchema = z.object({
  files: z.array(uploadFilePayloadSchema).min(1),
});

export const generationRequestSchema = z.object({
  prompt: z.string().trim().min(1),
  intent: z.enum(generationIntentValues),
  selectedAssetId: z.string().nullable(),
  sourceIds: z.array(z.string().min(1)).default([]),
});

export const sourceKindLabels: Record<BrandSourceKind, string> = {
  "figma-screenshot": "Figma screenshot",
  "pencil-board": "Pencil board",
  pdf: "PDF",
  "guideline-image": "Guideline image",
  other: "Other",
};

export const assetKindLabels: Record<AssetKind, string> = {
  logo: "Logo",
  palette: "Palette",
  font: "Font",
  template: "Template",
  moodboard: "Moodboard",
  banner: "Banner",
  guideline: "Guideline",
};
