/**
 * statsStore.ts
 * ────────────────────────────────────────────────
 * 서버 기반 통계 스토어.
 * 서버에서 계산된 인맥 통계를 가져와 캐시합니다.
 * useSyncExternalStore 패턴으로 React에 반응형 제공.
 */
import { useSyncExternalStore } from 'react';
import { authenticatedFetch } from './authStore';
import { projectId } from '/utils/supabase/info';

const SERVER_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-0984a125`;

/* ═══════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════ */
export interface TopContactedItem {
  contactId: string;
  name: string;
  relationship: string;
  count: number;
}

export interface NeedsAttentionItem {
  contactId: string;
  name: string;
  relationship: string;
  contactGap: number;
  lastContact: string;
}

export interface UpcomingBirthdayItem {
  contactId: string;
  name: string;
  relationship: string;
  birthday: string;
  dday: number;
}

export interface WeeklyActivityItem {
  week: string;
  count: number;
}

export interface UserStats {
  totalContacts: number;
  totalLogs: number;
  totalGroups: number;
  favoriteCount: number;
  recentLogCount: number;
  thisMonthLogs: number;
  streak: number;
  autoMessageEnabledCount: number;
  relationshipDistribution: Record<string, number>;
  closenessDistribution: Record<string, number>;
  logTypeDistribution: Record<string, number>;
  weeklyActivity: WeeklyActivityItem[];
  topContacted: TopContactedItem[];
  needsAttention: NeedsAttentionItem[];
  upcomingBirthdays: UpcomingBirthdayItem[];
}

export interface StatsState {
  stats: UserStats | null;
  loading: boolean;
  error: string | null;
  lastFetched: number;
}

/* ═══════════════════════════════════════════════
   Internal state
   ═══════════════════════════════════════════════ */
let _state: StatsState = {
  stats: null,
  loading: false,
  error: null,
  lastFetched: 0,
};

type Listener = () => void;
const _listeners = new Set<Listener>();

function emit() {
  _listeners.forEach(l => l());
}

function setState(partial: Partial<StatsState>) {
  _state = { ..._state, ...partial };
  emit();
}

/* ═══════════════════════════════════════════════
   Public API
   ═══════════════════════════════════════════════ */

/** 서버에서 통계 가져오기 */
export async function fetchStats(force = false): Promise<void> {
  // 1분 이내 중복 요청 방지
  if (!force && Date.now() - _state.lastFetched < 60_000) return;
  if (_state.loading) return;

  setState({ loading: true, error: null });

  try {
    const res = await authenticatedFetch(`${SERVER_BASE}/stats`);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || `HTTP ${res.status}`);
    }

    const data = await res.json();
    setState({
      stats: data.stats,
      loading: false,
      lastFetched: Date.now(),
    });
  } catch (err: any) {
    console.error('[statsStore] fetchStats error:', err);
    setState({
      loading: false,
      error: err.message || '통계 조회에 실패했습니다.',
    });
  }
}

/** 스토어 초기화 */
export function resetStatsStore(): void {
  _state = {
    stats: null,
    loading: false,
    error: null,
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

function getSnapshot(): StatsState {
  return _state;
}

export function useStats(): StatsState {
  return useSyncExternalStore(subscribe, getSnapshot);
}
