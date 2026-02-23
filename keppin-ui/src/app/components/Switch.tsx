import { useCallback } from 'react';
import { motion } from 'motion/react';
import { MOTION_TIMING, MOTION_DISTANCE } from './useMotionConfig';

/* TDS Switch (7.3.1)
 * - checked: boolean (on/off)
 * - onChange: (event, checked) => void
 * - disabled: default false
 * - hasTouchEffect: default true (press animation)
 * - name: string (form name)
 * - Accessibility: role="switch", aria-checked, aria-disabled
 * - External label needs aria-label (without "스위치/켜짐/꺼짐")
 *
 * + 제품 운영 확장 4-12, §3 — 선택/토글 운영 규칙:
 * §3.3 라벨: "켜짐/꺼짐" 상태 단어 제외, "대상(무엇을)"만 말하기
 *       컨트롤(Switch)이 상태를 표현하므로 라벨에 상태를 중복하지 않음
 * §3.4 파괴적 선택: Switch로 비가역적 동작 금지 → ConfirmDialog 또는 2단계 확인
 */

interface SwitchProps {
  checked: boolean;
  onChange?: (event: React.MouseEvent<HTMLButtonElement>, checked: boolean) => void;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  name?: string;
  hasTouchEffect?: boolean;
  'aria-label'?: string;
  className?: string;
}

export function Switch({
  checked,
  onChange,
  onClick,
  disabled = false,
  name,
  hasTouchEffect = true,
  'aria-label': ariaLabel,
  className = '',
}: SwitchProps) {
  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (disabled) return;
      onClick?.(e);
      onChange?.(e, !checked);
    },
    [checked, disabled, onChange, onClick]
  );

  return (
    <motion.button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-disabled={disabled || undefined}
      aria-label={ariaLabel}
      name={name}
      onClick={handleClick}
      whileTap={hasTouchEffect && !disabled ? { scale: MOTION_DISTANCE.scaleMin } : undefined} /* §1.4 스케일 0.98 */
      className={`relative rounded-full transition-colors ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'} ${className}`}
      style={{
        width: 51,
        height: 31,
        backgroundColor: checked ? 'var(--toss-switch-on)' : 'var(--toss-switch-off)',
        padding: 2,
        border: 'none',
        minWidth: 44,
        minHeight: 31,
        transitionDuration: `${MOTION_TIMING.small.default}ms`, /* §1.2 작은 전환 175ms */
      }}
    >
      <motion.div
        animate={{
          x: checked ? 20 : 0,
        }}
        transition={{
          type: 'spring',
          stiffness: 500,
          damping: 30,
          duration: MOTION_TIMING.small.default / 1000, /* §1.2 작은 전환 */
        }}
        className="rounded-full shadow-sm"
        style={{
          width: 27,
          height: 27,
          backgroundColor: 'var(--toss-switch-thumb)',
        }}
      />
    </motion.button>
  );
}