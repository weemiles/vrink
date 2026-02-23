import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Calendar, ChevronDown, PartyPopper } from 'lucide-react';
import { type Contact } from '../data/contacts';
import {
  useContacts,
  getUpcomingBirthdaysFromStore,
  getRelationshipColor,
} from '../data/contactsStore';
import { ContactAvatar } from '../components/ContactAvatar';
import { ContactSkeleton } from '../components/LoadingSpinner';
import { SegmentedControl } from '../components/SegmentedControl';
import { Result } from '../components/Result';
import { useDelayedLoading } from '../components/useDebounce';
import { useAnalytics } from '../components/useAnalytics';
import { formatBirthday } from '../components/useFormatters';
import { useMotionConfig, MOTION_DISTANCE } from '../components/useMotionConfig';
import {
  type NationalHoliday,
  buildNotifications,
  NotificationBellButton,
  NotificationPanel,
} from '../components/NotificationPanel';
import { useDocumentTitle } from '../components/useDocumentTitle';

type ViewMode = 'calendar' | 'list';
type HolidayCountry = 'kr' | 'us';

/* ─── 캘린더 유틸 ─── */
const DAYS = ['일', '월', '화', '수', '목', '금', '토'];
const MONTHS = [
  '1월', '2월', '3월', '4월', '5월', '6월',
  '7월', '8월', '9월', '10월', '11월', '12',
];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

/* ═══════════════════════════════════════════════
   나라별 공휴일 데이터
   ═══════════════════════════════════════════════ */
const KOREA_HOLIDAYS: NationalHoliday[] = [
  // 고정 양력
  { name: '신정', month: 1, day: 1 },
  { name: '삼일절', month: 3, day: 1 },
  { name: '어린이날', month: 5, day: 5 },
  { name: '현충일', month: 6, day: 6 },
  { name: '광복절', month: 8, day: 15 },
  { name: '개천절', month: 10, day: 3 },
  { name: '한글날', month: 10, day: 9 },
  { name: '크리스마스', month: 12, day: 25 },
  // 2025 음력 기반
  { name: '설날 연휴', month: 1, day: 28, year: 2025 },
  { name: '설날', month: 1, day: 29, year: 2025 },
  { name: '설날 연휴', month: 1, day: 30, year: 2025 },
  { name: '부처님 오신 날', month: 5, day: 5, year: 2025 },
  { name: '추석 연휴', month: 10, day: 5, year: 2025 },
  { name: '추석', month: 10, day: 6, year: 2025 },
  { name: '추석 연휴', month: 10, day: 7, year: 2025 },
  // 2026 음력 기반
  { name: '설날 연휴', month: 2, day: 16, year: 2026 },
  { name: '설날', month: 2, day: 17, year: 2026 },
  { name: '설날 연휴', month: 2, day: 18, year: 2026 },
  { name: '부처님 오신 날', month: 5, day: 24, year: 2026 },
  { name: '추석 연휴', month: 9, day: 24, year: 2026 },
  { name: '추석', month: 9, day: 25, year: 2026 },
  { name: '추석 연휴', month: 9, day: 26, year: 2026 },
  // 2027 음력 기반
  { name: '설날 연휴', month: 2, day: 5, year: 2027 },
  { name: '설날', month: 2, day: 6, year: 2027 },
  { name: '설날 연휴', month: 2, day: 7, year: 2027 },
  { name: '부처님 오신 날', month: 5, day: 13, year: 2027 },
  { name: '추석 연휴', month: 9, day: 14, year: 2027 },
  { name: '추석', month: 9, day: 15, year: 2027 },
  { name: '추석 연휴', month: 9, day: 16, year: 2027 },
  // 기념일 (공휴일은 아니지만 중요)
  { name: '어버이날', month: 5, day: 8 },
  { name: '스승의 날', month: 5, day: 15 },
  { name: '발렌타인데이', month: 2, day: 14 },
  { name: '화이트데이', month: 3, day: 14 },
];

const US_HOLIDAYS: NationalHoliday[] = [
  // 고정 양력
  { name: "New Year's Day", month: 1, day: 1 },
  { name: 'Juneteenth', month: 6, day: 19 },
  { name: 'Independence Day', month: 7, day: 4 },
  { name: "Veterans Day", month: 11, day: 11 },
  { name: 'Christmas Day', month: 12, day: 25 },
  { name: "Valentine's Day", month: 2, day: 14 },
  { name: "St. Patrick's Day", month: 3, day: 17 },
  { name: 'Halloween', month: 10, day: 31 },
  // 2025 유동일
  { name: 'MLK Jr. Day', month: 1, day: 20, year: 2025 },
  { name: "Presidents' Day", month: 2, day: 17, year: 2025 },
  { name: 'Memorial Day', month: 5, day: 26, year: 2025 },
  { name: 'Labor Day', month: 9, day: 1, year: 2025 },
  { name: 'Columbus Day', month: 10, day: 13, year: 2025 },
  { name: 'Thanksgiving', month: 11, day: 27, year: 2025 },
  // 2026 유동일
  { name: 'MLK Jr. Day', month: 1, day: 19, year: 2026 },
  { name: "Presidents' Day", month: 2, day: 16, year: 2026 },
  { name: 'Memorial Day', month: 5, day: 25, year: 2026 },
  { name: 'Labor Day', month: 9, day: 7, year: 2026 },
  { name: 'Columbus Day', month: 10, day: 12, year: 2026 },
  { name: 'Thanksgiving', month: 11, day: 26, year: 2026 },
  // 2027 유동일
  { name: 'MLK Jr. Day', month: 1, day: 18, year: 2027 },
  { name: "Presidents' Day", month: 2, day: 15, year: 2027 },
  { name: 'Memorial Day', month: 5, day: 31, year: 2027 },
  { name: 'Labor Day', month: 9, day: 6, year: 2027 },
  { name: 'Columbus Day', month: 10, day: 11, year: 2027 },
  { name: 'Thanksgiving', month: 11, day: 25, year: 2027 },
];

const COUNTRY_LABELS: Record<HolidayCountry, string> = {
  kr: '🇰🇷 한국',
  us: '🇺🇸 미국',
};

function getHolidaysForCountry(country: HolidayCountry): NationalHoliday[] {
  return country === 'kr' ? KOREA_HOLIDAYS : US_HOLIDAYS;
}

/* ─── 캘린더 이벤트 타입 ─── */
interface CalendarEvent {
  id: string;
  type: 'birthday' | 'holiday';
  title: string;
  subtitle: string;
  contact?: Contact;
  date: Date;
  dday?: number;
}

function buildEvents(
  contacts: Contact[],
  holidays: NationalHoliday[],
  showBirthdays: boolean,
  showHolidays: boolean,
  calYear: number,
): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  const now = new Date();

  if (showBirthdays) {
    const birthdays = getUpcomingBirthdaysFromStore(365);
    birthdays.forEach((c) => {
      const bParts = c.birthday.split('-');
      if (bParts.length < 2) return;
      const bMonth = parseInt(bParts[1], 10) - 1;
      const bDay = parseInt(bParts[2], 10);
      if (isNaN(bMonth) || isNaN(bDay)) return;
      let year = now.getFullYear();
      let eventDate = new Date(year, bMonth, bDay);
      if (eventDate < new Date(now.getFullYear(), now.getMonth(), now.getDate())) {
        year += 1;
        eventDate = new Date(year, bMonth, bDay);
      }
      events.push({
        id: `bd-${c.id}`,
        type: 'birthday',
        title: c.name,
        subtitle: c.birthdayDday === 0 ? '오늘 생일!' : `D-${c.birthdayDday}`,
        contact: c,
        date: eventDate,
        dday: c.birthdayDday,
      });
    });
  }

  if (showHolidays) {
    holidays.forEach((h) => {
      // 연도 지정 홀리데이: 해당 연도만
      if (h.year) {
        const eventDate = new Date(h.year, h.month - 1, h.day);
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const diffTime = eventDate.getTime() - today.getTime();
        const dday = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
        events.push({
          id: `hd-${h.name}-${h.year}-${h.month}-${h.day}`,
          type: 'holiday',
          title: h.name,
          subtitle: dday === 0 ? '오늘!' : `D-${dday}`,
          date: eventDate,
          dday,
        });
      } else {
        // 고정 양력: 현재 연도 + 다음 연도
        [calYear, calYear + 1].forEach((yr) => {
          const eventDate = new Date(yr, h.month - 1, h.day);
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const diffTime = eventDate.getTime() - today.getTime();
          const dday = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          events.push({
            id: `hd-${h.name}-${yr}-${h.month}-${h.day}`,
            type: 'holiday',
            title: h.name,
            subtitle: dday === 0 ? '오늘!' : dday > 0 ? `D-${dday}` : '',
            date: eventDate,
            dday: Math.max(0, dday),
          });
        });
      }
    });
  }

  return events;
}

const LS_HOLIDAY_COUNTRY_KEY = 'connection_holiday_country';

function loadCountry(): HolidayCountry {
  try {
    const v = localStorage.getItem(LS_HOLIDAY_COUNTRY_KEY);
    if (v === 'kr' || v === 'us') return v;
  } catch { /* ignore */ }
  return 'kr';
}

/* ═══════════════════════════════════════════════
   캘린더 페이지
   ═══════════════════════════════════════════════ */
export function CalendarPage() {
  const navigate = useNavigate();
  const analytics = useAnalytics();
  const contacts = useContacts();
  const motionConfig = useMotionConfig();
  useDocumentTitle('캘린더');

  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const showLoading = useDelayedLoading(isInitialLoading, 200);

  /* 표시 토글 */
  const [showBirthdays, setShowBirthdays] = useState(true);
  const [showHolidays, setShowHolidays] = useState(true);

  /* 나라 선택 */
  const [country, setCountry] = useState<HolidayCountry>(loadCountry);
  const [countryDropdownOpen, setCountryDropdownOpen] = useState(false);
  const holidays = useMemo(() => getHolidaysForCountry(country), [country]);

  /* 알림 */
  const [notifOpen, setNotifOpen] = useState(false);
  const notifications = useMemo(() => buildNotifications(contacts, holidays), [contacts, holidays]);
  const unreadCount = notifications.length;

  const now = new Date();
  const [calYear, setCalYear] = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState<number | null>(now.getDate());

  useEffect(() => {
    const timer = setTimeout(() => setIsInitialLoading(false), 350);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    analytics.trackScreenView('Calendar');
  }, []);

  useEffect(() => {
    localStorage.setItem(LS_HOLIDAY_COUNTRY_KEY, country);
  }, [country]);

  const events = useMemo(
    () => buildEvents(contacts, holidays, showBirthdays, showHolidays, calYear),
    [contacts, holidays, showBirthdays, showHolidays, calYear],
  );

  /* 캘린더 뷰 데이터 */
  const daysInMonth = getDaysInMonth(calYear, calMonth);
  const firstDay = getFirstDayOfWeek(calYear, calMonth);

  const eventsByDay = useMemo(() => {
    const map = new Map<number, CalendarEvent[]>();
    events.forEach((ev) => {
      if (ev.date.getFullYear() === calYear && ev.date.getMonth() === calMonth) {
        const d = ev.date.getDate();
        if (!map.has(d)) map.set(d, []);
        map.get(d)!.push(ev);
      }
    });
    return map;
  }, [events, calYear, calMonth]);

  const selectedDayEvents = selectedDate ? (eventsByDay.get(selectedDate) ?? []) : [];

  const prevMonth = () => {
    if (calMonth === 0) { setCalYear((y) => y - 1); setCalMonth(11); }
    else setCalMonth((m) => m - 1);
    setSelectedDate(null);
  };

  const nextMonth = () => {
    if (calMonth === 11) { setCalYear((y) => y + 1); setCalMonth(0); }
    else setCalMonth((m) => m + 1);
    setSelectedDate(null);
  };

  const isToday = (day: number) =>
    calYear === now.getFullYear() && calMonth === now.getMonth() && day === now.getDate();

  /* 리스트 뷰용 그룹핑 — 미래 이벤트만 */
  const listGroups = useMemo(() => {
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const futureEvents = events.filter((e) => e.date >= today);
    const sorted = [...futureEvents].sort((a, b) => a.date.getTime() - b.date.getTime());
    const groups: { title: string; items: CalendarEvent[] }[] = [];
    const bdItems = sorted.filter((e) => e.type === 'birthday');
    const hdItems = sorted.filter((e) => e.type === 'holiday');

    if (bdItems.length > 0) groups.push({ title: '다가오는 생일', items: bdItems.slice(0, 10) });
    if (hdItems.length > 0) groups.push({ title: '홀리데이', items: hdItems.slice(0, 15) });

    return groups;
  }, [events]);

  /* 체크박스 컴포넌트 */
  const CheckToggle = ({ checked, onToggle, label }: { checked: boolean; onToggle: () => void; label: string }) => (
    <button
      onClick={onToggle}
      className="flex items-center gap-2"
      style={{ minHeight: 32 }}
      aria-pressed={checked}
    >
      <div
        className={`flex items-center justify-center rounded transition-colors ${
          checked ? 'bg-toss-blue text-[var(--primary-foreground)]' : 'bg-toss-grey-200'
        }`}
        style={{ width: 20, height: 20, borderRadius: 5 }}
      >
        {checked && (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2.5 6L5 8.5L9.5 3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
      <span className="text-toss-grey-700" style={{ fontSize: 14 }}>{label}</span>
    </button>
  );

  if (showLoading) {
    return (
      <div className="pb-20">
        <div style={{ padding: '24px 24px 8px 24px' }}>
          <div style={{ width: 80, height: 28 }} className="rounded-lg bg-toss-grey-200 animate-pulse" />
        </div>
        <div className="px-6 mt-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <ContactSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="pb-20">
      {/* Header */}
      <div className="flex items-center justify-between" style={{ padding: '24px 24px 8px 24px' }}>
        <h1 className="text-toss-grey-900" style={{ fontSize: 24, fontWeight: 800 }}>캘린더</h1>
        <NotificationBellButton
          unreadCount={unreadCount}
          onClick={() => setNotifOpen(true)}
        />
      </div>

      {/* View Mode Toggle — 캘린더 왼쪽, 목록 오른쪽 */}
      <div className="px-6 pt-2 pb-2">
        <SegmentedControl
          size="small"
          alignment="fixed"
          value={viewMode}
          onChange={(v) => setViewMode(v as ViewMode)}
        >
          <SegmentedControl.Item value="calendar">캘린더</SegmentedControl.Item>
          <SegmentedControl.Item value="list">목록</SegmentedControl.Item>
        </SegmentedControl>
      </div>

      {/* Filter Row: 생일/홀리데이 체크 + 나라 드롭다운 */}
      <div className="flex items-center justify-between px-6 py-2">
        <div className="flex items-center gap-5">
          <CheckToggle checked={showBirthdays} onToggle={() => setShowBirthdays(!showBirthdays)} label="생일" />
          <CheckToggle checked={showHolidays} onToggle={() => setShowHolidays(!showHolidays)} label="홀리데이" />
        </div>
        {/* 나라 드롭다운 */}
        <div className="relative">
          <button
            onClick={() => setCountryDropdownOpen(!countryDropdownOpen)}
            className="flex items-center gap-1 bg-toss-grey-100 rounded-lg active:bg-toss-grey-200 transition-colors"
            style={{ padding: '6px 10px', fontSize: 13, minHeight: 32 }}
            aria-label="홀리데이 국가 선택"
            aria-expanded={countryDropdownOpen}
          >
            <span>{COUNTRY_LABELS[country]}</span>
            <ChevronDown size={14} className="text-toss-grey-500" />
          </button>
          <AnimatePresence>
            {countryDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setCountryDropdownOpen(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: -4, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-1 z-50 bg-[var(--toss-bg)] border border-toss-grey-200 rounded-xl overflow-hidden shadow-lg"
                  style={{ minWidth: 120 }}
                >
                  {(['kr', 'us'] as HolidayCountry[]).map((c) => (
                    <button
                      key={c}
                      onClick={() => {
                        setCountry(c);
                        setCountryDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 transition-colors ${
                        country === c ? 'bg-toss-blue-50 text-toss-blue' : 'text-toss-grey-800 active:bg-toss-grey-50'
                      }`}
                      style={{ fontSize: 14, fontWeight: country === c ? 600 : 400, minHeight: 44 }}
                    >
                      {COUNTRY_LABELS[c]}
                    </button>
                  ))}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ═══════ Calendar View ═══════ */}
      {viewMode === 'calendar' && (
        <motion.div
          initial={motionConfig.safeAnimate({ opacity: 0 })}
          animate={motionConfig.safeAnimate({ opacity: 1 })}
          transition={motionConfig.safeTransition('screen')}
        >
          {/* Month Navigator */}
          <div className="flex items-center justify-between px-6 py-3">
            <button
              onClick={prevMonth}
              className="flex items-center justify-center rounded-full active:bg-toss-grey-100 transition-colors"
              style={{ width: 36, height: 36 }}
              aria-label="이전 달"
            >
              <ChevronLeft size={20} className="text-toss-grey-600" />
            </button>
            <span className="text-toss-grey-900" style={{ fontSize: 17, fontWeight: 700 }}>
              {calYear}년 {MONTHS[calMonth]}
            </span>
            <button
              onClick={nextMonth}
              className="flex items-center justify-center rounded-full active:bg-toss-grey-100 transition-colors"
              style={{ width: 36, height: 36 }}
              aria-label="다음 달"
            >
              <ChevronRight size={20} className="text-toss-grey-600" />
            </button>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 px-6">
            {DAYS.map((d, i) => (
              <div
                key={d}
                className={`flex items-center justify-center ${i === 0 ? 'text-toss-red' : i === 6 ? 'text-toss-blue' : 'text-toss-grey-400'}`}
                style={{ fontSize: 12, fontWeight: 500, height: 32 }}
              >
                {d}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 px-6 pb-2">
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} style={{ height: 48 }} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dayEvents = eventsByDay.get(day) ?? [];
              const hasBirthday = dayEvents.some((e) => e.type === 'birthday');
              const hasHoliday = dayEvents.some((e) => e.type === 'holiday');
              const selected = selectedDate === day;
              const today = isToday(day);
              const dayOfWeek = new Date(calYear, calMonth, day).getDay();
              const isSunday = dayOfWeek === 0;
              const isSaturday = dayOfWeek === 6;

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDate(selected ? null : day)}
                  className={`relative flex flex-col items-center justify-center rounded-xl transition-colors ${
                    selected
                      ? 'bg-toss-blue text-[var(--primary-foreground)]'
                      : today
                        ? 'bg-toss-blue-50 text-toss-blue'
                        : hasHoliday
                          ? 'text-toss-red'
                          : isSunday
                            ? 'text-toss-red'
                            : isSaturday
                              ? 'text-toss-blue'
                              : 'text-toss-grey-800 active:bg-toss-grey-50'
                  }`}
                  style={{ height: 48, minWidth: 44 }}
                  aria-label={`${calMonth + 1}월 ${day}일${dayEvents.length > 0 ? `, 일정 ${dayEvents.length}개` : ''}`}
                >
                  <span style={{ fontSize: 14, fontWeight: today || selected ? 700 : 400 }}>
                    {day}
                  </span>
                  {dayEvents.length > 0 && (
                    <div className="flex gap-0.5 mt-0.5">
                      {hasBirthday && (
                        <div className={`w-1 h-1 rounded-full ${selected ? 'bg-[var(--primary-foreground)]' : 'bg-toss-red'}`} />
                      )}
                      {hasHoliday && (
                        <div className={`w-1 h-1 rounded-full ${selected ? 'bg-[var(--primary-foreground)] opacity-70' : 'bg-toss-blue'}`} />
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Selected Day Events */}
          <AnimatePresence mode="wait">
            {selectedDate !== null && (
              <motion.div
                key={`day-${selectedDate}`}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mx-6 mt-2 overflow-hidden border border-toss-grey-200"
                style={{ borderRadius: 16 }}
              >
                <div className="p-4 pb-2">
                  <span className="text-toss-grey-500" style={{ fontSize: 12, fontWeight: 600 }}>
                    {calMonth + 1}월 {selectedDate}일
                  </span>
                </div>
                {selectedDayEvents.length === 0 ? (
                  <div className="px-4 pb-4">
                    <p className="text-toss-grey-400" style={{ fontSize: 13 }}>일정이 없어요</p>
                  </div>
                ) : (
                  <div>
                    {selectedDayEvents.map((ev) => (
                      <EventRow
                        key={ev.id}
                        event={ev}
                        onClick={ev.contact ? () => navigate(`/app/contact/${ev.contact!.id}`) : undefined}
                      />
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* ═══════ List View ═══════ */}
      {viewMode === 'list' && (
        <motion.div
          initial={motionConfig.safeAnimate({ opacity: 0 })}
          animate={motionConfig.safeAnimate({ opacity: 1 })}
          transition={motionConfig.safeTransition('screen')}
        >
          {listGroups.length === 0 ? (
            <Result
              figure={
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-toss-grey-100">
                  <Calendar size={28} className="text-toss-grey-300" />
                </div>
              }
              title="일정이 없습니다"
              description="생일이나 홀리데이가 있으면 여기에 표시돼요."
            />
          ) : (
            listGroups.map((group) => (
              <section key={group.title} className="mt-1">
                <div className="px-6 pt-4 pb-2">
                  <h3 className="text-toss-grey-500" style={{ fontSize: 12, fontWeight: 600 }}>
                    {group.title}
                  </h3>
                </div>
                <div>
                  {group.items.map((ev, idx) => (
                    <motion.div
                      key={ev.id}
                      initial={motionConfig.safeAnimate({ opacity: 0, y: MOTION_DISTANCE.micro })}
                      animate={motionConfig.safeAnimate({ opacity: 1, y: 0 })}
                      transition={{ ...motionConfig.safeTransition('screen'), delay: idx * 0.03 }}
                    >
                      <EventRow
                        event={ev}
                        onClick={ev.contact ? () => navigate(`/app/contact/${ev.contact!.id}`) : undefined}
                      />
                    </motion.div>
                  ))}
                </div>
              </section>
            ))
          )}
        </motion.div>
      )}

      {/* ═══════ Notifications BottomSheet ═══════ */}
      <NotificationPanel
        isOpen={notifOpen}
        onClose={() => setNotifOpen(false)}
        notifications={notifications}
      />
    </div>
  );
}

/* ─── Event Row ─── */
function EventRow({
  event,
  onClick,
}: {
  event: CalendarEvent;
  onClick?: () => void;
}) {
  const isBirthday = event.type === 'birthday';
  const isUrgent = isBirthday && (event.dday ?? 999) <= 7;
  const isHoliday = event.type === 'holiday';

  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={`w-full flex items-center gap-3 px-6 py-3.5 ${onClick ? 'active:bg-toss-grey-50' : ''} transition-colors`}
      style={{ minHeight: 56 }}
      aria-label={`${event.title}, ${event.subtitle}`}
    >
      {isBirthday && event.contact ? (
        <ContactAvatar
          name={event.contact.name}
          color={getRelationshipColor(event.contact.relationship)}
          size={44}
        />
      ) : (
        <div
          className="flex items-center justify-center bg-toss-blue-50 rounded-full shrink-0"
          style={{ width: 44, height: 44 }}
        >
          <PartyPopper size={20} className="text-toss-blue" />
        </div>
      )}
      <div className="flex-1 min-w-0 text-left">
        <div className="flex items-center gap-2">
          <span className="text-toss-grey-900 truncate" style={{ fontSize: 15, fontWeight: 600 }}>
            {event.title}
          </span>
          {isBirthday && event.contact && (
            <span className="text-toss-grey-400" style={{ fontSize: 12 }}>
              {event.contact.relationship}
            </span>
          )}
        </div>
        <p className="text-toss-grey-500 mt-0.5" style={{ fontSize: 13 }}>
          {isBirthday && event.contact
            ? formatBirthday(event.contact.birthday)
            : `${event.date.getMonth() + 1}월 ${event.date.getDate()}일`}
        </p>
      </div>

      {/* D-day 배지 */}
      {isBirthday && (
        <div
          className={`shrink-0 px-2.5 py-1 rounded-full ${
            isUrgent ? 'bg-toss-red-50 text-toss-red' : 'bg-toss-grey-100 text-toss-grey-600'
          }`}
          style={{ fontSize: 12, fontWeight: 600 }}
        >
          {event.dday === 0 ? 'D-DAY' : `D-${event.dday}`}
        </div>
      )}
      {isHoliday && (
        <div
          className="shrink-0 px-2.5 py-1 rounded-full bg-toss-blue-50 text-toss-blue"
          style={{ fontSize: 12, fontWeight: 600 }}
        >
          {event.dday === 0 ? 'D-DAY' : `D-${event.dday}`}
        </div>
      )}
    </button>
  );
}