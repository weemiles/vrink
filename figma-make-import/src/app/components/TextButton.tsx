import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { ChevronRight } from 'lucide-react';

/* TDS TextButton (Mobile) — 심화 실무 노트 3, 섹션 1
 * - 텍스트가 곧 액션인 UI에서 사용
 * - size: xsmall | small | medium | large | xlarge | xxlarge
 * - variant: clear(기본) | arrow | underline
 * - disabled: boolean
 *
 * ═══ TDS 컴포넌트 시스템화 보강판 §2.1 Empty 규칙 ═══
 * - Empty 상태의 "섹션 내부 약한 액션"에는 TextButton을 사용한다.
 * - Empty 상태에서 CTA를 제공할 때:
 *   - 페이지 하단 고정 → BottomCTA/FixedBottomCTA
 *   - 섹션 내부 약한 액션 → TextButton
 */

type TextButtonSize = 'xsmall' | 'small' | 'medium' | 'large' | 'xlarge' | 'xxlarge';
type TextButtonVariant = 'clear' | 'arrow' | 'underline';

interface TextButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  size: TextButtonSize;
  variant?: TextButtonVariant;
}

const SIZE_STYLES: Record<TextButtonSize, { fontSize: number; lineHeight: string; arrowSize: number }> = {
  xsmall:  { fontSize: 11, lineHeight: '16.5px', arrowSize: 10 },
  small:   { fontSize: 12, lineHeight: '18px',   arrowSize: 12 },
  medium:  { fontSize: 14, lineHeight: '21px',   arrowSize: 14 },
  large:   { fontSize: 15, lineHeight: '22.5px', arrowSize: 15 },
  xlarge:  { fontSize: 17, lineHeight: '25.5px', arrowSize: 16 },
  xxlarge: { fontSize: 20, lineHeight: '29px',   arrowSize: 18 },
};

export const TextButton = forwardRef<HTMLButtonElement, TextButtonProps>(function TextButton(
  {
    size,
    variant = 'clear',
    disabled = false,
    children,
    className = '',
    style,
    ...props
  },
  ref,
) {
  const sizeStyle = SIZE_STYLES[size];

  return (
    <button
      ref={ref}
      disabled={disabled}
      className={`
        inline-flex items-center gap-0.5 transition-opacity
        ${disabled ? 'cursor-not-allowed' : 'active:opacity-60 cursor-pointer'}
        ${className}
      `}
      style={{
        fontSize: sizeStyle.fontSize,
        lineHeight: sizeStyle.lineHeight,
        fontWeight: 500,
        color: disabled
          ? 'var(--toss-textbutton-disabled)'
          : 'var(--toss-textbutton-color)',
        minHeight: 44,
        minWidth: 44,
        padding: '0 4px',
        background: 'transparent',
        border: 'none',
        textDecoration: variant === 'underline' ? 'underline' : 'none',
        textUnderlineOffset: variant === 'underline' ? '3px' : undefined,
        ...style,
      }}
      aria-disabled={disabled || undefined}
      {...props}
    >
      <span>{children}</span>
      {variant === 'arrow' && (
        <ChevronRight
          size={sizeStyle.arrowSize}
          strokeWidth={2}
          aria-hidden="true"
          style={{ flexShrink: 0 }}
        />
      )}
    </button>
  );
});