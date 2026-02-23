import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, X, ChevronDown, User, Plus } from 'lucide-react';
import { NavigationBar } from '../components/NavigationBar';
import { TextField, TextArea } from '../components/TextField';
import { TossButton } from '../components/TossButton';
import { FixedBottomCTA } from '../components/FixedBottomCTA';
import { BottomSheet } from '../components/BottomSheet';
import { Popup } from '../components/Popup';
import { useToast } from '../components/useToast';
import { useAnalytics } from '../components/useAnalytics';
import { useWriteState, getSubmitButtonState, detectChanges } from '../components/useFeatureState';
import {
  validateOnBlur,
  validateOnSubmit,
  focusFirstErrorField,
  formatPhone,
  formatBirthDate,
  INPUT_MAX_LENGTH,
  RECOMMENDED_MAX_LENGTH,
  getSubmitProgressState,
  type FieldValidationRules,
} from '../components/useInputValidation';
import { validateImageFile } from '../components/useMediaUpload';
import { useMotionConfig, MOTION_DISTANCE } from '../components/useMotionConfig';
import type { Relationship, Closeness, FamilyStatus } from '../data/contacts';
import {
  addContact,
  addCustomRelationship,
  removeCustomRelationship,
  hideDefaultRelationship,
  getAllRelationshipOptions,
  useCustomRelationships,
  DEFAULT_RELATIONSHIP_OPTIONS,
} from '../data/contactsStore';
import { useDocumentTitle } from '../components/useDocumentTitle';

/* ═══════════════════════════════════════════════
   상수 — 관계·친함·가족 상태 옵션
   ═══════════════════════════════════════════════ */

const CLOSENESS_OPTIONS: Closeness[] = ['매우 친함', '친함', '보통', '가끔', '거의 모름'];

const FAMILY_STATUS_OPTIONS: FamilyStatus[] = ['미혼', '기혼·자녀 없음', '기혼·자녀 있음', '기타/모름'];

/* ═══════════════════════════════════════════════
   폼 초기값 & 검증 규칙
   ═══════════════════════════════════════════════ */

interface ContactFormValues {
  name: string;
  phone: string;
  birthday: string;
  birthdayUnknown: boolean;
  lastContact: string;
  relationship: Relationship | '';
  closeness: Closeness | '';
  familyStatus: FamilyStatus | '';
  memo: string;
  profileImage: string | null;
}

const INITIAL_VALUES: ContactFormValues = {
  name: '',
  phone: '',
  birthday: '',
  birthdayUnknown: false,
  lastContact: '',
  relationship: '',
  closeness: '',
  familyStatus: '',
  memo: '',
  profileImage: null,
};

/** §1.3 필드별 검증 규칙 */
const FIELD_RULES: Record<string, FieldValidationRules> = {
  name: {
    required: true,
    requiredMessage: '이름을 입력해주세요',
    maxLength: INPUT_MAX_LENGTH.name,
    minLength: 1,
    minLengthMessage: '이름을 입력해주세요',
  },
  phone: {
    pattern: /^(\d{2,3})-?(\d{3,4})-?(\d{4})$/,
    patternMessage: '올바른 전화번호를 입력해주세요',
  },
  birthday: {
    pattern: /^\d{4}\.\d{2}\.\d{2}$/,
    patternMessage: '올바른 생년월일을 입력해주세요',
  },
};

/* ═══════════════════════════════════════════════
   아바타 컬러 팔레트 (기존 contacts.ts와 동일)
   ═══════════════════════════════════════════════ */

const AVATAR_COLORS = [
  '#2D2D2D', '#525252', '#737373', '#8A8A8A', '#A3A3A3',
  '#3D3D3D', '#5C5C5C', '#666666', '#999999', '#B0B0B0',
];

function getRandomAvatarColor(): string {
  return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
}

/* ═══════════════════════════════════════════════
   메인 페이지 컴포넌트
   ═══════════════════════════════════════════════ */

export function AddContactPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const analytics = useAnalytics();
  const motionConfig = useMotionConfig();
  useDocumentTitle('인연 추가');

  // §5.1 screen_view
  useEffect(() => {
    analytics.trackScreenView('AddContact');
  }, []);

  /* ─── Form State ─── */
  const [formValues, setFormValues] = useState<ContactFormValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [profilePreview, setProfilePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [submitElapsed, setSubmitElapsed] = useState(0);

  /* ─── Bottom Sheets ─── */
  const [familyStatusOpen, setFamilyStatusOpen] = useState(false);
  const [addRelOpen, setAddRelOpen] = useState(false);
  const [newRelName, setNewRelName] = useState('');
  const [deleteRelTarget, setDeleteRelTarget] = useState<string | null>(null);

  /* ─── 커스텀 관계 반응형 구독 ─── */
  const customRelationships = useCustomRelationships();
  const relationshipOptions = useMemo(() => getAllRelationshipOptions(), [customRelationships]);

  /* ─── Dirty Check — §1.2 뒤로가기 경고 ─── */
  const [dirtyDialogOpen, setDirtyDialogOpen] = useState(false);
  const isDirty = useMemo(
    () => detectChanges(INITIAL_VALUES as Record<string, unknown>, formValues as unknown as Record<string, unknown>),
    [formValues],
  );

  /* ─── Write 상태 머신 — §5.1 ─── */
  const writeState = useWriteState<ContactFormValues>({
    submitFn: async (data) => {
      // 스토어에 실제 저장 (localStorage 영속화)
      addContact({
        name: data.name,
        phone: data.phone || undefined,
        birthday: data.birthday || undefined,
        birthdayUnknown: data.birthdayUnknown,
        relationship: data.relationship as string,
        closeness: data.closeness as string,
        familyStatus: data.familyStatus || undefined,
        memo: data.memo || undefined,
        profileImage: data.profileImage,
        lastContact: data.lastContact || undefined,
      });
      // 저장 시뮬레이션 지연 (UX)
      await new Promise((resolve) => setTimeout(resolve, 600));
    },
    onSuccess: () => {
      toast.openToast('연락처를 추가했어요', { icon: <span aria-hidden="true">✓</span> });
      analytics.trackEvent('success', {
        screen_name: 'AddContact',
        component_name: 'form',
        action: 'add_contact',
        result: 'success',
      });
      // §1.2: 300ms 후 뒤로가기
      setTimeout(() => {
        navigate('/app/contacts', { replace: true });
      }, 300);
    },
    onFailed: (code) => {
      analytics.trackEvent('fail', {
        screen_name: 'AddContact',
        component_name: 'form',
        action: 'add_contact',
        result: code,
      });
    },
  });

  /* ─── §5.4 제출 버튼 상태 ─── */
  const hasRequiredFields = !!(formValues.name.trim() && formValues.relationship && formValues.closeness);
  const hasChanges = isDirty;
  const submitButtonState = getSubmitButtonState(
    hasRequiredFields,
    hasChanges,
    writeState.state === 'submitting',
  );

  /* ─── 관계 '가족' 선택 시 친함도 자동 설정 ─── */
  useEffect(() => {
    if (formValues.relationship === '가족' && formValues.closeness !== '가족') {
      setFormValues((prev) => ({ ...prev, closeness: '가족' }));
    }
  }, [formValues.relationship, formValues.closeness]);

  /* ─── §2.6 제출 2초 초과 → 진행 문구 ─── */
  useEffect(() => {
    if (writeState.state !== 'submitting') {
      setSubmitElapsed(0);
      return;
    }
    const start = Date.now();
    const interval = setInterval(() => {
      setSubmitElapsed(Date.now() - start);
    }, 200);
    return () => clearInterval(interval);
  }, [writeState.state]);

  const submitProgress = getSubmitProgressState(submitElapsed);

  /* ─── Field Helpers ─── */
  const setField = useCallback(<K extends keyof ContactFormValues>(key: K, value: ContactFormValues[K]) => {
    setFormValues((prev) => ({ ...prev, [key]: value }));
    // onChange 시에는 에러 제거만 (에러 노출 금지 — §1.2)
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  }, [errors]);

  /** §1.2 onBlur 검증 */
  const handleBlur = useCallback((fieldId: string, value: string, rules: FieldValidationRules) => {
    setTouched((prev) => ({ ...prev, [fieldId]: true }));
    const error = validateOnBlur(value, rules);
    setErrors((prev) => {
      if (error) return { ...prev, [fieldId]: error };
      const next = { ...prev };
      delete next[fieldId];
      return next;
    });
  }, []);

  /* ─── Profile Image ─── */
  const handleImageSelect = useCallback(() => {
    fileInputRef.current?.click();
    analytics.trackEvent('click', {
      screen_name: 'AddContact',
      component_name: 'profileImage',
      action: 'select_image',
    });
  }, [analytics]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // §3.1 이미지 검증
    const validation = validateImageFile(file);
    if (!validation.valid) {
      toast.openToast(validation.errors[0].message);
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setProfilePreview(result);
      setField('profileImage', result);
    };
    reader.readAsDataURL(file);
  }, [toast, setField]);

  const removeImage = useCallback(() => {
    setProfilePreview(null);
    setField('profileImage', null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [setField]);

  /* ─── Phone Format — §1.4 ─── */
  const handlePhoneChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { display } = formatPhone(e.target.value);
    setField('phone', display);
  }, [setField]);

  /* ─── Birthday Format — §2.5 ─── */
  const handleBirthdayChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { display } = formatBirthDate(e.target.value);
    setField('birthday', display);
  }, [setField]);

  /* ─── Submit — §1.2 전체 검증 + 첫 에러 포커스 ─── */
  const handleSubmit = useCallback(() => {
    // 검증 필드 목록
    const fields = [
      { id: 'tf-이름', value: formValues.name, rules: FIELD_RULES.name },
      ...(formValues.phone ? [{ id: 'tf-전화번호', value: formValues.phone, rules: FIELD_RULES.phone }] : []),
      ...(formValues.birthday ? [{ id: 'tf-생년월일', value: formValues.birthday, rules: FIELD_RULES.birthday }] : []),
    ];

    // 필수 선택 검증
    const newErrors: Record<string, string> = {};
    if (!formValues.relationship) {
      newErrors['relationship'] = '관계를 선택해주세요';
    }
    if (!formValues.closeness) {
      newErrors['closeness'] = '친함 정도를 선택해주세요';
    }

    const result = validateOnSubmit(fields);
    const allErrors = { ...result.errors, ...newErrors };

    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors);
      // 첫 에러 필드 포커스
      const firstErrorId = result.firstErrorId || Object.keys(newErrors)[0];
      if (firstErrorId) {
        focusFirstErrorField(firstErrorId);
      }
      return;
    }

    // 제출
    writeState.submit(formValues);
    analytics.trackEvent('submit', {
      screen_name: 'AddContact',
      component_name: 'form',
      action: 'submit_contact',
    });
  }, [formValues, writeState, analytics]);

  /* ─── Back Navigation ─── */
  const handleBack = useCallback(() => {
    if (isDirty) {
      setDirtyDialogOpen(true);
    } else {
      navigate(-1);
    }
  }, [isDirty, navigate]);

  /* ─── Section Chip Selector ─── */
  const ChipSelector = useCallback(({
    options,
    value,
    onChange,
    colors,
    ariaLabel,
  }: {
    options: readonly string[];
    value: string;
    onChange: (v: string) => void;
    colors?: Record<string, string>;
    ariaLabel: string;
  }) => (
    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={ariaLabel}>
      {options.map((option) => {
        const isActive = value === option;
        const chipColor = colors?.[option];
        return (
          <button
            key={option}
            role="radio"
            aria-checked={isActive}
            onClick={() => onChange(option)}
            className={`px-4 py-2 rounded-xl transition-colors ${
              isActive
                ? chipColor
                  ? ''
                  : 'bg-toss-blue text-[var(--primary-foreground)]'
                : 'bg-toss-grey-100 text-toss-grey-700'
            }`}
            style={{
              fontSize: 14,
              fontWeight: isActive ? 600 : 400,
              minHeight: 40,
              minWidth: 44,
              ...(isActive && chipColor
                ? { backgroundColor: chipColor + '18', color: chipColor, border: `1.5px solid ${chipColor}` }
                : {}),
            }}
          >
            {option}
          </button>
        );
      })}
    </div>
  ), []);

  /* ─── 에러 요약 (2개 이상 시 상단 표시 — §1.5) ─── */
  const errorCount = Object.keys(errors).length;

  return (
    <div className="min-h-dvh bg-[var(--toss-bg)]">
      {/* NavigationBar — §1.1 */}
      <NavigationBar
        title="연락처 추가"
        showBack
        onBack={handleBack}
        dirtyWarn={isDirty}
        onDirtyBack={() => setDirtyDialogOpen(true)}
      />

      {/* 에러 요약 — §1.5 2개 이상 에러 시 상단 요약 */}
      <AnimatePresence>
        {errorCount >= 2 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-toss-red-50 mx-6 rounded-xl overflow-hidden"
            style={{ marginTop: 8 }}
            role="alert"
          >
            <p className="text-toss-red px-4 py-3" style={{ fontSize: 13 }}>
              {errorCount}개 항목을 확인해주세요
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 제출 진행 상태 — §2.6 2초 초과 */}
      <AnimatePresence>
        {submitProgress.phase === 'slow' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mx-6 mt-2 bg-toss-blue-50 rounded-xl"
            role="status"
            aria-live="polite"
          >
            <p className="text-toss-blue px-4 py-3" style={{ fontSize: 13, fontWeight: 500 }}>
              {submitProgress.progressMessage}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scrollable Form Content */}
      <div className="pb-28" style={{ paddingTop: 16 }}>
        {/* ───── Section 1: Profile Image ───── */}
        <motion.div
          initial={motionConfig.safeAnimate({ opacity: 0, y: MOTION_DISTANCE.overlay })}
          animate={motionConfig.safeAnimate({ opacity: 1, y: 0 })}
          transition={motionConfig.safeTransition('screen')}
          className="flex flex-col items-center"
          style={{ paddingBottom: 24 }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic"
            className="hidden"
            onChange={handleFileChange}
            aria-label="프로필 이미지 선택"
          />

          <button
            onClick={handleImageSelect}
            className="relative flex items-center justify-center"
            style={{ width: 96, height: 96 }}
            aria-label="프로필 사진 추가"
          >
            <div className="rounded-full overflow-hidden" style={{ width: 88, height: 88 }}>
              {profilePreview ? (
                <img
                  src={profilePreview}
                  alt="프로필 미리보기"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center bg-toss-grey-100"
                >
                  <User size={36} className="text-toss-grey-400" aria-hidden="true" />
                </div>
              )}
            </div>
            {/* Camera badge — overflow-hidden 밖에 위치하여 잘림 방지 */}
            <div
              className="absolute flex items-center justify-center bg-toss-blue rounded-full border-2 border-[var(--toss-bg)]"
              style={{ width: 28, height: 28, bottom: 2, right: 2 }}
              aria-hidden="true"
            >
              <Camera size={14} className="text-[var(--primary-foreground)]" />
            </div>
          </button>

          {/* Remove image button */}
          <AnimatePresence>
            {profilePreview && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={removeImage}
                className="mt-2 text-toss-grey-500"
                style={{ fontSize: 12, minHeight: 32 }}
                aria-label="프로필 사진 삭제"
              >
                사진 삭제
              </motion.button>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ───── Section 2: Basic Info ───── */}
        <motion.div
          initial={motionConfig.safeAnimate({ opacity: 0, y: MOTION_DISTANCE.overlay })}
          animate={motionConfig.safeAnimate({ opacity: 1, y: 0 })}
          transition={{ ...motionConfig.safeTransition('screen'), delay: 0.05 }}
          style={{ padding: '0 24px' }}
        >
          <h3
            className="text-toss-grey-900"
            style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}
          >
            기본 정보
          </h3>

          {/* 이름 — 필수 */}
          <div style={{ marginBottom: 'var(--toss-form-field-gap, 12px)' }}>
            <TextField
              variant="box"
              label="이름"
              labelOption="sustain"
              placeholder="이름을 입력해주세요"
              value={formValues.name}
              onChange={(e) => setField('name', e.target.value)}
              onBlur={() => handleBlur('tf-이름', formValues.name, FIELD_RULES.name)}
              hasError={!!errors['tf-이름']}
              help={
                errors['tf-이름'] ||
                (touched['tf-이름'] && formValues.name
                  ? `${formValues.name.length}/${RECOMMENDED_MAX_LENGTH.name}`
                  : undefined)
              }
              maxLength={INPUT_MAX_LENGTH.name}
              autoComplete="name"
              aria-required="true"
              right={
                formValues.name ? (
                  <button
                    type="button"
                    onClick={() => setField('name', '')}
                    className="flex items-center justify-center"
                    style={{ width: 28, height: 28 }}
                    aria-label="이름 지우기"
                  >
                    <X size={16} className="text-toss-grey-400" />
                  </button>
                ) : undefined
              }
            />
          </div>

          {/* 전화번호 */}
          <div style={{ marginBottom: 'var(--toss-form-field-gap, 12px)' }}>
            <TextField
              variant="box"
              label="전화번호"
              labelOption="sustain"
              placeholder="010-0000-0000"
              value={formValues.phone}
              onChange={handlePhoneChange}
              onBlur={() => {
                if (formValues.phone) {
                  handleBlur('tf-전화번호', formValues.phone, FIELD_RULES.phone);
                }
              }}
              hasError={!!errors['tf-전화번호']}
              help={errors['tf-전화번호']}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              right={
                formValues.phone ? (
                  <button
                    type="button"
                    onClick={() => setField('phone', '')}
                    className="flex items-center justify-center"
                    style={{ width: 28, height: 28 }}
                    aria-label="전화번호 지우기"
                  >
                    <X size={16} className="text-toss-grey-400" />
                  </button>
                ) : undefined
              }
            />
          </div>

          {/* 생년월일 */}
          <div style={{ marginBottom: 'var(--toss-form-section-gap, 24px)' }}>
            <div className="flex items-center justify-between mb-1">
              <label
                className="block"
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: 'var(--toss-textfield-label-color)',
                }}
              >
                나이 · 생일
              </label>
              <button
                type="button"
                onClick={() => {
                  const next = !formValues.birthdayUnknown;
                  setField('birthdayUnknown', next);
                  if (next) {
                    setField('birthday', '');
                    setErrors((prev) => {
                      const n = { ...prev };
                      delete n['tf-생년월일'];
                      return n;
                    });
                  }
                }}
                className="flex items-center gap-1.5"
                style={{ minHeight: 28 }}
                aria-pressed={formValues.birthdayUnknown}
              >
                <div
                  className={`flex items-center justify-center rounded transition-colors ${
                    formValues.birthdayUnknown ? 'bg-toss-blue text-[var(--primary-foreground)]' : 'bg-toss-grey-200'
                  }`}
                  style={{ width: 18, height: 18, borderRadius: 4 }}
                >
                  {formValues.birthdayUnknown && (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2.5 6L5 8.5L9.5 3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
                <span className="text-toss-grey-500" style={{ fontSize: 13 }}>모름</span>
              </button>
            </div>
            {!formValues.birthdayUnknown && (
              <TextField
                variant="box"
                label=""
                placeholder="YYYY.MM.DD"
                value={formValues.birthday}
                onChange={handleBirthdayChange}
                onBlur={() => {
                  if (formValues.birthday) {
                    handleBlur('tf-생년월일', formValues.birthday, FIELD_RULES.birthday);
                    const parsed = formatBirthDate(formValues.birthday.replace(/\./g, ''));
                    if (parsed.display && !parsed.valid) {
                      setErrors((prev) => ({
                        ...prev,
                        'tf-생년월일': '올바른 날짜를 입력해주세요',
                      }));
                    }
                  }
                }}
                hasError={!!errors['tf-생년월일']}
                help={errors['tf-생년월일'] || '생년월일을 입력하면 나이가 자동으로 계산돼요'}
                inputMode="numeric"
                right={
                  formValues.birthday ? (
                    <button
                      type="button"
                      onClick={() => setField('birthday', '')}
                      className="flex items-center justify-center"
                      style={{ width: 28, height: 28 }}
                      aria-label="생년월일 지우기"
                    >
                      <X size={16} className="text-toss-grey-400" />
                    </button>
                  ) : undefined
                }
              />
            )}
            {formValues.birthdayUnknown && (
              <div
                className="flex items-center bg-toss-grey-50 rounded-xl px-4"
                style={{ height: 52 }}
              >
                <span className="text-toss-grey-400" style={{ fontSize: 15 }}>생일을 모르는 상태로 저장돼요</span>
              </div>
            )}
          </div>

          {/* 마지막 연락일 — 선택 */}
          <div style={{ marginBottom: 'var(--toss-form-section-gap, 24px)' }}>
            <label
              className="block"
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: 'var(--toss-textfield-label-color)',
                marginBottom: 4,
              }}
            >
              마지막 연락일
            </label>
            <TextField
              variant="box"
              label=""
              placeholder="YYYY.MM.DD"
              value={formValues.lastContact}
              onChange={(e) => {
                const { display } = formatBirthDate(e.target.value);
                setField('lastContact', display);
              }}
              onBlur={() => {
                if (formValues.lastContact && !/^\d{4}\.\d{2}\.\d{2}$/.test(formValues.lastContact)) {
                  setErrors((prev) => ({
                    ...prev,
                    'tf-마지막연락일': '올바른 날짜를 입력해주세요',
                  }));
                } else {
                  setErrors((prev) => {
                    const n = { ...prev };
                    delete n['tf-마지막연락일'];
                    return n;
                  });
                }
              }}
              hasError={!!errors['tf-마지막연락일']}
              help={
                errors['tf-마지막연락일'] ||
                (() => {
                  if (!formValues.lastContact || !/^\d{4}\.\d{2}\.\d{2}$/.test(formValues.lastContact)) {
                    return '입력하면 연락 공백이 자동으로 계산돼요';
                  }
                  const iso = formValues.lastContact.replace(/\./g, '-');
                  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));
                  if (diff < 0) return '미래 날짜예요';
                  if (diff === 0) return '연락 안 한지 < 오늘 연락함';
                  if (diff < 7) return `연락 안 한지 < ${diff}일`;
                  if (diff < 30) return `연락 안 한지 < ${Math.floor(diff / 7)}주`;
                  if (diff < 365) return `연락 안 한지 < ${Math.floor(diff / 30)}개월`;
                  return `연락 안 한지 < ${Math.floor(diff / 365)}년 이상`;
                })()
              }
              inputMode="numeric"
              right={
                formValues.lastContact ? (
                  <button
                    type="button"
                    onClick={() => setField('lastContact', '')}
                    className="flex items-center justify-center"
                    style={{ width: 28, height: 28 }}
                    aria-label="마지막 연락일 지우기"
                  >
                    <X size={16} className="text-toss-grey-400" />
                  </button>
                ) : undefined
              }
            />
          </div>
        </motion.div>

        {/* ───── Section 3: Relationship ───── */}
        <motion.div
          initial={motionConfig.safeAnimate({ opacity: 0, y: MOTION_DISTANCE.overlay })}
          animate={motionConfig.safeAnimate({ opacity: 1, y: 0 })}
          transition={{ ...motionConfig.safeTransition('screen'), delay: 0.1 }}
          style={{ padding: '0 24px' }}
        >
          <h3
            className="text-toss-grey-900"
            style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}
          >
            관계 설정
          </h3>

          {/* 관계 — 필수 */}
          <div style={{ marginBottom: 20 }}>
            <label
              className="block"
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: errors['relationship']
                  ? 'var(--toss-textfield-error-color)'
                  : 'var(--toss-textfield-label-color)',
                marginBottom: 8,
              }}
            >
              관계 <span className="text-toss-red">*</span>
            </label>
            {/* 관계 칩 + 추가/삭제 기능 */}
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="관계 선택">
              {relationshipOptions.map((opt) => {
                const isActive = formValues.relationship === opt.value;
                return (
                  <div key={opt.value} className="relative">
                    <button
                      role="radio"
                      aria-checked={isActive}
                      onClick={() => {
                        setField('relationship', opt.value as Relationship);
                        setErrors((prev) => {
                          const next = { ...prev };
                          delete next['relationship'];
                          return next;
                        });
                      }}
                      className={`px-4 py-2 rounded-xl transition-colors ${
                        isActive ? 'bg-toss-blue text-[var(--primary-foreground)]' : 'bg-toss-grey-100 text-toss-grey-700'
                      }`}
                      style={{
                        fontSize: 14,
                        fontWeight: isActive ? 600 : 400,
                        minHeight: 40,
                        minWidth: 44,
                      }}
                    >
                      {opt.value}
                    </button>
                    {/* 모든 관계 삭제 가능 — 모바일 터치 대응 (항상 표시) */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteRelTarget(opt.value);
                      }}
                      className="absolute -top-1.5 -right-1.5 flex items-center justify-center bg-toss-grey-500 rounded-full"
                      style={{ width: 18, height: 18, zIndex: 1 }}
                      aria-label={`${opt.value} 관계 삭제`}
                    >
                      <X size={10} className="text-white" />
                    </button>
                  </div>
                );
              })}
              {/* 관계 추가 "+" 칩 */}
              <button
                onClick={() => {
                  setAddRelOpen(true);
                  setNewRelName('');
                }}
                className="flex items-center gap-1 px-3 py-2 rounded-xl bg-toss-grey-100 text-toss-grey-500 transition-colors active:bg-toss-grey-200"
                style={{ fontSize: 14, minHeight: 40, minWidth: 44 }}
                aria-label="새 관계 추가"
              >
                <Plus size={16} />
                <span>추가</span>
              </button>
            </div>
            {errors['relationship'] && (
              <p className="mt-1.5" style={{ fontSize: 12, color: 'var(--toss-textfield-error-color)' }} role="alert">
                {errors['relationship']}
              </p>
            )}
          </div>

          {/* 친함 정도 — 필수 */}
          <div style={{ marginBottom: 20 }}>
            <label
              className="block"
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: errors['closeness']
                  ? 'var(--toss-textfield-error-color)'
                  : 'var(--toss-textfield-label-color)',
                marginBottom: 8,
              }}
            >
              친함 정도 <span className="text-toss-red">*</span>
            </label>
            <ChipSelector
              options={
                formValues.relationship === '가족'
                  ? ['가족'] as readonly string[]
                  : CLOSENESS_OPTIONS
              }
              value={formValues.relationship === '가족' ? '가족' : formValues.closeness}
              onChange={(v) => {
                setField('closeness', v as Closeness);
                setErrors((prev) => {
                  const next = { ...prev };
                  delete next['closeness'];
                  return next;
                });
              }}
              ariaLabel="친함 정도 선택"
            />
            {errors['closeness'] && (
              <p className="mt-1.5" style={{ fontSize: 12, color: 'var(--toss-textfield-error-color)' }} role="alert">
                {errors['closeness']}
              </p>
            )}
          </div>

          {/* 가족 상태 — 선택 */}
          <div style={{ marginBottom: 'var(--toss-form-section-gap, 24px)' }}>
            <label
              className="block"
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: 'var(--toss-textfield-label-color)',
                marginBottom: 6,
              }}
            >
              가족 상태
            </label>
            <button
              onClick={() => setFamilyStatusOpen(true)}
              className="w-full flex items-center justify-between bg-toss-grey-100 rounded-xl transition-all"
              style={{ height: 52, paddingLeft: 16, paddingRight: 12, fontSize: 16 }}
              aria-haspopup="listbox"
              aria-expanded={familyStatusOpen}
            >
              <span className={formValues.familyStatus ? 'text-toss-grey-900' : 'text-toss-grey-400'}>
                {formValues.familyStatus || '선택해주세요'}
              </span>
              <ChevronDown size={20} className="text-toss-grey-400" aria-hidden="true" />
            </button>
          </div>
        </motion.div>

        {/* ───── Section 4: Memo ───── */}
        <motion.div
          initial={motionConfig.safeAnimate({ opacity: 0, y: MOTION_DISTANCE.overlay })}
          animate={motionConfig.safeAnimate({ opacity: 1, y: 0 })}
          transition={{ ...motionConfig.safeTransition('screen'), delay: 0.15 }}
          style={{ padding: '0 24px' }}
        >
          <h3
            className="text-toss-grey-900"
            style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}
          >
            메모
          </h3>

          <TextArea
            variant="box"
            placeholder="이 사람에 대해 기억할 내용을 적어보세요"
            value={formValues.memo}
            onChange={(e) => setField('memo', e.target.value)}
            minHeight={100}
            maxLength={INPUT_MAX_LENGTH.memo}
          />
          {formValues.memo && (
            <p className="text-right mt-1" style={{ fontSize: 12, color: 'var(--toss-textfield-help-color)' }}>
              {formValues.memo.length}/{RECOMMENDED_MAX_LENGTH.memo}
            </p>
          )}
        </motion.div>
      </div>

      {/* ───── Bottom CTA — §5.4 ─── */}
      <FixedBottomCTA>
        <TossButton
          variant="fill"
          color="primary"
          size="xlarge"
          display="full"
          disabled={submitButtonState.disabled}
          loading={submitButtonState.loading}
          onClick={handleSubmit}
          aria-label={submitButtonState.reason || '저장하기'}
        >
          저장하기
        </TossButton>
        {/* §5.4 disabled 사유 표시 */}
        {submitButtonState.disabled && submitButtonState.reason && !submitButtonState.loading && (
          <p
            className="text-center mt-2 text-toss-grey-400"
            style={{ fontSize: 12 }}
            aria-live="polite"
          >
            {submitButtonState.reason}
          </p>
        )}
      </FixedBottomCTA>

      {/* ───── Family Status Bottom Sheet ───── */}
      <BottomSheet
        isOpen={familyStatusOpen}
        onClose={() => setFamilyStatusOpen(false)}
        title="가족 상태"
        closeOnDimmerClick
      >
        <div className="space-y-1 pb-4">
          {FAMILY_STATUS_OPTIONS.map((status) => (
            <button
              key={status}
              onClick={() => {
                setField('familyStatus', status);
                setFamilyStatusOpen(false);
              }}
              className={`w-full flex items-center justify-between py-3.5 px-2 rounded-lg transition-colors ${
                formValues.familyStatus === status
                  ? 'bg-toss-blue-50 text-toss-blue'
                  : 'text-toss-grey-800 active:bg-toss-grey-50'
              }`}
              style={{ fontSize: 15, minHeight: 44, fontWeight: formValues.familyStatus === status ? 600 : 400 }}
              role="option"
              aria-selected={formValues.familyStatus === status}
            >
              {status}
              {formValues.familyStatus === status && (
                <span className="text-toss-blue" style={{ fontSize: 14 }} aria-hidden="true">✓</span>
              )}
            </button>
          ))}
        </div>
      </BottomSheet>

      {/* ───── Dirty Back Popup — §1.2 ─── */}
      <Popup
        isOpen={dirtyDialogOpen}
        onClose={() => setDirtyDialogOpen(false)}
        title="작성을 중단할까요?"
        description="입력한 내용이 저장되지 않아요."
        confirmText="나가기"
        cancelText="계속 작성"
        destructive
        closeOnDimmerClick={false}
        onConfirm={() => {
          analytics.trackEvent('click', {
            screen_name: 'AddContact',
            component_name: 'dirtyDialog',
            action: 'discard',
          });
          navigate(-1);
        }}
      />

      {/* ───── Write Failed Dialog — §6.1 에러 문장 구조(사실 → 행동 → 원인) ─── */}
      <Popup
        isOpen={writeState.state === 'failed'}
        onClose={() => writeState.reset()}
        title={writeState.errorMessage || '연락처를 저장할 수 없었어요'}
        description="네트워크 연결을 확인하고 다시 시도해주세요."
        confirmText={writeState.errorAction?.label || '다시 시도'}
        onConfirm={() => {
          writeState.reset();
          handleSubmit();
        }}
      />

      {/* ───── 커스텀 관계 추가 BottomSheet ─── */}
      <BottomSheet
        isOpen={addRelOpen}
        onClose={() => setAddRelOpen(false)}
        title="관계 추가"
        closeOnDimmerClick
      >
        <div className="pb-4">
          <p className="text-toss-grey-500 mb-4" style={{ fontSize: 13 }}>
            나만의 관계를 추가해보세요
          </p>
          <TextField
            variant="box"
            label="관계 이름"
            labelOption="sustain"
            placeholder="예: 동호회, 이웃, 교회"
            value={newRelName}
            onChange={(e) => setNewRelName(e.target.value)}
            maxLength={10}
            autoFocus
            right={
              newRelName ? (
                <button
                  type="button"
                  onClick={() => setNewRelName('')}
                  className="flex items-center justify-center"
                  style={{ width: 28, height: 28 }}
                  aria-label="입력 지우기"
                >
                  <X size={16} className="text-toss-grey-400" />
                </button>
              ) : undefined
            }
          />
          <div className="mt-4">
            <TossButton
              variant="fill"
              color="primary"
              size="large"
              display="full"
              disabled={!newRelName.trim()}
              onClick={() => {
                const success = addCustomRelationship(newRelName.trim());
                if (success) {
                  toast.openToast(`'${newRelName.trim()}' 관계를 추가했어요`);
                  // 추가한 관계를 바로 선택
                  setField('relationship', newRelName.trim() as Relationship);
                  setErrors((prev) => {
                    const next = { ...prev };
                    delete next['relationship'];
                    return next;
                  });
                  setAddRelOpen(false);
                  setNewRelName('');
                } else {
                  toast.openToast('이미 있는 관계예요');
                }
              }}
            >
              추가하기
            </TossButton>
          </div>
        </div>
      </BottomSheet>

      {/* ───── 관계 삭제 확인 Popup (기본 + 커스텀 모두) ─── */}
      <Popup
        isOpen={!!deleteRelTarget}
        onClose={() => setDeleteRelTarget(null)}
        title={`'${deleteRelTarget}' 관계를 삭제할까요?`}
        description="이 관계가 선택된 연락처에는 영향이 없어요."
        confirmText="삭제"
        cancelText="취소"
        destructive
        closeOnDimmerClick={false}
        onConfirm={() => {
          if (deleteRelTarget) {
            // 기본 관계인지 커스텀 관계인지 판단
            const isDefault = DEFAULT_RELATIONSHIP_OPTIONS.some(r => r.value === deleteRelTarget);
            if (isDefault) {
              hideDefaultRelationship(deleteRelTarget);
            } else {
              removeCustomRelationship(deleteRelTarget);
            }
            // 현재 선택된 계가 삭제 대상이면 초기화
            if (formValues.relationship === deleteRelTarget) {
              setField('relationship', '' as Relationship);
            }
            toast.openToast(`'${deleteRelTarget}' 관계를 삭제했어요`);
            setDeleteRelTarget(null);
          }
        }}
      />
    </div>
  );
}