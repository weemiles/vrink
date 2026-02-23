/* TDS ProgressBar (Mobile) — 심화 실무 노트 4, 섹션 1
 * - 데이터 로딩, 업로드/다운로드, 단계형 작업 진행률(%)
 * - progress: number (0.0 ~ 1.0, 필수)
 * - size: 'light' (2px) | 'normal' (4px) | 'bold' (8px) — 기본 'normal'
 * - color: string (기본 colors.blue400)
 * - animate: boolean (기본 false) — true면 부드러운 transition
 */

type ProgressBarSize = 'light' | 'normal' | 'bold';

interface ProgressBarProps {
  progress: number;
  size?: ProgressBarSize;
  color?: string;
  animate?: boolean;
  className?: string;
  style?: React.CSSProperties;
  'aria-label'?: string;
}

const SIZE_MAP: Record<ProgressBarSize, string> = {
  light: 'var(--toss-progressbar-height-light)',
  normal: 'var(--toss-progressbar-height-normal)',
  bold: 'var(--toss-progressbar-height-bold)',
};

export function ProgressBar({
  progress,
  size = 'normal',
  color,
  animate = false,
  className = '',
  style,
  'aria-label': ariaLabel = '진행률',
}: ProgressBarProps) {
  // Clamp progress between 0 and 1
  const clampedProgress = Math.max(0, Math.min(1, progress));
  const heightVar = SIZE_MAP[size];
  const fillColor = color || 'var(--toss-progressbar-fill)';

  return (
    <div
      className={`w-full overflow-hidden ${className}`}
      style={{
        height: heightVar,
        backgroundColor: 'var(--toss-progressbar-bg)',
        borderRadius: 'var(--toss-progressbar-radius)',
        ...style,
      }}
      role="progressbar"
      aria-valuenow={Math.round(clampedProgress * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={ariaLabel}
    >
      <div
        style={{
          width: `${clampedProgress * 100}%`,
          height: '100%',
          backgroundColor: fillColor,
          borderRadius: 'var(--toss-progressbar-radius)',
          transition: animate ? 'width 0.4s cubic-bezier(0.33, 1, 0.68, 1)' : 'none',
        }}
      />
    </div>
  );
}
