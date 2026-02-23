import { ButtonHTMLAttributes } from 'react';
import { motion } from 'motion/react';
import { MOTION_TIMING, MOTION_EASING } from './useMotionConfig';

/* TDS TossButton — §3.2 가이드 작성 규칙 적용 (아토믹)
 *
 * ═══ 1) 상위 타입 (§3.2B) ═══
 * - API 스타일: Flat (§1.4 — 구조 고정, 고빈도)
 * - variant: fill | weak
 * - color: primary | danger | light | dark
 * - size: small(32) | medium(40) | large(48) | xlarge(56)
 * - display: inline | block | full
 *
 * ═══ 2) Worst case (§3.2C) ═══
 * <TossButton variant="fill" color="danger" size="xlarge"
 *   display="full" loading disabled onClick={fn}>
 *   텍스트
 * </TossButton>
 *
 * ═══ 3) 구성 요소 ═══
 * - 터치 피드백: pressed scale 0.98 (80~120ms, §1.2)
 * - loading: 텍스트 투명 + 스피너 오버레이 + disabled 동시
 * - borderRadius: size별 8/10/12/14
 *
 * ═══ 4) 접근성 — §3.2D 하단 고정 ═══
 * - loading 시 aria-label="로딩 중" 자동
 * - disabled 시 aria-disabled 반영
 * - 큰 텍스트: minHeight으로 터치 타겟 보장
 */

type ButtonColor = 'primary' | 'danger' | 'light' | 'dark';
type ButtonVariant = 'fill' | 'weak';
type ButtonSize = 'small' | 'medium' | 'large' | 'xlarge';
type ButtonDisplay = 'inline' | 'block' | 'full';

interface TossButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  color?: ButtonColor;
  size?: ButtonSize;
  display?: ButtonDisplay;
  /** @deprecated Use display="full" instead */
  fullWidth?: boolean;
  loading?: boolean;
}

const SIZES: Record<ButtonSize, { height: number; fontSize: number; padding: string; borderRadius: number }> = {
  small: { height: 32, fontSize: 13, padding: '0 12px', borderRadius: 8 },
  medium: { height: 40, fontSize: 14, padding: '0 16px', borderRadius: 10 },
  large: { height: 48, fontSize: 15, padding: '0 16px', borderRadius: 12 },
  xlarge: { height: 56, fontSize: 16, padding: '0 20px', borderRadius: 14 },
};

const COLOR_STYLES: Record<ButtonColor, Record<ButtonVariant, { base: string; disabled: string }>> = {
  primary: {
    fill: {
      base: 'bg-toss-blue text-[var(--primary-foreground)] active:bg-toss-blue-600',
      disabled: 'bg-toss-grey-200 text-toss-grey-400 cursor-not-allowed',
    },
    weak: {
      base: 'bg-toss-blue-50 text-toss-blue active:bg-toss-blue-100',
      disabled: 'bg-toss-grey-100 text-toss-grey-400 cursor-not-allowed',
    },
  },
  danger: {
    fill: {
      base: 'bg-toss-red text-white active:bg-toss-red-100',
      disabled: 'bg-toss-grey-200 text-toss-grey-400 cursor-not-allowed',
    },
    weak: {
      base: 'bg-toss-red-light text-toss-red active:bg-toss-red-100',
      disabled: 'bg-toss-grey-100 text-toss-grey-400 cursor-not-allowed',
    },
  },
  light: {
    fill: {
      base: 'bg-toss-grey-100 text-toss-grey-800 active:bg-toss-grey-200',
      disabled: 'bg-toss-grey-100 text-toss-grey-400 cursor-not-allowed',
    },
    weak: {
      base: 'bg-toss-grey-50 text-toss-grey-700 active:bg-toss-grey-100',
      disabled: 'bg-toss-grey-50 text-toss-grey-400 cursor-not-allowed',
    },
  },
  dark: {
    fill: {
      base: 'bg-toss-grey-900 text-[var(--primary-foreground)] active:bg-toss-grey-800',
      disabled: 'bg-toss-grey-200 text-toss-grey-400 cursor-not-allowed',
    },
    weak: {
      base: 'bg-toss-grey-800 text-toss-grey-100 active:bg-toss-grey-700',
      disabled: 'bg-toss-grey-100 text-toss-grey-400 cursor-not-allowed',
    },
  },
};

/* TDS Loading indicator: 3 dots that animate sequentially */
function ButtonLoader({ color = 'white', size = 6 }: { color?: string; size?: number }) {
  return (
    <div className="flex items-center gap-1" role="status" aria-label="로딩 중">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            delay: i * 0.15,
            ease: MOTION_EASING.loading, /* §1.3 반복 로딩: linear */
          }}
          style={{
            width: size,
            height: size,
            borderRadius: '50%',
            backgroundColor: color,
          }}
        />
      ))}
    </div>
  );
}

export function TossButton({
  variant = 'fill',
  color = 'primary',
  size = 'large',
  display = 'inline',
  fullWidth,
  loading = false,
  className = '',
  children,
  disabled,
  'aria-label': ariaLabel,
  ...props
}: TossButtonProps) {
  const sizeStyle = SIZES[size];
  const colorStyle = COLOR_STYLES[color][variant];
  const isDisabled = disabled || loading;
  const effectiveDisplay = fullWidth ? 'full' : display;

  const displayClasses = {
    inline: '',
    block: 'w-full',
    full: 'w-full',
  };

  const loaderColor = variant === 'fill'
    ? (color === 'light' ? 'var(--toss-grey-800)' : 'var(--primary-foreground)')
    : (color === 'primary' ? 'var(--toss-blue-500)'
       : color === 'danger' ? 'var(--toss-red-500)'
       : 'var(--toss-grey-700)');

  return (
    <button
      className={`flex items-center justify-center transition-colors ${
        isDisabled ? colorStyle.disabled : colorStyle.base
      } ${displayClasses[effectiveDisplay]} ${className}`}
      style={{
        height: sizeStyle.height,
        fontSize: sizeStyle.fontSize,
        fontWeight: 600,
        padding: sizeStyle.padding,
        borderRadius: sizeStyle.borderRadius,
        minWidth: 44,
        minHeight: 44,
        transitionDuration: `${MOTION_TIMING.pressed.default}ms`, /* §1.2 pressed 피드백 100ms */
      }}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      aria-label={ariaLabel || (loading && !children ? '로딩 중' : undefined)}
      aria-disabled={isDisabled || undefined}
      {...props}
    >
      {loading ? (
        <ButtonLoader color={loaderColor} size={size === 'small' ? 5 : 6} />
      ) : (
        children
      )}
    </button>
  );
}