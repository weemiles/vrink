/**
 * groupStore.ts
 * ────────────────────────────────────────────────
 * useSyncExternalStore 기반 반응형 연락처 그룹 스토어.
 * 런타임 메모리 + localStorage 영속화 + KV Store 서버 동기화.
 *
 * 전략 (offline-first):
 *  1) localStorage는 항상 즉시 읽기/쓰기 (오프라인 가능)
 *  2) 인증 사용자가 있으면 변경 시 KV Store에 debounced 백그라운드 동기화
 *  3) 로그인 시 pullGroupsFromServer() → 서버 데이터를 로컬에 병합
 */
import { useSyncExternalStore } from 'react';
import { authenticatedFetch } from './authStore';
import { projectId } from '/utils/supabase/info';

/* ═══════════════════════════════════════════════
   타입 정의
   ═══════════════════════════════════════════════ */
export interface ContactGroup {
  id: string;
  name: string;
  emoji?: string;     // 그룹 아이콘 (optional emoji)
  createdAt: string;  // ISO string
}

/* ═══════════════════════════════════════════════
   상수
   ═══════════════════════════════════════════════ */
const SERVER_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-0984a125`;
const LS_GROUPS_KEY = 'connection_contact_groups';
const MAX_GROUPS = 20; // 최대 그룹 수

/* ═══════════════════════════════════════════════
   기본 그룹 이모지 순환 목록
   ═══════════════════════════════════════════════ */
const GROUP_EMOJIS = ['👥', '🏢', '🎓', '⭐', '🎯', '💼', '🏠', '🎮', '⚽', '🎵'];

/* ═══════════════════════════════════════════════
   내부 상태
   ═══════════════════════════════════════════════ */
type Listener = () => void;

let _groups: ContactGroup[] = loadGroups();
let _listeners = new Set<Listener>();

function loadGroups(): ContactGroup[] {
  try {
    const stored = localStorage.getItem(LS_GROUPS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch { /* ignore */ }
  return [];
}

function persistGroups() {
  try {
    localStorage.setItem(LS_GROUPS_KEY, JSON.stringify(_groups));
  } catch { /* ignore */ }
  scheduleSyncGroups();
}

function emit() {
  _listeners.forEach((l) => l());
}

/* ═══════════════════════════════════════════════
   서버 동기화 (debounced)
   ═══════════════════════════════════════════════ */
let _syncTimer: ReturnType<typeof setTimeout> | null = null;
let _dirty = false;

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    if (_dirty) {
      console.log('[groupStore] Online restored — syncing dirty groups');
      scheduleSyncGroups();
    }
  });
}

function scheduleSyncGroups() {
  _dirty = true;
  if (_syncTimer) clearTimeout(_syncTimer);
  _syncTimer = setTimeout(() => {
    syncGroupsToServer();
  }, 1500);
}

async function syncGroupsToServer() {
  try {
    const res = await authenticatedFetch(`${SERVER_BASE}/contact-groups`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ groups: _groups }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      console.warn('[groupStore] sync failed:', data.error || res.statusText);
    } else {
      _dirty = false;
      console.log('[groupStore] Groups synced to server');
    }
  } catch (err) {
    console.warn('[groupStore] sync network error:', err);
  }
}

/**
 * 서버에서 그룹 Pull — 로그인 직후 호출
 */
export async function pullGroupsFromServer(): Promise<void> {
  try {
    const res = await authenticatedFetch(`${SERVER_BASE}/contact-groups`);
    if (res.ok) {
      const { groups } = await res.json();
      if (Array.isArray(groups) && groups.length > 0) {
        _groups = groups;
        try { localStorage.setItem(LS_GROUPS_KEY, JSON.stringify(_groups)); } catch { /* ignore */ }
        emit();
        console.log(`[groupStore] Pulled ${groups.length} groups from server`);
      } else {
        // 서버 비어있고 로컬에 데이터 있으면 Push
        if (_groups.length > 0) {
          await syncGroupsToServer();
          console.log('[groupStore] Pushed local groups to empty server');
        }
      }
    }
  } catch (err) {
    console.warn('[groupStore] pullFromServer error:', err);
  }
}

/* ═══════════════════════════════════════════════
   공개 API — 그룹 CRUD
   ═══════════════════════════════════════════════ */

/** 그룹 추가 */
export function addGroup(name: string, emoji?: string): ContactGroup | null {
  const trimmed = name.trim();
  if (!trimmed) return null;
  if (_groups.length >= MAX_GROUPS) return null;
  if (_groups.some((g) => g.name === trimmed)) return null;

  const group: ContactGroup = {
    id: `grp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name: trimmed,
    emoji: emoji || GROUP_EMOJIS[_groups.length % GROUP_EMOJIS.length],
    createdAt: new Date().toISOString(),
  };

  _groups = [..._groups, group];
  persistGroups();
  emit();
  return group;
}

/** 그룹 이름/이모지 수정 */
export function updateGroup(id: string, data: Partial<{ name: string; emoji: string }>): boolean {
  const index = _groups.findIndex((g) => g.id === id);
  if (index === -1) return false;

  if (data.name !== undefined) {
    const trimmed = data.name.trim();
    if (!trimmed) return false;
    // 중복 이름 체크 (자기 자신 제외)
    if (_groups.some((g, i) => i !== index && g.name === trimmed)) return false;
  }

  _groups = [..._groups];
  _groups[index] = { ..._groups[index], ...data };
  persistGroups();
  emit();
  return true;
}

/** 그룹 삭제 (연락처에서 groupId 제거는 caller 책임) */
export function deleteGroup(id: string) {
  _groups = _groups.filter((g) => g.id !== id);
  persistGroups();
  emit();
}

/** ID로 그룹 조회 */
export function getGroupById(id: string): ContactGroup | undefined {
  return _groups.find((g) => g.id === id);
}

/** 그룹 목록 (비반응형) */
export function getGroups(): ContactGroup[] {
  return [..._groups];
}

/* ═══════════════════════════════════════════════
   React Hooks — useSyncExternalStore
   ═══════════════════════════════════════════════ */

function subscribe(listener: Listener) {
  _listeners.add(listener);
  return () => { _listeners.delete(listener); };
}

function getSnapshot() {
  return _groups;
}

/** 반응형 그룹 배열 훅 */
export function useGroups(): ContactGroup[] {
  return useSyncExternalStore(subscribe, getSnapshot);
}

/** 로그아웃/계정 삭제 시 리셋 */
export function resetGroupStore() {
  if (_syncTimer) { clearTimeout(_syncTimer); _syncTimer = null; }
  _dirty = false;
  _groups = [];
  try { localStorage.removeItem(LS_GROUPS_KEY); } catch { /* ignore */ }
  emit();
}
