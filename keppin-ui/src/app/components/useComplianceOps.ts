/**
 * TDS 제품 운영 확장 3-11, §2 — 개인정보/규제/컴플라이언스 운영
 *
 * §2.1 데이터 분류 4등급: D0(공개) / D1(내부) / D2(PII) / D3(고위험 PII)
 * §2.2 수집 최소화: 필수 PII 최대 3필드, 4필드+ → 필수/선택 분리 + 수집 목적 표시
 * §2.3 보관기간/파기: 인증 90일, 사용 180일, CS 1년, 기간 만료 시 영구 삭제
 * §2.4 로그/이벤트 PII 혼입 방지: 이메일/@, 전화/010, 계좌/긴 숫자열 → 차단
 * §2.5 배포 전 리뷰 패키지 8항목 체크리스트
 */

/* ─── §2.1 데이터 분류 (최소 4등급) ─── */

export type DataClassification = 'D0' | 'D1' | 'D2' | 'D3';

export const DATA_CLASSIFICATION_LABELS: Record<DataClassification, string> = {
  D0: '공개 가능 (마케팅 카피 등)',
  D1: '내부용 (운영 지표, 익명화)',
  D2: '개인정보 (PII)',
  D3: '고위험 개인정보 (정부ID, 계좌/카드, 건강 정보)',
};

export interface DataField {
  name: string;
  classification: DataClassification;
  isRequired: boolean;
  /** §2.2 수집 목적 (4필드 이상 시 필드 옆에 표시) */
  purpose?: string;
}

/** §2.1 데이터 필드 분류 검증 */
export function validateDataClassification(fields: DataField[]): {
  valid: boolean;
  warnings: string[];
  byClass: Record<DataClassification, DataField[]>;
} {
  const warnings: string[] = [];
  const byClass: Record<DataClassification, DataField[]> = { D0: [], D1: [], D2: [], D3: [] };

  for (const field of fields) {
    byClass[field.classification].push(field);
  }

  // D3 필드가 있으면 추가 경고
  if (byClass.D3.length > 0) {
    warnings.push(
      `고위험 PII(D3) 필드 ${byClass.D3.length}개 감지: ${byClass.D3.map(f => f.name).join(', ')}. 추가 보안 리뷰가 필요합니다.`,
    );
  }

  return {
    valid: warnings.length === 0,
    warnings,
    byClass,
  };
}

/* ─── §2.2 PII 수집 최소화 규칙 ─── */

const PII_REQUIRED_FIELDS_MAX = 3; // §2.2

export interface PIICollectionResult {
  valid: boolean;
  requiredPIICount: number;
  optionalPIICount: number;
  needsPurposeSplit: boolean;
  warnings: string[];
}

/** §2.2 PII 수집 최소화 검증 */
export function validatePIICollection(fields: DataField[]): PIICollectionResult {
  const piiFields = fields.filter(f => f.classification === 'D2' || f.classification === 'D3');
  const requiredPII = piiFields.filter(f => f.isRequired);
  const optionalPII = piiFields.filter(f => !f.isRequired);
  const warnings: string[] = [];
  let needsPurposeSplit = false;

  if (requiredPII.length > PII_REQUIRED_FIELDS_MAX) {
    warnings.push(
      `필수 PII가 ${requiredPII.length}개 (최대 ${PII_REQUIRED_FIELDS_MAX}개). 필수/선택을 분리하고 수집 목적을 필드 옆에 표시하세요.`,
    );
    needsPurposeSplit = true;
  }

  // 4필드 이상이면 목적 표시 필수 체크
  if (piiFields.length >= 4) {
    const missingPurpose = piiFields.filter(f => !f.purpose);
    if (missingPurpose.length > 0) {
      warnings.push(
        `PII 4필드 이상이므로 수집 목적이 필요합니다. 목적 미기재: ${missingPurpose.map(f => f.name).join(', ')}`,
      );
      needsPurposeSplit = true;
    }
  }

  return {
    valid: warnings.length === 0,
    requiredPIICount: requiredPII.length,
    optionalPIICount: optionalPII.length,
    needsPurposeSplit,
    warnings,
  };
}

/* ─── §2.3 보관기간/파기 규칙 ─── */

export type RetentionCategory = 'auth_log' | 'usage_log' | 'cs_ticket' | 'custom';

export const RETENTION_DEFAULTS: Record<Exclude<RetentionCategory, 'custom'>, { days: number; label: string }> = {
  auth_log: { days: 90, label: '인증 로그 (90일)' },
  usage_log: { days: 180, label: '서비스 사용 로그 (180일)' },
  cs_ticket: { days: 365, label: 'CS 티켓 (1년)' },
};

export interface RetentionPolicy {
  category: RetentionCategory;
  /** 보관 일수 */
  retentionDays: number;
  /** 파기 방식: §2.3 기간 만료 시 "소프트 삭제" 금지 → 영구 삭제만 */
  destructionMethod: 'permanent_delete';
  /** 마지막 검토일 (최소 1회/분기) */
  lastReviewedAt: string | null;
}

/** §2.3 보관기간 정책 검증 */
export function validateRetentionPolicy(policies: RetentionPolicy[]): {
  valid: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];
  const now = Date.now();
  const QUARTER_MS = 90 * 24 * 60 * 60 * 1000; // 분기 (약 90일)

  for (const policy of policies) {
    // 영구 삭제만 허용
    if (policy.destructionMethod !== 'permanent_delete') {
      warnings.push(
        `"${policy.category}" 파기 방식이 영구 삭제가 아닙니다. 소프트 삭제는 금지됩니다.`,
      );
    }

    // 분기별 검토 확인
    if (!policy.lastReviewedAt) {
      warnings.push(`"${policy.category}" 보관 정책이 아직 검토되지 않았습니다.`);
    } else {
      const reviewedAt = new Date(policy.lastReviewedAt).getTime();
      if (now - reviewedAt > QUARTER_MS) {
        const daysSinceReview = Math.floor((now - reviewedAt) / (24 * 60 * 60 * 1000));
        warnings.push(
          `"${policy.category}" 마지막 검토가 ${daysSinceReview}일 전입니다. 분기별(90일) 검토가 필요합니다.`,
        );
      }
    }
  }

  return { valid: warnings.length === 0, warnings };
}

/** §2.3 기본 보관 정책 생성 */
export function createDefaultRetentionPolicies(): RetentionPolicy[] {
  return [
    { category: 'auth_log', retentionDays: 90, destructionMethod: 'permanent_delete', lastReviewedAt: null },
    { category: 'usage_log', retentionDays: 180, destructionMethod: 'permanent_delete', lastReviewedAt: null },
    { category: 'cs_ticket', retentionDays: 365, destructionMethod: 'permanent_delete', lastReviewedAt: null },
  ];
}

/* ─── §2.4 이벤트 PII 혼입 방지 + 샘플링 ─── */

const SAMPLE_RATE_DEFAULT = 10;   // §2.4 고빈도 이벤트 기본 10%
const SAMPLE_RATE_CRITICAL = 100; // §2.4 장애/결제/인증 100%

export type EventCriticality = 'normal' | 'critical';

/** §2.4 이벤트 샘플링 결정 */
export function shouldSampleEvent(criticality: EventCriticality): boolean {
  if (criticality === 'critical') return true; // 100% 수집
  // 일반 이벤트는 10% 확률
  return Math.random() * 100 < SAMPLE_RATE_DEFAULT;
}

/** §2.4 이벤트 유형별 크리티컬리티 분류 */
export function classifyEventCriticality(
  eventType: string,
): EventCriticality {
  const criticalTypes = ['payment', 'auth', 'login', 'incident', 'error', 'crash', 'security'];
  return criticalTypes.some(t => eventType.toLowerCase().includes(t)) ? 'critical' : 'normal';
}

/* ─── §2.5 배포 전 리뷰 패키지 (8항목 체크리스트) ─── */

export interface PrivacyReviewPackage {
  /** 1) 수집 항목 목록 */
  collectedFields: string[];
  /** 2) 목적/법적 근거 */
  legalBasis: string;
  /** 3) 저장 위치 (서버/클라/로그) */
  storageLocation: 'server' | 'client' | 'log' | 'mixed';
  /** 4) 보관기간 */
  retentionDays: number;
  /** 5) 파기 방식 */
  destructionMethod: string;
  /** 6) 제3자 제공 여부 */
  thirdPartySharing: boolean;
  /** 7) 접근 권한 (누가 볼 수 있는지) */
  accessRoles: string[];
  /** 8) 사용자 고지 문구 */
  userNotice: string;
}

/** §2.5 배포 전 리뷰 패키지 검증 */
export function validatePrivacyReviewPackage(pkg: PrivacyReviewPackage): {
  valid: boolean;
  missing: string[];
} {
  const missing: string[] = [];
  const checks: [boolean, string][] = [
    [pkg.collectedFields.length > 0, '수집 항목 목록'],
    [!!pkg.legalBasis, '목적/법적 근거'],
    [!!pkg.storageLocation, '저장 위치'],
    [pkg.retentionDays > 0, '보관기간'],
    [!!pkg.destructionMethod, '파기 방식'],
    // thirdPartySharing은 boolean이므로 항상 통과
    [pkg.accessRoles.length > 0, '접근 권한'],
    [!!pkg.userNotice, '사용자 고지 문구'],
  ];

  for (const [ok, label] of checks) {
    if (!ok) missing.push(label);
  }

  return { valid: missing.length === 0, missing };
}

/** §2.5 빈 리뷰 패키지 생성 */
export function createEmptyPrivacyReviewPackage(): PrivacyReviewPackage {
  return {
    collectedFields: [],
    legalBasis: '',
    storageLocation: 'server',
    retentionDays: 0,
    destructionMethod: '',
    thirdPartySharing: false,
    accessRoles: [],
    userNotice: '',
  };
}
