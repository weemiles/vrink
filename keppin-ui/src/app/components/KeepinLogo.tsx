/**
 * KeepinLogo — keepin 브랜드 커스텀 로고 마크
 *
 * 디자인 컨셉: "Connection K"
 * - 세로 줄기(Stem): 나 자신, 중심축
 * - 두 개의 곡선 팔(Arms): 관계의 연결선
 * - 끝단 노드(Dots): 연결된 사람들
 * - 전체 형태가 "K"(keepin)를 이루면서 동시에
 *   사람과 사람 사이의 연결(인연)을 시각적으로 표현
 *
 * Props:
 *  size    — 렌더링 크기 (px, default 32)
 *  className — 색상 등 Tailwind 클래스 (currentColor 기반)
 */

interface KeepinLogoProps {
  size?: number;
  className?: string;
}

export function KeepinLogo({ size = 32, className }: KeepinLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      {/* Vertical stem — "나", 중심 */}
      <line
        x1="12"
        y1="9"
        x2="12"
        y2="39"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
      />
      {/* Upper connection arm — 곡선으로 유기적/따뜻한 느낌 */}
      <path
        d="M14.5 24 Q24 15 34 10"
        stroke="currentColor"
        strokeWidth="3.8"
        strokeLinecap="round"
        fill="none"
      />
      {/* Lower connection arm */}
      <path
        d="M14.5 24 Q24 33 34 38"
        stroke="currentColor"
        strokeWidth="3.8"
        strokeLinecap="round"
        fill="none"
      />
      {/* Upper people node */}
      <circle cx="34" cy="10" r="4.8" fill="currentColor" />
      {/* Lower people node */}
      <circle cx="34" cy="38" r="4.8" fill="currentColor" />
    </svg>
  );
}

/**
 * KeepinAppIcon — 라운드 스퀘어 안에 로고 마크가 들어간 앱 아이콘
 *
 * variant:
 *  'blue'  — 파란 배경 + 흰 마크 (로그인, 회원가입 등)
 *  'white' — 흰 배경 + 파란 마크 (스플래시 등)
 */
interface KeepinAppIconProps {
  size?: number;
  variant?: 'blue' | 'white';
  borderRadius?: number;
  className?: string;
}

export function KeepinAppIcon({
  size = 52,
  variant = 'blue',
  borderRadius = 16,
  className = '',
}: KeepinAppIconProps) {
  const markSize = Math.round(size * 0.5);

  const bgClass = variant === 'blue' ? 'bg-toss-blue' : 'bg-[var(--toss-bg)]';
  const markClass = variant === 'blue' ? 'text-[var(--primary-foreground)]' : 'text-toss-blue';

  return (
    <div
      className={`flex items-center justify-center ${bgClass} ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius,
      }}
    >
      <KeepinLogo size={markSize} className={markClass} />
    </div>
  );
}