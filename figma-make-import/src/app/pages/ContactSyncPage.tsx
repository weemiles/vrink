import { useState, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users, BookUser, Search, Check,
  CheckCircle2, Smartphone, ArrowRight, Sparkles,
} from 'lucide-react';
import { TossButton } from '../components/TossButton';
import { SearchField } from '../components/SearchField';
import { ContactAvatar } from '../components/ContactAvatar';
import { NavigationBar } from '../components/NavigationBar';
import { ProgressBar } from '../components/ProgressBar';
import { useToast } from '../components/useToast';
import { useAnalytics } from '../components/useAnalytics';
import { useDebounce } from '../components/useDebounce';
import { PermissionPrePrompt } from '../components/PermissionPrompt';
import {
  deviceContacts,
  groupByInitial,
  filterDeviceContacts,
  type DeviceContact,
} from '../data/deviceContacts';

/**
 * 온보딩 연락처 연동 페이지
 *
 * 온보딩 3단계 (§3.1 useOnboardingUX):
 *   Step 0 — Why: 앱의 가치를 전달
 *   Step 1 — Enable: 연락처 권한 요청 + 선택적 연동
 *   Step 2 — Win: 연동 완료 (첫 성공 경험)
 *
 * TDS 가드레일:
 * - §3.2: 1스크린 주 행동 1개
 * - §3.3: 스킵 가능 ("나중에" 버튼)
 * - §7.1: 권한은 기능 사용 순간에 청
 * - §4.1: 프리-프롬프트 3문장
 * - §3.2 (Checkbox): 복수 선택 10개+ → 검색 제공 ✓
 */

const STEPS = ['가치 소개', '연락처 선택', '완료'] as const;

/** 온보딩 스토리지 키 */
const ONBOARDING_COMPLETE_KEY = '__onboarding_contact_sync_done';

export function isOnboardingComplete(): boolean {
  try {
    return localStorage.getItem(ONBOARDING_COMPLETE_KEY) === 'true';
  } catch {
    return false;
  }
}

function markOnboardingComplete() {
  try {
    localStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true');
  } catch {
    // 무시
  }
}

export function ContactSyncPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const analytics = useAnalytics();

  const [step, setStep] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedQuery = useDebounce(searchQuery, 100); // §2.1 로컬 필터 100ms
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [permissionPromptOpen, setPermissionPromptOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const progress = step / (STEPS.length - 1);

  /* ─── 필터링된 연락처 ─── */
  const filteredContacts = useMemo(
    () => filterDeviceContacts(deviceContacts, debouncedQuery),
    [debouncedQuery],
  );

  const groupedContacts = useMemo(
    () => groupByInitial(filteredContacts),
    [filteredContacts],
  );

  const totalCount = deviceContacts.length;
  const filteredCount = filteredContacts.length;
  const selectedCount = selectedIds.size;

  /* ─── 전체 선택/해제 (필터된 범위 내) ─── */
  const allFilteredSelected = filteredContacts.length > 0 &&
    filteredContacts.every((c) => selectedIds.has(c.id));

  const toggleSelectAll = useCallback(() => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allFilteredSelected) {
        // 필터된 것만 해제
        for (const c of filteredContacts) {
          next.delete(c.id);
        }
      } else {
        // 필터된 것 전부 선택
        for (const c of filteredContacts) {
          next.add(c.id);
        }
      }
      return next;
    });
  }, [allFilteredSelected, filteredContacts]);

  /* ─── 개별 선택 토글 ─── */
  const toggleContact = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  /* ─── Step 0 → Step 1: 권한 요청 ─── */
  const handleProceedToSelect = useCallback(() => {
    // §7.1 기능 사용 순간에 권한 요청
    setPermissionPromptOpen(true);
  }, []);

  const handlePermissionAllow = useCallback(() => {
    setPermissionPromptOpen(false);
    setStep(1);
    analytics.trackEvent('success', {
      screen_name: 'ContactSync',
      component_name: 'permissionPrompt',
      action: 'contacts_permission_granted',
    });
  }, [analytics]);

  const handlePermissionDeny = useCallback(() => {
    setPermissionPromptOpen(false);
    // 거절해도 진행 가능 (빈 목록 or 스킵)
    toast.openToast('나중에 설정에서 연동할 수 있어요');
    markOnboardingComplete();
    navigate('/app', { replace: true });
  }, [toast, navigate]);

  /* ─── 연동 실행 ─── */
  const handleImport = useCallback(async () => {
    if (selectedCount === 0) {
      toast.openToast('연동할 연락처를 선택해주세요');
      return;
    }

    setIsImporting(true);
    analytics.trackEvent('submit', {
      screen_name: 'ContactSync',
      component_name: 'importButton',
      action: 'import_contacts',
      result: `${selectedCount}`,
    });

    // Mock import delay
    await new Promise((resolve) => setTimeout(resolve, 1200));
    setIsImporting(false);
    setStep(2);
  }, [selectedCount, analytics, toast]);

  /* ─── 스킵(나중에) ─── */
  const handleSkip = useCallback(() => {
    markOnboardingComplete();
    analytics.trackEvent('click', {
      screen_name: 'ContactSync',
      component_name: 'skipButton',
      action: 'skip_contact_sync',
    });
    navigate('/app', { replace: true });
  }, [analytics, navigate]);

  /* ─── 완료 → 홈 ─── */
  const handleComplete = useCallback(() => {
    markOnboardingComplete();
    analytics.trackEvent('success', {
      screen_name: 'ContactSync',
      component_name: 'completeButton',
      action: 'onboarding_complete',
      result: `imported_${selectedCount}`,
    });
    navigate('/app', { replace: true });
  }, [analytics, navigate, selectedCount]);

  return (
    <div className="h-dvh flex flex-col bg-[var(--toss-bg)]">
      {/* Navigation */}
      {step > 0 && step < 2 && (
        <NavigationBar
          title="연락처 연동"
          showBack
          onBack={() => setStep((s) => Math.max(0, s - 1))}
          rightAction={
            <button
              onClick={handleSkip}
              className="text-toss-grey-500"
              style={{ fontSize: 14, minWidth: 44, minHeight: 44 }}
              aria-label="건너뛰기"
            >
              나중에
            </button>
          }
        />
      )}

      {/* Progress */}
      {step < 2 && (
        <div className="px-6 pt-2 pb-1">
          <ProgressBar
            progress={progress}
            size="light"
            animate
            aria-label={`온보딩 진행률 ${Math.round(progress * 100)}%`}
          />
        </div>
      )}

      {/* ═══════════════════════════════════════════
          Step 0 — Why: 앱의 가치를 전달
          ═══════════════════════════════════════════ */}
      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div
            key="step-why"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.25 }}
            className="flex-1 flex flex-col"
          >
            <div className="flex-1 flex flex-col items-center justify-center px-6">
              {/* Illustration */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, type: 'spring', damping: 15 }}
                className="relative mb-8"
              >
                <div
                  className="flex items-center justify-center rounded-full"
                  style={{
                    width: 120,
                    height: 120,
                    background: 'linear-gradient(135deg, #2D2D2D 0%, #0A0A0A 100%)',
                  }}
                >
                  <BookUser size={56} className="text-white" strokeWidth={1.5} />
                </div>
                {/* Floating badges */}
                <motion.div
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="absolute -right-2 -top-1 bg-[var(--toss-card-bg)] shadow-lg rounded-xl flex items-center gap-1.5"
                  style={{ padding: '6px 10px' }}
                >
                  <Users size={14} className="text-toss-blue" />
                  <span className="text-toss-grey-800" style={{ fontSize: 12, fontWeight: 600 }}>
                    {totalCount}명
                  </span>
                </motion.div>
                <motion.div
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.55 }}
                  className="absolute -left-3 bottom-2 bg-[var(--toss-card-bg)] shadow-lg rounded-xl flex items-center gap-1.5"
                  style={{ padding: '6px 10px' }}
                >
                  <Sparkles size={14} className="text-toss-orange" />
                  <span className="text-toss-grey-800" style={{ fontSize: 12, fontWeight: 600 }}>
                    자동 정리
                  </span>
                </motion.div>
              </motion.div>

              {/* Copy — §3.2 본문 2줄(40자) 이내 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-center"
              >
                <h1
                  className="text-toss-grey-900"
                  style={{ fontSize: 24, fontWeight: 800, lineHeight: 1.35 }}
                >
                  연락처를 연동하면
                  <br />
                  인연 관리가 쉬워져요
                </h1>
                <p
                  className="text-toss-grey-500 mt-3"
                  style={{ fontSize: 15, lineHeight: 1.5 }}
                >
                  휴대폰에 저장된 연락처 중에서
                  <br />
                  원하는 사람만 골라 가져올 수 있어요
                </p>
              </motion.div>

              {/* Feature highlights */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="mt-8 w-full space-y-3"
                style={{ maxWidth: 300 }}
              >
                {[
                  { icon: Check, text: '원하는 연락처만 선택 연동' },
                  { icon: Check, text: '생일, 메모 등 자동으로 정리' },
                  { icon: Check, text: '언제든 삭제하거나 추가 가능' },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-3">
                    <div
                      className="flex items-center justify-center rounded-full bg-toss-blue-50 shrink-0"
                      style={{ width: 28, height: 28 }}
                    >
                      <Icon size={14} className="text-toss-blue" />
                    </div>
                    <span className="text-toss-grey-700" style={{ fontSize: 14 }}>
                      {text}
                    </span>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* CTA — §3.2 주 행동 1개 */}
            <div className="px-6 pb-8" style={{ paddingBottom: 'max(32px, env(safe-area-inset-bottom))' }}>
              <TossButton
                fullWidth
                size="xlarge"
                onClick={handleProceedToSelect}
              >
                연락처 가져오기
              </TossButton>
              <button
                onClick={handleSkip}
                className="w-full text-center text-toss-grey-400 mt-3"
                style={{ fontSize: 14, minHeight: 44 }}
                aria-label="나중에 연동하기"
              >
                나중에 할게요
              </button>
            </div>
          </motion.div>
        )}

        {/* ═══════════════════════════════════════════
            Step 1 — Enable: 연락처 선택
            ═══════════════════════════════════════════ */}
        {step === 1 && (
          <motion.div
            key="step-enable"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.25 }}
            className="flex-1 flex flex-col min-h-0"
          >
            {/* Header */}
            <div className="px-6 pt-2 pb-3">
              <h2 className="text-toss-grey-900" style={{ fontSize: 20, fontWeight: 700 }}>
                가져올 연락처를 선택하세요
              </h2>
              <p className="text-toss-grey-500 mt-1" style={{ fontSize: 13 }}>
                {totalCount}개의 연락처 중 원하는 사람만 선택할 수 있어요
              </p>
            </div>

            {/* Search — §3.2 Checkbox 10개 이상 → 검색 제공 */}
            <div className="px-6 pb-2">
              <SearchField
                value={searchQuery}
                onChange={setSearchQuery}
                onClear={() => setSearchQuery('')}
                placeholder="이름 또는 전화번호 검색"
                size="medium"
              />
            </div>

            {/* 전체 선택 + 카운트 */}
            <div
              className="flex items-center justify-between px-6 py-2 border-b border-toss-grey-100"
              style={{ minHeight: 44 }}
            >
              <button
                onClick={toggleSelectAll}
                className="flex items-center gap-2"
                style={{ minHeight: 44 }}
                aria-label={allFilteredSelected ? '전체 선택 해제' : '전체 선택'}
              >
                <div
                  className="flex items-center justify-center rounded-full transition-colors"
                  style={{
                    width: 22,
                    height: 22,
                    backgroundColor: allFilteredSelected ? 'var(--toss-blue)' : 'transparent',
                    border: allFilteredSelected
                      ? '2px solid var(--toss-blue)'
                      : '2px solid var(--toss-grey-300)',
                  }}
                >
                  {allFilteredSelected && (
                    <Check size={13} className="text-[var(--primary-foreground)]" strokeWidth={3} />
                  )}
                </div>
                <span
                  className="text-toss-grey-700"
                  style={{ fontSize: 14, fontWeight: 500 }}
                >
                  전체 선택
                </span>
              </button>

              <span className="text-toss-grey-500" style={{ fontSize: 13 }}>
                {selectedCount > 0 ? (
                  <span>
                    <span className="text-toss-blue" style={{ fontWeight: 600 }}>{selectedCount}</span>
                    명 선택
                  </span>
                ) : (
                  `${filteredCount}명`
                )}
              </span>
            </div>

            {/* Contact List */}
            <div
              ref={listRef}
              className="flex-1 overflow-y-auto"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              {groupedContacts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <Search size={40} className="text-toss-grey-200 mb-3" />
                  <p className="text-toss-grey-400" style={{ fontSize: 14 }}>
                    검색 결과가 없어요
                  </p>
                </div>
              ) : (
                groupedContacts.map(({ initial, contacts }) => (
                  <div key={initial}>
                    {/* 초성 헤더 */}
                    <div
                      className="sticky top-0 z-10 bg-[var(--toss-bg)] px-6 flex items-center"
                      style={{ height: 32 }}
                    >
                      <span
                        className="text-toss-grey-400"
                        style={{ fontSize: 12, fontWeight: 600 }}
                      >
                        {initial}
                      </span>
                    </div>

                    {/* 연락처 리스트 */}
                    {contacts.map((contact) => {
                      const isSelected = selectedIds.has(contact.id);
                      return (
                        <ContactRow
                          key={contact.id}
                          contact={contact}
                          isSelected={isSelected}
                          onToggle={() => toggleContact(contact.id)}
                        />
                      );
                    })}
                  </div>
                ))
              )}

              {/* 리스트 하단 여백 */}
              <div style={{ height: 100 }} />
            </div>

            {/* Bottom CTA — 선택한 개수 표시 */}
            <div
              className="border-t border-toss-grey-100 bg-[var(--toss-bg)] px-6 py-3"
              style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}
            >
              <TossButton
                fullWidth
                size="xlarge"
                disabled={selectedCount === 0 || isImporting}
                loading={isImporting}
                onClick={handleImport}
              >
                {isImporting
                  ? '연동하는 중...'
                  : selectedCount > 0
                    ? `${selectedCount}명 연동하기`
                    : '연락처를 선택해주세요'}
              </TossButton>
            </div>
          </motion.div>
        )}

        {/* ═══════════════════════════════════════════
            Step 2 — Win: 연동 완료
            ═══════════════════════════════════════════ */}
        {step === 2 && (
          <motion.div
            key="step-win"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="flex-1 flex flex-col items-center justify-center px-6"
          >
            {/* Success animation */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', damping: 12, stiffness: 200 }}
              className="flex items-center justify-center rounded-full mb-6"
              style={{
                width: 96,
                height: 96,
                background: 'linear-gradient(135deg, var(--toss-grey-800) 0%, var(--toss-grey-900) 100%)',
              }}
            >
              <CheckCircle2 size={48} className="text-white" strokeWidth={1.8} />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-center"
            >
              <h1
                className="text-toss-grey-900"
                style={{ fontSize: 24, fontWeight: 800 }}
              >
                연동을 완료했어요
              </h1>
              <p className="text-toss-grey-500 mt-2" style={{ fontSize: 15 }}>
                {selectedCount}명의 연락처가 추가됐어요
              </p>
            </motion.div>

            {/* Summary card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="w-full mt-8 bg-toss-grey-50 rounded-2xl p-5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="flex items-center justify-center rounded-full bg-toss-blue-50"
                    style={{ width: 40, height: 40 }}
                  >
                    <Users size={20} className="text-toss-blue" />
                  </div>
                  <div>
                    <p
                      className="text-toss-grey-900"
                      style={{ fontSize: 16, fontWeight: 700 }}
                    >
                      {selectedCount}명
                    </p>
                    <p className="text-toss-grey-500" style={{ fontSize: 12 }}>
                      연동된 연락처
                    </p>
                  </div>
                </div>
                <Smartphone size={20} className="text-toss-grey-300" aria-hidden="true" />
              </div>

              <div className="mt-4 pt-3 border-t border-toss-grey-200 space-y-2">
                {[
                  '연락처 정보가 안전하게 저장됐어요',
                  '언제든 수정하거나 삭제할 수 있어요',
                ].map((text) => (
                  <div key={text} className="flex items-center gap-2">
                    <Check size={14} className="text-toss-green shrink-0" />
                    <span className="text-toss-grey-600" style={{ fontSize: 13 }}>
                      {text}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* CTA */}
            <div
              className="w-full mt-auto pt-6"
              style={{ paddingBottom: 'max(32px, env(safe-area-inset-bottom))' }}
            >
              <TossButton fullWidth size="xlarge" onClick={handleComplete}>
                시작하기
                <ArrowRight size={18} className="ml-1.5 inline" />
              </TossButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* §4.1 연락처 권한 프리-프롬프트 */}
      <PermissionPrePrompt
        isOpen={permissionPromptOpen}
        message={{
          purpose: '인연을 한곳에서 관리할 수 있어요',
          dataType: '휴대폰에 저장된 연락처를 사용합니다',
          timing: '선택한 연락처만 앱에 저장돼요',
        }}
        onAllow={handlePermissionAllow}
        onDeny={handlePermissionDeny}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════
   내부 컴포넌트 — 개별 연락처 행
   ═══════════════════════════════════════════════ */

function ContactRow({
  contact,
  isSelected,
  onToggle,
}: {
  contact: DeviceContact;
  isSelected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className={`w-full flex items-center gap-3 px-6 transition-colors ${
        isSelected ? 'bg-toss-blue-50/40' : 'active:bg-toss-grey-50'
      }`}
      style={{ height: 64, minHeight: 44 }}
      role="checkbox"
      aria-checked={isSelected}
      aria-label={`${contact.name} ${contact.phone} ${isSelected ? '선택됨' : ''}`}
    >
      {/* Checkbox indicator */}
      <div
        className="flex items-center justify-center rounded-full shrink-0 transition-colors"
        style={{
          width: 24,
          height: 24,
          backgroundColor: isSelected ? 'var(--toss-blue)' : 'transparent',
          border: isSelected
            ? '2px solid var(--toss-blue)'
            : '2px solid var(--toss-grey-300)',
        }}
      >
        {isSelected && <Check size={14} className="text-[var(--primary-foreground)]" strokeWidth={3} />}
      </div>

      {/* Avatar */}
      <ContactAvatar name={contact.name} color={contact.avatarColor} size={40} />

      {/* Info */}
      <div className="flex-1 min-w-0 text-left">
        <p
          className="text-toss-grey-900 truncate"
          style={{ fontSize: 15, fontWeight: isSelected ? 600 : 400 }}
        >
          {contact.name}
        </p>
        <p className="text-toss-grey-400 truncate" style={{ fontSize: 12 }}>
          {contact.phone}
        </p>
      </div>
    </button>
  );
}