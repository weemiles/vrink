import { useState, useCallback, useRef } from 'react';

/**
 * TDS 제품 운영 확장 (수치 중심) 6, §5 — 기능 상태/데이터 모델 규칙
 *
 * §5.1 기능별 최소 상태 세트
 *   - Read(조회): Idle / Loading / Success / Empty / Error
 *   - Write(저장): Editing / Submitting / Success / Failed
 *   - Delete(삭제): Confirming / Deleting / Deleted / Failed
 *
 * §5.2 Optimistic update 허용/금지
 *   - 허용: 좋아요/북마크/라벨 변경, 개인 설정 토글
 *   - 금지: 결제/송금/정산, 권한 변경/계정/보안, 재고/좌석/예약 확정
 *
 * §5.3 충돌(Conflict) 처리
 *   - 자동 병합 금지
 *   - 선택지 2개만: 내 변경 적용(재시도) / 서버 버전으로 되돌리기
 *
 * §5.4 저장/제출 버튼 활성화 기준
 *   - 필수 필드 누락 → CTA disabled
 *   - 최초 값과 동일 → CTA disabled (변경 없음)
 *   - 제출 중 → CTA loading + disabled 동시 적용
 *
 * §5.5 실패 분류(표준 코드)
 *   - OFFLINE / TIMEOUT / UNAUTHENTICATED / FORBIDDEN / INVALID_INPUT / SERVER_ERROR
 *   - 각 실패: 사용자 문구 1줄 + 다음 행동 1개
 */

/* ═══════════════════════════════════════════════
   §5.1 CRUD 상태 타입 정의
   ═══════════════════════════════════════════════ */

/** Read(조회) 상태 — 5종 */
export type ReadState = 'idle' | 'loading' | 'success' | 'empty' | 'error';

/** Write(저장) 상태 — 4종 */
export type WriteState = 'editing' | 'submitting' | 'success' | 'failed';

/** Delete(삭제) 상태 — 4종 */
export type DeleteState = 'confirming' | 'deleting' | 'deleted' | 'failed';

/* ═══════════════════════════════════════════════
   §5.1 Read 상태 머신 훅
   ═══════════════════════════════════════════════ */

interface UseReadStateOptions<T> {
  fetchFn: () => Promise<T>;
  /** 결과가 "비어있음"인지 판단 */
  isEmpty?: (data: T) => boolean;
  onSuccess?: (data: T) => void;
  onError?: (error: FailureCode) => void;
}

interface UseReadStateReturn<T> {
  state: ReadState;
  data: T | null;
  errorCode: FailureCode | null;
  errorMessage: string | null;
  errorAction: FailureAction | null;
  load: () => void;
  reset: () => void;
}

export function useReadState<T>(options: UseReadStateOptions<T>): UseReadStateReturn<T> {
  const { fetchFn, isEmpty, onSuccess, onError } = options;
  const [state, setState] = useState<ReadState>('idle');
  const [data, setData] = useState<T | null>(null);
  const [errorCode, setErrorCode] = useState<FailureCode | null>(null);

  const load = useCallback(async () => {
    setState('loading');
    setErrorCode(null);

    try {
      const result = await fetchFn();
      if (isEmpty?.(result)) {
        setState('empty');
        setData(result);
      } else {
        setState('success');
        setData(result);
        onSuccess?.(result);
      }
    } catch (err) {
      const code = classifyFailure(err);
      setState('error');
      setErrorCode(code);
      onError?.(code);
    }
  }, [fetchFn, isEmpty, onSuccess, onError]);

  const reset = useCallback(() => {
    setState('idle');
    setData(null);
    setErrorCode(null);
  }, []);

  return {
    state,
    data,
    errorCode,
    errorMessage: errorCode ? getFailureMessage(errorCode) : null,
    errorAction: errorCode ? getFailureAction(errorCode) : null,
    load,
    reset,
  };
}

/* ═══════════════════════════════════════════════
   §5.1 Write 상태 머신 훅
   ═══════════════════════════════════════════════ */

interface UseWriteStateOptions<T> {
  submitFn: (data: T) => Promise<void>;
  onSuccess?: () => void;
  onFailed?: (error: FailureCode) => void;
}

interface UseWriteStateReturn<T> {
  state: WriteState;
  errorCode: FailureCode | null;
  errorMessage: string | null;
  errorAction: FailureAction | null;
  /** §5.4 제출 버튼 비활성화 상태 */
  isSubmitDisabled: boolean;
  startEditing: () => void;
  submit: (data: T) => void;
  reset: () => void;
}

export function useWriteState<T>(options: UseWriteStateOptions<T>): UseWriteStateReturn<T> {
  const { submitFn, onSuccess, onFailed } = options;
  const [state, setState] = useState<WriteState>('editing');
  const [errorCode, setErrorCode] = useState<FailureCode | null>(null);

  const startEditing = useCallback(() => {
    setState('editing');
    setErrorCode(null);
  }, []);

  const submit = useCallback(async (data: T) => {
    setState('submitting');
    setErrorCode(null);

    try {
      await submitFn(data);
      setState('success');
      onSuccess?.();
    } catch (err) {
      const code = classifyFailure(err);
      setState('failed');
      setErrorCode(code);
      onFailed?.(code);
    }
  }, [submitFn, onSuccess, onFailed]);

  const reset = useCallback(() => {
    setState('editing');
    setErrorCode(null);
  }, []);

  return {
    state,
    errorCode,
    errorMessage: errorCode ? getFailureMessage(errorCode) : null,
    errorAction: errorCode ? getFailureAction(errorCode) : null,
    isSubmitDisabled: state === 'submitting',
    startEditing,
    submit,
    reset,
  };
}

/* ═══════════════════════════════════════════════
   §5.1 Delete 상태 머신 훅
   ═══════════════════════════════════════════════ */

interface UseDeleteStateOptions {
  deleteFn: () => Promise<void>;
  onDeleted?: () => void;
  onFailed?: (error: FailureCode) => void;
}

interface UseDeleteStateReturn {
  state: DeleteState;
  errorCode: FailureCode | null;
  errorMessage: string | null;
  errorAction: FailureAction | null;
  /** 삭제 확인 다이얼로그 열기 */
  requestDelete: () => void;
  /** 삭제 확정 */
  confirmDelete: () => void;
  /** 삭제 취소 */
  cancelDelete: () => void;
  reset: () => void;
}

export function useDeleteState(options: UseDeleteStateOptions): UseDeleteStateReturn {
  const { deleteFn, onDeleted, onFailed } = options;
  const [state, setState] = useState<DeleteState>('confirming');
  const [errorCode, setErrorCode] = useState<FailureCode | null>(null);

  const requestDelete = useCallback(() => {
    setState('confirming');
  }, []);

  const confirmDelete = useCallback(async () => {
    setState('deleting');
    setErrorCode(null);

    try {
      await deleteFn();
      setState('deleted');
      onDeleted?.();
    } catch (err) {
      const code = classifyFailure(err);
      setState('failed');
      setErrorCode(code);
      onFailed?.(code);
    }
  }, [deleteFn, onDeleted, onFailed]);

  const cancelDelete = useCallback(() => {
    setState('confirming');
    setErrorCode(null);
  }, []);

  const reset = useCallback(() => {
    setState('confirming');
    setErrorCode(null);
  }, []);

  return {
    state,
    errorCode,
    errorMessage: errorCode ? getFailureMessage(errorCode) : null,
    errorAction: errorCode ? getFailureAction(errorCode) : null,
    requestDelete,
    confirmDelete,
    cancelDelete,
    reset,
  };
}

/* ═══════════════════════════════════════════════
   §5.2 Optimistic Update 정책
   ═══════════════════════════════════════════════ */

/** Optimistic update가 허용된 작업 유형 */
export type OptimisticAllowed =
  | 'like'
  | 'bookmark'
  | 'label_change'
  | 'personal_setting_toggle';

/** Optimistic update가 금지된 작업 유형 */
export type OptimisticForbidden =
  | 'payment'
  | 'transfer'
  | 'settlement'
  | 'permission_change'
  | 'account_security'
  | 'inventory_confirm'
  | 'seat_reservation'
  | 'booking_confirm';

const OPTIMISTIC_ALLOWED_SET = new Set<string>([
  'like',
  'bookmark',
  'label_change',
  'personal_setting_toggle',
]);

const OPTIMISTIC_FORBIDDEN_SET = new Set<string>([
  'payment',
  'transfer',
  'settlement',
  'permission_change',
  'account_security',
  'inventory_confirm',
  'seat_reservation',
  'booking_confirm',
]);

/** §5.2 해당 작업이 optimistic update를 사용할 수 있는지 확인 */
export function canUseOptimistic(actionType: string): {
  allowed: boolean;
  reason?: string;
} {
  if (OPTIMISTIC_ALLOWED_SET.has(actionType)) {
    return { allowed: true };
  }
  if (OPTIMISTIC_FORBIDDEN_SET.has(actionType)) {
    return {
      allowed: false,
      reason: `"${actionType}"은(는) 서버 확인이 필요한 작업이므로 optimistic update가 금지됩니다`,
    };
  }
  // 미분류 → 보수적으로 금지
  return {
    allowed: false,
    reason: `"${actionType}"은(는) 정의되지 않은 작업입니다. 서버 확인 후 업데이트하세요`,
  };
}

/* ═══════════════════════════════════════════════
   §5.3 충돌(Conflict) 처리
   ═══════════════════════════════════════════════ */

export type ConflictResolution = 'apply_mine' | 'revert_to_server';

export interface ConflictInfo {
  /** 충돌이 감지된 필드 */
  field: string;
  /** 서버 값 */
  serverValue: unknown;
  /** 내 변경값 */
  localValue: unknown;
  /** 서버 버전 타임스탬프 */
  serverTimestamp: string;
}

/** §5.3 충돌 선택지 — 항상 2개만 */
export function getConflictChoices(): Array<{
  resolution: ConflictResolution;
  label: string;
  description: string;
}> {
  return [
    {
      resolution: 'apply_mine',
      label: '내 변경 적용',
      description: '내가 수정한 내용으로 다시 저장해요',
    },
    {
      resolution: 'revert_to_server',
      label: '서버 버전으로 되돌리기',
      description: '다른 사람이 저장한 최신 내용으로 되돌려요',
    },
  ];
}

/* ═══════════════════════════════════════════════
   §5.4 폼 제출 버튼 활성화 검증
   ═══════════════════════════════════════════════ */

export interface SubmitButtonState {
  /** disabled 여부 */
  disabled: boolean;
  /** loading 상태 */
  loading: boolean;
  /** disabled 사유 */
  reason?: string;
}

/**
 * §5.4 제출 버튼 상태 계산
 *
 * @param hasRequiredFields 필수 필드가 모두 채워졌는지
 * @param hasChanges 최초 값에서 변경이 있는지
 * @param isSubmitting 제출 진행 중인지
 */
export function getSubmitButtonState(
  hasRequiredFields: boolean,
  hasChanges: boolean,
  isSubmitting: boolean,
): SubmitButtonState {
  if (isSubmitting) {
    return { disabled: true, loading: true, reason: '저장 중이에요' };
  }
  if (!hasRequiredFields) {
    return { disabled: true, loading: false, reason: '필수 항목을 모두 입력해주세요' };
  }
  if (!hasChanges) {
    return { disabled: true, loading: false, reason: '변경된 내용이 없어요' };
  }
  return { disabled: false, loading: false };
}

/**
 * §5.4 변경 감지 유틸 — 초기값과 현재값 비교
 */
export function detectChanges<T extends Record<string, unknown>>(
  initial: T,
  current: T,
): boolean {
  const keys = new Set([...Object.keys(initial), ...Object.keys(current)]);
  for (const key of keys) {
    if (JSON.stringify(initial[key]) !== JSON.stringify(current[key])) {
      return true;
    }
  }
  return false;
}

/* ═══════════════════════════════════════════════
   §5.5 실패 분류 (표준 코드 체계)
   ═══════════════════════════════════════════════ */

/**
 * §5.5 표준 실패 코드 — 기존 useScreenState의 ErrorCode를 확장
 *
 * 차이점:
 *   - OFFLINE (기존 NETWORK → 더 명확한 이름)
 *   - UNAUTHENTICATED (기존 UNAUTHORIZED)
 *   - INVALID_INPUT (기존 VALIDATION)
 *   - SERVER_ERROR (기존 UNKNOWN)
 */
export type FailureCode =
  | 'OFFLINE'
  | 'TIMEOUT'
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'INVALID_INPUT'
  | 'SERVER_ERROR';

/** §5.5 에러를 표준 코드로 분류 */
export function classifyFailure(error: unknown): FailureCode {
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return 'OFFLINE';
  }
  if (error instanceof DOMException && error.name === 'AbortError') {
    return 'TIMEOUT';
  }

  const status = (error as { status?: number })?.status;
  if (status) {
    if (status === 401) return 'UNAUTHENTICATED';
    if (status === 403) return 'FORBIDDEN';
    if (status === 400 || status === 422) return 'INVALID_INPUT';
    if (status === 408 || status === 504) return 'TIMEOUT';
    if (status >= 500) return 'SERVER_ERROR';
  }

  const msg = (error as { message?: string })?.message?.toLowerCase() || '';
  if (msg.includes('network') || msg.includes('offline')) return 'OFFLINE';
  if (msg.includes('timeout') || msg.includes('timed out')) return 'TIMEOUT';
  if (msg.includes('unauthenticated') || msg.includes('unauthorized')) return 'UNAUTHENTICATED';
  if (msg.includes('forbidden') || msg.includes('permission')) return 'FORBIDDEN';
  if (msg.includes('invalid') || msg.includes('validation')) return 'INVALID_INPUT';

  return 'SERVER_ERROR';
}

/** §5.5 실패 코드별 사용자 문구 (1줄) */
export function getFailureMessage(code: FailureCode): string {
  switch (code) {
    case 'OFFLINE':
      return '네트워크 연결이 끊겼어요';
    case 'TIMEOUT':
      return '응답 시간이 초과되었어요';
    case 'UNAUTHENTICATED':
      return '다시 로그인해주세요';
    case 'FORBIDDEN':
      return '접근 권한이 없어요';
    case 'INVALID_INPUT':
      return '입력 내용을 확인해주세요';
    case 'SERVER_ERROR':
      return '일시적인 오류가 발생했어요';
  }
}

/** §5.5 실패 코드별 다음 행동 (1개만) */
export type FailureAction =
  | { type: 'retry'; label: string }
  | { type: 'login'; label: string }
  | { type: 'fix_input'; label: string }
  | { type: 'contact_support'; label: string };

export function getFailureAction(code: FailureCode): FailureAction {
  switch (code) {
    case 'OFFLINE':
    case 'TIMEOUT':
      return { type: 'retry', label: '다시 시도' };
    case 'UNAUTHENTICATED':
      return { type: 'login', label: '로그인하기' };
    case 'FORBIDDEN':
      return { type: 'contact_support', label: '문의하기' };
    case 'INVALID_INPUT':
      return { type: 'fix_input', label: '입력 수정' };
    case 'SERVER_ERROR':
      return { type: 'retry', label: '다시 시도' };
  }
}
