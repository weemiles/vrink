/**
 * autoMessageStore.ts
 * ────────────────────────────────────────────────
 * 자동 메시지 시스템 스토어.
 * - 캘린더 홀리데이와 연동된 기념일 목록
 * - 연락처별 자동 메시지 ON/OFF 및 기념일별 토글
 * - 기본/커스텀 메시지 템플릿 관리
 * - 예약 메시지 계산 (생일 + 캘린더 공휴일/기념일)
 * - 발송 시간대 설정
 * - localStorage 영속화
 */
import { useSyncExternalStore } from 'react';
import type { Contact } from './contacts';
import { authenticatedFetch } from './authStore';
import { projectId } from '/utils/supabase/info';

/* ═══════════════════════════════════════════════
   타입 정의
   ═══════════════════════════════════════════════ */

/** 캘린더 홀리데이와 1:1 매핑되는 기념일 키 */
export type OccasionKey =
  | 'birthday'
  | 'seollal'
  | 'chuseok'
  | 'christmas'
  | 'newYear'
  | 'parentsDay'
  | 'teachersDay'
  | 'valentine'
  | 'whiteDay'
  | 'childrenDay';

export interface AutoMessagePref {
  contactId: string;
  enabled: boolean;
  occasions: Record<OccasionKey, boolean>;
  /** 기념일별 커스텀 메시지 (없으면 기본 템플릿 사용) */
  customMessages: Partial<Record<OccasionKey, string>>;
  /** 메시지 발송 시간 (HH:mm) */
  sendTime: string;
}

export interface ScheduledMessage {
  id: string;
  contactId: string;
  contactName: string;
  occasion: OccasionKey;
  occasionLabel: string;
  message: string;
  scheduledDate: string; // YYYY-MM-DD
  daysUntil: number;
  sent: boolean;
  /** tagged template에서 생성된 메시지인 경우 template id */
  templateId?: string;
}

/* ═══════════════════════════════════════════════
   태그 기반 메시지 템플릿
   ═══════════════════════════════════════════════ */

export interface TaggedTemplate {
  id: string;
  /** 기념일 종류 */
  occasion: OccasionKey;
  /** 메시지 본문 ({name} 치환 지원) */
  message: string;
  /** 이 템플릿을 적용할 관계 태그 목록 (예: ['친구','가족']) */
  targetTags: string[];
  /** 발송 시간 */
  sendTime: string;
  enabled: boolean;
  createdAt: number;
}

/* ═══════════════════════════════════════════════
   기념일 메타데이터 — 캘린더 홀리데이 연동
   (이모지 제거, 텍스트 레이블만 사용)
   ═══════════════════════════════════════════════ */

export const OCCASION_META: Record<OccasionKey, {
  labelKo: string;
  labelEn: string;
  color: string;
  /** 캘린더 CalendarPage KOREA_HOLIDAYS 에서의 매칭 이름 */
  calendarName: string;
}> = {
  birthday:    { labelKo: '생일',         labelEn: 'Birthday',        color: '#424242', calendarName: '' },
  seollal:     { labelKo: '설날',         labelEn: 'Lunar New Year',  color: '#616161', calendarName: '설날' },
  chuseok:     { labelKo: '추석',         labelEn: 'Chuseok',         color: '#757575', calendarName: '추석' },
  christmas:   { labelKo: '크리스마스',    labelEn: 'Christmas',       color: '#4A4A4A', calendarName: '크리스마스' },
  newYear:     { labelKo: '신정',         labelEn: 'New Year',        color: '#616161', calendarName: '신정' },
  parentsDay:  { labelKo: '어버이날',      labelEn: "Parents' Day",    color: '#525252', calendarName: '어버이날' },
  teachersDay: { labelKo: '스승의 날',     labelEn: "Teachers' Day",   color: '#5C5C5C', calendarName: '스승의 날' },
  valentine:   { labelKo: '발렌타인데이',  labelEn: "Valentine's Day", color: '#333333', calendarName: '발렌타인데이' },
  whiteDay:    { labelKo: '화이트데이',    labelEn: 'White Day',       color: '#9E9E9E', calendarName: '화이트데이' },
  childrenDay: { labelKo: '어린이날',      labelEn: "Children's Day",  color: '#6E6E6E', calendarName: '어린이날' },
};

export const ALL_OCCASION_KEYS: OccasionKey[] = [
  'birthday', 'seollal', 'chuseok', 'christmas', 'newYear',
  'parentsDay', 'teachersDay', 'valentine', 'whiteDay', 'childrenDay',
];

/* ═══════════════════════════════════════════════
   기본 메시지 템플릿
   ═══════════════════════════════════════════════ */

export const DEFAULT_TEMPLATES_KO: Record<OccasionKey, string> = {
  birthday:    '{name}님, 생일 축하해요! 행복한 하루 보내세요.',
  seollal:     '{name}님, 새해 복 많이 받으세요! 건강하고 행복한 한 해 되세요.',
  chuseok:     '{name}님, 즐거운 추석 보내세요! 가족과 함께 행복한 명절 되세요.',
  christmas:   '{name}님, 메리 크리스마스! 따뜻하고 행복한 크리스마스 보내세요.',
  newYear:     '{name}님, 새해 복 많이 받으세요! 올해도 좋은 일만 가득하길 바랍니다.',
  parentsDay:  '{name}님, 어버이날을 축하드립니다! 항상 건강하시고 행복하세요.',
  teachersDay: '{name}님, 스승의 날을 축하드립니다! 늘 감사한 마음을 담아 인사드려요.',
  valentine:   '{name}님, 해피 발렌타인데이! 달콤하고 행복한 하루 보내세요.',
  whiteDay:    '{name}님, 해피 화이트데이! 사랑 가득한 하루 되세요.',
  childrenDay: '{name}님, 어린이날을 축하해요! 즐거운 하루 보내세요.',
};

export const DEFAULT_TEMPLATES_EN: Record<OccasionKey, string> = {
  birthday:    'Happy Birthday, {name}! Wishing you a wonderful day!',
  seollal:     'Happy Lunar New Year, {name}! Wishing you health and happiness.',
  chuseok:     'Happy Chuseok, {name}! Hope you have a wonderful holiday with family.',
  christmas:   'Merry Christmas, {name}! Wishing you warmth and joy this holiday season.',
  newYear:     'Happy New Year, {name}! May this year bring you all the best.',
  parentsDay:  "Happy Parents' Day, {name}! Thank you for everything.",
  teachersDay: "Happy Teachers' Day, {name}! Thank you for your guidance and care.",
  valentine:   "Happy Valentine's Day, {name}! Hope your day is sweet and full of love.",
  whiteDay:    "Happy White Day, {name}! Wishing you a lovely day.",
  childrenDay: "Happy Children's Day, {name}! Have a fun and joyful day!",
};

/* ═══════════════════════════════════════════════
   발송 시간 옵션
   ═══════════════════════════════════════════════ */

export const SEND_TIME_OPTIONS = [
  { value: '07:00', labelKo: '오전 7시', labelEn: '7:00 AM' },
  { value: '08:00', labelKo: '오전 8시', labelEn: '8:00 AM' },
  { value: '09:00', labelKo: '오전 9시', labelEn: '9:00 AM' },
  { value: '10:00', labelKo: '오전 10시', labelEn: '10:00 AM' },
  { value: '11:00', labelKo: '오전 11시', labelEn: '11:00 AM' },
  { value: '12:00', labelKo: '낮 12시', labelEn: '12:00 PM' },
  { value: '18:00', labelKo: '오후 6시', labelEn: '6:00 PM' },
  { value: '20:00', labelKo: '오후 8시', labelEn: '8:00 PM' },
  { value: '21:00', labelKo: '오후 9시', labelEn: '9:00 PM' },
] as const;

export function getSendTimeLabel(time: string, lang: 'ko' | 'en' = 'ko'): string {
  const opt = SEND_TIME_OPTIONS.find((o) => o.value === time);
  if (opt) return lang === 'ko' ? opt.labelKo : opt.labelEn;
  return time;
}

/* ═══════════════════════════════════════════════
   공휴일 날짜 계산 — 캘린더 KOREA_HOLIDAYS 와 동일 소스
   ═══════════════════════════════════════════════ */

function getOccasionDates(occasion: OccasionKey, year: number): { month: number; day: number }[] {
  switch (occasion) {
    case 'christmas':
      return [{ month: 12, day: 25 }];
    case 'newYear':
      return [{ month: 1, day: 1 }];
    case 'parentsDay':
      return [{ month: 5, day: 8 }];
    case 'teachersDay':
      return [{ month: 5, day: 15 }];
    case 'valentine':
      return [{ month: 2, day: 14 }];
    case 'whiteDay':
      return [{ month: 3, day: 14 }];
    case 'childrenDay':
      return [{ month: 5, day: 5 }];
    case 'seollal':
      if (year === 2025) return [{ month: 1, day: 29 }];
      if (year === 2026) return [{ month: 2, day: 17 }];
      if (year === 2027) return [{ month: 2, day: 6 }];
      return [{ month: 2, day: 1 }];
    case 'chuseok':
      if (year === 2025) return [{ month: 10, day: 6 }];
      if (year === 2026) return [{ month: 9, day: 25 }];
      if (year === 2027) return [{ month: 9, day: 15 }];
      return [{ month: 9, day: 15 }];
    default:
      return [];
  }
}

function getNextOccasionDate(occasion: OccasionKey, birthday?: string): { date: string; daysUntil: number } | null {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const currentYear = today.getFullYear();

  if (occasion === 'birthday') {
    if (!birthday) return null;
    const bday = new Date(birthday);
    const month = bday.getMonth();
    const day = bday.getDate();

    for (let y = currentYear; y <= currentYear + 1; y++) {
      const candidate = new Date(y, month, day);
      candidate.setHours(0, 0, 0, 0);
      const diff = Math.ceil((candidate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (diff >= 0) {
        const dateStr = `${y}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return { date: dateStr, daysUntil: diff };
      }
    }
    return null;
  }

  for (let y = currentYear; y <= currentYear + 1; y++) {
    const dates = getOccasionDates(occasion, y);
    for (const d of dates) {
      const candidate = new Date(y, d.month - 1, d.day);
      candidate.setHours(0, 0, 0, 0);
      const diff = Math.ceil((candidate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (diff >= 0) {
        const dateStr = `${y}-${String(d.month).padStart(2, '0')}-${String(d.day).padStart(2, '0')}`;
        return { date: dateStr, daysUntil: diff };
      }
    }
  }
  return null;
}

/* ═══════════════════════════════════════════════
   localStorage 키 & 초기 로드
   ═══════════════════════════════════════════════ */

const LS_AUTO_MSG_KEY = 'keepin_auto_messages';
const LS_SENT_MSG_KEY = 'keepin_sent_messages';

/* ═══════════════════════════════════════════════
   서버 동기화 설정
   ═══════════════════════════════════════════════ */
const SERVER_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-0984a125`;

type Listener = () => void;

const DEFAULT_OCCASIONS: Record<OccasionKey, boolean> = {
  birthday: true,
  seollal: true,
  chuseok: true,
  christmas: true,
  newYear: true,
  parentsDay: false,
  teachersDay: false,
  valentine: false,
  whiteDay: false,
  childrenDay: false,
};

let _prefs: AutoMessagePref[] = loadPrefs();
let _sentIds: Set<string> = loadSentIds();
let _listeners = new Set<Listener>();

function loadPrefs(): AutoMessagePref[] {
  try {
    const stored = localStorage.getItem(LS_AUTO_MSG_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        // 기존 데이터에 새 기념일 키가 없으면 기본값으로 채움
        return parsed.map((p: any) => ({
          ...p,
          occasions: { ...DEFAULT_OCCASIONS, ...p.occasions },
        }));
      }
    }
  } catch { /* ignore */ }
  // 기본 데모 데이터
  return [
    {
      contactId: '1',
      enabled: true,
      occasions: { ...DEFAULT_OCCASIONS, parentsDay: true },
      customMessages: {},
      sendTime: '09:00',
    },
    {
      contactId: '2',
      enabled: true,
      occasions: { ...DEFAULT_OCCASIONS, parentsDay: true },
      customMessages: {},
      sendTime: '09:00',
    },
    {
      contactId: '4',
      enabled: true,
      occasions: { ...DEFAULT_OCCASIONS, christmas: false },
      customMessages: {},
      sendTime: '10:00',
    },
    {
      contactId: '6',
      enabled: true,
      occasions: { ...DEFAULT_OCCASIONS, seollal: false, chuseok: false },
      customMessages: {},
      sendTime: '09:00',
    },
  ];
}

function loadSentIds(): Set<string> {
  try {
    const stored = localStorage.getItem(LS_SENT_MSG_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return new Set(parsed);
    }
  } catch { /* ignore */ }
  return new Set();
}

function persistPrefs() {
  try {
    localStorage.setItem(LS_AUTO_MSG_KEY, JSON.stringify(_prefs));
  } catch { /* ignore */ }
  scheduleSync();
}

function persistSentIds() {
  try {
    localStorage.setItem(LS_SENT_MSG_KEY, JSON.stringify([..._sentIds]));
  } catch { /* ignore */ }
  scheduleSync();
}

function emit() {
  _listeners.forEach((l) => l());
}

/* ═══════════════════════════════════════════════
   서버 동기화 (debounced background sync)
   ═══════════════════════════════════════════════ */
let _syncTimer: ReturnType<typeof setTimeout> | null = null;
let _syncInProgress = false;
let _autoMsgDirty = false;

/* 온라인 복귀 시 dirty 데이터 자동 재동기화 */
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    if (_autoMsgDirty) {
      console.log('[autoMessageStore] Online restored — syncing dirty auto-messages');
      scheduleSync();
    }
  });
}

function scheduleSync() {
  _autoMsgDirty = true;
  if (_syncTimer) clearTimeout(_syncTimer);
  _syncTimer = setTimeout(() => {
    syncToServer();
  }, 1500); // 1.5초 debounce
}

async function syncToServer() {
  try {
    // 1) auto-messages push
    const res = await authenticatedFetch(`${SERVER_BASE}/auto-messages`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prefs: _prefs,
        sentIds: [..._sentIds],
      }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      console.warn('[autoMessageStore] auto-messages sync failed:', data.error || res.statusText);
    } else {
      console.log('[autoMessageStore] Auto-messages synced to server');
    }

    // 2) tagged-templates push (병렬이 아닌 직렬 — 네트워크 부하 절감)
    const res2 = await authenticatedFetch(`${SERVER_BASE}/tagged-templates`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ templates: _taggedTemplates }),
    });
    if (!res2.ok) {
      const data2 = await res2.json().catch(() => ({}));
      console.warn('[autoMessageStore] tagged-templates sync failed:', data2.error || res2.statusText);
    } else {
      console.log(`[autoMessageStore] Tagged templates (${_taggedTemplates.length}) synced to server`);
    }

    _autoMsgDirty = false;
  } catch (err) {
    console.warn('[autoMessageStore] sync network error:', err);
  }
}

/**
 * 서버에서 자동 메시지 설정 Pull — 로그인 직후 호출.
 * 서버에 데이터가 있으면 로컬을 대체, 없으면 로컬을 서버에 Push.
 */
export async function pullAutoMessagesFromServer(): Promise<void> {
  if (_syncInProgress) return;
  _syncInProgress = true;

  let serverHadPrefs = false;
  let serverHadTemplates = false;

  try {
    // 1) auto-messages pull
    const res = await authenticatedFetch(`${SERVER_BASE}/auto-messages`);
    if (res.ok) {
      const { prefs, sentIds } = await res.json();
      if (Array.isArray(prefs) && prefs.length > 0) {
        serverHadPrefs = true;
        _prefs = prefs.map((p: any) => ({
          ...p,
          occasions: { ...DEFAULT_OCCASIONS, ...p.occasions },
        }));
        _sentIds = new Set(Array.isArray(sentIds) ? sentIds : []);
        try {
          localStorage.setItem(LS_AUTO_MSG_KEY, JSON.stringify(_prefs));
          localStorage.setItem(LS_SENT_MSG_KEY, JSON.stringify([..._sentIds]));
        } catch { /* ignore */ }
        emit();
        console.log(`[autoMessageStore] Pulled ${prefs.length} prefs from server`);
      }
    }

    // 2) tagged-templates pull
    const res2 = await authenticatedFetch(`${SERVER_BASE}/tagged-templates`);
    if (res2.ok) {
      const { templates } = await res2.json();
      if (Array.isArray(templates) && templates.length > 0) {
        serverHadTemplates = true;
        _taggedTemplates = templates;
        try {
          localStorage.setItem(LS_TAGGED_TPL_KEY, JSON.stringify(_taggedTemplates));
        } catch { /* ignore */ }
        emitTaggedTemplates();
        console.log(`[autoMessageStore] Pulled ${templates.length} tagged templates from server`);
      }
    }

    // 서버가 비어있으면 로컬 데이터를 Push
    if (!serverHadPrefs && !serverHadTemplates && (_prefs.length > 0 || _taggedTemplates.length > 0)) {
      await syncToServer();
      console.log('[autoMessageStore] Pushed local data to empty server');
    }
  } catch (err) {
    console.warn('[autoMessageStore] pullFromServer error:', err);
  } finally {
    _syncInProgress = false;
  }
}

/* ═══════════════════════════════════════════════
   공개 API
   ═══════════════════════════════════════════════ */

const DEFAULT_PREF: Omit<AutoMessagePref, 'contactId'> = {
  enabled: false,
  occasions: { ...DEFAULT_OCCASIONS },
  customMessages: {},
  sendTime: '09:00',
};

export function getAutoMessagePref(contactId: string): AutoMessagePref {
  const existing = _prefs.find((p) => p.contactId === contactId);
  if (existing) return { ...existing, occasions: { ...DEFAULT_OCCASIONS, ...existing.occasions } };
  return { contactId, ...DEFAULT_PREF };
}

export function setAutoMessageEnabled(contactId: string, enabled: boolean) {
  const idx = _prefs.findIndex((p) => p.contactId === contactId);
  if (idx >= 0) {
    _prefs = [..._prefs];
    _prefs[idx] = { ..._prefs[idx], enabled };
  } else {
    _prefs = [..._prefs, { contactId, ...DEFAULT_PREF, enabled }];
  }
  persistPrefs();
  emit();
}

export function toggleOccasion(contactId: string, occasion: OccasionKey) {
  let pref = _prefs.find((p) => p.contactId === contactId);
  if (!pref) {
    pref = { contactId, ...DEFAULT_PREF, enabled: true };
    _prefs = [..._prefs, pref];
  }
  const idx = _prefs.indexOf(pref);
  _prefs = [..._prefs];
  _prefs[idx] = {
    ...pref,
    occasions: { ...DEFAULT_OCCASIONS, ...pref.occasions, [occasion]: !pref.occasions[occasion] },
  };
  persistPrefs();
  emit();
}

export function setCustomMessage(contactId: string, occasion: OccasionKey, message: string) {
  let pref = _prefs.find((p) => p.contactId === contactId);
  if (!pref) {
    pref = { contactId, ...DEFAULT_PREF, enabled: true };
    _prefs = [..._prefs, pref];
  }
  const idx = _prefs.indexOf(pref);
  _prefs = [..._prefs];
  _prefs[idx] = {
    ...pref,
    customMessages: { ...pref.customMessages, [occasion]: message || undefined },
  };
  persistPrefs();
  emit();
}

export function setSendTime(contactId: string, time: string) {
  let pref = _prefs.find((p) => p.contactId === contactId);
  if (!pref) {
    pref = { contactId, ...DEFAULT_PREF, enabled: true };
    _prefs = [..._prefs, pref];
  }
  const idx = _prefs.indexOf(pref);
  _prefs = [..._prefs];
  _prefs[idx] = { ...pref, sendTime: time };
  persistPrefs();
  emit();
}

export function markMessageSent(msgId: string) {
  _sentIds = new Set(_sentIds);
  _sentIds.add(msgId);
  persistSentIds();
  emit();
}

export function unmarkMessageSent(msgId: string) {
  _sentIds = new Set(_sentIds);
  _sentIds.delete(msgId);
  persistSentIds();
  emit();
}

export function isMessageSent(msgId: string): boolean {
  return _sentIds.has(msgId);
}

/** 메시지 생성: 템플릿의 {name}을 실제 이름으로 치환 */
export function renderMessage(template: string, contactName: string): string {
  return template.replace(/\{name\}/g, contactName);
}

/** 특정 연락처의 예약 메시지 목록 계산 */
export function getScheduledMessagesForContact(
  contact: Contact,
  lang: 'ko' | 'en' = 'ko',
): ScheduledMessage[] {
  const pref = getAutoMessagePref(contact.id);
  if (!pref.enabled) return [];

  const templates = lang === 'ko' ? DEFAULT_TEMPLATES_KO : DEFAULT_TEMPLATES_EN;
  const messages: ScheduledMessage[] = [];

  for (const oKey of ALL_OCCASION_KEYS) {
    if (!pref.occasions[oKey]) continue;

    const nextDate = getNextOccasionDate(
      oKey,
      oKey === 'birthday' ? contact.birthday : undefined,
    );
    if (!nextDate) continue;

    const meta = OCCASION_META[oKey];
    const template = pref.customMessages[oKey] || templates[oKey];
    const message = renderMessage(template, contact.name);
    const msgId = `${contact.id}_${oKey}_${nextDate.date}`;

    messages.push({
      id: msgId,
      contactId: contact.id,
      contactName: contact.name,
      occasion: oKey,
      occasionLabel: lang === 'ko' ? meta.labelKo : meta.labelEn,
      message,
      scheduledDate: nextDate.date,
      daysUntil: nextDate.daysUntil,
      sent: _sentIds.has(msgId),
    });
  }

  return messages.sort((a, b) => a.daysUntil - b.daysUntil);
}

/** 모든 연락처의 예약 메시지 통합 목록 */
export function getAllScheduledMessages(
  contacts: Contact[],
  lang: 'ko' | 'en' = 'ko',
  withinDays: number = 90,
): ScheduledMessage[] {
  const allMessages: ScheduledMessage[] = [];
  for (const c of contacts) {
    const msgs = getScheduledMessagesForContact(c, lang);
    for (const m of msgs) {
      if (m.daysUntil <= withinDays) {
        allMessages.push(m);
      }
    }
  }
  return allMessages.sort((a, b) => a.daysUntil - b.daysUntil);
}

/** 자동 메시지가 활성화된 연락처 수 */
export function getAutoMessageEnabledCount(): number {
  return _prefs.filter((p) => p.enabled).length;
}

/* ═══════════════════════════════════════════════
   그룹(관계 태그) 배치 API
   ═══════════════════════════════════════════════ */

/** 여러 연락처의 자동 메시지를 일괄 활성화/비활성화 */
export function setAutoMessageEnabledForGroup(contactIds: string[], enabled: boolean) {
  let changed = false;
  for (const cid of contactIds) {
    const idx = _prefs.findIndex((p) => p.contactId === cid);
    if (idx >= 0) {
      if (_prefs[idx].enabled !== enabled) {
        _prefs = [..._prefs];
        _prefs[idx] = { ..._prefs[idx], enabled };
        changed = true;
      }
    } else if (enabled) {
      _prefs = [..._prefs, { contactId: cid, ...DEFAULT_PREF, enabled: true }];
      changed = true;
    }
  }
  if (changed) {
    persistPrefs();
    emit();
  }
}

/** 여러 연락처의 특정 기념일을 일괄 토글 */
export function setOccasionForGroup(contactIds: string[], occasion: OccasionKey, value: boolean) {
  _prefs = [..._prefs];
  for (const cid of contactIds) {
    let idx = _prefs.findIndex((p) => p.contactId === cid);
    if (idx < 0) {
      _prefs.push({ contactId: cid, ...DEFAULT_PREF, enabled: true });
      idx = _prefs.length - 1;
    }
    _prefs[idx] = {
      ..._prefs[idx],
      occasions: { ...DEFAULT_OCCASIONS, ..._prefs[idx].occasions, [occasion]: value },
    };
  }
  persistPrefs();
  emit();
}

/** 여러 연락처의 커스텀 메시지를 일괄 설정 */
export function setCustomMessageForGroup(contactIds: string[], occasion: OccasionKey, message: string) {
  _prefs = [..._prefs];
  for (const cid of contactIds) {
    let idx = _prefs.findIndex((p) => p.contactId === cid);
    if (idx < 0) {
      _prefs.push({ contactId: cid, ...DEFAULT_PREF, enabled: true });
      idx = _prefs.length - 1;
    }
    _prefs[idx] = {
      ..._prefs[idx],
      customMessages: { ..._prefs[idx].customMessages, [occasion]: message || undefined },
    };
  }
  persistPrefs();
  emit();
}

/** 여러 연락처의 발송 시간을 일괄 설정 */
export function setSendTimeForGroup(contactIds: string[], time: string) {
  _prefs = [..._prefs];
  for (const cid of contactIds) {
    let idx = _prefs.findIndex((p) => p.contactId === cid);
    if (idx < 0) {
      _prefs.push({ contactId: cid, ...DEFAULT_PREF, enabled: true });
      idx = _prefs.length - 1;
    }
    _prefs[idx] = { ..._prefs[idx], sendTime: time };
  }
  persistPrefs();
  emit();
}

/** 관계별로 예약 메시지를 그루핑하여 반환 */
export function getScheduledMessagesByRelationship(
  contacts: Contact[],
  lang: 'ko' | 'en' = 'ko',
  withinDays: number = 365,
): { relationship: string; contacts: Contact[]; messages: ScheduledMessage[] }[] {
  const relMap = new Map<string, { contacts: Contact[]; messages: ScheduledMessage[] }>();

  for (const c of contacts) {
    const msgs = getScheduledMessagesForContact(c, lang).filter((m) => m.daysUntil <= withinDays);
    const rel = c.relationship || '기타';

    if (!relMap.has(rel)) {
      relMap.set(rel, { contacts: [], messages: [] });
    }
    const group = relMap.get(rel)!;
    group.contacts.push(c);
    if (msgs.length > 0) {
      group.messages.push(...msgs);
    }
  }

  return [...relMap.entries()]
    .map(([relationship, data]) => ({
      relationship,
      contacts: data.contacts,
      messages: data.messages.sort((a, b) => a.daysUntil - b.daysUntil),
    }))
    .sort((a, b) => b.messages.length - a.messages.length);
}

/* ═══════════════════════════════════════════════
   React Hook — useSyncExternalStore
   ═══════════════════════════════════════════════ */

function subscribe(listener: Listener) {
  _listeners.add(listener);
  return () => { _listeners.delete(listener); };
}

function getSnapshot() {
  return _prefs;
}

export function useAutoMessagePrefs(): AutoMessagePref[] {
  return useSyncExternalStore(subscribe, getSnapshot);
}

/** 로그아웃 시 로컬 상태 + localStorage 초기화 */
export function resetAutoMessageStore() {
  // 동기화 타이머 정리
  if (_syncTimer) { clearTimeout(_syncTimer); _syncTimer = null; }
  _autoMsgDirty = false;
  _syncInProgress = false;

  // 상태 초기화
  _prefs = [];
  _sentIds = new Set();
  _taggedTemplates = [];

  // localStorage 정리
  try {
    localStorage.removeItem(LS_AUTO_MSG_KEY);
    localStorage.removeItem(LS_SENT_MSG_KEY);
    localStorage.removeItem(LS_TAGGED_TPL_KEY);
  } catch { /* ignore */ }

  emit();
  emitTaggedTemplates();
}

/* ═══════════════════════════════════════════════
   태그 기반 메시지 템플릿 — 스토어
   ═══════════════════════════════════════════════ */

const LS_TAGGED_TPL_KEY = 'keepin_tagged_templates';

let _taggedTemplates: TaggedTemplate[] = loadTaggedTemplates();
let _tplListeners = new Set<Listener>();

function loadTaggedTemplates(): TaggedTemplate[] {
  try {
    const raw = localStorage.getItem(LS_TAGGED_TPL_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch { /* ignore */ }
  // 데모 데이터
  return [
    {
      id: 'tpl_demo_1',
      occasion: 'newYear',
      message: '{name}님, 새해 복 많이 받으세요! 올해도 좋은 일만 가득하길 바랍니다.',
      targetTags: ['친구', '직장 동료'],
      sendTime: '09:00',
      enabled: true,
      createdAt: Date.now() - 86400000,
    },
    {
      id: 'tpl_demo_2',
      occasion: 'christmas',
      message: '{name}님, 메리 크리스마스! 따뜻한 연말 보내세요.',
      targetTags: ['가족', '친구'],
      sendTime: '10:00',
      enabled: true,
      createdAt: Date.now() - 172800000,
    },
  ];
}

function persistTaggedTemplates() {
  try {
    localStorage.setItem(LS_TAGGED_TPL_KEY, JSON.stringify(_taggedTemplates));
  } catch { /* ignore */ }
  scheduleSync();
}

function emitTaggedTemplates() {
  _tplListeners.forEach((l) => l());
  // 일반 리스너도 알림 (getAllScheduledMessages 영향)
  emit();
}

/* ── CRUD ── */

export function getTaggedTemplates(): TaggedTemplate[] {
  return _taggedTemplates;
}

export function addTaggedTemplate(tpl: Omit<TaggedTemplate, 'id' | 'createdAt'>): TaggedTemplate {
  const newTpl: TaggedTemplate = {
    ...tpl,
    id: `tpl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: Date.now(),
  };
  _taggedTemplates = [..._taggedTemplates, newTpl];
  persistTaggedTemplates();
  emitTaggedTemplates();
  return newTpl;
}

export function updateTaggedTemplate(id: string, updates: Partial<Omit<TaggedTemplate, 'id' | 'createdAt'>>) {
  const idx = _taggedTemplates.findIndex((t) => t.id === id);
  if (idx < 0) return;
  _taggedTemplates = [..._taggedTemplates];
  _taggedTemplates[idx] = { ..._taggedTemplates[idx], ...updates };
  persistTaggedTemplates();
  emitTaggedTemplates();
}

export function removeTaggedTemplate(id: string) {
  _taggedTemplates = _taggedTemplates.filter((t) => t.id !== id);
  persistTaggedTemplates();
  emitTaggedTemplates();
}

/* ── 태그 템플릿 → 예약 메시지 생성 ── */

export function getScheduledMessagesFromTemplates(
  contacts: Contact[],
  lang: 'ko' | 'en' = 'ko',
  withinDays: number = 365,
): ScheduledMessage[] {
  const messages: ScheduledMessage[] = [];

  for (const tpl of _taggedTemplates) {
    if (!tpl.enabled) continue;

    const matchingContacts = contacts.filter((c) =>
      tpl.targetTags.includes(c.relationship),
    );

    const nextDate = getNextOccasionDate(tpl.occasion, undefined);
    // birthday 는 연락처별 생일이 필요하므로 별도 처리
    if (tpl.occasion === 'birthday') {
      for (const c of matchingContacts) {
        if (!c.birthday) continue;
        const bd = getNextOccasionDate('birthday', c.birthday);
        if (!bd || bd.daysUntil > withinDays) continue;

        const meta = OCCASION_META[tpl.occasion];
        const rendered = renderMessage(tpl.message, c.name);
        const msgId = `tpl_${tpl.id}_${c.id}_${bd.date}`;

        messages.push({
          id: msgId,
          contactId: c.id,
          contactName: c.name,
          occasion: tpl.occasion,
          occasionLabel: lang === 'ko' ? meta.labelKo : meta.labelEn,
          message: rendered,
          scheduledDate: bd.date,
          daysUntil: bd.daysUntil,
          sent: _sentIds.has(msgId),
          templateId: tpl.id,
        });
      }
    } else {
      if (!nextDate || nextDate.daysUntil > withinDays) continue;

      for (const c of matchingContacts) {
        const meta = OCCASION_META[tpl.occasion];
        const rendered = renderMessage(tpl.message, c.name);
        const msgId = `tpl_${tpl.id}_${c.id}_${nextDate.date}`;

        messages.push({
          id: msgId,
          contactId: c.id,
          contactName: c.name,
          occasion: tpl.occasion,
          occasionLabel: lang === 'ko' ? meta.labelKo : meta.labelEn,
          message: rendered,
          scheduledDate: nextDate.date,
          daysUntil: nextDate.daysUntil,
          sent: _sentIds.has(msgId),
          templateId: tpl.id,
        });
      }
    }
  }

  return messages.sort((a, b) => a.daysUntil - b.daysUntil);
}

/**
 * 모든 예약 메시지 통합 (개인 + 태그 템플릿).
 * contactId+occasion+date 기준 중복 제거 (개인 설정 우선).
 */
export function getAllScheduledMessagesWithTemplates(
  contacts: Contact[],
  lang: 'ko' | 'en' = 'ko',
  withinDays: number = 365,
): ScheduledMessage[] {
  const perContact = getAllScheduledMessages(contacts, lang, withinDays);
  const fromTemplates = getScheduledMessagesFromTemplates(contacts, lang, withinDays);

  // 개인 설정 우선 — dedup key: contactId + occasion + scheduledDate
  const seen = new Set<string>();
  const result: ScheduledMessage[] = [];

  for (const m of perContact) {
    const key = `${m.contactId}_${m.occasion}_${m.scheduledDate}`;
    seen.add(key);
    result.push(m);
  }
  for (const m of fromTemplates) {
    const key = `${m.contactId}_${m.occasion}_${m.scheduledDate}`;
    if (!seen.has(key)) {
      seen.add(key);
      result.push(m);
    }
  }

  return result.sort((a, b) => a.daysUntil - b.daysUntil);
}

/* ── React Hook — 태그 템플릿 구독 ── */

function subscribeTpl(listener: Listener) {
  _tplListeners.add(listener);
  return () => { _tplListeners.delete(listener); };
}

function getTplSnapshot() {
  return _taggedTemplates;
}

export function useTaggedTemplates(): TaggedTemplate[] {
  return useSyncExternalStore(subscribeTpl, getTplSnapshot);
}