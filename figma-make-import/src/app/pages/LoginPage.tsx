import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { motion } from 'motion/react';
import { Lock, AlertTriangle, Eye, EyeOff, X } from 'lucide-react';
import { TossButton } from '../components/TossButton';
import { KeppinAppIcon } from '../components/KeppinLogo';
import { useAnalytics } from '../components/useAnalytics';
import { useLoginGuard } from '../components/useLoginGuard';
import { buildErrorMessage } from '../components/useCopySystem';
import { createSupportCode, formatSupportCode } from '../components/useSupportCode';
import { checkIPRateLimit } from '../components/useThreatModel';
import { isOnboardingComplete } from './ContactSyncPage';
import { signIn, signInWithOAuth, useAuth } from '../data/authStore';
import { pullFromServer } from '../data/contactsStore';
import { pullAutoMessagesFromServer } from '../data/autoMessageStore';
import { useDocumentTitle } from '../components/useDocumentTitle';

/**
 * LoginPage — keppin TDS 로그인
 *
 * - 소셜 로그인: 카카오톡, 네이버, 구글 (실제 브랜드 UI)
 * - 이메일 로그인 폼 → Supabase Auth 연동
 * - 비밀번호 찾기 → /forgot-password
 * - 회원가입 → /signup
 */

const CONSECUTIVE_ERROR_FOR_CS = 3;

/* ─── 소셜 로그인 SVG 아이콘 ─── */

function KakaoIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M10 2.5C5.306 2.5 1.5 5.526 1.5 9.273c0 2.427 1.593 4.553 3.994 5.745l-.795 2.943c-.064.237.206.422.414.296l3.45-2.252c.462.062.935.095 1.437.095 4.694 0 8.5-3.026 8.5-6.827C18.5 5.526 14.694 2.5 10 2.5z" fill="#191919"/>
    </svg>
  );
}

function NaverIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M12.187 9.558l-5.47-8.058H1.5v15h5.313V8.442l5.47 8.058H17.5v-15h-5.313v8.058z" fill="white"/>
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M18.171 10.227c0-.709-.064-1.39-.182-2.045H10v3.868h4.583a3.918 3.918 0 01-1.7 2.572v2.137h2.753c1.612-1.484 2.535-3.668 2.535-6.532z" fill="#4285F4"/>
      <path d="M10 18.5c2.3 0 4.229-.763 5.637-2.068l-2.753-2.137c-.763.511-1.738.813-2.884.813-2.217 0-4.095-1.497-4.764-3.511H2.392v2.206A8.498 8.498 0 0010 18.5z" fill="#34A853"/>
      <path d="M5.236 11.597A5.103 5.103 0 014.97 10c0-.554.096-1.093.266-1.597V6.197H2.392A8.498 8.498 0 001.5 10c0 1.372.328 2.67.892 3.803l2.844-2.206z" fill="#FBBC05"/>
      <path d="M10 4.892c1.25 0 2.372.43 3.255 1.274l2.444-2.444C14.224 2.31 12.295 1.5 10 1.5A8.498 8.498 0 002.392 6.197l2.844 2.206C5.905 6.389 7.783 4.892 10 4.892z" fill="#EA4335"/>
    </svg>
  );
}

export function LoginPage() {
  const navigate = useNavigate();
  const analytics = useAnalytics();
  useDocumentTitle('로그인');
  const loginGuard = useLoginGuard();
  const auth = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [supportCode, setSupportCode] = useState<string | null>(null);
  const [ipRateLimited, setIpRateLimited] = useState(false);

  const setErrorWithTemplate = (cause: 'input' | 'network' | 'server') => {
    const tmpl = buildErrorMessage('Login', 'loginForm', cause);
    setError(tmpl.description);
  };

  const handleSocialLogin = async (provider: string) => {
    analytics.trackEvent('click', {
      screen_name: 'Login',
      component_name: 'socialLogin',
      action: `login_${provider}`,
    });

    if (provider === 'google' || provider === 'kakao') {
      const result = await signInWithOAuth(provider);
      if (!result.success) {
        setError(result.error || '소셜 로그인에 실패했습니다.');
      }
      // OAuth는 브라우저를 리다이렉트하므로 여기서 끝
      return;
    }

    // 네이버는 아직 미지원 — 안내 메시지
    setError('네이버 로그인은 준비 중입니다.');
  };

  const handleLogin = async () => {
    if (isSubmitting || loginGuard.isLocked) return;

    const ipCheck = checkIPRateLimit();
    if (!ipCheck.allowed) {
      setIpRateLimited(true);
      setError('요청이 너무 많습니다. 잠시 후 다시 시도해주세요.');
      return;
    }
    setIpRateLimited(false);

    if (!email || !password) {
      setErrorWithTemplate('input');
      return;
    }

    setIsSubmitting(true);
    setError('');
    analytics.trackEvent('submit', {
      screen_name: 'Login',
      component_name: 'loginForm',
      action: 'login',
    });

    const result = await signIn({ email, password });

    setIsSubmitting(false);

    if (!result.success) {
      loginGuard.recordFailure();
      setError(result.error || '이메일 또는 비밀번호를 다시 확인해주세요.');

      if (loginGuard.failCount + 1 >= CONSECUTIVE_ERROR_FOR_CS) {
        const code = createSupportCode('Login', 'failure', 'login_failed');
        setSupportCode(formatSupportCode(code.code));
      }
      return;
    }

    // 로그인 성공
    loginGuard.recordSuccess();
    setSupportCode(null);

    // 서버에서 연락처 데이터 동기화
    await pullFromServer();
    await pullAutoMessagesFromServer();

    const dest = isOnboardingComplete() ? '/app' : '/app/onboarding/sync';
    navigate(dest, { replace: true });
  };

  const formatLockTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  const emailValid = email.length > 0;
  const passwordValid = password.length >= 1;
  const canSubmit = emailValid && passwordValid && !loginGuard.isLocked;

  return (
    <div className="h-dvh flex flex-col bg-[var(--toss-bg)]">
      <div className="flex-1 flex flex-col overflow-y-auto">
        {/* ─── Logo & Brand ─── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="px-6"
          style={{ paddingTop: 64, paddingBottom: 40 }}
        >
          <KeppinAppIcon size={52} variant="blue" borderRadius={16} className="mb-5" />
          <h1
            className="text-toss-grey-900"
            style={{ fontSize: 26, fontWeight: 800, letterSpacing: -0.5 }}
          >
            keppin
          </h1>
          <p className="text-toss-grey-500" style={{ fontSize: 15, marginTop: 6 }}>
            소중한 인연을 쉽고 똑똑하게
          </p>
        </motion.div>

        {/* ─── Lock Banner ─── */}
        {loginGuard.isLocked && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-6 mb-4 flex items-center gap-3 bg-toss-red-50 border border-toss-red-200 rounded-2xl"
            style={{ padding: '12px 16px' }}
            role="alert"
            aria-live="assertive"
          >
            <Lock size={20} className="text-toss-red shrink-0" aria-hidden="true" />
            <div>
              <p className="text-toss-red" style={{ fontSize: 14, fontWeight: 600 }}>
                로그인이 일시 정지되었어요
              </p>
              <p className="text-toss-grey-600" style={{ fontSize: 12 }}>
                보안을 위해 {formatLockTime(loginGuard.remainingLockTime)} 후에 다시 시도해주세요.
              </p>
            </div>
          </motion.div>
        )}

        {/* ─── Consecutive fail warning ─── */}
        {!loginGuard.isLocked && loginGuard.failCount >= CONSECUTIVE_ERROR_FOR_CS && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-6 mb-4 flex items-center gap-3 bg-toss-orange-50 border border-toss-orange-200 rounded-2xl"
            style={{ padding: '12px 16px' }}
            role="alert"
          >
            <AlertTriangle size={20} className="text-toss-orange shrink-0" aria-hidden="true" />
            <div>
              <p className="text-toss-grey-800" style={{ fontSize: 13, fontWeight: 600 }}>
                로그인 시도가 {loginGuard.failCount}회 실패했어요
              </p>
              <p className="text-toss-grey-500" style={{ fontSize: 12 }}>
                {5 - loginGuard.failCount}회 더 실패하면 10분간 잠금돼요.
              </p>
            </div>
          </motion.div>
        )}

        {/* ─── Social Login Buttons ─── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4, ease: 'easeOut' }}
          className="px-6 flex flex-col"
          style={{ gap: 10 }}
        >
          {/* Kakao */}
          <button
            onClick={() => handleSocialLogin('kakao')}
            className="w-full flex items-center justify-center gap-2 transition-colors active:brightness-95"
            style={{
              height: 52,
              borderRadius: 12,
              backgroundColor: '#FEE500',
              color: '#191919',
              fontSize: 15,
              fontWeight: 600,
              minHeight: 44,
            }}
            aria-label="카카오로 로그인"
          >
            <KakaoIcon />
            <span>카카오로 로그인</span>
          </button>

          {/* Naver */}
          <button
            onClick={() => handleSocialLogin('naver')}
            className="w-full flex items-center justify-center gap-2 transition-colors active:brightness-95"
            style={{
              height: 52,
              borderRadius: 12,
              backgroundColor: '#03C75A',
              color: '#FFFFFF',
              fontSize: 15,
              fontWeight: 600,
              minHeight: 44,
            }}
            aria-label="네이버로 로그인"
          >
            <NaverIcon />
            <span>네이버로 로그인</span>
          </button>

          {/* Google */}
          <button
            onClick={() => handleSocialLogin('google')}
            className="w-full flex items-center justify-center gap-2 transition-colors active:brightness-95 bg-[var(--toss-bg)] border border-toss-grey-200 text-toss-grey-800"
            style={{
              height: 52,
              borderRadius: 12,
              fontSize: 15,
              fontWeight: 600,
              minHeight: 44,
            }}
            aria-label="구글로 로그인"
          >
            <GoogleIcon />
            <span>Google로 로그인</span>
          </button>
        </motion.div>

        {/* ─── Divider ─── */}
        <div className="flex items-center gap-3 px-6" style={{ marginTop: 28, marginBottom: 24 }}>
          <div className="flex-1 h-px bg-toss-grey-200" />
          <span className="text-toss-grey-400" style={{ fontSize: 12 }}>또는 이메일로 로그인</span>
          <div className="flex-1 h-px bg-toss-grey-200" />
        </div>

        {/* ─── Email / Password Form ─── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4, ease: 'easeOut' }}
          className="px-6 flex flex-col"
          style={{ gap: 12 }}
        >
          {/* Email Input */}
          <div className="w-full">
            <div
              className={`relative flex items-center rounded-xl transition-all ${
                error ? 'ring-1 ring-toss-red bg-toss-red-light' : 'bg-toss-grey-100'
              }`}
              style={{ height: 52 }}
            >
              <input
                type="email"
                placeholder="이메일 주소"
                value={email}
                onChange={(e) => { setEmail(e.target.value); if (error) setError(''); }}
                disabled={loginGuard.isLocked}
                className="w-full h-full bg-transparent text-toss-grey-900 placeholder-toss-grey-400 outline-none rounded-xl"
                style={{ fontSize: 15, paddingLeft: 16, paddingRight: email ? 40 : 16 }}
                aria-label="이메일 주소"
                maxLength={100}
              />
              {email && (
                <button
                  type="button"
                  onClick={() => setEmail('')}
                  className="absolute right-3 flex items-center justify-center"
                  style={{ width: 28, height: 28 }}
                  aria-label="이메일 지우기"
                >
                  <X size={16} className="text-toss-grey-400" />
                </button>
              )}
            </div>
          </div>

          {/* Password Input */}
          <div className="w-full">
            <div
              className={`relative flex items-center rounded-xl transition-all ${
                error ? 'ring-1 ring-toss-red bg-toss-red-light' : 'bg-toss-grey-100'
              }`}
              style={{ height: 52 }}
            >
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="비밀번호"
                value={password}
                onChange={(e) => { setPassword(e.target.value); if (error) setError(''); }}
                disabled={loginGuard.isLocked}
                className="w-full h-full bg-transparent text-toss-grey-900 placeholder-toss-grey-400 outline-none rounded-xl"
                style={{ fontSize: 15, paddingLeft: 16, paddingRight: 48 }}
                aria-label="비밀번호"
                maxLength={64}
                onKeyDown={(e) => { if (e.key === 'Enter') handleLogin(); }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 flex items-center justify-center"
                style={{ width: 28, height: 28 }}
                aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
              >
                {showPassword
                  ? <EyeOff size={18} className="text-toss-grey-400" />
                  : <Eye size={18} className="text-toss-grey-400" />
                }
              </button>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-toss-red"
              style={{ fontSize: 13, marginTop: -4 }}
              role="alert"
            >
              {error}
            </motion.p>
          )}

          {/* Support Code */}
          {supportCode && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-toss-grey-50 rounded-xl"
              style={{ padding: '10px 14px' }}
            >
              <p className="text-toss-grey-500" style={{ fontSize: 12 }}>
                문의 시 아래 코드를 알려주세요
              </p>
              <p className="text-toss-grey-800 mt-0.5" style={{ fontSize: 14, fontWeight: 700, fontFamily: 'monospace' }}>
                {supportCode}
              </p>
            </motion.div>
          )}

          {/* Login Button */}
          <TossButton
            variant="fill"
            color="primary"
            display="full"
            size="xlarge"
            onClick={handleLogin}
            disabled={!canSubmit}
            loading={isSubmitting || auth.loading}
            style={{ marginTop: 16 }}
          >
            {loginGuard.isLocked
              ? `${formatLockTime(loginGuard.remainingLockTime)} 후에 다시 시도`
              : '로그인'}
          </TossButton>

          {/* Forgot password & Sign up links */}
          <div className="flex items-center justify-between" style={{ marginTop: 4 }}>
            <button
              onClick={() => navigate('/forgot-password')}
              className="text-toss-grey-500 active:text-toss-grey-700 transition-colors"
              style={{ fontSize: 13, minHeight: 44, display: 'flex', alignItems: 'center' }}
              aria-label="비밀번호를 잊으셨나요?"
            >
              비밀번호를 잊으셨나요?
            </button>
            <button
              onClick={() => navigate('/signup')}
              className="text-toss-blue active:text-toss-blue-600 transition-colors"
              style={{ fontSize: 13, fontWeight: 600, minHeight: 44, display: 'flex', alignItems: 'center' }}
              aria-label="회원가입"
            >
              회원가입
            </button>
          </div>

          {/* CS CTA on repeated failure */}
          {loginGuard.failCount >= CONSECUTIVE_ERROR_FOR_CS && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-toss-blue text-center"
              style={{ fontSize: 14, fontWeight: 500, marginTop: 8, minHeight: 44 }}
              onClick={() => {
                analytics.trackEvent('click', {
                  screen_name: 'Login',
                  component_name: 'contactSupport',
                  action: 'open_support',
                });
              }}
              aria-label="고객센터에 문의하기"
            >
              문제가 계속되면 문의하기
            </motion.button>
          )}
        </motion.div>

        {/* ─── 약관 / 개인정보처리방침 링크 ─── */}
        <div className="flex items-center justify-center gap-1 px-6" style={{ paddingTop: 16, paddingBottom: 24 }}>
          <Link
            to="/terms"
            className="text-toss-grey-400 active:text-toss-grey-500 transition-colors"
            style={{ fontSize: 11, minHeight: 32, display: 'flex', alignItems: 'center' }}
          >
            이용약관
          </Link>
          <span className="text-toss-grey-300" style={{ fontSize: 11 }}>|</span>
          <Link
            to="/privacy-policy"
            className="text-toss-grey-400 active:text-toss-grey-500 transition-colors"
            style={{ fontSize: 11, minHeight: 32, display: 'flex', alignItems: 'center' }}
          >
            개인정보처리방침
          </Link>
        </div>
      </div>
    </div>
  );
}