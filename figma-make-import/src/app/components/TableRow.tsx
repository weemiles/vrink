/* TDS TableRow Component
 * - Displays data in a left-right 2-column layout
 * - left, right: required (ReactNode)
 * - align: 'space-between' | 'left' (required)
 * - leftRatio: number (optional, percentage of left column width)
 */

interface TableRowProps {
  left: React.ReactNode;
  right: React.ReactNode;
  align: 'space-between' | 'left';
  leftRatio?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function TableRow({
  left,
  right,
  align,
  leftRatio,
  className = '',
  style,
}: TableRowProps) {
  return (
    <div
      className={`flex items-center ${className}`}
      style={{
        minHeight: 44,
        paddingLeft: 24,
        paddingRight: 24,
        gap: align === 'left' ? 8 : 0,
        ...style,
      }}
    >
      <div
        className="shrink-0"
        style={{
          width: leftRatio ? `${leftRatio}%` : undefined,
          minWidth: leftRatio ? undefined : 'auto',
        }}
      >
        {typeof left === 'string' || typeof left === 'number' ? (
          <span className="text-[var(--toss-grey-500)]" style={{ fontSize: 14, lineHeight: '21px' }}>
            {left}
          </span>
        ) : (
          left
        )}
      </div>
      <div
        className={align === 'space-between' ? 'flex-1 text-right' : ''}
      >
        {typeof right === 'string' || typeof right === 'number' ? (
          <span className="text-[var(--toss-grey-900)]" style={{ fontSize: 14, lineHeight: '21px' }}>
            {right}
          </span>
        ) : (
          right
        )}
      </div>
    </div>
  );
}