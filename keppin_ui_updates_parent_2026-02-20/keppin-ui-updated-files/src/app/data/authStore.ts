/**
 * authStore.ts
 * ────────────────────────────────────────────────
 * Supabase Auth 기반 인증 상태 관리.
 * useSyncExternalStore 패턴으로 React 컴포넌트에 반응형 제공.
 *
 * 프론트엔드에서 직접 Supabase Auth를 호출하고,
 * 서버(/signup)는 admin.createUser 용도로만 사용.
 */
import { useSyncExternalStore } from 'react';
import { createClient, type User, type Session } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '/utils/supabase/info';

/* ═══════════════════════════════════════════════
   Supabase Client (singleton)
   ═══════════════════════════════════════════════ */
const SUPABASE_URL = `https://${projectId}.supabase.co`;
const supabase = createClient(SUPABASE_URL, publicAnonKey);

export { supabase };

/* ═══════════════════════════════════════════════
   Server base URL
   ═══════════════════════════════════════════════ */
const SERVER_BASE = `${SUPABASE_URL}/functions/v1/make-server-0984a125`;
const DEMO_AUTH_BYPASS_KEY = '__keppin_demo_auth_bypass';

export function isDemoAuthBypassEnabled(): boolean {
  try {
    return localStorage.getItem(DEMO_AUTH_BYPASS_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setDemoAuthBypassEnabled(enabled: boolean): void {
  try {
    if (enabled) {
      localStorage.setItem(DEMO_AUTH_BYPASS_KEY, 'true');
    } else {
      localStorage.removeItem(DEMO_AUTH_BYPASS_KEY);
    }
  } catch {
    // ignore storage errors
  }
}

/* ═══════════════════════════════════════════════
   Auth State
   ═══════════════════════════════════════════════ */
export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  initialized: boolean;
}

let _state: AuthState = {
  user: null,
  session: null,
  loading: true,
  initialized: false,
};

type Listener = () => void;
const _listeners = new Set<Listener>();

function emit() {
  _listeners.forEach((l) => l());
}

function setState(partial: Partial<AuthState>) {
  _state = { ..._state, ...partial };
  emit();
}

/* ═══════════════════════════════════════════════
   Initialize — check existing session
   ═══════════════════════════════════════════════ */
let _initPromise: Promise<void> | null = null;

export function initAuth(): Promise<void> {
  if (_initPromise) return _initPromise;

  _initPromise = (async () => {
    try {
      // getSession()은 localStorage에서 세션을 읽지만 만료된 토큰을 갱신하지 않음
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error('[authStore] getSession error:', error.message);
      }

      let activeSession = session;

      // 토큰이 만료되었거나 만료 임박이면 즉시 갱신
      if (activeSession?.expires_at) {
        const now = Math.floor(Date.now() / 1000);
        if (activeSession.expires_at - now < 60) {
          const { data: { session: refreshed } } = await supabase.auth.refreshSession();
          if (refreshed) {
            activeSession = refreshed;
          }
        }
      }

      setState({
        user: activeSession?.user ?? null,
        session: activeSession ?? null,
        loading: false,
        initialized: true,
      });
    } catch (err) {
      console.error('[authStore] init error:', err);
      setState({ loading: false, initialized: true });
    }
  })();

  // Listen for auth state changes (token refresh, sign out, etc.)
  supabase.auth.onAuthStateChange((_event, session) => {
    setState({
      user: session?.user ?? null,
      session: session ?? null,
    });
  });

  return _initPromise;
}

/* ═══════════════════════════════════════════════
   Sign Up — calls server /signup (admin.createUser)
   then auto-signs in
   ═══════════════════════════════════════════════ */
export async function signUp(params: {
  email: string;
  password: string;
  name: string;
}): Promise<{ success: boolean; error?: string }> {
  setState({ loading: true });

  try {
    // 1) Call server to create user via admin API
    const res = await fetch(`${SERVER_BASE}/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${publicAnonKey}`,
      },
      body: JSON.stringify(params),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error('[authStore] signup server error:', data.error);
      setState({ loading: false });
      return { success: false, error: data.error || '회원가입에 실패했습니다.' };
    }

    // 2) Auto sign in after successful creation
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: params.email,
      password: params.password,
    });

    if (signInError) {
      console.error('[authStore] auto-signin after signup error:', signInError.message);
      setState({ loading: false });
      // User was created but auto-sign-in failed — still success
      return { success: true, error: '가입은 완료되었으나 자동 로그인에 실패했습니다. 로그인 페이지에서 다시 시도해주세요.' };
    }

    setState({
      user: signInData.session?.user ?? null,
      session: signInData.session ?? null,
      loading: false,
    });

    return { success: true };
  } catch (err) {
    console.error('[authStore] signup unexpected error:', err);
    setState({ loading: false });
    return { success: false, error: `회원가입 중 오류가 발생했습니다: ${err}` };
  }
}

/* ═══════════════════════════════════════════════
   Sign In — direct Supabase auth
   ═══════════════════════════════════════════════ */
export async function signIn(params: {
  email: string;
  password: string;
}): Promise<{ success: boolean; error?: string }> {
  setState({ loading: true });

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: params.email,
      password: params.password,
    });

    if (error) {
      console.error('[authStore] signIn error:', error.message);
      setState({ loading: false });

      // Map Supabase error messages to user-friendly Korean
      if (error.message.includes('Invalid login credentials')) {
        return { success: false, error: '이메일 또는 비밀번호가 올바르지 않습니다.' };
      }
      if (error.message.includes('Email not confirmed')) {
        return { success: false, error: '이메일 인증이 필요합니다.' };
      }
      return { success: false, error: `로그인 실패: ${error.message}` };
    }

    setState({
      user: data.session?.user ?? null,
      session: data.session ?? null,
      loading: false,
    });

    return { success: true };
  } catch (err) {
    console.error('[authStore] signIn unexpected error:', err);
    setState({ loading: false });
    return { success: false, error: `로그인 중 오류가 발생했습니다: ${err}` };
  }
}

/* ═══════════════════════════════════════════════
   Sign Out
   ═══════════════════════════════════════════════ */
export async function signOut(): Promise<void> {
  try {
    await supabase.auth.signOut();
  } catch (err) {
    console.error('[authStore] signOut error:', err);
  }
  setDemoAuthBypassEnabled(false);
  setState({
    user: null,
    session: null,
  });
}

/* ═══════════════════════════════════════════════
   Account Deletion — 서버 API 호출 후 로컬 정리
   ═══════════════════════════════════════════════ */
export async function deleteAccount(): Promise<{ success: boolean; error?: string }> {
  setState({ loading: true });

  try {
    const token = await getFreshAccessToken();
    if (!token) {
      setState({ loading: false });
      return { success: false, error: '로그인 상태가 아닙니다.' };
    }

    const res = await fetch(`${SERVER_BASE}/account`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        apikey: publicAnonKey,
        Authorization: `Bearer ${publicAnonKey}`,
        'x-user-token': token,
      },
    });

    const data = await res.json();
    if (!res.ok) {
      console.error('[authStore] deleteAccount server error:', data.error);
      setState({ loading: false });
      return { success: false, error: data.error || '계정 삭제에 실패했습니다.' };
    }

    // 로컬 Supabase 세션 정리
    try { await supabase.auth.signOut(); } catch { /* ignore */ }

    // 로컬 스토리지 정리
    try {
      localStorage.removeItem('connection_contacts');
      localStorage.removeItem('connection_custom_relationships');
      localStorage.removeItem('connection_hidden_relationships');
      localStorage.removeItem('keppin_auto_messages');
      localStorage.removeItem('keppin_sent_messages');
      localStorage.removeItem('keppin_onboarding_complete');
      localStorage.removeItem('keppin_notif_settings');
      localStorage.removeItem('keppin_interaction_logs');
    } catch { /* ignore */ }
    setDemoAuthBypassEnabled(false);

    setState({
      user: null,
      session: null,
      loading: false,
    });

    console.log('[authStore] Account deleted and local data cleaned');
    return { success: true };
  } catch (err) {
    console.error('[authStore] deleteAccount unexpected error:', err);
    setState({ loading: false });
    return { success: false, error: `계정 삭제 중 오류가 발생했습니다: ${err}` };
  }
}

/* ═══════════════════════════════════════════════
   Social Login (OAuth) — Google, Kakao
   ═══════════════════════════════════════════════ */
export async function signInWithOAuth(provider: 'google' | 'kakao'): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: window.location.origin + '/app',
      },
    });

    if (error) {
      console.error(`[authStore] OAuth (${provider}) error:`, error.message);
      if (error.message.includes('provider is not enabled')) {
        return { success: false, error: `${provider} 로그인이 아직 활성화되지 않았습니다. Supabase 대시보드에서 설정이 필요합니다.` };
      }
      return { success: false, error: `소셜 로그인 실패: ${error.message}` };
    }

    // OAuth redirects the browser, so this code only runs if no redirect happened
    return { success: true };
  } catch (err) {
    console.error(`[authStore] OAuth (${provider}) unexpected error:`, err);
    return { success: false, error: `소셜 로그인 중 오류가 발생했습니다: ${err}` };
  }
}

/* ═══════════════════════════════════════════════
   Password Reset — send email
   ═══════════════════════════════════════════════ */
export async function resetPasswordForEmail(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/forgot-password',
    });

    if (error) {
      console.error('[authStore] resetPasswordForEmail error:', error.message);
      return { success: false, error: `비밀번호 재설정 이메일 전송 실패: ${error.message}` };
    }

    return { success: true };
  } catch (err) {
    console.error('[authStore] resetPasswordForEmail unexpected error:', err);
    return { success: false, error: `비밀번호 재설정 중 오류가 발생했습니다: ${err}` };
  }
}

/* ═══════════════════════════════════════════════
   Update Password — after recovery
   ═══════════════════════════════════════════════ */
export async function updatePassword(newPassword: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      console.error('[authStore] updatePassword error:', error.message);
      return { success: false, error: `비밀번호 변경 실패: ${error.message}` };
    }

    return { success: true };
  } catch (err) {
    console.error('[authStore] updatePassword unexpected error:', err);
    return { success: false, error: `비밀번호 변경 중 오류가 발생했습니다: ${err}` };
  }
}

/* ═══════════════════════════════════════════════
   Getters
   ═══════════════════════════════════════════════ */
export function getAccessToken(): string | null {
  return _state.session?.access_token ?? null;
}

/**
 * 항상 최신 세션에서 access_token을 가져옵니다.
 * - initAuth()가 완료될 때까지 대기 (race condition 방지)
 * - expires_at 누락 / 만료 임박 시 강제 갱신
 */
export async function getFreshAccessToken(): Promise<string | null> {
  try {
    // initAuth()가 아직 진행 중이면 완료될 때까지 대기
    if (_initPromise) await _initPromise;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;

    // getSession()은 만료된 토큰을 갱신하지 않으므로 수동 체크
    const expiresAt = session.expires_at; // UNIX timestamp (seconds)
    const now = Math.floor(Date.now() / 1000);

    // expires_at가 없거나 만료 5분 전이면 강제 갱신 (버퍼 확대)
    if (!expiresAt || expiresAt - now < 300) {
      const { data: { session: refreshed }, error } = await supabase.auth.refreshSession();
      if (error || !refreshed) {
        console.warn('[authStore] refreshSession failed:', error?.message);
        return null;
      }
      setState({ session: refreshed, user: refreshed.user });
      return refreshed.access_token;
    }

    // 스토어에도 반영
    if (session.access_token !== _state.session?.access_token) {
      setState({ session, user: session.user });
    }
    return session.access_token;
  } catch {
    return null;
  }
}

/**
 * 401 자동 재시도 포함 인증 fetch 헬퍼.
 * - Authorization 헤더에는 anon key를 넣어 Edge Function 런타임 JWT 검증 통과
 * - x-user-token 헤더에 실제 사용자 JWT를 넣어 서버 코드에서 사용자 식별
 * - 첫 시도에서 401이 오면 토큰을 강제 갱신 후 1회 재시도
 */
export async function authenticatedFetch(
  url: string,
  options: RequestInit = {},
): Promise<Response> {
  const token = await getFreshAccessToken();
  if (!token) return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401 });

  const makeHeaders = (t: string): HeadersInit => ({
    ...(options.headers as Record<string, string> ?? {}),
    apikey: publicAnonKey,
    Authorization: `Bearer ${publicAnonKey}`,
    'x-user-token': t,
  });

  let res = await fetch(url, { ...options, headers: makeHeaders(token) });

  // 401 → 토큰 강제 갱신 후 1회 재시도
  if (res.status === 401) {
    console.warn('[authStore] authenticatedFetch 401 — refreshing token and retrying');
    const { data: { session: refreshed }, error } = await supabase.auth.refreshSession();
    if (error || !refreshed) {
      console.warn('[authStore] retry refresh failed:', error?.message);
      return res;
    }
    setState({ session: refreshed, user: refreshed.user });
    res = await fetch(url, { ...options, headers: makeHeaders(refreshed.access_token) });
  }

  return res;
}

export function isAuthenticated(): boolean {
  return _state.user !== null || isDemoAuthBypassEnabled();
}

/* ═══════════════════════════════════════════════
   React Hook — useSyncExternalStore
   ═══════════════════════════════════════════════ */
function subscribe(listener: Listener) {
  _listeners.add(listener);
  return () => { _listeners.delete(listener); };
}

function getSnapshot(): AuthState {
  return _state;
}

export function useAuth(): AuthState {
  return useSyncExternalStore(subscribe, getSnapshot);
}
