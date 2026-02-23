import { useMemo } from 'react';
import { useReducedMotionContext } from './useReducedMotionContext';

/**
 * TDS 제품 운영 확장 5-13, §1 — 모션/애니메이션 운영 규칙
 *
 * §1.1 모션 사용 기준
 *   - "상태 변화"를 설명하는 목적일 때만 사용
 *   - 결제/인증/금전/개인정보 입력 화면에서 장식 모션 금지
 *
 * §1.2 기본 모션 시간(ms)
 *   - pressed 피드백: 80~120ms
 *   - 작은 전환(토글, 펼침/접기): 150~200ms
 *   - 화면 전환/오버레이: 200~300ms
 *   - 로딩→완료 강조: 300~450ms
 *
 * §1.3 이징(easing) 규칙
 *   - 기본: ease-out (빠르게 시작, 부드럽게 멈춤)
 *   - 반복/무한 로딩: linear (일정 속도)
 *
 * §1.4 모션 거리/크기 제한
 *   - 마이크로 인터랙션: 최대 12px
 *   - 오버레이 등장: 최대 24px
 *   - 스케일: 0.98~1.02 범위
 *
 * §1.5 Reduce Motion 대응
 *   - 모든 이동/확대 축소 OFF
 *   - opacity 전환만 허용 (150ms)
 *   - 무한 애니메이션 → 정적 상태 대체
 */

/* ─── §1.2 모션 시간 상수 (ms) ─── */

export const MOTION_TIMING = {
  pressed: { min: 80, default: 100, max: 120 },
  small: { min: 150, default: 175, max: 200 },
  screen: { min: 200, default: 250, max: 300 },
  emphasis: { min: 300, default: 375, max: 450 },
} as const;

/* ─── §1.3 이징 규칙 ─── */

export const MOTION_EASING = {
  default: 'easeOut' as const,         // 기본: 빠르게 시작 → 부드럽게 멈춤
  loading: 'linear' as const,            // 반복/무한 로딩: 일정 속도
  spring: { damping: 20, stiffness: 200 }, // Motion 라이브러리용 spring
} as const;

/* ─── §1.4 모션 거리/크기 제한 ─── */

export const MOTION_DISTANCE = {
  micro: 12,         // §1.4 마이크로 인터랙션 최대 12px
  overlay: 24,       // §1.4 오버레이 등장 최대 24px
  scaleMin: 0.98,    // §1.4 스케일 최소
  scaleMax: 1.02,    // §1.4 스케일 최대
} as const;

/* ─── §1.5 Reduce Motion 대체 ─── */

export const REDUCED_MOTION = {
  opacityDuration: 150, // §1.5 opacity 전환만 허용 (ms)
} as const;

/* ─── §1.1 금지 화면 체크 ─── */

const DECORATION_BANNED_SCREENS = [
  'Payment',
  'Auth',
  'Authentication',
  'Login',
  'Transfer',
  'PIIInput',
  'OTP',
  'Verification',
] as const;

/** §1.1 장식 모션이 금지된 화면인지 판단 */
export function isDecorationMotionBanned(screenName: string): boolean {
  return DECORATION_BANNED_SCREENS.some((s) =>
    screenName.toLowerCase().includes(s.toLowerCase()),
  );
}

/* ─── §1.6 모션 QA 체크리스트 ─── */

export interface MotionQACheck {
  /** CTA/금액/에러 메시지가 모션 중 가려지지 않는다 */
  ctaNotObscured: boolean;
  /** 모션 감소 설정에서 기능이 동일하게 동작한다 */
  reducedMotionWorking: boolean;
  /** 로딩/완료 모션이 오해를 만들지 않는다 */
  noMisleadingMotion: boolean;
}

export function checkMotionQA(checks: MotionQACheck): {
  passed: boolean;
  failedItems: string[];
} {
  const failedItems: string[] = [];
  if (!checks.ctaNotObscured) failedItems.push('CTA/금액/에러가 모션 중 가려짐');
  if (!checks.reducedMotionWorking) failedItems.push('Reduce Motion 미대응');
  if (!checks.noMisleadingMotion) failedItems.push('로딩/완료 모션 오해 가능성');
  return { passed: failedItems.length === 0, failedItems };
}

/* ─── 메인 훅 ─── */

export type MotionType = 'pressed' | 'small' | 'screen' | 'emphasis';

interface MotionConfig {
  /** §1.2 지정 유형에 대한 duration (초) */
  duration: (type: MotionType) => number;
  /** §1.3 기본 이징 값 */
  easing: string;
  /** §1.4 안전한 이동 거리 (px) — type에 따라 12 또는 24 */
  safeDistance: (type: 'micro' | 'overlay') => number;
  /** §1.4 안전한 스케일 값 */
  safeScale: (target: number) => number;
  /** §1.5 Reduce Motion 활성 여부 */
  isReduced: boolean;
  /** §1.5 Reduce Motion 안전 transition (Motion 라이브러리용) */
  safeTransition: (type: MotionType) => object;
  /** §1.5 Reduce Motion 안전 animate (이동→opacity만) */
  safeAnimate: (
    normalAnimate: Record<string, unknown>,
  ) => Record<string, unknown>;
  /** §1.1 장식 모션 금지 여부 */
  isDecorationBanned: (screenName: string) => boolean;
}

/**
 * TDS 모션 설정 통합 훅
 *
 * Reduce Motion 상태에 따라 모든 모션 값을 안전하게 반환합니다.
 */
export function useMotionConfig(): MotionConfig {
  const isReduced = useReducedMotionContext();

  return useMemo(
    (): MotionConfig => ({
      duration(type) {
        if (isReduced) return REDUCED_MOTION.opacityDuration / 1000;
        return MOTION_TIMING[type].default / 1000;
      },

      easing: MOTION_EASING.default,

      safeDistance(type) {
        if (isReduced) return 0; // Reduce Motion → 이동 없음
        return type === 'micro' ? MOTION_DISTANCE.micro : MOTION_DISTANCE.overlay;
      },

      safeScale(target) {
        if (isReduced) return 1; // Reduce Motion → 스케일 변환 없음
        return Math.max(
          MOTION_DISTANCE.scaleMin,
          Math.min(MOTION_DISTANCE.scaleMax, target),
        );
      },

      isReduced,

      safeTransition(type) {
        if (isReduced) {
          return { duration: REDUCED_MOTION.opacityDuration / 1000 };
        }
        return {
          duration: MOTION_TIMING[type].default / 1000,
          ease: MOTION_EASING.default,
        };
      },

      safeAnimate(normalAnimate) {
        if (isReduced) {
          // §1.5 이동/확대 → OFF, opacity만 유지
          const safe: Record<string, unknown> = {};
          if ('opacity' in normalAnimate) {
            safe.opacity = normalAnimate.opacity;
          } else {
            safe.opacity = 1;
          }
          return safe;
        }
        return normalAnimate;
      },

      isDecorationBanned: isDecorationMotionBanned,
    }),
    [isReduced],
  );
}