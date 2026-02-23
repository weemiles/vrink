import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { Smartphone, ShieldCheck, ArrowRight } from 'lucide-react';
import { TossButton } from '../components/TossButton';
import { NavigationBar } from '../components/NavigationBar';
import { FixedBottomCTA } from '../components/FixedBottomCTA';

/**
 * PhoneVerificationPage — 휴대폰 본인인증
 *
 * - 휴대폰 번호 입력 → 인증번호 발송 → 인증번호 입력 → 완료
 * - 독립 라우트: 설정 > 본인인증, 또는 다른 플로우에서 사용
 * - TDS 8pt grid, 24px padding, 44px touch
 */

export function PhoneVerificationPage() {
  const navigate = useNavigate();

  const [step, setStep] = useState<'phone' | 'otp' | 'done'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [timer, setTimer] = useState(0);
  const [timerRef, setTimerRef] = useState<ReturnType<typeof setInterval> | null>(null);
  const [otpError, setOtpError] = useState('');
  const otpInputRef = useRef<HTMLInputElement>(null);

  /* ─── 전화번호 포맷팅 ─── */
  const formatPhone = (v: string) => {
    const d = v.replace(/\D/g, '');
    if (d.length <= 3) return d;
    if (d.length <= 7) return `${d.slice(0, 3)}-${d.slice(3)}`;
    return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7, 11)}`;
  };

  const rawPhone = phone.replace(/\D/g, '');
  const phoneValid = rawPhone.length >= 10 && rawPhone.length <= 11;

  /* ─── 인증번호 발송 ─── */
  const sendOtp = () => {
    if (!phoneValid) return;
    setOtp('');
    setOtpError('');
    setTimer(180);
    setStep('otp');

    if (timerRef) clearInterval(timerRef);
    const id = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(id);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    setTimerRef(id);

    // Auto-focus OTP input
    setTimeout(() => otpInputRef.current?.focus(), 300);
  };

  /* ─── 인증번호 확인 ─── */
  const verifyOtp = () => {
    if (otp.length !== 6) return;
    if (timer === 0) {
      setOtpError('인증 시간이 만료되었어요. 재전송해주세요.');
      return;
    }
    // Mock: any 6 digit
    if (timerRef) clearInterval(timerRef);
    setStep('done');
  };

  const formatTimer = (s: number) => {
    const min = Math.floor(s / 60);
    const sec = s % 60;
    return `${min}:${String(sec).padStart(2, '0')}`;
  };

  useEffect(() => {
    return () => {
      if (timerRef) clearInterval(timerRef);
    };
  }, [timerRef]);

  /* ─── OTP digit boxes ─── */
  const otpDigits = otp.split('').concat(Array(6 - otp.length).fill(''));

  return (
    <div className="h-dvh flex flex-col bg-[var(--toss-bg)]">
      <NavigationBar
        title="본인인증"
        showBack
        onBack={() => {
          if (step === 'otp') setStep('phone');
          else navigate(-1);
        }}
      />

      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {/* ═══ Phone number input ═══ */}
          {step === 'phone' && (
            <motion.div
              key="phone"
              initial={{ x: 40, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -40, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="px-6"
              style={{ paddingTop: 32 }}
            >
              <div
                className="flex items-center justify-center bg-toss-blue-50 rounded-2xl"
                style={{ width: 56, height: 56, marginBottom: 20 }}
              >
                <Smartphone size={26} className="text-toss-blue" />
              </div>

              <h2 className="text-toss-grey-900" style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
                휴대폰 번호를
                <br />입력해주세요
              </h2>
              <p className="text-toss-grey-500" style={{ fontSize: 14, marginBottom: 32, lineHeight: 1.5 }}>
                본인 확인을 위해 인증번호를 보내드려요
              </p>

              <div className="w-full">
                <label
                  className="block text-toss-grey-700"
                  style={{ fontSize: 13, fontWeight: 500, marginBottom: 6 }}
                >
                  휴대폰 번호
                </label>
                <div
                  className="flex items-center bg-toss-grey-100 rounded-xl"
                  style={{ height: 56 }}
                >
                  {/* Country code */}
                  <div
                    className="flex items-center gap-1.5 border-r border-toss-grey-200 shrink-0"
                    style={{ paddingLeft: 16, paddingRight: 12, height: '60%' }}
                  >
                    <span style={{ fontSize: 18 }}>🇰🇷</span>
                    <span className="text-toss-grey-700" style={{ fontSize: 14, fontWeight: 500 }}>+82</span>
                  </div>
                  <input
                    type="tel"
                    placeholder="010-0000-0000"
                    value={formatPhone(phone)}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, '').slice(0, 11);
                      setPhone(digits);
                    }}
                    className="w-full h-full bg-transparent text-toss-grey-900 placeholder-toss-grey-400 outline-none"
                    style={{ fontSize: 17, paddingLeft: 12, paddingRight: 16, fontWeight: 500 }}
                    aria-label="휴대폰 번호"
                    autoFocus
                  />
                </div>
              </div>

              <p className="text-toss-grey-400" style={{ fontSize: 12, marginTop: 12, lineHeight: 1.5 }}>
                입력한 번호로 6자리 인증번호가 발송됩니다.
                <br />통신사 사정에 따라 최대 1분이 소요될 수 있어요.
              </p>
            </motion.div>
          )}

          {/* ═══ OTP input ═══ */}
          {step === 'otp' && (
            <motion.div
              key="otp"
              initial={{ x: 40, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -40, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="px-6"
              style={{ paddingTop: 32 }}
            >
              <h2 className="text-toss-grey-900" style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
                인증번호를 입력해주세요
              </h2>
              <p className="text-toss-grey-500" style={{ fontSize: 14, marginBottom: 8 }}>
                <span className="text-toss-blue" style={{ fontWeight: 600 }}>
                  {formatPhone(phone)}
                </span>
                (으)로 인증번호를 보냈어요
              </p>

              {/* Timer badge */}
              {timer > 0 && (
                <div
                  className="inline-flex items-center bg-toss-red-light rounded-full"
                  style={{ padding: '4px 12px', marginBottom: 24 }}
                >
                  <span className="text-toss-red" style={{ fontSize: 13, fontWeight: 600 }}>
                    남은 시간 {formatTimer(timer)}
                  </span>
                </div>
              )}
              {timer === 0 && (
                <div
                  className="inline-flex items-center bg-toss-grey-100 rounded-full"
                  style={{ padding: '4px 12px', marginBottom: 24 }}
                >
                  <span className="text-toss-grey-500" style={{ fontSize: 13, fontWeight: 500 }}>
                    시간 만료
                  </span>
                </div>
              )}

              {/* OTP Digit Boxes */}
              <div className="relative" style={{ marginBottom: 16 }}>
                <div className="flex gap-2">
                  {otpDigits.map((digit, i) => (
                    <div
                      key={i}
                      className={`flex-1 flex items-center justify-center rounded-xl transition-all ${
                        i === otp.length
                          ? 'ring-2 ring-toss-blue bg-[var(--toss-bg)]'
                          : digit
                          ? 'bg-toss-blue-50'
                          : 'bg-toss-grey-100'
                      }`}
                      style={{ height: 56, borderRadius: 12 }}
                    >
                      <span
                        className={digit ? 'text-toss-grey-900' : 'text-toss-grey-300'}
                        style={{ fontSize: 24, fontWeight: 700 }}
                      >
                        {digit || '·'}
                      </span>
                    </div>
                  ))}
                </div>
                {/* Hidden input for keyboard */}
                <input
                  ref={otpInputRef}
                  type="text"
                  inputMode="numeric"
                  value={otp}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setOtp(v);
                    if (otpError) setOtpError('');
                  }}
                  className="absolute inset-0 w-full h-full opacity-0"
                  style={{ caretColor: 'transparent' }}
                  aria-label="인증번호 6자리"
                  autoFocus
                />
              </div>

              {otpError && (
                <p className="text-toss-red" style={{ fontSize: 13, marginBottom: 8 }} role="alert">
                  {otpError}
                </p>
              )}

              {/* Resend */}
              <button
                onClick={sendOtp}
                className="text-toss-grey-500 active:text-toss-grey-700 transition-colors"
                style={{ fontSize: 13, minHeight: 44 }}
              >
                인증번호 재전송
              </button>
            </motion.div>
          )}

          {/* ═══ Done ═══ */}
          {step === 'done' && (
            <motion.div
              key="done"
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
                <ShieldCheck size={40} className="text-toss-green" strokeWidth={2} />
              </motion.div>

              <h2 className="text-toss-grey-900 text-center" style={{ fontSize: 22, fontWeight: 700 }}>
                인증이 완료되었어요
              </h2>
              <p className="text-toss-grey-500 text-center" style={{ fontSize: 14, marginTop: 8, lineHeight: 1.5 }}>
                {formatPhone(phone)} 번호로
                <br />본인인증이 완료되었습니다
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ─── Bottom CTA ─── */}
      <FixedBottomCTA hasSafeAreaPadding>
        {step === 'phone' && (
          <TossButton
            fullWidth
            size="xlarge"
            disabled={!phoneValid}
            onClick={sendOtp}
          >
            인증번호 받기
          </TossButton>
        )}
        {step === 'otp' && (
          <TossButton
            fullWidth
            size="xlarge"
            disabled={otp.length < 6 || timer === 0}
            onClick={verifyOtp}
          >
            인증 확인
          </TossButton>
        )}
        {step === 'done' && (
          <TossButton
            fullWidth
            size="xlarge"
            onClick={() => navigate(-1)}
          >
            완료
            <ArrowRight size={18} className="ml-1" />
          </TossButton>
        )}
      </FixedBottomCTA>
    </div>
  );
}