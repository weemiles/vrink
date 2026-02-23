/**
 * interactionLogStore.ts
 * ────────────────────────────────────────────────
 * 연락 기록 (Interaction Log) 스토어.
 * 각 연락처와의 교류 이력을 추적하고,
 * lastContact 자동 갱신 + 서버 동기화를 제공합니다.
 *
 * 전략 (offline-first):
 *  1) localStorage 즉시 읽기/쓰기 (오프라인 가능)
 *  2) 인증 사용자: 변경 시 KV Store에 debounced 백그라운드 동기화
 *  3) 로그인 시 pullFromServer() → 서버 데이터를 로컬에 병합
 */
import { useSyncExternalStore } from 'react';
import { authenticatedFetch } from './authStore';
import { projectId } from '/utils/supabase/info';

/* ═══════════════════════════════════════════════
   타입 정의
   ═══════════════════════════════════════════════ */
export type InteractionType = 'call' | 'message' | 'meeting' | 'gift' | 'sns' | 'other';

export interface InteractionLog {
  id: string;
  contactId: string;
  type: InteractionType;
  note: string;
  date: string;        // YYYY-MM-DD
  createdAt: string;   // ISO string
}

export const INTERACTION_TYPE_META: Record<InteractionType, {
  labelKo: string;
  labelEn: string;
  emoji: string;
}> = {
  call:    { labelKo: '전화',   labelEn: 'Call',    emoji: '📞' },
  message: { labelKo: '메시지', labelEn: 'Message', emoji: '💬' },
  meeting: { labelKo: '만남',   labelEn: 'Meeting', emoji: '🤝' },
  gift:    { labelKo: '선물',   labelEn: 'Gift',    emoji: '🎁' },
  sns:     { labelKo: 'SNS',    labelEn: 'SNS',     emoji: '📱' },
  other:   { labelKo: '기타',   labelEn: 'Other',   emoji: '📝' },
};

export const ALL_INTERACTION_TYPES: InteractionType[] = ['call', 'message', 'meeting', 'gift', 'sns', 'other'];

/* ═══════════════════════════════════════════════
   상수
   ═══════════════════════════════════════════════ */
const SERVER_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-0984a125`;
const LS_KEY = 'keppin_interaction_logs';
const MAX_LOGS = 2000;

/* ═══════════════════════════════════════════════
   내부 상태
   ═══════════════════════════════════════════════ */
type Listener = () => void;

let _logs: InteractionLog[] = loadFromLS();
let _listeners = new Set<Listener>();
let _syncTimer: ReturnType<typeof setTimeout> | null = null;
let _pulling = false;

function loadFromLS(): InteractionLog[] {
  try {
    const stored = localStorage.getItem(LS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch { /* ignore */ }
  return [];
}

function saveToLS() {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(_logs));
  } catch { /* ignore */ }
}

function emit() {
  _listeners.forEach(l => l());
}

/* ═══════════════════════════════════════════════
   서버 동기화
   ═══════════════════════════════════════════════ */
function scheduleSyncToServer() {
  if (_syncTimer) clearTimeout(_syncTimer);
  _syncTimer = setTimeout(async () => {
    try {
      await authenticatedFetch(`${SERVER_BASE}/interaction-logs`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logs: _logs }),
      });
    } catch (e) {
      console.warn('[interactionLogStore] Sync to server failed:', e);
    }
  }, 2000);
}

/** 서버에서 로그 가져오기 (로그인 후 호출) */
export async function pullFromServer(): Promise<void> {
  if (_pulling) return;
  _pulling = true;
  try {
    const res = await authenticatedFetch(`${SERVER_BASE}/interaction-logs`);
    if (res.ok) {
      const data = await res.json();
      const serverLogs: InteractionLog[] = data.logs ?? [];
      if (serverLogs.length > 0) {
        // 서버 데이터를 기본으로, 로컬 전용 항목 병합
        const serverIds = new Set(serverLogs.map(l => l.id));
        const localOnly = _logs.filter(l => !serverIds.has(l.id));
        _logs = [...localOnly, ...serverLogs]
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, MAX_LOGS);
        saveToLS();
        emit();
        // 병합 후 서버에 재동기화
        if (localOnly.length > 0) {
          scheduleSyncToServer();
        }
      }
    }
  } catch (e) {
    console.warn('[interactionLogStore] Pull from server failed:', e);
  } finally {
    _pulling = false;
  }
}

/* ═══════════════════════════════════════════════
   공개 API
   ═══════════════════════════════════════════════ */

/** 단일 연락 기록 추가 */
export function addLog(params: {
  contactId: string;
  type: InteractionType;
  note?: string;
  date: string;
}): InteractionLog {
  const newLog: InteractionLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    contactId: params.contactId,
    type: params.type,
    note: (params.note || '').slice(0, 200),
    date: params.date,
    createdAt: new Date().toISOString(),
  };

  _logs = [newLog, ..._logs].slice(0, MAX_LOGS);
  saveToLS();
  emit();
  scheduleSyncToServer();

  // 서버에도 POST (lastContact 자동 갱신을 위해)
  authenticatedFetch(`${SERVER_BASE}/interaction-logs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  }).catch(e => console.warn('[interactionLogStore] POST failed:', e));

  return newLog;
}

/** 단일 연락 기록 삭제 */
export function removeLog(logId: string): void {
  _logs = _logs.filter(l => l.id !== logId);
  saveToLS();
  emit();
  scheduleSyncToServer();
}

/** 특정 연락처의 로그 조회 */
export function getLogsForContact(contactId: string): InteractionLog[] {
  return _logs.filter(l => l.contactId === contactId);
}

/** 전체 로그 조회 */
export function getAllLogs(): InteractionLog[] {
  return _logs;
}

/** 특정 연락처의 최근 N개 로그 */
export function getRecentLogsForContact(contactId: string, limit = 5): InteractionLog[] {
  return _logs
    .filter(l => l.contactId === contactId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, limit);
}

/** 스토어 초기화 (로그아웃 시) */
export function resetInteractionLogStore(): void {
  _logs = [];
  saveToLS();
  emit();
}

/* ═══════════════════════════════════════════════
   React Hook — useSyncExternalStore
   ═══════════════════════════════════════════════ */
function subscribe(listener: Listener) {
  _listeners.add(listener);
  return () => { _listeners.delete(listener); };
}

function getSnapshot(): InteractionLog[] {
  return _logs;
}

/** 전체 로그를 반환하는 hook */
export function useInteractionLogs(): InteractionLog[] {
  return useSyncExternalStore(subscribe, getSnapshot);
}

/** 특정 연락처 로그만 반환하는 hook */
export function useContactLogs(contactId: string): InteractionLog[] {
  const all = useSyncExternalStore(subscribe, getSnapshot);
  return all.filter(l => l.contactId === contactId);
}
