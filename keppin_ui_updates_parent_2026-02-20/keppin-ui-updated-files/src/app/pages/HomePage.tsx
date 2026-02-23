import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router';
import { motion, useMotionValue, type PanInfo } from 'motion/react';
import {
  Cake, PhoneOff, Search, X, Plus,
  ArrowRight, MessageSquare,
} from 'lucide-react';
import { type Contact } from '../data/contacts';
import {
  useContacts,
  getUpcomingBirthdaysFromStore,
  getContactsNeedingAttentionFromStore,
  getRelationshipColor,
} from '../data/contactsStore';
import { ContactAvatar } from '../components/ContactAvatar';
import { Skeleton } from '../components/Skeleton';
import { IconButton } from '../components/IconButton';
import { KeppinLogo } from '../components/KeppinLogo';
import { useDebounce, useDelayedLoading } from '../components/useDebounce';
import { useAnalytics } from '../components/useAnalytics';
import { formatBirthday } from '../components/useFormatters';
import { useMotionConfig } from '../components/useMotionConfig';
import { INPUT_MAX_LENGTH } from '../components/useInputValidation';
import { BottomSheet } from '../components/BottomSheet';
import {
  type NationalHoliday,
  buildNotifications,
  NotificationBellButton,
  NotificationPanel,
} from '../components/NotificationPanel';
import { useLanguage } from '../components/useLanguage';
import {
  getAllScheduledMessages,
  useAutoMessagePrefs,
  OCCASION_META,
} from '../data/autoMessageStore';
import { useNotificationState, fetchNotifications, generateNotifications, markAllRead } from '../data/notificationStore';
import { isAuthenticated } from '../data/authStore';
import { useDocumentTitle } from '../components/useDocumentTitle';

/* 3D 아이콘 이미지 */
import personIcon3D from "../../assets/figma/24ad3e09c31fc3adc23cdc38ca6306a3c4aacc7b.png";
import networkIcon3D from "../../assets/figma/07544c11520718b7c584d0532129557f3870e4e5.png";
import phoneIcon3D from "../../assets/figma/ee0517f2109ad677a122e3ee999995a8e8c60c2a.png";
import giftIcon3D from "../../assets/figma/53d775e7fc7b6422683fe2d3018781c32a068742.png";

/* ─── TDS Typography ─── */
const TYPO = {
  t3: { fontSize: 'var(--typo-3-size)', lineHeight: 'var(--typo-3-lh)' },
  t4: { fontSize: 'var(--typo-4-size)', lineHeight: 'var(--typo-4-lh)' },
  t5: { fontSize: 'var(--typo-5-size)', lineHeight: 'var(--typo-5-lh)' },
  t6: { fontSize: 'var(--typo-6-size)', lineHeight: 'var(--typo-6-lh)' },
  t7: { fontSize: 'var(--typo-7-size)', lineHeight: 'var(--typo-7-lh)' },
  s11: { fontSize: 'var(--typo-sub11-size)', lineHeight: 'var(--typo-sub11-lh)' },
  s12: { fontSize: 'var(--typo-sub12-size)', lineHeight: 'var(--typo-sub12-lh)' },
  s13: { fontSize: 'var(--typo-sub13-size)', lineHeight: 'var(--typo-sub13-lh)' },
} as const;
const W = { medium: 500, semibold: 600, bold: 700 } as const;
const PX = 24;
const CARD_RADIUS = 16;
const LIST_CELL_H = 56;

/* ─── 시간대별 인사말 ─── */
function getGreeting(lang: string): string {
  const h = new Date().getHours();
  if (lang === 'en') {
    if (h < 6) return 'Burning the midnight oil';
    if (h < 12) return 'Good morning!';
    if (h < 18) return 'Good afternoon!';
    return 'Good evening!';
  }
  if (h < 6) return '안녕하세요';
  if (h < 12) return '좋은 아침이에요';
  if (h < 18) return '좋은 오후예요';
  return '좋은 저녁이에요';
}

/* ─── 연락 공백 포맷 (연락 안 한지 X일) ─── */
function formatNoContactGap(days: number, lang: string): string {
  if (lang === 'en') {
    if (days === 0) return 'Contacted today';
    if (days === 1) return 'No contact for 1 day';
    if (days < 7) return `No contact for ${days} days`;
    if (days < 30) return `No contact for ${Math.floor(days / 7)} weeks`;
    if (days < 365) return `No contact for ${Math.floor(days / 30)} months`;
    return `No contact for ${Math.floor(days / 365)}+ years`;
  }
  if (days === 0) return '오늘 연락함';
  if (days < 7) return `연락 안 한지 ${days}일`;
  if (days < 30) return `연락 안 한지 ${Math.floor(days / 7)}주`;
  if (days < 365) return `연락 안 한지 ${Math.floor(days / 30)}개월`;
  return `연락 안 한지 ${Math.floor(days / 365)}년 이상`;
}

/* ─── 공휴일 데이터 ─── */
const KOREA_HOLIDAYS: NationalHoliday[] = [
  { name: '신정', month: 1, day: 1 },
  { name: '삼일절', month: 3, day: 1 },
  { name: '어린이날', month: 5, day: 5 },
  { name: '현충일', month: 6, day: 6 },
  { name: '광복절', month: 8, day: 15 },
  { name: '개천절', month: 10, day: 3 },
  { name: '한글날', month: 10, day: 9 },
  { name: '크리스마스', month: 12, day: 25 },
  { name: '설날 연휴', month: 2, day: 16, year: 2026 },
  { name: '설날', month: 2, day: 17, year: 2026 },
  { name: '설날 연휴', month: 2, day: 18, year: 2026 },
  { name: '부처님 오신 날', month: 5, day: 24, year: 2026 },
  { name: '추석 연휴', month: 9, day: 24, year: 2026 },
  { name: '추석', month: 9, day: 25, year: 2026 },
  { name: '추석 연휴', month: 9, day: 26, year: 2026 },
  { name: '어버이날', month: 5, day: 8 },
  { name: '스승의 날', month: 5, day: 15 },
];

/* ═══════════════════════════════════════
   D-Day 뱃지
   ═══════════════════════════════════════ */
function DdayBadge({ dday }: { dday: number }) {
  const urgent = dday <= 7;
  return (
    <span
      className={`shrink-0 ${urgent ? 'bg-toss-red-50 text-toss-red' : 'bg-toss-grey-100 text-toss-grey-600'}`}
      style={{ ...TYPO.s12, fontWeight: W.semibold, padding: '4px 8px', borderRadius: 12 }}
    >
      {dday === 0 ? 'D-DAY' : `D-${dday}`}
    </span>
  );
}

/* ═══════════════════════════════════════
   스포트라이트 카드 (개별)
   ═══════════════════════════════════════ */
function SpotlightCard({
  contact,
  isBirthday,
  lang,
  onTap,
}: {
  contact: Contact;
  isBirthday: boolean;
  lang: string;
  onTap: () => void;
}) {
  return (
    <button
      onClick={onTap}
      className="w-full bg-toss-bg border border-toss-border-default active:bg-toss-grey-50 transition-colors text-left"
      style={{ padding: 24, borderRadius: CARD_RADIUS, minWidth: 0 }}
    >
      <div className="flex items-center gap-4" style={{ marginBottom: 16 }}>
        <ContactAvatar name={contact.name} color={getRelationshipColor(contact.relationship)} size={56} />
        <div className="min-w-0 flex-1">
          <span className="text-toss-grey-900 block truncate" style={{ ...TYPO.t5, fontWeight: W.bold }}>
            {contact.name}
          </span>
          <span className="text-toss-grey-500" style={TYPO.t7}>{contact.relationship}</span>
        </div>
      </div>
      {isBirthday ? (
        <div className="flex items-center justify-between bg-toss-grey-100" style={{ padding: '12px 16px', borderRadius: 12 }}>
          <div className="flex items-center gap-2">
            
            <span className="text-toss-grey-900" style={{ ...TYPO.s11, fontWeight: W.semibold }}>
              {formatBirthday(contact.birthday)}
            </span>
          </div>
          <DdayBadge dday={contact.birthdayDday} />
        </div>
      ) : (
        <div className="flex items-center justify-between bg-toss-grey-100" style={{ padding: '12px 16px', borderRadius: 12 }}>
          <div className="flex items-center gap-2">
            <img src={phoneIcon3D} alt="" style={{ width: 18, height: 18, objectFit: 'contain' }} aria-hidden="true" />
            <span className="text-toss-grey-900" style={{ ...TYPO.s11, fontWeight: W.semibold }}>
              {formatNoContactGap(contact.contactGap, lang)}
            </span>
          </div>
        </div>
      )}
    </button>
  );
}

/* ═══════════════════════════════════════
   스와이프 가능한 스포트라이트 캐러셀
   ═══════════════════════════════════════ */
function SpotlightCarousel({
  contacts,
  birthdayIds,
  lang,
  onContactTap,
}: {
  contacts: Contact[];
  birthdayIds: Set<string>;
  lang: string;
  onContactTap: (id: string) => void;
}) {
  const [activeIdx, setActiveIdx] = useState(0);
  const mc = useMotionConfig();
  const containerRef = useRef<HTMLDivElement>(null);
  const [cardWidth, setCardWidth] = useState(0);
  const gap = 12;

  // Measure container width dynamically for responsive layout
  useEffect(() => {
    const measure = () => {
      if (containerRef.current) {
        // container has horizontal padding of PX (24px) on each side, already applied via style
        setCardWidth(containerRef.current.clientWidth - PX * 2);
      }
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  const x = useMotionValue(0);

  const handleDragEnd = useCallback(
    (_: any, info: PanInfo) => {
      const threshold = 60;
      const vel = info.velocity.x;
      const offset = info.offset.x;

      let nextIdx = activeIdx;
      if (offset < -threshold || vel < -300) {
        nextIdx = Math.min(activeIdx + 1, contacts.length - 1);
      } else if (offset > threshold || vel > 300) {
        nextIdx = Math.max(activeIdx - 1, 0);
      }
      setActiveIdx(nextIdx);
    },
    [activeIdx, contacts.length],
  );

  // Animate to current card position
  const targetX = -(activeIdx * (cardWidth + gap));

  if (contacts.length === 0) return null;

  return (
    <div style={{ marginBottom: 32 }}>
      {/* Card label */}
      <div className="flex items-center justify-between" style={{ padding: `0 ${PX}px`, marginBottom: 12 }}>
        <div className="flex items-center gap-2">
          
          <span className="text-toss-grey-900" style={{ ...TYPO.t6, fontWeight: W.bold }}>
            {lang === 'en' ? "This month's connections" : '이번 달 인연'}
          </span>
          <span className="text-toss-blue" style={{ ...TYPO.s12, fontWeight: W.semibold }}>
            {contacts.length}
          </span>
        </div>
        {contacts.length > 1 && (
          <span className="text-toss-grey-400" style={TYPO.s12}>
            {activeIdx + 1} / {contacts.length}
          </span>
        )}
      </div>

      {/* Swipeable area */}
      <div
        ref={containerRef}
        className="overflow-hidden"
        style={{ padding: `0 ${PX}px` }}
      >
        <motion.div
          className="flex"
          style={{ gap, x }}
          drag="x"
          dragConstraints={{
            left: -((contacts.length - 1) * (cardWidth + gap)),
            right: 0,
          }}
          dragElastic={0.15}
          onDragEnd={handleDragEnd}
          animate={{ x: targetX }}
          transition={mc.safeTransition('screen')}
        >
          {contacts.map((c) => (
            <div
              key={c.id}
              className="shrink-0"
              style={{ width: cardWidth }}
            >
              <SpotlightCard
                contact={c}
                isBirthday={true}
                lang={lang}
                onTap={() => onContactTap(c.id)}
              />
            </div>
          ))}
        </motion.div>
      </div>

      {/* 도트 인디케이터 */}
      {contacts.length > 1 && (
        <div className="flex items-center justify-center gap-2" style={{ marginTop: 12 }}>
          {contacts.map((c, i) => (
            <button
              key={c.id}
              onClick={() => setActiveIdx(i)}
              className="transition-all"
              style={{
                width: i === activeIdx ? 16 : 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: i === activeIdx ? 'var(--toss-blue-500)' : 'var(--toss-grey-200)',
              }}
              aria-label={`${i + 1}번째 카드`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════
   메인 홈 페이지
   ═══════════════════════════════════════ */
export function HomePage() {
  const navigate = useNavigate();
  const analytics = useAnalytics();
  useDocumentTitle('홈');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  const mc = useMotionConfig();
  const showLoading = useDelayedLoading(isInitialLoading, 200);
  const debouncedSearch = useDebounce(searchQuery, 300);
  const effectiveSearch = debouncedSearch.length >= 2 ? debouncedSearch : '';

  /* 알림 */
  const [notifOpen, setNotifOpen] = useState(false);
  const notifState = useNotificationState();

  useEffect(() => {
    const timer = setTimeout(() => setIsInitialLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    analytics.trackScreenView('Home');
  }, []);

  const contacts = useContacts();
  const upcomingBirthdays = getUpcomingBirthdaysFromStore(60);
  const needAttention = getContactsNeedingAttentionFromStore(14);
  const totalContacts = contacts.length;

  const localNotifications = useMemo(() => buildNotifications(contacts, KOREA_HOLIDAYS), [contacts]);

  /* 스포트라이트 카드 데이터: 이번 달 생일인 인연들만 표시 */
  const birthdayIdSet = useMemo(() => new Set(upcomingBirthdays.map(c => c.id)), [upcomingBirthdays]);
  const spotlightContacts = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    return contacts.filter((c) => {
      if (c.birthdayUnknown || !c.birthday) return false;
      const bday = new Date(c.birthday);
      return bday.getMonth() === currentMonth;
    }).sort((a, b) => {
      const dayA = new Date(a.birthday).getDate();
      const dayB = new Date(b.birthday).getDate();
      return dayA - dayB;
    });
  }, [contacts]);

  /* 서버 알림 생성 + 조회 (마운트 시 1회) */
  useEffect(() => {
    if (!isAuthenticated() || contacts.length === 0) return;

    // 서버에 오늘의 알림 생성 요청
    const scheduledMsgsForServer = getAllScheduledMessages(contacts, 'ko', 7)
      .filter((m) => !m.sent)
      .map((m) => ({
        contactId: m.contactId ?? '',
        contactName: m.contactName,
        occasion: m.occasion,
        scheduledDate: m.scheduledDate,
        message: m.message,
      }));

    const contactSummaries = contacts.map((c) => ({
      id: c.id,
      name: c.name,
      birthday: c.birthday,
      relationship: c.relationship,
      contactGap: c.contactGap,
    }));

    generateNotifications({
      contacts: contactSummaries,
      scheduledMessages: scheduledMsgsForServer,
    }).then(() => {
      fetchNotifications();
    });
  }, [contacts.length]);

  /* 서버 + 로컬 알림 병합 */
  const serverAsLocal = useMemo(() => {
    return notifState.serverNotifications
      .filter((n) => !n.read)
      .map((n) => ({
        id: n.id,
        type: n.type === 'auto_message' ? 'birthday' as const
          : n.type === 'birthday_reminder' ? 'birthday' as const
          : n.type === 'contact_reminder' ? 'attention' as const
          : 'holiday' as const,
        title: n.title,
        description: n.body,
        time: new Date(n.createdAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }),
        contact: n.contactId ? contacts.find((c) => c.id === n.contactId) : undefined,
      }));
  }, [notifState.serverNotifications, contacts]);

  const mergedNotifications = useMemo(() => {
    const localIds = new Set(localNotifications.map((n) => n.id));
    const uniqueServer = serverAsLocal.filter((n) => !localIds.has(n.id));
    return [...localNotifications, ...uniqueServer];
  }, [localNotifications, serverAsLocal]);

  const combinedUnreadCount = localNotifications.length + notifState.unreadCount;

  /* 알림 패널 열 때 서버 알림 읽음 처리 */
  const handleNotifOpen = useCallback(() => {
    setNotifOpen(true);
    if (notifState.unreadCount > 0) {
      markAllRead();
    }
  }, [notifState.unreadCount]);

  const searchResults = effectiveSearch
    ? contacts.filter(c => c.name.includes(effectiveSearch) || c.memo.includes(effectiveSearch))
    : [];

  const { lang, t } = useLanguage();

  /* 자동 메시지 */
  useAutoMessagePrefs(); // 반응성 구독
  const scheduledMessages = useMemo(
    () => getAllScheduledMessages(contacts, lang as 'ko' | 'en', 30),
    [contacts, lang],
  );
  const pendingMessages = scheduledMessages.filter(m => !m.sent);

  if (showLoading) {
    return (
      <div className="pb-20">
        <div className="flex items-center justify-between" style={{ padding: '24px 24px 8px 24px' }}>
          <div style={{ width: 60, height: 28 }} className="rounded-lg bg-toss-grey-200 animate-pulse" />
          <div className="flex gap-2">
            <div className="rounded-full bg-toss-grey-200 animate-pulse" style={{ width: 44, height: 44 }} />
          </div>
        </div>
        <div className="px-6">
          <Skeleton pattern="cardOnly" background="grey" style={{ width: '100%' }} />
        </div>
        <div className="mt-6 px-6">
          <Skeleton pattern="topListWithIcon" repeatLastItemCount={3} style={{ width: '100%' }} />
        </div>
      </div>
    );
  }

  return (
    <div className="pb-20 bg-toss-bg">
      {/* Header */}
      <div className="flex items-center justify-between" style={{ padding: `16px ${PX}px 4px` }}>
        <div className="flex items-center gap-1.5">
          <KeppinLogo size={22} className="text-toss-blue" />
          <h1 className="text-toss-grey-900" style={{ ...TYPO.t4, fontWeight: W.bold }}>keppin</h1>
        </div>
        <div className="flex items-center gap-1">
          <IconButton
            icon={<Search size={22} />}
            aria-label={t('home.search')}
            variant="clear"
            iconSize={22}
            onClick={() => {
              setSearchOpen(true);
              analytics.trackEvent('click', {
                screen_name: 'Home',
                component_name: 'searchButton',
                action: 'open_search',
              });
            }}
          />
          <NotificationBellButton
            unreadCount={combinedUnreadCount}
            onClick={handleNotifOpen}
          />
        </div>
      </div>

      {/* 인사말 + 총 인연 수 */}
      <div style={{ padding: `8px ${PX}px 24px` }}>
        <p className="text-toss-grey-500" style={{ ...TYPO.t7, marginBottom: 4 }}>{getGreeting(lang)}</p>
        <h2 className="text-toss-grey-900" style={{ ...TYPO.t3, fontWeight: W.bold }}>
          {lang === 'en'
            ? <>{totalContacts} precious <span className="text-toss-blue">connections</span></>
            : <>소중한 <span className="text-toss-blue">{totalContacts}</span>명의 인연</>
          }
        </h2>
      </div>

      {/* 스포트라이트 캐러셀 — 좌우 드래그 */}
      <SpotlightCarousel
        contacts={spotlightContacts}
        birthdayIds={birthdayIdSet}
        lang={lang}
        onContactTap={(id) => navigate(`/app/contact/${id}`)}
      />

      {/* 빠른 요약 — 나머지 목록 미리보기 */}
      <div style={{ padding: `0 ${PX}px`, marginBottom: 24 }}>
        {upcomingBirthdays.length > 0 && (
          <button
            onClick={() => navigate('/app/calendar')}
            className="w-full flex items-center justify-between active:bg-toss-grey-50 transition-colors"
            style={{ minHeight: LIST_CELL_H, paddingTop: 8, paddingBottom: 8 }}
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center" style={{ width: 40, height: 40, borderRadius: 12 }}>
                <img src={giftIcon3D} alt="" style={{ width: 36, height: 36, objectFit: 'contain' }} aria-hidden="true" />
              </div>
              <div className="text-left">
                <span className="text-toss-grey-900 block" style={{ ...TYPO.t6, fontWeight: W.semibold }}>
                  {lang === 'en' ? `${upcomingBirthdays.length} upcoming birthdays` : `다가오는 생일 ${upcomingBirthdays.length}명`}
                </span>
                <span className="text-toss-grey-500" style={TYPO.s12}>
                  {lang === 'en' ? 'Next 60 days' : '60일 이내'}
                </span>
              </div>
            </div>
            <ArrowRight size={16} className="text-toss-grey-300" />
          </button>
        )}

        {needAttention.length > 0 && (
          <button
            onClick={() => navigate('/app/contacts')}
            className="w-full flex items-center justify-between active:bg-toss-grey-50 transition-colors"
            style={{ minHeight: LIST_CELL_H, paddingTop: 8, paddingBottom: 8 }}
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center" style={{ width: 40, height: 40, borderRadius: 12 }}>
                <img src={phoneIcon3D} alt="" style={{ width: 36, height: 36, objectFit: 'contain' }} aria-hidden="true" />
              </div>
              <div className="text-left">
                <span className="text-toss-grey-900 block" style={{ ...TYPO.t6, fontWeight: W.semibold }}>
                  {lang === 'en' ? `${needAttention.length} need attention` : `${needAttention.length}명 연락 필요`}
                </span>
                <span className="text-toss-grey-500" style={TYPO.s12}>
                  {lang === 'en' ? 'Over 2 weeks' : '2주 이상 미연락'}
                </span>
              </div>
            </div>
            <ArrowRight size={16} className="text-toss-grey-300" />
          </button>
        )}

        <button
          onClick={() => navigate('/app/contacts')}
          className="w-full flex items-center justify-between active:bg-toss-grey-50 transition-colors"
          style={{ minHeight: LIST_CELL_H, paddingTop: 8, paddingBottom: 8 }}
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center" style={{ width: 40, height: 40, borderRadius: 12 }}>
              <img src={networkIcon3D} alt="" style={{ width: 36, height: 36, objectFit: 'contain' }} aria-hidden="true" />
            </div>
            <div className="text-left">
              <span className="text-toss-grey-900 block" style={{ ...TYPO.t6, fontWeight: W.semibold }}>
                {lang === 'en' ? 'All Connections' : '전체 인연 목록'}
              </span>
              <span className="text-toss-grey-500" style={TYPO.s12}>
                {totalContacts}{lang === 'en' ? ' people' : '명'}
              </span>
            </div>
          </div>
          <ArrowRight size={16} className="text-toss-grey-300" />
        </button>

        {/* 예약 메시지 카드 */}
        {pendingMessages.length > 0 && (
          <button
            onClick={() => navigate('/app/messages')}
            className="w-full flex items-center justify-between active:bg-toss-grey-50 transition-colors"
            style={{ minHeight: LIST_CELL_H, paddingTop: 8, paddingBottom: 8 }}
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center" style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: 'var(--toss-blue-50)' }}>
                <MessageSquare size={20} className="text-toss-blue" />
              </div>
              <div className="text-left">
                <span className="text-toss-grey-900 block" style={{ ...TYPO.t6, fontWeight: W.semibold }}>
                  {lang === 'en'
                    ? `${pendingMessages.length} scheduled messages`
                    : `예약 메시지 ${pendingMessages.length}건`}
                </span>
                <span className="text-toss-grey-500" style={TYPO.s12}>
                  {pendingMessages[0] && (
                    <>
                      {pendingMessages[0].contactName}{' '}
                      {lang === 'ko' ? OCCASION_META[pendingMessages[0].occasion].labelKo : OCCASION_META[pendingMessages[0].occasion].labelEn}{' '}
                      {pendingMessages[0].daysUntil === 0
                        ? (lang === 'en' ? 'today!' : '오늘!')
                        : (lang === 'en'
                            ? `in ${pendingMessages[0].daysUntil} days`
                            : `${pendingMessages[0].daysUntil}일 후`)}
                    </>
                  )}
                </span>
              </div>
            </div>
            <ArrowRight size={16} className="text-toss-grey-300" />
          </button>
        )}
      </div>

      {/* CTA */}
      <div style={{ padding: `0 ${PX}px 24px` }}>
        <button
          onClick={() => navigate('/app/contacts/add')}
          className="w-full flex items-center justify-center gap-2 bg-toss-blue text-[var(--primary-foreground)] active:bg-toss-blue-600 transition-colors"
          style={{ ...TYPO.t6, fontWeight: W.semibold, height: 48, borderRadius: 12 }}
        >
          <Plus size={18} />
          {t('home.add_contact')}
        </button>
      </div>

      {/* Search BottomSheet */}
      <BottomSheet
        isOpen={searchOpen}
        onClose={() => { setSearchOpen(false); setSearchQuery(''); }}
        title={t('home.search')}
        closeOnDimmerClick
      >
        <div className="mb-4">
          <div
            className="flex items-center gap-2 bg-toss-grey-100 rounded-xl px-4"
            style={{ height: 48 }}
          >
            <Search size={18} className="text-toss-grey-400 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value.slice(0, INPUT_MAX_LENGTH.name))}
              placeholder={t('home.search_placeholder')}
              className="flex-1 bg-transparent outline-none text-toss-grey-900"
              style={{ fontSize: 15 }}
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="flex items-center justify-center"
                style={{ width: 28, height: 28 }}
                aria-label="검색어 지우기"
              >
                <X size={16} className="text-toss-grey-400" />
              </button>
            )}
          </div>
        </div>
        <div style={{ maxHeight: '40vh', overflowY: 'auto' }}>
          {effectiveSearch && searchResults.length === 0 && (
            <div className="py-8 flex flex-col items-center text-center">
              <img
                src={personIcon3D}
                alt=""
                style={{ width: 56, height: 56, objectFit: 'contain', marginBottom: 12, opacity: 0.6 }}
                aria-hidden="true"
              />
              <p className="text-toss-grey-400" style={{ fontSize: 14 }}>{t('home.no_results')}</p>
              {/* §2.1 Empty 규칙: "다음 행동 제시" 필수 — 검색어 지우기 + 새 연락처 추가 */}
              <div className="flex items-center gap-2 mt-3 flex-wrap justify-center">
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-toss-blue active:opacity-60 transition-opacity"
                  style={{ fontSize: 13, fontWeight: 600, minHeight: 44, padding: '0 8px' }}
                >
                  {lang === 'en' ? 'Clear search' : '검색어 지우기'}
                </button>
                <button
                  onClick={() => {
                    setSearchOpen(false);
                    setSearchQuery('');
                    navigate('/app/contacts/add');
                  }}
                  className="text-toss-grey-500 active:opacity-60 transition-opacity"
                  style={{ fontSize: 13, fontWeight: 500, minHeight: 44, padding: '0 8px' }}
                >
                  {lang === 'en' ? 'Add new contact' : '새 연락처 추가'}
                </button>
              </div>
            </div>
          )}
          {searchResults.slice(0, 10).map((c) => (
            <button
              key={c.id}
              onClick={() => {
                setSearchOpen(false);
                setSearchQuery('');
                navigate(`/app/contact/${c.id}`);
              }}
              className="w-full flex items-center gap-3 py-3 active:bg-toss-grey-50 transition-colors rounded-xl px-2"
              style={{ minHeight: 52 }}
            >
              <ContactAvatar name={c.name} color={getRelationshipColor(c.relationship)} size={40} />
              <div className="flex-1 min-w-0 text-left">
                <span className="text-toss-grey-900 truncate block" style={{ fontSize: 15, fontWeight: 600 }}>{c.name}</span>
                <span className="text-toss-grey-500" style={{ fontSize: 12 }}>{c.relationship} · {c.closeness}</span>
              </div>
            </button>
          ))}
        </div>
      </BottomSheet>

      {/* 알림 패널 */}
      <NotificationPanel
        isOpen={notifOpen}
        onClose={() => setNotifOpen(false)}
        notifications={mergedNotifications}
      />
    </div>
  );
}
