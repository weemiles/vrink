import { Result } from './Result';
import { TextButton } from './TextButton';
import { TossButton } from './TossButton';

/**
 * TDS EmptyState — §3.2 가이드 작성 규칙 적용 (조합형)
 *
 * ═══ 1) 상위 타입 (§3.2B) ═══
 * - 용도: "아무것도 없음" → **다음 행동을 제시**
 * - API 스타일: Flat (§1.4 — 구조 고정)
 * - variant: page | section | inline
 *
 * ═══ 2) Worst case (§3.2C) ═══
 * <EmptyState variant="page" figure={<img/>}
 *   title="인연이 없어요" description="새로운 인연을 추가해보세요"
 *   actions={[
 *     { label: "새 연락처 추가", onClick: fn, variant: "primary" },
 *     { label: "검색어 지우기", onClick: fn, variant: "text" },
 *   ]} />
 *
 * ═══ 3) 구성 요소 ═══
 * - figure: 상단 시각 요소 (이미지/아이콘) — 장식용
 * - title: 제목 (필수)
 * - description: 설명 텍스트
 * - actions: 다음 행동 CTA 목록 (최소 1개 필수, §2.1)
 *   - page: Result + FixedBottomCTA 패턴
 *   - section: TextButton (약한 액션) 패턴
 *   - inline: 컴팩트 텍스트 + 링크
 *
 * ═══ 4) §2.2 Error / §2.3 Retry 규칙 ═══
 * - "결정 필요 오류"는 Dialog/BottomSheet (Toast 금지)
 * - "재시도 가능 네트워크 오류": 1차 section → 2차 page Result
 * - 재시도 버튼 연속 탭 방지 (useRetryGuard 사용 권장)
 *
 * ═══ 5) 접근성 — §3.2D 하단 고정 ═══
 * - figure: alt="" 장식용
 * - title: heading 태그 (시맨틱)
 * - actions: 각 CTA에 명확한 aria-label
 * - 큰 텍스트: 레이아웃 유지 (flex-wrap)
 */

type EmptyVariant = 'page' | 'section' | 'inline';

interface EmptyAction {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'text';
}

interface EmptyStateProps {
  /** 페이지/섹션/인라인 레벨 */
  variant?: EmptyVariant;
  /** 상단 시각 요소 (이미지/아이콘) — 장식용 */
  figure?: React.ReactNode;
  /** 제목 */
  title: string;
  /** 설명 텍스트 */
  description?: string;
  /** 다음 행동 CTA 목록 — 최소 1개 필수 (TDS §2.1) */
  actions: EmptyAction[];
  /** 추가 className */
  className?: string;
}

export function EmptyState({
  variant = 'page',
  figure,
  title,
  description,
  actions,
  className = '',
}: EmptyStateProps) {
  if (variant === 'inline') {
    return (
      <div className={`flex flex-col items-center text-center py-6 ${className}`}>
        {figure && (
          <div className="mb-3" aria-hidden="true">{figure}</div>
        )}
        <p
          className="text-toss-grey-500"
          style={{ fontSize: 14, lineHeight: '21px' }}
        >
          {title}
        </p>
        {description && (
          <p
            className="text-toss-grey-400 mt-1"
            style={{ fontSize: 12, lineHeight: '18px' }}
          >
            {description}
          </p>
        )}
        {/* §2.1: 최소 1개 다음 행동 — TextButton for inline */}
        {actions.length > 0 && (
          <div className="flex items-center gap-2 mt-3 flex-wrap justify-center">
            {actions.map((action, i) => (
              <TextButton
                key={i}
                size="medium"
                variant="clear"
                onClick={action.onClick}
              >
                {action.label}
              </TextButton>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (variant === 'section') {
    return (
      <div className={`flex flex-col items-center text-center py-8 ${className}`}>
        {figure && (
          <div className="mb-4" aria-hidden="true">{figure}</div>
        )}
        <p
          className="text-toss-grey-700"
          style={{ fontSize: 15, fontWeight: 600, lineHeight: '22.5px' }}
        >
          {title}
        </p>
        {description && (
          <p
            className="text-toss-grey-500 mt-1"
            style={{ fontSize: 13, lineHeight: '19.5px' }}
          >
            {description}
          </p>
        )}
        {actions.length > 0 && (
          <div className="flex items-center gap-2 mt-4 flex-wrap justify-center">
            {actions.map((action, i) => {
              if (action.variant === 'text') {
                return (
                  <TextButton
                    key={i}
                    size="medium"
                    variant="clear"
                    onClick={action.onClick}
                  >
                    {action.label}
                  </TextButton>
                );
              }
              return (
                <TossButton
                  key={i}
                  variant="weak"
                  color={action.variant === 'primary' ? 'primary' : 'light'}
                  size="small"
                  onClick={action.onClick}
                >
                  {action.label}
                </TossButton>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  /* page variant — Result 기반 */
  return (
    <div className={className}>
      <Result
        figure={figure}
        title={title}
        description={description}
        button={
          actions.length > 0 ? (
            <div className="flex items-center gap-2 flex-wrap justify-center">
              {actions.map((action, i) => (
                <Result.Button
                  key={i}
                  variant={action.variant === 'secondary' ? 'secondary' : 'primary'}
                  onClick={action.onClick}
                >
                  {action.label}
                </Result.Button>
              ))}
            </div>
          ) : undefined
        }
      />
    </div>
  );
}