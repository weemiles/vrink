import { motion } from 'motion/react';

/* TDS Skeleton Component
 * - pattern: preset layout patterns
 * - custom: array of layout types for custom skeleton
 * - repeatLastItemCount: number | 'infinite' (default 3, max 30)
 * - background: 'white' | 'grey' | 'greyOpacity100' (default 'grey')
 * - play: 'show' | 'hide' (default 'show')
 * - height: string | number (default 'auto')
 */

type SkeletonPattern =
  | 'topList'
  | 'topListWithIcon'
  | 'amountTopList'
  | 'amountTopListWithIcon'
  | 'subtitleList'
  | 'subtitleListWithIcon'
  | 'listOnly'
  | 'listWithIconOnly'
  | 'cardOnly';

type CustomType = 'title' | 'subtitle' | 'list' | 'listWithIcon' | 'card' | `spacer(${number})`;

interface SkeletonProps {
  height?: string | number;
  pattern?: SkeletonPattern;
  custom?: CustomType[];
  repeatLastItemCount?: number | 'infinite';
  play?: 'show' | 'hide';
  background?: 'white' | 'grey' | 'greyOpacity100';
  style?: React.CSSProperties;
  className?: string;
}

const BG_COLORS = {
  white: 'var(--toss-bg)',
  grey: 'var(--toss-grey-100)',
  greyOpacity100: 'var(--toss-grey-opacity-100)',
};

const SHIMMER_COLORS = {
  white: 'var(--toss-grey-200)',
  grey: 'var(--toss-grey-200)',
  greyOpacity100: 'var(--toss-grey-200)',
};

function ShimmerBar({ width, height, borderRadius = 6 }: { width: string | number; height: number; borderRadius?: number }) {
  return (
    <motion.div
      animate={{ opacity: [0.4, 1, 0.4] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
      style={{
        width,
        height,
        borderRadius,
        backgroundColor: 'var(--toss-grey-200)',
      }}
    />
  );
}

function ShimmerCircle({ size }: { size: number }) {
  return (
    <motion.div
      animate={{ opacity: [0.4, 1, 0.4] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: 'var(--toss-grey-200)',
        flexShrink: 0,
      }}
    />
  );
}

/* Individual skeleton row types */
function TitleBlock() {
  return (
    <div style={{ padding: '16px 16px 8px 16px' }}>
      <ShimmerBar width="40%" height={22} borderRadius={6} />
    </div>
  );
}

function SubtitleBlock() {
  return (
    <div style={{ padding: '4px 16px 8px 16px' }}>
      <ShimmerBar width="65%" height={14} borderRadius={4} />
    </div>
  );
}

function ListBlock() {
  return (
    <div className="flex items-center gap-3" style={{ height: 56, paddingLeft: 16, paddingRight: 16 }}>
      <div className="flex-1 space-y-2">
        <ShimmerBar width="60%" height={14} />
        <ShimmerBar width="40%" height={12} />
      </div>
    </div>
  );
}

function ListWithIconBlock() {
  return (
    <div className="flex items-center gap-3" style={{ height: 56, paddingLeft: 16, paddingRight: 16 }}>
      <ShimmerCircle size={44} />
      <div className="flex-1 space-y-2">
        <ShimmerBar width="50%" height={14} />
        <ShimmerBar width="35%" height={12} />
      </div>
    </div>
  );
}

function CardBlock() {
  return (
    <div style={{ padding: '8px 16px' }}>
      <motion.div
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          width: '100%',
          height: 120,
          borderRadius: 16,
          backgroundColor: 'var(--toss-grey-200)',
        }}
      />
    </div>
  );
}

function SpacerBlock({ height }: { height: number }) {
  return <div style={{ height }} />;
}

/* Pattern presets → CustomType[] mapping */
const PATTERN_MAP: Record<SkeletonPattern, CustomType[]> = {
  topList: ['title', 'list', 'list', 'list'],
  topListWithIcon: ['title', 'listWithIcon', 'listWithIcon', 'listWithIcon'],
  amountTopList: ['title', 'subtitle', 'list', 'list', 'list'],
  amountTopListWithIcon: ['title', 'subtitle', 'listWithIcon', 'listWithIcon', 'listWithIcon'],
  subtitleList: ['subtitle', 'list', 'list', 'list'],
  subtitleListWithIcon: ['subtitle', 'listWithIcon', 'listWithIcon', 'listWithIcon'],
  listOnly: ['list', 'list', 'list'],
  listWithIconOnly: ['listWithIcon', 'listWithIcon', 'listWithIcon'],
  cardOnly: ['card'],
};

function renderBlock(type: CustomType, index: number) {
  if (type === 'title') return <TitleBlock key={`title-${index}`} />;
  if (type === 'subtitle') return <SubtitleBlock key={`subtitle-${index}`} />;
  if (type === 'list') return <ListBlock key={`list-${index}`} />;
  if (type === 'listWithIcon') return <ListWithIconBlock key={`listWithIcon-${index}`} />;
  if (type === 'card') return <CardBlock key={`card-${index}`} />;

  // spacer(N)
  const spacerMatch = type.match(/^spacer\((\d+)\)$/);
  if (spacerMatch) {
    return <SpacerBlock key={`spacer-${index}`} height={parseInt(spacerMatch[1], 10)} />;
  }

  return null;
}

export function Skeleton({
  height = 'auto',
  pattern = 'topList',
  custom,
  repeatLastItemCount = 3,
  play = 'show',
  background = 'grey',
  style,
  className = '',
}: SkeletonProps) {
  if (play === 'hide') return null;

  const types = custom || PATTERN_MAP[pattern];
  const maxRepeat = repeatLastItemCount === 'infinite' ? 30 : repeatLastItemCount;

  // Build items: render all types, then repeat the last one
  const blocks: React.ReactNode[] = [];

  types.forEach((type, i) => {
    blocks.push(renderBlock(type, i));
  });

  // Repeat last item
  const lastType = types[types.length - 1];
  if (lastType && maxRepeat > 0) {
    // We already rendered the initial ones, repeat maxRepeat - count_of_last_type_in_original additional times
    for (let i = 0; i < maxRepeat; i++) {
      blocks.push(renderBlock(lastType, types.length + i));
    }
  }

  return (
    <div
      className={className}
      style={{
        height,
        backgroundColor: BG_COLORS[background],
        overflow: 'hidden',
        ...style,
      }}
      role="status"
      aria-label="콘텐츠 로딩 중"
    >
      {blocks}
    </div>
  );
}

/* Individual skeleton shapes for manual composition */
Skeleton.Bar = ShimmerBar;
Skeleton.Circle = ShimmerCircle;