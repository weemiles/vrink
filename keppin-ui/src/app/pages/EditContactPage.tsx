import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, X, ChevronDown, User } from 'lucide-react';
import { NavigationBar } from '../components/NavigationBar';
import { TextField, TextArea } from '../components/TextField';
import { TossButton } from '../components/TossButton';
import { FixedBottomCTA } from '../components/FixedBottomCTA';
import { BottomSheet } from '../components/BottomSheet';
import { Popup } from '../components/Popup';
import { Skeleton } from '../components/Skeleton';
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
import { useDelayedLoading } from '../components/useDebounce';
import type { Relationship, Closeness, FamilyStatus } from '../data/contacts';
import {
  getContactByIdFromStore,
  updateContact,
  getAllRelationshipOptions,
  useCustomRelationships,
} from '../data/contactsStore';

const CLOSENESS_OPTIONS: Closeness[] = ['매우 친함', '친함', '보통', '가끔', '거의 모름'];
const FAMILY_STATUS_OPTIONS: FamilyStatus[] = ['미혼', '기혼·자녀 없음', '기혼·자녀 있음', '기타/모름'];

interface EditFormValues {
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

export function EditContactPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const analytics = useAnalytics();
  const motionConfig = useMotionConfig();

  const contact = getContactByIdFromStore(id || '');
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const showLoading = useDelayedLoading(isInitialLoading, 200);

  useEffect(() => {
    analytics.trackScreenView('EditContact');
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setIsInitialLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  // Initialize form values from contact
  const initialValues = useMemo<EditFormValues>(() => {
    if (!contact) return {
      name: '', phone: '', birthday: '', birthdayUnknown: false,
      lastContact: '',
      relationship: '',
      closeness: '', familyStatus: '', memo: '', profileImage: null,
    };
    return {
      name: contact.name,
      phone: contact.phone || '',
      birthday: contact.birthday.replace(/-/g, '.'),
      birthdayUnknown: contact.birthdayUnknown,
      lastContact: contact.lastContact ? contact.lastContact.replace(/-/g, '.') : '',
      relationship: contact.relationship,
      closeness: contact.closeness,
      familyStatus: contact.familyStatus,
      memo: contact.memo,
      profileImage: null,
    };
  }, [contact?.id]);

  const [formValues, setFormValues] = useState<EditFormValues>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [profilePreview, setProfilePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [submitElapsed, setSubmitElapsed] = useState(0);
  const [familyStatusOpen, setFamilyStatusOpen] = useState(false);
  const [dirtyDialogOpen, setDirtyDialogOpen] = useState(false);
  const [undoData, setUndoData] = useState<EditFormValues | null>(null);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const customRelationships = useCustomRelationships();
  const relationshipOptions = useMemo(() => getAllRelationshipOptions(), [customRelationships]);

  // Reset form when contact changes
  useEffect(() => {
    if (contact) {
      setFormValues(initialValues);
    }
  }, [contact?.id]);

  const isDirty = useMemo(
    () => detectChanges(
      initialValues as unknown as Record<string, unknown>,
      formValues as unknown as Record<string, unknown>,
    ),
    [formValues, initialValues],
  );

  const writeState = useWriteState<EditFormValues>({
    submitFn: async (data) => {
      if (!id) throw new Error('No ID');
      // Save previous state for undo
      setUndoData(initialValues);

      updateContact(id, {
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
      await new Promise((resolve) => setTimeout(resolve, 400));
    },
    onSuccess: () => {
      // §3.3 Undo 10초 토스트
      toast.openToast('연락처를 수정했어요', {
        icon: <span aria-hidden="true">✓</span>,
        action: {
          label: '되돌리기',
          onClick: handleUndo,
        },
        duration: 10000,
      });
      analytics.trackEvent('success', {
        screen_name: 'EditContact',
        component_name: 'form',
        action: 'edit_contact',
        result: 'success',
      });
      setTimeout(() => {
        navigate(`/app/contact/${id}`, { replace: true });
      }, 300);
    },
    onFailed: (code) => {
      analytics.trackEvent('fail', {
        screen_name: 'EditContact',
        component_name: 'form',
        action: 'edit_contact',
        result: code,
      });
    },
  });

  const handleUndo = useCallback(() => {
    if (!undoData || !id) return;
    updateContact(id, {
      name: undoData.name,
      phone: undoData.phone || undefined,
      birthday: undoData.birthday || undefined,
      birthdayUnknown: undoData.birthdayUnknown,
      relationship: undoData.relationship as string,
      closeness: undoData.closeness as string,
      familyStatus: undoData.familyStatus || undefined,
      memo: undoData.memo || undefined,
      lastContact: undoData.lastContact || undefined,
    });
    toast.openToast('수정을 되돌렸어요');
    setUndoData(null);
  }, [undoData, id, toast]);

  useEffect(() => {
    return () => {
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    };
  }, []);

  const hasRequiredFields = !!(formValues.name.trim() && formValues.relationship && formValues.closeness);
  const submitButtonState = getSubmitButtonState(hasRequiredFields, isDirty, writeState.state === 'submitting');

  useEffect(() => {
    if (formValues.relationship === '가족' && formValues.closeness !== '가족') {
      setFormValues((prev) => ({ ...prev, closeness: '가족' as Closeness }));
    }
  }, [formValues.relationship]);

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

  const setField = useCallback(<K extends keyof EditFormValues>(key: K, value: EditFormValues[K]) => {
    setFormValues((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  }, [errors]);

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

  const handlePhoneChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { display } = formatPhone(e.target.value);
    setField('phone', display);
  }, [setField]);

  const handleBirthdayChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { display } = formatBirthDate(e.target.value);
    setField('birthday', display);
  }, [setField]);

  const handleImageSelect = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
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

  const handleSubmit = useCallback(() => {
    const fields = [
      { id: 'tf-이름', value: formValues.name, rules: FIELD_RULES.name },
      ...(formValues.phone ? [{ id: 'tf-전화번호', value: formValues.phone, rules: FIELD_RULES.phone }] : []),
      ...(formValues.birthday ? [{ id: 'tf-생년월일', value: formValues.birthday, rules: FIELD_RULES.birthday }] : []),
    ];

    const newErrors: Record<string, string> = {};
    if (!formValues.relationship) newErrors['relationship'] = '관계를 선택해주세요';
    if (!formValues.closeness) newErrors['closeness'] = '친함 정도를 선택해주세요';

    const result = validateOnSubmit(fields);
    const allErrors = { ...result.errors, ...newErrors };

    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors);
      const firstErrorId = result.firstErrorId || Object.keys(newErrors)[0];
      if (firstErrorId) focusFirstErrorField(firstErrorId);
      return;
    }

    writeState.submit(formValues);
  }, [formValues, writeState]);

  const handleBack = useCallback(() => {
    if (isDirty) {
      setDirtyDialogOpen(true);
    } else {
      navigate(-1);
    }
  }, [isDirty, navigate]);

  if (!contact) {
    return (
      <div className="h-dvh flex flex-col items-center justify-center">
        <p className="text-toss-grey-500" style={{ fontSize: 15 }}>연락처를 찾을 수 없습니다</p>
        <TossButton variant="weak" className="mt-4" onClick={() => navigate(-1)}>돌아가기</TossButton>
      </div>
    );
  }

  if (showLoading) {
    return (
      <div className="min-h-dvh bg-[var(--toss-bg)]">
        <NavigationBar title="연락처 수정" showBack />
        <div className="flex flex-col items-center pt-6 pb-4">
          <div className="rounded-full bg-toss-grey-200 animate-pulse" style={{ width: 88, height: 88 }} />
        </div>
        <div className="px-6">
          <Skeleton pattern="subtitleList" repeatLastItemCount={4} style={{ width: '100%' }} />
        </div>
      </div>
    );
  }

  const errorCount = Object.keys(errors).length;

  return (
    <div className="min-h-dvh bg-[var(--toss-bg)]">
      <NavigationBar
        title="연락처 수정"
        showBack
        onBack={handleBack}
        dirtyWarn={isDirty}
        onDirtyBack={() => setDirtyDialogOpen(true)}
      />

      {/* 에러 요약 */}
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

      {/* 제출 진행 상태 */}
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

      <div className="pb-28" style={{ paddingTop: 16 }}>
        {/* Profile Image */}
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
            aria-label="프로필 사진 변경"
          >
            <div className="rounded-full overflow-hidden" style={{ width: 88, height: 88 }}>
              {profilePreview ? (
                <img src={profilePreview} alt="프로필 미리보기" className="w-full h-full object-cover" />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center bg-toss-grey-100"
                >
                  <span className="text-toss-grey-900" style={{ fontSize: 36, fontWeight: 700 }} aria-hidden="true">
                    {contact.name.charAt(0)}
                  </span>
                </div>
              )}
            </div>
            <div
              className="absolute flex items-center justify-center bg-toss-blue rounded-full border-2 border-[var(--toss-bg)]"
              style={{ width: 28, height: 28, bottom: 2, right: 2 }}
              aria-hidden="true"
            >
              <Camera size={14} className="text-[var(--primary-foreground)]" />
            </div>
          </button>
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

        {/* Basic Info */}
        <motion.div
          initial={motionConfig.safeAnimate({ opacity: 0, y: MOTION_DISTANCE.overlay })}
          animate={motionConfig.safeAnimate({ opacity: 1, y: 0 })}
          transition={{ ...motionConfig.safeTransition('screen'), delay: 0.05 }}
          style={{ padding: '0 24px' }}
        >
          <h3 className="text-toss-grey-900" style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>
            기본 정보
          </h3>

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
              help={errors['tf-이름'] || (touched['tf-이름'] && formValues.name ? `${formValues.name.length}/${RECOMMENDED_MAX_LENGTH.name}` : undefined)}
              maxLength={INPUT_MAX_LENGTH.name}
              autoComplete="name"
              aria-required="true"
              right={formValues.name ? (
                <button type="button" onClick={() => setField('name', '')} className="flex items-center justify-center" style={{ width: 28, height: 28 }} aria-label="이름 지우기">
                  <X size={16} className="text-toss-grey-400" />
                </button>
              ) : undefined}
            />
          </div>

          <div style={{ marginBottom: 'var(--toss-form-field-gap, 12px)' }}>
            <TextField
              variant="box"
              label="전화번호"
              labelOption="sustain"
              placeholder="010-0000-0000"
              value={formValues.phone}
              onChange={handlePhoneChange}
              onBlur={() => { if (formValues.phone) handleBlur('tf-전화번호', formValues.phone, FIELD_RULES.phone); }}
              hasError={!!errors['tf-전화번호']}
              help={errors['tf-전화번호']}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              right={formValues.phone ? (
                <button type="button" onClick={() => setField('phone', '')} className="flex items-center justify-center" style={{ width: 28, height: 28 }} aria-label="전화번호 지우기">
                  <X size={16} className="text-toss-grey-400" />
                </button>
              ) : undefined}
            />
          </div>

          <div style={{ marginBottom: 'var(--toss-form-section-gap, 24px)' }}>
            <div className="flex items-center justify-between mb-1">
              <label
                className="block"
                style={{ fontSize: 13, fontWeight: 500, color: 'var(--toss-textfield-label-color)' }}
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
                    setErrors((prev) => { const n = { ...prev }; delete n['tf-생년월일']; return n; });
                  }
                }}
                className="flex items-center gap-1.5"
                style={{ minHeight: 28 }}
                aria-pressed={formValues.birthdayUnknown}
              >
                <div
                  className={`flex items-center justify-center rounded transition-colors ${formValues.birthdayUnknown ? 'bg-toss-blue text-[var(--primary-foreground)]' : 'bg-toss-grey-200'}`}
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
                      setErrors((prev) => ({ ...prev, 'tf-생년월일': '올바른 날짜를 입력해주세요' }));
                    }
                  }
                }}
                hasError={!!errors['tf-생년월일']}
                help={errors['tf-생년월일'] || '생년월일을 입력하면 나이가 자동으로 계산돼요'}
                inputMode="numeric"
                right={formValues.birthday ? (
                  <button type="button" onClick={() => setField('birthday', '')} className="flex items-center justify-center" style={{ width: 28, height: 28 }} aria-label="생년월일 지우기">
                    <X size={16} className="text-toss-grey-400" />
                  </button>
                ) : undefined}
              />
            )}
            {formValues.birthdayUnknown && (
              <div className="flex items-center bg-toss-grey-50 rounded-xl px-4" style={{ height: 52 }}>
                <span className="text-toss-grey-400" style={{ fontSize: 15 }}>생일을 모르는 상태로 저장돼요</span>
              </div>
            )}
          </div>

          {/* 마지막 연락일 */}
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

        {/* Relationship */}
        <motion.div
          initial={motionConfig.safeAnimate({ opacity: 0, y: MOTION_DISTANCE.overlay })}
          animate={motionConfig.safeAnimate({ opacity: 1, y: 0 })}
          transition={{ ...motionConfig.safeTransition('screen'), delay: 0.1 }}
          style={{ padding: '0 24px' }}
        >
          <h3 className="text-toss-grey-900" style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>
            관계 설정
          </h3>

          <div style={{ marginBottom: 20 }}>
            <label
              className="block"
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: errors['relationship'] ? 'var(--toss-textfield-error-color)' : 'var(--toss-textfield-label-color)',
                marginBottom: 8,
              }}
            >
              관계 <span className="text-toss-red">*</span>
            </label>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="관계 선택">
              {relationshipOptions.map((opt) => {
                const isActive = formValues.relationship === opt.value;
                return (
                  <button
                    key={opt.value}
                    role="radio"
                    aria-checked={isActive}
                    onClick={() => {
                      setField('relationship', opt.value as Relationship);
                      setErrors((prev) => { const next = { ...prev }; delete next['relationship']; return next; });
                    }}
                    className={`px-4 py-2 rounded-xl transition-colors ${isActive ? 'bg-toss-blue text-[var(--primary-foreground)]' : 'bg-toss-grey-100 text-toss-grey-700'}`}
                    style={{ fontSize: 14, fontWeight: isActive ? 600 : 400, minHeight: 40, minWidth: 44 }}
                  >
                    {opt.value}
                  </button>
                );
              })}
            </div>
            {errors['relationship'] && (
              <p className="mt-1.5" style={{ fontSize: 12, color: 'var(--toss-textfield-error-color)' }} role="alert">
                {errors['relationship']}
              </p>
            )}
          </div>

          <div style={{ marginBottom: 20 }}>
            <label
              className="block"
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: errors['closeness'] ? 'var(--toss-textfield-error-color)' : 'var(--toss-textfield-label-color)',
                marginBottom: 8,
              }}
            >
              친함 정도 <span className="text-toss-red">*</span>
            </label>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="친함 정도 선택">
              {(formValues.relationship === '가족' ? ['가족'] as readonly string[] : CLOSENESS_OPTIONS).map((option) => {
                const isActive = formValues.closeness === option || (formValues.relationship === '가족' && option === '가족');
                return (
                  <button
                    key={option}
                    role="radio"
                    aria-checked={isActive}
                    onClick={() => {
                      setField('closeness', option as Closeness);
                      setErrors((prev) => { const next = { ...prev }; delete next['closeness']; return next; });
                    }}
                    className={`px-4 py-2 rounded-xl transition-colors ${isActive ? 'bg-toss-blue text-[var(--primary-foreground)]' : 'bg-toss-grey-100 text-toss-grey-700'}`}
                    style={{ fontSize: 14, fontWeight: isActive ? 600 : 400, minHeight: 40, minWidth: 44 }}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
            {errors['closeness'] && (
              <p className="mt-1.5" style={{ fontSize: 12, color: 'var(--toss-textfield-error-color)' }} role="alert">
                {errors['closeness']}
              </p>
            )}
          </div>

          <div style={{ marginBottom: 'var(--toss-form-section-gap, 24px)' }}>
            <label className="block" style={{ fontSize: 13, fontWeight: 500, color: 'var(--toss-textfield-label-color)', marginBottom: 6 }}>
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

        {/* Memo */}
        <motion.div
          initial={motionConfig.safeAnimate({ opacity: 0, y: MOTION_DISTANCE.overlay })}
          animate={motionConfig.safeAnimate({ opacity: 1, y: 0 })}
          transition={{ ...motionConfig.safeTransition('screen'), delay: 0.15 }}
          style={{ padding: '0 24px' }}
        >
          <h3 className="text-toss-grey-900" style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>
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

      {/* Bottom CTA */}
      <FixedBottomCTA>
        <TossButton
          variant="fill"
          color="primary"
          size="xlarge"
          display="full"
          disabled={submitButtonState.disabled}
          loading={submitButtonState.loading}
          onClick={handleSubmit}
          aria-label={submitButtonState.reason || '수정 완료'}
        >
          수정 완료
        </TossButton>
        {submitButtonState.disabled && submitButtonState.reason && !submitButtonState.loading && (
          <p className="text-center mt-2 text-toss-grey-400" style={{ fontSize: 12 }} aria-live="polite">
            {submitButtonState.reason}
          </p>
        )}
      </FixedBottomCTA>

      {/* Family Status Bottom Sheet */}
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
              onClick={() => { setField('familyStatus', status); setFamilyStatusOpen(false); }}
              className={`w-full flex items-center justify-between py-3.5 px-2 rounded-lg transition-colors ${
                formValues.familyStatus === status ? 'bg-toss-blue-50 text-toss-blue' : 'text-toss-grey-800 active:bg-toss-grey-50'
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

      {/* Dirty Dialog */}
      <Popup
        isOpen={dirtyDialogOpen}
        onClose={() => setDirtyDialogOpen(false)}
        title="수정을 그만할까요?"
        description="변경한 내용이 저장되지 않아요."
        confirmText="나가기"
        cancelText="계속 수정"
        destructive
        closeOnDimmerClick={false}
        onConfirm={() => navigate(-1)}
      />
    </div>
  );
}