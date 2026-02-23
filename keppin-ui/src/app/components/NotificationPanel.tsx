import { useMemo, useCallback, useState } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft, Bell, PartyPopper, PhoneOff, Cake,
  MessageSquare, Trash2, CheckCheck, Info, X,
} from 'lucide-react';
import { type Contact } from '../data/contacts';
import {
  useContacts,
  getUpcomingBirthdaysFromStore,
  getRelationshipColor,
  getContactsNeedingAttentionFromStore,
} from '../data/contactsStore';
import {
  type ServerNotification,
  useNotificationState,
  clearAllNotifications,
  deleteNotification,
  markAllRead,
} from '../data/notificationStore';
import { ContactAvatar } from './ContactAvatar';
import { formatBirthday, formatContactGap } from './useFormatters';
import { Popup } from './Popup';

/* ─── 나라별 공휴일 타입 재사용 ─── */
export interface NationalHoliday {
  name: string;
  month: number;
  day: number;
  year?: number;
}

/* ─── 알림 타입 (로컬) ─── */
export interface Notification {
  id: string;
  type: 'birthday' | 'attention' | 'holiday';
  title: string;
  description: string;
  time: string;
  contact?: Contact;
}

export function buildNotifications(contacts: Contact[], holidays: NationalHoliday[]): Notification[] {
  const notifications: Notification[] = [];
  const now = new Date();

  // 다가오는 생일 (14일 이내)
  const birthdays = getUpcomingBirthdaysFromStore(14);
  birthdays.forEach((c) => {
    notifications.push({
      id: `notif-bd-${c.id}`,
      type: 'birthday',
      title: c.birthdayDday === 0 ? `오늘은 ${c.name}님의 생일이에요!` : `${c.name}님의 생일이 ${c.birthdayDday}일 남았어요`,
      description: `${c.relationship} · ${formatBirthday(c.birthday)}`,
      time: c.birthdayDday === 0 ? '오늘' : `D-${c.birthdayDday}`,
      contact: c,
    });
  });

  // 연락이 뜸한 사람 (21일 이상, 최대 5명)
  const needAttention = getContactsNeedingAttentionFromStore(21);
  needAttention.slice(0, 5).forEach((c) => {
    notifications.push({
      id: `notif-att-${c.id}`,
      type: 'attention',
      title: `${c.name}님에게 연락해보세요`,
      description: `마지막 연락 ${formatContactGap(c.contactGap)}`,
      time: `${c.contactGap}일 전`,
      contact: c,
    });
  });

  // 다가오는 공휴일 (7일 이내)
  holidays.forEach((h) => {
    if (h.year && h.year !== now.getFullYear()) return;
    const year = h.year || now.getFullYear();
    const eventDate = new Date(year, h.month - 1, h.day);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diff = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diff >= 0 && diff <= 7) {
      notifications.push({
        id: `notif-hd-${h.name}-${h.month}-${h.day}`,
        type: 'holiday',
        title: diff === 0 ? `오늘은 ${h.name}이에요!` : `${h.name}이 ${diff}일 남았어요`,
        description: `${h.month}월 ${h.day}일`,
        time: diff === 0 ? '오늘' : `D-${diff}`,
      });
    }
  });

  return notifications;
}

/* ─── 서버 알림 타입별 아이콘/색상 매핑 ─── */
const SERVER_NOTIF_META: Record<string, {
  icon: React.ReactNode;
  iconBg: string;
  sectionTitle: string;
  sectionIcon: React.ReactNode;
}> = {
  auto_message: {
    icon: <MessageSquare size={20} className="text-toss-grey-700" />,
    iconBg: 'var(--toss-grey-100)',
    sectionTitle: '예약 메시지',
    sectionIcon: <MessageSquare size={16} className="text-toss-grey-700" />,
  },
  birthday_reminder: {
    icon: <Cake size={20} className="text-toss-red" />,
    iconBg: 'var(--toss-red-50)',
    sectionTitle: '생일 리마인더',
    sectionIcon: <Cake size={16} className="text-toss-red" />,
  },
  contact_reminder: {
    icon: <PhoneOff size={20} className="text-toss-grey-500" />,
    iconBg: 'var(--toss-grey-100)',
    sectionTitle: '연락 리마인더',
    sectionIcon: <PhoneOff size={16} className="text-toss-grey-500" />,
  },
  system: {
    icon: <Info size={20} className="text-toss-grey-600" />,
    iconBg: 'var(--toss-grey-100)',
    sectionTitle: '시스템',
    sectionIcon: <Bell size={16} className="text-toss-grey-600" />,
  },
};

/* ─── 탭 타입 ─── */
type NotifTab = 'all' | 'server';

/* ─── 알림 버튼 (헤더에 사용) ─── */
export function NotificationBellButton({
  unreadCount,
  onClick,
}: {
  unreadCount: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="relative flex items-center justify-center rounded-full active:bg-toss-grey-100 transition-colors"
      style={{ width: 44, height: 44 }}
      aria-label={`알림${unreadCount > 0 ? ` (${unreadCount}개)` : ''}`}
    >
      <Bell size={22} className="text-toss-grey-700" />
      {unreadCount > 0 && (
        <div
          className="absolute flex items-center justify-center bg-toss-red rounded-full"
          style={{ width: 18, height: 18, top: 6, right: 6 }}
        >
          <span className="text-white" style={{ fontSize: 10, fontWeight: 700 }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        </div>
      )}
    </button>
  );
}

/* ─── 전체 화면 알림 패널 ─── */
export function NotificationPanel({
  isOpen,
  onClose,
  notifications,
}: {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
}) {
  const navigate = useNavigate();
  const contacts = useContacts();
  const notifState = useNotificationState();
  const [activeTab, setActiveTab] = useState<NotifTab>('all');
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);

  /* 서버 알림을 타입별로 그룹화 */
  const serverByType = useMemo(() => {
    const groups: Record<string, ServerNotification[]> = {};
    for (const n of notifState.serverNotifications) {
      if (!groups[n.type]) groups[n.type] = [];
      groups[n.type].push(n);
    }
    return groups;
  }, [notifState.serverNotifications]);

  const totalCount = notifications.length + notifState.serverNotifications.length;
  const serverCount = notifState.serverNotifications.length;

  const handleClearAll = useCallback(() => {
    setClearConfirmOpen(false);
    clearAllNotifications();
  }, []);

  const handleMarkAllRead = useCallback(() => {
    markAllRead();
  }, []);

  const handleDeleteOne = useCallback((id: string) => {
    deleteNotification(id);
  }, []);

  /* 서버 알림에서 연락처 찾기 */
  const findContact = useCallback((contactId?: string) => {
    if (!contactId) return undefined;
    return contacts.find((c) => c.id === contactId);
  }, [contacts]);

  /* 상대 시간 포맷 */
  const formatRelativeTime = useCallback((dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHr = Math.floor(diffMs / 3600000);
    const diffDay = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return '방금';
    if (diffMin < 60) return `${diffMin}분 전`;
    if (diffHr < 24) return `${diffHr}시간 전`;
    if (diffDay < 7) return `${diffDay}일 전`;
    return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
  }, []);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[60]"
            style={{ backgroundColor: 'var(--toss-overlay-dim)' }}
            onClick={onClose}
          />
          {/* Panel */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{
              type: 'spring',
              damping: 30,
              stiffness: 300,
            }}
            className="fixed inset-0 bg-[var(--toss-bg)] z-[61] flex flex-col"
            role="dialog"
            aria-modal="true"
            aria-label="알림"
          >
            {/* Header */}
            <div
              className="flex items-center justify-between shrink-0 border-b border-toss-grey-100"
              style={{ padding: '12px 16px', paddingTop: 'max(env(safe-area-inset-top, 12px), 12px)' }}
            >
              <div className="flex items-center gap-3">
                <button
                  onClick={onClose}
                  className="flex items-center justify-center rounded-full active:bg-toss-grey-100 transition-colors"
                  style={{ width: 44, height: 44 }}
                  aria-label="뒤로가기"
                >
                  <ArrowLeft size={22} className="text-toss-grey-800" />
                </button>
                <h2 className="text-toss-grey-900" style={{ fontSize: 18, fontWeight: 700 }}>알림</h2>
              </div>

              {/* Header actions */}
              <div className="flex items-center gap-1">
                {notifState.unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full active:bg-toss-grey-100 transition-colors"
                    style={{ fontSize: 12, fontWeight: 600 }}
                    aria-label="모두 읽음"
                  >
                    <CheckCheck size={14} className="text-toss-grey-600" />
                    <span className="text-toss-grey-600">읽음</span>
                  </button>
                )}
                {serverCount > 0 && (
                  <button
                    onClick={() => setClearConfirmOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full active:bg-toss-grey-100 transition-colors"
                    style={{ fontSize: 12, fontWeight: 600 }}
                    aria-label="전체 삭제"
                  >
                    <Trash2 size={14} className="text-toss-red" />
                    <span className="text-toss-red">삭제</span>
                  </button>
                )}
              </div>
            </div>

            {/* Tab bar */}
            <div className="flex border-b border-toss-grey-100 shrink-0">
              <TabButton
                label="전체"
                count={totalCount}
                active={activeTab === 'all'}
                onClick={() => setActiveTab('all')}
              />
              <TabButton
                label="서버 알림"
                count={serverCount}
                active={activeTab === 'server'}
                onClick={() => setActiveTab('server')}
              />
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {activeTab === 'all' ? (
                /* ─── 전체 탭: 로컬 + 서버 ─── */
                totalCount === 0 ? (
                  <EmptyState />
                ) : (
                  <div className="pb-6">
                    {/* 로컬 알림 섹션들 */}
                    {(() => {
                      const bdNotifs = notifications.filter((n) => n.type === 'birthday');
                      const attNotifs = notifications.filter((n) => n.type === 'attention');
                      const hdNotifs = notifications.filter((n) => n.type === 'holiday');
                      return (
                        <>
                          {bdNotifs.length > 0 && (
                            <NotifSection title="다가오는 생일" icon={<Cake size={16} className="text-toss-red" />}>
                              {bdNotifs.map((notif, idx) => (
                                <LocalNotifItem
                                  key={notif.id}
                                  notif={notif}
                                  index={idx}
                                  onTap={() => {
                                    if (notif.contact) {
                                      onClose();
                                      navigate(`/app/contact/${notif.contact.id}`);
                                    }
                                  }}
                                />
                              ))}
                            </NotifSection>
                          )}
                          {attNotifs.length > 0 && (
                            <NotifSection title="연락이 뜸한 사람" icon={<PhoneOff size={16} className="text-toss-grey-500" />}>
                              {attNotifs.map((notif, idx) => (
                                <LocalNotifItem
                                  key={notif.id}
                                  notif={notif}
                                  index={idx}
                                  onTap={() => {
                                    if (notif.contact) {
                                      onClose();
                                      navigate(`/app/contact/${notif.contact.id}`);
                                    }
                                  }}
                                />
                              ))}
                            </NotifSection>
                          )}
                          {hdNotifs.length > 0 && (
                            <NotifSection title="홀리데이" icon={<PartyPopper size={16} className="text-toss-grey-600" />}>
                              {hdNotifs.map((notif, idx) => (
                                <LocalNotifItem key={notif.id} notif={notif} index={idx} />
                              ))}
                            </NotifSection>
                          )}
                        </>
                      );
                    })()}

                    {/* 서버 알림 섹션들 */}
                    {(['auto_message', 'birthday_reminder', 'contact_reminder', 'system'] as const).map((type) => {
                      const items = serverByType[type];
                      if (!items || items.length === 0) return null;
                      const meta = SERVER_NOTIF_META[type];
                      return (
                        <NotifSection key={type} title={meta.sectionTitle} icon={meta.sectionIcon}>
                          {items.map((notif, idx) => (
                            <ServerNotifItem
                              key={notif.id}
                              notif={notif}
                              index={idx}
                              contact={findContact(notif.contactId)}
                              meta={meta}
                              formatTime={formatRelativeTime}
                              onTap={() => {
                                const c = findContact(notif.contactId);
                                if (c) {
                                  onClose();
                                  navigate(`/app/contact/${c.id}`);
                                }
                              }}
                              onDelete={() => handleDeleteOne(notif.id)}
                            />
                          ))}
                        </NotifSection>
                      );
                    })}
                  </div>
                )
              ) : (
                /* ─── 서버 알림 탭 ─── */
                serverCount === 0 ? (
                  <EmptyState message="서버에서 생성된 알림이 없어요" />
                ) : (
                  <div className="pb-6">
                    {(['auto_message', 'birthday_reminder', 'contact_reminder', 'system'] as const).map((type) => {
                      const items = serverByType[type];
                      if (!items || items.length === 0) return null;
                      const meta = SERVER_NOTIF_META[type];
                      return (
                        <NotifSection key={type} title={meta.sectionTitle} icon={meta.sectionIcon}>
                          {items.map((notif, idx) => (
                            <ServerNotifItem
                              key={notif.id}
                              notif={notif}
                              index={idx}
                              contact={findContact(notif.contactId)}
                              meta={meta}
                              formatTime={formatRelativeTime}
                              onTap={() => {
                                const c = findContact(notif.contactId);
                                if (c) {
                                  onClose();
                                  navigate(`/app/contact/${c.id}`);
                                }
                              }}
                              onDelete={() => handleDeleteOne(notif.id)}
                            />
                          ))}
                        </NotifSection>
                      );
                    })}
                  </div>
                )
              )}
            </div>
          </motion.div>

          {/* 전체 삭제 확인 팝업 */}
          <Popup
            isOpen={clearConfirmOpen}
            onClose={() => setClearConfirmOpen(false)}
            title="알림 전체 삭제"
            description="서버에서 생성된 알림을 모두 삭제할까요? 이 작업은 되돌릴 수 없어요."
            confirmText="삭제"
            cancelText="취소"
            destructive
            onConfirm={handleClearAll}
          />
        </>
      )}
    </AnimatePresence>
  );
}

/* ─── 빈 상태 ─── */
function EmptyState({ message = '새로운 알림이 없어요' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24">
      <div
        className="flex items-center justify-center rounded-full bg-toss-grey-100 mb-4"
        style={{ width: 64, height: 64 }}
      >
        <Bell size={28} className="text-toss-grey-300" />
      </div>
      <p className="text-toss-grey-400" style={{ fontSize: 15, fontWeight: 500 }}>
        {message}
      </p>
    </div>
  );
}

/* ─── 탭 버튼 ─── */
function TabButton({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-1.5 py-3 transition-colors relative ${
        active ? 'text-toss-grey-900' : 'text-toss-grey-400'
      }`}
      style={{ fontSize: 14, fontWeight: active ? 700 : 500 }}
    >
      {label}
      {count > 0 && (
        <span
          className={`rounded-full px-1.5 ${
            active ? 'bg-toss-grey-900 text-[var(--toss-bg)]' : 'bg-toss-grey-200 text-toss-grey-500'
          }`}
          style={{ fontSize: 10, fontWeight: 700, lineHeight: '16px', minWidth: 18, textAlign: 'center' }}
        >
          {count > 99 ? '99+' : count}
        </span>
      )}
      {active && (
        <motion.div
          layoutId="notif-tab-indicator"
          className="absolute bottom-0 left-4 right-4 bg-toss-grey-900"
          style={{ height: 2, borderRadius: 1 }}
        />
      )}
    </button>
  );
}

/* ─── 섹션 헤더 ─── */
function NotifSection({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-center gap-2 px-6 pt-5 pb-2">
        {icon}
        <h3 className="text-toss-grey-500" style={{ fontSize: 12, fontWeight: 600 }}>{title}</h3>
      </div>
      {children}
    </section>
  );
}

/* ─── 로컬 알림 아이템 ─── */
function LocalNotifItem({
  notif,
  index,
  onTap,
}: {
  notif: Notification;
  index: number;
  onTap?: () => void;
}) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.2 }}
      onClick={onTap}
      disabled={!onTap}
      className={`w-full flex items-center gap-3 px-6 py-3 ${onTap ? 'active:bg-toss-grey-50' : ''} transition-colors`}
      style={{ minHeight: 60 }}
    >
      {/* Avatar / Icon */}
      {notif.contact ? (
        <ContactAvatar
          name={notif.contact.name}
          color={getRelationshipColor(notif.contact.relationship)}
          size={44}
        />
      ) : (
        <div
          className="flex items-center justify-center rounded-full shrink-0"
          style={{ width: 44, height: 44, backgroundColor: 'var(--toss-grey-100)' }}
        >
          <PartyPopper size={20} className="text-toss-grey-600" />
        </div>
      )}

      {/* Text */}
      <div className="flex-1 min-w-0 text-left">
        <p className="text-toss-grey-900 truncate" style={{ fontSize: 14, fontWeight: 500 }}>
          {notif.title}
        </p>
        <p className="text-toss-grey-500 truncate mt-0.5" style={{ fontSize: 12 }}>
          {notif.description}
        </p>
      </div>

      {/* Badge */}
      <span
        className={`shrink-0 px-2.5 py-0.5 rounded-full ${
          notif.type === 'birthday'
            ? 'bg-toss-red-50 text-toss-red'
            : notif.type === 'holiday'
              ? 'bg-toss-grey-100 text-toss-grey-600'
              : 'bg-toss-grey-100 text-toss-grey-600'
        }`}
        style={{ fontSize: 11, fontWeight: 600 }}
      >
        {notif.time}
      </span>
    </motion.button>
  );
}

/* ─── 서버 알림 아이템 (스와이프 삭제) ─── */
function ServerNotifItem({
  notif,
  index,
  contact,
  meta,
  formatTime,
  onTap,
  onDelete,
}: {
  notif: ServerNotification;
  index: number;
  contact?: Contact;
  meta: typeof SERVER_NOTIF_META[string];
  formatTime: (dateStr: string) => string;
  onTap?: () => void;
  onDelete: () => void;
}) {
  const [showDelete, setShowDelete] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ delay: index * 0.03, duration: 0.2 }}
      className="relative overflow-hidden"
    >
      {/* Delete backdrop */}
      {showDelete && (
        <div className="absolute inset-0 flex items-center justify-end bg-toss-red" style={{ zIndex: 0 }}>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="flex items-center justify-center px-6 h-full text-white"
            style={{ fontSize: 13, fontWeight: 600 }}
            aria-label="삭제"
          >
            <Trash2 size={18} />
          </button>
        </div>
      )}

      {/* Main content */}
      <div
        role="button"
        tabIndex={0}
        onClick={onTap}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onTap?.(); } }}
        className={`w-full flex items-center gap-3 px-6 py-3 transition-colors relative cursor-default ${
          onTap ? 'active:bg-toss-grey-50 cursor-pointer' : ''
        } ${!notif.read ? 'bg-toss-grey-50' : 'bg-[var(--toss-bg)]'}`}
        style={{ minHeight: 64, zIndex: 1 }}
      >
        {/* Read indicator */}
        {!notif.read && (
          <div
            className="absolute bg-toss-grey-700 rounded-full"
            style={{ width: 6, height: 6, left: 10, top: '50%', transform: 'translateY(-50%)' }}
          />
        )}

        {/* Avatar / Icon */}
        {contact ? (
          <ContactAvatar
            name={contact.name}
            color={getRelationshipColor(contact.relationship)}
            size={44}
          />
        ) : (
          <div
            className="flex items-center justify-center rounded-full shrink-0"
            style={{ width: 44, height: 44, backgroundColor: meta.iconBg }}
          >
            {meta.icon}
          </div>
        )}

        {/* Text */}
        <div className="flex-1 min-w-0 text-left">
          <p
            className={`truncate ${!notif.read ? 'text-toss-grey-900' : 'text-toss-grey-700'}`}
            style={{ fontSize: 14, fontWeight: !notif.read ? 600 : 400 }}
          >
            {notif.title}
          </p>
          <p className="text-toss-grey-500 mt-0.5" style={{ fontSize: 12, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {notif.body}
          </p>
          <p className="text-toss-grey-400 mt-0.5" style={{ fontSize: 11 }}>
            {formatTime(notif.createdAt)}
          </p>
        </div>

        {/* Delete button (always visible as X) */}
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="shrink-0 flex items-center justify-center rounded-full active:bg-toss-grey-200 transition-colors"
          style={{ width: 32, height: 32 }}
          aria-label="이 알림 삭제"
        >
          <X size={14} className="text-toss-grey-400" />
        </button>
      </div>
    </motion.div>
  );
}