import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Bell, Cake, Check, ChevronLeft, ChevronRight, Shield, Star, Users } from 'lucide-react';
import { BottomSheet } from '../components/BottomSheet';
import { KeppinLogo } from '../components/KeppinLogo';
import { TossButton } from '../components/TossButton';
import { MOTION_TIMING } from '../components/useMotionConfig';
import { useReducedMotion } from '../components/usePerformanceUX';

const ONBOARDING_INTRO_KEY = '__onboarding_intro_done';

const SLIDES = [
  {
    icon: Users,
    iconBg: 'var(--toss-blue-50)',
    iconColor: 'var(--toss-blue-500)',
    title: '소중한 사람들을\n한곳에서 관리하세요',
    description: '흩어진 연락처와 인연 정보를\nkeppin에서 깔끔하게 정리할 수 있어요',
  },
  {
    icon: Cake,
    iconBg: 'var(--toss-orange-50)',
    iconColor: 'var(--toss-orange-500)',
    title: '생일과 기념일을\n놓치지 마세요',
    description: '중요한 날을 미리 알려드려서\n소중한 사람에게 먼저 연락할 수 있어요',
  },
  {
    icon: Bell,
    iconBg: 'var(--toss-green-50)',
    iconColor: 'var(--toss-green-500)',
    title: '연락이 뜸한 사람도\n챙겨드려요',
    description: '오랫동안 연락하지 못한 사람을\n알려드려서 관계를 유지할 수 있어요',
  },
  {
    icon: Star,
    iconBg: 'var(--toss-grey-100)',
    iconColor: 'var(--toss-grey-600)',
    title: '중요한 인연에\n별점을 매겨보세요',
    description: '관계의 깊이를 한눈에 파악하고\n더 의미 있는 네트워크를 만들어가요',
  },
];

const defaultConsents = [
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
];

function markOnboardingIntroDone() {
  try {
    localStorage.setItem(ONBOARDING_INTRO_KEY, 'true');
  } catch {
    // ignore
  }
}

export function OnboardingPage() {
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(1);
  const [showConsent, setShowConsent] = useState(false);
  const [consents, setConsents] = useState(defaultConsents);

  const allChecked = consents.every((c) => c.checked);
  const allRequiredChecked = consents.filter((c) => c.required).every((c) => c.checked);

  const goNext = useCallback(() => {
    if (currentSlide < SLIDES.length - 1) {
      setDirection(1);
      setCurrentSlide((v) => v + 1);
      return;
    }
    setShowConsent(true);
  }, [currentSlide]);

  const goPrev = useCallback(() => {
    if (currentSlide > 0) {
      setDirection(-1);
      setCurrentSlide((v) => v - 1);
    }
  }, [currentSlide]);

  const toggleConsent = useCallback((id) => {
    setConsents((prev) => prev.map((c) => (c.id === id ? { ...c, checked: !c.checked } : c)));
  }, []);

  const toggleAll = useCallback(() => {
    const next = !allChecked;
    setConsents((prev) => prev.map((c) => ({ ...c, checked: next })));
  }, [allChecked]);

  const handleConsentComplete = useCallback(() => {
    markOnboardingIntroDone();
    setShowConsent(false);
    navigate('/login', { replace: true });
  }, [navigate]);

  const slideVariants = {
    enter: (dir) => ({ x: prefersReducedMotion ? 0 : dir > 0 ? 80 : -80, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir) => ({ x: prefersReducedMotion ? 0 : dir > 0 ? -80 : 80, opacity: 0 }),
  };

  const slide = SLIDES[currentSlide];
  const Icon = slide.icon;

  return (
    <main className="screen">
      <div className="phone-frame">
        <div className="top-row">
          <button className="skip" onClick={() => setShowConsent(true)}>건너뛰기</button>
        </div>

        <section className="slide-area">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentSlide}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: prefersReducedMotion ? 0.15 : MOTION_TIMING.screen.default / 1000 }}
              className="slide-content"
            >
              <div className="icon-wrap" style={{ backgroundColor: slide.iconBg }}>
                {currentSlide === 0 ? (
                  <KeppinLogo size={48} className="text-toss-blue" />
                ) : (
                  <Icon size={48} color={slide.iconColor} strokeWidth={1.6} />
                )}
              </div>
              <h1>{slide.title}</h1>
              <p>{slide.description}</p>
            </motion.div>
          </AnimatePresence>
        </section>

        <section className="bottom-area">
          <div className="dots">
            {SLIDES.map((_, i) => (
              <div key={i} className={`dot ${i === currentSlide ? 'active' : ''}`} />
            ))}
          </div>
          <div className="button-row">
            {currentSlide > 0 ? (
              <TossButton variant="weak" onClick={goPrev} aria-label="이전" className="back-btn">
                <ChevronLeft size={20} />
              </TossButton>
            ) : null}
            <TossButton onClick={goNext}>{currentSlide === SLIDES.length - 1 ? '시작하기' : '다음'}</TossButton>
          </div>
        </section>
      </div>

      <BottomSheet
        isOpen={showConsent}
        onClose={() => setShowConsent(false)}
        title="서비스 이용 동의"
        closeOnDimmerClick={false}
        footer={
          <TossButton disabled={!allRequiredChecked} onClick={handleConsentComplete}>
            동의하고 시작하기
          </TossButton>
        }
      >
        <button className="consent-row all" onClick={toggleAll}>
          <CheckBox checked={allChecked} />
          <strong>전체 동의</strong>
        </button>
        <div className="line" />
        {consents.map((consent) => (
          <button key={consent.id} className="consent-row" onClick={() => toggleConsent(consent.id)}>
            <CheckBox checked={consent.checked} />
            <div className="consent-copy">
              <span className="consent-title">
                <em>{consent.required ? '[필수]' : '[선택]'}</em> {consent.label}
              </span>
              {consent.description ? <small>{consent.description}</small> : null}
            </div>
            <ChevronRight size={16} color="#999" />
          </button>
        ))}
        <div className="notice">
          <Shield size={14} color="#666" />
          <p>수집된 정보는 서비스 제공 목적으로만 사용되며 관련 법령에 따라 안전하게 보호됩니다.</p>
        </div>
      </BottomSheet>
    </main>
  );
}

function CheckBox({ checked }) {
  return (
    <span className={`check ${checked ? 'checked' : ''}`}>
      {checked ? <Check size={12} strokeWidth={3} /> : null}
    </span>
  );
}
