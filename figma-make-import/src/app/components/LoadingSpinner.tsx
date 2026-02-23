import { motion } from 'motion/react';
import { useReducedMotionContext } from './useReducedMotionContext';
import { MOTION_TIMING, REDUCED_MOTION, MOTION_EASING } from './useMotionConfig';

/**
 * TDS Loading Pattern: 3 sequential animated indicators
 *
 * §1.3 (제품 운영 확장 5-13): Reduce Motion 대응
 *   - 이동/확대 OFF, 무한 애니메이션 → 정적 상태
 *   - opacity 전환만 허용 (150ms)
 *
 * §1.3 이징: 반복/무한 로딩 → linear (일정 속도)
 */

interface LoadingSpinnerProps {
  size?: number;
  fullScreen?: boolean;
  message?: string;
}

export function LoadingSpinner({ size = 32, fullScreen = false, message }: LoadingSpinnerProps) {
  const prefersReduced = useReducedMotionContext();
  const dotSize = Math.max(8, size * 0.25);

  const spinner = (
    <div className="flex flex-col items-center gap-3" role="status" aria-label={message || '로딩 중'}>
      <div className="flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          prefersReduced ? (
            // §1.5 Reduce Motion: 정적 상태 — opacity만 변경
            <motion.div
              key={i}
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{
                duration: REDUCED_MOTION.opacityDuration / 1000 * 4,
                repeat: Infinity,
                delay: i * 0.15,
                ease: MOTION_EASING.loading,
              }}
              className="rounded-full bg-toss-blue"
              style={{ width: dotSize, height: dotSize }}
            />
          ) : (
            <motion.div
              key={i}
              animate={{
                scale: [1, 1.02, 1], // §1.4 스케일 0.98~1.02 범위
                opacity: [0.4, 1, 0.4],
              }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                delay: i * 0.15,
                ease: MOTION_EASING.loading, // §1.3 무한 로딩: linear
              }}
              className="rounded-full bg-toss-blue"
              style={{ width: dotSize, height: dotSize }}
            />
          )
        ))}
      </div>
      {message && (
        <p className="text-toss-grey-500" style={{ fontSize: 14 }}>{message}</p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[var(--toss-bg)] z-50" role="status" aria-label={message || '로딩 중'}>
        {spinner}
      </div>
    );
  }

  return <div className="flex items-center justify-center py-8">{spinner}</div>;
}

export function SkeletonLine({ width = '100%', height = 16 }: { width?: string | number; height?: number }) {
  const prefersReduced = useReducedMotionContext();

  if (prefersReduced) {
    // §1.5 Reduce Motion: 정적 상태
    return (
      <div
        className="rounded-lg bg-toss-grey-100"
        style={{ width, height, opacity: 0.7 }}
      />
    );
  }

  return (
    <motion.div
      animate={{ opacity: [0.4, 1, 0.4] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: MOTION_EASING.loading }}
      className="rounded-lg bg-toss-grey-100"
      style={{ width, height }}
    />
  );
}

/* TDS Contact Skeleton — listWithIcon pattern */
export function ContactSkeleton() {
  return (
    <div className="flex items-center gap-3" style={{ height: 56, paddingLeft: 24, paddingRight: 24 }} role="status" aria-label="로딩 중">
      <SkeletonLine width={44} height={44} />
      <div className="flex-1 space-y-2">
        <SkeletonLine width="40%" height={14} />
        <SkeletonLine width="60%" height={12} />
      </div>
    </div>
  );
}

/* TDS Card Skeleton */
export function CardSkeleton() {
  const prefersReduced = useReducedMotionContext();

  if (prefersReduced) {
    return (
      <div
        className="rounded-2xl bg-toss-grey-200"
        style={{ height: 120, width: '100%', opacity: 0.7 }}
        role="status"
        aria-label="로딩 중"
      />
    );
  }

  return (
    <motion.div
      animate={{ opacity: [0.4, 1, 0.4] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: MOTION_EASING.loading }}
      className="rounded-2xl bg-toss-grey-200"
      style={{ height: 120, width: '100%' }}
      role="status"
      aria-label="로딩 중"
    />
  );
}

/* TDS Profile Skeleton — for detail page header */
export function ProfileSkeleton() {
  return (
    <div className="flex flex-col items-center py-6" role="status" aria-label="프로필 로딩 중">
      <SkeletonLine width={72} height={72} />
      <div className="mt-3">
        <SkeletonLine width={80} height={22} />
      </div>
      <div className="mt-2">
        <SkeletonLine width={120} height={14} />
      </div>
    </div>
  );
}