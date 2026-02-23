import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";
import * as kv from "./kv_store.tsx";
const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
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

// Health check endpoint
app.get("/make-server-0984a125/health", (c) => {
  return c.json({ status: "ok" });
});

// ─── Sign Up ───
app.post("/make-server-0984a125/signup", async (c) => {
  try {
    const body = await c.req.json();
    const { email, password, name } = body;

    if (!email || !password || !name) {
      return c.json({ error: "이메일, 비밀번호, 이름은 필수 입력값입니다." }, 400);
    }

    const supabase = adminClient();
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name },
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true,
    });

    if (error) {
      console.log(`[signup] Error creating user for ${email}: ${error.message}`);
      // Provide user-friendly messages for common errors
      if (error.message.includes("already been registered")) {
        return c.json({ error: "이미 가입된 이메일입니다." }, 409);
      }
      return c.json({ error: `회원가입 실패: ${error.message}` }, 400);
    }

    console.log(`[signup] User created: ${data.user.id} (${email})`);

    // Store initial profile in KV
    await kv.set(`profile:${data.user.id}`, {
      name,
      email,
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
app.get("/make-server-0984a125/profile", async (c) => {
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
app.put("/make-server-0984a125/profile", async (c) => {
  try {
    const user = await getUserFromToken(c.req);
    if (!user) {
      return c.json({ error: "인증이 필요합니다." }, 401);
    }

    const body = await c.req.json();
    const existing = await kv.get(`profile:${user.id}`);
    const updated = {
      ...(existing ?? {}),
      ...body,
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
app.post("/make-server-0984a125/profile/avatar", async (c) => {
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
app.delete("/make-server-0984a125/profile/avatar", async (c) => {
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
app.get("/make-server-0984a125/contacts", async (c) => {
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
app.put("/make-server-0984a125/contacts", async (c) => {
  try {
    const user = await getUserFromToken(c.req);
    if (!user) {
      return c.json({ error: "인증이 필요합니다." }, 401);
    }

    const body = await c.req.json();
    const { contacts } = body;

    if (!Array.isArray(contacts)) {
      return c.json({ error: "contacts 배열이 필요합니다." }, 400);
    }

    await kv.set(`contacts:${user.id}`, contacts);
    console.log(`[contacts PUT] Saved ${contacts.length} contacts for user ${user.id}`);
    return c.json({ success: true, count: contacts.length });
  } catch (err) {
    console.log(`[contacts PUT] Error: ${err}`);
    return c.json({ error: `연락처 저장 실패: ${err}` }, 500);
  }
});

// ─── GET /custom-relationships ─── 커스텀 관계 타입 조회
app.get("/make-server-0984a125/custom-relationships", async (c) => {
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
app.put("/make-server-0984a125/custom-relationships", async (c) => {
  try {
    const user = await getUserFromToken(c.req);
    if (!user) {
      return c.json({ error: "인증이 필요합니다." }, 401);
    }

    const body = await c.req.json();
    const { customRelationships, hiddenDefaults } = body;

    await kv.set(`custom_rels:${user.id}`, {
      customRelationships: customRelationships ?? [],
      hiddenDefaults: hiddenDefaults ?? [],
    });

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
app.get("/make-server-0984a125/auto-messages", async (c) => {
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
app.put("/make-server-0984a125/auto-messages", async (c) => {
  try {
    const user = await getUserFromToken(c.req);
    if (!user) {
      return c.json({ error: "인증이 필요합니다." }, 401);
    }

    const body = await c.req.json();
    const { prefs, sentIds } = body;

    await kv.set(`auto_messages:${user.id}`, {
      prefs: Array.isArray(prefs) ? prefs : [],
      sentIds: Array.isArray(sentIds) ? sentIds : [],
    });

    console.log(`[auto-messages PUT] Saved ${(prefs ?? []).length} prefs for user ${user.id}`);
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
app.get("/make-server-0984a125/tagged-templates", async (c) => {
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
app.put("/make-server-0984a125/tagged-templates", async (c) => {
  try {
    const user = await getUserFromToken(c.req);
    if (!user) {
      return c.json({ error: "인증이 필요합니다." }, 401);
    }

    const body = await c.req.json();
    const { templates } = body;

    if (!Array.isArray(templates)) {
      return c.json({ error: "templates 배열이 필요합니다." }, 400);
    }

    await kv.set(`tagged_templates:${user.id}`, templates);
    console.log(`[tagged-templates PUT] Saved ${templates.length} templates for user ${user.id}`);
    return c.json({ success: true, count: templates.length });
  } catch (err) {
    console.log(`[tagged-templates PUT] Error: ${err}`);
    return c.json({ error: `태그 템플릿 저장 실패: ${err}` }, 500);
  }
});

// ═══════════════════════════════════════════════
// 연락처 그룹 (KV Store 기반, 사용자별 격리)
// ═══════════════════════════════════════════════

// ─── GET /contact-groups ─── 연락처 그룹 목록 조회
app.get("/make-server-0984a125/contact-groups", async (c) => {
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
app.put("/make-server-0984a125/contact-groups", async (c) => {
  try {
    const user = await getUserFromToken(c.req);
    if (!user) {
      return c.json({ error: "인증이 필요합니다." }, 401);
    }

    const body = await c.req.json();
    const { groups } = body;

    if (!Array.isArray(groups)) {
      return c.json({ error: "groups 배열이 필요합니다." }, 400);
    }

    await kv.set(`contact_groups:${user.id}`, groups);
    console.log(`[contact-groups PUT] Saved ${groups.length} groups for user ${user.id}`);
    return c.json({ success: true, count: groups.length });
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
app.get("/make-server-0984a125/notifications", async (c) => {
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
app.post("/make-server-0984a125/notifications/generate", async (c) => {
  try {
    const user = await getUserFromToken(c.req);
    if (!user) {
      return c.json({ error: "인증이 필요합니다." }, 401);
    }

    const body = await c.req.json().catch(() => ({}));
    const { contacts = [], scheduledMessages = [] } = body;

    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    // 기존 알림 로드
    const data = await kv.get(`notifications:${user.id}`) as any;
    const existing: ServerNotification[] = data?.items ?? [];
    const existingIds = new Set(existing.map(n => n.id));

    const newNotifications: ServerNotification[] = [];

    // 1) 오늘이 예약 메시지 발송일인 경우 알림 생성
    for (const msg of scheduledMessages) {
      const notifId = `auto-msg-${msg.contactId}-${msg.occasion}-${todayStr}`;
      if (existingIds.has(notifId)) continue;
      if (msg.scheduledDate !== todayStr) continue;

      newNotifications.push({
        id: notifId,
        type: 'auto_message',
        title: `${msg.contactName}님에게 메시지를 보낼 시간이에요`,
        body: msg.message?.slice(0, 80) || '자동 메시지가 예약되어 있어요',
        contactId: msg.contactId,
        occasion: msg.occasion,
        read: false,
        createdAt: now.toISOString(),
      });
    }

    // 2) 오늘이 생일인 연락처 알림
    for (const ct of contacts) {
      if (!ct.birthday) continue;
      const bMonth = parseInt(ct.birthday.slice(5, 7), 10);
      const bDay = parseInt(ct.birthday.slice(8, 10), 10);
      if (bMonth === now.getMonth() + 1 && bDay === now.getDate()) {
        const notifId = `birthday-${ct.id}-${todayStr}`;
        if (existingIds.has(notifId)) continue;
        newNotifications.push({
          id: notifId,
          type: 'birthday_reminder',
          title: `오늘은 ${ct.name}님의 생일이에요! 🎂`,
          body: `${ct.relationship} · ${ct.name}님에게 축하 메시지를 보내보세요`,
          contactId: ct.id,
          read: false,
          createdAt: now.toISOString(),
        });
      }
    }

    // 3) 연락 공백 30일 이상 연락처 리마인더 (하루 최대 3개)
    const attentionContacts = contacts
      .filter((ct: any) => ct.contactGap >= 30)
      .sort((a: any, b: any) => b.contactGap - a.contactGap)
      .slice(0, 3);

    for (const ct of attentionContacts) {
      const notifId = `attention-${ct.id}-${todayStr}`;
      if (existingIds.has(notifId)) continue;
      newNotifications.push({
        id: notifId,
        type: 'contact_reminder',
        title: `${ct.name}님에게 연락해보세요`,
        body: `마지막 연락으로부터 ${ct.contactGap}일이 지났어요`,
        contactId: ct.id,
        read: false,
        createdAt: now.toISOString(),
      });
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
app.put("/make-server-0984a125/notifications/read", async (c) => {
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
app.delete("/make-server-0984a125/notifications", async (c) => {
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
app.delete("/make-server-0984a125/notifications/:id", async (c) => {
  try {
    const user = await getUserFromToken(c.req);
    if (!user) {
      return c.json({ error: "인증이 필요합니다." }, 401);
    }

    const notifId = c.req.param("id");
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
app.get("/make-server-0984a125/notification-settings", async (c) => {
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
app.put("/make-server-0984a125/notification-settings", async (c) => {
  try {
    const user = await getUserFromToken(c.req);
    if (!user) {
      return c.json({ error: "인증이 필요합니다." }, 401);
    }

    const body = await c.req.json();
    const existing = await kv.get(`notif_settings:${user.id}`) as any;
    const updated = { ...(existing ?? {}), ...body };
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
app.get("/make-server-0984a125/interaction-logs", async (c) => {
  try {
    const user = await getUserFromToken(c.req);
    if (!user) {
      return c.json({ error: "인증이 필요합니다." }, 401);
    }

    const data = await kv.get(`interaction_logs:${user.id}`) as any;
    let logs: InteractionLog[] = data?.items ?? [];

    // 선택적 contactId 필터
    const contactId = c.req.query("contactId");
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
app.post("/make-server-0984a125/interaction-logs", async (c) => {
  try {
    const user = await getUserFromToken(c.req);
    if (!user) {
      return c.json({ error: "인증이 필요합니다." }, 401);
    }

    const body = await c.req.json();
    const { contactId, type, note, date } = body;

    if (!contactId || !type || !date) {
      return c.json({ error: "contactId, type, date는 필수 입력값입니다." }, 400);
    }

    const validTypes = ['call', 'message', 'meeting', 'gift', 'sns', 'other'];
    if (!validTypes.includes(type)) {
      return c.json({ error: `유효하지 않은 연락 타입입니다. (허용: ${validTypes.join(', ')})` }, 400);
    }

    const now = new Date();
    const newLog: InteractionLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      contactId,
      type,
      note: (note || '').slice(0, 200),
      date,
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
      const idx = contacts.findIndex((ct: any) => ct.id === contactId);
      if (idx >= 0) {
        const ct = contacts[idx];
        if (!ct.lastContact || date > ct.lastContact) {
          contacts[idx] = { ...ct, lastContact: date };
          await kv.set(`contacts:${user.id}`, contacts);
          console.log(`[interaction-logs POST] Updated lastContact for contact ${contactId}`);
        }
      }
    }

    console.log(`[interaction-logs POST] Added log ${newLog.id} for contact ${contactId} by user ${user.id}`);
    return c.json({ success: true, log: newLog });
  } catch (err) {
    console.log(`[interaction-logs POST] Error: ${err}`);
    return c.json({ error: `연락 기록 추가 실패: ${err}` }, 500);
  }
});

// ─── PUT /interaction-logs ─── 연락 기록 전체 저장 (전체 교체)
app.put("/make-server-0984a125/interaction-logs", async (c) => {
  try {
    const user = await getUserFromToken(c.req);
    if (!user) {
      return c.json({ error: "인증이 필요합니다." }, 401);
    }

    const body = await c.req.json();
    const { logs } = body;

    if (!Array.isArray(logs)) {
      return c.json({ error: "logs 배열이 필요합니다." }, 400);
    }

    // 최대 2000개 유지
    const trimmed = logs.slice(0, 2000);
    await kv.set(`interaction_logs:${user.id}`, { items: trimmed });
    console.log(`[interaction-logs PUT] Saved ${trimmed.length} logs for user ${user.id}`);
    return c.json({ success: true, count: trimmed.length });
  } catch (err) {
    console.log(`[interaction-logs PUT] Error: ${err}`);
    return c.json({ error: `연락 기록 저장 실패: ${err}` }, 500);
  }
});

// ─── DELETE /interaction-logs/:id ─── 개별 연락 기록 삭제
app.delete("/make-server-0984a125/interaction-logs/:id", async (c) => {
  try {
    const user = await getUserFromToken(c.req);
    if (!user) {
      return c.json({ error: "인증이 필요합니다." }, 401);
    }

    const logId = c.req.param("id");
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

app.get("/make-server-0984a125/stats", async (c) => {
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
app.get("/make-server-0984a125/tags", async (c) => {
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
app.put("/make-server-0984a125/tags", async (c) => {
  try {
    const user = await getUserFromToken(c.req);
    if (!user) {
      return c.json({ error: "인증이 필요합니다." }, 401);
    }

    const body = await c.req.json();
    const { tags } = body;

    if (!Array.isArray(tags)) {
      return c.json({ error: "tags 배열이 필요합니다." }, 400);
    }

    // 최대 100개 유지
    const trimmed = tags.slice(0, 100);
    await kv.set(`tags:${user.id}`, trimmed);
    console.log(`[tags PUT] Saved ${trimmed.length} tags for user ${user.id}`);
    return c.json({ success: true, count: trimmed.length });
  } catch (err) {
    console.log(`[tags PUT] Error: ${err}`);
    return c.json({ error: `태그 저장 실패: ${err}` }, 500);
  }
});

// ═══════════════════════════════════════════════
// 6단계: 연락처 CSV 내보내기
// ═══════════════════════════════════════════════

// ─── GET /contacts/export ─── 연락처 CSV 데이터 반환
app.get("/make-server-0984a125/contacts/export", async (c) => {
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
    const escapeCsv = (val: string) => {
      if (!val) return '';
      if (val.includes(',') || val.includes('"') || val.includes('\n')) {
        return `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    };

    const rows = contacts.map((ct: any) => {
      const contactTags = (ct.tags ?? [])
        .map((tid: string) => tagMap.get(tid) || '')
        .filter(Boolean)
        .join('; ');

      return [
        escapeCsv(ct.name || ''),
        escapeCsv(ct.relationship || ''),
        escapeCsv(ct.closeness || ''),
        escapeCsv(ct.birthday || ''),
        escapeCsv(ct.phone || ''),
        escapeCsv(ct.lastContact || ''),
        escapeCsv(ct.memo || ''),
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

app.delete("/make-server-0984a125/account", async (c) => {
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
