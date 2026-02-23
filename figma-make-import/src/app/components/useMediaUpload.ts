import { useState, useCallback, useRef } from 'react';

/**
 * TDS 제품 운영 확장 (수치 중심) 6, §3 — 콘텐츠/미디어 UX 운영 규칙
 *
 * §3.1 파일 업로드 제한(수치)
 *   - 이미지: 1장 최대 10MB, 긴 변 최대 4096px
 *   - 영상: 1개 최대 200MB, 길이 최대 60초
 *   - 첨부 개수: 한 게시물당 최대 10개
 *
 * §3.2 업로드 상태 머신
 *   - Queued → Uploading → Processing → Done / Failed
 *
 * §3.3 업로드 재시도(backoff)
 *   - 자동 재시도: 최대 3회
 *   - 간격: 1s → 2s → 4s
 *   - 3회 실패 후: 수동 재시도 버튼 + 실패 사유 1줄
 *
 * §3.4 미리보기/재생 규칙
 *   - 자동 재생: 기본 OFF
 *   - 짧은 루프 미리보기: Wi-Fi에서만 ON
 *   - 썸네일 비율: 기본 1:1, 세로 콘텐츠 3:4
 *
 * §3.5 글(긴 문장/약관/공지) 접기 규칙
 *   - 본문 6줄 초과 → 접기/펼치기
 *   - 약관 요약: 상단 2줄 + "전문 보기" 링크
 */

/* ═══════════════════════════════════════════════
   §3.1 업로드 제한 상수
   ═══════════════════════════════════════════════ */

export const UPLOAD_LIMITS = {
  IMAGE: {
    /** 이미지 1장 최대 바이트 (10MB) */
    MAX_SIZE_BYTES: 10 * 1024 * 1024,
    /** 이미지 긴 변 최대 픽셀 */
    MAX_LONG_SIDE_PX: 4096,
    /** 허용 MIME 타입 */
    ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/heic'] as string[],
  },
  VIDEO: {
    /** 영상 1개 최대 바이트 (200MB) */
    MAX_SIZE_BYTES: 200 * 1024 * 1024,
    /** 영상 최대 길이 (초) */
    MAX_DURATION_SEC: 60,
    /** 허용 MIME 타입 */
    ALLOWED_TYPES: ['video/mp4', 'video/webm', 'video/quicktime'] as string[],
  },
  /** 한 게시물/요청당 최대 첨부 개수 */
  MAX_ATTACHMENTS: 10,
} as const;

/** §3.4 썸네일 비율 */
export const THUMBNAIL_ASPECT_RATIOS = {
  /** 기본 (정사각형) */
  DEFAULT: '1:1' as const,
  /** 세로 콘텐츠 (문서/영수증) */
  VERTICAL: '3:4' as const,
} as const;

/** §3.5 접기/펼치기 상수 */
export const TEXT_FOLD_CONFIG = {
  /** 본문 접기 트리거 줄 수 */
  FOLD_THRESHOLD_LINES: 6,
  /** 약관/법적 고지 요약 줄 수 */
  LEGAL_SUMMARY_LINES: 2,
} as const;

/* ═══════════════════════════════════════════════
   §3.1 파일 유효성 검사 유틸리티
   ═══════════════════════════════════════════════ */

export type FileValidationError =
  | 'FILE_TOO_LARGE'
  | 'INVALID_TYPE'
  | 'DIMENSION_TOO_LARGE'
  | 'DURATION_TOO_LONG'
  | 'TOO_MANY_FILES';

interface FileValidationResult {
  valid: boolean;
  errors: Array<{
    code: FileValidationError;
    message: string;
  }>;
}

/** §3.1 이미지 파일 검증 */
export function validateImageFile(file: File): FileValidationResult {
  const errors: FileValidationResult['errors'] = [];

  if (!UPLOAD_LIMITS.IMAGE.ALLOWED_TYPES.includes(file.type)) {
    errors.push({
      code: 'INVALID_TYPE',
      message: `지원하지 않는 이미지 형식이에요 (${file.type})`,
    });
  }

  if (file.size > UPLOAD_LIMITS.IMAGE.MAX_SIZE_BYTES) {
    const maxMB = UPLOAD_LIMITS.IMAGE.MAX_SIZE_BYTES / (1024 * 1024);
    errors.push({
      code: 'FILE_TOO_LARGE',
      message: `이미지 크기는 ${maxMB}MB 이하여야 해요`,
    });
  }

  return { valid: errors.length === 0, errors };
}

/** §3.1 영상 파일 검증 (크기만, 길이는 별도 확인 필요) */
export function validateVideoFile(file: File): FileValidationResult {
  const errors: FileValidationResult['errors'] = [];

  if (!UPLOAD_LIMITS.VIDEO.ALLOWED_TYPES.includes(file.type)) {
    errors.push({
      code: 'INVALID_TYPE',
      message: `지원하지 않는 영상 형식이에요 (${file.type})`,
    });
  }

  if (file.size > UPLOAD_LIMITS.VIDEO.MAX_SIZE_BYTES) {
    const maxMB = UPLOAD_LIMITS.VIDEO.MAX_SIZE_BYTES / (1024 * 1024);
    errors.push({
      code: 'FILE_TOO_LARGE',
      message: `영상 크기는 ${maxMB}MB 이하여야 해요`,
    });
  }

  return { valid: errors.length === 0, errors };
}

/** §3.1 첨부 개수 검증 */
export function validateAttachmentCount(currentCount: number, newCount: number): FileValidationResult {
  const total = currentCount + newCount;
  if (total > UPLOAD_LIMITS.MAX_ATTACHMENTS) {
    return {
      valid: false,
      errors: [{
        code: 'TOO_MANY_FILES',
        message: `첨부 파일은 최대 ${UPLOAD_LIMITS.MAX_ATTACHMENTS}개까지 가능해요`,
      }],
    };
  }
  return { valid: true, errors: [] };
}

/* ═══════════════════════════════════════════════
   §3.2 + §3.3 업로드 상태 머신 + 재시도 훅
   ═══════════════════════════════════════════════ */

/** §3.2 업로드 상태 */
export type UploadStatus = 'queued' | 'uploading' | 'processing' | 'done' | 'failed';

/** §3.3 재시도 간격 (ms) */
const UPLOAD_RETRY_DELAYS = [1000, 2000, 4000];
const MAX_UPLOAD_RETRIES = 3;

export interface UploadItem {
  id: string;
  file: File;
  status: UploadStatus;
  progress: number; // 0 ~ 1
  retryCount: number;
  error?: string;
  url?: string;
}

interface UseFileUploadOptions {
  /** 실제 업로드 함수 */
  uploadFn: (file: File, onProgress: (p: number) => void) => Promise<string>;
  /** 업로드 완료 콜백 */
  onComplete?: (item: UploadItem) => void;
  /** 모든 업로드 완료 콜백 */
  onAllComplete?: (items: UploadItem[]) => void;
}

/**
 * §3.2/§3.3 파일 업로드 훅
 *
 * - 상태 머신: queued → uploading → processing → done / failed
 * - 자동 재시도: 최대 3회, 1s → 2s → 4s 간격
 * - 3회 실패 후 수동 재시도 버튼 노출
 */
export function useFileUpload(options: UseFileUploadOptions) {
  const { uploadFn, onComplete, onAllComplete } = options;
  const [items, setItems] = useState<UploadItem[]>([]);
  const retryTimeoutRefs = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const updateItem = useCallback((id: string, updates: Partial<UploadItem>) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item)),
    );
  }, []);

  const processUpload = useCallback(async (item: UploadItem) => {
    updateItem(item.id, { status: 'uploading', progress: 0 });

    try {
      const url = await uploadFn(item.file, (progress) => {
        updateItem(item.id, { progress });
      });

      // 성공 → processing → done
      updateItem(item.id, { status: 'processing', progress: 1 });
      // 시뮬레이션: processing 200ms 후 done
      setTimeout(() => {
        const completedItem: UploadItem = {
          ...item,
          status: 'done',
          progress: 1,
          url,
        };
        updateItem(item.id, { status: 'done', url });
        onComplete?.(completedItem);
      }, 200);
    } catch (err) {
      const newRetryCount = item.retryCount + 1;

      if (newRetryCount <= MAX_UPLOAD_RETRIES) {
        // §3.3 자동 재시도
        const delay = UPLOAD_RETRY_DELAYS[newRetryCount - 1] ?? 4000;
        updateItem(item.id, {
          retryCount: newRetryCount,
          error: `재시도 중 (${newRetryCount}/${MAX_UPLOAD_RETRIES})`,
        });

        const timer = setTimeout(() => {
          processUpload({ ...item, retryCount: newRetryCount });
        }, delay);
        retryTimeoutRefs.current.set(item.id, timer);
      } else {
        // §3.3 재시도 소진 → 수동 재시도
        const reason = (err as Error)?.message?.includes('network')
          ? '네트워크'
          : (err as Error)?.message?.includes('permission')
          ? '권한'
          : (err as Error)?.message?.includes('size')
          ? '용량'
          : '알 수 없는 오류';

        updateItem(item.id, {
          status: 'failed',
          retryCount: newRetryCount,
          error: `업로드에 실패했어요 (${reason})`,
        });
      }
    }
  }, [uploadFn, updateItem, onComplete]);

  /** 파일 추가 (queued → 자동 업로드 시작) */
  const addFiles = useCallback((files: File[]) => {
    const newItems: UploadItem[] = files.map((file, i) => ({
      id: `upload_${Date.now()}_${i}`,
      file,
      status: 'queued' as const,
      progress: 0,
      retryCount: 0,
    }));

    setItems((prev) => [...prev, ...newItems]);

    // 순차 업로드 시작
    newItems.forEach((item) => {
      processUpload(item);
    });
  }, [processUpload]);

  /** §3.3 수동 재시도 (3회 실패 후) */
  const retryItem = useCallback((id: string) => {
    setItems((prev) => {
      const target = prev.find((i) => i.id === id);
      if (target && target.status === 'failed') {
        processUpload({ ...target, retryCount: 0, status: 'queued' });
      }
      return prev.map((item) =>
        item.id === id ? { ...item, status: 'queued' as const, retryCount: 0, error: undefined } : item,
      );
    });
  }, [processUpload]);

  /** 아이템 제거 */
  const removeItem = useCallback((id: string) => {
    const timer = retryTimeoutRefs.current.get(id);
    if (timer) clearTimeout(timer);
    retryTimeoutRefs.current.delete(id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  /** 전체 초기화 */
  const clearAll = useCallback(() => {
    for (const timer of retryTimeoutRefs.current.values()) {
      clearTimeout(timer);
    }
    retryTimeoutRefs.current.clear();
    setItems([]);
  }, []);

  const isUploading = items.some((i) => i.status === 'uploading' || i.status === 'processing');
  const hasErrors = items.some((i) => i.status === 'failed');
  const allDone = items.length > 0 && items.every((i) => i.status === 'done');

  return {
    items,
    addFiles,
    retryItem,
    removeItem,
    clearAll,
    isUploading,
    hasErrors,
    allDone,
  };
}

/* ═══════════════════════════════════════════════
   §3.4 자동 재생 / 미리보기 유틸
   ═══════════════════════════════════════════════ */

export const AUTOPLAY_CONFIG = {
  /** 기본 자동 재생 OFF */
  DEFAULT_AUTOPLAY: false,
  /** Wi-Fi에서만 짧은 루프 미리보기 허용 */
  ALLOW_LOOP_ON_WIFI_ONLY: true,
} as const;

/**
 * §3.4 현재 네트워크에서 자동 재생이 허용되는지 확인
 * navigator.connection API (비표준이므로 안전하게 fallback)
 */
export function canAutoplay(): boolean {
  if (!AUTOPLAY_CONFIG.DEFAULT_AUTOPLAY) return false;

  try {
    const conn = (navigator as unknown as { connection?: { effectiveType?: string; saveData?: boolean } }).connection;
    if (conn?.saveData) return false;
    if (AUTOPLAY_CONFIG.ALLOW_LOOP_ON_WIFI_ONLY) {
      // effectiveType이 4g이면 Wi-Fi급으로 간주
      return conn?.effectiveType === '4g';
    }
  } catch {
    // API 미지원
  }

  return false;
}

/**
 * §3.4 썸네일 비율 결정
 * @param width 이미지 가로 픽셀
 * @param height 이미지 세로 픽셀
 */
export function getThumbnailAspectRatio(
  width: number,
  height: number,
): typeof THUMBNAIL_ASPECT_RATIOS[keyof typeof THUMBNAIL_ASPECT_RATIOS] {
  // 세로가 가로보다 1.2배 이상 길면 세로 콘텐츠
  if (height > width * 1.2) return THUMBNAIL_ASPECT_RATIOS.VERTICAL;
  return THUMBNAIL_ASPECT_RATIOS.DEFAULT;
}

/* ═══════════════════════════════════════════════
   §3.5 접기/펼치기 유틸
   ═══════════════════════════════════════════════ */

/** §3.5 본문이 접기를 필요로 하는지 */
export function needsFold(lineCount: number): boolean {
  return lineCount > TEXT_FOLD_CONFIG.FOLD_THRESHOLD_LINES;
}

/** §3.5 약관/법적 고지 → 요약 2줄 + 전문 보기 필요 여부 */
export function needsLegalSummary(textLength: number, avgCharsPerLine: number = 30): boolean {
  const estimatedLines = Math.ceil(textLength / avgCharsPerLine);
  return estimatedLines > TEXT_FOLD_CONFIG.LEGAL_SUMMARY_LINES;
}
