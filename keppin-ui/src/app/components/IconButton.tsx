import { ButtonHTMLAttributes } from 'react';

/* TDS IconButton — §3.2 가이드 작성 규칙 적용 (아토믹)
 *
 * ═══ 1) 상위 타입 (§3.2B) ═══
 * - 용도: 아이콘만 있는 액션 버튼
 * - API 스타일: Flat (§1.4 — 구조 고정)
 * - variant: clear(기본) | fill | border
 *
 * ═══ 2) Worst case (§3.2C) ═══
 * <IconButton aria-label="프로필 편집" variant="fill"
 *   icon={<Edit2/>} iconSize={20} bgColor="..." color="..."
 *   disabled onClick={fn} />
 *
 * ═══ 3) 구성 요소 ═══
 * - clear: 배경 없이 아이콘만. 눌렸을 때 배경색 보임
 * - fill: 배경 채워진 스타일. 눌렸을 때 배경색 사라짐
 * - border: 테두리. 눌렸을 때 배경색 보임
 * - 최소 터치 타겟: 44×44px
 *
 * ═══ 4) §6 표준 통일 ═══
 * - 아이콘만 있는 액션은 반드시 IconButton 사용
 * - aria-label 필수 (TypeScript required prop)
 * - "무엇의 동작인지"까지 포함: "프로필 편집" O, "버튼" X
 *
 * ═══ 5) 접근성 — §3.2D 하단 고정 ═══
 * - aria-label 필수 (TS 레벨 강제)
 * - 장식 아이콘: <span aria-hidden="true"> 내부
 * - disabled: aria-disabled 반영
 * - 큰 텍스트: minWidth/minHeight 44px으로 터치 타겟 보장
 */
type IconButtonVariant = 'clear' | 'fill' | 'border';

interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'color'> {
  'aria-label': string;
  icon: React.ReactNode;
  variant?: IconButtonVariant;
  iconSize?: number;
  bgColor?: string;
  color?: string;
}

export function IconButton({
  icon,
  variant = 'clear',
  iconSize = 24,
  bgColor,
  color,
  className = '',
  style,
  disabled,
  ...props
}: IconButtonProps) {
  const effectiveBgColor = bgColor || 'var(--toss-iconbutton-default-bg)';

  // Touch target: 44x44 minimum
  // Visual size varies by variant
  const containerSize = Math.max(iconSize + 16, 44);

  const getVariantStyles = (): React.CSSProperties => {
    switch (variant) {
      case 'fill':
        return {
          backgroundColor: effectiveBgColor,
          border: 'none',
        };
      case 'border':
        return {
          backgroundColor: 'transparent',
          border: `1px solid var(--toss-iconbutton-border-color)`,
        };
      case 'clear':
      default:
        return {
          backgroundColor: 'transparent',
          border: 'none',
        };
    }
  };

  const getActiveClass = (): string => {
    if (disabled) return '';
    switch (variant) {
      case 'fill':
        // fill: 눌렸을 때 배경 투명
        return 'active:opacity-70';
      case 'border':
      case 'clear':
      default:
        // clear/border: 눌렸을 때 배경색 보임
        return 'active:bg-[var(--toss-iconbutton-default-bg)]';
    }
  };

  return (
    <button
      disabled={disabled}
      className={`
        inline-flex items-center justify-center rounded-full transition-all
        ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
        ${getActiveClass()}
        ${className}
      `}
      style={{
        width: containerSize,
        height: containerSize,
        minWidth: 44,
        minHeight: 44,
        color: color || 'var(--toss-grey-700)',
        ...getVariantStyles(),
        ...style,
      }}
      aria-disabled={disabled || undefined}
      {...props}
    >
      <span
        className="flex items-center justify-center"
        style={{ width: iconSize, height: iconSize }}
        aria-hidden="true"
      >
        {icon}
      </span>
    </button>
  );
}