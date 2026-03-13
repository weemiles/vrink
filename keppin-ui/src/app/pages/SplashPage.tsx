import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { KeepinAppIcon } from '../components/KeepinLogo';
import { useReducedMotion } from '../components/usePerformanceUX';
import { isOnboardingIntroDone } from './OnboardingPage';
import { isDemoAuthBypassEnabled } from '../data/authStore';
import { useAuth } from '../components/AuthContext';
import { isOnboardingComplete } from './ContactSyncPage';

export function SplashPage() {
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();
  const auth = useAuth();

  useEffect(() => {
    // 아직 초기화 안 됐으면 대기
    if (!auth.initialized) return;

    const timer = setTimeout(() => {
      if (auth.user) {
        // 인증된 사용자 → 서버 데이터 동기화는 AuthGuard의 useAppBootstrap이 처리
        const dest = isOnboardingComplete() ? '/app' : '/app/onboarding/sync';
        navigate(dest, { replace: true });
      } else if (isDemoAuthBypassEnabled()) {
        // 데모 미리보기 모드
        navigate('/app', { replace: true });
      } else {
        // 미인증 → 온보딩 인트로 or 로그인
        const dest = isOnboardingIntroDone() ? '/login' : '/onboarding';
        navigate(dest, { replace: true });
      }
    }, prefersReducedMotion ? 400 : 1600);

    return () => clearTimeout(timer);
  }, [auth.initialized, auth.user, navigate, prefersReducedMotion]);

  return (
    <div className="h-dvh flex flex-col items-center justify-center bg-toss-blue" role="status" aria-label="keepin 앱 로딩 중">
      <motion.div
        initial={prefersReducedMotion ? { opacity: 0 } : { scale: 0.5, opacity: 0 }}
        animate={prefersReducedMotion ? { opacity: 1 } : { scale: 1, opacity: 1 }}
        transition={prefersReducedMotion ? { duration: 0.15 } : { type: 'spring', damping: 15, stiffness: 150 }}
        className="flex flex-col items-center gap-4"
      >
        <KeepinAppIcon size={80} variant="white" borderRadius={24} />
        <motion.div
          initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: prefersReducedMotion ? 0.1 : 0.4 }}
          className="text-center"
        >
          <h1 className="text-[var(--primary-foreground)]" style={{ fontSize: 28, fontWeight: 800, letterSpacing: -0.5 }}>
            keepin
          </h1>
          <p className="text-[var(--primary-foreground)] opacity-70 mt-1" style={{ fontSize: 14 }}>
            소중한 인연을 관리하세요
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
