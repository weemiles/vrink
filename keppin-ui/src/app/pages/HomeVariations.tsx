import { useState } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import {
  Cake, PhoneOff, Plus, ChevronRight,
  Users, Heart, Gift, Clock,
  ArrowRight,
} from 'lucide-react';
import { RELATIONSHIP_COLORS, CLOSENESS_ORDER } from '../data/contacts';
import {
  useContacts,
  getUpcomingBirthdaysFromStore,
  getContactsNeedingAttentionFromStore,
  getRelationshipColor,
} from '../data/contactsStore';
import { ContactAvatar } from '../components/ContactAvatar';
import { formatBirthday, formatContactGap } from '../components/useFormatters';
import { useLanguage } from '../components/useLanguage';
import { NavigationBar } from '../components/NavigationBar';
import { useMotionConfig, MOTION_DISTANCE } from '../components/useMotionConfig';

/* ─── TDS Typography helper ─── */
const TYPO = {
  t3:  { fontSize: 'var(--typo-3-size)',  lineHeight: 'var(--typo-3-lh)' },   // 22/31
  t4:  { fontSize: 'var(--typo-4-size)',  lineHeight: 'var(--typo-4-lh)' },   // 20/29
  t5:  { fontSize: 'var(--typo-5-size)',  lineHeight: 'var(--typo-5-lh)' },   // 17/25.5
  t6:  { fontSize: 'var(--typo-6-size)',  lineHeight: 'var(--typo-6-lh)' },   // 15/22.5
  t7:  { fontSize: 'var(--typo-7-size)',  lineHeight: 'var(--typo-7-lh)' },   // 13/19.5
  s11: { fontSize: 'var(--typo-sub11-size)', lineHeight: 'var(--typo-sub11-lh)' }, // 14/21
  s12: { fontSize: 'var(--typo-sub12-size)', lineHeight: 'var(--typo-sub12-lh)' }, // 12/18
  s13: { fontSize: 'var(--typo-sub13-size)', lineHeight: 'var(--typo-sub13-lh)' }, // 11/16.5
} as const;

const W = { medium: 500, semibold: 600, bold: 700 } as const;

/* ─── 8pt-grid TDS spacing ─── */
const CARD_RADIUS = 16; // --toss-card-radius
const LIST_CELL_H = 56; // --toss-list-cell-height
const PX = 24; // --toss-safe-area-margin

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

/* ─── 공통 데이터 훅 ─── */
function useHomeData() {
  const contacts = useContacts();
  const upcomingBirthdays = getUpcomingBirthdaysFromStore(60);
  const needAttention = getContactsNeedingAttentionFromStore(14);
  const totalContacts = contacts.length;
  const closeCount = contacts.filter(c => c.closeness === '매우 친함' || c.closeness === '가족').length;
  const closenessStats = CLOSENESS_ORDER.map(cl => ({
    label: cl,
    count: contacts.filter(c => c.closeness === cl).length,
  }));
  const relationshipStats = Object.entries(RELATIONSHIP_COLORS)
    .map(([rel]) => ({
      label: rel,
      count: contacts.filter(c => c.relationship === rel).length,
    }))
    .filter(s => s.count > 0);

  return { contacts, upcomingBirthdays, needAttention, totalContacts, closeCount, closenessStats, relationshipStats };
}

/* ═══════════════════════════════════════
   메인: 6-Variation 스위처
   ═══════════════════════════════════════ */
const VARIANTS = [
  { key: 'A', label: '타이포' },
  { key: 'B', label: '카드' },
  { key: 'C', label: '대시보드' },
  { key: 'D', label: '피드' },
  { key: 'E', label: '컴팩트' },
  { key: 'F', label: '포커스' },
] as const;

export function HomeVariations() {
  const [variant, setVariant] = useState('A');
  const mc = useMotionConfig();

  return (
    <div className="pb-20 bg-toss-bg">
      <NavigationBar title="홈 디자인 Variations" showBack />

      {/* 변형 선택 — 가로 스크롤 칩 */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar" style={{ padding: `12px ${PX}px 16px` }}>
        {VARIANTS.map(v => {
          const active = variant === v.key;
          return (
            <button
              key={v.key}
              onClick={() => setVariant(v.key)}
              className={`shrink-0 transition-colors ${active ? 'bg-toss-blue text-[var(--primary-foreground)]' : 'bg-toss-grey-100 text-toss-grey-600'}`}
              style={{
                ...TYPO.t7,
                fontWeight: active ? W.semibold : W.medium,
                height: 36,
                padding: '0 16px',
                borderRadius: 20,
              }}
            >
              {v.key} · {v.label}
            </button>
          );
        })}
      </div>

      {/* 콘텐츠 */}
      <AnimatePresence mode="wait">
        <motion.div
          key={variant}
          initial={mc.safeAnimate({ opacity: 0, y: MOTION_DISTANCE.micro })}
          animate={mc.safeAnimate({ opacity: 1, y: 0 })}
          exit={mc.safeAnimate({ opacity: 0 })}
          transition={mc.safeTransition('screen')}
        >
          {variant === 'A' && <VariantA />}
          {variant === 'B' && <VariantB />}
          {variant === 'C' && <VariantC />}
          {variant === 'D' && <VariantD />}
          {variant === 'E' && <VariantE />}
          {variant === 'F' && <VariantF />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   공통 하위 컴포넌트 (TDS 준수)
   ═══════════════════════════════════════════════════ */

function SectionHeader({ icon, title, action, onAction }: {
  icon: React.ReactNode; title: string; action?: string; onAction?: () => void;
}) {
  return (
    <div className="flex items-center justify-between" style={{ padding: `0 ${PX}px`, marginBottom: 12 }}>
      <div className="flex items-center gap-2">
        {icon}
        <h2 className="text-toss-grey-900" style={{ ...TYPO.t6, fontWeight: W.bold }}>{title}</h2>
      </div>
      {action && onAction && (
        <button
          onClick={onAction}
          className="flex items-center text-toss-blue active:opacity-60 transition-opacity"
          style={{ ...TYPO.t7, fontWeight: W.medium, minHeight: 44, minWidth: 44, justifyContent: 'flex-end' }}
        >
          {action}
          <ChevronRight size={14} />
        </button>
      )}
    </div>
  );
}

/** 통일된 리스트 행 — minHeight 56px (TDS list-cell-height) */
function ContactRow({ contact, onClick, trailing }: {
  contact: ReturnType<typeof useContacts>[0]; onClick: () => void; trailing?: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 active:bg-toss-grey-50 transition-colors"
      style={{ padding: `0 ${PX}px`, minHeight: LIST_CELL_H }}
    >
      <ContactAvatar name={contact.name} color={getRelationshipColor(contact.relationship)} size={40} />
      <div className="flex-1 min-w-0 text-left">
        <div className="flex items-center gap-2">
          <span className="text-toss-grey-900 truncate" style={{ ...TYPO.t6, fontWeight: W.semibold }}>{contact.name}</span>
          <span className="text-toss-grey-400" style={TYPO.s12}>{contact.relationship}</span>
        </div>
      </div>
      {trailing}
    </button>
  );
}

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

/* ═══════════════════════════════════════════════════
   A · 타이포 히어로 — 큰 숫자 + 최소 장식
   ═══════════════════════════════════════════════════ */
function VariantA() {
  const nav = useNavigate();
  const { lang } = useLanguage();
  const { upcomingBirthdays, needAttention, totalContacts, relationshipStats } = useHomeData();

  return (
    <div>
      {/* 인사말 + 숫자 히어로 */}
      <div style={{ padding: `8px ${PX}px 24px` }}>
        <p className="text-toss-grey-500" style={{ ...TYPO.t7, marginBottom: 4 }}>{getGreeting(lang)}</p>
        <h1 className="text-toss-grey-900" style={{ ...TYPO.t3, fontWeight: W.bold }}>
          {lang === 'en'
            ? <>{totalContacts} <span className="text-toss-blue">connections</span></>
            : <>소중한 인연 <span className="text-toss-blue">{totalContacts}</span>명</>
          }
        </h1>
      </div>

      {/* 관계 칩 */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar" style={{ padding: `0 ${PX}px 24px` }}>
        {relationshipStats.map(s => (
          <div
            key={s.label}
            className="shrink-0 flex items-center gap-1 bg-toss-grey-100"
            style={{ ...TYPO.t7, padding: '6px 12px', borderRadius: 16 }}
          >
            <span className="text-toss-grey-500">{s.label}</span>
            <span className="text-toss-grey-900" style={{ fontWeight: W.bold }}>{s.count}</span>
          </div>
        ))}
      </div>

      {/* 생일 */}
      {upcomingBirthdays.length > 0 && (
        <section style={{ marginBottom: 8 }}>
          <SectionHeader
            icon={<Cake size={16} className="text-toss-red" />}
            title={lang === 'en' ? 'Upcoming Birthdays' : '다가오는 생일'}
            action={lang === 'en' ? 'See all' : '전체보기'}
            onAction={() => nav('/app/calendar')}
          />
          {upcomingBirthdays.slice(0, 4).map(c => (
            <ContactRow key={c.id} contact={c} onClick={() => nav(`/app/contact/${c.id}`)}
              trailing={<DdayBadge dday={c.birthdayDday} />}
            />
          ))}
        </section>
      )}

      {/* 연락 필요 */}
      {needAttention.length > 0 && (
        <section style={{ marginBottom: 8 }}>
          <SectionHeader
            icon={<PhoneOff size={16} className="text-toss-grey-500" />}
            title={lang === 'en' ? 'Needs Attention' : '연락이 뜸한 사람'}
            action={lang === 'en' ? 'See all' : '전체보기'}
            onAction={() => nav('/app/contacts')}
          />
          {needAttention.slice(0, 3).map(c => (
            <ContactRow key={c.id} contact={c} onClick={() => nav(`/app/contact/${c.id}`)}
              trailing={
                <span className="text-toss-grey-500 shrink-0" style={{ ...TYPO.s12, fontWeight: W.medium }}>
                  {c.contactGap}{lang === 'en' ? 'd' : '일'}
                </span>
              }
            />
          ))}
        </section>
      )}

      {/* CTA */}
      <div style={{ padding: `8px ${PX}px 24px` }}>
        <button
          onClick={() => nav('/app/contacts/add')}
          className="w-full flex items-center justify-center gap-2 bg-toss-blue text-[var(--primary-foreground)] active:bg-toss-blue-600 transition-colors"
          style={{ ...TYPO.t6, fontWeight: W.semibold, height: 48, borderRadius: 12 }}
        >
          <Plus size={18} />
          {lang === 'en' ? 'Add Contact' : '새 인연 추가'}
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   B · 카드 — 통계 카드 + 가로 스크롤 생일 카드
   ═══════════════════════════════════════════════════ */
function VariantB() {
  const nav = useNavigate();
  const { lang } = useLanguage();
  const { upcomingBirthdays, needAttention, totalContacts, closeCount } = useHomeData();
  const birthdaySoon = upcomingBirthdays.filter(c => c.birthdayDday <= 30).length;

  return (
    <div>
      {/* Header */}
      <div style={{ padding: `8px ${PX}px 16px` }}>
        <p className="text-toss-grey-500" style={TYPO.t7}>{getGreeting(lang)}</p>
        <h1 className="text-toss-grey-900" style={{ ...TYPO.t4, fontWeight: W.bold, marginTop: 4 }}>keepin</h1>
      </div>

      {/* 통계 3카드 — §2.2 summary-stats-max: 3 */}
      <div className="grid grid-cols-3 gap-2" style={{ padding: `0 ${PX}px`, marginBottom: 24 }}>
        {([
          { label: lang === 'en' ? 'Total' : '전체', value: totalContacts, Icon: Users, cls: 'bg-toss-grey-100 text-toss-grey-700' },
          { label: lang === 'en' ? 'Close' : '가까운', value: closeCount, Icon: Heart, cls: 'bg-toss-grey-100 text-toss-grey-700' },
          { label: lang === 'en' ? 'Birthday' : '생일', value: birthdaySoon, Icon: Gift, cls: 'bg-toss-grey-100 text-toss-grey-700' },
        ] as const).map(s => (
          <div
            key={s.label}
            className="bg-toss-bg border border-toss-border-default flex flex-col items-center"
            style={{ padding: '12px 8px', borderRadius: CARD_RADIUS }}
          >
            <div className={`flex items-center justify-center ${s.cls}`} style={{ width: 32, height: 32, borderRadius: 8, marginBottom: 8 }}>
              <s.Icon size={16} />
            </div>
            <span className="text-toss-grey-900" style={{ ...TYPO.t4, fontWeight: W.bold }}>{s.value}</span>
            <span className="text-toss-grey-500" style={{ ...TYPO.s13, marginTop: 2 }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* 생일 가로 스크롤 */}
      {upcomingBirthdays.length > 0 && (
        <section style={{ marginBottom: 24 }}>
          <SectionHeader icon={<Cake size={16} className="text-toss-red" />} title={lang === 'en' ? 'Birthdays' : '다가오는 생일'} />
          <div className="flex gap-3 overflow-x-auto no-scrollbar" style={{ padding: `0 ${PX}px 4px` }}>
            {upcomingBirthdays.slice(0, 8).map(c => (
              <button
                key={c.id}
                onClick={() => nav(`/app/contact/${c.id}`)}
                className="shrink-0 bg-toss-bg border border-toss-border-default flex flex-col items-center active:bg-toss-grey-50 transition-colors"
                style={{ width: 104, padding: '16px 8px', borderRadius: CARD_RADIUS }}
              >
                <ContactAvatar name={c.name} color={getRelationshipColor(c.relationship)} size={44} />
                <span className="text-toss-grey-900 mt-2 truncate w-full text-center" style={{ ...TYPO.s11, fontWeight: W.semibold }}>{c.name}</span>
                <span className="text-toss-grey-500" style={{ ...TYPO.s12, marginTop: 2 }}>{formatBirthday(c.birthday)}</span>
                <div style={{ marginTop: 8 }}>
                  <DdayBadge dday={c.birthdayDday} />
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* 연락 필요 카드 */}
      {needAttention.length > 0 && (
        <section style={{ padding: `0 ${PX}px`, marginBottom: 24 }}>
          <SectionHeader icon={<Clock size={16} className="text-toss-orange" />} title={lang === 'en' ? 'Reconnect' : '다시 연락해볼까요?'} />
          <div className="bg-toss-bg border border-toss-border-default overflow-hidden" style={{ borderRadius: CARD_RADIUS }}>
            {needAttention.slice(0, 3).map((c, idx) => (
              <button
                key={c.id}
                onClick={() => nav(`/app/contact/${c.id}`)}
                className={`w-full flex items-center gap-3 active:bg-toss-grey-50 transition-colors ${idx > 0 ? 'border-t border-toss-border-default' : ''}`}
                style={{ padding: '12px 16px', minHeight: LIST_CELL_H }}
              >
                <ContactAvatar name={c.name} color={getRelationshipColor(c.relationship)} size={40} />
                <div className="flex-1 min-w-0 text-left">
                  <span className="text-toss-grey-900 block truncate" style={{ ...TYPO.t6, fontWeight: W.semibold }}>{c.name}</span>
                  <span className="text-toss-grey-500" style={TYPO.s12}>
                    {lang === 'en' ? `${c.contactGap} days ago` : `마지막 연락 ${formatContactGap(c.contactGap)}`}
                  </span>
                </div>
                <ChevronRight size={16} className="text-toss-grey-300 shrink-0" />
              </button>
            ))}
          </div>
        </section>
      )}

      {/* CTA 2열 */}
      <div className="grid grid-cols-2 gap-2" style={{ padding: `0 ${PX}px 24px` }}>
        <button
          onClick={() => nav('/app/contacts/add')}
          className="bg-toss-blue text-[var(--primary-foreground)] flex flex-col items-start active:bg-toss-blue-600 transition-colors"
          style={{ padding: 16, borderRadius: CARD_RADIUS }}
        >
          <Plus size={20} style={{ marginBottom: 8 }} />
          <span style={{ ...TYPO.s11, fontWeight: W.semibold }}>{lang === 'en' ? 'Add Contact' : '인연 추가'}</span>
        </button>
        <button
          onClick={() => nav('/app/contacts')}
          className="bg-toss-grey-100 text-toss-grey-900 flex flex-col items-start active:bg-toss-grey-200 transition-colors"
          style={{ padding: 16, borderRadius: CARD_RADIUS }}
        >
          <Users size={20} className="text-toss-grey-600" style={{ marginBottom: 8 }} />
          <span style={{ ...TYPO.s11, fontWeight: W.semibold }}>{lang === 'en' ? 'View All' : '전체 목록'}</span>
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   C · 대시보드 — 링 차트 + 바 분포 + 벤토 그리드
   ═══════════════════════════════════════════════════ */
function VariantC() {
  const nav = useNavigate();
  const { lang } = useLanguage();
  const { contacts, upcomingBirthdays, needAttention, totalContacts, closeCount, closenessStats } = useHomeData();
  const avgGap = contacts.length > 0 ? Math.round(contacts.reduce((s, c) => s + c.contactGap, 0) / contacts.length) : 0;
  const maxCl = Math.max(...closenessStats.map(c => c.count), 1);

  return (
    <div>
      <div style={{ padding: `8px ${PX}px 24px` }}>
        <h1 className="text-toss-grey-900" style={{ ...TYPO.t4, fontWeight: W.bold }}>
          {lang === 'en' ? 'Dashboard' : '대시보드'}
        </h1>
      </div>

      {/* 링 + 수치 */}
      <div className="flex items-center gap-6" style={{ padding: `0 ${PX}px`, marginBottom: 24 }}>
        <div className="relative shrink-0" style={{ width: 88, height: 88 }}>
          <svg viewBox="0 0 88 88" className="w-full h-full" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="44" cy="44" r="36" fill="none" className="stroke-toss-grey-100" strokeWidth="8" />
            <circle
              cx="44" cy="44" r="36"
              fill="none"
              className="stroke-toss-blue"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${(closeCount / Math.max(totalContacts, 1)) * 226} 226`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-toss-blue" style={{ ...TYPO.t4, fontWeight: W.bold }}>{totalContacts}</span>
            <span className="text-toss-grey-500" style={TYPO.s13}>{lang === 'en' ? 'contacts' : '인연'}</span>
          </div>
        </div>
        <div className="flex-1 space-y-3">
          {([
            { label: lang === 'en' ? 'Close friends' : '가까운 사람', value: `${closeCount}`, colorCls: 'bg-toss-blue' },
            { label: lang === 'en' ? 'Avg. gap' : '평균 연락 주기', value: `${avgGap}${lang === 'en' ? 'd' : '일'}`, colorCls: 'bg-toss-orange' },
          ] as const).map(item => (
            <div key={item.label} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`${item.colorCls}`} style={{ width: 8, height: 8, borderRadius: 4 }} />
                <span className="text-toss-grey-600" style={TYPO.s12}>{item.label}</span>
              </div>
              <span className="text-toss-grey-900" style={{ ...TYPO.s11, fontWeight: W.bold }}>{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 친밀도 분포 바 */}
      <div style={{ padding: `0 ${PX}px`, marginBottom: 24 }}>
        <div className="bg-toss-bg border border-toss-border-default" style={{ padding: 16, borderRadius: CARD_RADIUS }}>
          <h3 className="text-toss-grey-900" style={{ ...TYPO.s11, fontWeight: W.bold, marginBottom: 12 }}>
            {lang === 'en' ? 'Closeness Distribution' : '친밀도 분포'}
          </h3>
          <div className="flex gap-1 items-end" style={{ height: 56 }}>
            {closenessStats.map(stat => {
              const pct = stat.count / maxCl;
              return (
                <div key={stat.label} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-toss-grey-600" style={{ ...TYPO.s13, fontWeight: W.semibold }}>{stat.count || ''}</span>
                  <div
                    className="w-full bg-toss-blue"
                    style={{ height: Math.max(pct * 40, stat.count > 0 ? 4 : 2), borderRadius: 3, opacity: 0.2 + pct * 0.8 }}
                  />
                  <span className="text-toss-grey-500 truncate w-full text-center" style={TYPO.s13}>{stat.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 벤토 그리드 — 생일 + 연락필요 + 추가 */}
      <div className="grid grid-cols-2 gap-2" style={{ padding: `0 ${PX}px`, marginBottom: 24 }}>
        {/* 생일 카드 (2열 합침) */}
        <button
          onClick={() => nav('/app/calendar')}
          className="col-span-2 bg-toss-bg border border-toss-border-default active:bg-toss-grey-50 transition-colors text-left"
          style={{ padding: 16, borderRadius: CARD_RADIUS }}
        >
          <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
            <div className="flex items-center gap-2">
              <Cake size={16} className="text-toss-red" />
              <span className="text-toss-grey-900" style={{ ...TYPO.s11, fontWeight: W.bold }}>
                {lang === 'en' ? 'Upcoming Birthdays' : '다가오는 생일'}
              </span>
            </div>
            <ChevronRight size={16} className="text-toss-grey-300" />
          </div>
          {upcomingBirthdays.length > 0 ? (
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {upcomingBirthdays.slice(0, 4).map((c, i) => (
                  <div key={c.id} style={{ zIndex: 4 - i }}>
                    <ContactAvatar name={c.name} color={getRelationshipColor(c.relationship)} size={32} />
                  </div>
                ))}
                {upcomingBirthdays.length > 4 && (
                  <div className="flex items-center justify-center bg-toss-grey-200 rounded-full" style={{ width: 32, height: 32 }}>
                    <span className="text-toss-grey-600" style={TYPO.s13}>+{upcomingBirthdays.length - 4}</span>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-toss-grey-900 block truncate" style={{ ...TYPO.t7, fontWeight: W.semibold }}>
                  {upcomingBirthdays[0].name}
                  {upcomingBirthdays.length > 1 && (lang === 'en' ? ` +${upcomingBirthdays.length - 1}` : ` 외 ${upcomingBirthdays.length - 1}명`)}
                </span>
                <span className="text-toss-grey-500" style={TYPO.s12}>
                  D-{upcomingBirthdays[0].birthdayDday}
                </span>
              </div>
            </div>
          ) : (
            <span className="text-toss-grey-400" style={TYPO.t7}>{lang === 'en' ? 'No upcoming' : '예정 없음'}</span>
          )}
        </button>

        {/* 연락 필요 타일 */}
        <button
          onClick={() => nav('/app/contacts')}
          className="bg-toss-bg border border-toss-border-default active:bg-toss-grey-50 transition-colors text-left flex flex-col"
          style={{ padding: 16, borderRadius: CARD_RADIUS }}
        >
          <div className="bg-toss-grey-100 flex items-center justify-center" style={{ width: 32, height: 32, borderRadius: 8, marginBottom: 8 }}>
            <PhoneOff size={16} className="text-toss-grey-700" />
          </div>
          <span className="text-toss-grey-900" style={{ ...TYPO.t3, fontWeight: W.bold }}>{needAttention.length}</span>
          <span className="text-toss-grey-500" style={{ ...TYPO.s13, marginTop: 4 }}>
            {lang === 'en' ? 'Need attention' : '연락 필요'}
          </span>
        </button>

        {/* 추가 CTA 타일 */}
        <button
          onClick={() => nav('/app/contacts/add')}
          className="bg-toss-blue text-[var(--primary-foreground)] active:bg-toss-blue-600 transition-colors text-left flex flex-col"
          style={{ padding: 16, borderRadius: CARD_RADIUS }}
        >
          <div className="flex items-center justify-center" style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.2)', marginBottom: 8 }}>
            <Plus size={16} />
          </div>
          <span style={{ ...TYPO.s11, fontWeight: W.bold }}>{lang === 'en' ? 'Add New' : '인연 추가'}</span>
          <span style={{ ...TYPO.s13, opacity: 0.7, marginTop: 4 }}>{lang === 'en' ? 'New contact' : '새 인연'}</span>
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   D · 피드 — 카드 분리형 타임라인, 섹션별 카드
   ═══════════════════════════════════════════════════ */
function VariantD() {
  const nav = useNavigate();
  const { lang } = useLanguage();
  const { upcomingBirthdays, needAttention, totalContacts, relationshipStats } = useHomeData();

  return (
    <div>
      {/* 상단 요약 */}
      <div style={{ padding: `8px ${PX}px 24px` }}>
        <p className="text-toss-grey-500" style={{ ...TYPO.t7, marginBottom: 4 }}>{getGreeting(lang)}</p>
        <div className="flex items-baseline gap-2">
          <span className="text-toss-grey-900" style={{ ...TYPO.t3, fontWeight: W.bold }}>{totalContacts}</span>
          <span className="text-toss-grey-500" style={{ ...TYPO.t6, fontWeight: W.medium }}>{lang === 'en' ? 'connections' : '인연'}</span>
        </div>
        {/* 인라인 관계 태그 */}
        <div className="flex gap-3 mt-3">
          {relationshipStats.slice(0, 4).map(s => (
            <span key={s.label} className="text-toss-grey-500" style={TYPO.s12}>
              {s.label} <span className="text-toss-grey-900" style={{ fontWeight: W.semibold }}>{s.count}</span>
            </span>
          ))}
        </div>
      </div>

      {/* 생일 피드 카드 */}
      {upcomingBirthdays.length > 0 && (
        <div style={{ padding: `0 ${PX}px`, marginBottom: 16 }}>
          <div className="bg-toss-bg border border-toss-border-default overflow-hidden" style={{ borderRadius: CARD_RADIUS }}>
            <div className="flex items-center justify-between" style={{ padding: '16px 16px 12px' }}>
              <div className="flex items-center gap-2">
                <Cake size={16} className="text-toss-red" />
                <span className="text-toss-grey-900" style={{ ...TYPO.t6, fontWeight: W.bold }}>
                  {lang === 'en' ? 'Upcoming Birthdays' : '다가오는 생일'}
                </span>
              </div>
              <button onClick={() => nav('/app/calendar')} className="text-toss-blue" style={{ ...TYPO.t7, fontWeight: W.medium, minHeight: 44, display: 'flex', alignItems: 'center' }}>
                {lang === 'en' ? 'All' : '전체'}
                <ChevronRight size={14} />
              </button>
            </div>
            {upcomingBirthdays.slice(0, 3).map((c, idx) => (
              <button
                key={c.id}
                onClick={() => nav(`/app/contact/${c.id}`)}
                className={`w-full flex items-center gap-3 active:bg-toss-grey-50 transition-colors ${idx > 0 ? 'border-t border-toss-grey-100' : ''}`}
                style={{ padding: '0 16px', minHeight: LIST_CELL_H }}
              >
                <ContactAvatar name={c.name} color={getRelationshipColor(c.relationship)} size={40} />
                <div className="flex-1 min-w-0 text-left">
                  <span className="text-toss-grey-900 truncate block" style={{ ...TYPO.t6, fontWeight: W.semibold }}>{c.name}</span>
                  <span className="text-toss-grey-500" style={TYPO.s12}>{formatBirthday(c.birthday)}</span>
                </div>
                <DdayBadge dday={c.birthdayDday} />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 연락 필요 피드 카드 */}
      {needAttention.length > 0 && (
        <div style={{ padding: `0 ${PX}px`, marginBottom: 16 }}>
          <div className="bg-toss-bg border border-toss-border-default overflow-hidden" style={{ borderRadius: CARD_RADIUS }}>
            <div className="flex items-center justify-between" style={{ padding: '16px 16px 12px' }}>
              <div className="flex items-center gap-2">
                <PhoneOff size={16} className="text-toss-grey-500" />
                <span className="text-toss-grey-900" style={{ ...TYPO.t6, fontWeight: W.bold }}>
                  {lang === 'en' ? 'Needs Attention' : '연락이 뜸한 사람'}
                </span>
              </div>
              <button onClick={() => nav('/app/contacts')} className="text-toss-blue" style={{ ...TYPO.t7, fontWeight: W.medium, minHeight: 44, display: 'flex', alignItems: 'center' }}>
                {lang === 'en' ? 'All' : '전체'}
                <ChevronRight size={14} />
              </button>
            </div>
            {needAttention.slice(0, 3).map((c, idx) => (
              <button
                key={c.id}
                onClick={() => nav(`/app/contact/${c.id}`)}
                className={`w-full flex items-center gap-3 active:bg-toss-grey-50 transition-colors ${idx > 0 ? 'border-t border-toss-grey-100' : ''}`}
                style={{ padding: '0 16px', minHeight: LIST_CELL_H }}
              >
                <ContactAvatar name={c.name} color={getRelationshipColor(c.relationship)} size={40} />
                <div className="flex-1 min-w-0 text-left">
                  <span className="text-toss-grey-900 truncate block" style={{ ...TYPO.t6, fontWeight: W.semibold }}>{c.name}</span>
                  <span className="text-toss-grey-500" style={TYPO.s12}>
                    {lang === 'en' ? `Last contact ${c.contactGap}d ago` : `마지막 연락 ${formatContactGap(c.contactGap)}`}
                  </span>
                </div>
                <span className="text-toss-grey-500 shrink-0" style={{ ...TYPO.s12, fontWeight: W.semibold }}>
                  {c.contactGap}{lang === 'en' ? 'd' : '일'}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* CTA */}
      <div style={{ padding: `8px ${PX}px 24px` }}>
        <button
          onClick={() => nav('/app/contacts/add')}
          className="w-full flex items-center justify-center gap-2 bg-toss-blue text-[var(--primary-foreground)] active:bg-toss-blue-600 transition-colors"
          style={{ ...TYPO.t6, fontWeight: W.semibold, height: 48, borderRadius: 12 }}
        >
          <Plus size={18} />
          {lang === 'en' ? 'Add Contact' : '새 인연 추가'}
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   E · 컴팩트 — 고밀도, 수치 중심
   ═══════════════════════════════════════════════════ */
function VariantE() {
  const nav = useNavigate();
  const { lang } = useLanguage();
  const { contacts, upcomingBirthdays, needAttention, totalContacts, closeCount, relationshipStats } = useHomeData();
  const avgGap = contacts.length > 0 ? Math.round(contacts.reduce((s, c) => s + c.contactGap, 0) / contacts.length) : 0;

  return (
    <div>
      {/* 숫자 요약 행 */}
      <div className="flex items-center" style={{ padding: `8px ${PX}px 20px`, gap: 24 }}>
        <div>
          <span className="text-toss-grey-500 block" style={TYPO.s12}>{lang === 'en' ? 'Contacts' : '전체'}</span>
          <span className="text-toss-grey-900" style={{ ...TYPO.t3, fontWeight: W.bold }}>{totalContacts}</span>
        </div>
        <div className="bg-toss-grey-200" style={{ width: 1, height: 32 }} />
        <div>
          <span className="text-toss-grey-500 block" style={TYPO.s12}>{lang === 'en' ? 'Close' : '가까운'}</span>
          <span className="text-toss-blue" style={{ ...TYPO.t3, fontWeight: W.bold }}>{closeCount}</span>
        </div>
        <div className="bg-toss-grey-200" style={{ width: 1, height: 32 }} />
        <div>
          <span className="text-toss-grey-500 block" style={TYPO.s12}>{lang === 'en' ? 'Avg gap' : '평균 주기'}</span>
          <span className="text-toss-grey-900" style={{ ...TYPO.t3, fontWeight: W.bold }}>{avgGap}<span style={TYPO.t7}>{lang === 'en' ? 'd' : '일'}</span></span>
        </div>
      </div>

      {/* 관계별 미니 진행바 */}
      <div style={{ padding: `0 ${PX}px`, marginBottom: 24 }}>
        <div className="flex gap-1" style={{ height: 4, borderRadius: 2, overflow: 'hidden' }}>
          {relationshipStats.map(s => (
            <div
              key={s.label}
              className="bg-toss-blue"
              style={{ flex: s.count, opacity: 0.3 + (s.count / totalContacts) * 0.7, borderRadius: 2 }}
            />
          ))}
        </div>
        <div className="flex gap-3 mt-2">
          {relationshipStats.map(s => (
            <span key={s.label} className="text-toss-grey-500" style={TYPO.s13}>
              {s.label} {s.count}
            </span>
          ))}
        </div>
      </div>

      {/* 구분선 */}
      <div className="bg-toss-grey-100" style={{ height: 8 }} />

      {/* 생일 섹션 */}
      {upcomingBirthdays.length > 0 && (
        <section>
          <div style={{ padding: `16px ${PX}px 0` }}>
            <SectionHeader icon={<Cake size={16} className="text-toss-red" />} title={lang === 'en' ? 'Birthdays' : '다가오는 생일'} action={lang === 'en' ? 'All' : '전체'} onAction={() => nav('/app/calendar')} />
          </div>
          {upcomingBirthdays.slice(0, 3).map(c => (
            <ContactRow key={c.id} contact={c} onClick={() => nav(`/app/contact/${c.id}`)} trailing={<DdayBadge dday={c.birthdayDday} />} />
          ))}
          <div className="bg-toss-grey-100" style={{ height: 8 }} />
        </section>
      )}

      {/* 연락 필요 섹션 */}
      {needAttention.length > 0 && (
        <section>
          <div style={{ padding: `16px ${PX}px 0` }}>
            <SectionHeader icon={<PhoneOff size={16} className="text-toss-grey-500" />} title={lang === 'en' ? 'Needs Attention' : '연락 필요'} action={lang === 'en' ? 'All' : '전체'} onAction={() => nav('/app/contacts')} />
          </div>
          {needAttention.slice(0, 3).map(c => (
            <ContactRow key={c.id} contact={c} onClick={() => nav(`/app/contact/${c.id}`)} trailing={
              <span className="text-toss-grey-500 shrink-0" style={{ ...TYPO.s12, fontWeight: W.medium }}>{c.contactGap}{lang === 'en' ? 'd' : '일'}</span>
            } />
          ))}
        </section>
      )}

      {/* 플로팅 CTA 스타일 */}
      <div style={{ padding: `24px ${PX}px` }}>
        <button
          onClick={() => nav('/app/contacts/add')}
          className="w-full flex items-center justify-center gap-2 bg-toss-blue text-[var(--primary-foreground)] active:bg-toss-blue-600 transition-colors"
          style={{ ...TYPO.t6, fontWeight: W.semibold, height: 48, borderRadius: 12 }}
        >
          <Plus size={18} />
          {lang === 'en' ? 'Add Contact' : '인연 추가'}
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   F · 포커스
   ═══════════════════════════════════════════════════ */
function VariantF() {
  const nav = useNavigate();
  const { lang } = useLanguage();
  const { upcomingBirthdays, needAttention, totalContacts } = useHomeData();
  const mc = useMotionConfig();

  const spotlightContact = upcomingBirthdays[0] || needAttention[0] || null;
  const isBirthday = !!upcomingBirthdays[0];

  return (
    <div>
      {/* 타이포 인트로 */}
      <div style={{ padding: `8px ${PX}px 32px` }}>
        <p className="text-toss-grey-500" style={{ ...TYPO.t7, marginBottom: 4 }}>{getGreeting(lang)}</p>
        <h1 className="text-toss-grey-900" style={{ ...TYPO.t3, fontWeight: W.bold }}>
          {lang === 'en' ? `${totalContacts} connections` : `${totalContacts}명의 인연`}
        </h1>
      </div>

      {/* 스포트라이트 카드 — 가장 중요한 1명 */}
      {spotlightContact && (
        <motion.div
          initial={mc.safeAnimate({ opacity: 0, y: MOTION_DISTANCE.micro })}
          animate={mc.safeAnimate({ opacity: 1, y: 0 })}
          transition={mc.safeTransition('screen')}
          style={{ padding: `0 ${PX}px`, marginBottom: 32 }}
        >
          <button
            onClick={() => nav(`/app/contact/${spotlightContact.id}`)}
            className="w-full bg-toss-bg border border-toss-border-default active:bg-toss-grey-50 transition-colors text-left"
            style={{ padding: 24, borderRadius: CARD_RADIUS }}
          >
            <div className="flex items-center gap-4" style={{ marginBottom: 16 }}>
              <ContactAvatar name={spotlightContact.name} color={getRelationshipColor(spotlightContact.relationship)} size={56} />
              <div>
                <span className="text-toss-grey-900 block" style={{ ...TYPO.t5, fontWeight: W.bold }}>{spotlightContact.name}</span>
                <span className="text-toss-grey-500" style={TYPO.t7}>{spotlightContact.relationship}</span>
              </div>
            </div>
            {isBirthday ? (
              <div className="flex items-center justify-between bg-toss-grey-100" style={{ padding: '12px 16px', borderRadius: 12 }}>
                <div className="flex items-center gap-2">
                  <Cake size={16} className="text-toss-grey-600" />
                  <span className="text-toss-grey-900" style={{ ...TYPO.s11, fontWeight: W.semibold }}>
                    {formatBirthday(spotlightContact.birthday)}
                  </span>
                </div>
                <DdayBadge dday={spotlightContact.birthdayDday} />
              </div>
            ) : (
              <div className="flex items-center justify-between bg-toss-grey-100" style={{ padding: '12px 16px', borderRadius: 12 }}>
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-toss-grey-600" />
                  <span className="text-toss-grey-900" style={{ ...TYPO.s11, fontWeight: W.semibold }}>
                    {lang === 'en' ? `Last contact ${spotlightContact.contactGap}d ago` : `마지막 연락 ${formatContactGap(spotlightContact.contactGap)}`}
                  </span>
                </div>
              </div>
            )}
          </button>
        </motion.div>
      )}

      {/* 빠른 요약 — 나머지 목록 미리보기 */}
      <div style={{ padding: `0 ${PX}px`, marginBottom: 32 }}>
        {upcomingBirthdays.length > 1 && (
          <button
            onClick={() => nav('/app/calendar')}
            className="w-full flex items-center justify-between active:bg-toss-grey-50 transition-colors"
            style={{ minHeight: LIST_CELL_H, paddingTop: 8, paddingBottom: 8 }}
          >
            <div className="flex items-center gap-3">
              <div className="bg-toss-grey-100 flex items-center justify-center" style={{ width: 40, height: 40, borderRadius: 12 }}>
                <Cake size={18} className="text-toss-grey-600" />
              </div>
              <div className="text-left">
                <span className="text-toss-grey-900 block" style={{ ...TYPO.t6, fontWeight: W.semibold }}>
                  {lang === 'en' ? `${upcomingBirthdays.length - 1} more birthdays` : `생일 ${upcomingBirthdays.length - 1}명 더`}
                </span>
                <span className="text-toss-grey-500" style={TYPO.s12}>
                  {lang === 'en' ? 'Next 60 days' : '60일 이내'}
                </span>
              </div>
            </div>
            <ArrowRight size={16} className="text-toss-grey-300" />
          </button>
        )}

        {needAttention.length > (isBirthday ? 0 : 1) && (
          <button
            onClick={() => nav('/app/contacts')}
            className="w-full flex items-center justify-between active:bg-toss-grey-50 transition-colors"
            style={{ minHeight: LIST_CELL_H, paddingTop: 8, paddingBottom: 8 }}
          >
            <div className="flex items-center gap-3">
              <div className="bg-toss-grey-100 flex items-center justify-center" style={{ width: 40, height: 40, borderRadius: 12 }}>
                <PhoneOff size={18} className="text-toss-grey-600" />
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
          onClick={() => nav('/app/contacts')}
          className="w-full flex items-center justify-between active:bg-toss-grey-50 transition-colors"
          style={{ minHeight: LIST_CELL_H, paddingTop: 8, paddingBottom: 8 }}
        >
          <div className="flex items-center gap-3">
            <div className="bg-toss-blue-50 flex items-center justify-center" style={{ width: 40, height: 40, borderRadius: 12 }}>
              <Users size={18} className="text-toss-blue" />
            </div>
            <div className="text-left">
              <span className="text-toss-grey-900 block" style={{ ...TYPO.t6, fontWeight: W.semibold }}>
                {lang === 'en' ? 'All Contacts' : '전체 인연 목록'}
              </span>
              <span className="text-toss-grey-500" style={TYPO.s12}>
                {totalContacts}{lang === 'en' ? ' people' : '명'}
              </span>
            </div>
          </div>
          <ArrowRight size={16} className="text-toss-grey-300" />
        </button>
      </div>

      {/* CTA */}
      <div style={{ padding: `0 ${PX}px 24px` }}>
        <button
          onClick={() => nav('/app/contacts/add')}
          className="w-full flex items-center justify-center gap-2 bg-toss-blue text-[var(--primary-foreground)] active:bg-toss-blue-600 transition-colors"
          style={{ ...TYPO.t6, fontWeight: W.semibold, height: 48, borderRadius: 12 }}
        >
          <Plus size={18} />
          {lang === 'en' ? 'Add New Contact' : '새 인연 추가하기'}
        </button>
      </div>
    </div>
  );
}