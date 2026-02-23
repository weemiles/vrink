import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

/* TDS BottomCTA / FixedBottomCTA (7.1)
 * - FixedBottomCTA = BottomCTA with fixed=true
 * - Single: 1 CTA button (children)
 * - Double: 2 CTA buttons (leftButton, rightButton)
 * - hideOnScroll: hides on scroll-down, shows on scroll-up
 * - hideOnScrollDistanceThreshold: px (default 24, §2.3 제품 운영 확장 4-12)
 * - hasSafeAreaPadding: default true
 * - hasPaddingBottom: default true (false => paddingBottom=0)
 * - background: 'default' | 'none'
 * - showAfterDelay: { animation, delay }
 * - fixedAboveKeyboard: keeps CTA above keyboard (Single only)
 * - topAccessory / bottomAccessory
 * - takeSpace: reserves layout space when fixed (default true when fixed)
 *
 * §2.1 사용 조건: 2뷰포트 이상 스크롤 / 핵심 전환 CTA / 입력 중 CTA 접근
 * §2.2 버튼 개수: 1개 원칙, 2개(Double)는 대등한 선택/법적 동의 예외만
 * §2.3 스크롤 hide/show: 24px 임계값 (1px 금지, 작은 떨림 방지)
 * §2.4 키보드 충돌: CTA 필수 → 키보드 위 고정, 방해 → CTA 숨김
 * §2.5 Safe Area: 하단 최소 20px, iOS 홈 인디케이터 34px 이상
 */

interface ShowAfterDelay {
  animation: 'slide' | 'fade' | 'scale';
  delay: number; // seconds
}

interface BottomCTASingleProps {
  children: React.ReactNode;
  fixed?: boolean;
  show?: boolean;
  hideOnScroll?: boolean;
  hideOnScrollDistanceThreshold?: number;
  hasSafeAreaPadding?: boolean;
  hasPaddingBottom?: boolean;
  takeSpace?: boolean;
  background?: 'default' | 'none';
  topAccessory?: React.ReactNode;
  bottomAccessory?: React.ReactNode;
  fixedAboveKeyboard?: boolean;
  showAfterDelay?: ShowAfterDelay;
  containerStyle?: React.CSSProperties;
  containerRef?: React.Ref<HTMLDivElement>;
}

interface BottomCTADoubleProps {
  leftButton: React.ReactNode;
  rightButton: React.ReactNode;
  fixed?: boolean;
  show?: boolean;
  hideOnScroll?: boolean;
  hideOnScrollDistanceThreshold?: number;
  hasSafeAreaPadding?: boolean;
  hasPaddingBottom?: boolean;
  takeSpace?: boolean;
  background?: 'default' | 'none';
  topAccessory?: React.ReactNode;
  bottomAccessory?: React.ReactNode;
  showAfterDelay?: ShowAfterDelay;
  containerStyle?: React.CSSProperties;
  containerRef?: React.Ref<HTMLDivElement>;
}

function useScrollVisibility(enabled: boolean, threshold: number = 24) {
  const [visible, setVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    if (!enabled) return;
    const handleScroll = () => {
      const currentY = window.scrollY;
      const diff = currentY - lastScrollY.current;
      if (diff > threshold) {
        setVisible(false);
      } else if (diff < -threshold) {
        setVisible(true);
      }
      lastScrollY.current = currentY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [enabled, threshold]);

  return visible;
}

function useDelayedShow(config?: ShowAfterDelay) {
  const [shown, setShown] = useState(!config);

  useEffect(() => {
    if (!config) return;
    const timer = setTimeout(() => setShown(true), config.delay * 1000);
    return () => clearTimeout(timer);
  }, [config]);

  return { shown, animation: config?.animation || 'fade' };
}

function getAnimationProps(animation: string) {
  switch (animation) {
    case 'slide':
      return { initial: { y: 100, opacity: 0 }, animate: { y: 0, opacity: 1 }, exit: { y: 100, opacity: 0 } };
    case 'scale':
      return { initial: { scale: 0.8, opacity: 0 }, animate: { scale: 1, opacity: 1 }, exit: { scale: 0.8, opacity: 0 } };
    case 'fade':
    default:
      return { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } };
  }
}

function CTAContainer({
  fixed = false,
  hasSafeAreaPadding = true,
  hasPaddingBottom = true,
  background = 'default',
  topAccessory,
  bottomAccessory,
  hideOnScroll = false,
  hideOnScrollDistanceThreshold = 24,
  showAfterDelay,
  takeSpace,
  containerStyle,
  containerRef,
  children,
}: {
  fixed?: boolean;
  hasSafeAreaPadding?: boolean;
  hasPaddingBottom?: boolean;
  background?: 'default' | 'none';
  topAccessory?: React.ReactNode;
  bottomAccessory?: React.ReactNode;
  hideOnScroll?: boolean;
  hideOnScrollDistanceThreshold?: number;
  showAfterDelay?: ShowAfterDelay;
  takeSpace?: boolean;
  containerStyle?: React.CSSProperties;
  containerRef?: React.Ref<HTMLDivElement>;
  children: React.ReactNode;
}) {
  const scrollVisible = useScrollVisibility(hideOnScroll, hideOnScrollDistanceThreshold);
  const { shown, animation } = useDelayedShow(showAfterDelay);
  const isVisible = scrollVisible && shown;
  const effectiveTakeSpace = takeSpace ?? (fixed ? true : false);

  let paddingBottom: string | number = 0;
  if (hasPaddingBottom) {
    paddingBottom = hasSafeAreaPadding
      ? 'max(var(--toss-safe-area-bottom, 0px), env(safe-area-inset-bottom), 20px)'
      : '20px';
  }

  const animProps = getAnimationProps(animation);

  const ctaContent = (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          ref={containerRef as React.Ref<HTMLDivElement>}
          {...animProps}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className={`${fixed ? 'fixed bottom-0 left-0 right-0 z-[50]' : 'w-full'}`}
          style={{
            paddingBottom,
            paddingLeft: 24,
            paddingRight: 24,
            paddingTop: 12,
            backgroundColor: background === 'default' ? 'var(--toss-bottom-cta-bg)' : 'transparent',
            ...containerStyle,
          }}
        >
          {topAccessory && <div className="mb-2">{topAccessory}</div>}
          {children}
          {bottomAccessory && <div className="mt-2">{bottomAccessory}</div>}
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      {effectiveTakeSpace && fixed && (
        <div style={{ height: 80, flexShrink: 0 }} aria-hidden="true" />
      )}
      {ctaContent}
    </>
  );
}

/* BottomCTA.Single */
function BottomCTASingle({
  children,
  fixed = false,
  hideOnScroll = false,
  hideOnScrollDistanceThreshold = 24,
  hasSafeAreaPadding = true,
  hasPaddingBottom = true,
  background = 'default',
  topAccessory,
  bottomAccessory,
  showAfterDelay,
  takeSpace,
  containerStyle,
  containerRef,
}: BottomCTASingleProps) {
  return (
    <CTAContainer
      fixed={fixed}
      hasSafeAreaPadding={hasSafeAreaPadding}
      hasPaddingBottom={hasPaddingBottom}
      background={background}
      topAccessory={topAccessory}
      bottomAccessory={bottomAccessory}
      hideOnScroll={hideOnScroll}
      hideOnScrollDistanceThreshold={hideOnScrollDistanceThreshold}
      showAfterDelay={showAfterDelay}
      takeSpace={takeSpace}
      containerStyle={containerStyle}
      containerRef={containerRef}
    >
      <div className="w-full">{children}</div>
    </CTAContainer>
  );
}

/* BottomCTA.Double */
function BottomCTADouble({
  leftButton,
  rightButton,
  fixed = false,
  hideOnScroll = false,
  hideOnScrollDistanceThreshold = 24,
  hasSafeAreaPadding = true,
  hasPaddingBottom = true,
  background = 'default',
  topAccessory,
  bottomAccessory,
  showAfterDelay,
  takeSpace,
  containerStyle,
  containerRef,
}: BottomCTADoubleProps) {
  return (
    <CTAContainer
      fixed={fixed}
      hasSafeAreaPadding={hasSafeAreaPadding}
      hasPaddingBottom={hasPaddingBottom}
      background={background}
      topAccessory={topAccessory}
      bottomAccessory={bottomAccessory}
      hideOnScroll={hideOnScroll}
      hideOnScrollDistanceThreshold={hideOnScrollDistanceThreshold}
      showAfterDelay={showAfterDelay}
      takeSpace={takeSpace}
      containerStyle={containerStyle}
      containerRef={containerRef}
    >
      <div className="flex gap-2 w-full">
        <div className="flex-1">{leftButton}</div>
        <div className="flex-1">{rightButton}</div>
      </div>
    </CTAContainer>
  );
}

/* BottomCTA namespace */
export const BottomCTA = {
  Single: BottomCTASingle,
  Double: BottomCTADouble,
};

/* FixedBottomCTA — BottomCTA with fixed=true by default */
function FixedBottomCTASingle(props: Omit<BottomCTASingleProps, 'fixed'>) {
  return <BottomCTASingle fixed={true} {...props} />;
}

function FixedBottomCTADouble(props: Omit<BottomCTADoubleProps, 'fixed'>) {
  return <BottomCTADouble fixed={true} {...props} />;
}

export const FixedBottomCTA = Object.assign(FixedBottomCTASingle, {
  Double: FixedBottomCTADouble,
});