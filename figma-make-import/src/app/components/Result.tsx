import { ButtonHTMLAttributes } from 'react';

/* TDS Result — §3.2 가이드 작성 규칙 적용 (조합형)
 *
 * ═══ 1) 상위 타입 (§3.2B) ═══
 * - 용도: 성공/실패/대기 결과를 "페이지 레벨"로 안내
 * - API 스타일: Hybrid (§1.4 — Result.Button compound 패턴)
 *
 * ═══ 2) Worst case (§3.2C) ═══
 * <Result figure={<img alt=""/>} title="완료" description="상세 설명"
 *   button={
 *     <div className="flex gap-2">
 *       <Result.Button variant="secondary" onClick={fn}>보조</Result.Button>
 *       <Result.Button variant="primary" onClick={fn}>주요</Result.Button>
 *     </div>
 *   }
 * />
 *
 * ═══ 3) 구성 요소 ═══
 * - figure: 상단 시각 요소 (이미지/아이콘) — 장식용
 * - title: h5 헤딩 (필수)
 * - description: 부가 설명
 * - button: CTA 슬롯 (Result.Button)
 *
 * ═══ 4) §2.2 Error 규칙 ═══
 * - "재시도 가능 오류": 1차 section → 2차 Result + Result.Button
 * - "결정 필요 오류": Dialog 격상 (Toast 금지)
 * - 재시도: useRetryGuard 사용 권장
 *
 * ═══ 5) 접근성 — §3.2D 하단 고정 ═══
 * - title → <h5> 시맨틱 헤딩
 * - figure 이미지 → 장식용 alt=""
 * - Result.Button → <button> 네이티브
 * - 큰 텍스트: 텍스트/버튼 영역 flex-wrap
 */

interface ResultProps {
  figure?: React.ReactNode;
  title?: React.ReactNode;
  description?: React.ReactNode;
  button?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

interface ResultButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
}

function ResultButton({
  children,
  variant = 'primary',
  className = '',
  style,
  ...props
}: ResultButtonProps) {
  const isPrimary = variant === 'primary';

  return (
    <button
      className={`
        flex items-center justify-center transition-colors
        ${isPrimary
          ? 'bg-toss-blue text-[var(--primary-foreground)] active:bg-toss-blue-600'
          : 'bg-toss-grey-100 text-toss-grey-800 active:bg-toss-grey-200'
        }
        ${className}
      `}
      style={{
        height: 48,
        borderRadius: 12,
        fontSize: 15,
        fontWeight: 600,
        padding: '0 24px',
        minWidth: 120,
        minHeight: 44,
        border: 'none',
        cursor: 'pointer',
        ...style,
      }}
      {...props}
    >
      {children}
    </button>
  );
}

export function Result({
  figure,
  title,
  description,
  button,
  className = '',
  style,
}: ResultProps) {
  return (
    <div
      className={`flex flex-col items-center text-center ${className}`}
      style={{
        padding: '48px 24px',
        ...style,
      }}
      role="status"
      aria-label={typeof title === 'string' ? title : undefined}
    >
      {/* Figure — 장식용 이미지/아이콘 */}
      {figure && (
        <div
          className="mb-5 flex items-center justify-center"
          aria-hidden="true"
        >
          {figure}
        </div>
      )}

      {/* Title — TDS: h5 헤딩 */}
      {title && (
        <h5
          style={{
            fontSize: 'var(--toss-result-title-size)',
            fontWeight: 700,
            color: 'var(--toss-result-title-color)',
            lineHeight: 1.4,
            margin: 0,
          }}
        >
          {title}
        </h5>
      )}

      {/* Description */}
      {description && (
        <p
          className="mt-2"
          style={{
            fontSize: 'var(--toss-result-desc-size)',
            color: 'var(--toss-result-desc-color)',
            lineHeight: 1.6,
            whiteSpace: 'pre-line',
            margin: 0,
            marginTop: 8,
          }}
        >
          {description}
        </p>
      )}

      {/* Button — Result.Button */}
      {button && (
        <div className="mt-6 flex gap-2">
          {button}
        </div>
      )}
    </div>
  );
}

Result.Button = ResultButton;