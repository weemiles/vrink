/**
 * notificationSettingsStore.ts
 * ────────────────────────────────────────────────
 * 알림 설정 영속 스토어.
 * - localStorage 캐시 + 서버 동기화
 * - useSyncExternalStore 패턴
 */
import { useSyncExternalStore } from 'react';
import { authenticatedFetch } from './authStore';
import { projectId } from '/utils/supabase/info';

const SERVER_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-0984a125`;
const LS_KEY = 'keepin_notif_settings';

/* ═══════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════ */
export interface NotificationSettings {
  pushEnabled: boolean;
  birthdayAlert: boolean;
  autoMessageAlert: boolean;
  contactReminderAlert: boolean;
  reminderDays: number;
  quietHoursEnabled: boolean;
  quietHoursStart: string; // 'HH:mm'
  quietHoursEnd: string;   // 'HH:mm'
}

export const DEFAULT_SETTINGS: NotificationSettings = {
  pushEnabled: true,
  birthdayAlert: true,
  autoMessageAlert: true,
  contactReminderAlert: true,
  reminderDays: 14,
  quietHoursEnabled: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '08:00',
};

/* ═══════════════════════════════════════════════
   Internal state
   ═══════════════════════════════════════════════ */
let _settings: NotificationSettings = { ...DEFAULT_SETTINGS };
let _loaded = false;
let _syncing = false;

type Listener = () => void;
const _listeners = new Set<Listener>();

function emit() {
  _listeners.forEach((l) => l());
}

function setSettings(next: NotificationSettings) {
  _settings = next;
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(next));
  } catch { /* ignore */ }
  emit();
}

// Load from localStorage on module init
try {
  const cached = localStorage.getItem(LS_KEY);
  if (cached) {
    _settings = { ...DEFAULT_SETTINGS, ...JSON.parse(cached) };
  }
} catch { /* ignore */ }

/* ═══════════════════════════════════════════════
   Server sync
   ═══════════════════════════════════════════════ */

/** 서버에서 설정 조회 */
export async function fetchNotificationSettings(): Promise<void> {
  try {
    const res = await authenticatedFetch(`${SERVER_BASE}/notification-settings`);
    if (!res.ok) {
      console.warn('[notifSettingsStore] fetch error:', res.status);
      return;
    }
    const data = await res.json();
    const merged = { ...DEFAULT_SETTINGS, ...(data.settings ?? {}) };
    setSettings(merged);
    _loaded = true;
  } catch (err) {
    console.warn('[notifSettingsStore] fetch error:', err);
  }
}

/** 설정 업데이트 (낙관적 + 서버 동기화) */
export async function updateNotificationSettings(
  partial: Partial<NotificationSettings>,
): Promise<void> {
  const next = { ..._settings, ...partial };
  setSettings(next); // 낙관적 업데이트

  if (_syncing) return;
  _syncing = true;

  try {
    await authenticatedFetch(`${SERVER_BASE}/notification-settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(next),
    });
  } catch (err) {
    console.warn('[notifSettingsStore] save error:', err);
  }
  _syncing = false;
}

/** 로컬 상태 초기화 (로그아웃 시) */
export function resetNotificationSettings() {
  _settings = { ...DEFAULT_SETTINGS };
  _loaded = false;
  try { localStorage.removeItem(LS_KEY); } catch { /* ignore */ }
  emit();
}

/* ═══════════════════════════════════════════════
   React Hook
   ═══════════════════════════════════════════════ */
function subscribe(listener: Listener) {
  _listeners.add(listener);
  return () => { _listeners.delete(listener); };
}

function getSnapshot(): NotificationSettings {
  return _settings;
}

export function useNotificationSettings(): NotificationSettings {
  return useSyncExternalStore(subscribe, getSnapshot);
}