/**
 * csvImporter.ts
 * ────────────────────────────────────────────────
 * CSV 파일 파싱 + 필드 매핑 + 중복 검출 유틸리티.
 *
 * 지원 형식:
 *  - UTF-8 / UTF-8 BOM
 *  - 쉼표(,) 또는 탭(\t) 구분
 *  - 큰따옴표 이스케이프 (RFC 4180)
 *  - keepin 내보내기 CSV, 구글 연락처 CSV, 네이버 주소록 CSV 등
 */

import type { Relationship, Closeness, FamilyStatus } from './contacts';

/* ═══════════════════════════════════════════════
   타입 정의
   ═══════════════════════════════════════════════ */

/** CSV에서 읽은 원시 행 */
export interface CsvRow {
  [header: string]: string;
}

/** 매핑 가능한 keepin 필드 */
export type KeepinField =
  | 'name'
  | 'phone'
  | 'birthday'
  | 'relationship'
  | 'closeness'
  | 'familyStatus'
  | 'memo'
  | 'lastContact'
  | 'skip'; // 이 컬럼은 무시

/** 필드 매핑 결과 */
export interface FieldMapping {
  csvHeader: string;
  keepinField: KeepinField;
  confidence: number; // 0~1 자동 매핑 신뢰도
}

/** 파싱 후 임포트 준비된 연락처 */
export interface ImportCandidate {
  rowIndex: number;
  name: string;
  phone?: string;
  birthday?: string;
  birthdayUnknown: boolean;
  relationship: string;
  closeness: string;
  familyStatus: string;
  memo: string;
  lastContact?: string;
  // 유효성/중복 상태
  isValid: boolean;
  validationErrors: string[];
  isDuplicate: boolean;
  duplicateContactId?: string;
  duplicateContactName?: string;
  selected: boolean; // 임포트 대상에 포함할지
}

export interface ParseResult {
  headers: string[];
  rows: CsvRow[];
  delimiter: ',' | '\t';
  totalRows: number;
}

/* ═══════════════════════════════════════════════
   CSV 파싱
   ═══════════════════════════════════════════════ */

/** BOM 제거 */
function stripBOM(text: string): string {
  return text.charCodeAt(0) === 0xFEFF ? text.slice(1) : text;
}

/** 구분자 자동 감지 (첫 줄 기준) */
function detectDelimiter(firstLine: string): ',' | '\t' {
  const commaCount = (firstLine.match(/,/g) || []).length;
  const tabCount = (firstLine.match(/\t/g) || []).length;
  return tabCount > commaCount ? '\t' : ',';
}

/** RFC 4180 호환 CSV 파싱 */
function parseCsvLine(line: string, delimiter: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuote = false;
  let i = 0;

  while (i < line.length) {
    const ch = line[i];
    if (inQuote) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i += 2;
        } else {
          inQuote = false;
          i++;
        }
      } else {
        current += ch;
        i++;
      }
    } else {
      if (ch === '"') {
        inQuote = true;
        i++;
      } else if (ch === delimiter) {
        fields.push(current.trim());
        current = '';
        i++;
      } else {
        current += ch;
        i++;
      }
    }
  }
  fields.push(current.trim());
  return fields;
}

/** CSV 텍스트를 파싱하여 헤더 + 행 배열 반환 */
export function parseCsv(text: string): ParseResult {
  const clean = stripBOM(text);
  const lines = clean.split(/\r?\n/).filter((l) => l.trim().length > 0);

  if (lines.length < 2) {
    return { headers: [], rows: [], delimiter: ',', totalRows: 0 };
  }

  const delimiter = detectDelimiter(lines[0]);
  const headers = parseCsvLine(lines[0], delimiter);

  const rows: CsvRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i], delimiter);
    const row: CsvRow = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] ?? '';
    });
    rows.push(row);
  }

  return { headers, rows, delimiter, totalRows: rows.length };
}

/* ═══════════════════════════════════════════════
   자동 필드 매핑
   ═══════════════════════════════════════════════ */

const FIELD_PATTERNS: Record<KeepinField, RegExp[]> = {
  name: [
    /^이름$/i, /^name$/i, /^성명$/i, /^full\s*name$/i, /^first\s*name$/i,
    /^display\s*name$/i, /^given\s*name$/i, /^연락처\s*이름$/i,
  ],
  phone: [
    /^전화$/i, /^phone$/i, /^연락처$/i, /^핸드폰$/i, /^휴대폰$/i,
    /^mobile$/i, /^tel$/i, /^phone\s*number$/i, /^cell$/i,
    /^phone\s*1/i, /^mobile\s*phone/i,
  ],
  birthday: [
    /^생일$/i, /^birthday$/i, /^생년월일$/i, /^birth$/i, /^date\s*of\s*birth$/i,
    /^dob$/i, /^생년$/i,
  ],
  relationship: [
    /^관계$/i, /^relationship$/i, /^분류$/i, /^구분$/i, /^category$/i,
    /^group$/i, /^type$/i,
  ],
  closeness: [
    /^친밀도$/i, /^closeness$/i, /^친함$/i,
  ],
  familyStatus: [
    /^결혼$/i, /^family$/i, /^혼인$/i, /^marital$/i,
  ],
  memo: [
    /^메모$/i, /^memo$/i, /^비고$/i, /^note$/i, /^notes$/i, /^설명$/i,
    /^코멘트$/i, /^comment$/i,
  ],
  lastContact: [
    /^마지막\s*연락$/i, /^last\s*contact$/i, /^최근\s*연락$/i,
  ],
  skip: [],
};

export function autoMapFields(headers: string[]): FieldMapping[] {
  const usedFields = new Set<KeepinField>();

  return headers.map((header): FieldMapping => {
    let bestField: KeepinField = 'skip';
    let bestConfidence = 0;

    for (const [field, patterns] of Object.entries(FIELD_PATTERNS) as [KeepinField, RegExp[]][]) {
      if (field === 'skip' || usedFields.has(field)) continue;
      for (const pattern of patterns) {
        if (pattern.test(header)) {
          const confidence = 0.9;
          if (confidence > bestConfidence) {
            bestConfidence = confidence;
            bestField = field;
          }
        }
      }
    }

    // 부분 매칭 (헤더에 키워드가 포함된 경우)
    if (bestField === 'skip') {
      const h = header.toLowerCase();
      const partialMap: [string[], KeepinField][] = [
        [['이름', 'name', '성명'], 'name'],
        [['전화', 'phone', 'mobile', '폰', 'tel'], 'phone'],
        [['생일', 'birth', '생년'], 'birthday'],
        [['관계', 'relation', '분류'], 'relationship'],
        [['메모', 'memo', 'note', '비고'], 'memo'],
      ];
      for (const [keywords, field] of partialMap) {
        if (usedFields.has(field)) continue;
        if (keywords.some((k) => h.includes(k))) {
          bestField = field;
          bestConfidence = 0.6;
          break;
        }
      }
    }

    if (bestField !== 'skip') {
      usedFields.add(bestField);
    }

    return { csvHeader: header, keepinField: bestField, confidence: bestConfidence };
  });
}

/* ═══════════════════════════════════════════════
   필드 옵션 목록 (UI용)
   ═══════════════════════════════════════════════ */

export const KEEPIN_FIELD_OPTIONS: { value: KeepinField; labelKo: string; labelEn: string }[] = [
  { value: 'name', labelKo: '이름', labelEn: 'Name' },
  { value: 'phone', labelKo: '전화번호', labelEn: 'Phone' },
  { value: 'birthday', labelKo: '생일', labelEn: 'Birthday' },
  { value: 'relationship', labelKo: '관계', labelEn: 'Relationship' },
  { value: 'closeness', labelKo: '친밀도', labelEn: 'Closeness' },
  { value: 'familyStatus', labelKo: '결혼 상태', labelEn: 'Family Status' },
  { value: 'memo', labelKo: '메모', labelEn: 'Memo' },
  { value: 'lastContact', labelKo: '마지막 연락일', labelEn: 'Last Contact' },
  { value: 'skip', labelKo: '건너뛰기', labelEn: 'Skip' },
];

/* ═══════════════════════════════════════════════
   데이터 정규화
   ═══════════════════════════════════════════════ */

const VALID_RELATIONSHIPS: string[] = ['가족', '친구', '직장 동료', '학교', '군대'];
const VALID_CLOSENESS: string[] = ['가족', '매우 친함', '친함', '보통', '가끔', '거의 모름'];
const VALID_FAMILY_STATUS: string[] = ['미혼', '기혼·자녀 없음', '기혼·자녀 있음', '기타/모름'];

/** 날짜 문자열 정규화 (다양한 형식 지원) → YYYY-MM-DD */
export function normalizeDate(raw: string): string | null {
  if (!raw || !raw.trim()) return null;
  const s = raw.trim();

  // YYYY-MM-DD
  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(s)) return s;
  // YYYY.MM.DD
  if (/^\d{4}\.\d{1,2}\.\d{1,2}$/.test(s)) return s.replace(/\./g, '-');
  // YYYY/MM/DD
  if (/^\d{4}\/\d{1,2}\/\d{1,2}$/.test(s)) return s.replace(/\//g, '-');
  // MM/DD/YYYY
  const mdy = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (mdy) return `${mdy[3]}-${mdy[1].padStart(2, '0')}-${mdy[2].padStart(2, '0')}`;
  // YYYYMMDD
  if (/^\d{8}$/.test(s)) return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;

  return null;
}

/** 전화번호 정규화 (숫자만 추출 후 한국 형식) */
function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';
  // 한국 핸드폰 (010XXXXXXXX → 010-XXXX-XXXX)
  if (digits.length === 11 && digits.startsWith('010')) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  }
  // 한국 일반 전화 (02XXXXXXXX 등)
  if (digits.length >= 9 && digits.length <= 11) {
    if (digits.startsWith('02')) {
      return `${digits.slice(0, 2)}-${digits.slice(2, digits.length - 4)}-${digits.slice(-4)}`;
    }
    return `${digits.slice(0, 3)}-${digits.slice(3, digits.length - 4)}-${digits.slice(-4)}`;
  }
  return raw.trim();
}

function normalizeRelationship(raw: string): string {
  const s = raw.trim();
  if (VALID_RELATIONSHIPS.includes(s)) return s;
  // 영어 매핑
  const enMap: Record<string, string> = {
    family: '가족', friend: '친구', friends: '친구',
    coworker: '직장 동료', colleague: '직장 동료', work: '직장 동료',
    school: '학교', military: '군대',
  };
  return enMap[s.toLowerCase()] || '친구'; // 기본값
}

function normalizeCloseness(raw: string): string {
  const s = raw.trim();
  if (VALID_CLOSENESS.includes(s)) return s;
  return '보통'; // 기본값
}

function normalizeFamilyStatus(raw: string): string {
  const s = raw.trim();
  if (VALID_FAMILY_STATUS.includes(s)) return s;
  return '기타/모름';
}

/* ═══════════════════════════════════════════════
   행 → ImportCandidate 변환
   ═══════════════════════════════════════════════ */

export function rowToCandidate(
  row: CsvRow,
  mappings: FieldMapping[],
  rowIndex: number,
): ImportCandidate {
  const get = (field: KeepinField): string => {
    const mapping = mappings.find((m) => m.keepinField === field);
    if (!mapping) return '';
    return (row[mapping.csvHeader] || '').trim();
  };

  const name = get('name');
  const phone = normalizePhone(get('phone'));
  const bdayRaw = normalizeDate(get('birthday'));
  const lastContactRaw = normalizeDate(get('lastContact'));

  const errors: string[] = [];
  if (!name) errors.push('이름이 비어있습니다');
  if (name.length > 20) errors.push('이름이 너무 깁니다 (최대 20자)');

  return {
    rowIndex,
    name,
    phone: phone || undefined,
    birthday: bdayRaw || undefined,
    birthdayUnknown: !bdayRaw,
    relationship: normalizeRelationship(get('relationship')),
    closeness: normalizeCloseness(get('closeness')),
    familyStatus: normalizeFamilyStatus(get('familyStatus')),
    memo: get('memo'),
    lastContact: lastContactRaw || undefined,
    isValid: errors.length === 0,
    validationErrors: errors,
    isDuplicate: false,
    selected: errors.length === 0,
  };
}

/* ═══════════════════════════════════════════════
   중복 검출 (기존 연락처 대비)
   ═══════════════════════════════════════════════ */

interface ExistingContact {
  id: string;
  name: string;
  phone?: string;
  birthday?: string;
}

export function markDuplicates(
  candidates: ImportCandidate[],
  existing: ExistingContact[],
): ImportCandidate[] {
  return candidates.map((c) => {
    // 전화번호 일치
    if (c.phone) {
      const phoneDigits = c.phone.replace(/\D/g, '');
      const match = existing.find((e) =>
        e.phone && e.phone.replace(/\D/g, '') === phoneDigits,
      );
      if (match) {
        return {
          ...c,
          isDuplicate: true,
          duplicateContactId: match.id,
          duplicateContactName: match.name,
          selected: false, // 기본적으로 중복은 미선택
        };
      }
    }

    // 이름 + 생일 일치
    if (c.name && c.birthday) {
      const match = existing.find(
        (e) => e.name === c.name && e.birthday === c.birthday,
      );
      if (match) {
        return {
          ...c,
          isDuplicate: true,
          duplicateContactId: match.id,
          duplicateContactName: match.name,
          selected: false,
        };
      }
    }

    // 이름 완전 일치
    const nameMatch = existing.find((e) => e.name === c.name);
    if (nameMatch) {
      return {
        ...c,
        isDuplicate: true,
        duplicateContactId: nameMatch.id,
        duplicateContactName: nameMatch.name,
        selected: true, // 이름만 같은 경우는 기본 선택 유지
      };
    }

    return c;
  });
}

/* ═══════════════════════════════════════════════
   파일 읽기 헬퍼
   ═══════════════════════════════════════════════ */

export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('파일 읽기 실패'));
    reader.readAsText(file, 'UTF-8');
  });
}
