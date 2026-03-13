/**
 * useAppBootstrap.ts
 * ────────────────────────────────────────────────
 * 앱 부팅 시 인증된 사용자의 서버 데이터를 한 번만 동기화합니다.
 *
 * ── 문제 ──
 * 로그인 시에는 pullFromServer()가 호출되지만,
 * 페이지 새로고침/재방문 시에는 localStorage의 스탈 데이터만 보입니다.
 * 이 훅은 AuthGuard 안에서 마운트되어, 인증 확인 후 모든 스토어를
 * 서버와 한 번 동기화합니다.
 *
 * ── 선제적 토큰 갱신 ──
 * 토큰 만료 4분 전에 백그라운드에서 자동 갱신하여
 * 401 에러를 사전 방지합니다.
 *
 * ── 포그라운드 복귀 갱신 ──
 * visibilitychange 이벤트로 앱이 백그라운드에서 복귀하면
 * 토큰 유효성 체크 + 프로필 signed URL 갱신을 수행합니다.
 */
import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '../data/authStore';
import { useAuth } from './AuthContext';
import { pullFromServer } from '../data/contactsStore';
import { pullAutoMessagesFromServer } from '../data/autoMessageStore';
import { refreshFromServer as refreshProfile } from '../data/profileStore';
import { fetchNotificationSettings } from '../data/notificationSettingsStore';
import { pullGroupsFromServer } from '../data/groupStore';
import { pullFromServer as pullInteractionLogs } from '../data/interactionLogStore';
import { pullFromServer as pullTags } from '../data/tagStore';

/** 토큰 만료 4분 전 갱신 (240초) */
const TOKEN_REFRESH_MARGIN_S = 240;
/** 갱신 체크 주기 (60초) */
const TOKEN_CHECK_INTERVAL_MS = 60_000;
/** 포그라운드 복귀 시 갱신 최소 간격 (5분) */
const FOREGROUND_REFRESH_MIN_MS = 5 * 60 * 1000;

export function useAppBootstrap() {
  const auth = useAuth();
  const bootstrappedRef = useRef(false);
  const prevUserIdRef = useRef<string | null>(null);
  const lastForegroundRefreshRef = useRef(0);

  /* ─── 1) 서버 데이터 하이드레이션 (세션 복원 시 1회) ─── */
  useEffect(() => {
    if (!auth.initialized || !auth.user) return;
    if (bootstrappedRef.current && prevUserIdRef.current === auth.user.id) return;

    prevUserIdRef.current = auth.user.id;
    bootstrappedRef.current = true;

    const hydrate = async () => {
      console.log('[useAppBootstrap] Hydrating data from server…');

      const results = await Promise.allSettled([
        pullFromServer(),
        pullAutoMessagesFromServer(),
        refreshProfile(/* force */ true),
        fetchNotificationSettings(),
        pullGroupsFromServer(),
        pullInteractionLogs(),
        pullTags(),
      ]);

      results.forEach((r, i) => {
        if (r.status === 'rejected') {
          const names = ['contacts', 'autoMessages+taggedTemplates', 'profile', 'notifSettings', 'contactGroups', 'interactionLogs', 'tags'];
          console.warn(`[useAppBootstrap] ${names[i]} hydration failed:`, r.reason);
        }
      });

      lastForegroundRefreshRef.current = Date.now();
      console.log('[useAppBootstrap] Hydration complete');
    };

    hydrate();
  }, [auth.initialized, auth.user?.id]);

  /* ─── 2) 선제적 토큰 갱신 타이머 ─── */
  const checkAndRefresh = useCallback(async () => {
    const expiresAt = auth.session?.expires_at;
    if (!expiresAt) return;

    const now = Math.floor(Date.now() / 1000);
    const remaining = expiresAt - now;

    if (remaining > 0 && remaining < TOKEN_REFRESH_MARGIN_S) {
      console.log(`[useAppBootstrap] Token expires in ${remaining}s — proactive refresh`);
      try {
        const { error } = await supabase.auth.refreshSession();
        if (error) {
          console.warn('[useAppBootstrap] Proactive refresh failed:', error.message);
        } else {
          console.log('[useAppBootstrap] Token refreshed proactively');
        }
      } catch (err) {
        console.warn('[useAppBootstrap] Proactive refresh error:', err);
      }
    }
  }, [auth.session?.expires_at]);

  useEffect(() => {
    if (!auth.session) return;

    checkAndRefresh();
    const interval = setInterval(checkAndRefresh, TOKEN_CHECK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [auth.session, checkAndRefresh]);

  /* ─── 3) 포그라운드 복귀 시 데이터 갱신 ─── */
  useEffect(() => {
    if (!auth.user) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState !== 'visible') return;

      const now = Date.now();
      if (now - lastForegroundRefreshRef.current < FOREGROUND_REFRESH_MIN_MS) return;

      lastForegroundRefreshRef.current = now;
      console.log('[useAppBootstrap] Foreground restored — light refresh');

      // 토큰 갱신 체크 + 프로필 signed URL 갱신 (가벼운 작업만)
      checkAndRefresh();
      refreshProfile(false); // force=false → signed URL 만료 시에만 갱신
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [auth.user, checkAndRefresh]);

  /* ─── 4) 유저 전환 시 부트스트랩 리셋 ─── */
  useEffect(() => {
    if (!auth.user) {
      bootstrappedRef.current = false;
      prevUserIdRef.current = null;
    }
  }, [auth.user]);
}
