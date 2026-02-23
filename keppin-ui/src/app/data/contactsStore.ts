/**
 * contactsStore.ts
 * ────────────────────────────────────────────────
 * useSyncExternalStore 기반 반응형 연락처 스토어.
 * 런타임 메모리 + localStorage 영속화 + KV Store 서버 동기화.
 * 커스텀 관계 타입도 함께 관리.
 *
 * 전략 (offline-first):
 *  1) localStorage는 항상 즉시 읽기/쓰기 (오프라인 가능)
 *  2) 인증 사용자가 있으면 변경 시 KV Store에 debounced 백그라운드 동기화
 *  3) 로그인 시 pullFromServer() → 서버 데이터를 로컬에 병합
 */
import { useSyncExternalStore } from 'react';
import type { Contact, Relationship, Closeness, FamilyStatus } from './contacts';
import { contacts as INITIAL_CONTACTS, RELATIONSHIP_COLORS } from './contacts';
import { authenticatedFetch } from './authStore';
import { projectId } from '/utils/supabase/info';

/* ═══════════════════════════════════════════════
   서버 동기화 설정
   ═══════════════════════════════════════════════ */
const SERVER_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-0984a125`;

/* ═══════════════════════════════════════════════
   localStorage 키
   ═══════════════════════════════════════════════ */
const LS_CONTACTS_KEY = 'connection_contacts';
const LS_CUSTOM_REL_KEY = 'connection_custom_relationships';
const LS_HIDDEN_REL_KEY = 'connection_hidden_relationships';

/* ═══════════════════════════════════════════════
   기본 관계 옵션 (삭제 불가)
   ═══════════════════════════════════════════════ */
export const DEFAULT_RELATIONSHIP_OPTIONS: { value: Relationship; color: string }[] = [
  { value: '가족', color: '#171717' },
  { value: '친구', color: '#171717' },
  { value: '직장 동료', color: '#171717' },
  { value: '학교', color: '#171717' },
  { value: '군대', color: '#171717' },
];

const CUSTOM_COLORS = [
  '#333333', '#4A4A4A', '#5C5C5C', '#6E6E6E', '#808080',
  '#3D3D3D', '#525252', '#666666', '#787878', '#8F8F8F',
];

/* ═══════════════════════════════════════════════
   내부 상태
   ═══════════════════════════════════════════════ */
type Listener = () => void;

let _contacts: Contact[] = loadContacts();
let _customRelationships: { value: string; color: string }[] = loadCustomRelationships();
let _hiddenDefaults: string[] = loadHiddenDefaults();
let _listeners = new Set<Listener>();
let _relListeners = new Set<Listener>();

function loadContacts(): Contact[] {
  try {
    const stored = localStorage.getItem(LS_CONTACTS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Contact[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch { /* ignore */ }
  return [...INITIAL_CONTACTS];
}

function loadCustomRelationships(): { value: string; color: string }[] {
  try {
    const stored = localStorage.getItem(LS_CUSTOM_REL_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch { /* ignore */ }
  return [];
}

function loadHiddenDefaults(): string[] {
  try {
    const stored = localStorage.getItem(LS_HIDDEN_REL_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch { /* ignore */ }
  return [];
}

function persistContacts() {
  try {
    localStorage.setItem(LS_CONTACTS_KEY, JSON.stringify(_contacts));
  } catch { /* quota exceeded — 무시 */ }
  scheduleSyncContacts();
}

function persistCustomRelationships() {
  try {
    localStorage.setItem(LS_CUSTOM_REL_KEY, JSON.stringify(_customRelationships));
  } catch { /* ignore */ }
  scheduleSyncRelationships();
}

function persistHiddenDefaults() {
  try {
    localStorage.setItem(LS_HIDDEN_REL_KEY, JSON.stringify(_hiddenDefaults));
  } catch { /* ignore */ }
  scheduleSyncRelationships();
}

function emitContacts() {
  _listeners.forEach((l) => l());
}

function emitRelationships() {
  _relListeners.forEach((l) => l());
}

/* ═══════════════════════════════════════════════
   서버 동기화 (debounced background sync)
   ═══════════════════════════════════════════════ */
let _contactsSyncTimer: ReturnType<typeof setTimeout> | null = null;
let _relSyncTimer: ReturnType<typeof setTimeout> | null = null;
let _syncInProgress = false;
let _contactsDirty = false;
let _relsDirty = false;

/* 온라인 복귀 시 dirty 데이터 자동 재동기화 */
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    if (_contactsDirty) {
      console.log('[contactsStore] Online restored — syncing dirty contacts');
      scheduleSyncContacts();
    }
    if (_relsDirty) {
      console.log('[contactsStore] Online restored — syncing dirty relationships');
      scheduleSyncRelationships();
    }
  });
}

function scheduleSyncContacts() {
  _contactsDirty = true;
  if (_contactsSyncTimer) clearTimeout(_contactsSyncTimer);
  _contactsSyncTimer = setTimeout(() => {
    syncContactsToServer();
  }, 1500); // 1.5초 debounce
}

function scheduleSyncRelationships() {
  _relsDirty = true;
  if (_relSyncTimer) clearTimeout(_relSyncTimer);
  _relSyncTimer = setTimeout(() => {
    syncRelationshipsToServer();
  }, 1500);
}

async function syncContactsToServer() {
  try {
    const res = await authenticatedFetch(`${SERVER_BASE}/contacts`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contacts: _contacts }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      console.warn('[contactsStore] syncContacts failed:', data.error || res.statusText);
    } else {
      _contactsDirty = false;
      console.log('[contactsStore] Contacts synced to server');
    }
  } catch (err) {
    console.warn('[contactsStore] syncContacts network error:', err);
  }
}

async function syncRelationshipsToServer() {
  try {
    const res = await authenticatedFetch(`${SERVER_BASE}/custom-relationships`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customRelationships: _customRelationships,
        hiddenDefaults: _hiddenDefaults,
      }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      console.warn('[contactsStore] syncRelationships failed:', data.error || res.statusText);
    } else {
      _relsDirty = false;
      console.log('[contactsStore] Relationships synced to server');
    }
  } catch (err) {
    console.warn('[contactsStore] syncRelationships network error:', err);
  }
}

/**
 * 서버에서 연락처 Pull — 로그인 직후 호출.
 * 서버에 데이터가 있으면 로컬을 대체, 없으면 로컬을 서버에 Push.
 */
export async function pullFromServer(): Promise<void> {
  if (_syncInProgress) return;
  _syncInProgress = true;

  try {
    // 1) 연락처 Pull
    const contactsRes = await authenticatedFetch(`${SERVER_BASE}/contacts`);
    if (contactsRes.ok) {
      const { contacts } = await contactsRes.json();
      if (Array.isArray(contacts) && contacts.length > 0) {
        // 서버에 데이터 존재 → 로컬 교체
        _contacts = contacts;
        try { localStorage.setItem(LS_CONTACTS_KEY, JSON.stringify(_contacts)); } catch { /* ignore */ }
        emitContacts();
        console.log(`[contactsStore] Pulled ${contacts.length} contacts from server`);
      } else {
        // 서버 비어있고 로컬에 데이터 있으면 Push
        if (_contacts.length > 0) {
          await syncContactsToServer();
          console.log('[contactsStore] Pushed local contacts to empty server');
        }
      }
    }

    // 2) 관계 타입 Pull
    const relsRes = await authenticatedFetch(`${SERVER_BASE}/custom-relationships`);
    if (relsRes.ok) {
      const { customRelationships, hiddenDefaults } = await relsRes.json();
      if (Array.isArray(customRelationships) && customRelationships.length > 0) {
        _customRelationships = customRelationships;
        _hiddenDefaults = Array.isArray(hiddenDefaults) ? hiddenDefaults : [];
        try {
          localStorage.setItem(LS_CUSTOM_REL_KEY, JSON.stringify(_customRelationships));
          localStorage.setItem(LS_HIDDEN_REL_KEY, JSON.stringify(_hiddenDefaults));
        } catch { /* ignore */ }
        emitRelationships();
        console.log('[contactsStore] Pulled custom relationships from server');
      } else {
        // 서버 비어있으면 로컬 Push
        if (_customRelationships.length > 0 || _hiddenDefaults.length > 0) {
          await syncRelationshipsToServer();
          console.log('[contactsStore] Pushed local relationships to empty server');
        }
      }
    }
  } catch (err) {
    console.warn('[contactsStore] pullFromServer error:', err);
  } finally {
    _syncInProgress = false;
  }
}

/* ═══════════════════════════════════════════════
   헬퍼: 나이 / D-Day / 연락 갭 재계산
   ═══════════════════════════════════════════════ */
function getDday(birthday: string): number {
  const today = new Date();
  const bday = new Date(birthday);
  const thisYear = today.getFullYear();
  let nextBirthday = new Date(thisYear, bday.getMonth(), bday.getDate());
  if (nextBirthday < today) {
    nextBirthday = new Date(thisYear + 1, bday.getMonth(), bday.getDate());
  }
  return Math.ceil((nextBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function getContactGap(lastContact: string): number {
  const today = new Date();
  const last = new Date(lastContact);
  return Math.floor((today.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
}

function getAge(birthday: string): number {
  const today = new Date();
  const bday = new Date(birthday);
  return today.getFullYear() - bday.getFullYear() + 1;
}

/* ═══════════════════════════════════════════════
   공개 API — 연락처 CRUD
   ═══════════════════════════════════════════════ */

/** 새 연락처 추가 */
export function addContact(data: {
  name: string;
  phone?: string;
  birthday?: string;
  birthdayUnknown?: boolean;
  relationship: string;
  closeness: Closeness | string;
  familyStatus?: FamilyStatus | string;
  memo?: string;
  profileImage?: string | null;
  lastContact?: string; // YYYY-MM-DD or YYYY.MM.DD — optional, defaults to today
}): Contact {
  const AVATAR_COLORS = [
    '#2D2D2D', '#525252', '#737373', '#8A8A8A', '#A3A3A3',
    '#3D3D3D', '#5C5C5C', '#666666', '#999999', '#B0B0B0',
  ];

  const id = `c_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  // lastContact 파싱: "YYYY.MM.DD" → "YYYY-MM-DD"
  const lastContactDate = data.lastContact
    ? data.lastContact.replace(/\./g, '-')
    : today;

  // 생년월일 파싱: "YYYY.MM.DD" → "YYYY-MM-DD"
  const bdayISO = data.birthday
    ? data.birthday.replace(/\./g, '-')
    : '2000-01-01';

  const newContact: Contact = {
    id,
    name: data.name,
    relationship: data.relationship as Relationship,
    age: getAge(bdayISO),
    birthday: bdayISO,
    birthdayDday: getDday(bdayISO),
    birthdayUnknown: data.birthdayUnknown || false,
    lastContact: lastContactDate,
    contactGap: getContactGap(lastContactDate),
    birthdayGiftDone: false,
    familyStatus: (data.familyStatus || '기타/모름') as FamilyStatus,
    closeness: (data.closeness || '보통') as Closeness,
    memo: data.memo || '',
    phone: data.phone || undefined,
    avatarColor: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
  };

  _contacts = [newContact, ..._contacts];
  persistContacts();
  emitContacts();
  return newContact;
}

/** 연락처 삭제 */
export function removeContact(id: string) {
  _contacts = _contacts.filter((c) => c.id !== id);
  persistContacts();
  emitContacts();
}

/** 연락처 수정 */
export function updateContact(id: string, data: Partial<{
  name: string;
  phone: string;
  birthday: string;
  birthdayUnknown: boolean;
  relationship: string;
  closeness: string;
  familyStatus: string;
  memo: string;
  profileImage: string | null;
  lastContact: string;
  isFavorite: boolean;
  groupIds: string[];
}>): Contact | null {
  const index = _contacts.findIndex((c) => c.id === id);
  if (index === -1) return null;

  const existing = _contacts[index];
  const bdayISO = data.birthday
    ? data.birthday.replace(/\./g, '-')
    : existing.birthday;

  const lastContactISO = data.lastContact
    ? data.lastContact.replace(/\./g, '-')
    : existing.lastContact;

  const updated: Contact = {
    ...existing,
    ...(data.name !== undefined && { name: data.name }),
    ...(data.phone !== undefined && { phone: data.phone || undefined }),
    ...(data.relationship !== undefined && { relationship: data.relationship as Relationship }),
    ...(data.closeness !== undefined && { closeness: data.closeness as Closeness }),
    ...(data.familyStatus !== undefined && { familyStatus: data.familyStatus as FamilyStatus }),
    ...(data.memo !== undefined && { memo: data.memo }),
    ...(data.birthdayUnknown !== undefined && { birthdayUnknown: data.birthdayUnknown }),
    ...(data.isFavorite !== undefined && { isFavorite: data.isFavorite }),
    ...(data.groupIds !== undefined && { groupIds: data.groupIds }),
    birthday: bdayISO,
    age: getAge(bdayISO),
    birthdayDday: getDday(bdayISO),
    lastContact: lastContactISO,
    contactGap: getContactGap(lastContactISO),
  };

  _contacts = [..._contacts];
  _contacts[index] = updated;
  persistContacts();
  emitContacts();
  return updated;
}

/** ID로 연락처 조회 */
export function getContactByIdFromStore(id: string): Contact | undefined {
  return _contacts.find((c) => c.id === id);
}

/* ═══════════════════════════════════════════════
   공개 API — 커스텀 관계 관리
   ═══════════════════════════════════════════════ */

export function addCustomRelationship(name: string): boolean {
  const trimmed = name.trim();
  if (!trimmed) return false;

  // 중복 체크 (기본 + 커스텀)
  const allNames = [
    ...DEFAULT_RELATIONSHIP_OPTIONS.map((r) => r.value),
    ..._customRelationships.map((r) => r.value),
  ];
  if (allNames.includes(trimmed)) return false;

  const color = CUSTOM_COLORS[_customRelationships.length % CUSTOM_COLORS.length];
  _customRelationships = [..._customRelationships, { value: trimmed, color }];
  persistCustomRelationships();
  emitRelationships();
  return true;
}

export function removeCustomRelationship(name: string) {
  _customRelationships = _customRelationships.filter((r) => r.value !== name);
  persistCustomRelationships();
  emitRelationships();
}

/** 기본 관계 옵션 숨기기 */
export function hideDefaultRelationship(name: string) {
  if (_hiddenDefaults.includes(name)) return;
  _hiddenDefaults = [..._hiddenDefaults, name];
  persistHiddenDefaults();
  emitRelationships();
}

/** 기본 관계 옵션 숨기기 해제 */
export function unhideDefaultRelationship(name: string) {
  _hiddenDefaults = _hiddenDefaults.filter((n) => n !== name);
  persistHiddenDefaults();
  emitRelationships();
}

/** 기본 + 커스텀 관계 옵션 전체 반환 (숨긴 기본 관계 제외) */
export function getAllRelationshipOptions(): { value: string; color: string; isCustom: boolean }[] {
  return [
    ...DEFAULT_RELATIONSHIP_OPTIONS
      .filter((r) => !_hiddenDefaults.includes(r.value))
      .map((r) => ({ ...r, isCustom: false })),
    ..._customRelationships.map((r) => ({ ...r, isCustom: true })),
  ];
}

/** 모든 관계 옵션 (숨긴 것 포함 — 필터 등에서 사용) */
export function getAllRelationshipTypes(): { value: string; color: string; isCustom: boolean }[] {
  return [
    ...DEFAULT_RELATIONSHIP_OPTIONS.map((r) => ({ ...r, isCustom: false })),
    ..._customRelationships.map((r) => ({ ...r, isCustom: true })),
  ];
}

/** 관계 이름 → 색상 반환 (아바타 등에서 사용) — 무채색 통일 */
export function getRelationshipColor(_relationship: string): string {
  return '#616161';
}

/* ═══════════════════════════════════════════════
   공개 API — 즐겨찾기 / 그룹
   ═══════════════════════════════════════════════ */

/** 즐겨찾기 토글 */
export function toggleFavorite(id: string): boolean {
  const index = _contacts.findIndex((c) => c.id === id);
  if (index === -1) return false;
  const current = _contacts[index].isFavorite ?? false;
  _contacts = [..._contacts];
  _contacts[index] = { ..._contacts[index], isFavorite: !current };
  persistContacts();
  emitContacts();
  return !current;
}

/** 연락처에 그룹 할당 */
export function setContactGroups(contactId: string, groupIds: string[]) {
  const index = _contacts.findIndex((c) => c.id === contactId);
  if (index === -1) return;
  _contacts = [..._contacts];
  _contacts[index] = { ..._contacts[index], groupIds };
  persistContacts();
  emitContacts();
}

/** 연락처에 태그 할당 */
export function setContactTags(contactId: string, tagIds: string[]) {
  const index = _contacts.findIndex((c) => c.id === contactId);
  if (index === -1) return;
  _contacts = [..._contacts];
  _contacts[index] = { ..._contacts[index], tags: tagIds };
  persistContacts();
  emitContacts();
}

/** 특정 태그가 삭제될 때 모든 연락처에서 해당 tagId 제거 */
export function removeTagFromAllContacts(tagId: string) {
  let changed = false;
  _contacts = _contacts.map((c) => {
    if (c.tags?.includes(tagId)) {
      changed = true;
      return { ...c, tags: c.tags.filter((t) => t !== tagId) };
    }
    return c;
  });
  if (changed) {
    persistContacts();
    emitContacts();
  }
}

/** 특정 그룹이 삭제될 때 모든 연락처에서 해당 groupId 제거 */
export function removeGroupFromAllContacts(groupId: string) {
  let changed = false;
  _contacts = _contacts.map((c) => {
    if (c.groupIds?.includes(groupId)) {
      changed = true;
      return { ...c, groupIds: c.groupIds.filter((g) => g !== groupId) };
    }
    return c;
  });
  if (changed) {
    persistContacts();
    emitContacts();
  }
}

/* ═══════════════════════════════════════════════
   공개 API — 조회 함수 (반응형)
   ═══════════════════════════════════════════════ */

export function getUpcomingBirthdaysFromStore(days: number = 30): Contact[] {
  return _contacts
    .filter((c) => c.birthdayDday <= days && c.birthdayDday >= 0)
    .sort((a, b) => a.birthdayDday - b.birthdayDday);
}

export function getContactsNeedingAttentionFromStore(days: number = 30): Contact[] {
  return _contacts
    .filter((c) => c.contactGap >= days)
    .sort((a, b) => b.contactGap - a.contactGap);
}

export function getRelationshipColorsFromStore(): Record<string, string> {
  const base = { ...RELATIONSHIP_COLORS };
  _customRelationships.forEach((r) => {
    base[r.value as Relationship] = r.color;
  });
  return base;
}

/* ═══════════════════════════════════════════════
   React Hooks — useSyncExternalStore
   ═══════════════════════════════════════════════ */

function subscribeContacts(listener: Listener) {
  _listeners.add(listener);
  return () => { _listeners.delete(listener); };
}

function getSnapshotContacts() {
  return _contacts;
}

function subscribeRelationships(listener: Listener) {
  _relListeners.add(listener);
  return () => { _relListeners.delete(listener); };
}

function getSnapshotRelationships() {
  return _customRelationships;
}

/** 반응형 연락처 배열 훅 */
export function useContacts(): Contact[] {
  return useSyncExternalStore(subscribeContacts, getSnapshotContacts);
}

/** 반응형 커스텀 관계 옵션 훅 */
export function useCustomRelationships(): { value: string; color: string }[] {
  return useSyncExternalStore(subscribeRelationships, getSnapshotRelationships);
}

/** 숨긴 기본 관계 목록 조회 (비반응형) */
export function getHiddenDefaults(): string[] {
  return [..._hiddenDefaults];
}

/** 모든 숨긴 기본 관계 일괄 복원 */
export function restoreAllHiddenDefaults() {
  _hiddenDefaults = [];
  persistHiddenDefaults();
  emitRelationships();
}

/** 로그아웃 시 로컬 상태 + localStorage 초기화 */
export function resetContactsStore() {
  // 동기화 타이머 정리
  if (_contactsSyncTimer) { clearTimeout(_contactsSyncTimer); _contactsSyncTimer = null; }
  if (_relSyncTimer) { clearTimeout(_relSyncTimer); _relSyncTimer = null; }
  _contactsDirty = false;
  _relsDirty = false;
  _syncInProgress = false;

  // 상태 초기화 (빈 배열 — 다음 로그인 시 pullFromServer가 채움)
  _contacts = [];
  _customRelationships = [];
  _hiddenDefaults = [];

  // localStorage 정리
  try {
    localStorage.removeItem(LS_CONTACTS_KEY);
    localStorage.removeItem(LS_CUSTOM_REL_KEY);
    localStorage.removeItem(LS_HIDDEN_REL_KEY);
  } catch { /* ignore */ }

  emitContacts();
  emitRelationships();
}

/* ═══════════════════════════════════════════════
   공개 API — 연락처 병합 (중복 감지 기능)
   ═══════════════════════════════════════════════ */

/**
 * 두 연락처를 병합합니다.
 * primaryId 연락처에 선택된 필드 값을 적용하고,
 * secondaryId 연락처는 삭제합니다.
 * 그룹·태그·상호작용 로그는 합집합으로 병합됩니다.
 */
export function mergeContacts(
  primaryId: string,
  secondaryId: string,
  mergedFields: Partial<{
    name: string;
    phone: string;
    birthday: string;
    birthdayUnknown: boolean;
    relationship: string;
    closeness: string;
    familyStatus: string;
    memo: string;
    lastContact: string;
    isFavorite: boolean;
  }>,
): Contact | null {
  const primaryIdx = _contacts.findIndex((c) => c.id === primaryId);
  const secondaryIdx = _contacts.findIndex((c) => c.id === secondaryId);
  if (primaryIdx === -1 || secondaryIdx === -1) return null;

  const primary = _contacts[primaryIdx];
  const secondary = _contacts[secondaryIdx];

  // 그룹 합집합
  const mergedGroupIds = [
    ...new Set([...(primary.groupIds ?? []), ...(secondary.groupIds ?? [])]),
  ];

  // 태그 합집합
  const mergedTags = [
    ...new Set([...(primary.tags ?? []), ...(secondary.tags ?? [])]),
  ];

  const bdayISO = (mergedFields.birthday ?? primary.birthday).replace(/\./g, '-');
  const lastContactISO = (mergedFields.lastContact ?? primary.lastContact).replace(/\./g, '-');

  const merged: Contact = {
    ...primary,
    ...mergedFields,
    birthday: bdayISO,
    age: getAge(bdayISO),
    birthdayDday: getDday(bdayISO),
    lastContact: lastContactISO,
    contactGap: getContactGap(lastContactISO),
    groupIds: mergedGroupIds,
    tags: mergedTags,
  };

  // primary 갱신 + secondary 삭제
  _contacts = _contacts
    .map((c) => (c.id === primaryId ? merged : c))
    .filter((c) => c.id !== secondaryId);

  persistContacts();
  emitContacts();

  console.log(`[contactsStore] Merged "${secondary.name}" into "${merged.name}"`);
  return merged;
}

/* ═══════════════════════════════════════════════
   공개 API — 일괄 가져오기 (CSV Import)
   ═══════════════════════════════════════════════ */

/**
 * 여러 연락처를 한 번에 추가합니다.
 * 각 항목에 대해 ID를 자동 생성하고, 날짜 필드를 재계산합니다.
 * @returns 추가된 연락처 수
 */
export function bulkAddContacts(items: Array<{
  name: string;
  phone?: string;
  birthday?: string;
  birthdayUnknown?: boolean;
  relationship: string;
  closeness: string;
  familyStatus?: string;
  memo?: string;
  lastContact?: string;
}>): number {
  const AVATAR_COLORS = [
    '#2D2D2D', '#525252', '#737373', '#8A8A8A', '#A3A3A3',
    '#3D3D3D', '#5C5C5C', '#666666', '#999999', '#B0B0B0',
  ];

  const today = new Date().toISOString().split('T')[0];
  const newContacts: Contact[] = items.map((data, i) => {
    const id = `c_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 6)}`;
    const bdayISO = data.birthday ? data.birthday.replace(/\./g, '-') : '2000-01-01';
    const lastContactISO = data.lastContact ? data.lastContact.replace(/\./g, '-') : today;

    return {
      id,
      name: data.name,
      relationship: (data.relationship || '친구') as Relationship,
      age: getAge(bdayISO),
      birthday: bdayISO,
      birthdayDday: getDday(bdayISO),
      birthdayUnknown: data.birthdayUnknown || !data.birthday,
      lastContact: lastContactISO,
      contactGap: getContactGap(lastContactISO),
      birthdayGiftDone: false,
      familyStatus: (data.familyStatus || '기타/모름') as FamilyStatus,
      closeness: (data.closeness || '보통') as Closeness,
      memo: data.memo || '',
      phone: data.phone || undefined,
      avatarColor: AVATAR_COLORS[(i + _contacts.length) % AVATAR_COLORS.length],
    };
  });

  _contacts = [...newContacts, ..._contacts];
  persistContacts();
  emitContacts();
  console.log(`[contactsStore] Bulk added ${newContacts.length} contacts`);
  return newContacts.length;
}