/**
 * profileStore.ts
 * ────────────────────────────────────────────────
 * 프로필 상태를 중앙에서 관리하는 스토어.
 * localStorage 캐시 + Supabase 서버 동기화 + signed URL 갱신.
 * useSyncExternalStore 패턴으로 React에 반응형 제공.
 */
import { useSyncExternalStore } from 'react';
import { getFreshAccessToken, authenticatedFetch } from './authStore';
import { projectId } from '/utils/supabase/info';

const SERVER_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-0984a125`;
const LS_PROFILE_KEY = 'connection_profile';
const LS_URL_EXPIRY_KEY = 'connection_profile_url_expiry';

/* 1시간 signed URL 유효 → 50분 뒤 갱신 */
const URL_REFRESH_BUFFER_MS = 50 * 60 * 1000;

/* ═══════════════════════════════════════════════
   Profile interface
   ═══════════════════════════════════════════════ */
export interface Profile {
  name: string;
  email: string;
  statusMessage: string;
  profileImage: string | null; // signed URL or legacy base64
}

const DEFAULT_PROFILE: Profile = {
  name: '사용자',
  email: 'user@example.com',
  statusMessage: '',
  profileImage: null,
};

/* ═══════════════════════════════════════════════
   Internal state
   ═══════════════════════════════════════════════ */
let _profile: Profile = loadFromLS();
let _urlExpiry: number = loadExpiryFromLS();
let _fetching = false;

type Listener = () => void;
const _listeners = new Set<Listener>();

function emit() {
  _listeners.forEach((l) => l());
}

/* ═══════════════════════════════════════════════
   LocalStorage helpers
   ═══════════════════════════════════════════════ */
function loadFromLS(): Profile {
  try {
    const raw = localStorage.getItem(LS_PROFILE_KEY);
    if (raw) return { ...DEFAULT_PROFILE, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return { ...DEFAULT_PROFILE };
}

function saveToLS(profile: Profile) {
  try {
    localStorage.setItem(LS_PROFILE_KEY, JSON.stringify(profile));
  } catch { /* ignore */ }
}

function loadExpiryFromLS(): number {
  try {
    const raw = localStorage.getItem(LS_URL_EXPIRY_KEY);
    return raw ? Number(raw) : 0;
  } catch { return 0; }
}

function saveExpiryToLS(ts: number) {
  try {
    localStorage.setItem(LS_URL_EXPIRY_KEY, String(ts));
  } catch { /* ignore */ }
}

/* ═══════════════════════════════════════════════
   Server fetch — signed URL 갱신 포함
   ═══════════════════════════════════════════════ */
async function fetchServerProfile(): Promise<Partial<Profile> | null> {
  try {
    const res = await authenticatedFetch(`${SERVER_BASE}/profile`);
    if (!res.ok) return null;
    const data = await res.json();
    const p = data.profile;
    return {
      name: p.name ?? undefined,
      email: p.email ?? undefined,
      statusMessage: p.statusMessage ?? undefined,
      profileImage: p.profileImageUrl ?? p.profileImage ?? null,
    };
  } catch (err) {
    console.warn('[profileStore] fetchServerProfile error:', err);
    return null;
  }
}

/* ═══════════════════════════════════════════════
   Public API
   ═══════════════════════════════════════════════ */

/** 프로필 읽기 (snapshot) */
export function getProfile(): Profile {
  return _profile;
}

/** 프로필 필드 설정 (로컬) */
export function setProfileField<K extends keyof Profile>(key: K, value: Profile[K]) {
  _profile = { ..._profile, [key]: value };
  saveToLS(_profile);
  emit();
}

/** 프로필 전체 업데이트 */
export function setProfile(profile: Profile) {
  _profile = { ...profile };
  saveToLS(_profile);
  emit();
}

/** 프로필을 서버에 저장 (name, statusMessage만 — 이미지는 별도 API) */
export async function syncProfileToServer() {
  authenticatedFetch(`${SERVER_BASE}/profile`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: _profile.name,
      statusMessage: _profile.statusMessage,
    }),
  }).catch((err) => console.warn('[profileStore] server sync error:', err));
}

/**
 * 서버에서 프로필 가져와서 로컬 갱신.
 * signed URL 만료됐거나 강제 갱신 시 호출.
 */
export async function refreshFromServer(force = false): Promise<void> {
  if (_fetching) return;

  // URL이 아직 유효하고 force가 아니면 스킵
  const now = Date.now();
  if (!force && _urlExpiry > 0 && now < _urlExpiry) return;

  _fetching = true;
  try {
    const serverData = await fetchServerProfile();
    if (serverData) {
      _profile = {
        ..._profile,
        name: serverData.name || _profile.name,
        email: serverData.email || _profile.email,
        statusMessage: serverData.statusMessage ?? _profile.statusMessage,
        profileImage: serverData.profileImage ?? _profile.profileImage,
      };

      // signed URL을 받았으면 만료 시간 설정 (현재 + 50분)
      if (serverData.profileImage && !serverData.profileImage.startsWith('data:')) {
        _urlExpiry = Date.now() + URL_REFRESH_BUFFER_MS;
        saveExpiryToLS(_urlExpiry);
      }

      saveToLS(_profile);
      emit();
    }
  } finally {
    _fetching = false;
  }
}

/** 아바타 업로드 */
export async function uploadAvatar(file: File): Promise<{ success: boolean; error?: string }> {
  const token = await getFreshAccessToken();
  if (!token) return { success: false, error: '로그인이 필요합니다' };

  if (file.size > 5 * 1024 * 1024) {
    return { success: false, error: '5MB 이하의 이미지만 사용할 수 있어요' };
  }

  try {
    const formData = new FormData();
    formData.append('avatar', file);

    const res = await authenticatedFetch(`${SERVER_BASE}/profile/avatar`, {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || '이미지 업로드에 실패했어요' };
    }

    if (data.profileImageUrl) {
      _profile = { ..._profile, profileImage: data.profileImageUrl };
      _urlExpiry = Date.now() + URL_REFRESH_BUFFER_MS;
      saveExpiryToLS(_urlExpiry);
      saveToLS(_profile);
      emit();
    }

    return { success: true };
  } catch (err) {
    console.error('[profileStore] uploadAvatar error:', err);
    return { success: false, error: '이미지 업로드 중 오류가 발생했어요' };
  }
}

/** 아바타 삭제 */
export async function deleteAvatar(): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await authenticatedFetch(`${SERVER_BASE}/profile/avatar`, {
      method: 'DELETE',
    });

    if (!res.ok) {
      const data = await res.json();
      return { success: false, error: data.error || '이미지 삭제에 실패했어요' };
    }

    _profile = { ..._profile, profileImage: null };
    _urlExpiry = 0;
    saveExpiryToLS(0);
    saveToLS(_profile);
    emit();

    return { success: true };
  } catch (err) {
    console.error('[profileStore] deleteAvatar error:', err);
    return { success: false, error: '이미지 삭제 중 오류가 발생했어요' };
  }
}

/** 로컬 프로필 초기화 (로그아웃 시) */
export function clearProfile() {
  _profile = { ...DEFAULT_PROFILE };
  _urlExpiry = 0;
  try {
    localStorage.removeItem(LS_PROFILE_KEY);
    localStorage.removeItem(LS_URL_EXPIRY_KEY);
  } catch { /* ignore */ }
  emit();
}

/* ═══════════════════════════════════════════════
   React Hook — useSyncExternalStore
   ═══════════════════════════════════════════════ */
function subscribe(listener: Listener) {
  _listeners.add(listener);
  return () => { _listeners.delete(listener); };
}

function getSnapshot(): Profile {
  return _profile;
}

/** 프로필 훅 — 마운트 시 서버 갱신도 트리거 */
export function useProfile(): Profile {
  return useSyncExternalStore(subscribe, getSnapshot);
}