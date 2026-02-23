import { useState, useCallback, useRef } from 'react';

/**
 * TDS 제품 운영 확장 5-13, §4 — 권한/온디바이스 기능 UX
 * + UX/UI 확장 운영 규칙 30, §7 — 권한(Permission) UX 운영 규칙
 *
 * §4.1 프리-프롬프트 규칙
 *   - 권한 없으면 기능 사용 불가 + 사용자가 왜 필요한지 예상 어려움 → 프리-프롬프트
 *   - 3문장 이내: 1) 무엇을 위해, 2) 어떤 데이터가, 3) 언제 사용되는지
 *
 * §4.2 거절 상태별 대응
 *   - 1회 거절: 즉시 재요청 금지, 화면 내 대체 경로
 *   - 영구 거절: 설정 이동 CTA, 세션당 최대 1회만 노출
 *   - 거절 후 재요청: 7일 후부터
 *
 * §4.3 대체 경로
 *   - 위치 권한 없음 → 수동 주소 입력
 *   - 카메라 권한 없음 → 갤러리 업로드
 *
 * [확장30 §7 신규]
 * §7.1 요청 타이밍
 *   - [운영 가드레일] 앱 시작 시 일괄 요청 금지
 *   - 반드시 '기능을 쓰려는 순간'에 요청
 * §7.2 거절 이후 재요청
 *   - [운영 가드레일] 동일 권한 재요청은 최소 7일 쿨다운
 *   - [운영 가드레일] 2회 거절 이후에는 시스템 팝업 대신 설정으로 이동 CTA 1개만 제공
 */

/* ─── 상수 ─── */

const RE_ASK_DAYS = 7;                 // §4.2 거절 후 7일
const SETTINGS_CTA_SESSION_MAX = 1;    // §4.2 설정 이동 세션당 1회
const STORAGE_KEY = '__permission_denial';

/* ─── 권한 상태 ─── */

export type PermissionState =
  | 'unknown'          // 아직 확인 전
  | 'granted'          // 허용
  | 'denied'           // 1회 거절
  | 'permanentDenied'  // 영구 거절 (설정에서만 허용)
  | 'prompt';          // 프리-프롬프트 표시 가능

/* ─── §4.1 프리-프롬프트 메시지 ─── */

export interface PrePromptMessage {
  /** 1) 무엇을 위해 */
  purpose: string;
  /** 2) 어떤 데이터가 */
  dataType: string;
  /** 3) 언제 사용되는지 */
  timing: string;
}

/* ─── §4.3 대체 경로 ─── */

export type PermissionType = 'location' | 'camera' | 'contacts' | 'notification' | 'microphone' | 'storage';

export interface AlternativePath {
  available: boolean;
  description: string;
  actionLabel: string;
}

const ALTERNATIVE_PATHS: Record<PermissionType, AlternativePath> = {
  location: {
    available: true,
    description: '위치 대신 주소를 직접 입력할 수 있어요',
    actionLabel: '주소 직접 입력',
  },
  camera: {
    available: true,
    description: '카메라 대신 갤러리에서 사진을 선택할 수 있어요',
    actionLabel: '갤러리에서 선택',
  },
  contacts: {
    available: true,
    description: '연락처 대신 직접 입력할 수 있어요',
    actionLabel: '직접 입력',
  },
  notification: {
    available: false,
    description: '알림을 받을 수 없어요. 앱에서 직접 확인해주세요',
    actionLabel: '설정에서 허용',
  },
  microphone: {
    available: false,
    description: '마이크를 사용할 수 없어요',
    actionLabel: '설정에서 허용',
  },
  storage: {
    available: false,
    description: '저장소에 접근할 수 없어요',
    actionLabel: '설정에서 허용',
  },
};

export function getAlternativePath(permissionType: PermissionType): AlternativePath {
  return ALTERNATIVE_PATHS[permissionType];
}

/* ─── 거절 기록 (로컬 스토리지) ─── */

interface DenialRecord {
  permissionType: string;
  deniedAt: number;
  permanent: boolean;
}

function getDenialRecords(): DenialRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveDenialRecord(record: DenialRecord) {
  try {
    const records = getDenialRecords().filter(
      (r) => r.permissionType !== record.permissionType,
    );
    records.push(record);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch {
    // 스토리지 접근 불가 시 무시
  }
}

function canReAsk(permissionType: string): boolean {
  const records = getDenialRecords();
  const record = records.find((r) => r.permissionType === permissionType);
  if (!record) return true;
  if (record.permanent) return false; // 영구 거절은 재요청 불가
  const suppressUntil = record.deniedAt + RE_ASK_DAYS * 24 * 60 * 60 * 1000;
  return Date.now() >= suppressUntil;
}

/* ─── 세션 추적 (설정 이동 CTA) ─── */

const settingsCTAShownThisSession = new Set<string>();

/* ─── 메인 훅 ─── */

interface UsePermissionRequestOptions {
  permissionType: PermissionType;
  /** §4.1 프리-프롬프트 메시지 (3문장) */
  prePromptMessage: PrePromptMessage;
  /** 실제 권한 요청 함수 (플랫폼별 구현) */
  requestPermission?: () => Promise<'granted' | 'denied' | 'permanentDenied'>;
  /** 대체 경로 실행 함수 */
  onAlternative?: () => void;
}

interface UsePermissionRequestReturn {
  /** 현재 권한 상태 */
  state: PermissionState;
  /** §4.1 프리-프롬프트를 보여줘야 하는지 */
  shouldShowPrePrompt: boolean;
  /** 프리-프롬프트 3문장 */
  prePromptMessage: PrePromptMessage;
  /** §4.3 대체 경로 */
  alternative: AlternativePath;
  /** §4.2 설정 이동 CTA 표시 가능한지 (세션당 1회) */
  canShowSettingsCTA: boolean;
  /** 프리-프롬프트 확인 → 실제 권한 요청 */
  requestAfterPrePrompt: () => Promise<void>;
  /** 프리-프롬프트 거절 (7일 후 재요청) */
  dismissPrePrompt: () => void;
  /** §4.2 설정 이동 (세션당 1회 마킹) */
  openSettings: () => void;
  /** 대체 경로 사용 */
  useAlternative: () => void;
}

export function usePermissionRequest(
  options: UsePermissionRequestOptions,
): UsePermissionRequestReturn {
  const { permissionType, prePromptMessage, requestPermission, onAlternative } = options;

  const [state, setState] = useState<PermissionState>(() => {
    const records = getDenialRecords();
    const record = records.find((r) => r.permissionType === permissionType);
    if (!record) return 'unknown';
    if (record.permanent) return 'permanentDenied';
    return 'denied';
  });

  const [showPrePrompt, setShowPrePrompt] = useState(false);
  const settingsShownRef = useRef(settingsCTAShownThisSession.has(permissionType));

  const alternative = getAlternativePath(permissionType);

  // §4.2 재요청 가능한지 + 프리-프롬프트 필요한지
  const shouldShowPrePrompt =
    showPrePrompt && state !== 'granted' && canReAsk(permissionType);

  const canShowSettingsCTA =
    state === 'permanentDenied' && !settingsShownRef.current;

  // §4.1 프리-프롬프트 확인 → 실제 권한 요청
  const requestAfterPrePrompt = useCallback(async () => {
    setShowPrePrompt(false);
    if (!requestPermission) {
      // 웹 시뮬레이션: granted로 처리
      setState('granted');
      return;
    }

    try {
      const result = await requestPermission();
      setState(result === 'granted' ? 'granted' : result === 'permanentDenied' ? 'permanentDenied' : 'denied');

      if (result !== 'granted') {
        saveDenialRecord({
          permissionType,
          deniedAt: Date.now(),
          permanent: result === 'permanentDenied',
        });
      }
    } catch {
      setState('denied');
      saveDenialRecord({
        permissionType,
        deniedAt: Date.now(),
        permanent: false,
      });
    }
  }, [permissionType, requestPermission]);

  // §4.2 프리-프롬프트 거절
  const dismissPrePrompt = useCallback(() => {
    setShowPrePrompt(false);
    saveDenialRecord({
      permissionType,
      deniedAt: Date.now(),
      permanent: false,
    });
    setState('denied');
  }, [permissionType]);

  // §4.2 설정 이동 (세션당 1회)
  const openSettings = useCallback(() => {
    settingsCTAShownThisSession.add(permissionType);
    settingsShownRef.current = true;
    // 실제 앱에서는 네이티브 설정으로 이동
  }, [permissionType]);

  // §4.3 대체 경로 사용
  const useAlternative = useCallback(() => {
    onAlternative?.();
  }, [onAlternative]);

  return {
    state,
    shouldShowPrePrompt,
    prePromptMessage,
    alternative,
    canShowSettingsCTA,
    requestAfterPrePrompt,
    dismissPrePrompt,
    openSettings,
    useAlternative,
  };
}

/** §4.2 세션 리셋 (로그아웃 시) */
export function resetPermissionSession() {
  settingsCTAShownThisSession.clear();
}

/* ═══════════════════════════════════════════════════════════
   확장30 §7 — 권한(Permission) UX 운영 규칙 (신규 추가)
   ═══════════════════════════════════════════════════════════ */

/* ─── §7.1 요청 타이밍 가드 ─── */

/**
 * [운영 가드레일] 권한은 앱 시작 시 일괄 요청 금지
 * - 반드시 '기능을 쓰려는 순간'에 요청
 * - 이 유틸리티로 앱 시작 직후 권한 요청을 차단할 수 있음
 */
const APP_READY_STORAGE_KEY = '__app_permission_ready';
const APP_READY_GRACE_PERIOD_MS = 3000; // 앱 시작 후 3초 이내는 일괄 요청 의심

let appStartTimestamp: number | null = null;

/** 앱 시작 시각 기록 (App.tsx 마운트 시 호출) */
export function markAppStarted() {
  appStartTimestamp = Date.now();
}

/**
 * §7.1 앱 시작 직후 일괄 요청인지 판단
 * - true 반환 시 요청을 차단하고, 나중에 기능 사용 시점에 다시 시도해야 함
 */
export function isBulkRequestAtStart(): boolean {
  if (!appStartTimestamp) return false;
  return Date.now() - appStartTimestamp < APP_READY_GRACE_PERIOD_MS;
}

/* ─── §7.2 2회 거절 이후 → 설정 이동 CTA만 제공 ─── */

const DENIAL_COUNT_KEY = '__permission_denial_count';

/** §7.2 거절 횟수 트래킹 */
interface DenialCountRecord {
  permissionType: string;
  count: number;
}

function getDenialCounts(): DenialCountRecord[] {
  try {
    const raw = localStorage.getItem(DENIAL_COUNT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function incrementDenialCount(permissionType: string): number {
  const records = getDenialCounts();
  const existing = records.find((r) => r.permissionType === permissionType);
  if (existing) {
    existing.count += 1;
  } else {
    records.push({ permissionType, count: 1 });
  }
  try {
    localStorage.setItem(DENIAL_COUNT_KEY, JSON.stringify(records));
  } catch {
    // 무시
  }
  return existing?.count ?? 1;
}

/** §7.2 거절 횟수 조회 */
export function getDenialCount(permissionType: string): number {
  const records = getDenialCounts();
  return records.find((r) => r.permissionType === permissionType)?.count ?? 0;
}

/**
 * [운영 가드레일] 2회 거절 이후에는 시스템 팝업 대신 설정으로 이동 CTA 1개만 제공
 */
export const DENIAL_THRESHOLD_FOR_SETTINGS_ONLY = 2;

/** §7.2 시스템 팝업 대신 설정 CTA만 보여줘야 하는지 */
export function shouldShowSettingsOnly(permissionType: string): boolean {
  return getDenialCount(permissionType) >= DENIAL_THRESHOLD_FOR_SETTINGS_ONLY;
}

/**
 * §7.2 거절 기록 (카운트 + 쿨다운)
 * - 기존 saveDenialRecord와 함께 사용하여 카운트도 추적
 */
export function recordPermissionDenial(permissionType: string): {
  denialCount: number;
  showSettingsOnly: boolean;
} {
  const count = incrementDenialCount(permissionType);
  return {
    denialCount: count,
    showSettingsOnly: count >= DENIAL_THRESHOLD_FOR_SETTINGS_ONLY,
  };
}

/** 권한 허용 시 카운트 리셋 */
export function resetDenialCount(permissionType: string): void {
  const records = getDenialCounts().filter((r) => r.permissionType !== permissionType);
  try {
    localStorage.setItem(DENIAL_COUNT_KEY, JSON.stringify(records));
  } catch {
    // 무시
  }
}