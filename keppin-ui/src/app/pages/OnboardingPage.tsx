import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users, Cake, Bell,
  ChevronRight, ChevronLeft, Shield, Check, Star,
} from 'lucide-react';
import { TossButton } from '../components/TossButton';
import { KeppinLogo } from '../components/KeppinLogo';
import { BottomSheet } from '../components/BottomSheet';
import { MOTION_TIMING } from '../components/useMotionConfig';
import { useReducedMotion } from '../components/usePerformanceUX';

/* 3D 아이콘 이미지 */
import networkIcon3D from "../../assets/figma/07544c11520718b7c584d0532129557f3870e4e5.png";
import phoneIcon3D from "../../assets/figma/ee0517f2109ad677a122e3ee999995a8e8c60c2a.png";
import giftIcon3D from "../../assets/figma/53d775e7fc7b6422683fe2d3018781c32a068742.png";

/**
 * 온보딩 인트로 페이지
 *
 * TDS §5.2 온보딩:
 * - 첫 가치 도달까지 최대 5화면
 * - 3단계 슬라이드 + 동의 바텀시트
 *
 * TDS 가드레일:
 * - 8pt 그리드, 반응형 모바일 너비
 * - 좌우 패딩 24px
 * - 터치 영역 최소 44×44px
 * - 그라데이션 미사용
 */

const ONBOARDING_INTRO_KEY = '__onboarding_intro_done';

export function isOnboardingIntroDone(): boolean {
  try {
    return localStorage.getItem(ONBOARDING_INTRO_KEY) === 'true';
  } catch {
    return false;
  }
}

function markOnboardingIntroDone() {
  try {
    localStorage.setItem(ONBOARDING_INTRO_KEY, 'true');
  } catch {
    // silent
  }
}

/* ─── 동의 항목 타입 ─── */
interface ConsentItem {
  id: string;
  label: string;
  required: boolean;
  description?: string;
  checked: boolean;
}

/* ─── 슬라이드 데이터 ─── */
const SLIDES = [
  {
    icon: Users,
    iconBg: 'var(--toss-blue-50)',
    iconColor: 'text-toss-blue',
    image3D: networkIcon3D,
    title: '소중한 사람들을\n한곳에서 관리하세요',
    description: '흩어진 연락처와 인연 정보를\nkeppin에서 깔끔하게 정리할 수 있어요',
  },
  {
    icon: Cake,
    iconBg: 'var(--toss-orange-50)',
    iconColor: 'text-toss-orange',
    image3D: giftIcon3D,
    title: '생일과 기념일을\n놓치지 마세요',
    description: '중요한 날을 미리 알려드려서\n소중한 사람에게 먼저 연락할 수 있어요',
  },
  {
    icon: Bell,
    iconBg: 'var(--toss-green-50)',
    iconColor: 'text-toss-green',
    image3D: phoneIcon3D,
    title: '연락이 뜸한 사람도\n챙겨드려요',
    description: '오랫동안 연락하지 못한 사람을\n알려드려서 관계를 유지할 수 있어요',
  },
  {
    icon: Star,
    iconBg: 'var(--toss-grey-100)',
    iconColor: 'text-toss-grey-600',
    image3D: null,
    title: '중요한 인연에\n별점을 매겨보세요',
    description: '관계의 깊이를 한눈에 파악하고\n더 의미 있는 네트워크를 만들어가요',
  },
] as const;

const SWIPE_THRESHOLD_PX = 48;
const SWIPE_DIRECTION_RATIO = 1.15;

export function OnboardingPage() {
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [showConsent, setShowConsent] = useState(false);
  const gestureStartRef = useRef<{ x: number; y: number } | null>(null);

  /* ─── 동의 항목 상태 ─── */
  const [consents, setConsents] = useState<ConsentItem[]>([
    {
      id: 'terms',
      label: '서비스 이용약관 동의',
      required: true,
      description: '서비스 이용을 위해 반드시 필요해요',
      checked: false,
    },
    {
      id: 'privacy',
      label: '개인정보 처리방침 동의',
      required: true,
      description: '연락처 정보를 안전하게 보호해요',
      checked: false,
    },
    {
      id: 'contacts',
      label: '연락처 접근 동의',
      required: true,
      description: '휴대폰 연락처를 가져오기 위해 필요해요',
      checked: false,
    },
    {
      id: 'marketing',
      label: '마케팅 정보 수신 동의',
      required: false,
      description: '이벤트, 혜택 등 유용한 정보를 받아보세요',
      checked: false,
    },
  ]);

  const allRequired = consents.filter((c) => c.required);
  const allRequiredChecked = allRequired.every((c) => c.checked);
  const allChecked = consents.every((c) => c.checked);

  const toggleConsent = useCallback((id: string) => {
    setConsents((prev) =>
      prev.map((c) => (c.id === id ? { ...c, checked: !c.checked } : c)),
    );
  }, []);

  const toggleAll = useCallback(() => {
    const nextAll = !allChecked;
    setConsents((prev) => prev.map((c) => ({ ...c, checked: nextAll })));
  }, [allChecked]);

  /* ─── 슬라이드 네비게이션 ─── */
  const goNext = useCallback(() => {
    if (currentSlide < SLIDES.length - 1) {
      setDirection(1);
      setCurrentSlide((s) => s + 1);
    } else {
      // 마지막 슬라이드에서 → 동의 바텀시트
      setShowConsent(true);
    }
  }, [currentSlide]);

  const goPrev = useCallback(() => {
    if (currentSlide > 0) {
      setDirection(-1);
      setCurrentSlide((s) => s - 1);
    }
  }, [currentSlide]);

  const handleGestureStart = useCallback((x: number, y: number) => {
    if (showConsent) return;
    gestureStartRef.current = { x, y };
  }, [showConsent]);

  const handleGestureEnd = useCallback((x: number, y: number) => {
    const start = gestureStartRef.current;
    gestureStartRef.current = null;
    if (!start || showConsent) return;

    const deltaX = x - start.x;
    const deltaY = y - start.y;
    const isHorizontalSwipe =
      Math.abs(deltaX) >= SWIPE_THRESHOLD_PX
      && Math.abs(deltaX) >= Math.abs(deltaY) * SWIPE_DIRECTION_RATIO;

    if (!isHorizontalSwipe) return;
    if (deltaX < 0) goNext();
    else goPrev();
  }, [goNext, goPrev, showConsent]);

  /* ─── 스킵 ─── */
  const handleSkip = useCallback(() => {
    setShowConsent(true);
  }, []);

  /* ─── 동의 완료 → 로그인으로 ─── */
  const handleConsentComplete = useCallback(() => {
    markOnboardingIntroDone();
    setShowConsent(false);
    navigate('/login', { replace: true });
  }, [navigate]);

  /* ─── 슬라이드 애니메이션 변수 ─── */
  const slideVariants = {
    enter: (dir: number) => ({
      x: prefersReducedMotion ? 0 : dir > 0 ? 80 : -80,
      opacity: 0,
    }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({
      x: prefersReducedMotion ? 0 : dir > 0 ? -80 : 80,
      opacity: 0,
    }),
  };

  const slide = SLIDES[currentSlide];
  const Icon = slide.icon;

  return (
    <div className="h-dvh flex flex-col bg-[var(--toss-bg)]">
      {/* ─── 상단 영역: 스킵 버튼 ─── */}
      <div className="flex items-center justify-end" style={{ padding: '12px 16px 0' }}>
        <button
          onClick={handleSkip}
          className="text-toss-grey-400 flex items-center"
          style={{ fontSize: 14, minWidth: 44, minHeight: 44 }}
          aria-label="건너뛰기"
        >
          건너뛰기
        </button>
      </div>

      {/* ─── 슬라이드 콘텐츠 ─── */}
      <div
        className="flex-1 flex flex-col items-center justify-center px-6 overflow-hidden"
        style={{ touchAction: 'pan-y' }}
        onTouchStart={(e) => {
          const t = e.changedTouches[0];
          if (t) handleGestureStart(t.clientX, t.clientY);
        }}
        onTouchEnd={(e) => {
          const t = e.changedTouches[0];
          if (t) handleGestureEnd(t.clientX, t.clientY);
        }}
        onMouseDown={(e) => handleGestureStart(e.clientX, e.clientY)}
        onMouseUp={(e) => handleGestureEnd(e.clientX, e.clientY)}
        onMouseLeave={() => { gestureStartRef.current = null; }}
      >
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={`slide-${currentSlide}`}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              duration: prefersReducedMotion ? 0.15 : MOTION_TIMING.screen.default / 1000,
              ease: 'easeOut',
            }}
            className="flex flex-col items-center text-center w-full"
          >
            {/* 아이콘 */}
            <motion.div
              initial={prefersReducedMotion ? {} : { scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, type: 'spring', damping: 15, stiffness: 200 }}
              className="flex items-center justify-center rounded-3xl mb-8"
              style={{
                width: 104,
                height: 104,
                backgroundColor: slide.image3D ? 'transparent' : slide.iconBg,
              }}
            >
              {slide.image3D ? (
                <img
                  src={slide.image3D}
                  alt=""
                  style={{ width: 104, height: 104, objectFit: 'contain' }}
                  aria-hidden="true"
                />
              ) : currentSlide === 0 ? (
                <KeppinLogo size={48} className={slide.iconColor} />
              ) : (
                <Icon size={48} className={slide.iconColor} strokeWidth={1.6} />
              )}
            </motion.div>

            {/* 타이틀 */}
            <h1
              className="text-toss-grey-900"
              style={{
                fontSize: 24,
                fontWeight: 800,
                lineHeight: 1.4,
                whiteSpace: 'pre-line',
              }}
            >
              {slide.title}
            </h1>

            {/* 설명 */}
            <p
              className="text-toss-grey-500 mt-3"
              style={{
                fontSize: 15,
                lineHeight: 1.55,
                whiteSpace: 'pre-line',
              }}
            >
              {slide.description}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ─── 하단 영역: 인디케이터 + 네비게이션 ─── */}
      <div style={{ paddingBottom: 'max(32px, env(safe-area-inset-bottom))' }} className="px-6">
        {/* 도트 인디케이터 */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {SLIDES.map((_, idx) => (
            <motion.div
              key={idx}
              animate={{
                width: idx === currentSlide ? 24 : 8,
                backgroundColor:
                  idx === currentSlide
                    ? 'var(--toss-blue-500)'
                    : 'var(--toss-grey-200)',
              }}
              transition={{ duration: 0.25 }}
              className="rounded-full"
              style={{ height: 8 }}
              aria-label={`슬라이드 ${idx + 1}${idx === currentSlide ? ' (현재)' : ''}`}
            />
          ))}
        </div>

        {/* 버튼 영역 */}
        <div className="flex gap-2">
          {currentSlide > 0 && (
            <div className="shrink-0" style={{ width: 56 }}>
              <TossButton
                variant="weak"
                color="light"
                size="xlarge"
                display="full"
                onClick={goPrev}
                aria-label="이전"
              >
                <ChevronLeft size={22} />
              </TossButton>
            </div>
          )}
          <TossButton
            variant="fill"
            color="primary"
            size="xlarge"
            display="full"
            onClick={goNext}
          >
            {currentSlide === SLIDES.length - 1 ? '시작하기' : '다음'}
          </TossButton>
        </div>
      </div>

      {/* ─── 동의 바텀시트 ─── */}
      <ConsentBottomSheet
        isOpen={showConsent}
        consents={consents}
        allChecked={allChecked}
        allRequiredChecked={allRequiredChecked}
        onToggle={toggleConsent}
        onToggleAll={toggleAll}
        onConfirm={handleConsentComplete}
        onClose={() => setShowConsent(false)}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════
   동의 바텀시트 컴포넌트
   ═══════════════════════════════════════════════ */

interface ConsentBottomSheetProps {
  isOpen: boolean;
  consents: ConsentItem[];
  allChecked: boolean;
  allRequiredChecked: boolean;
  onToggle: (id: string) => void;
  onToggleAll: () => void;
  onConfirm: () => void;
  onClose: () => void;
}

function ConsentBottomSheet({
  isOpen,
  consents,
  allChecked,
  allRequiredChecked,
  onToggle,
  onToggleAll,
  onConfirm,
  onClose,
}: ConsentBottomSheetProps) {
  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="서비스 이용 동의"
      closeOnDimmerClick={false}
      footer={
        <TossButton
          variant="fill"
          color="primary"
          size="xlarge"
          display="full"
          disabled={!allRequiredChecked}
          onClick={onConfirm}
        >
          동의하고 시작하기
        </TossButton>
      }
    >
      <div className="pb-4">
        {/* 전체 동의 */}
        <button
          onClick={onToggleAll}
          className="w-full flex items-center gap-3 active:bg-toss-grey-50 rounded-2xl transition-colors"
          style={{ padding: '14px 4px', minHeight: 52 }}
          role="checkbox"
          aria-checked={allChecked}
          aria-label="전체 동의"
        >
          <div
            className="flex items-center justify-center rounded-full shrink-0 transition-colors"
            style={{
              width: 28,
              height: 28,
              backgroundColor: allChecked ? 'var(--toss-blue-500)' : 'transparent',
              border: allChecked
                ? '2px solid var(--toss-blue-500)'
                : '2px solid var(--toss-grey-300)',
            }}
          >
            {allChecked && (
              <Check size={16} className="text-[var(--primary-foreground)]" strokeWidth={3} />
            )}
          </div>
          <span
            className="text-toss-grey-900"
            style={{ fontSize: 17, fontWeight: 700 }}
          >
            전체 동의
          </span>
        </button>

        {/* 구분선 */}
        <div
          className="bg-toss-grey-100"
          style={{ height: 1, margin: '4px 0 8px' }}
        />

        {/* 개별 동의 항목 */}
        <div className="flex flex-col" style={{ gap: 2 }}>
          {consents.map((consent) => (
            <ConsentRow
              key={consent.id}
              consent={consent}
              onToggle={() => onToggle(consent.id)}
            />
          ))}
        </div>

        {/* 안내 문구 */}
        <div
          className="bg-toss-grey-50 rounded-xl mt-4"
          style={{ padding: '12px 14px' }}
        >
          <div className="flex items-start gap-2">
            <Shield
              size={14}
              className="text-toss-grey-400 shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <p className="text-toss-grey-500" style={{ fontSize: 12, lineHeight: 1.5 }}>
              수집된 정보는 서비스 제공 목적으로만 사용되며,
              관련 법령에 따라 안전하게 보호됩니다.
              마케팅 수신 동의는 언제든 설정에서 변경할 수 있어요.
            </p>
          </div>
        </div>
      </div>
    </BottomSheet>
  );
}

/* ─── 개별 동의 행 ─── */

function ConsentRow({
  consent,
  onToggle,
}: {
  consent: ConsentItem;
  onToggle: () => void;
}) {
  return (
    <div
      role="checkbox"
      tabIndex={0}
      onClick={onToggle}
      onKeyDown={(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); onToggle(); } }}
      className="w-full flex items-start gap-3 active:bg-toss-grey-50 rounded-xl transition-colors cursor-pointer"
      style={{ padding: '10px 4px', minHeight: 44 }}
      aria-checked={consent.checked}
      aria-label={`${consent.label}${consent.required ? ' (필수)' : ' (선택)'}`}
    >
      <div
        className="flex items-center justify-center rounded-full shrink-0 transition-colors mt-0.5"
        style={{
          width: 22,
          height: 22,
          backgroundColor: consent.checked ? 'var(--toss-blue-500)' : 'transparent',
          border: consent.checked
            ? '2px solid var(--toss-blue-500)'
            : '2px solid var(--toss-grey-300)',
        }}
      >
        {consent.checked && (
          <Check size={12} className="text-[var(--primary-foreground)]" strokeWidth={3} />
        )}
      </div>
      <div className="flex-1 text-left min-w-0">
        <div className="flex items-center gap-1.5">
          <span
            className={consent.required ? 'text-toss-blue' : 'text-toss-grey-400'}
            style={{ fontSize: 12, fontWeight: 600 }}
          >
            {consent.required ? '[필수]' : '[선택]'}
          </span>
          <span
            className="text-toss-grey-800"
            style={{ fontSize: 15, fontWeight: 500 }}
          >
            {consent.label}
          </span>
        </div>
        {consent.description && (
          <p
            className="text-toss-grey-400 mt-0.5"
            style={{ fontSize: 12, lineHeight: 1.4 }}
          >
            {consent.description}
          </p>
        )}
      </div>
      {/* 보기 링크 */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          // 약관 상세 보기 (실제로는 약관 페이지로 이동)
        }}
        className="text-toss-grey-400 shrink-0 mt-0.5"
        style={{ minWidth: 44, minHeight: 44, padding: '0 4px' }}
        aria-label={`${consent.label} 자세히 보기`}
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
