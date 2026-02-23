import { useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { TossInput } from '../components/TossInput';
import { TossButton } from '../components/TossButton';
import { NavigationBar } from '../components/NavigationBar';
import { FixedBottomCTA } from '../components/FixedBottomCTA';
import { Popup } from '../components/Popup';
import { Check, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAnalytics } from '../components/useAnalytics';
import { KeppinAppIcon } from '../components/KeppinLogo';
import { INPUT_MAX_LENGTH } from '../components/useInputValidation';
import { signUp, useAuth } from '../data/authStore';
import { pullFromServer } from '../data/contactsStore';
import { pullAutoMessagesFromServer } from '../data/autoMessageStore';
import { useDocumentTitle } from '../components/useDocumentTitle';

/**
 * SignUpPage — keppin 회원가입 (Supabase Auth 연동)
 *
 * 한 화면 안에서 카드 기반 스텝 전환:
 * Step 0: 이메일 + 비밀번호 입력
 * Step 1: 이름 + 약관 동의
 * Step 2: 휴대폰 인증 (선택)
 * Step 3: 완료
 *
 * TDS 8pt grid, 24px side padding, 44px touch target
 */

export function SignUpPage() {
  const navigate = useNavigate();
  const analytics = useAnalytics();
  useDocumentTitle('회원가입');
  const auth = useAuth();
  const [step, setStep] = useState(0);

  /* ──── Step 0: 이메일 + 비밀번호 ─── */
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');

  /* ─── Step 1: 이름 + 약관 ─── */
  const [name, setName] = useState('');
  const [agreements, setAgreements] = useState({
    all: false,
    terms: false,
    privacy: false,
    marketing: false,
  });

  /* ─── Step 2: 휴대폰 인증 ─── */
  const [phone, setPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [otpTimerId, setOtpTimerId] = useState<ReturnType<typeof setInterval> | null>(null);

  /* ─── UI state ─── */
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dirtyWarnOpen, setDirtyWarnOpen] = useState(false);
  const [serverError, setServerError] = useState('');

  const isDirty = step > 0 && (name || email || password || passwordConfirm);

  const handleBack = useCallback(() => {
    if (isDirty && step > 0) {
      setDirtyWarnOpen(true);
      return;
    }
    if (step > 0) setStep((s) => s - 1);
    else navigate(-1);
  }, [isDirty, step, navigate]);

  /* ─── 약관 토글 ─── */
  const toggleAll = () => {
    const next = !agreements.all;
    setAgreements({ all: next, terms: next, privacy: next, marketing: next });
  };

  const toggleItem = (key: 'terms' | 'privacy' | 'marketing') => {
    const next = { ...agreements, [key]: !agreements[key] };
    next.all = next.terms && next.privacy && next.marketing;
    setAgreements(next);
  };

  /* ─── Validation ─── */
  const emailValid = email.includes('@') && email.length >= 5;
  const passwordValid = password.length >= 6;
  const passwordMatch = password === passwordConfirm;
  const canStep0 = emailValid && passwordValid && passwordMatch;
  const canStep1 = name.trim().length > 0 && agreements.terms && agreements.privacy;

  /* ─── OTP ─── */
  const sendOtp = () => {
    if (phone.length < 10) return;
    setOtpSent(true);
    setOtp('');
    setOtpVerified(false);
    setOtpTimer(180);

    if (otpTimerId) clearInterval(otpTimerId);
    const id = setInterval(() => {
      setOtpTimer((prev) => {
        if (prev <= 1) {
          clearInterval(id);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    setOtpTimerId(id);
  };

  const verifyOtp = () => {
    // Mock: any 6-digit code is valid
    if (otp.length === 6) {
      setOtpVerified(true);
      if (otpTimerId) clearInterval(otpTimerId);
    }
  };

  const formatTimer = (s: number) => {
    const min = Math.floor(s / 60);
    const sec = s % 60;
    return `${min}:${String(sec).padStart(2, '0')}`;
  };

  const formatPhoneDisplay = (v: string) => {
    const digits = v.replace(/\D/g, '');
    if (digits.length <= 3) return digits;
    if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7, 11)}`;
  };

  /* ─── Submit — Supabase Auth 연동 ─── */
  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setServerError('');

    const result = await signUp({ email, password, name });

    setIsSubmitting(false);

    if (!result.success) {
      setServerError(result.error || '회원가입에 실패했습니다.');
      return;
    }

    // 가입 성공 → 로컬 연락처 데이터를 서버에 초기 Push
    await pullFromServer();
    await pullAutoMessagesFromServer();

    // 성공 시 완료 스텝으로
    setStep(3);
    analytics.trackEvent('success', {
      screen_name: 'SignUp',
      component_name: 'signupForm',
      action: 'signup_complete',
    });
  };

  /* ─── Step indicator ─── */
  const totalSteps = 4;
  const progress = step / (totalSteps - 1);

  /* ─── Slide animation ─── */
  const slideVariants = {
    enter: { x: 40, opacity: 0 },
    center: { x: 0, opacity: 1 },
    exit: { x: -40, opacity: 0 },
  };

  return (
    <div className="h-dvh flex flex-col bg-[var(--toss-bg)]">
      <NavigationBar
        title="회원가입"
        showBack
        onBack={handleBack}
        dirtyWarn={!!isDirty}
        onDirtyBack={() => setDirtyWarnOpen(true)}
      />

      {/* ─── Progress Bar ─── */}
      {step < 3 && (
        <div className="px-6" style={{ paddingTop: 4, paddingBottom: 8 }}>
          <div className="w-full bg-toss-grey-100 rounded-full overflow-hidden" style={{ height: 4 }}>
            <motion.div
              className="h-full bg-toss-blue rounded-full"
              animate={{ width: `${progress * 100}%` }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
            />
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-toss-grey-400" style={{ fontSize: 11 }}>
              {step + 1} / {totalSteps - 1}
            </span>
            <span className="text-toss-grey-400" style={{ fontSize: 11 }}>
              {['계정 정보', '프로필 설정', '휴대폰 인증'][step]}
            </span>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {/* Step 0: 이메일 + 비밀번호 */}
          {step === 0 && (
            <motion.div
              key="step0"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="px-6 flex flex-col"
              style={{ paddingTop: 24 }}
            >
              <h2 className="text-toss-grey-900" style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
                이메일과 비밀번호를
                <br />설정해주세요
              </h2>
              <p className="text-toss-grey-500" style={{ fontSize: 14, marginBottom: 28 }}>
                로그인에 사용할 계정 정보예요
              </p>

              <div className="flex flex-col" style={{ gap: 16 }}>
                <TossInput
                  label="이메일"
                  type="email"
                  placeholder="example@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onValidate={(v) =>
                    v && !v.includes('@') ? '올바른 이메 형식을 입력하세요' : undefined
                  }
                  showClear
                  onClear={() => setEmail('')}
                  aria-label="이메일 주소"
                  maxLength={INPUT_MAX_LENGTH.email}
                />
                <TossInput
                  label="비밀번호"
                  type="password"
                  placeholder="6자 이상 입력하세요"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onValidate={(v) =>
                    v && v.length < 6 ? '비밀번호는 6자 이상이에요' : undefined
                  }
                  helperText="영문, 숫자 포함 6자 이상"
                  aria-label="비밀번호"
                  maxLength={INPUT_MAX_LENGTH.password}
                />
                <TossInput
                  label="비밀번호 확인"
                  type="password"
                  placeholder="비밀번호를 다시 입력하세요"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  onValidate={(v) =>
                    v && v !== password ? '비밀번호가 일치하지 않아요' : undefined
                  }
                  aria-label="비밀번호 확인"
                  maxLength={INPUT_MAX_LENGTH.password}
                />
              </div>
            </motion.div>
          )}

          {/* Step 1: 이름 + 약관 동의 */}
          {step === 1 && (
            <motion.div
              key="step1"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="px-6 flex flex-col"
              style={{ paddingTop: 24 }}
            >
              <h2 className="text-toss-grey-900" style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
                이름과 약관 동의가
                <br />필요해요
              </h2>
              <p className="text-toss-grey-500" style={{ fontSize: 14, marginBottom: 28 }}>
                인연 관리에 사용될 프로필 이름이에요
              </p>

              <TossInput
                label="이름"
                placeholder="이름을 입력하세요"
                value={name}
                onChange={(e) => setName(e.target.value)}
                showClear
                onClear={() => setName('')}
                aria-label="이름"
                maxLength={INPUT_MAX_LENGTH.name}
              />

              {/* 약관 동의 카드 */}
              <div
                className="border border-toss-grey-200 rounded-2xl overflow-hidden"
                style={{ marginTop: 24 }}
              >
                {/* 전체 동의 */}
                <button
                  onClick={toggleAll}
                  className={`w-full flex items-center gap-3 transition-colors ${
                    agreements.all ? 'bg-toss-blue-50' : 'bg-[var(--toss-bg)]'
                  }`}
                  style={{ padding: '16px', minHeight: 52 }}
                  role="checkbox"
                  aria-checked={agreements.all}
                  aria-label="전체 동의"
                >
                  <div
                    className="flex items-center justify-center rounded-full shrink-0 transition-colors"
                    style={{
                      width: 24,
                      height: 24,
                      backgroundColor: agreements.all ? 'var(--toss-blue-500)' : 'transparent',
                      border: agreements.all
                        ? '2px solid var(--toss-blue-500)'
                        : '2px solid var(--toss-grey-300)',
                    }}
                  >
                    {agreements.all && <Check size={14} className="text-[var(--primary-foreground)]" strokeWidth={3} />}
                  </div>
                  <span className="text-toss-grey-900" style={{ fontSize: 15, fontWeight: 700 }}>
                    전체 동의하기
                  </span>
                </button>

                <div className="bg-toss-grey-100" style={{ height: 1 }} />

                <div style={{ padding: '8px 16px 12px' }}>
                  {([
                    { key: 'terms' as const, label: '(필수) 서비스 이용약관', href: '/terms' },
                    { key: 'privacy' as const, label: '(필수) 개인정보 처리방침', href: '/privacy-policy' },
                    { key: 'marketing' as const, label: '(선택) 마케팅 정보 수신', href: '' },
                  ]).map((item) => (
                    <div key={item.key} className="flex items-center" style={{ minHeight: 44 }}>
                      <button
                        onClick={() => toggleItem(item.key)}
                        className="flex items-center gap-3 flex-1 min-w-0 rounded-xl transition-colors active:bg-toss-grey-50"
                        style={{ padding: '10px 0' }}
                        role="checkbox"
                        aria-checked={agreements[item.key]}
                        aria-label={item.label}
                      >
                        <div
                          className="flex items-center justify-center rounded-full shrink-0 transition-colors"
                          style={{
                            width: 20,
                            height: 20,
                            backgroundColor: agreements[item.key] ? 'var(--toss-blue-500)' : 'transparent',
                            border: agreements[item.key]
                              ? '2px solid var(--toss-blue-500)'
                              : '2px solid var(--toss-grey-300)',
                          }}
                        >
                          {agreements[item.key] && <Check size={11} className="text-[var(--primary-foreground)]" strokeWidth={3} />}
                        </div>
                        <span className="text-toss-grey-700 text-left" style={{ fontSize: 14 }}>
                          {item.label}
                        </span>
                      </button>
                      {item.href && (
                        <Link
                          to={item.href}
                          className="shrink-0 text-toss-grey-400 active:text-toss-grey-600 transition-colors"
                          style={{ fontSize: 12, minWidth: 32, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          aria-label={`${item.label} 전문 보기`}
                        >
                          보기
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Server Error */}
              {serverError && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-toss-red"
                  style={{ fontSize: 13, marginTop: 12 }}
                  role="alert"
                >
                  {serverError}
                </motion.p>
              )}
            </motion.div>
          )}

          {/* Step 2: 휴대폰 인증 */}
          {step === 2 && (
            <motion.div
              key="step2"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="px-6 flex flex-col"
              style={{ paddingTop: 24 }}
            >
              <h2 className="text-toss-grey-900" style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
                휴대폰 번호를
                <br />인증해주세요
              </h2>
              <p className="text-toss-grey-500" style={{ fontSize: 14, marginBottom: 28 }}>
                알림 수신과 계정 보안을 위해 필요해요
              </p>

              {/* Phone Number */}
              <div className="w-full">
                <label
                  className="block text-toss-grey-700"
                  style={{ fontSize: 13, fontWeight: 500, marginBottom: 6 }}
                >
                  휴대폰 번호
                </label>
                <div className="flex gap-2">
                  <div
                    className={`flex-1 flex items-center rounded-xl transition-all ${
                      otpVerified ? 'bg-toss-green-light ring-1 ring-toss-green' : 'bg-toss-grey-100'
                    }`}
                    style={{ height: 52 }}
                  >
                    <input
                      type="tel"
                      placeholder="010-0000-0000"
                      value={formatPhoneDisplay(phone)}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, '').slice(0, 11);
                        setPhone(digits);
                        if (otpSent) {
                          setOtpSent(false);
                          setOtp('');
                          setOtpVerified(false);
                        }
                      }}
                      disabled={otpVerified}
                      className="w-full h-full bg-transparent text-toss-grey-900 placeholder-toss-grey-400 outline-none rounded-xl"
                      style={{ fontSize: 15, paddingLeft: 16, paddingRight: 16 }}
                      aria-label="휴대폰 번호"
                    />
                  </div>
                  <TossButton
                    size="large"
                    variant={otpSent && !otpVerified ? 'weak' : 'fill'}
                    disabled={phone.length < 10 || otpVerified}
                    onClick={sendOtp}
                    style={{ whiteSpace: 'nowrap', paddingLeft: 16, paddingRight: 16 }}
                  >
                    {otpVerified ? '인증완료' : otpSent ? '재전송' : '인증요청'}
                  </TossButton>
                </div>
              </div>

              {/* OTP Input */}
              {otpSent && !otpVerified && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full"
                  style={{ marginTop: 16 }}
                >
                  <label
                    className="block text-toss-grey-700"
                    style={{ fontSize: 13, fontWeight: 500, marginBottom: 6 }}
                  >
                    인증번호
                  </label>
                  <div className="flex gap-2">
                    <div
                      className="flex-1 flex items-center bg-toss-grey-100 rounded-xl relative"
                      style={{ height: 52 }}
                    >
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="6자리 입력"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        className="w-full h-full bg-transparent text-toss-grey-900 placeholder-toss-grey-400 outline-none rounded-xl"
                        style={{ fontSize: 15, paddingLeft: 16, paddingRight: 70, letterSpacing: 4 }}
                        aria-label="인증번호"
                        maxLength={6}
                        autoFocus
                      />
                      {otpTimer > 0 && (
                        <span
                          className="absolute text-toss-red"
                          style={{ right: 16, fontSize: 14, fontWeight: 600 }}
                        >
                          {formatTimer(otpTimer)}
                        </span>
                      )}
                    </div>
                    <TossButton
                      size="large"
                      disabled={otp.length < 6 || otpTimer === 0}
                      onClick={verifyOtp}
                      style={{ whiteSpace: 'nowrap', paddingLeft: 16, paddingRight: 16 }}
                    >
                      확인
                    </TossButton>
                  </div>
                  {otpTimer === 0 && (
                    <p className="text-toss-red" style={{ fontSize: 12, marginTop: 6 }}>
                      인증 시간이 만료되었어요. 재전송해주세요.
                    </p>
                  )}
                  <p className="text-toss-grey-400" style={{ fontSize: 12, marginTop: 8 }}>
                    인증번호가 오지 않나요? 스팸 문자함을 확인하거나 재전송을 눌러주세요.
                  </p>
                </motion.div>
              )}

              {/* Verified badge */}
              {otpVerified && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 bg-toss-green-light rounded-xl"
                  style={{ padding: '12px 16px', marginTop: 16 }}
                >
                  <ShieldCheck size={18} className="text-toss-green" />
                  <span className="text-toss-green" style={{ fontSize: 14, fontWeight: 600 }}>
                    휴대폰 인증이 완료되었어요
                  </span>
                </motion.div>
              )}

              {/* 건너뛰기 */}
              {!otpVerified && (
                <button
                  onClick={handleSubmit}
                  className="self-center text-toss-grey-400 active:text-toss-grey-600 transition-colors"
                  style={{ fontSize: 13, marginTop: 24, minHeight: 44 }}
                >
                  나중에 할게요
                </button>
              )}

              {/* Server Error */}
              {serverError && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-toss-red"
                  style={{ fontSize: 13, marginTop: 12 }}
                  role="alert"
                >
                  {serverError}
                </motion.p>
              )}
            </motion.div>
          )}

          {/* Step 3: 완료 */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="px-6 flex flex-col items-center"
              style={{ paddingTop: 80 }}
            >
              {/* Success icon */}
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, type: 'spring', damping: 12, stiffness: 200 }}
              >
                <KeppinAppIcon size={80} variant="blue" borderRadius={40} />
              </motion.div>

              <h2 className="text-toss-grey-900 text-center" style={{ fontSize: 24, fontWeight: 800, marginTop: 24 }}>
                환영해요, {name}님!
              </h2>
              <p className="text-toss-grey-500 text-center" style={{ fontSize: 15, marginTop: 8, lineHeight: 1.5 }}>
                keppin에서 소중한 사람들과의
                <br />관계를 관리해보세요
              </p>

              {/* Info summary card */}
              <div
                className="w-full bg-toss-grey-50 rounded-2xl"
                style={{ marginTop: 32, padding: '20px' }}
              >
                <div className="flex flex-col" style={{ gap: 12 }}>
                  <div className="flex items-center justify-between">
                    <span className="text-toss-grey-500" style={{ fontSize: 13 }}>이메일</span>
                    <span className="text-toss-grey-800" style={{ fontSize: 14, fontWeight: 500 }}>{email}</span>
                  </div>
                  <div className="bg-toss-grey-200" style={{ height: 1 }} />
                  <div className="flex items-center justify-between">
                    <span className="text-toss-grey-500" style={{ fontSize: 13 }}>이름</span>
                    <span className="text-toss-grey-800" style={{ fontSize: 14, fontWeight: 500 }}>{name}</span>
                  </div>
                  {phone && (
                    <>
                      <div className="bg-toss-grey-200" style={{ height: 1 }} />
                      <div className="flex items-center justify-between">
                        <span className="text-toss-grey-500" style={{ fontSize: 13 }}>휴대폰</span>
                        <span className="text-toss-grey-800" style={{ fontSize: 14, fontWeight: 500 }}>
                          {formatPhoneDisplay(phone)}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ─── Bottom CTA ─── */}
      {step < 3 && (
        <FixedBottomCTA hasSafeAreaPadding>
          {step === 0 && (
            <TossButton
              fullWidth
              size="xlarge"
              disabled={!canStep0}
              onClick={() => setStep(1)}
            >
              다음
            </TossButton>
          )}
          {step === 1 && (
            <TossButton
              fullWidth
              size="xlarge"
              disabled={!canStep1}
              onClick={() => setStep(2)}
            >
              다음
            </TossButton>
          )}
          {step === 2 && otpVerified && (
            <TossButton
              fullWidth
              size="xlarge"
              loading={isSubmitting}
              onClick={handleSubmit}
            >
              가입 완료
            </TossButton>
          )}
        </FixedBottomCTA>
      )}

      {step === 3 && (
        <FixedBottomCTA hasSafeAreaPadding>
          <TossButton
            fullWidth
            size="xlarge"
            onClick={() => navigate('/app/onboarding/sync', { replace: true })}
          >
            시작하기
            <ArrowRight size={18} className="ml-1" />
          </TossButton>
        </FixedBottomCTA>
      )}

      {/* Dirty Check Warning */}
      <Popup
        isOpen={dirtyWarnOpen}
        onClose={() => setDirtyWarnOpen(false)}
        title="입력을 취소할까요?"
        description="입력한 내용이 저장되지 않아요."
        confirmText="나가기"
        cancelText="계속 입력"
        destructive
        closeOnDimmerClick={false}
        onConfirm={() => {
          setDirtyWarnOpen(false);
          if (step > 0) setStep((s) => s - 1);
          else navigate(-1);
        }}
      />
    </div>
  );
}