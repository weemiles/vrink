import { ChevronLeft, X } from 'lucide-react';
import { useNavigate } from 'react-router';

/**
 * TDS Navigation Bar — 제품 운영 심화 8
 *
 * §1.1 상단 영역 밀도 규칙:
 *   - 우측 아이콘 액션: 최대 2개
 *   - 상단 주요 행동(텍스트 버튼/링크): 최대 1개
 *
 * §1.2 뒤로가기 규칙:
 *   - dirtyWarn: true 이면 뒤로가기 시 onDirtyBack 콜백
 *
 * §1.4 딥링크 진입:
 *   - closeMode: back 대신 닫기(X) 아이콘 표시
 *   - onClose: 닫기 시 앱 홈으로 이동 (기본)
 */

interface NavigationBarProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  transparent?: boolean;
  /** §1.4 딥링크: back 대신 close(X) 아이콘으로 표시 */
  closeMode?: boolean;
  onClose?: () => void;
  /** §1.2 dirty check: 뒤로가기 시 경고가 필요하면 true */
  dirtyWarn?: boolean;
  /** dirty 경고 시 호출 (다이얼로그를 띄우는 등) */
  onDirtyBack?: () => void;
}

/* TDS Navigation Bar: height 44px */
export function NavigationBar({
  title,
  showBack = false,
  onBack,
  rightAction,
  transparent = false,
  closeMode = false,
  onClose,
  dirtyWarn = false,
  onDirtyBack,
}: NavigationBarProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    // §1.2: dirty 상태면 경고 콜백 호출
    if (dirtyWarn && onDirtyBack) {
      onDirtyBack();
      return;
    }
    if (onBack) onBack();
    else navigate(-1);
  };

  const handleClose = () => {
    // §1.4: close 누르면 앱 홈으로
    if (dirtyWarn && onDirtyBack) {
      onDirtyBack();
      return;
    }
    if (onClose) onClose();
    else navigate('/app', { replace: true });
  };

  return (
    <nav
      className={`sticky top-0 z-40 flex items-center justify-between ${transparent ? '' : 'bg-[var(--toss-bg)]'}`}
      style={{ height: 44, paddingLeft: 4, paddingRight: 24 }}
      aria-label={title || '내비게이션'}
    >
      <div className="flex items-center" style={{ minWidth: 44 }}>
        {/* §1.4: closeMode이면 X 아이콘, 아니면 back 화살표 */}
        {closeMode ? (
          <button
            onClick={handleClose}
            className="flex items-center justify-center"
            style={{ width: 44, height: 44 }}
            aria-label="닫기"
          >
            <X size={22} className="text-toss-grey-900" aria-hidden="true" />
          </button>
        ) : showBack ? (
          <button
            onClick={handleBack}
            className="flex items-center justify-center"
            style={{ width: 44, height: 44 }}
            aria-label="뒤로 가기"
          >
            <ChevronLeft size={24} className="text-toss-grey-900" aria-hidden="true" />
          </button>
        ) : null}
      </div>
      {title && (
        <h2 className="absolute left-1/2 -translate-x-1/2 text-toss-grey-900 whitespace-nowrap" style={{ fontSize: 17, fontWeight: 600 }}>
          {title}
        </h2>
      )}
      {/* §1.1: rightAction은 최대 2개 아이콘까지만 배치 */}
      <div className="flex items-center gap-1" style={{ minWidth: 44 }}>
        {rightAction}
      </div>
    </nav>
  );
}