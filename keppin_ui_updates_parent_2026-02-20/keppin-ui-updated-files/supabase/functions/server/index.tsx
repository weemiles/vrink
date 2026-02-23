import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";
import * as kv from "./kv_store.tsx";
const app = new Hono();

const APP_PREFIX = "/make-server-0984a125";
const DEFAULT_ALLOWED_ORIGINS = [
  "http://localhost:4173",
  "http://127.0.0.1:4173",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
];
const CORS_ORIGIN_RULES = (
  (Deno.env.get("CORS_ALLOWED_ORIGINS") ?? DEFAULT_ALLOWED_ORIGINS.join(","))
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)
);
const FIRST_ALLOWED_ORIGIN = CORS_ORIGIN_RULES.find((rule) => !rule.includes("*")) ?? "http://localhost:4173";
const CORS_ORIGIN_REGEX_RULES = CORS_ORIGIN_RULES
  .filter((rule) => rule.includes("*"))
  .map((rule) => new RegExp(`^${rule
    .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
    .replace(/\\\*/g, ".*")}$`));
const SIGNUP_RATE_LIMIT_WINDOW_MS = Number(Deno.env.get("SIGNUP_RATE_LIMIT_WINDOW_MS") ?? "600000");
const SIGNUP_RATE_LIMIT_MAX = Number(Deno.env.get("SIGNUP_RATE_LIMIT_MAX") ?? "8");

function isOriginAllowed(origin: string): boolean {
  if (CORS_ORIGIN_RULES.includes("*")) return true;
  if (CORS_ORIGIN_RULES.includes(origin)) return true;
  return CORS_ORIGIN_REGEX_RULES.some((regex) => regex.test(origin));
}

// Enable logger
app.use('*', logger(console.log));

app.use("/*", async (c, next) => {
  const origin = c.req.header("origin");
  if (origin && !isOriginAllowed(origin)) {
    return c.json({ error: "허용되지 않은 origin입니다." }, 403);
  }
  await next();
});

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: (origin) => {
      if (origin && isOriginAllowed(origin)) return origin;
      return FIRST_ALLOWED_ORIGIN;
    },
    allowHeaders: ["Content-Type", "Authorization", "apikey", "x-user-token"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// ─── Helper: Supabase admin client ───
function adminClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

function getClientIp(req: any): string {
  const xForwardedFor = req.header("x-forwarded-for");
  if (xForwardedFor) {
    return xForwardedFor.split(",")[0]?.trim() || "unknown";
  }
  return req.header("cf-connecting-ip")
    ?? req.header("x-real-ip")
    ?? req.header("fly-client-ip")
    ?? "unknown";
}

function isISODate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function sanitizeString(value: unknown, maxLen: number): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLen);
}

function sanitizeBoolean(value: unknown): boolean {
  return value === true;
}

function sanitizeNumber(value: unknown, min: number, max: number, fallback = 0): number {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  return Math.min(max, Math.max(min, num));
}

async function enforceIpRateLimit(req: any, routeKey: string, maxRequests: number, windowMs: number) {
  const ip = getClientIp(req);
  const now = Date.now();
  const storeKey = `ratelimit:${routeKey}:${ip}`;

  try {
    const existing = await kv.get(storeKey) as { timestamps?: number[] } | null;
    const timestamps = (existing?.timestamps ?? []).filter((t) => now - t < windowMs);
    if (timestamps.length >= maxRequests) {
      const oldest = timestamps[0] ?? now;
      const retryAfterSec = Math.max(1, Math.ceil((windowMs - (now - oldest)) / 1000));
      return { ok: false as const, retryAfterSec };
    }
    timestamps.push(now);
    await kv.set(storeKey, { timestamps: timestamps.slice(-maxRequests) });
    return { ok: true as const };
  } catch (err) {
    // Rate-limit store 오류는 서비스 중단 대신 fail-open 처리
    console.log(`[ratelimit] Non-fatal error (${routeKey}): ${err}`);
    return { ok: true as const };
  }
}

async function verifyTurnstile(token: string, remoteIp: string): Promise<boolean> {
  const secret = Deno.env.get("TURNSTILE_SECRET_KEY");
  if (!secret) return true;
  if (!token) return false;

  try {
    const form = new URLSearchParams();
    form.set("secret", secret);
    form.set("response", token);
    if (remoteIp && remoteIp !== "unknown") form.set("remoteip", remoteIp);

    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form.toString(),
    });
    const data = await res.json().catch(() => ({}));
    return res.ok && data?.success === true;
  } catch (err) {
    console.log(`[turnstile] Verify error: ${err}`);
    return false;
  }
}

// ─── Storage bucket name ───
const AVATAR_BUCKET = "make-0984a125-avatars";

// ─── Idempotent bucket creation (runs once on startup) ───
(async () => {
  try {
    const supabase = adminClient();
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some((b: any) => b.name === AVATAR_BUCKET);
    if (!bucketExists) {
      await supabase.storage.createBucket(AVATAR_BUCKET, { public: false });
      console.log(`[storage] Created bucket: ${AVATAR_BUCKET}`);
    } else {
      console.log(`[storage] Bucket already exists: ${AVATAR_BUCKET}`);
    }
  } catch (err) {
    console.log(`[storage] Bucket init error (non-fatal): ${err}`);
  }
})();

// ─── Helper: Extract user from X-User-Token header (bypasses Edge Function JWT check) ───
async function getUserFromToken(req: any) {
  // 우선 X-User-Token 헤더에서 사용자 JWT를 읽음
  // (Authorization 헤더는 Edge Function 런타임이 anon key 검증용으로 사용)
  const userToken = req.header("x-user-token") ?? req.header("X-User-Token");
  // 하위 호환: X-User-Token이 없으면 Authorization에서 읽기 시도
  const authHeader = req.header("Authorization");
  const token = userToken || (authHeader ? authHeader.split(" ")[1] : null);
  if (!token) return null;
  const supabase = adminClient();
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return null;
  return data.user;
}

const OCCASION_KEYS = new Set([
  "birthday",
  "seollal",
  "chuseok",
  "christmas",
  "newYear",
  "parentsDay",
  "teachersDay",
  "valentine",
  "whiteDay",
  "childrenDay",
]);
const OCCASION_KEY_LIST = [...OCCASION_KEYS];
const INTERACTION_TYPES = new Set(["call", "message", "meeting", "gift", "sns", "other"]);

function isValidSendTime(value: string): boolean {
  const match = value.match(/^(\d{2}):(\d{2})$/);
  if (!match) return false;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  return Number.isInteger(hour) && Number.isInteger(minute) && hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59;
}

function sanitizeTagList(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  const trimmed = input
    .filter((v) => typeof v === "string")
    .map((v) => v.trim())
    .filter(Boolean)
    .slice(0, 20);
  return Array.from(new Set(trimmed));
}

function validateTaggedTemplates(input: unknown): { ok: true; templates: any[] } | { ok: false; error: string } {
  if (!Array.isArray(input)) {
    return { ok: false, error: "templates 배열이 필요합니다." };
  }

  if (input.length > 200) {
    return { ok: false, error: "templates는 최대 200개까지 저장할 수 있습니다." };
  }

  const seenIds = new Set<string>();
  const sanitized: any[] = [];

  for (const raw of input) {
    if (!raw || typeof raw !== "object") {
      return { ok: false, error: "유효하지 않은 템플릿 데이터가 포함되어 있습니다." };
    }

    const tpl = raw as Record<string, unknown>;
    const id = typeof tpl.id === "string" ? tpl.id.trim() : "";
    const occasion = typeof tpl.occasion === "string" ? tpl.occasion.trim() : "";
    const message = typeof tpl.message === "string" ? tpl.message.trim() : "";
    const targetTags = sanitizeTagList(tpl.targetTags);
    const sendTimeRaw = typeof tpl.sendTime === "string" ? tpl.sendTime.trim() : "09:00";
    const sendTime = isValidSendTime(sendTimeRaw) ? sendTimeRaw : "09:00";
    const enabled = tpl.enabled !== false;
    const createdAt = typeof tpl.createdAt === "number" && Number.isFinite(tpl.createdAt)
      ? tpl.createdAt
      : Date.now();

    if (!id) {
      return { ok: false, error: "template id는 필수입니다." };
    }
    if (seenIds.has(id)) {
      return { ok: false, error: "중복된 template id가 포함되어 있습니다." };
    }
    seenIds.add(id);

    if (!OCCASION_KEYS.has(occasion)) {
      return { ok: false, error: `유효하지 않은 occasion입니다: ${occasion}` };
    }
    if (!message || message.length > 200) {
      return { ok: false, error: "message는 1~200자 이내여야 합니다." };
    }
    if (targetTags.length === 0) {
      return { ok: false, error: "targetTags는 1개 이상 필요합니다." };
    }

    sanitized.push({
      id,
      occasion,
      message,
      targetTags,
      sendTime,
      enabled,
      createdAt,
    });
  }

  return { ok: true, templates: sanitized };
}

function validateSignupInput(input: unknown): { ok: true; value: { email: string; password: string; name: string } } | { ok: false; error: string } {
  if (!input || typeof input !== "object") {
    return { ok: false, error: "요청 본문이 올바르지 않습니다." };
  }
  const body = input as Record<string, unknown>;
  const email = sanitizeString(body.email, 120).toLowerCase();
  const password = typeof body.password === "string" ? body.password : "";
  const name = sanitizeString(body.name, 40);

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "올바른 이메일 형식을 입력해주세요." };
  }
  if (!password || password.length < 8 || password.length > 72) {
    return { ok: false, error: "비밀번호는 8자 이상 72자 이하여야 합니다." };
  }
  if (!name) {
    return { ok: false, error: "이름을 입력해주세요." };
  }

  return { ok: true, value: { email, password, name } };
}

function validateProfileUpdate(input: unknown): { ok: true; value: Record<string, unknown> } | { ok: false; error: string } {
  if (!input || typeof input !== "object") {
    return { ok: false, error: "요청 본문이 올바르지 않습니다." };
  }
  const body = input as Record<string, unknown>;
  const allowed: Record<string, unknown> = {};

  if ("name" in body) allowed.name = sanitizeString(body.name, 40);
  if ("statusMessage" in body) allowed.statusMessage = sanitizeString(body.statusMessage, 120);
  if ("profileImage" in body) allowed.profileImage = body.profileImage ?? null;
  if ("avatarPath" in body) allowed.avatarPath = sanitizeString(body.avatarPath, 240) || null;

  return { ok: true, value: allowed };
}

function validateContacts(input: unknown): { ok: true; contacts: any[] } | { ok: false; error: string } {
  if (!Array.isArray(input)) return { ok: false, error: "contacts 배열이 필요합니다." };
  if (input.length > 5000) return { ok: false, error: "contacts는 최대 5000개까지 저장할 수 있습니다." };

  const seen = new Set<string>();
  const contacts: any[] = [];

  for (const raw of input) {
    if (!raw || typeof raw !== "object") return { ok: false, error: "유효하지 않은 contact 데이터가 포함되어 있습니다." };
    const item = raw as Record<string, unknown>;
    const id = sanitizeString(item.id, 64);
    const name = sanitizeString(item.name, 50);
    const relationship = sanitizeString(item.relationship, 40);
    const birthday = sanitizeString(item.birthday, 10);
    const lastContact = sanitizeString(item.lastContact, 10);

    if (!id || !name || !relationship) {
      return { ok: false, error: "contact id, name, relationship는 필수입니다." };
    }
    if (seen.has(id)) return { ok: false, error: "중복된 contact id가 포함되어 있습니다." };
    seen.add(id);
    if (birthday && !isISODate(birthday)) return { ok: false, error: `유효하지 않은 birthday 형식입니다: ${id}` };
    if (lastContact && !isISODate(lastContact)) return { ok: false, error: `유효하지 않은 lastContact 형식입니다: ${id}` };

    const sanitized = {
      ...item,
      id,
      name,
      relationship,
      birthday,
      lastContact,
      memo: sanitizeString(item.memo, 2000),
      phone: sanitizeString(item.phone, 30),
      familyStatus: sanitizeString(item.familyStatus, 40),
      closeness: sanitizeString(item.closeness, 20),
      avatarColor: sanitizeString(item.avatarColor, 20),
      birthdayUnknown: sanitizeBoolean(item.birthdayUnknown),
      birthdayGiftDone: sanitizeBoolean(item.birthdayGiftDone),
      isFavorite: sanitizeBoolean(item.isFavorite),
      age: sanitizeNumber(item.age, 0, 130, 0),
      contactGap: sanitizeNumber(item.contactGap, 0, 36500, 0),
      birthdayDday: sanitizeNumber(item.birthdayDday, -1, 366, 0),
      groupIds: Array.isArray(item.groupIds) ? item.groupIds.filter((v) => typeof v === "string").map((v) => v.trim()).filter(Boolean).slice(0, 50) : [],
      tags: Array.isArray(item.tags) ? item.tags.filter((v) => typeof v === "string").map((v) => v.trim()).filter(Boolean).slice(0, 100) : [],
    };
    contacts.push(sanitized);
  }

  return { ok: true, contacts };
}

function validateCustomRelationships(input: unknown): { ok: true; value: { customRelationships: any[]; hiddenDefaults: string[] } } | { ok: false; error: string } {
  if (!input || typeof input !== "object") return { ok: false, error: "요청 본문이 올바르지 않습니다." };
  const body = input as Record<string, unknown>;
  const customRelationshipsRaw = Array.isArray(body.customRelationships) ? body.customRelationships : [];
  const hiddenDefaultsRaw = Array.isArray(body.hiddenDefaults) ? body.hiddenDefaults : [];

  if (customRelationshipsRaw.length > 100) return { ok: false, error: "customRelationships는 최대 100개까지 저장할 수 있습니다." };
  if (hiddenDefaultsRaw.length > 50) return { ok: false, error: "hiddenDefaults는 최대 50개까지 저장할 수 있습니다." };

  const customRelationships = customRelationshipsRaw
    .filter((r) => r && typeof r === "object")
    .map((r) => {
      const item = r as Record<string, unknown>;
      return {
        value: sanitizeString(item.value, 40),
        color: sanitizeString(item.color, 20),
      };
    })
    .filter((r) => r.value);

  const hiddenDefaults = hiddenDefaultsRaw
    .filter((v) => typeof v === "string")
    .map((v) => v.trim())
    .filter(Boolean)
    .slice(0, 50);

  return { ok: true, value: { customRelationships, hiddenDefaults } };
}

function sanitizeOccasions(input: unknown): Record<string, boolean> {
  const raw = input && typeof input === "object" ? (input as Record<string, unknown>) : {};
  const out: Record<string, boolean> = {};
  for (const key of OCCASION_KEY_LIST) {
    out[key] = raw[key] === true;
  }
  return out;
}

function sanitizeCustomMessages(input: unknown): Record<string, string> {
  const raw = input && typeof input === "object" ? (input as Record<string, unknown>) : {};
  const out: Record<string, string> = {};
  for (const key of OCCASION_KEY_LIST) {
    const value = sanitizeString(raw[key], 200);
    if (value) out[key] = value;
  }
  return out;
}

function validateAutoMessages(input: unknown): { ok: true; value: { prefs: any[]; sentIds: string[] } } | { ok: false; error: string } {
  if (!input || typeof input !== "object") return { ok: false, error: "요청 본문이 올바르지 않습니다." };
  const body = input as Record<string, unknown>;
  const prefsRaw = Array.isArray(body.prefs) ? body.prefs : [];
  const sentIdsRaw = Array.isArray(body.sentIds) ? body.sentIds : [];

  if (prefsRaw.length > 5000) return { ok: false, error: "prefs는 최대 5000개까지 저장할 수 있습니다." };
  if (sentIdsRaw.length > 10000) return { ok: false, error: "sentIds는 최대 10000개까지 저장할 수 있습니다." };

  const prefs = prefsRaw.map((p) => {
    const item = (p && typeof p === "object") ? (p as Record<string, unknown>) : {};
    const contactId = sanitizeString(item.contactId, 64);
    const sendTimeRaw = sanitizeString(item.sendTime, 5) || "09:00";
    return {
      contactId,
      enabled: sanitizeBoolean(item.enabled),
      occasions: sanitizeOccasions(item.occasions),
      customMessages: sanitizeCustomMessages(item.customMessages),
      sendTime: isValidSendTime(sendTimeRaw) ? sendTimeRaw : "09:00",
    };
  }).filter((p) => p.contactId);

  const sentIds = sentIdsRaw
    .filter((id) => typeof id === "string")
    .map((id) => id.trim())
    .filter(Boolean)
    .slice(0, 10000);

  return { ok: true, value: { prefs, sentIds } };
}

function validateGroups(input: unknown): { ok: true; groups: any[] } | { ok: false; error: string } {
  if (!Array.isArray(input)) return { ok: false, error: "groups 배열이 필요합니다." };
  if (input.length > 200) return { ok: false, error: "groups는 최대 200개까지 저장할 수 있습니다." };

  const seen = new Set<string>();
  const groups: any[] = [];
  for (const raw of input) {
    if (!raw || typeof raw !== "object") return { ok: false, error: "유효하지 않은 group 데이터가 포함되어 있습니다." };
    const item = raw as Record<string, unknown>;
    const id = sanitizeString(item.id, 64);
    const name = sanitizeString(item.name, 40);
    if (!id || !name) return { ok: false, error: "group id와 name은 필수입니다." };
    if (seen.has(id)) return { ok: false, error: "중복된 group id가 포함되어 있습니다." };
    seen.add(id);
    groups.push({
      ...item,
      id,
      name,
      color: sanitizeString(item.color, 20) || "#616161",
      emoji: sanitizeString(item.emoji, 8),
      createdAt: sanitizeNumber(item.createdAt, 0, Number.MAX_SAFE_INTEGER, Date.now()),
    });
  }
  return { ok: true, groups };
}

function validateNotificationSettings(input: unknown): { ok: true; value: Record<string, unknown> } | { ok: false; error: string } {
  if (!input || typeof input !== "object") return { ok: false, error: "요청 본문이 올바르지 않습니다." };
  const body = input as Record<string, unknown>;
  const quietStart = sanitizeString(body.quietHoursStart, 5) || "22:00";
  const quietEnd = sanitizeString(body.quietHoursEnd, 5) || "08:00";
  if (!isValidSendTime(quietStart) || !isValidSendTime(quietEnd)) {
    return { ok: false, error: "quiet hour 시간 형식이 올바르지 않습니다." };
  }
  return {
    ok: true,
    value: {
      pushEnabled: sanitizeBoolean(body.pushEnabled),
      birthdayAlert: sanitizeBoolean(body.birthdayAlert),
      autoMessageAlert: sanitizeBoolean(body.autoMessageAlert),
      contactReminderAlert: sanitizeBoolean(body.contactReminderAlert),
      reminderDays: sanitizeNumber(body.reminderDays, 1, 365, 14),
      quietHoursEnabled: sanitizeBoolean(body.quietHoursEnabled),
      quietHoursStart: quietStart,
      quietHoursEnd: quietEnd,
    },
  };
}

function validateInteractionLogs(input: unknown): { ok: true; logs: any[] } | { ok: false; error: string } {
  if (!Array.isArray(input)) return { ok: false, error: "logs 배열이 필요합니다." };
  if (input.length > 2000) return { ok: false, error: "logs는 최대 2000개까지 저장할 수 있습니다." };
  const logs: any[] = [];
  for (const raw of input) {
    if (!raw || typeof raw !== "object") return { ok: false, error: "유효하지 않은 log 데이터가 포함되어 있습니다." };
    const item = raw as Record<string, unknown>;
    const id = sanitizeString(item.id, 80);
    const contactId = sanitizeString(item.contactId, 64);
    const type = sanitizeString(item.type, 20);
    const note = sanitizeString(item.note, 200);
    const date = sanitizeString(item.date, 10);
    const createdAt = sanitizeString(item.createdAt, 40);
    if (!id || !contactId || !INTERACTION_TYPES.has(type)) return { ok: false, error: "유효하지 않은 interaction log 데이터입니다." };
    if (!isISODate(date)) return { ok: false, error: "interaction log date 형식이 올바르지 않습니다." };
    logs.push({ id, contactId, type, note, date, createdAt: createdAt || new Date().toISOString() });
  }
  return { ok: true, logs };
}

function validateTags(input: unknown): { ok: true; tags: any[] } | { ok: false; error: string } {
  if (!Array.isArray(input)) return { ok: false, error: "tags 배열이 필요합니다." };
  if (input.length > 100) return { ok: false, error: "tags는 최대 100개까지 저장할 수 있습니다." };
  const seen = new Set<string>();
  const tags: any[] = [];
  for (const raw of input) {
    if (!raw || typeof raw !== "object") return { ok: false, error: "유효하지 않은 tag 데이터가 포함되어 있습니다." };
    const item = raw as Record<string, unknown>;
    const id = sanitizeString(item.id, 64);
    const label = sanitizeString(item.label, 40);
    if (!id || !label) return { ok: false, error: "tag id와 label은 필수입니다." };
    if (seen.has(id)) return { ok: false, error: "중복된 tag id가 포함되어 있습니다." };
    seen.add(id);
    tags.push({
      ...item,
      id,
      label,
      color: sanitizeString(item.color, 20) || "#616161",
      createdAt: sanitizeNumber(item.createdAt, 0, Number.MAX_SAFE_INTEGER, Date.now()),
    });
  }
  return { ok: true, tags };
}

// Health check endpoint
app.get(`${APP_PREFIX}/health`, (c) => {
  return c.json({ status: "ok" });
});

// ─── Sign Up ───
app.post(`${APP_PREFIX}/signup`, async (c) => {
  try {
    const rateLimit = await enforceIpRateLimit(c.req, "signup", SIGNUP_RATE_LIMIT_MAX, SIGNUP_RATE_LIMIT_WINDOW_MS);
    if (!rateLimit.ok) {
      c.header("Retry-After", String(rateLimit.retryAfterSec));
      return c.json({ error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." }, 429);
    }

    const body = await c.req.json().catch(() => ({}));
    const signup = validateSignupInput(body);
    if (!signup.ok) {
      return c.json({ error: signup.error }, 400);
    }

    const captchaToken = sanitizeString((body as Record<string, unknown>)?.turnstileToken, 4000);
    const clientIp = getClientIp(c.req);
    const captchaOk = await verifyTurnstile(captchaToken, clientIp);
    if (!captchaOk) {
      return c.json({ error: "보안 검증에 실패했습니다. 다시 시도해주세요." }, 400);
    }

    const supabase = adminClient();
    const { data, error } = await supabase.auth.admin.createUser({
      email: signup.value.email,
      password: signup.value.password,
      user_metadata: { name: signup.value.name },
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true,
    });

    if (error) {
      console.log(`[signup] Error creating user for ${signup.value.email}: ${error.message}`);
      // Provide user-friendly messages for common errors
      if (error.message.includes("already been registered")) {
        return c.json({ error: "이미 가입된 이메일입니다." }, 409);
      }
      return c.json({ error: `회원가입 실패: ${error.message}` }, 400);
    }

    console.log(`[signup] User created: ${data.user.id} (${signup.value.email})`);

    // Store initial profile in KV
    await kv.set(`profile:${data.user.id}`, {
      name: signup.value.name,
      email: signup.value.email,
      statusMessage: "",
      profileImage: null,
      createdAt: new Date().toISOString(),
    });

    return c.json({
      user: {
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.name,
      },
    });
  } catch (err) {
    console.log(`[signup] Unexpected error: ${err}`);
    return c.json({ error: `회원가입 중 서버 오류가 발생했습니다: ${err}` }, 500);
  }
});

// ─── Get User Profile (requires auth) ───
app.get(`${APP_PREFIX}/profile`, async (c) => {
  try {
    const user = await getUserFromToken(c.req);
    if (!user) {
      return c.json({ error: "인증이 필요합니다." }, 401);
    }

    const profile = await kv.get(`profile:${user.id}`) as any;
    const result = profile ?? {
      name: user.user_metadata?.name ?? "사용자",
      email: user.email,
      statusMessage: "",
      profileImage: null,
      avatarPath: null,
    };

    // If avatarPath exists, generate a signed URL (valid 1 hour)
    if (result.avatarPath) {
      try {
        const supabase = adminClient();
        const { data, error } = await supabase.storage
          .from(AVATAR_BUCKET)
          .createSignedUrl(result.avatarPath, 3600);
        if (!error && data?.signedUrl) {
          result.profileImageUrl = data.signedUrl;
        }
      } catch (e) {
        console.log(`[profile] Signed URL error (non-fatal): ${e}`);
      }
    }

    return c.json({ profile: result });
  } catch (err) {
    console.log(`[profile] Error: ${err}`);
    return c.json({ error: `프로필 조회 실패: ${err}` }, 500);
  }
});

// ─── Update User Profile (requires auth) ───
app.put(`${APP_PREFIX}/profile`, async (c) => {
  try {
    const user = await getUserFromToken(c.req);
    if (!user) {
      return c.json({ error: "인증이 필요합니다." }, 401);
    }

    const body = await c.req.json().catch(() => ({}));
    const validation = validateProfileUpdate(body);
    if (!validation.ok) {
      return c.json({ error: validation.error }, 400);
    }
    const existing = await kv.get(`profile:${user.id}`);
    const updated = {
      ...(existing ?? {}),
      ...validation.value,
      email: user.email, // email is immutable from profile
    };
    await kv.set(`profile:${user.id}`, updated);

    return c.json({ profile: updated });
  } catch (err) {
    console.log(`[profile update] Error: ${err}`);
    return c.json({ error: `프로필 수정 실패: ${err}` }, 500);
  }
});

// ─── Avatar Upload (Supabase Storage) ───
app.post(`${APP_PREFIX}/profile/avatar`, async (c) => {
  try {
    const user = await getUserFromToken(c.req);
    if (!user) {
      return c.json({ error: "인증이 필요합니다." }, 401);
    }

    const formData = await c.req.formData();
    const file = formData.get("avatar") as File | null;
    if (!file) {
      return c.json({ error: "파일이 필요합니다." }, 400);
    }

    // Validate file type and size (max 5MB)
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return c.json({ error: "지원하지 않는 이미지 형식입니다. (JPG, PNG, WebP만 가능)" }, 400);
    }
    if (file.size > 5 * 1024 * 1024) {
      return c.json({ error: "5MB 이하의 이미지만 업로드할 수 있습니다." }, 400);
    }

    const ext = file.type.split("/")[1] === "jpeg" ? "jpg" : file.type.split("/")[1];
    const filePath = `${user.id}/avatar.${ext}`;
    const fileBuffer = await file.arrayBuffer();

    const supabase = adminClient();

    // Delete existing avatar if present
    const existing = await kv.get(`profile:${user.id}`) as any;
    if (existing?.avatarPath) {
      await supabase.storage.from(AVATAR_BUCKET).remove([existing.avatarPath]);
    }

    // Upload new avatar
    const { error: uploadError } = await supabase.storage
      .from(AVATAR_BUCKET)
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.log(`[avatar upload] Upload error: ${uploadError.message}`);
      return c.json({ error: `이미지 업로드 실패: ${uploadError.message}` }, 500);
    }

    // Generate signed URL (valid 1 hour)
    const { data: signedData } = await supabase.storage
      .from(AVATAR_BUCKET)
      .createSignedUrl(filePath, 3600);

    // Save avatar path to profile
    const profile = existing ?? {};
    profile.avatarPath = filePath;
    profile.profileImage = null; // clear old base64 if any
    await kv.set(`profile:${user.id}`, profile);

    console.log(`[avatar upload] Success for user ${user.id}: ${filePath}`);
    return c.json({
      success: true,
      avatarPath: filePath,
      profileImageUrl: signedData?.signedUrl ?? null,
    });
  } catch (err) {
    console.log(`[avatar upload] Unexpected error: ${err}`);
    return c.json({ error: `이미지 업로드 중 서버 오류가 발생했습니다: ${err}` }, 500);
  }
});

// ─── Avatar Delete ───
app.delete(`${APP_PREFIX}/profile/avatar`, async (c) => {
  try {
    const user = await getUserFromToken(c.req);
    if (!user) {
      return c.json({ error: "인증이 필요합니다." }, 401);
    }

    const existing = await kv.get(`profile:${user.id}`) as any;
    if (existing?.avatarPath) {
      const supabase = adminClient();
      await supabase.storage.from(AVATAR_BUCKET).remove([existing.avatarPath]);
      existing.avatarPath = null;
      existing.profileImage = null;
      await kv.set(`profile:${user.id}`, existing);
      console.log(`[avatar delete] Deleted avatar for user ${user.id}`);
    }

    return c.json({ success: true });
  } catch (err) {
    console.log(`[avatar delete] Unexpected error: ${err}`);
    return c.json({ error: `이미지 삭제 실패: ${err}` }, 500);
  }
});

// ═══════════════════════════════════════════════
// 연락처 CRUD (KV Store 기반, 사용자별 격리)
// ═══════════════════════════════════════════════

// ─── GET /contacts ─── 사용자의 전체 연락처 조회
app.get(`${APP_PREFIX}/contacts`, async (c) => {
  try {
    const user = await getUserFromToken(c.req);
    if (!user) {
      return c.json({ error: "인증이 필요합니다." }, 401);
    }

    const contacts = await kv.get(`contacts:${user.id}`);
    return c.json({ contacts: contacts ?? [] });
  } catch (err) {
    console.log(`[contacts GET] Error: ${err}`);
    return c.json({ error: `연락처 조회 실패: ${err}` }, 500);
  }
});

// ─── PUT /contacts ─── 사용자의 전체 연락처 저장 (전체 교체)
app.put(`${APP_PREFIX}/contacts`, async (c) => {
  try {
    const user = await getUserFromToken(c.req);
    if (!user) {
      return c.json({ error: "인증이 필요합니다." }, 401);
    }

    const body = await c.req.json().catch(() => ({}));
    const validation = validateContacts((body as Record<string, unknown>).contacts);
    if (!validation.ok) {
      return c.json({ error: validation.error }, 400);
    }

    await kv.set(`contacts:${user.id}`, validation.contacts);
    console.log(`[contacts PUT] Saved ${validation.contacts.length} contacts for user ${user.id}`);
    return c.json({ success: true, count: validation.contacts.length });
  } catch (err) {
    console.log(`[contacts PUT] Error: ${err}`);
    return c.json({ error: `연락처 저장 실패: ${err}` }, 500);
  }
});

// ─── GET /custom-relationships ─── 커스텀 관계 타입 조회
app.get(`${APP_PREFIX}/custom-relationships`, async (c) => {
  try {
    const user = await getUserFromToken(c.req);
    if (!user) {
      return c.json({ error: "인증이 필요합니다." }, 401);
    }

    const data = await kv.get(`custom_rels:${user.id}`);
    return c.json({
      customRelationships: data?.customRelationships ?? [],
      hiddenDefaults: data?.hiddenDefaults ?? [],
    });
  } catch (err) {
    console.log(`[custom-rels GET] Error: ${err}`);
    return c.json({ error: `관계 타입 조회 실패: ${err}` }, 500);
  }
});

// ─── PUT /custom-relationships ─── 커스텀 관계 타입 저장
app.put(`${APP_PREFIX}/custom-relationships`, async (c) => {
  try {
    const user = await getUserFromToken(c.req);
    if (!user) {
      return c.json({ error: "인증이 필요합니다." }, 401);
    }

    const body = await c.req.json().catch(() => ({}));
    const validation = validateCustomRelationships(body);
    if (!validation.ok) {
      return c.json({ error: validation.error }, 400);
    }

    await kv.set(`custom_rels:${user.id}`, validation.value);

    return c.json({ success: true });
  } catch (err) {
    console.log(`[custom-rels PUT] Error: ${err}`);
    return c.json({ error: `관계 타입 저장 실패: ${err}` }, 500);
  }
});

// ═══════════════════════════════════════════════
// 자동 메시지 설정 (KV Store 기반, 사용자별 격리)
// ═══════════════════════════════════════════════

// ─── GET /auto-messages ─── 자동 메시지 설정 조회
app.get(`${APP_PREFIX}/auto-messages`, async (c) => {
  try {
    const user = await getUserFromToken(c.req);
    if (!user) {
      return c.json({ error: "인증이 필요합니다." }, 401);
    }

    const data = await kv.get(`auto_messages:${user.id}`);
    return c.json({
      prefs: data?.prefs ?? [],
      sentIds: data?.sentIds ?? [],
    });
  } catch (err) {
    console.log(`[auto-messages GET] Error: ${err}`);
    return c.json({ error: `자동 메시지 설정 조회 실패: ${err}` }, 500);
  }
});

// ─── PUT /auto-messages ─── 자동 메시지 설정 저장
app.put(`${APP_PREFIX}/auto-messages`, async (c) => {
  try {
    const user = await getUserFromToken(c.req);
    if (!user) {
      return c.json({ error: "인증이 필요합니다." }, 401);
    }

    const body = await c.req.json().catch(() => ({}));
    const validation = validateAutoMessages(body);
    if (!validation.ok) {
      return c.json({ error: validation.error }, 400);
    }

    await kv.set(`auto_messages:${user.id}`, validation.value);

    console.log(`[auto-messages PUT] Saved ${validation.value.prefs.length} prefs for user ${user.id}`);
    return c.json({ success: true });
  } catch (err) {
    console.log(`[auto-messages PUT] Error: ${err}`);
    return c.json({ error: `자동 메시지 설정 저장 실패: ${err}` }, 500);
  }
});

// ═══════════════════════════════════════════════
// 태그 기반 메시지 템플릿 (KV Store 기반, 사용자별 격리)
// ═══════════════════════════════════════════════

// ─── GET /tagged-templates ─── 태그 메시지 템플릿 조회
app.get(`${APP_PREFIX}/tagged-templates`, async (c) => {
  try {
    const user = await getUserFromToken(c.req);
    if (!user) {
      return c.json({ error: "인증이 필요합니다." }, 401);
    }

    const data = await kv.get(`tagged_templates:${user.id}`);
    return c.json({ templates: data ?? [] });
  } catch (err) {
    console.log(`[tagged-templates GET] Error: ${err}`);
    return c.json({ error: `태그 템플릿 조회 실패: ${err}` }, 500);
  }
});

// ─── PUT /tagged-templates ─── 태그 메시지 템플릿 저장
app.put(`${APP_PREFIX}/tagged-templates`, async (c) => {
  try {
    const user = await getUserFromToken(c.req);
    if (!user) {
      return c.json({ error: "인증이 필요합니다." }, 401);
    }

    const body = await c.req.json().catch(() => ({}));
    const { templates } = body;
    const validation = validateTaggedTemplates(templates);
    if (!validation.ok) {
      return c.json({ error: validation.error }, 400);
    }

    await kv.set(`tagged_templates:${user.id}`, validation.templates);
    console.log(`[tagged-templates PUT] Saved ${validation.templates.length} templates for user ${user.id}`);
    return c.json({ success: true, count: validation.templates.length });
  } catch (err) {
    console.log(`[tagged-templates PUT] Error: ${err}`);
    return c.json({ error: `태그 템플릿 저장 실패: ${err}` }, 500);
  }
});

// ═══════════════════════════════════════════════
// 연락처 그룹 (KV Store 기반, 사용자별 격리)
// ═══════════════════════════════════════════════

// ─── GET /contact-groups ─── 연락처 그룹 목록 조회
app.get(`${APP_PREFIX}/contact-groups`, async (c) => {
  try {
    const user = await getUserFromToken(c.req);
    if (!user) {
      return c.json({ error: "인증이 필요합니다." }, 401);
    }

    const data = await kv.get(`contact_groups:${user.id}`);
    return c.json({ groups: data ?? [] });
  } catch (err) {
    console.log(`[contact-groups GET] Error: ${err}`);
    return c.json({ error: `그룹 조회 실패: ${err}` }, 500);
  }
});

// ─── PUT /contact-groups ─── 연락처 그룹 저장 (전체 교체)
app.put(`${APP_PREFIX}/contact-groups`, async (c) => {
  try {
    const user = await getUserFromToken(c.req);
    if (!user) {
      return c.json({ error: "인증이 필요합니다." }, 401);
    }

    const body = await c.req.json().catch(() => ({}));
    const validation = validateGroups((body as Record<string, unknown>).groups);
    if (!validation.ok) {
      return c.json({ error: validation.error }, 400);
    }

    await kv.set(`contact_groups:${user.id}`, validation.groups);
    console.log(`[contact-groups PUT] Saved ${validation.groups.length} groups for user ${user.id}`);
    return c.json({ success: true, count: validation.groups.length });
  } catch (err) {
    console.log(`[contact-groups PUT] Error: ${err}`);
    return c.json({ error: `그룹 저장 실패: ${err}` }, 500);
  }
});

// ═══════════════════════════════════════════════
// 서버 알림 (KV Store 기반, 사용자별 격리)
// ═══════════════════════════════════════════════

// 알림 타입 정의
interface ServerNotification {
  id: string;
  type: 'auto_message' | 'birthday_reminder' | 'contact_reminder' | 'system';
  title: string;
  body: string;
  contactId?: string;
  occasion?: string;
  read: boolean;
  createdAt: string;
}

// ─── GET /notifications ─── 사용자 알림 조회
app.get(`${APP_PREFIX}/notifications`, async (c) => {
  try {
    const user = await getUserFromToken(c.req);
    if (!user) {
      return c.json({ error: "인증이 필요합니다." }, 401);
    }

    const data = await kv.get(`notifications:${user.id}`) as any;
    const notifications: ServerNotification[] = data?.items ?? [];

    // 최근 30일 알림만 반환
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    const recent = notifications.filter(n => new Date(n.createdAt) >= cutoff);

    return c.json({
      notifications: recent,
      unreadCount: recent.filter(n => !n.read).length,
    });
  } catch (err) {
    console.log(`[notifications GET] Error: ${err}`);
    return c.json({ error: `알림 조회 실패: ${err}` }, 500);
  }
});

// ─── POST /notifications/generate ─── 오늘 날짜 기준 알림 생성
app.post(`${APP_PREFIX}/notifications/generate`, async (c) => {
  try {
    const user = await getUserFromToken(c.req);
    if (!user) {
      return c.json({ error: "인증이 필요합니다." }, 401);
    }

    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const [contactsRaw, autoMsgRaw, notifRaw] = await Promise.all([
      kv.get(`contacts:${user.id}`),
      kv.get(`auto_messages:${user.id}`),
      kv.get(`notifications:${user.id}`),
    ]);
    const contacts = Array.isArray(contactsRaw) ? contactsRaw : [];
    const autoMessagePrefs = Array.isArray((autoMsgRaw as any)?.prefs) ? (autoMsgRaw as any).prefs : [];
    const existing: ServerNotification[] = (notifRaw as any)?.items ?? [];
    const existingIds = new Set(existing.map(n => n.id));

    const newNotifications: ServerNotification[] = [];

    // 2) 오늘이 생일인 연락처 알림
    for (const ct of contacts) {
      if (!ct.birthday) continue;
      const contactId = sanitizeString(ct.id, 64);
      if (!contactId) continue;
      const bMonth = parseInt(ct.birthday.slice(5, 7), 10);
      const bDay = parseInt(ct.birthday.slice(8, 10), 10);
      if (bMonth === now.getMonth() + 1 && bDay === now.getDate()) {
        const name = sanitizeString(ct.name, 50) || "이 연락처";
        const notifId = `birthday-${contactId}-${todayStr}`;
        if (existingIds.has(notifId)) continue;
        newNotifications.push({
          id: notifId,
          type: 'birthday_reminder',
          title: `오늘은 ${name}님의 생일이에요! 🎂`,
          body: `${sanitizeString(ct.relationship, 40) || "지인"} · ${name}님에게 축하 메시지를 보내보세요`,
          contactId,
          read: false,
          createdAt: now.toISOString(),
        });
        existingIds.add(notifId);

        // 1) 서버 저장 데이터 기반 자동 메시지 알림 생성 (생일)
        const pref = autoMessagePrefs.find((p: any) => p?.contactId === contactId);
        if (pref?.enabled === true && pref?.occasions?.birthday === true) {
          const autoMessageNotifId = `auto-msg-${contactId}-birthday-${todayStr}`;
          if (!existingIds.has(autoMessageNotifId)) {
            const custom = sanitizeString(pref?.customMessages?.birthday, 200);
            const rendered = (custom || "{name}님, 생일 축하해요!").replaceAll("{name}", name);
            newNotifications.push({
              id: autoMessageNotifId,
              type: "auto_message",
              title: `${name}님에게 메시지를 보낼 시간이에요`,
              body: rendered.slice(0, 80) || "자동 메시지가 예약되어 있어요",
              contactId,
              occasion: "birthday",
              read: false,
              createdAt: now.toISOString(),
            });
            existingIds.add(autoMessageNotifId);
          }
        }
      }
    }

    // 3) 연락 공백 30일 이상 연락처 리마인더 (하루 최대 3개)
    const attentionContacts = contacts
      .map((ct: any) => ({ ...ct, _gap: sanitizeNumber(ct.contactGap, 0, 36500, 0) }))
      .filter((ct: any) => ct._gap >= 30)
      .sort((a: any, b: any) => b._gap - a._gap)
      .slice(0, 3);

    for (const ct of attentionContacts) {
      const contactId = sanitizeString(ct.id, 64);
      if (!contactId) continue;
      const notifId = `attention-${contactId}-${todayStr}`;
      if (existingIds.has(notifId)) continue;
      newNotifications.push({
        id: notifId,
        type: 'contact_reminder',
        title: `${sanitizeString(ct.name, 50) || "이 연락처"}님에게 연락해보세요`,
        body: `마지막 연락으로부터 ${ct._gap}일이 지났어요`,
        contactId,
        read: false,
        createdAt: now.toISOString(),
      });
      existingIds.add(notifId);
    }

    // 저장
    if (newNotifications.length > 0) {
      const all = [...newNotifications, ...existing].slice(0, 200); // 최대 200개 유지
      await kv.set(`notifications:${user.id}`, { items: all });
      console.log(`[notifications generate] Created ${newNotifications.length} new for user ${user.id}`);
    }

    return c.json({
      generated: newNotifications.length,
      total: existing.length + newNotifications.length,
      unreadCount: [...newNotifications, ...existing].filter(n => !n.read).length,
    });
  } catch (err) {
    console.log(`[notifications generate] Error: ${err}`);
    return c.json({ error: `알림 생성 실패: ${err}` }, 500);
  }
});

// ─── PUT /notifications/read ─── 모든 알림 읽음 처리
app.put(`${APP_PREFIX}/notifications/read`, async (c) => {
  try {
    const user = await getUserFromToken(c.req);
    if (!user) {
      return c.json({ error: "인증이 필요합니다." }, 401);
    }

    const data = await kv.get(`notifications:${user.id}`) as any;
    if (data?.items) {
      const items = data.items.map((n: ServerNotification) => ({ ...n, read: true }));
      await kv.set(`notifications:${user.id}`, { items });
    }

    return c.json({ success: true });
  } catch (err) {
    console.log(`[notifications read] Error: ${err}`);
    return c.json({ error: `알림 읽음 처리 실패: ${err}` }, 500);
  }
});

// ─── DELETE /notifications ─── 전체 알림 삭제
app.delete(`${APP_PREFIX}/notifications`, async (c) => {
  try {
    const user = await getUserFromToken(c.req);
    if (!user) {
      return c.json({ error: "인증이 필요합니다." }, 401);
    }

    await kv.set(`notifications:${user.id}`, { items: [] });
    return c.json({ success: true });
  } catch (err) {
    console.log(`[notifications delete] Error: ${err}`);
    return c.json({ error: `알림 삭제 실패: ${err}` }, 500);
  }
});

// ─── DELETE /notifications/:id ─── 개별 알림 삭제
app.delete(`${APP_PREFIX}/notifications/:id`, async (c) => {
  try {
    const user = await getUserFromToken(c.req);
    if (!user) {
      return c.json({ error: "인증이 필요합니다." }, 401);
    }

    const notifId = sanitizeString(c.req.param("id"), 120);
    if (!notifId) {
      return c.json({ error: "notification id가 필요합니다." }, 400);
    }
    const data = await kv.get(`notifications:${user.id}`) as any;
    if (data?.items) {
      const filtered = data.items.filter((n: ServerNotification) => n.id !== notifId);
      await kv.set(`notifications:${user.id}`, { items: filtered });
    }

    return c.json({ success: true });
  } catch (err) {
    console.log(`[notification delete single] Error: ${err}`);
    return c.json({ error: `알림 삭제 실패: ${err}` }, 500);
  }
});

// ═══════════════════════════════════════════════
// 알림 설정 (KV Store 기반, 사용자별 격리)
// ═══════════════════════════════════════════════

// ─── GET /notification-settings ─── 알림 설정 조회
app.get(`${APP_PREFIX}/notification-settings`, async (c) => {
  try {
    const user = await getUserFromToken(c.req);
    if (!user) {
      return c.json({ error: "인증이 필요합니다." }, 401);
    }

    const data = await kv.get(`notif_settings:${user.id}`) as any;
    return c.json({
      settings: data ?? {
        pushEnabled: true,
        birthdayAlert: true,
        autoMessageAlert: true,
        contactReminderAlert: true,
        reminderDays: 14,
        quietHoursEnabled: false,
        quietHoursStart: '22:00',
        quietHoursEnd: '08:00',
      },
    });
  } catch (err) {
    console.log(`[notification-settings GET] Error: ${err}`);
    return c.json({ error: `알림 설정 조회 실패: ${err}` }, 500);
  }
});

// ─── PUT /notification-settings ─── 알림 설정 저장
app.put(`${APP_PREFIX}/notification-settings`, async (c) => {
  try {
    const user = await getUserFromToken(c.req);
    if (!user) {
      return c.json({ error: "인증이 필요합니다." }, 401);
    }

    const body = await c.req.json().catch(() => ({}));
    const validation = validateNotificationSettings(body);
    if (!validation.ok) {
      return c.json({ error: validation.error }, 400);
    }
    const existing = await kv.get(`notif_settings:${user.id}`) as any;
    const updated = { ...(existing ?? {}), ...validation.value };
    await kv.set(`notif_settings:${user.id}`, updated);

    console.log(`[notification-settings PUT] Saved for user ${user.id}`);
    return c.json({ settings: updated });
  } catch (err) {
    console.log(`[notification-settings PUT] Error: ${err}`);
    return c.json({ error: `알림 설정 저장 실패: ${err}` }, 500);
  }
});

// ═══════════════════════════════════════════════
// 5단계: 연락 기록 (Interaction Logs)
// KV key: interaction_logs:{userId} → { items: InteractionLog[] }
// ═══════════════════════════════════════════════

interface InteractionLog {
  id: string;
  contactId: string;
  type: 'call' | 'message' | 'meeting' | 'gift' | 'sns' | 'other';
  note: string;
  date: string;        // YYYY-MM-DD
  createdAt: string;   // ISO string
}

// ─── GET /interaction-logs ─── 연락 기록 조회 (쿼리: ?contactId=xxx)
app.get(`${APP_PREFIX}/interaction-logs`, async (c) => {
  try {
    const user = await getUserFromToken(c.req);
    if (!user) {
      return c.json({ error: "인증이 필요합니다." }, 401);
    }

    const data = await kv.get(`interaction_logs:${user.id}`) as any;
    let logs: InteractionLog[] = data?.items ?? [];

    // 선택적 contactId 필터
    const contactId = sanitizeString(c.req.query("contactId"), 64);
    if (contactId) {
      logs = logs.filter(l => l.contactId === contactId);
    }

    // 최신순 정렬
    logs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return c.json({ logs, total: logs.length });
  } catch (err) {
    console.log(`[interaction-logs GET] Error: ${err}`);
    return c.json({ error: `연락 기록 조회 실패: ${err}` }, 500);
  }
});

// ─── POST /interaction-logs ─── 단일 연락 기록 추가
app.post(`${APP_PREFIX}/interaction-logs`, async (c) => {
  try {
    const user = await getUserFromToken(c.req);
    if (!user) {
      return c.json({ error: "인증이 필요합니다." }, 401);
    }

    const body = await c.req.json().catch(() => ({}));
    const { contactId, type, note, date } = body as Record<string, unknown>;
    const safeContactId = sanitizeString(contactId, 64);
    const safeType = sanitizeString(type, 20);
    const safeDate = sanitizeString(date, 10);
    const safeNote = sanitizeString(note, 200);

    if (!safeContactId || !safeType || !safeDate) {
      return c.json({ error: "contactId, type, date는 필수 입력값입니다." }, 400);
    }

    const validTypes = [...INTERACTION_TYPES];
    if (!INTERACTION_TYPES.has(safeType)) {
      return c.json({ error: `유효하지 않은 연락 타입입니다. (허용: ${validTypes.join(', ')})` }, 400);
    }
    if (!isISODate(safeDate)) {
      return c.json({ error: "date 형식은 YYYY-MM-DD 이어야 합니다." }, 400);
    }

    const now = new Date();
    const newLog: InteractionLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      contactId: safeContactId,
      type: safeType as InteractionLog["type"],
      note: safeNote,
      date: safeDate,
      createdAt: now.toISOString(),
    };

    const data = await kv.get(`interaction_logs:${user.id}`) as any;
    const existing: InteractionLog[] = data?.items ?? [];

    // 최대 2000개 유지 (오래된 것부터 제거)
    const all = [newLog, ...existing].slice(0, 2000);
    await kv.set(`interaction_logs:${user.id}`, { items: all });

    // 연락처의 lastContact도 자동 갱신 (날짜가 기존보다 최신이면)
    const contacts = await kv.get(`contacts:${user.id}`) as any[];
    if (Array.isArray(contacts)) {
      const idx = contacts.findIndex((ct: any) => ct.id === safeContactId);
      if (idx >= 0) {
        const ct = contacts[idx];
        if (!ct.lastContact || safeDate > ct.lastContact) {
          contacts[idx] = { ...ct, lastContact: safeDate };
          await kv.set(`contacts:${user.id}`, contacts);
          console.log(`[interaction-logs POST] Updated lastContact for contact ${safeContactId}`);
        }
      }
    }

    console.log(`[interaction-logs POST] Added log ${newLog.id} for contact ${safeContactId} by user ${user.id}`);
    return c.json({ success: true, log: newLog });
  } catch (err) {
    console.log(`[interaction-logs POST] Error: ${err}`);
    return c.json({ error: `연락 기록 추가 실패: ${err}` }, 500);
  }
});

// ─── PUT /interaction-logs ─── 연락 기록 전체 저장 (전체 교체)
app.put(`${APP_PREFIX}/interaction-logs`, async (c) => {
  try {
    const user = await getUserFromToken(c.req);
    if (!user) {
      return c.json({ error: "인증이 필요합니다." }, 401);
    }

    const body = await c.req.json().catch(() => ({}));
    const validation = validateInteractionLogs((body as Record<string, unknown>).logs);
    if (!validation.ok) {
      return c.json({ error: validation.error }, 400);
    }

    await kv.set(`interaction_logs:${user.id}`, { items: validation.logs });
    console.log(`[interaction-logs PUT] Saved ${validation.logs.length} logs for user ${user.id}`);
    return c.json({ success: true, count: validation.logs.length });
  } catch (err) {
    console.log(`[interaction-logs PUT] Error: ${err}`);
    return c.json({ error: `연락 기록 저장 실패: ${err}` }, 500);
  }
});

// ─── DELETE /interaction-logs/:id ─── 개별 연락 기록 삭제
app.delete(`${APP_PREFIX}/interaction-logs/:id`, async (c) => {
  try {
    const user = await getUserFromToken(c.req);
    if (!user) {
      return c.json({ error: "인증이 필요합니다." }, 401);
    }

    const logId = sanitizeString(c.req.param("id"), 120);
    if (!logId) {
      return c.json({ error: "log id가 필요합니다." }, 400);
    }
    const data = await kv.get(`interaction_logs:${user.id}`) as any;
    if (data?.items) {
      const filtered = data.items.filter((l: InteractionLog) => l.id !== logId);
      await kv.set(`interaction_logs:${user.id}`, { items: filtered });
      console.log(`[interaction-logs DELETE] Removed log ${logId} for user ${user.id}`);
    }

    return c.json({ success: true });
  } catch (err) {
    console.log(`[interaction-logs DELETE] Error: ${err}`);
    return c.json({ error: `연락 기록 삭제 실패: ${err}` }, 500);
  }
});

// ═══════════════════════════════════════════════
// 5단계: 통계 (Stats) — 서버에서 계산하여 제공
// ═══════════════════════════════════════════════

app.get(`${APP_PREFIX}/stats`, async (c) => {
  try {
    const user = await getUserFromToken(c.req);
    if (!user) {
      return c.json({ error: "인증이 필요합니다." }, 401);
    }

    const userId = user.id;

    // 병렬로 필요한 데이터 로드
    const [contactsRaw, logsRaw, groupsRaw, autoMsgRaw] = await Promise.all([
      kv.get(`contacts:${userId}`),
      kv.get(`interaction_logs:${userId}`),
      kv.get(`contact_groups:${userId}`),
      kv.get(`auto_messages:${userId}`),
    ]);

    const contacts: any[] = Array.isArray(contactsRaw) ? contactsRaw : [];
    const logs: InteractionLog[] = (logsRaw as any)?.items ?? [];
    const groups: any[] = Array.isArray(groupsRaw) ? groupsRaw : [];
    const autoMsgPrefs: any[] = (autoMsgRaw as any)?.prefs ?? [];

    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    // ── 1) 기본 통계 ──
    const totalContacts = contacts.length;
    const totalLogs = logs.length;
    const totalGroups = groups.length;
    const favoriteCount = contacts.filter(ct => ct.isFavorite).length;

    // ── 2) 관계 분포 ──
    const relationshipDistribution: Record<string, number> = {};
    for (const ct of contacts) {
      const rel = ct.relationship || '기타';
      relationshipDistribution[rel] = (relationshipDistribution[rel] || 0) + 1;
    }

    // ── 3) 친밀도 분포 ──
    const closenessDistribution: Record<string, number> = {};
    for (const ct of contacts) {
      const c = ct.closeness || '보통';
      closenessDistribution[c] = (closenessDistribution[c] || 0) + 1;
    }

    // ── 4) 최근 30일 연락 기록 분석 ──
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentLogs = logs.filter(l => new Date(l.date) >= thirtyDaysAgo);
    const recentLogCount = recentLogs.length;

    // 연락 타입별 분포
    const logTypeDistribution: Record<string, number> = {};
    for (const l of recentLogs) {
      logTypeDistribution[l.type] = (logTypeDistribution[l.type] || 0) + 1;
    }

    // ── 5) 주간 활동 추이 (최근 12주) ──
    const weeklyActivity: Array<{ week: string; count: number }> = [];
    for (let w = 11; w >= 0; w--) {
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - (w * 7 + weekStart.getDay()));
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);
      const label = `${String(weekStart.getMonth() + 1).padStart(2, '0')}/${String(weekStart.getDate()).padStart(2, '0')}`;
      const count = logs.filter(l => {
        const d = new Date(l.date);
        return d >= weekStart && d < weekEnd;
      }).length;
      weeklyActivity.push({ week: label, count });
    }

    // ── 6) 가장 자주 연락한 TOP 5 (최근 90일) ──
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const recentLogs90 = logs.filter(l => new Date(l.date) >= ninetyDaysAgo);
    const contactLogCount: Record<string, number> = {};
    for (const l of recentLogs90) {
      contactLogCount[l.contactId] = (contactLogCount[l.contactId] || 0) + 1;
    }
    const topContacted = Object.entries(contactLogCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([contactId, count]) => {
        const ct = contacts.find(c => c.id === contactId);
        return {
          contactId,
          name: ct?.name || '알 수 없음',
          relationship: ct?.relationship || '기타',
          count,
        };
      });

    // ── 7) 연락 공백 주의 (30일 이상) ──
    const needsAttention = contacts
      .filter(ct => ct.contactGap >= 30)
      .sort((a, b) => b.contactGap - a.contactGap)
      .slice(0, 10)
      .map(ct => ({
        contactId: ct.id,
        name: ct.name,
        relationship: ct.relationship,
        contactGap: ct.contactGap,
        lastContact: ct.lastContact,
      }));

    // ── 8) 다가오는 생일 (30일 이내) ──
    const upcomingBirthdays = contacts
      .filter(ct => ct.birthdayDday > 0 && ct.birthdayDday <= 30)
      .sort((a, b) => a.birthdayDday - b.birthdayDday)
      .slice(0, 10)
      .map(ct => ({
        contactId: ct.id,
        name: ct.name,
        relationship: ct.relationship,
        birthday: ct.birthday,
        dday: ct.birthdayDday,
      }));

    // ── 9) 자동 메시지 활성화 수 ──
    const autoMessageEnabledCount = autoMsgPrefs.filter((p: any) => p.enabled).length;

    // ── 10) 이번 달 연락 기록 카운트 (연속 유지 streak) ──
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthLogs = logs.filter(l => new Date(l.date) >= monthStart).length;

    // 연속 연락 일수 (streak)
    let streak = 0;
    const checkDate = new Date(now);
    while (true) {
      const dateStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
      const hasLog = logs.some(l => l.date === dateStr);
      if (hasLog) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    console.log(`[stats GET] Computed stats for user ${userId}: ${totalContacts} contacts, ${totalLogs} logs`);

    return c.json({
      stats: {
        totalContacts,
        totalLogs,
        totalGroups,
        favoriteCount,
        recentLogCount,
        thisMonthLogs,
        streak,
        autoMessageEnabledCount,
        relationshipDistribution,
        closenessDistribution,
        logTypeDistribution,
        weeklyActivity,
        topContacted,
        needsAttention,
        upcomingBirthdays,
      },
    });
  } catch (err) {
    console.log(`[stats GET] Error: ${err}`);
    return c.json({ error: `통계 조회 실패: ${err}` }, 500);
  }
});

// ═══════════════════════════════════════════════
// 6단계: 연락처 태그 (Tags)
// KV key: tags:{userId} → Tag[]
// ═══════════════════════════════════════════════

// ─── GET /tags ─── 사용자의 태그 라이브러리 조회
app.get(`${APP_PREFIX}/tags`, async (c) => {
  try {
    const user = await getUserFromToken(c.req);
    if (!user) {
      return c.json({ error: "인증이 필요합니다." }, 401);
    }

    const data = await kv.get(`tags:${user.id}`);
    return c.json({ tags: data ?? [] });
  } catch (err) {
    console.log(`[tags GET] Error: ${err}`);
    return c.json({ error: `태그 조회 실패: ${err}` }, 500);
  }
});

// ─── PUT /tags ─── 사용자의 태그 라이브러리 저장
app.put(`${APP_PREFIX}/tags`, async (c) => {
  try {
    const user = await getUserFromToken(c.req);
    if (!user) {
      return c.json({ error: "인증이 필요합니다." }, 401);
    }

    const body = await c.req.json().catch(() => ({}));
    const validation = validateTags((body as Record<string, unknown>).tags);
    if (!validation.ok) {
      return c.json({ error: validation.error }, 400);
    }

    await kv.set(`tags:${user.id}`, validation.tags);
    console.log(`[tags PUT] Saved ${validation.tags.length} tags for user ${user.id}`);
    return c.json({ success: true, count: validation.tags.length });
  } catch (err) {
    console.log(`[tags PUT] Error: ${err}`);
    return c.json({ error: `태그 저장 실패: ${err}` }, 500);
  }
});

// ═══════════════════════════════════════════════
// 6단계: 연락처 CSV 내보내기
// ═══════════════════════════════════════════════

// ─── GET /contacts/export ─── 연락처 CSV 데이터 반환
app.get(`${APP_PREFIX}/contacts/export`, async (c) => {
  try {
    const user = await getUserFromToken(c.req);
    if (!user) {
      return c.json({ error: "인증이 필요합니다." }, 401);
    }

    const [contactsRaw, tagsRaw] = await Promise.all([
      kv.get(`contacts:${user.id}`),
      kv.get(`tags:${user.id}`),
    ]);

    const contacts: any[] = Array.isArray(contactsRaw) ? contactsRaw : [];
    const tags: any[] = Array.isArray(tagsRaw) ? tagsRaw : [];
    const tagMap = new Map(tags.map((t: any) => [t.id, t.label]));

    // CSV 생성
    const headers = ['이름', '관계', '친밀도', '생년월일', '전화번호', '마지막 연락', '메모', '즐겨찾기', '태그'];
    const escapeCsv = (value: unknown) => {
      const raw = value == null ? "" : String(value).trim().slice(0, 2000);
      if (!raw) return "";

      // Prevent CSV formula injection in spreadsheet apps.
      const formulaSafe = /^[=+\-@]/.test(raw) || /^[\t\r]/.test(raw) ? `'${raw}` : raw;

      if (formulaSafe.includes(',') || formulaSafe.includes('"') || formulaSafe.includes('\n')) {
        return `"${formulaSafe.replace(/"/g, '""')}"`;
      }
      return formulaSafe;
    };

    const rows = contacts.map((ct: any) => {
      const contactTags = (ct.tags ?? [])
        .map((tid: string) => tagMap.get(tid) || '')
        .filter(Boolean)
        .join('; ');

      return [
        escapeCsv(ct.name),
        escapeCsv(ct.relationship),
        escapeCsv(ct.closeness),
        escapeCsv(ct.birthday),
        escapeCsv(ct.phone),
        escapeCsv(ct.lastContact),
        escapeCsv(ct.memo),
        ct.isFavorite ? 'Y' : 'N',
        escapeCsv(contactTags),
      ].join(',');
    });

    const csv = [headers.join(','), ...rows].join('\n');

    console.log(`[contacts/export] Exported ${contacts.length} contacts for user ${user.id}`);
    return c.json({
      csv,
      count: contacts.length,
      exportedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.log(`[contacts/export] Error: ${err}`);
    return c.json({ error: `연락처 내보내기 실패: ${err}` }, 500);
  }
});

// ═══════════════════════════════════════════════
// 계정 삭제 (Supabase Auth admin + KV 정리)
// ═══════════════════════════════════════════════

app.delete(`${APP_PREFIX}/account`, async (c) => {
  try {
    const user = await getUserFromToken(c.req);
    if (!user) {
      return c.json({ error: "인증이 필요합니다." }, 401);
    }

    const userId = user.id;
    console.log(`[account DELETE] Deleting account for user ${userId}`);

    // 1) KV Store 데이터 정리
    const keysToDelete = [
      `profile:${userId}`,
      `contacts:${userId}`,
      `custom_rels:${userId}`,
      `auto_messages:${userId}`,
      `notifications:${userId}`,
      `notif_settings:${userId}`,
      `tagged_templates:${userId}`,
      `contact_groups:${userId}`,
      `interaction_logs:${userId}`,
      `tags:${userId}`,
    ];
    await kv.mdel(keysToDelete);
    console.log(`[account DELETE] KV data cleaned for user ${userId}`);

    // 2) Storage 정리 — 아바타 이미지 삭제
    try {
      const supabase2 = adminClient();
      const { data: files } = await supabase2.storage
        .from(AVATAR_BUCKET)
        .list(userId);
      if (files && files.length > 0) {
        const paths = files.map((f: any) => `${userId}/${f.name}`);
        await supabase2.storage.from(AVATAR_BUCKET).remove(paths);
        console.log(`[account DELETE] Avatar files removed: ${paths.length}`);
      }
    } catch (storageErr) {
      console.log(`[account DELETE] Storage cleanup error (non-fatal): ${storageErr}`);
    }

    // 3) Supabase Auth 계정 삭제 (admin API)
    const supabase = adminClient();
    const { error } = await supabase.auth.admin.deleteUser(userId);
    if (error) {
      console.log(`[account DELETE] Auth delete error: ${error.message}`);
      return c.json({ error: `계정 삭제 실패: ${error.message}` }, 500);
    }

    console.log(`[account DELETE] Account deleted successfully: ${userId}`);
    return c.json({ success: true });
  } catch (err) {
    console.log(`[account DELETE] Unexpected error: ${err}`);
    return c.json({ error: `계정 삭제 중 서버 오류가 발생했습니다: ${err}` }, 500);
  }
});

Deno.serve(app.fetch);
