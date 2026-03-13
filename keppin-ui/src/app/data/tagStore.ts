/**
 * tagStore.ts
 * ────────────────────────────────────────────────
 * 연락처 태그 라이브러리 스토어.
 * 사용자가 생성한 자유 태그를 관리하며,
 * 연락처에 태그를 부여/제거할 수 있습니다.
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
export interface Tag {
  id: string;
  label: string;
  color: string; // hex color
  createdAt: string;
}

/* ═══════════════════════════════════════════════
   상수
   ═══════════════════════════════════════════════ */
const SERVER_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-0984a125`;
const LS_KEY = 'keepin_tags';

/** 기본 태그 색상 팔레트 (Mono 디자인 시스템) */
export const TAG_COLORS = [
  '#171717', '#333333', '#525252', '#737373', '#8A8A8A',
  '#A3A3A3', '#B0B0B0', '#3B82F6', '#EF4444', '#10B981',
  '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316',
];

/* ═══════════════════════════════════════════════
   내부 상태
   ═══════════════════════════════════════════════ */
type Listener = () => void;

let _tags: Tag[] = loadFromLS();
let _listeners = new Set<Listener>();
let _syncTimer: ReturnType<typeof setTimeout> | null = null;
let _pulling = false;

function loadFromLS(): Tag[] {
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
    localStorage.setItem(LS_KEY, JSON.stringify(_tags));
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
      await authenticatedFetch(`${SERVER_BASE}/tags`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tags: _tags }),
      });
    } catch (e) {
      console.warn('[tagStore] Sync to server failed:', e);
    }
  }, 2000);
}

/** 서버에서 태그 가져오기 (로그인 후 호출) */
export async function pullFromServer(): Promise<void> {
  if (_pulling) return;
  _pulling = true;
  try {
    const res = await authenticatedFetch(`${SERVER_BASE}/tags`);
    if (res.ok) {
      const data = await res.json();
      const serverTags: Tag[] = data.tags ?? [];
      if (serverTags.length > 0) {
        // 서버 데이터를 기본으로, 로컬 전용 항목 병합
        const serverIds = new Set(serverTags.map(t => t.id));
        const localOnly = _tags.filter(t => !serverIds.has(t.id));
        _tags = [...serverTags, ...localOnly].slice(0, 100); // 최대 100개
        saveToLS();
        emit();
        if (localOnly.length > 0) {
          scheduleSyncToServer();
        }
      }
    }
  } catch (e) {
    console.warn('[tagStore] Pull from server failed:', e);
  } finally {
    _pulling = false;
  }
}

/* ═══════════════════════════════════════════════
   공개 API
   ═══════════════════════════════════════════════ */

/** 태그 추가 */
export function addTag(label: string, color?: string): Tag {
  const trimmed = label.trim().slice(0, 20);
  // 중복 체크
  const existing = _tags.find(t => t.label === trimmed);
  if (existing) return existing;

  const newTag: Tag = {
    id: `tag-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    label: trimmed,
    color: color || TAG_COLORS[_tags.length % TAG_COLORS.length],
    createdAt: new Date().toISOString(),
  };

  _tags = [newTag, ..._tags].slice(0, 100);
  saveToLS();
  emit();
  scheduleSyncToServer();
  return newTag;
}

/** 태그 삭제 */
export function removeTag(tagId: string): void {
  _tags = _tags.filter(t => t.id !== tagId);
  saveToLS();
  emit();
  scheduleSyncToServer();
}

/** 태그 수정 (라벨, 색상) */
export function updateTag(tagId: string, updates: Partial<Pick<Tag, 'label' | 'color'>>): void {
  const idx = _tags.findIndex(t => t.id === tagId);
  if (idx < 0) return;
  _tags = [..._tags];
  _tags[idx] = { ..._tags[idx], ...updates };
  saveToLS();
  emit();
  scheduleSyncToServer();
}

/** 전체 태그 목록 조회 */
export function getAllTags(): Tag[] {
  return _tags;
}

/** ID로 태그 조회 */
export function getTagById(tagId: string): Tag | undefined {
  return _tags.find(t => t.id === tagId);
}

/** 라벨로 태그 검색 */
export function findTagByLabel(label: string): Tag | undefined {
  return _tags.find(t => t.label === label.trim());
}

/** 스토어 초기화 (로그아웃 시) */
export function resetTagStore(): void {
  _tags = [];
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

function getSnapshot(): Tag[] {
  return _tags;
}

/** 전체 태그를 반환하는 hook */
export function useTags(): Tag[] {
  return useSyncExternalStore(subscribe, getSnapshot);
}
