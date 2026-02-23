import React, { ButtonHTMLAttributes, useState } from 'react';
import { Plus } from 'lucide-react';

/* TDS ListFooter — §3.2 가이드 작성 규칙 적용 (조합형)
 *
 * ═══ 1) 상위 타입 (§3.2B) ═══
 * - 용도: 리스트 끝에서 "더 보기/더 불러오기" 액션
 * - API 스타일: Flat (§1.4 — 구조 고정)
 * - border: full | indented | none
 *
 * ═══ 2) Worst case (§3.2C) ═══
 * <ListFooter aria-label="나머지 15명 더 보기" border="indented"
 *   icon={<Plus/>} textColor="blue" iconColor="blue"
 *   loading disabled onClick={fn}>
 *   15명 더 보기
 * </ListFooter>
 *
 * ═══ 3) 구성 요소 ═══
 * - icon: 좌측 아이콘 (기본 Plus)
 * - children: 텍스트/React 요소
 * - loading 시 자동 disabled (중복 요청 방지 §2.3)
 * - hairline/shadow: 하위 컴포넌트 슬롯 (구분선/그림자)
 *
 * ═══ 4) §6 표준 통일 ═══
 * - 리스트 확장은 반드시 ListFooter로 통일
 * - aria-label에 "무엇의 더보기인지"까지 포함
 *
 * ═══ 5) 접근성 — §3.2D 하단 고정 ═══
 * - aria-label 필수 (TS 레벨 강제)
 * - loading 시 aria-busy, disabled 반영
 * - 최소 터치 타겟 48px
 */
type ListFooterBorder = 'full' | 'indented' | 'none';

interface ListFooterProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  'aria-label': string;
  border?: ListFooterBorder;
  icon?: React.ReactNode;
  hairline?: React.ReactElement;
  shadow?: React.ReactElement;
  textColor?: string;
  iconColor?: string;
  children?: React.ReactNode;
  loading?: boolean;
}

interface HairlineProps {
  indent?: number;
  style?: React.CSSProperties;
}

interface ShadowProps {
  style?: React.CSSProperties;
}

function Hairline({ indent = 0, style }: HairlineProps) {
  return (
    <div
      style={{
        height: 1,
        backgroundColor: 'var(--toss-listfooter-border-color)',
        marginLeft: indent,
        ...style,
      }}
    />
  );
}

function Shadow({ style }: ShadowProps) {
  return (
    <div
      className="absolute inset-0 rounded-lg pointer-events-none"
      style={{
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        ...style,
      }}
    />
  );
}

function ListFooterText({ children }: { children: React.ReactNode }) {
  return <span>{children}</span>;
}

function ListFooterIcon({ children }: { children: React.ReactNode }) {
  return <span className="flex items-center justify-center">{children}</span>;
}

export function ListFooter({
  border = 'full',
  icon,
  hairline,
  shadow,
  textColor,
  iconColor,
  children,
  loading = false,
  onClick,
  disabled,
  className = '',
  style,
  ...props
}: ListFooterProps) {
  const [pressed, setPressed] = useState(false);
  const effectiveTextColor = textColor || 'var(--toss-listfooter-text-color)';
  const effectiveIconColor = iconColor || 'var(--toss-listfooter-icon-color)';

  // Determine border rendering
  const renderBorder = () => {
    if (hairline) return hairline;
    switch (border) {
      case 'full':
        return <Hairline />;
      case 'indented':
        return <Hairline indent={24} />;
      case 'none':
        return null;
    }
  };

  // Determine icon rendering
  const renderIcon = () => {
    if (!icon) return null;
    if (typeof icon === 'string') {
      // Default: plus icon for "more" pattern
      return (
        <Plus
          size={16}
          style={{ color: effectiveIconColor }}
          aria-hidden="true"
        />
      );
    }
    return <span style={{ color: effectiveIconColor }}>{icon}</span>;
  };

  const isDisabled = disabled || loading;

  return (
    <div className={className}>
      {/* Top border */}
      {renderBorder()}

      {/* Button area */}
      <div className="relative">
        {shadow}
        <button
          onClick={onClick}
          disabled={isDisabled}
          className={`
            w-full flex items-center justify-center gap-1.5 transition-colors
            ${isDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
          `}
          style={{
            minHeight: 48,
            padding: '12px 24px',
            color: effectiveTextColor,
            fontSize: 14,
            fontWeight: 500,
            backgroundColor: pressed && !isDisabled ? 'var(--toss-listfooter-pressed-bg)' : 'transparent',
            border: 'none',
            ...style,
          }}
          onPointerDown={() => setPressed(true)}
          onPointerUp={() => setPressed(false)}
          onPointerLeave={() => setPressed(false)}
          {...props}
        >
          {renderIcon()}
          {loading ? (
            <span className="flex items-center gap-1">
              <LoadingDots color={effectiveTextColor} />
            </span>
          ) : (
            typeof children === 'string' ? (
              <ListFooterText>{children}</ListFooterText>
            ) : (
              children
            )
          )}
        </button>
      </div>
    </div>
  );
}

// Simple loading dots for list footer
function LoadingDots({ color }: { color: string }) {
  return (
    <span className="flex items-center gap-1" aria-label="로딩 중">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="inline-block rounded-full"
          style={{
            width: 4,
            height: 4,
            backgroundColor: color,
            animation: `listfooter-pulse 0.8s ease-in-out ${i * 0.15}s infinite`,
            opacity: 0.3,
          }}
        />
      ))}
      <style>{`
        @keyframes listfooter-pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
      `}</style>
    </span>
  );
}

// Sub-components
ListFooter.Hairline = Hairline;
ListFooter.Shadow = Shadow;
ListFooter.Text = ListFooterText;
ListFooter.Icon = ListFooterIcon;