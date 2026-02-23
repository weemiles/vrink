/**
 * duplicateDetector.ts
 * ────────────────────────────────────────────────
 * 연락처 중복 감지 알고리즘.
 *
 * 감지 전략:
 *  1) 전화번호 정규화 후 일치
 *  2) 이름 유사도 (Levenshtein / 초성 유사도)
 *  3) 이름 유사 + 생년월일 일치
 *
 * 결과: DuplicateGroup[] — 중복 가능성이 있는 연락처 묶음
 */
import type { Contact } from './contacts';

/* ═══════════════════════════════════════════════
   타입 정의
   ═══════════════════════════════════════════════ */

export type DuplicateReason = 'phone' | 'name' | 'name+birthday';

export interface DuplicateGroup {
  id: string; // 그룹 고유 ID
  contacts: Contact[];
  reasons: DuplicateReason[];
  confidence: number; // 0.0 ~ 1.0
}

/* ═══════════════════════════════════════════════
   문자열 정규화 유틸
   ═══════════════════════════════════════════════ */

/** 전화번호 정규화: 숫자만 남기기 */
function normalizePhone(phone?: string): string {
  if (!phone) return '';
  return phone.replace(/[^0-9]/g, '');
}

/** 이름 정규화: 공백 제거 + 소문자 */
function normalizeName(name: string): string {
  return name.replace(/\s+/g, '').toLowerCase();
}

/* ═══════════════════════════════════════════════
   문자열 유사도 — Levenshtein distance
   ═══════════════════════════════════════════════ */

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    Array(n + 1).fill(0)
  );

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost,
      );
    }
  }
  return dp[m][n];
}

/** 이름 유사도 0.0 ~ 1.0 */
function nameSimilarity(a: string, b: string): number {
  const na = normalizeName(a);
  const nb = normalizeName(b);
  if (na === nb) return 1.0;
  if (!na || !nb) return 0.0;

  const maxLen = Math.max(na.length, nb.length);
  const dist = levenshtein(na, nb);
  return 1 - dist / maxLen;
}

/* ═══════════════════════════════════════════════
   한글 초성 유사도
   ═══════════════════════════════════════════════ */

const CHOSEONG = [
  'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ',
  'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ',
];

function getChoseong(str: string): string {
  return [...str]
    .map((ch) => {
      const code = ch.charCodeAt(0) - 0xac00;
      if (code < 0 || code > 11171) return ch;
      return CHOSEONG[Math.floor(code / 588)] ?? ch;
    })
    .join('');
}

function choseongSimilarity(a: string, b: string): number {
  const ca = getChoseong(normalizeName(a));
  const cb = getChoseong(normalizeName(b));
  if (ca === cb) return 1.0;
  if (!ca || !cb) return 0.0;
  const maxLen = Math.max(ca.length, cb.length);
  return 1 - levenshtein(ca, cb) / maxLen;
}

/* ═══════════════════════════════════════════════
   중복 감지 메인 로직
   ═══════════════════════════════════════════════ */

/** 이름 유사도 임계값 */
const NAME_SIM_THRESHOLD = 0.7;
/** 이름+생일 조합 시 이름 유사도 완화 임계값 */
const NAME_BIRTHDAY_SIM_THRESHOLD = 0.5;

export function detectDuplicates(contacts: Contact[]): DuplicateGroup[] {
  if (contacts.length < 2) return [];

  const groups: DuplicateGroup[] = [];
  const assigned = new Set<string>(); // 이미 그룹에 배정된 ID

  // 1) 전화번호 기반 매칭
  const phoneMap = new Map<string, Contact[]>();
  for (const c of contacts) {
    const norm = normalizePhone(c.phone);
    if (norm.length >= 8) {
      // 최소 8자리 (유효한 전화번호)
      const existing = phoneMap.get(norm) || [];
      existing.push(c);
      phoneMap.set(norm, existing);
    }
  }

  for (const [, arr] of phoneMap) {
    if (arr.length >= 2) {
      const ids = arr.map((c) => c.id);
      ids.forEach((id) => assigned.add(id));
      groups.push({
        id: `dup-phone-${ids.join('-')}`,
        contacts: arr,
        reasons: ['phone'],
        confidence: 0.95,
      });
    }
  }

  // 2) 이름 유사도 + 생년월일 기반 매칭
  for (let i = 0; i < contacts.length; i++) {
    if (assigned.has(contacts[i].id)) continue;

    const cluster: Contact[] = [contacts[i]];
    const reasons: Set<DuplicateReason> = new Set();
    let maxConfidence = 0;

    for (let j = i + 1; j < contacts.length; j++) {
      if (assigned.has(contacts[j].id)) continue;

      const a = contacts[i];
      const b = contacts[j];

      // 이름 유사도
      const sim = nameSimilarity(a.name, b.name);
      const csim = choseongSimilarity(a.name, b.name);
      const bestSim = Math.max(sim, csim);

      // 생일 일치 여부
      const sameBirthday =
        !a.birthdayUnknown &&
        !b.birthdayUnknown &&
        a.birthday === b.birthday;

      if (bestSim >= NAME_SIM_THRESHOLD) {
        // 이름만으로도 충분히 유사
        cluster.push(b);
        reasons.add('name');
        maxConfidence = Math.max(maxConfidence, bestSim * 0.85);
      } else if (
        sameBirthday &&
        bestSim >= NAME_BIRTHDAY_SIM_THRESHOLD
      ) {
        // 생일 같고 이름도 어느 정도 유사
        cluster.push(b);
        reasons.add('name+birthday');
        maxConfidence = Math.max(maxConfidence, 0.8);
      }
    }

    if (cluster.length >= 2) {
      cluster.forEach((c) => assigned.add(c.id));
      groups.push({
        id: `dup-name-${cluster.map((c) => c.id).join('-')}`,
        contacts: cluster,
        reasons: [...reasons],
        confidence: Math.min(maxConfidence, 1),
      });
    }
  }

  // 신뢰도 높은 순으로 정렬
  return groups.sort((a, b) => b.confidence - a.confidence);
}

/* ═══════════════════════════════════════════════
   병합 도우미
   ═══════════════════════════════════════════════ */

export interface MergeFieldChoice {
  name: string;
  phone?: string;
  birthday: string;
  birthdayUnknown: boolean;
  relationship: string;
  closeness: string;
  familyStatus: string;
  memo: string;
  lastContact: string;
  isFavorite: boolean;
}

/**
 * 두 연락처의 필드를 비교하여 기본 병합 선택지를 생성.
 * primary(유지할 연락처)의 값을 기본으로, secondary에만 있는 데이터를 보완.
 */
export function createDefaultMergeChoice(
  primary: Contact,
  secondary: Contact,
): MergeFieldChoice {
  return {
    name: primary.name,
    phone: primary.phone || secondary.phone,
    birthday: primary.birthdayUnknown ? secondary.birthday : primary.birthday,
    birthdayUnknown: primary.birthdayUnknown && secondary.birthdayUnknown,
    relationship: primary.relationship,
    closeness: primary.closeness,
    familyStatus: primary.familyStatus,
    memo: combineMemo(primary.memo, secondary.memo),
    lastContact: newer(primary.lastContact, secondary.lastContact),
    isFavorite: (primary.isFavorite ?? false) || (secondary.isFavorite ?? false),
  };
}

function combineMemo(a: string, b: string): string {
  if (!a) return b;
  if (!b) return a;
  if (a === b) return a;
  return `${a}\n---\n${b}`;
}

function newer(dateA: string, dateB: string): string {
  return dateA >= dateB ? dateA : dateB;
}

/** 중복 이유를 사람이 읽을 수 있는 텍스트로 */
export function reasonLabel(reason: DuplicateReason, lang: 'ko' | 'en'): string {
  switch (reason) {
    case 'phone':
      return lang === 'ko' ? '동일 전화번호' : 'Same phone number';
    case 'name':
      return lang === 'ko' ? '유사한 이름' : 'Similar name';
    case 'name+birthday':
      return lang === 'ko' ? '유사한 이름 + 동일 생년월일' : 'Similar name + same birthday';
  }
}

/** 신뢰도를 백분율 텍스트로 */
export function confidenceLabel(confidence: number): string {
  return `${Math.round(confidence * 100)}%`;
}
