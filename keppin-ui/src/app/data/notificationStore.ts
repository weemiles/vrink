/**
 * notificationStore.ts
 * ────────────────────────────────────────────────
 * 서버 기반 알림 관리 스토어.
 * - 서버에서 알림 조회/생성/읽음 처리
 * - 로컬 알림(NotificationPanel의 buildNotifications)과 병합
 * - useSyncExternalStore 패턴으로 React에 반응형 제공
 */
import { useSyncExternalStore } from 'react';
import { authenticatedFetch } from './authStore';
import { projectId } from '/utils/supabase/info';

const SERVER_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-0984a125`;

/* ═══════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════ */
export interface ServerNotification {
  id: string;
  type: 'auto_message' | 'birthday_reminder' | 'contact_reminder' | 'system';
  title: string;
  body: string;
  contactId?: string;
  occasion?: string;
  read: boolean;
  createdAt: string;
}

export interface NotificationState {
  serverNotifications: ServerNotification[];
  unreadCount: number;
  loading: boolean;
  lastFetched: number; // timestamp
}

/* ═══════════════════════════════════════════════
   Internal state
   ═══════════════════════════════════════════════ */
let _state: NotificationState = {
  serverNotifications: [],
  unreadCount: 0,
  loading: false,
  lastFetched: 0,
};

type Listener = () => void;
const _listeners = new Set<Listener>();

function emit() {
  _listeners.forEach((l) => l());
}

function setState(partial: Partial<NotificationState>) {
  _state = { ..._state, ...partial };
  emit();
}

/* ═══════════════════════════════════════════════
   API calls
   ═══════════════════════════════════════════════ */

/** 서버에서 알림 목록 조회 */
export async function fetchNotifications(): Promise<void> {
  setState({ loading: true });
  try {
    const res = await authenticatedFetch(`${SERVER_BASE}/notifications`);
    if (!res.ok) {
      console.warn('[notificationStore] fetch error:', res.status);
      setState({ loading: false });
      return;
    }
    const data = await res.json();
    setState({
      serverNotifications: data.notifications ?? [],
      unreadCount: data.unreadCount ?? 0,
      loading: false,
      lastFetched: Date.now(),
    });
  } catch (err) {
    console.warn('[notificationStore] fetch error:', err);
    setState({ loading: false });
  }
}

/**
 * 서버에 오늘의 알림 생성 요청.
 * 프론트에서 contacts + scheduledMessages를 보내면
 * 서버가 오늘 날짜에 해당하는 알림을 생성.
 */
export async function generateNotifications(payload: {
  contacts: Array<{
    id: string;
    name: string;
    birthday: string;
    relationship: string;
    contactGap: number;
  }>;
  scheduledMessages: Array<{
    contactId: string;
    contactName: string;
    occasion: string;
    scheduledDate: string;
    message: string;
  }>;
}): Promise<{ generated: number; unreadCount: number } | null> {
  try {
    const res = await authenticatedFetch(`${SERVER_BASE}/notifications/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      console.warn('[notificationStore] generate error:', res.status);
      return null;
    }

    const data = await res.json();
    setState({ unreadCount: data.unreadCount ?? 0 });

    // 생성 후 자동으로 전체 목록 갱신
    if (data.generated > 0) {
      await fetchNotifications();
    }

    return { generated: data.generated, unreadCount: data.unreadCount };
  } catch (err) {
    console.warn('[notificationStore] generate error:', err);
    return null;
  }
}

/** 모든 알림 읽음 처리 */
export async function markAllRead(): Promise<void> {
  // 낙관적 업데이트
  setState({
    unreadCount: 0,
    serverNotifications: _state.serverNotifications.map((n) => ({ ...n, read: true })),
  });

  try {
    await authenticatedFetch(`${SERVER_BASE}/notifications/read`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.warn('[notificationStore] markAllRead error:', err);
  }
}

/** 전체 알림 삭제 */
export async function clearAllNotifications(): Promise<void> {
  setState({ serverNotifications: [], unreadCount: 0 });

  try {
    await authenticatedFetch(`${SERVER_BASE}/notifications`, {
      method: 'DELETE',
    });
  } catch (err) {
    console.warn('[notificationStore] clearAll error:', err);
  }
}

/** 개별 알림 삭제 */
export async function deleteNotification(notifId: string): Promise<void> {
  // 낙관적 업데이트
  const filtered = _state.serverNotifications.filter((n) => n.id !== notifId);
  const wasUnread = _state.serverNotifications.find((n) => n.id === notifId && !n.read);
  setState({
    serverNotifications: filtered,
    unreadCount: wasUnread ? Math.max(0, _state.unreadCount - 1) : _state.unreadCount,
  });

  try {
    await authenticatedFetch(`${SERVER_BASE}/notifications/${encodeURIComponent(notifId)}`, {
      method: 'DELETE',
    });
  } catch (err) {
    console.warn('[notificationStore] delete single error:', err);
  }
}

/** 로컬 상태 초기화 (로그아웃 시) */
export function resetNotificationState() {
  _state = {
    serverNotifications: [],
    unreadCount: 0,
    loading: false,
    lastFetched: 0,
  };
  emit();
}

/* ═══════════════════════════════════════════════
   React Hook
   ═══════════════════════════════════════════════ */
function subscribe(listener: Listener) {
  _listeners.add(listener);
  return () => { _listeners.delete(listener); };
}

function getSnapshot(): NotificationState {
  return _state;
}

export function useNotificationState(): NotificationState {
  return useSyncExternalStore(subscribe, getSnapshot);
}