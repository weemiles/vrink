const DEFAULT_RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const DEFAULT_RATE_LIMIT_MAX = 5;

function toPositiveNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
}

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  googleSheetsWebhookUrl: process.env.GOOGLE_SHEETS_WEBHOOK_URL ?? "",
  googleSheetsWebhookSecret: process.env.GOOGLE_SHEETS_WEBHOOK_SECRET ?? "",
  inquirySheetsWebhookUrl: process.env.INQUIRY_SHEETS_WEBHOOK_URL ?? "",
  inquirySheetsWebhookSecret: process.env.INQUIRY_SHEETS_WEBHOOK_SECRET ?? "",
  inquiryAttachmentBucket:
    process.env.INQUIRY_ATTACHMENT_BUCKET ?? "inquiry-attachments",
  hermesErpApiKey: process.env.HERMES_ERP_API_KEY ?? "",
  erpAuthBypass: process.env.ERP_AUTH_BYPASS === "true",
  slackSigningSecret: process.env.SLACK_SIGNING_SECRET ?? "",
  slackBotToken: process.env.SLACK_BOT_TOKEN ?? "",
  openaiApiKey: process.env.OPENAI_API_KEY ?? "",
  openaiModel: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
  leadRateLimitWindowMs: toPositiveNumber(
    process.env.LEAD_RATE_LIMIT_WINDOW_MS,
    DEFAULT_RATE_LIMIT_WINDOW_MS,
  ),
  leadRateLimitMax: toPositiveNumber(
    process.env.LEAD_RATE_LIMIT_MAX,
    DEFAULT_RATE_LIMIT_MAX,
  ),
};
