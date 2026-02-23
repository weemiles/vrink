import { useState, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router';
import {
  Clock, Phone, MessageSquare, Users, Gift, Smartphone, FileText,
  Cake, UserPlus, ChevronRight, ArrowDown,
} from 'lucide-react';
import { NavigationBar } from '../components/NavigationBar';
import { ContactAvatar } from '../components/ContactAvatar';
import { useLanguage } from '../components/useLanguage';
import { useDocumentTitle } from '../components/useDocumentTitle';
import { useContacts, getRelationshipColor, getContactByIdFromStore } from '../data/contactsStore';
import {
  useInteractionLogs,
  INTERACTION_TYPE_META,
  type InteractionType,
} from '../data/interactionLogStore';

/* ─── TDS Typography ─── */
const T = {
  t4: { fontSize: 'var(--typo-4-size)', lineHeight: 'var(--typo-4-lh)' } as const,
  t5: { fontSize: 'var(--typo-5-size)', lineHeight: 'var(--typo-5-lh)' } as const,
  t6: { fontSize: 'var(--typo-6-size)', lineHeight: 'var(--typo-6-lh)' } as const,
  t7: { fontSize: 'var(--typo-7-size)', lineHeight: 'var(--typo-7-lh)' } as const,
  s11: { fontSize: 'var(--typo-sub11-size)', lineHeight: 'var(--typo-sub11-lh)' } as const,
  s12: { fontSize: 'var(--typo-sub12-size)', lineHeight: 'var(--typo-sub12-lh)' } as const,
  s13: { fontSize: 'var(--typo-sub13-size)', lineHeight: 'var(--typo-sub13-lh)' } as const,
};
const W = { medium: 500, semibold: 600, bold: 700 };
const PX = 24;

/* ─── 통합 타임라인 아이템 ─── */
type ActivityKind = InteractionType | 'birthday' | 'new_contact';

interface TimelineItem {
  id: string;
  kind: ActivityKind;
  date: string;       // YYYY-MM-DD
  timestamp: number;  // ms for sorting
  contactId: string;
  contactName: string;
  contactRelationship: string;
  note: string;
}

/* ─── 날짜 그룹 키 ─── */
function getDateGroupKey(dateStr: string, lang: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diff === 0) return lang === 'ko' ? '오늘' : 'Today';
  if (diff === 1) return lang === 'ko' ? '어제' : 'Yesterday';
  if (diff < 7) return lang === 'ko' ? '이번 주' : 'This Week';
  if (diff < 14) return lang === 'ko' ? '지난주' : 'Last Week';
  if (diff < 30) return lang === 'ko' ? '이번 달' : 'This Month';
  if (diff < 60) return lang === 'ko' ? '지난달' : 'Last Month';
  // 월 이름으로 표시
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  if (lang === 'ko') return `${year}년 ${month}월`;
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
}

function formatDateShort(dateStr: string, lang: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  if (lang === 'ko') {
    return `${d.getMonth() + 1}/${d.getDate()}`;
  }
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatDateFull(dateStr: string, lang: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const dayNames = lang === 'ko'
    ? ['일', '월', '화', '수', '목', '금', '토']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  if (lang === 'ko') {
    return `${d.getMonth() + 1}월 ${d.getDate()}일 (${dayNames[d.getDay()]})`;
  }
  return `${dayNames[d.getDay()]}, ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
}

/* ─── 아이콘 매핑 ─── */
function getKindIcon(kind: ActivityKind, size = 16) {
  switch (kind) {
    case 'call': return <Phone size={size} />;
    case 'message': return <MessageSquare size={size} />;
    case 'meeting': return <Users size={size} />;
    case 'gift': return <Gift size={size} />;
    case 'sns': return <Smartphone size={size} />;
    case 'other': return <FileText size={size} />;
    case 'birthday': return <Cake size={size} />;
    case 'new_contact': return <UserPlus size={size} />;
  }
}

function getKindLabel(kind: ActivityKind, lang: string): string {
  if (kind === 'birthday') return lang === 'ko' ? '생일' : 'Birthday';
  if (kind === 'new_contact') return lang === 'ko' ? '새 인연' : 'New Contact';
  const meta = INTERACTION_TYPE_META[kind as InteractionType];
  return lang === 'ko' ? meta.labelKo : meta.labelEn;
}

function getKindColor(kind: ActivityKind): string {
  switch (kind) {
    case 'call': return '#333333';
    case 'message': return '#525252';
    case 'meeting': return '#171717';
    case 'gift': return '#737373';
    case 'sns': return '#8A8A8A';
    case 'other': return '#A3A3A3';
    case 'birthday': return '#171717';
    case 'new_contact': return '#525252';
  }
}

/* ─── 필터 칩 ─── */
type FilterType = 'all' | InteractionType | 'birthday';

const FILTER_OPTIONS: { value: FilterType; labelKo: string; labelEn: string }[] = [
  { value: 'all', labelKo: '전체', labelEn: 'All' },
  { value: 'call', labelKo: '전화', labelEn: 'Call' },
  { value: 'message', labelKo: '메시지', labelEn: 'Message' },
  { value: 'meeting', labelKo: '만남', labelEn: 'Meeting' },
  { value: 'gift', labelKo: '선물', labelEn: 'Gift' },
  { value: 'sns', labelKo: 'SNS', labelEn: 'SNS' },
  { value: 'birthday', labelKo: '생일', labelEn: 'Birthday' },
];

const PAGE_SIZE = 20;

/* ═══════════════════════════════════════════════
   메인 컴포넌트
   ═══════════════════════════════════════════════ */

export function ActivityTimelinePage() {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const ko = lang === 'ko';
  useDocumentTitle(ko ? '활동 타임라인' : 'Activity Timeline');

  const contacts = useContacts();
  const interactionLogs = useInteractionLogs();

  const [filter, setFilter] = useState<FilterType>('all');
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE);

  /* ── 통합 타임라인 생성 ── */
  const allItems = useMemo(() => {
    const items: TimelineItem[] = [];

    // 1) 연락 기록 → 타임라인 아이템
    for (const log of interactionLogs) {
      const contact = getContactByIdFromStore(log.contactId);
      if (!contact) continue;
      items.push({
        id: log.id,
        kind: log.type,
        date: log.date,
        timestamp: new Date(log.date + 'T12:00:00').getTime(),
        contactId: contact.id,
        contactName: contact.name,
        contactRelationship: contact.relationship,
        note: log.note,
      });
    }

    // 2) 다가오는 생일 (30일 이내) → 미래 이벤트
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    for (const c of contacts) {
      if (c.birthdayUnknown || !c.birthday) continue;
      const bday = new Date(c.birthday);
      const thisYear = today.getFullYear();
      let nextBday = new Date(thisYear, bday.getMonth(), bday.getDate());
      if (nextBday < today) {
        nextBday = new Date(thisYear + 1, bday.getMonth(), bday.getDate());
      }
      const diff = Math.ceil((nextBday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (diff <= 30 && diff >= 0) {
        const bdayStr = nextBday.toISOString().split('T')[0];
        items.push({
          id: `bday-${c.id}-${bdayStr}`,
          kind: 'birthday',
          date: bdayStr,
          timestamp: nextBday.getTime(),
          contactId: c.id,
          contactName: c.name,
          contactRelationship: c.relationship,
          note: diff === 0
            ? (ko ? '오늘 생일이에요!' : 'Birthday is today!')
            : (ko ? `D-${diff}` : `${diff} days left`),
        });
      }
    }

    // 날짜순 정렬 (최신 먼저, 미래→과거)
    items.sort((a, b) => b.timestamp - a.timestamp);
    return items;
  }, [interactionLogs, contacts, ko]);

  /* ── 필터 적용 ── */
  const filteredItems = useMemo(() => {
    if (filter === 'all') return allItems;
    return allItems.filter((item) => item.kind === filter);
  }, [allItems, filter]);

  /* ── 날짜 그룹화 ── */
  const grouped = useMemo(() => {
    const visible = filteredItems.slice(0, displayCount);
    const groups: { key: string; dateLabel: string; items: TimelineItem[] }[] = [];
    let currentKey = '';

    for (const item of visible) {
      const key = getDateGroupKey(item.date, lang);
      if (key !== currentKey) {
        currentKey = key;
        groups.push({ key, dateLabel: key, items: [] });
      }
      groups[groups.length - 1].items.push(item);
    }
    return groups;
  }, [filteredItems, displayCount, lang]);

  const hasMore = displayCount < filteredItems.length;

  const loadMore = useCallback(() => {
    setDisplayCount((prev) => Math.min(prev + PAGE_SIZE, filteredItems.length));
  }, [filteredItems.length]);

  /* ── 필터 칩 스크롤 ── */
  const chipRef = useRef<HTMLDivElement>(null);

  /* ── 통계 요약 ── */
  const stats = useMemo(() => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const recentLogs = interactionLogs.filter(
      (l) => new Date(l.date) >= thirtyDaysAgo,
    );
    const uniqueContacts = new Set(recentLogs.map((l) => l.contactId));
    const upcomingBirthdays = allItems.filter((i) => i.kind === 'birthday').length;

    return {
      totalLogs30d: recentLogs.length,
      uniqueContacts30d: uniqueContacts.size,
      upcomingBirthdays,
    };
  }, [interactionLogs, allItems]);

  return (
    <div className="min-h-screen pb-20 bg-[var(--toss-bg)]">
      <NavigationBar
        title={ko ? '활동 타임라인' : 'Activity Timeline'}
        showBack
      />

      {/* 요약 카드 */}
      <div style={{ padding: `0 ${PX}px 16px` }}>
        <div className="grid grid-cols-3 gap-2">
          <SummaryCard
            icon={<Clock size={16} />}
            value={stats.totalLogs30d}
            label={ko ? '30일 활동' : '30d Activity'}
          />
          <SummaryCard
            icon={<Users size={16} />}
            value={stats.uniqueContacts30d}
            label={ko ? '교류 인연' : 'Contacts'}
          />
          <SummaryCard
            icon={<Cake size={16} />}
            value={stats.upcomingBirthdays}
            label={ko ? '다가오는 생일' : 'Birthdays'}
          />
        </div>
      </div>

      {/* 필터 칩 */}
      <div
        ref={chipRef}
        className="flex gap-2 overflow-x-auto scrollbar-hide"
        style={{ padding: `0 ${PX}px 16px` }}
      >
        {FILTER_OPTIONS.map((opt) => {
          const active = filter === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => {
                setFilter(opt.value);
                setDisplayCount(PAGE_SIZE);
              }}
              className={`shrink-0 flex items-center gap-1.5 rounded-full transition-colors ${
                active
                  ? 'bg-toss-grey-900 text-white'
                  : 'bg-toss-grey-100 text-toss-grey-600 active:bg-toss-grey-200'
              }`}
              style={{
                padding: '7px 14px',
                fontSize: 13,
                fontWeight: active ? W.bold : W.medium,
              }}
            >
              {opt.value !== 'all' && getKindIcon(opt.value as ActivityKind, 13)}
              {ko ? opt.labelKo : opt.labelEn}
              {opt.value === 'all' && (
                <span
                  className={active ? 'text-white/70' : 'text-toss-grey-400'}
                  style={{ fontSize: 11, fontWeight: W.semibold }}
                >
                  {filteredItems.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 빈 상태 */}
      {filteredItems.length === 0 && (
        <div className="flex flex-col items-center text-center" style={{ paddingTop: 60 }}>
          <div
            className="flex items-center justify-center rounded-full bg-toss-grey-100 mb-4"
            style={{ width: 64, height: 64 }}
          >
            <Clock size={28} className="text-toss-grey-400" />
          </div>
          <p className="text-toss-grey-500 mb-1" style={{ ...T.t6, fontWeight: W.semibold }}>
            {ko ? '아직 활동 기록이 없어요' : 'No activity yet'}
          </p>
          <p className="text-toss-grey-400" style={T.t7}>
            {ko
              ? '연락처에서 교류 기록을 남겨보세요'
              : 'Start logging interactions with your contacts'}
          </p>
          <button
            onClick={() => navigate('/app/contacts')}
            className="mt-4 flex items-center gap-1 text-toss-blue active:opacity-70"
            style={{ fontSize: 14, fontWeight: W.semibold, minHeight: 44 }}
          >
            {ko ? '인연 목록으로 이동' : 'Go to Contacts'}
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* 타임라인 */}
      {grouped.map((group, gi) => (
        <div key={group.key} style={{ marginBottom: 8 }}>
          {/* 날짜 그룹 헤더 */}
          <div
            className="sticky top-0 z-10 bg-[var(--toss-bg)]"
            style={{ padding: `8px ${PX}px 6px` }}
          >
            <span
              className="text-toss-grey-500"
              style={{ ...T.s12, fontWeight: W.bold }}
            >
              {group.dateLabel}
            </span>
          </div>

          {/* 아이템 목록 */}
          <div style={{ padding: `0 ${PX}px` }}>
            {group.items.map((item, ii) => (
              <TimelineRow
                key={item.id}
                item={item}
                ko={ko}
                isLast={ii === group.items.length - 1}
                onTap={() => navigate(`/app/contact/${item.contactId}`)}
              />
            ))}
          </div>
        </div>
      ))}

      {/* 더 보기 */}
      {hasMore && (
        <div className="flex justify-center" style={{ padding: '16px 0 32px' }}>
          <button
            onClick={loadMore}
            className="flex items-center gap-2 bg-toss-grey-100 text-toss-grey-600 rounded-full active:bg-toss-grey-200 transition-colors"
            style={{ padding: '10px 20px', fontSize: 13, fontWeight: W.semibold }}
          >
            <ArrowDown size={14} />
            {ko
              ? `더 보기 (${filteredItems.length - displayCount}건 남음)`
              : `Load more (${filteredItems.length - displayCount} remaining)`}
          </button>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   요약 카드
   ═══════════════════════════════════════════════ */

function SummaryCard({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
}) {
  return (
    <div
      className="bg-[var(--toss-card-bg)] border border-toss-grey-100 text-center"
      style={{ borderRadius: 14, padding: '14px 8px' }}
    >
      <div className="flex items-center justify-center text-toss-grey-400 mb-1.5">
        {icon}
      </div>
      <p className="text-toss-grey-900" style={{ ...T.t5, fontWeight: W.bold }}>
        {value}
      </p>
      <p className="text-toss-grey-500 mt-0.5" style={{ ...T.s11 }}>
        {label}
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   타임라인 행
   ═══════════════════════════════════════════════ */

function TimelineRow({
  item,
  ko,
  isLast,
  onTap,
}: {
  item: TimelineItem;
  ko: boolean;
  isLast: boolean;
  onTap: () => void;
}) {
  const contact = getContactByIdFromStore(item.contactId);
  const kindColor = getKindColor(item.kind);

  return (
    <button
      onClick={onTap}
      className="w-full flex gap-3 text-left active:bg-toss-grey-50 transition-colors rounded-xl"
      style={{ padding: '10px 4px', minHeight: 60 }}
    >
      {/* 타임라인 인디케이터 */}
      <div className="flex flex-col items-center shrink-0" style={{ width: 36 }}>
        {/* 아이콘 원 */}
        <div
          className="flex items-center justify-center rounded-full text-white shrink-0"
          style={{
            width: 32,
            height: 32,
            backgroundColor: kindColor,
          }}
        >
          {getKindIcon(item.kind, 14)}
        </div>
        {/* 연결선 */}
        {!isLast && (
          <div
            className="flex-1 bg-toss-grey-200"
            style={{ width: 2, marginTop: 4, minHeight: 20 }}
          />
        )}
      </div>

      {/* 내용 */}
      <div className="flex-1 min-w-0" style={{ paddingBottom: isLast ? 0 : 8 }}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {contact && (
              <ContactAvatar
                name={contact.name}
                color={getRelationshipColor(contact.relationship)}
                size={28}
              />
            )}
            <span className="text-toss-grey-900 truncate" style={{ ...T.t7, fontWeight: W.semibold }}>
              {item.contactName}
            </span>
            <span
              className="shrink-0 rounded-full text-white"
              style={{
                fontSize: 10,
                fontWeight: W.semibold,
                padding: '2px 8px',
                backgroundColor: kindColor,
              }}
            >
              {getKindLabel(item.kind, ko ? 'ko' : 'en')}
            </span>
          </div>
          <span
            className="text-toss-grey-400 shrink-0"
            style={{ ...T.s11 }}
          >
            {formatDateShort(item.date, ko ? 'ko' : 'en')}
          </span>
        </div>

        {/* 노트 */}
        {item.note && (
          <p
            className="text-toss-grey-500 mt-1 line-clamp-2"
            style={{ ...T.s12, marginLeft: 36 }}
          >
            {item.note}
          </p>
        )}
      </div>
    </button>
  );
}