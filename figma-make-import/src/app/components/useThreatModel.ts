/**
 * TDS 제품 운영 확장 3-11, §1 — 보안/리스크 심화
 *
 * §1.1 위협 모델링(Threat Model) 최소 6항목 체크
 * §1.2 인증/로그인 하드 룰 (useLoginGuard에서 계정 잠금 구현 완료, 여기선 IP 레이트리밋 + 세션 폐기)
 * §1.3 리플레이/중복 요청 방지 — idempotency key 관리
 * §1.4 민감정보 노출 방지 — PII 검출 유틸리티
 * §1.5 사회공학(CS 피싱) 방지 — 고위험 변경 시 2요소 확인 + 2인 승인
 */

/* ─── §1.1 위협 모델링 최소 템플릿 ─── */

export interface ThreatModelItem {
  /** 1) 보호 자산 (데이터/돈/계정) */
  asset: string;
  /** 2) 공격자 유형 */
  attacker: 'general_user' | 'compromised_account' | 'insider' | 'bot';
  /** 3) 공격 벡터 */
  vector: 'phishing' | 'replay' | 'scraping' | 'session_hijacking' | 'other';
  /** 4) 피해 유형 */
  impact: 'financial' | 'pii' | 'trust' | 'operational';
  /** 5) 탐지 방법 */
  detection: string;
  /** 6) 완화 조치 */
  mitigation: string;
}

const THREAT_MODEL_MIN_ITEMS = 6; // §1.1

/** §1.1 위협 모델 완성도 검증 (기능 1개당 6항목) */
export function validateThreatModel(items: ThreatModelItem[]): {
  valid: boolean;
  message: string;
  missingFields: string[];
} {
  if (items.length === 0) {
    return {
      valid: false,
      message: '위협 모델이 비어 있습니다. 최소 1개 자산에 대해 6항목을 작성하세요.',
      missingFields: ['asset', 'attacker', 'vector', 'impact', 'detection', 'mitigation'],
    };
  }

  const missingFields: string[] = [];
  for (const item of items) {
    if (!item.asset) missingFields.push('asset');
    if (!item.attacker) missingFields.push('attacker');
    if (!item.vector) missingFields.push('vector');
    if (!item.impact) missingFields.push('impact');
    if (!item.detection) missingFields.push('detection');
    if (!item.mitigation) missingFields.push('mitigation');
  }

  const uniqueMissing = [...new Set(missingFields)];
  return {
    valid: uniqueMissing.length === 0,
    message: uniqueMissing.length === 0
      ? `위협 모델 ${items.length}건 작성 완료`
      : `누락 항목: ${uniqueMissing.join(', ')}`,
    missingFields: uniqueMissing,
  };
}

/** §1.1 빈 위협 모델 생성 */
export function createEmptyThreatModel(): ThreatModelItem {
  return {
    asset: '',
    attacker: 'general_user',
    vector: 'other',
    impact: 'trust',
    detection: '',
    mitigation: '',
  };
}

/* ─── §1.2 IP 레이트리밋 (클라이언트 측 시뮬레이션) ─── */

const IP_RATE_LIMIT_COUNT = 20;       // §1.2 동일 IP 10분 내 20회
const IP_RATE_LIMIT_WINDOW = 600000;  // 10분

const ipRequestLog: number[] = [];

/** §1.2 IP 레이트리밋 체크 (클라이언트 측 프록시) */
export function checkIPRateLimit(): {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
} {
  const now = Date.now();
  // 윈도우 밖 요청 제거
  while (ipRequestLog.length > 0 && now - ipRequestLog[0] > IP_RATE_LIMIT_WINDOW) {
    ipRequestLog.shift();
  }

  if (ipRequestLog.length >= IP_RATE_LIMIT_COUNT) {
    const oldestInWindow = ipRequestLog[0];
    const retryAfterMs = IP_RATE_LIMIT_WINDOW - (now - oldestInWindow);
    return { allowed: false, remaining: 0, retryAfterMs };
  }

  ipRequestLog.push(now);
  return {
    allowed: true,
    remaining: IP_RATE_LIMIT_COUNT - ipRequestLog.length,
    retryAfterMs: 0,
  };
}

/** IP 레이트리밋 리셋 */
export function resetIPRateLimit() {
  ipRequestLog.length = 0;
}

/* ─── §1.2 세션 폐기 — 비밀번호/인증 변경 후 기존 세션 전부 폐기 ─── */

let sessionVersion = 0;

/** §1.2 세션 버전 증가 (비밀번호/인증 변경 시 호출) */
export function invalidateAllSessions(): number {
  sessionVersion += 1;
  try {
    localStorage.setItem('__session_version', String(sessionVersion));
  } catch {
    // storage 접근 불가 시 무시
  }
  return sessionVersion;
}

/** §1.2 현재 세션이 유효한지 확인 */
export function isSessionValid(clientVersion: number): boolean {
  return clientVersion >= sessionVersion;
}

/* ─── §1.3 멱등키(Idempotency Key) 관리 ─── */

const IDEMPOTENCY_VALIDITY_MS = 24 * 60 * 60 * 1000; // 24시간

interface IdempotencyRecord {
  key: string;
  createdAt: number;
  status: 'pending' | 'success' | 'failure';
  result?: unknown;
}

/** 멱등키 저장소 (실제로는 서버 측, 여기선 클라이언트 시뮬레이션) */
const idempotencyStore = new Map<string, IdempotencyRecord>();

/** §1.3 멱등키 생성 */
export function generateIdempotencyKey(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let key = '';
  for (let i = 0; i < 32; i++) {
    key += chars[Math.floor(Math.random() * chars.length)];
  }
  return key;
}

/** §1.3 멱등키로 중복 요청 체크 */
export function checkIdempotency(key: string): {
  isDuplicate: boolean;
  previousResult?: unknown;
  status?: 'pending' | 'success' | 'failure';
} {
  const record = idempotencyStore.get(key);
  if (!record) {
    return { isDuplicate: false };
  }

  // 24시간 유효기간 체크
  if (Date.now() - record.createdAt > IDEMPOTENCY_VALIDITY_MS) {
    idempotencyStore.delete(key);
    return { isDuplicate: false };
  }

  return {
    isDuplicate: true,
    previousResult: record.result,
    status: record.status,
  };
}

/** §1.3 멱등키 등록 (요청 시작 시) */
export function registerIdempotencyKey(key: string): void {
  idempotencyStore.set(key, {
    key,
    createdAt: Date.now(),
    status: 'pending',
  });
}

/** §1.3 멱등키 결과 기록 (요청 완료 시) */
export function completeIdempotencyKey(
  key: string,
  status: 'success' | 'failure',
  result?: unknown,
): void {
  const record = idempotencyStore.get(key);
  if (record) {
    record.status = status;
    record.result = result;
  }
}

/* ─── §1.4 민감정보(PII) 검출 유틸리티 ─── */

/** §1.4 이벤트/로그 payload에서 PII 패턴 검출 */
export function detectPIIInPayload(payload: Record<string, unknown>): {
  hasPII: boolean;
  violations: string[];
} {
  const violations: string[] = [];
  const json = JSON.stringify(payload);

  // 이메일 패턴 (@ 포함)
  if (/@/.test(json)) {
    const emailMatch = json.match(/[\w.-]+@[\w.-]+\.\w+/);
    if (emailMatch) {
      violations.push(`이메일 패턴 검출: ${emailMatch[0].slice(0, 3)}***`);
    }
  }

  // 전화번호 패턴 (010)
  if (/01[0-9]/.test(json)) {
    const phoneMatch = json.match(/01[0-9][\s-]?\d{3,4}[\s-]?\d{4}/);
    if (phoneMatch) {
      violations.push('전화번호 패턴 검출 (010-xxxx-xxxx)');
    }
  }

  // 계좌번호/카드번호 (긴 숫자열 12자리+)
  const longNumberMatch = json.match(/\d{12,}/);
  if (longNumberMatch) {
    violations.push(`장문 숫자열 검출 (${longNumberMatch[0].length}자리) — 계좌/카드번호 의심`);
  }

  return {
    hasPII: violations.length > 0,
    violations,
  };
}

/** §1.4 PII가 포함된 이벤트 전송 차단 (빌드/배포 차단 원칙의 런타임 가드) */
export function sanitizeEventPayload(
  payload: Record<string, unknown>,
): Record<string, unknown> {
  const detection = detectPIIInPayload(payload);
  if (detection.hasPII) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[Security] PII detected in event payload:', detection.violations);
    }
    // PII 필드를 '[REDACTED]'로 대체
    const sanitized = { ...payload };
    for (const key of Object.keys(sanitized)) {
      const value = String(sanitized[key] ?? '');
      if (/@/.test(value) || /01[0-9][\s-]?\d{3,4}[\s-]?\d{4}/.test(value) || /\d{12,}/.test(value)) {
        sanitized[key] = '[REDACTED]';
      }
    }
    return sanitized;
  }
  return payload;
}

/* ─── §1.5 사회공학 방지 — 고위험 변경 2요소 확인 ─── */

export type HighRiskAction = 'email_change' | 'password_change' | 'account_change' | 'withdrawal';

export interface HighRiskVerification {
  action: HighRiskAction;
  /** 1차 인증 (앱 내 인증) 완료 시각 */
  primaryVerifiedAt: number | null;
  /** 2차 인증 (보조 확인) 완료 시각 */
  secondaryVerifiedAt: number | null;
  /** §1.5 예외 처리: 로그 + 2인 승인 (CS 1 + 리드 1) */
  emergencyOverride?: {
    approverCS: string;
    approverLead: string;
    reason: string;
    approvedAt: number;
  };
}

/** §1.5 고위험 변경 실행 가능 여부 */
export function canExecuteHighRiskAction(verification: HighRiskVerification): {
  allowed: boolean;
  reason: string;
} {
  // 긴급 예외 처리 (2인 승인)
  if (verification.emergencyOverride) {
    return { allowed: true, reason: '긴급 예외 — 2인 승인 완료' };
  }

  if (!verification.primaryVerifiedAt) {
    return { allowed: false, reason: '1차 인증(앱 내 인증)이 필요합니다' };
  }

  if (!verification.secondaryVerifiedAt) {
    return { allowed: false, reason: '2차 인증(보조 확인)이 필요합니다' };
  }

  // §1.2 재인증 5분 경과 체크
  const REAUTH_TIMEOUT = 5 * 60 * 1000; // 5분
  const now = Date.now();
  if (now - verification.primaryVerifiedAt > REAUTH_TIMEOUT) {
    return { allowed: false, reason: '재인증 유효시간(5분)이 경과했습니다. 다시 인증해주세요.' };
  }

  return { allowed: true, reason: '2요소 인증 완료' };
}
