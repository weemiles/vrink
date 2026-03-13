import { useState, useCallback, useEffect } from 'react';
import { restoreAllHiddenDefaults, getHiddenDefaults, resetContactsStore } from '../data/contactsStore';
import {
  Loader2, ChevronRight, Shield, Database, Bell, Sun, Moon, Monitor,
  Tags, Globe, FileText, Eye, EyeOff, MessageSquare, PhoneOff, Clock, Cake,
  Download, Tag as TagIcon, GitMerge, Upload,
} from 'lucide-react';
import { Switch } from '../components/Switch';
import { Slider } from '../components/Slider';
import { NavigationBar } from '../components/NavigationBar';
import { SegmentedControl } from '../components/SegmentedControl';
import { Popup } from '../components/Popup';
import { useToast } from '../components/useToast';
import { useAnalytics } from '../components/useAnalytics';
import { shouldShowContactCTA } from '../components/useCopySystem';
import { createSupportCode, formatSupportCode } from '../components/useSupportCode';
import { invalidateAllSessions } from '../components/useThreatModel';
import { RETENTION_DEFAULTS } from '../components/useComplianceOps';
import { usePermissionRequest } from '../components/usePermissionRequest';
import { PermissionPrePrompt, PermissionDeniedBanner } from '../components/PermissionPrompt';
import { PUSH_LIMITS, PUSH_SEND_WINDOW } from '../components/useDeepLinkPush';
import { useTheme, type ThemeMode } from '../components/useTheme';
import { PERSONALIZATION_GUARD } from '../components/useConsumerAppGuard';
import { useLanguage, type Lang } from '../components/useLanguage';
import { useNavigate } from 'react-router';
import { deleteAccount, updatePassword, isAuthenticated, authenticatedFetch } from '../data/authStore';
import { BottomSheet } from '../components/BottomSheet';
import { TossButton } from '../components/TossButton';
import {
  useNotificationSettings,
  updateNotificationSettings,
  fetchNotificationSettings,
  resetNotificationSettings,
} from '../data/notificationSettingsStore';
import { clearProfile } from '../data/profileStore';
import { resetNotificationState } from '../data/notificationStore';
import { resetAutoMessageStore } from '../data/autoMessageStore';
import { resetGroupStore } from '../data/groupStore';
import { useDocumentTitle } from '../components/useDocumentTitle';
import { resetInteractionLogStore } from '../data/interactionLogStore';
import { resetStatsStore } from '../data/statsStore';
import { resetTagStore } from '../data/tagStore';
import { projectId } from '/utils/supabase/info';

/* ─── 상수 ─── */
const RETRY_DEBOUNCE_MS = 1000;
const MAX_CONSECUTIVE_FAILURES = 3;

const REMINDER_OPTIONS = [
  { value: '7', key: 'settings.reminder.7' },
  { value: '14', key: 'settings.reminder.14' },
  { value: '30', key: 'settings.reminder.30' },
] as const;

const THEME_OPTIONS: Array<{ value: ThemeMode; key: string }> = [
  { value: 'light', key: 'settings.theme.light' },
  { value: 'dark', key: 'settings.theme.dark' },
  { value: 'system', key: 'settings.theme.system' },
];

const LANGUAGE_OPTIONS: Array<{ value: Lang; label: string }> = [
  { value: 'ko', label: '한국어' },
  { value: 'en', label: 'English' },
];

const QUIET_HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => {
  const hh = String(i).padStart(2, '0');
  return { value: `${hh}:00`, label: `${hh}:00` };
});

/* ═══════════════════════════════════════════════
   SettingsPage
   ═══════════════════════════════════════════════ */
export function SettingsPage() {
  const toast = useToast();
  const analytics = useAnalytics();
  useDocumentTitle('설정');
  const { mode, setMode } = useTheme();
  const { lang, setLang, t } = useLanguage();
  const navigate = useNavigate();

  /* ─── 알림 설정 (서버 영속 스토어) ─── */
  const notifSettings = useNotificationSettings();

  useEffect(() => {
    if (isAuthenticated()) {
      fetchNotificationSettings();
    }
  }, []);

  const handleNotifToggle = useCallback(
    (key: keyof typeof notifSettings, label: string) => {
      const current = notifSettings[key] as boolean;
      const next = !current;
      updateNotificationSettings({ [key]: next });
      analytics.trackEvent('click', {
        screen_name: 'SettingsPage',
        component_name: 'toggle',
        action: `${key}_${next ? 'on' : 'off'}`,
      });
      const toastKey = next ? 'settings.toggle.on' : 'settings.toggle.off';
      toast.openToast(t(toastKey, { label }));
    },
    [notifSettings, analytics, toast, t],
  );

  /* ─── 보안 설정 ─── */
  const [biometricLock, setBiometricLock] = useState(false);
  const [autoLockMin, setAutoLockMin] = useState(5);

  /* ─── 보안 토글 핸들러 ─── */
  const handleSecurityToggle = useCallback(
    (label: string, current: boolean, setter: React.Dispatch<React.SetStateAction<boolean>>) => {
      const next = !current;
      setter(next);
      analytics.trackEvent('click', {
        screen_name: 'SettingsPage',
        component_name: 'toggle',
        action: `${label}_${next ? 'on' : 'off'}`,
      });
      const toastKey = next ? 'settings.toggle.on' : 'settings.toggle.off';
      toast.openToast(t(toastKey, { label }));
    },
    [analytics, toast, t],
  );

  /* ─── 계정 ─── */
  const [passwordChangeLoading, setPasswordChangeLoading] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [passwordSheetOpen, setPasswordSheetOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [retryDisabled, setRetryDisabled] = useState(false);
  const [consecutiveErrors, setConsecutiveErrors] = useState(0);
  const [supportCode, setSupportCode] = useState<string | null>(null);

  /* ─── 권한 UX ─── */
  const notifPermission = usePermissionRequest({
    permissionType: 'notification',
    prePromptMessage: {
      purpose: '생일 알림과 리마인더를 보내드려요',
      dataType: '알림 권한을 사용합니다',
      timing: '설정한 시간에만 알려드려요',
    },
  });

  /* ─── 비밀번호 변경 ─── */
  const openPasswordSheet = useCallback(() => {
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
    setShowNewPw(false);
    setShowConfirmPw(false);
    setPasswordSheetOpen(true);
  }, []);

  const handlePasswordChange = useCallback(async () => {
    if (retryDisabled) return;
    if (newPassword.length < 8) {
      setPasswordError(lang === 'ko' ? '비밀번호는 8자 이상이어야 합니다.' : 'Password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError(lang === 'ko' ? '비밀번호가 일치하지 않습니다.' : 'Passwords do not match.');
      return;
    }
    setPasswordChangeLoading(true);
    setRetryDisabled(true);
    setTimeout(() => setRetryDisabled(false), RETRY_DEBOUNCE_MS);
    try {
      const result = await updatePassword(newPassword);
      if (!result.success) throw new Error(result.error || '비밀번호 변경 실패');
      invalidateAllSessions();
      setConsecutiveErrors(0);
      setSupportCode(null);
      setPasswordSheetOpen(false);
      setNewPassword('');
      setConfirmPassword('');
      toast.openToast(t('settings.password.success'));
    } catch (err: any) {
      const errCount = consecutiveErrors + 1;
      setConsecutiveErrors(errCount);
      if (errCount >= MAX_CONSECUTIVE_FAILURES) {
        const sc = createSupportCode('SettingsPage', 'failure', 'password_change_failed');
        setSupportCode(formatSupportCode(sc.code));
      }
      setPasswordError(err?.message || t('settings.password.failed'));
      toast.openToast(t('settings.password.failed'));
    } finally {
      setPasswordChangeLoading(false);
    }
  }, [retryDisabled, newPassword, confirmPassword, lang, consecutiveErrors, toast, t]);

  /* ─── 회원 탈퇴 ─── */
  const handleDeleteAccount = useCallback(async () => {
    setDeleteConfirmOpen(false);
    const result = await deleteAccount();
    if (result.success) {
      clearProfile();
      resetNotificationState();
      resetNotificationSettings();
      resetContactsStore();
      resetAutoMessageStore();
      resetGroupStore();
      resetInteractionLogStore();
      resetStatsStore();
      resetTagStore();
      toast.openToast(t('settings.delete_account.done'));
      navigate('/login', { replace: true });
    } else {
      toast.openToast(result.error || '계정 삭제에 실패했습니다.');
    }
  }, [toast, t, navigate]);

  /* ─── CSV 내보내기 ─── */
  const [exporting, setExporting] = useState(false);

  const handleExport = useCallback(async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const res = await authenticatedFetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-0984a125/contacts/export`,
      );
      if (!res.ok) throw new Error('Export failed');
      const data = await res.json();
      
      // BOM + CSV 내용으로 Blob 생성 → 다운로드
      const bom = '\uFEFF';
      const blob = new Blob([bom + data.csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `keepin_contacts_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.openToast(lang === 'ko' ? `${data.count}명의 연락처를 내보냈어요` : `Exported ${data.count} contacts`);
    } catch (err: any) {
      console.error('[export] Error:', err);
      toast.openToast(lang === 'ko' ? '내보내기에 실패했어요' : 'Export failed');
    } finally {
      setExporting(false);
    }
  }, [exporting, lang, toast]);

  return (
    <div className="pb-20 bg-[var(--toss-bg)]">
      <NavigationBar title={t('settings.title')} showBack />

      {/* ═══════ 그룹 1: 알림 ═══════ */}
      <SettingsGroup title={t('settings.group.notification')} icon={<Bell size={16} />}>
        {/* 푸시 알림 */}
        <SettingsRow
          label={t('settings.push')}
          description={t('settings.push.desc', {
            weeklyMax: PUSH_LIMITS.marketing.weeklyMax,
            startHour: PUSH_SEND_WINDOW.startHour,
            endHour: PUSH_SEND_WINDOW.endHour,
          })}
          right={
            <Switch
              checked={notifSettings.pushEnabled}
              onChange={() => handleNotifToggle('pushEnabled', t('settings.push'))}
              aria-label={t('settings.push')}
            />
          }
        />

        {/* 생일 알림 */}
        <SettingsRow
          label={t('settings.birthday_alert')}
          icon={<Cake size={16} />}
          right={
            <Switch
              checked={notifSettings.birthdayAlert}
              onChange={() => handleNotifToggle('birthdayAlert', t('settings.birthday_alert'))}
              aria-label={t('settings.birthday_alert')}
            />
          }
        />

        {/* 자동 메시지 알림 */}
        <SettingsRow
          label={lang === 'ko' ? '자동 메시지 알림' : 'Auto Message Alerts'}
          description={lang === 'ko' ? '예약 메시지 발송 시 알려드려요' : 'Get notified when scheduled messages are due'}
          icon={<MessageSquare size={16} />}
          right={
            <Switch
              checked={notifSettings.autoMessageAlert}
              onChange={() => handleNotifToggle('autoMessageAlert', lang === 'ko' ? '자동 메시지 알림' : 'Auto Message Alerts')}
              aria-label={lang === 'ko' ? '자동 메시지 알림' : 'Auto Message Alerts'}
            />
          }
        />

        {/* 연락 리마인더 알림 */}
        <SettingsRow
          label={lang === 'ko' ? '연락 리마인더' : 'Contact Reminders'}
          description={lang === 'ko' ? '오래 연락하지 않은 인연을 알려드려요' : 'Remind you about contacts you haven\'t reached out to'}
          icon={<PhoneOff size={16} />}
          right={
            <Switch
              checked={notifSettings.contactReminderAlert}
              onChange={() => handleNotifToggle('contactReminderAlert', lang === 'ko' ? '연락 리마인더' : 'Contact Reminders')}
              aria-label={lang === 'ko' ? '연락 리마인더' : 'Contact Reminders'}
            />
          }
        />

        {/* 리마인더 주기 */}
        <SettingsRow label={t('settings.reminder')}>
          <div className="mt-2">
            <SegmentedControl
              value={String(notifSettings.reminderDays)}
              onChange={(val) => {
                updateNotificationSettings({ reminderDays: parseInt(val, 10) });
                toast.openToast(t('settings.reminder.changed', { days: val }));
              }}
            >
              {REMINDER_OPTIONS.map((opt) => (
                <SegmentedControl.Item key={opt.value} value={opt.value}>
                  {t(opt.key)}
                </SegmentedControl.Item>
              ))}
            </SegmentedControl>
          </div>
        </SettingsRow>

        {/* 방해금지 시간 */}
        <SettingsRow
          label={t('settings.dnd')}
          description={notifSettings.quietHoursEnabled
            ? `${notifSettings.quietHoursStart} ~ ${notifSettings.quietHoursEnd}`
            : t('settings.dnd.desc')
          }
          icon={<Clock size={16} />}
          right={
            <Switch
              checked={notifSettings.quietHoursEnabled}
              onChange={() => handleNotifToggle('quietHoursEnabled', t('settings.dnd'))}
              aria-label={t('settings.dnd')}
            />
          }
        >
          {notifSettings.quietHoursEnabled && (
            <div className="mt-3 flex items-center gap-3">
              <div className="flex-1">
                <label className="text-toss-grey-500 block mb-1" style={{ fontSize: 11, fontWeight: 600 }}>
                  {lang === 'ko' ? '시작' : 'From'}
                </label>
                <select
                  value={notifSettings.quietHoursStart}
                  onChange={(e) => updateNotificationSettings({ quietHoursStart: e.target.value })}
                  className="w-full bg-toss-grey-100 text-toss-grey-900 rounded-lg outline-none appearance-none cursor-pointer"
                  style={{ fontSize: 14, padding: '8px 12px', height: 40 }}
                >
                  {QUIET_HOUR_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <span className="text-toss-grey-400 mt-5" style={{ fontSize: 14 }}>~</span>
              <div className="flex-1">
                <label className="text-toss-grey-500 block mb-1" style={{ fontSize: 11, fontWeight: 600 }}>
                  {lang === 'ko' ? '종료' : 'To'}
                </label>
                <select
                  value={notifSettings.quietHoursEnd}
                  onChange={(e) => updateNotificationSettings({ quietHoursEnd: e.target.value })}
                  className="w-full bg-toss-grey-100 text-toss-grey-900 rounded-lg outline-none appearance-none cursor-pointer"
                  style={{ fontSize: 14, padding: '8px 12px', height: 40 }}
                >
                  {QUIET_HOUR_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </SettingsRow>

        {/* 알림 권한 상태 */}
        {(notifPermission.state === 'denied' || notifPermission.state === 'permanentDenied') && (
          <div className="px-6 pb-3">
            <PermissionDeniedBanner
              state={notifPermission.state}
              alternative={notifPermission.alternative}
              canShowSettingsCTA={notifPermission.canShowSettingsCTA}
              onOpenSettings={notifPermission.openSettings}
              onUseAlternative={notifPermission.useAlternative}
            />
          </div>
        )}
      </SettingsGroup>

      {/* ═══════ 그룹 2: 보안 ═══════ */}
      <SettingsGroup title={t('settings.group.security')} icon={<Shield size={16} />}>
        <SettingsRow
          label={t('settings.biometric')}
          description={t('settings.biometric.desc')}
          right={
            <Switch
              checked={biometricLock}
              onChange={() => handleSecurityToggle(t('settings.biometric'), biometricLock, setBiometricLock)}
              aria-label={t('settings.biometric')}
            />
          }
        />

        <SettingsRow label={t('settings.auto_lock')}>
          <div className="mt-2">
            <Slider
              value={autoLockMin}
              onValueChange={setAutoLockMin}
              minValue={1}
              maxValue={30}
              showTooltip
              tooltipFormatter={(v) => `${v}${lang === 'ko' ? '분' : 'min'}`}
              aria-label={t('settings.auto_lock')}
              label={{
                min: t('settings.auto_lock.min'),
                mid: t('settings.auto_lock.mid'),
                max: t('settings.auto_lock.max'),
              }}
            />
          </div>
        </SettingsRow>

        <SettingsRow
          label={t('settings.password_change')}
          description={t('settings.password_change.desc')}
          right={
            <button
              onClick={openPasswordSheet}
              disabled={retryDisabled || passwordChangeLoading}
              className="flex items-center gap-1.5 text-toss-blue disabled:opacity-40"
              style={{ fontSize: 13, fontWeight: 600, minWidth: 44, minHeight: 44 }}
              aria-label={t('settings.password_change')}
            >
              {passwordChangeLoading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                t('common.change')
              )}
            </button>
          }
        />

        {supportCode && (
          <div className="mx-6 mb-3 bg-toss-orange-50 border border-toss-orange-100 p-3" style={{ borderRadius: 12 }}>
            <p className="text-toss-grey-700" style={{ fontSize: 12 }}>
              {t('settings.support_code')}: <span style={{ fontWeight: 700 }}>{supportCode}</span>
            </p>
            <p className="text-toss-grey-500 mt-0.5" style={{ fontSize: 11 }}>
              {t('settings.support_code.desc')}
            </p>
          </div>
        )}

        {shouldShowContactCTA(consecutiveErrors) && (
          <div className="px-6 pb-3">
            <button
              onClick={() => toast.openToast(t('settings.support_submitted'))}
              className="w-full text-center text-toss-blue bg-toss-blue-50 py-3"
              style={{ borderRadius: 12, fontSize: 13, fontWeight: 600, minHeight: 44 }}
              aria-label={t('settings.contact_support')}
            >
              {t('settings.contact_support')}
            </button>
          </div>
        )}
      </SettingsGroup>

      {/* ═══════ 그룹 3: 계정 ═══════ */}
      <SettingsGroup title={t('settings.group.account')} icon={<Database size={16} />}>
        {/* 태그 관리 */}
        <SettingsRow
          label={lang === 'ko' ? '태그 관리' : 'Tag Management'}
          description={lang === 'ko' ? '연락처를 자유롭게 분류해보세요' : 'Organize contacts with custom tags'}
          icon={<TagIcon size={16} />}
          right={
            <button
              onClick={() => navigate('/app/tags')}
              className="flex items-center text-toss-grey-500"
              style={{ fontSize: 13, minWidth: 44, minHeight: 44 }}
              aria-label={lang === 'ko' ? '태그 관리' : 'Tag Management'}
            >
              <ChevronRight size={16} aria-hidden="true" />
            </button>
          }
        />

        {/* 중복 연락처 관리 */}
        <SettingsRow
          label={lang === 'ko' ? '중복 연락처 관리' : 'Duplicate Contacts'}
          description={lang === 'ko' ? '중복 연락처를 찾아 병합해보세요' : 'Find and merge duplicate contacts'}
          icon={<GitMerge size={16} />}
          right={
            <button
              onClick={() => navigate('/app/duplicates')}
              className="flex items-center text-toss-grey-500"
              style={{ fontSize: 13, minWidth: 44, minHeight: 44 }}
              aria-label={lang === 'ko' ? '중복 연락처 관리' : 'Duplicate Contacts'}
            >
              <ChevronRight size={16} aria-hidden="true" />
            </button>
          }
        />

        {/* CSV 내보내기 */}
        <SettingsRow
          label={lang === 'ko' ? '연락처 내보내기' : 'Export Contacts'}
          description={lang === 'ko' ? 'CSV 파일로 다운로드' : 'Download as CSV file'}
          icon={<Download size={16} />}
          right={
            <button
              onClick={handleExport}
              disabled={exporting}
              className="flex items-center gap-1.5 text-toss-blue disabled:opacity-40"
              style={{ fontSize: 13, fontWeight: 600, minWidth: 44, minHeight: 44 }}
              aria-label={lang === 'ko' ? '내보내기' : 'Export'}
            >
              {exporting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                lang === 'ko' ? '내보내기' : 'Export'
              )}
            </button>
          }
        />

        {/* CSV 가져오기 */}
        <SettingsRow
          label={lang === 'ko' ? '연락처 가져오기' : 'Import Contacts'}
          description={lang === 'ko' ? 'CSV 파일에서 연락처 추가' : 'Add contacts from CSV file'}
          icon={<Upload size={16} />}
          right={
            <button
              onClick={() => navigate('/app/import')}
              className="flex items-center text-toss-grey-500"
              style={{ fontSize: 13, minWidth: 44, minHeight: 44 }}
              aria-label={lang === 'ko' ? '가져오기' : 'Import'}
            >
              <ChevronRight size={16} aria-hidden="true" />
            </button>
          }
        />

        <SettingsRow
          label={t('settings.data_retention')}
          description={t('settings.data_retention.desc')}
        >
          <div className="mt-2 space-y-1.5">
            {Object.entries(RETENTION_DEFAULTS).map(([key, val]) => (
              <div
                key={key}
                className="flex items-center justify-between text-toss-grey-500"
                style={{ fontSize: 12 }}
              >
                <span>{val.label}</span>
                <span style={{ fontWeight: 500 }}>{val.days}{lang === 'en' ? ' days' : '일'}</span>
              </div>
            ))}
          </div>
        </SettingsRow>

        <SettingsRow
          label={t('settings.delete_account')}
          right={
            <button
              onClick={() => setDeleteConfirmOpen(true)}
              className="flex items-center text-toss-red"
              style={{ fontSize: 13, fontWeight: 600, minWidth: 44, minHeight: 44 }}
              aria-label={t('settings.delete_account')}
            >
              {t('common.withdraw')}
              <ChevronRight size={14} className="ml-0.5" aria-hidden="true" />
            </button>
          }
        />
      </SettingsGroup>

      {/* ═══════ 그룹 4: 기타 ═══════ */}
      <SettingsGroup title={t('settings.group.general')} icon={<Tags size={16} />}>
        <SettingsRow label={t('settings.theme')}>
          <div className="mt-2">
            <SegmentedControl
              value={mode}
              onChange={(val) => {
                setMode(val as ThemeMode);
                const themeOpt = THEME_OPTIONS.find(o => o.value === val);
                const label = themeOpt ? t(themeOpt.key) : val;
                toast.openToast(t('settings.theme.changed', { label }));
              }}
            >
              {THEME_OPTIONS.map((opt) => (
                <SegmentedControl.Item key={opt.value} value={opt.value}>
                  {t(opt.key)}
                </SegmentedControl.Item>
              ))}
            </SegmentedControl>
          </div>
        </SettingsRow>

        <SettingsRow label={t('settings.language')} icon={<Globe size={16} />}>
          <div className="mt-2">
            <SegmentedControl
              value={lang}
              onChange={(val) => {
                const nextLang = val as Lang;
                setLang(nextLang);
                analytics.trackEvent('click', {
                  screen_name: 'SettingsPage',
                  component_name: 'language',
                  action: `language_${nextLang}`,
                });
                setTimeout(() => {
                  toast.openToast(
                    nextLang === 'ko'
                      ? '언어를 한국어로 변경했어요'
                      : 'Language changed to English',
                  );
                }, 50);
              }}
            >
              {LANGUAGE_OPTIONS.map((opt) => (
                <SegmentedControl.Item key={opt.value} value={opt.value}>
                  {opt.label}
                </SegmentedControl.Item>
              ))}
            </SegmentedControl>
          </div>
        </SettingsRow>

        <HiddenRelationshipsRestore toast={toast} analytics={analytics} t={t} />

        <SettingsRow
          label={lang === 'ko' ? '서비스 이용약관' : 'Terms of Service'}
          icon={<FileText size={16} />}
          right={
            <button
              onClick={() => navigate('/app/terms')}
              className="flex items-center text-toss-grey-500"
              style={{ fontSize: 13, minWidth: 44, minHeight: 44 }}
              aria-label={lang === 'ko' ? '서비스 이용약관 보기' : 'View Terms'}
            >
              <ChevronRight size={16} aria-hidden="true" />
            </button>
          }
        />

        <SettingsRow
          label={lang === 'ko' ? '개인정보처리방침' : 'Privacy Policy'}
          icon={<Shield size={16} />}
          right={
            <button
              onClick={() => navigate('/app/privacy-policy')}
              className="flex items-center text-toss-grey-500"
              style={{ fontSize: 13, minWidth: 44, minHeight: 44 }}
              aria-label={lang === 'ko' ? '개인정보처리방침 보기' : 'View Privacy Policy'}
            >
              <ChevronRight size={16} aria-hidden="true" />
            </button>
          }
        />

        <SettingsRow
          label={t('settings.app_version')}
          right={
            <span className="text-toss-grey-400" style={{ fontSize: 13 }}>1.0.0</span>
          }
        />
      </SettingsGroup>

      {/* ─── 회원 탈퇴 확인 ─── */}
      <Popup
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        title={t('settings.delete_account.title')}
        description={t('settings.delete_account.desc')}
        confirmText={t('settings.delete_account.confirm')}
        cancelText={t('common.cancel')}
        destructive
        closeOnDimmerClick={false}
        onConfirm={handleDeleteAccount}
      />

      {/* 알림 권한 프리-프롬프트 */}
      <PermissionPrePrompt
        isOpen={notifPermission.shouldShowPrePrompt}
        message={notifPermission.prePromptMessage}
        onAllow={notifPermission.requestAfterPrePrompt}
        onDeny={notifPermission.dismissPrePrompt}
      />

      {/* 비밀번호 변경 시트 */}
      <BottomSheet
        isOpen={passwordSheetOpen}
        onClose={() => setPasswordSheetOpen(false)}
        title={lang === 'ko' ? '비밀번호 변경' : 'Change Password'}
        footer={
          <div className="flex gap-2">
            <TossButton variant="fill" color="light" size="medium" onClick={() => setPasswordSheetOpen(false)} style={{ flex: 1 }}>
              {t('common.cancel')}
            </TossButton>
            <TossButton
              variant="fill" color="primary" size="medium"
              onClick={handlePasswordChange}
              disabled={passwordChangeLoading || !newPassword || !confirmPassword}
              loading={passwordChangeLoading}
              style={{ flex: 1 }}
            >
              {t('common.change')}
            </TossButton>
          </div>
        }
      >
        <div className="space-y-4 pb-2">
          <div>
            <label className="block text-toss-grey-600 mb-1.5" style={{ fontSize: 13, fontWeight: 600 }}>
              {lang === 'ko' ? '새 비밀번호' : 'New Password'}
            </label>
            <div className="relative">
              <input
                type={showNewPw ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => { setNewPassword(e.target.value); setPasswordError(''); }}
                className="w-full bg-toss-grey-100 text-toss-grey-900 placeholder-toss-grey-400 rounded-xl outline-none pr-10"
                style={{ fontSize: 15, padding: '12px 16px', height: 48 }}
                placeholder={lang === 'ko' ? '8자 이상 입력' : '8+ characters'}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="absolute top-1/2 right-3 -translate-y-1/2 flex items-center justify-center text-toss-grey-400"
                onClick={() => setShowNewPw(!showNewPw)}
                style={{ width: 32, height: 32 }}
                aria-label={showNewPw ? '숨기기' : '보기'}
              >
                {showNewPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-toss-grey-600 mb-1.5" style={{ fontSize: 13, fontWeight: 600 }}>
              {lang === 'ko' ? '비밀번호 확인' : 'Confirm Password'}
            </label>
            <div className="relative">
              <input
                type={showConfirmPw ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setPasswordError(''); }}
                className="w-full bg-toss-grey-100 text-toss-grey-900 placeholder-toss-grey-400 rounded-xl outline-none pr-10"
                style={{ fontSize: 15, padding: '12px 16px', height: 48 }}
                placeholder={lang === 'ko' ? '비밀번호를 다시 입력' : 'Re-enter password'}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="absolute top-1/2 right-3 -translate-y-1/2 flex items-center justify-center text-toss-grey-400"
                onClick={() => setShowConfirmPw(!showConfirmPw)}
                style={{ width: 32, height: 32 }}
                aria-label={showConfirmPw ? '숨기기' : '보기'}
              >
                {showConfirmPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {passwordError && (
            <p className="text-toss-red" style={{ fontSize: 13 }}>{passwordError}</p>
          )}

          <p className="text-toss-grey-400" style={{ fontSize: 12 }}>
            {lang === 'ko'
              ? '비밀번호는 8자 이상, 영문과 숫자를 포함해야 합니다.'
              : 'Password must be at least 8 characters with letters and numbers.'}
          </p>
        </div>
      </BottomSheet>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   내부 컴포넌트
   ═══════════════════════════════════════════════ */

function SettingsGroup({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-2" aria-label={title}>
      <div className="flex items-center gap-2 px-6 pt-4 pb-2">
        {icon && <span className="text-toss-grey-400" aria-hidden="true">{icon}</span>}
        <h3 className="text-toss-grey-500" style={{ fontSize: 12, fontWeight: 600 }}>
          {title}
        </h3>
      </div>
      <div className="bg-[var(--toss-bg)]">
        {children}
      </div>
    </section>
  );
}

function SettingsRow({
  label,
  description,
  right,
  icon,
  children,
}: {
  label: string;
  description?: string;
  right?: React.ReactNode;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div
      className="px-6 py-3 border-b border-toss-grey-100 last:border-b-0"
      style={{ minHeight: 48 }}
    >
      <div className="flex items-center justify-between" style={{ minHeight: 32 }}>
        <div className="flex-1 min-w-0 mr-3">
          <div className="flex items-center gap-2">
            {icon && <span className="text-toss-grey-500 shrink-0" aria-hidden="true">{icon}</span>}
            <span className="text-toss-grey-900" style={{ fontSize: 15 }}>
              {label}
            </span>
          </div>
          {description && (
            <p className="text-toss-grey-500 mt-0.5" style={{ fontSize: 12 }}>
              {description}
            </p>
          )}
        </div>
        {right && <div className="shrink-0">{right}</div>}
      </div>
      {children}
    </div>
  );
}

function HiddenRelationshipsRestore({
  toast,
  analytics,
  t,
}: {
  toast: any;
  analytics: any;
  t: (key: string, params?: Record<string, string | number>) => string;
}) {
  const [hiddenItems, setHiddenItems] = useState(() => getHiddenDefaults());
  const [isRestoring, setIsRestoring] = useState(false);

  const handleRestore = useCallback(() => {
    if (isRestoring || hiddenItems.length === 0) return;
    setIsRestoring(true);
    setTimeout(() => {
      restoreAllHiddenDefaults();
      setHiddenItems([]);
      setIsRestoring(false);
      toast.openToast(t('settings.hidden_tags.restored'));
      analytics.trackEvent('success', {
        screen_name: 'SettingsPage',
        component_name: 'restoreRelationships',
        action: 'relationships_restored',
      });
    }, 400);
  }, [isRestoring, hiddenItems, toast, analytics, t]);

  if (hiddenItems.length === 0) {
    return (
      <SettingsRow
        label={t('settings.hidden_tags')}
        description={t('settings.hidden_tags.empty')}
      />
    );
  }

  return (
    <SettingsRow
      label={t('settings.hidden_tags')}
      description={t('settings.hidden_tags.count', {
        items: hiddenItems.join(', '),
        count: hiddenItems.length,
      })}
      right={
        <button
          onClick={handleRestore}
          disabled={isRestoring}
          className="flex items-center gap-1.5 text-toss-blue disabled:opacity-40"
          style={{ fontSize: 13, fontWeight: 600, minWidth: 44, minHeight: 44 }}
          aria-label={t('common.restore')}
        >
          {isRestoring ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            t('common.restore')
          )}
        </button>
      }
    />
  );
}