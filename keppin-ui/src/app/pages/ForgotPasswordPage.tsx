import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, CheckCircle2, ShieldCheck } from 'lucide-react';
import { TossInput } from '../components/TossInput';
import { TossButton } from '../components/TossButton';
import { NavigationBar } from '../components/NavigationBar';
import { FixedBottomCTA } from '../components/FixedBottomCTA';
import { INPUT_MAX_LENGTH } from '../components/useInputValidation';
import { resetPasswordForEmail, updatePassword, useAuth, supabase } from '../data/authStore';

/**
 * ForgotPasswordPage — 비밀번호 찾기 (Supabase Auth 연동)
 *
 * Step 0: 이메일 입력 → resetPasswordForEmail 호출
 * Step 1: "이메일을 확인하세요" 안내
 * Step 2: 새 비밀번호 설정 (PASSWORD_RECOVERY 이벤트 감지 시)
 * Step 3: 완료
 *
 * Supabase는 비밀번호 재설정 이메일에 recovery 링크를 포함하고,
 * 사용자가 링크를 클릭하면 redirectTo URL로 돌아오면서 세션이 복구됩니다.
 * onAuthStateChange에서 PASSWORD_RECOVERY 이벤트를 감지하면 Step 2로 진입합니다.
 */

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const auth = useAuth();

  const [step, setStep] = useState(0);
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // PASSWORD_RECOVERY 이벤트 감지
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, _session) => {
      if (event === 'PASSWORD_RECOVERY') {
        // Recovery 링크를 통해 돌아온 경우 → 바로 새 비밀번호 입력
        setStep(2);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // 페이지 로드 시 이미 recovery session이 있는지 확인
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes('type=recovery')) {
      setStep(2);
    }
  }, []);

  /* ─── Step 0 → 1: 재설정 이메일 발송 ─── */
  const handleSendResetEmail = async () => {
    if (isSubmitting) return;
    if (!email.includes('@') || email.length < 5) return;

    setIsSubmitting(true);
    setError('');

    const result = await resetPasswordForEmail(email);

    setIsSubmitting(false);

    if (!result.success) {
      setError(result.error || '이메일 전송에 실패했습니다.');
      return;
    }

    setStep(1);
  };

  /* ─── Step 2 → 3: 새 비밀번호 저장 ─── */
  const handleResetPassword = async () => {
    if (isSubmitting) return;
    if (newPassword.length < 6 || newPassword !== newPasswordConfirm) return;

    setIsSubmitting(true);
    setError('');

    const result = await updatePassword(newPassword);

    setIsSubmitting(false);

    if (!result.success) {
      setError(result.error || '비밀번호 변경에 실패했습니다.');
      return;
    }

    setStep(3);
  };

  const emailValid = email.includes('@') && email.length >= 5;
  const passwordValid = newPassword.length >= 6 && newPassword === newPasswordConfirm;

  const slideVariants = {
    enter: { x: 40, opacity: 0 },
    center: { x: 0, opacity: 1 },
    exit: { x: -40, opacity: 0 },
  };

  return (
    <div className="h-dvh flex flex-col bg-[var(--toss-bg)]">
      <NavigationBar
        title="비밀번호 찾기"
        showBack
        onBack={() => {
          if (step === 1) setStep(0);
          else navigate(-1);
        }}
      />

      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {/* ═══ Step 0: 이메일 입력 ═══ */}
          {step === 0 && (
            <motion.div
              key="forgot-0"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="px-6"
              style={{ paddingTop: 32 }}
            >
              <div
                className="flex items-center justify-center bg-toss-blue-50 rounded-2xl"
                style={{ width: 56, height: 56, marginBottom: 20 }}
              >
                <Mail size={26} className="text-toss-blue" />
              </div>

              <h2 className="text-toss-grey-900" style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
                가입한 이메일을
                <br />입력해주세요
              </h2>
              <p className="text-toss-grey-500" style={{ fontSize: 14, marginBottom: 32, lineHeight: 1.5 }}>
                입력한 이메일로 비밀번호 재설정 링크를
                <br />보내드려요
              </p>

              <TossInput
                label="이메일"
                type="email"
                placeholder="example@email.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); if (error) setError(''); }}
                onValidate={(v) =>
                  v && !v.includes('@') ? '올바른 이메일 형식을 입력하세요' : undefined
                }
                showClear
                onClear={() => setEmail('')}
                aria-label="이메일 주소"
                maxLength={INPUT_MAX_LENGTH.email}
              />

              {/* Error message */}
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-toss-red"
                  style={{ fontSize: 13, marginTop: 12 }}
                  role="alert"
                >
                  {error}
                </motion.p>
              )}
            </motion.div>
          )}

          {/* ═══ Step 1: 이메일 전송 완료 안내 ═══ */}
          {step === 1 && (
            <motion.div
              key="forgot-1"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="px-6 flex flex-col items-center"
              style={{ paddingTop: 64 }}
            >
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, type: 'spring', damping: 12, stiffness: 200 }}
                className="flex items-center justify-center bg-toss-blue-50 rounded-full"
                style={{ width: 72, height: 72, marginBottom: 24 }}
              >
                <Mail size={32} className="text-toss-blue" />
              </motion.div>

              <h2 className="text-toss-grey-900 text-center" style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
                이메일을 확인해주세요
              </h2>
              <p className="text-toss-grey-500 text-center" style={{ fontSize: 14, lineHeight: 1.6 }}>
                <span className="text-toss-blue" style={{ fontWeight: 600 }}>{email}</span>
                (으)로
                <br />비밀번호 재설정 링크를 보냈어요
              </p>

              <div
                className="w-full bg-toss-grey-50 rounded-2xl"
                style={{ marginTop: 32, padding: '16px 20px' }}
              >
                <p className="text-toss-grey-600" style={{ fontSize: 13, lineHeight: 1.6 }}>
                  이메일이 오지 않나요?
                </p>
                <ul className="text-toss-grey-500" style={{ fontSize: 12, lineHeight: 1.6, marginTop: 8, paddingLeft: 16 }}>
                  <li style={{ listStyleType: 'disc' }}>스팸 메일함을 확인해주세요</li>
                  <li style={{ listStyleType: 'disc' }}>이메일 주소가 정확한지 확인해주세요</li>
                  <li style={{ listStyleType: 'disc' }}>몇 분 후 다시 시도해주세요</li>
                </ul>
              </div>

              {/* 재전송 버튼 */}
              <button
                onClick={() => setStep(0)}
                className="text-toss-blue"
                style={{ fontSize: 14, fontWeight: 500, marginTop: 24, minHeight: 44 }}
              >
                다른 이메일로 다시 보내기
              </button>
            </motion.div>
          )}

          {/* ═══ Step 2: 새 비밀번호 설정 ═══ */}
          {step === 2 && (
            <motion.div
              key="forgot-2"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="px-6"
              style={{ paddingTop: 32 }}
            >
              <div
                className="flex items-center justify-center bg-toss-green-light rounded-2xl"
                style={{ width: 56, height: 56, marginBottom: 20 }}
              >
                <ShieldCheck size={26} className="text-toss-green" />
              </div>

              <h2 className="text-toss-grey-900" style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
                새 비밀번호를
                <br />설정해주세요
              </h2>
              <p className="text-toss-grey-500" style={{ fontSize: 14, marginBottom: 32 }}>
                이전과 다른 비밀번호를 사용해주세요
              </p>

              <div className="flex flex-col" style={{ gap: 16 }}>
                <TossInput
                  label="새 비밀번호"
                  type="password"
                  placeholder="6자 이상 입력하세요"
                  value={newPassword}
                  onChange={(e) => { setNewPassword(e.target.value); if (error) setError(''); }}
                  onValidate={(v) =>
                    v && v.length < 6 ? '비밀번호는 6자 이상이에요' : undefined
                  }
                  helperText="영문, 숫자 포함 6자 이상"
                  aria-label="새 비밀번호"
                  maxLength={INPUT_MAX_LENGTH.password}
                />
                <TossInput
                  label="비밀번호 확인"
                  type="password"
                  placeholder="비밀번호를 다시 입력하세요"
                  value={newPasswordConfirm}
                  onChange={(e) => { setNewPasswordConfirm(e.target.value); if (error) setError(''); }}
                  onValidate={(v) =>
                    v && v !== newPassword ? '비밀번호가 일치하지 않아요' : undefined
                  }
                  aria-label="비밀번호 확인"
                  maxLength={INPUT_MAX_LENGTH.password}
                />
              </div>

              {/* Error message */}
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-toss-red"
                  style={{ fontSize: 13, marginTop: 12 }}
                  role="alert"
                >
                  {error}
                </motion.p>
              )}
            </motion.div>
          )}

          {/* ═══ Step 3: 완료 ═══ */}
          {step === 3 && (
            <motion.div
              key="forgot-3"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="px-6 flex flex-col items-center"
              style={{ paddingTop: 80 }}
            >
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, type: 'spring', damping: 12, stiffness: 200 }}
                className="flex items-center justify-center bg-toss-green-light rounded-full"
                style={{ width: 80, height: 80, marginBottom: 24 }}
              >
                <CheckCircle2 size={40} className="text-toss-green" strokeWidth={2} />
              </motion.div>

              <h2 className="text-toss-grey-900 text-center" style={{ fontSize: 22, fontWeight: 700 }}>
                비밀번호가 변경되었어요
              </h2>
              <p className="text-toss-grey-500 text-center" style={{ fontSize: 14, marginTop: 8, lineHeight: 1.5 }}>
                새 비밀번호로 로그인해주세요
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ─── Bottom CTA ─── */}
      <FixedBottomCTA hasSafeAreaPadding>
        {step === 0 && (
          <TossButton
            fullWidth
            size="xlarge"
            disabled={!emailValid}
            loading={isSubmitting}
            onClick={handleSendResetEmail}
          >
            재설정 링크 받기
          </TossButton>
        )}
        {step === 1 && (
          <TossButton
            fullWidth
            size="xlarge"
            onClick={() => navigate('/login', { replace: true })}
          >
            로그인하러 가기
          </TossButton>
        )}
        {step === 2 && (
          <TossButton
            fullWidth
            size="xlarge"
            disabled={!passwordValid}
            loading={isSubmitting}
            onClick={handleResetPassword}
          >
            비밀번호 변경
          </TossButton>
        )}
        {step === 3 && (
          <TossButton
            fullWidth
            size="xlarge"
            onClick={() => navigate('/login', { replace: true })}
          >
            로그인하러 가기
          </TossButton>
        )}
      </FixedBottomCTA>
    </div>
  );
}