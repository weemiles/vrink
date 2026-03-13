import { useState, useEffect } from 'react';
import { resetAnalyticsSession } from '../components/useAnalytics';
import { resetMessageFatigueSession } from '../components/useMessageFatigue';
import { resetA11yLiveSession } from '../components/useA11yLive';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import {
  Settings, ChevronRight, Users, Gift, Star,
  HelpCircle, MessageSquare, Shield, LogOut, Moon,
  User, BarChart3,
} from 'lucide-react';
import { CLOSENESS_ORDER } from '../data/contacts';
import { useContacts, resetContactsStore } from '../data/contactsStore';
import { resetGroupStore } from '../data/groupStore';
import { Popup } from '../components/Popup';
import { useToast } from '../components/useToast';
import { IconButton } from '../components/IconButton';
import { ProgressBar } from '../components/ProgressBar';
import { useTheme } from '../components/useTheme';
import { resetFeedSession } from '../components/useConsumerAppGuard';
import { useLanguage } from '../components/useLanguage';
import { signOut } from '../data/authStore';
import { useAuth } from '../components/AuthContext';
import { useProfile, refreshFromServer, clearProfile } from '../data/profileStore';
import { resetNotificationState } from '../data/notificationStore';
import { resetNotificationSettings } from '../data/notificationSettingsStore';
import { resetAutoMessageStore } from '../data/autoMessageStore';
import { useDocumentTitle } from '../components/useDocumentTitle';
import { resetInteractionLogStore } from '../data/interactionLogStore';
import { resetStatsStore } from '../data/statsStore';
import { resetTagStore } from '../data/tagStore';

/* 3D 아이콘 이미지 */
import personIcon3D from "../../assets/figma/24ad3e09c31fc3adc23cdc38ca6306a3c4aacc7b.png";

export function MyPage() {
  const navigate = useNavigate();
  const toast = useToast();
  useDocumentTitle('마이페이지');
  const [logoutOpen, setLogoutOpen] = useState(false);
  const { toggleTheme, resolvedTheme } = useTheme();
  const { t, lang } = useLanguage();
  const { user } = useAuth();

  const contacts = useContacts();
  const totalContacts = contacts.length;
  const closeCount = contacts.filter(c => c.closeness === '매우 친함' || c.closeness === '가족').length;
  const giftDone = contacts.filter(c => c.birthdayGiftDone).length;

  const profile = useProfile();

  // 인증된 사용자 정보가 있으면 프로필에 반영
  const displayProfile = {
    ...profile,
    name: user?.user_metadata?.name || profile.name,
    email: user?.email || profile.email,
  };

  useEffect(() => {
    refreshFromServer();
  }, []);

  return (
    <div className="pb-20">
      {/* Header */}
      <div className="flex items-center justify-between" style={{ padding: '24px 24px 8px 24px' }}>
        <h1 className="text-toss-grey-900" style={{ fontSize: 24, fontWeight: 800 }}>{t('mypage.title')}</h1>
        <IconButton
          icon={<Settings size={22} />}
          aria-label="설정"
          variant="clear"
          iconSize={22}
          onClick={() => navigate('/app/settings')}
        />
      </div>

      {/* ─── Profile Card ─── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-6 bg-[var(--toss-bg)] border border-toss-grey-200 overflow-hidden"
        style={{ borderRadius: 20 }}
      >
        {/* 프로필 헤더 — 클릭 시 프로필 수정 페이지로 이동 */}
        <button
          onClick={() => navigate('/app/profile/edit')}
          className="w-full p-5 pb-4 active:bg-toss-grey-50 transition-colors"
          aria-label="프로필 수정하기"
        >
          <div className="flex items-center gap-4">
            <div
              className="flex items-center justify-center bg-toss-grey-700 rounded-full overflow-hidden"
              style={{ width: 56, height: 56 }}
              aria-hidden="true"
            >
              {profile.profileImage ? (
                <img src={profile.profileImage} alt="" className="w-full h-full object-cover" />
              ) : (
                <User size={28} className="text-toss-grey-400" />
              )}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <h2 className="text-toss-grey-900" style={{ fontSize: 20, fontWeight: 700 }}>{displayProfile.name}</h2>
              <p className="text-toss-grey-400 mt-0.5" style={{ fontSize: 13 }}>{displayProfile.email}</p>
              {displayProfile.statusMessage && (
                <p className="text-toss-grey-500 mt-1 truncate" style={{ fontSize: 12 }}>{displayProfile.statusMessage}</p>
              )}
            </div>
            <ChevronRight size={18} className="text-toss-grey-300 shrink-0" aria-hidden="true" />
          </div>
        </button>
      </motion.div>

      {/* 통계 및 친밀도 분포 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mx-6 mt-4 bg-[var(--toss-bg)] border border-toss-grey-200"
        style={{ borderRadius: 16 }}
        aria-label="인연 통계 및 친밀도 분포"
      >
        {/* 통계 */}
        <div className="grid grid-cols-3 py-4">
          {[
            { label: t('mypage.total'), value: totalContacts },
            { label: t('mypage.close'), value: closeCount },
            { label: t('mypage.gift_done'), value: giftDone },
          ].map(({ label, value }) => (
            <div key={label} className="flex flex-col items-center py-1">
              <span className="text-toss-blue" style={{ fontSize: 22, fontWeight: 800 }}>{value}</span>
              <span className="text-toss-grey-500 mt-1" style={{ fontSize: 11 }}>{label}</span>
            </div>
          ))}
        </div>

        {/* 구분선 */}
        <div className="mx-4 border-t border-toss-grey-100" />

        {/* 친밀도 분포 */}
        <div className="p-4">
          <h3 className="text-toss-grey-900 mb-3" style={{ fontSize: 15, fontWeight: 700 }}>{t('mypage.closeness_dist')}</h3>
          <div className="space-y-2">
            {CLOSENESS_ORDER.map((cl) => {
              const count = contacts.filter(c => c.closeness === cl).length;
              const pct = totalContacts > 0 ? count / totalContacts : 0;
              return (
                <div key={cl} className="flex items-center gap-3">
                  <span className="text-toss-grey-600 shrink-0" style={{ fontSize: 13, width: 70 }}>{cl}</span>
                  <div className="flex-1">
                    <ProgressBar
                      progress={pct}
                      size="light"
                      animate
                      aria-label={`${cl} ${count}명`}
                    />
                  </div>
                  <span className="text-toss-grey-500 shrink-0" style={{ fontSize: 12, width: 24, textAlign: 'right' }}>{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* Menu Sections */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="mt-4"
      >
        <MenuSection title={t('mypage.manage')}>
          <MenuItem icon={<Users size={20} />} label={t('mypage.my_stats')} onClick={() => navigate('/app/contacts')} />
          <MenuItem icon={<BarChart3 size={20} />} label={lang === 'ko' ? '인사이트' : 'Insights'} onClick={() => navigate('/app/insights')} />
          <MenuItem icon={<Gift size={20} />} label={t('mypage.birthday_cal')} onClick={() => navigate('/app/calendar')} />
          <MenuItem icon={<Star size={20} />} label={t('mypage.favorites')} onClick={() => navigate('/app/contacts')} />
        </MenuSection>

        <MenuSection title={t('mypage.settings_group')}>
          <MenuItem icon={<Settings size={20} />} label={t('mypage.app_settings')} onClick={() => navigate('/app/settings')} />
          <MenuItem icon={<Moon size={20} />} label={t('mypage.darkmode')} badge={resolvedTheme === 'dark' ? t('mypage.darkmode.on') : t('mypage.darkmode.off')} onClick={toggleTheme} />
          <MenuItem icon={<Shield size={20} />} label={t('mypage.privacy')} onClick={() => navigate('/app/privacy')} />
        </MenuSection>

        <MenuSection title={t('mypage.help')}>
          <MenuItem icon={<HelpCircle size={20} />} label={t('mypage.faq')} onClick={() => navigate('/app/faq')} />
          <MenuItem icon={<MessageSquare size={20} />} label={t('mypage.inquiry')} onClick={() => navigate('/app/inquiry')} />
        </MenuSection>
      </motion.div>

      {/* Logout */}
      <div className="px-6 mt-4 mb-4">
        <button
          onClick={() => setLogoutOpen(true)}
          className="w-full flex items-center gap-3 py-3 text-toss-red"
          style={{ fontSize: 15, minHeight: 44 }}
          aria-label={t('mypage.logout')}
        >
          <LogOut size={18} aria-hidden="true" />
          <span>{t('mypage.logout')}</span>
        </button>
      </div>

      <div className="px-6 pb-4">
        <p className="text-toss-grey-400 text-center" style={{ fontSize: 11 }}>keepin v1.0.0</p>
      </div>

      {/* Logout Popup */}
      <Popup
        isOpen={logoutOpen}
        onClose={() => setLogoutOpen(false)}
        title={t('mypage.logout.title')}
        description={t('mypage.logout.desc')}
        confirmText={t('mypage.logout')}
        cancelText={t('common.cancel')}
        destructive
        closeOnDimmerClick={false}
        onConfirm={() => {
          resetAnalyticsSession();
          resetMessageFatigueSession();
          resetA11yLiveSession();
          resetFeedSession();
          clearProfile();
          resetNotificationState();
          resetNotificationSettings();
          resetContactsStore();
          resetGroupStore();
          resetAutoMessageStore();
          resetInteractionLogStore();
          resetStatsStore();
          resetTagStore();
          signOut();
          navigate('/', { replace: true });
        }}
      />
    </div>
  );
}

function MenuSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-2 bg-[var(--toss-bg)]">
      <div className="px-6 pt-3 pb-1">
        <h4 className="text-toss-grey-500" style={{ fontSize: 12, fontWeight: 600 }}>{title}</h4>
      </div>
      {children}
    </div>
  );
}

function MenuItem({ icon, label, onClick, badge }: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  badge?: string;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-6 active:bg-toss-grey-50 transition-colors"
      style={{ height: 52, minHeight: 44 }}
      aria-label={badge ? `${label} (${badge})` : label}
    >
      <span className="text-toss-grey-600" aria-hidden="true">{icon}</span>
      <span className="flex-1 text-left text-toss-grey-800" style={{ fontSize: 15 }}>{label}</span>
      {badge && (
        <span className="bg-toss-grey-100 text-toss-grey-500 px-2 py-0.5 rounded-full" style={{ fontSize: 11, fontWeight: 500 }}>
          {badge}
        </span>
      )}
      <ChevronRight size={16} className="text-toss-grey-300" aria-hidden="true" />
    </button>
  );
}
