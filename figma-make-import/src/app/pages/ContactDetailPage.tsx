import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { Calendar, Clock, Edit2, Trash2, CheckCircle, ChevronLeft, ChevronRight, Phone, MessageCircle, Copy, Star, Plus, X, Tag as TagIcon } from 'lucide-react';
import { getContactByIdFromStore, getRelationshipColor, removeContact, updateContact, toggleFavorite } from '../data/contactsStore';
import { ContactAvatar } from '../components/ContactAvatar';
import { NavigationBar } from '../components/NavigationBar';
import { Popup } from '../components/Popup';
import { TossButton } from '../components/TossButton';
import { TableRow } from '../components/TableRow';
import { Skeleton } from '../components/Skeleton';
import { FixedBottomCTA } from '../components/FixedBottomCTA';
import { useToast } from '../components/useToast';
import { IconButton } from '../components/IconButton';
import { ProgressBar } from '../components/ProgressBar';
import { useDelayedLoading } from '../components/useDebounce';
import { useAnalytics } from '../components/useAnalytics';
import { maskPhone, formatDate, formatContactGap, formatBirthday } from '../components/useFormatters';
import { useMotionConfig, MOTION_DISTANCE } from '../components/useMotionConfig';
import { BottomSheet } from '../components/BottomSheet';
import { Switch } from '../components/Switch';
import {
  getAutoMessagePref,
  setAutoMessageEnabled,
  toggleOccasion,
  setCustomMessage,
  setSendTime,
  renderMessage,
  getScheduledMessagesForContact,
  OCCASION_META,
  ALL_OCCASION_KEYS,
  DEFAULT_TEMPLATES_KO,
  DEFAULT_TEMPLATES_EN,
  SEND_TIME_OPTIONS,
  getSendTimeLabel,
  type OccasionKey,
} from '../data/autoMessageStore';
import { useLanguage } from '../components/useLanguage';
import { useDocumentTitle } from '../components/useDocumentTitle';
import { useGroups, type ContactGroup } from '../data/groupStore';
import { setContactGroups } from '../data/contactsStore';
import {
  addLog as addInteractionLog,
  removeLog as removeInteractionLog,
  useContactLogs,
  INTERACTION_TYPE_META,
  ALL_INTERACTION_TYPES,
  type InteractionType,
  type InteractionLog,
} from '../data/interactionLogStore';
import {
  useTags, addTag, getTagById,
  TAG_COLORS, type Tag,
} from '../data/tagStore';
import { setContactTags } from '../data/contactsStore';

const DAYS_OF_WEEK_KO = ['일', '월', '화', '수', '목', '금', '토'];

/* ═══════════════════════════════════════
   캘린더 피커 컴포넌트
   ═══════════════════════════════════════ */
function CalendarPicker({
  selectedDate,
  onSelect,
}: {
  selectedDate: Date | null;
  onSelect: (date: Date) => void;
}) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(viewYear - 1); setViewMonth(11); }
    else setViewMonth(viewMonth - 1);
  };

  const nextMonth = () => {
    const isCurrentMonth = viewYear === today.getFullYear() && viewMonth === today.getMonth();
    if (isCurrentMonth) return;
    if (viewMonth === 11) { setViewYear(viewYear + 1); setViewMonth(0); }
    else setViewMonth(viewMonth + 1);
  };

  const isToday = (day: number) =>
    viewYear === today.getFullYear() && viewMonth === today.getMonth() && day === today.getDate();

  const isSelected = (day: number) =>
    selectedDate &&
    viewYear === selectedDate.getFullYear() &&
    viewMonth === selectedDate.getMonth() &&
    day === selectedDate.getDate();

  const isFuture = (day: number) => {
    const d = new Date(viewYear, viewMonth, day);
    d.setHours(23, 59, 59);
    return d > today;
  };

  const isCurrentOrFutureMonth =
    viewYear > today.getFullYear() ||
    (viewYear === today.getFullYear() && viewMonth >= today.getMonth());

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div>
      {/* 헤더 */}
      <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
        <button
          onClick={prevMonth}
          className="flex items-center justify-center text-toss-grey-600 active:bg-toss-grey-100 rounded-lg transition-colors"
          style={{ width: 36, height: 36 }}
          aria-label="이전 달"
        >
          <ChevronLeft size={20} />
        </button>
        <span className="text-toss-grey-900" style={{ fontSize: 16, fontWeight: 700 }}>
          {viewYear}년 {viewMonth + 1}월
        </span>
        <button
          onClick={nextMonth}
          disabled={isCurrentOrFutureMonth}
          className={`flex items-center justify-center rounded-lg transition-colors ${
            isCurrentOrFutureMonth ? 'text-toss-grey-300' : 'text-toss-grey-600 active:bg-toss-grey-100'
          }`}
          style={{ width: 36, height: 36 }}
          aria-label="다음 달"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 gap-0" style={{ marginBottom: 4 }}>
        {DAYS_OF_WEEK_KO.map((d, i) => (
          <div
            key={d}
            className="text-center"
            style={{
              fontSize: 12,
              fontWeight: 500,
              padding: '4px 0',
              color: i === 0 ? 'var(--toss-red)' : i === 6 ? 'var(--toss-blue-500)' : 'var(--toss-grey-400)',
            }}
          >
            {d}
          </div>
        ))}
      </div>

      {/* 날짜 */}
      <div className="grid grid-cols-7 gap-0">
        {cells.map((day, idx) => {
          if (day === null) return <div key={`empty-${idx}`} />;
          const future = isFuture(day);
          const sel = isSelected(day);
          const td = isToday(day);
          const dayOfWeek = new Date(viewYear, viewMonth, day).getDay();

          return (
            <button
              key={day}
              disabled={future}
              onClick={() => onSelect(new Date(viewYear, viewMonth, day))}
              className="flex items-center justify-center transition-colors"
              style={{
                width: '100%',
                aspectRatio: '1',
                borderRadius: '50%',
                fontSize: 14,
                fontWeight: sel || td ? 600 : 400,
                backgroundColor: sel ? 'var(--toss-blue-500)' : td ? 'var(--toss-blue-50)' : undefined,
                color: sel
                  ? 'var(--primary-foreground)'
                  : td
                  ? 'var(--toss-blue-500)'
                  : future
                  ? 'var(--toss-grey-300)'
                  : dayOfWeek === 0
                  ? 'var(--toss-red)'
                  : dayOfWeek === 6
                  ? 'var(--toss-blue-500)'
                  : 'var(--toss-grey-800)',
              }}
              aria-label={`${viewYear}년 ${viewMonth + 1}월 ${day}일`}
              aria-pressed={sel || undefined}
            >
              {day}
            </button>
          );
        })}
      </div>

      {/* 오늘 버튼 */}
      <button
        onClick={() => onSelect(today)}
        className="w-full mt-3 text-center text-toss-blue active:bg-toss-blue-50 rounded-xl transition-colors"
        style={{ fontSize: 14, fontWeight: 600, padding: '10px 0', minHeight: 44 }}
      >
        오늘로 설정
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════
   자동 메시지 섹션 컴포넌트
   ═══════════════════════════════════════ */
function AutoMessageSection({
  contact,
  lang,
  autoMsgRefresh,
  onRefresh,
  onEditTemplate,
  onOpenTimePicker,
  motionConfig,
}: {
  contact: import('../data/contacts').Contact;
  lang: string;
  autoMsgRefresh: number;
  onRefresh: () => void;
  onEditTemplate: (oKey: OccasionKey) => void;
  onOpenTimePicker: () => void;
  motionConfig: ReturnType<typeof useMotionConfig>;
}) {
  const toast = useToast();

  // autoMsgRefresh 변경 시 리렌더링을 위해 참조
  const _ = autoMsgRefresh;

  const pref = getAutoMessagePref(contact.id);
  const isEnabled = pref.enabled;
  const scheduledMsgs = getScheduledMessagesForContact(contact, lang as 'ko' | 'en');
  const activeCount = ALL_OCCASION_KEYS.filter((k) => pref.occasions[k]).length;

  const handleToggleEnabled = () => {
    const next = !isEnabled;
    setAutoMessageEnabled(contact.id, next);
    onRefresh();
    toast.openToast(next ? '자동 메시지를 활성화했어요' : '자동 메시지를 비활성화했어요');
  };

  const handleToggleOccasion = (oKey: OccasionKey) => {
    toggleOccasion(contact.id, oKey);
    onRefresh();
  };

  return (
    <motion.div
      initial={motionConfig.safeAnimate({ opacity: 0, y: MOTION_DISTANCE.overlay })}
      animate={motionConfig.safeAnimate({ opacity: 1, y: 0 })}
      transition={{ ...motionConfig.safeTransition('screen'), delay: 0.05 }}
      className="mt-2 bg-[var(--toss-card-bg)]"
    >
      {/* 헤더: 자동 메시지 + Switch */}
      <div
        className="flex items-center justify-between"
        style={{ padding: '12px 24px' }}
      >
        <div>
          <h3 className="text-toss-grey-900" style={{ fontSize: 15, fontWeight: 700 }}>
            자동 메시지
          </h3>
          <p className="text-toss-grey-500 mt-0.5" style={{ fontSize: 12 }}>
            {isEnabled
              ? `${activeCount}개 기념일에 메시지 예약됨`
              : '기념일에 메시지를 자동으로 준비해요'}
          </p>
        </div>
        <Switch
          checked={isEnabled}
          onChange={handleToggleEnabled}
          aria-label="자동 메시지"
        />
      </div>

      {/* 기념일 토글 + 예약 미리보기 — 활성화 시에만 표시 */}
      {isEnabled && (
        <div style={{ padding: '0 24px 12px' }}>
          {/* 기념일 칩 그리드 (이모지 없이 텍스트만) */}
          <div className="flex flex-wrap gap-2" style={{ marginBottom: 12 }}>
            {ALL_OCCASION_KEYS.map((oKey) => {
              const meta = OCCASION_META[oKey];
              const active = pref.occasions[oKey];
              return (
                <button
                  key={oKey}
                  onClick={() => handleToggleOccasion(oKey)}
                  className={`transition-all ${
                    active
                      ? 'border-toss-blue bg-toss-blue-50'
                      : 'border-toss-grey-200 bg-toss-grey-50'
                  }`}
                  style={{
                    fontSize: 13,
                    fontWeight: active ? 600 : 400,
                    padding: '7px 14px',
                    borderRadius: 20,
                    borderWidth: 1,
                    borderStyle: 'solid',
                    color: active ? 'var(--toss-blue-500)' : 'var(--toss-grey-500)',
                  }}
                >
                  {lang === 'ko' ? meta.labelKo : meta.labelEn}
                </button>
              );
            })}
          </div>

          {/* 발송 시간 설정 */}
          <button
            onClick={onOpenTimePicker}
            className="w-full flex items-center justify-between active:bg-toss-grey-50 transition-colors"
            style={{
              padding: '10px 14px',
              borderRadius: 12,
              border: '1px solid var(--toss-grey-100)',
              marginBottom: 12,
            }}
          >
            <div className="flex items-center gap-2">
              <Clock size={15} className="text-toss-grey-400" />
              <span className="text-toss-grey-700" style={{ fontSize: 13 }}>발송 시간</span>
            </div>
            <span className="text-toss-blue" style={{ fontSize: 13, fontWeight: 600 }}>
              {getSendTimeLabel(pref.sendTime, lang as 'ko' | 'en')}
            </span>
          </button>

          {/* 예약된 메시지 미리보기 */}
          {scheduledMsgs.length > 0 && (
            <div className="space-y-2">
              <p className="text-toss-grey-500" style={{ fontSize: 11, fontWeight: 600, marginBottom: 4 }}>
                예약된 메시지 미리보기
              </p>
              {scheduledMsgs.slice(0, 3).map((msg) => (
                <button
                  key={msg.id}
                  onClick={() => onEditTemplate(msg.occasion)}
                  className="w-full text-left active:bg-toss-grey-50 transition-colors"
                  style={{
                    padding: '10px 14px',
                    borderRadius: 12,
                    border: '1px solid var(--toss-grey-100)',
                  }}
                >
                  <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
                    <div className="flex items-center gap-1.5">
                      <span
                        className="inline-block rounded-full"
                        style={{
                          width: 8,
                          height: 8,
                          backgroundColor: OCCASION_META[msg.occasion].color,
                        }}
                      />
                      <span className="text-toss-grey-700" style={{ fontSize: 13, fontWeight: 600 }}>
                        {msg.occasionLabel}
                      </span>
                      <span className="text-toss-grey-400" style={{ fontSize: 11 }}>
                        {msg.scheduledDate.replace(/-/g, '.')}
                      </span>
                    </div>
                    <span
                      className={msg.daysUntil <= 7 ? 'text-toss-red' : 'text-toss-grey-500'}
                      style={{ fontSize: 11, fontWeight: 600 }}
                    >
                      {msg.daysUntil === 0 ? 'D-DAY' : `D-${msg.daysUntil}`}
                    </span>
                  </div>
                  <p className="text-toss-grey-600 truncate" style={{ fontSize: 12, lineHeight: 1.4 }}>
                    {msg.message}
                  </p>
                  <span className="text-toss-blue mt-1 inline-block" style={{ fontSize: 11, fontWeight: 500 }}>
                    메시지 편집
                  </span>
                </button>
              ))}
              {scheduledMsgs.length > 3 && (
                <p className="text-toss-grey-400 text-center" style={{ fontSize: 11 }}>
                  +{scheduledMsgs.length - 3}개 더 있음
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

/* ═══════════════════════════════════════
   연락 이력 (Interaction Log) 섹션 컴포넌트
   ═══════════════════════════════════════ */
function InteractionLogSection({
  contactId,
  lang,
  motionConfig,
}: {
  contactId: string;
  lang: string;
  motionConfig: ReturnType<typeof useMotionConfig>;
}) {
  const logs = useContactLogs(contactId);
  const toast = useToast();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [logType, setLogType] = useState<InteractionType>('call');
  const [logNote, setLogNote] = useState('');
  const [logDate, setLogDate] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  });
  const [showAll, setShowAll] = useState(false);

  const recentLogs = showAll ? logs.slice(0, 20) : logs.slice(0, 5);

  const handleAddLog = () => {
    addInteractionLog({
      contactId,
      type: logType,
      note: logNote,
      date: logDate,
    });
    setSheetOpen(false);
    setLogType('call');
    setLogNote('');
    const now = new Date();
    setLogDate(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`);
    toast.openToast('연락 이력을 추가했어요');
  };

  return (
    <>
      <motion.div
        initial={motionConfig.safeAnimate({ opacity: 0, y: MOTION_DISTANCE.overlay })}
        animate={motionConfig.safeAnimate({ opacity: 1, y: 0 })}
        transition={{ ...motionConfig.safeTransition('screen'), delay: 0.2 }}
        className="mt-2 bg-[var(--toss-card-bg)]"
      >
        <div className="flex items-center justify-between py-3" style={{ paddingLeft: 24, paddingRight: 24 }}>
          <h3 className="text-toss-grey-900" style={{ fontSize: 15, fontWeight: 700 }}>연락 이력</h3>
          <button
            onClick={() => setSheetOpen(true)}
            className="text-toss-blue active:text-toss-blue-600 transition-colors"
            style={{ fontSize: 13, fontWeight: 600, minHeight: 36, padding: '4px 8px' }}
          >
            + 기록 추가
          </button>
        </div>

        {recentLogs.length > 0 ? (
          <div style={{ padding: '0 24px 12px' }}>
            {recentLogs.map((log) => {
              const meta = INTERACTION_TYPE_META[log.type];
              return (
                <div
                  key={log.id}
                  className="flex items-start gap-3 py-2.5"
                  style={{ borderBottom: '1px solid var(--toss-grey-50)' }}
                >
                  <span style={{ fontSize: 16, lineHeight: '24px' }}>{meta.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-toss-grey-800" style={{ fontSize: 14, fontWeight: 600 }}>
                        {lang === 'ko' ? meta.labelKo : meta.labelEn}
                      </span>
                      <span className="text-toss-grey-400" style={{ fontSize: 11 }}>
                        {log.date.replace(/-/g, '.')}
                      </span>
                    </div>
                    {log.note && (
                      <p className="text-toss-grey-500 mt-0.5 truncate" style={{ fontSize: 12 }}>{log.note}</p>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      removeInteractionLog(log.id);
                      toast.openToast('연락 이력을 삭제했어요');
                    }}
                    className="text-toss-grey-300 active:text-toss-red transition-colors shrink-0"
                    style={{ padding: '4px', minHeight: 24 }}
                    aria-label="삭제"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
            {logs.length > 5 && !showAll && (
              <button
                onClick={() => setShowAll(true)}
                className="w-full text-center text-toss-blue active:bg-toss-blue-50 rounded-xl transition-colors mt-2"
                style={{ fontSize: 13, fontWeight: 600, padding: '10px 0', minHeight: 40 }}
              >
                {logs.length - 5}개 더 보기
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center py-6" style={{ paddingBottom: 16 }}>
            <Clock size={24} className="text-toss-grey-300 mb-2" />
            <p className="text-toss-grey-400" style={{ fontSize: 13 }}>아직 연락 이력이 없어요</p>
          </div>
        )}
      </motion.div>

      {/* 연락 이력 추가 바텀시트 */}
      <BottomSheet
        isOpen={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="연락 이력 추가"
        closeOnDimmerClick
        footer={
          <TossButton
            variant="fill"
            color="primary"
            size="xlarge"
            display="full"
            onClick={handleAddLog}
          >
            저장하기
          </TossButton>
        }
      >
        <div style={{ paddingBottom: 8 }}>
          {/* 연락 타입 칩 */}
          <p className="text-toss-grey-500 mb-2" style={{ fontSize: 12, fontWeight: 600 }}>연락 방법</p>
          <div className="flex flex-wrap gap-2 mb-4">
            {ALL_INTERACTION_TYPES.map((t) => {
              const meta = INTERACTION_TYPE_META[t];
              const active = logType === t;
              return (
                <button
                  key={t}
                  onClick={() => setLogType(t)}
                  className={`transition-all ${active ? 'border-toss-blue bg-toss-blue-50' : 'border-toss-grey-200 bg-toss-grey-50'}`}
                  style={{
                    fontSize: 13,
                    fontWeight: active ? 600 : 400,
                    padding: '7px 14px',
                    borderRadius: 20,
                    borderWidth: 1,
                    borderStyle: 'solid',
                    color: active ? 'var(--toss-blue-500)' : 'var(--toss-grey-500)',
                  }}
                >
                  {meta.emoji} {lang === 'ko' ? meta.labelKo : meta.labelEn}
                </button>
              );
            })}
          </div>

          {/* 날짜 */}
          <p className="text-toss-grey-500 mb-2" style={{ fontSize: 12, fontWeight: 600 }}>날짜</p>
          <input
            type="date"
            value={logDate}
            onChange={(e) => setLogDate(e.target.value)}
            className="w-full bg-toss-grey-50 text-toss-grey-900 rounded-xl outline-none mb-4"
            style={{
              fontSize: 14,
              padding: '10px 16px',
              border: '1px solid var(--toss-grey-200)',
            }}
          />

          {/* 메모 */}
          <p className="text-toss-grey-500 mb-2" style={{ fontSize: 12, fontWeight: 600 }}>메모 (선택)</p>
          <textarea
            value={logNote}
            onChange={(e) => setLogNote(e.target.value)}
            className="w-full bg-toss-grey-50 text-toss-grey-900 rounded-xl outline-none resize-none"
            style={{
              fontSize: 14,
              lineHeight: 1.6,
              padding: 16,
              minHeight: 80,
              border: '1px solid var(--toss-grey-200)',
            }}
            maxLength={200}
            placeholder="간단한 메모를 남겨보세요"
          />
          <span className="text-toss-grey-400 mt-1 inline-block" style={{ fontSize: 11 }}>{logNote.length}/200</span>
        </div>
      </BottomSheet>
    </>
  );
}

/* ═══════════════════════════════════════
   ContactDetailPage
   ═══════════════════════════════════════ */
export function ContactDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const analytics = useAnalytics();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [phoneVisible, setPhoneVisible] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);

  /* ── 자동 메시지 상태 ── */
  const [autoMsgRefresh, setAutoMsgRefresh] = useState(0);
  const [templateEditOpen, setTemplateEditOpen] = useState(false);
  const [editingOccasion, setEditingOccasion] = useState<OccasionKey | null>(null);
  const [editingTemplate, setEditingTemplate] = useState('');
  const [timePickerOpen, setTimePickerOpen] = useState(false);
  const [groupSheetOpen, setGroupSheetOpen] = useState(false);
  const [tagSheetOpen, setTagSheetOpen] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');

  const { lang } = useLanguage();
  const motionConfig = useMotionConfig();
  const showLoading = useDelayedLoading(isInitialLoading, 200);
  const groups = useGroups();
  const allTags = useTags();

  const contact = getContactByIdFromStore(id || '');
  useDocumentTitle(contact ? `${contact.name} 상세` : '연락처 상세');

  /* ── 연락처 데이터가 동기적으로 사용 가능하므로 즉시 로딩 해제 ── */
  useEffect(() => {
    setIsInitialLoading(false);
  }, []);

  const selectedLastContact = useMemo(() => {
    if (!contact?.lastContact) return null;
    return new Date(contact.lastContact);
  }, [contact?.lastContact]);

  const handleDateSelect = (date: Date) => {
    if (!id) return;
    const iso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    updateContact(id, { lastContact: iso });
    setCalendarOpen(false);
    toast.openToast('마지막 연락일을 수정했어요');
  };

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
      <div className="min-h-dvh bg-[var(--toss-page-bg)]">
        <div className="bg-[var(--toss-card-bg)]">
          <NavigationBar showBack />
          <div className="flex flex-col items-center pb-6 pt-2">
            <div className="rounded-full bg-toss-grey-200 animate-pulse" style={{ width: 72, height: 72 }} />
            <div className="mt-3 rounded bg-toss-grey-200 animate-pulse" style={{ width: 80, height: 24 }} />
          </div>
        </div>
        <div className="mt-2 bg-[var(--toss-card-bg)]">
          <Skeleton pattern="subtitleList" repeatLastItemCount={4} style={{ width: '100%' }} />
        </div>
      </div>
    );
  }

  const CLOSENESS_PROGRESS: Record<string, number> = {
    '매우 친함': 1.0, '친함': 0.75, '보통': 0.5, '가끔': 0.25, '거의 모름': 0.1, '가족': 1.0,
  };

  const closenessValue = CLOSENESS_PROGRESS[contact.closeness] ?? 0.5;
  const contactGapProgress = Math.max(0, Math.min(1, 1 - contact.contactGap / 60));
  const bdayFormatted = contact.birthday
    ? `${contact.birthday.slice(0, 4)}년 ${formatBirthday(contact.birthday)}`
    : '';
  const lastContactFormatted = formatContactGap(contact.contactGap);
  const displayPhone = phoneVisible ? contact.phone : maskPhone(contact.phone || '');

  return (
    <div className="min-h-dvh bg-[var(--toss-page-bg)]">
      <div className="bg-[var(--toss-card-bg)]">
        <NavigationBar
          showBack
          rightAction={
            <div className="flex items-center gap-1">
              <IconButton
                icon={<Star size={18} fill={contact.isFavorite ? 'currentColor' : 'none'} />}
                aria-label={contact.isFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}
                variant="clear"
                iconSize={18}
                className={contact.isFavorite ? 'text-toss-blue' : ''}
                onClick={() => {
                  const isFav = toggleFavorite(contact.id);
                  toast.openToast(isFav ? `${contact.name}님을 즐겨찾기에 추가했어요` : `${contact.name}님을 즐겨찾기에서 제거했어요`);
                }}
              />
              <IconButton
                icon={<Edit2 size={18} />}
                aria-label="수정"
                variant="clear"
                iconSize={18}
                onClick={() => {
                  navigate(`/app/contact/${id}/edit`);
                  analytics.trackEvent('click', {
                    screen_name: 'ContactDetail',
                    component_name: 'editButton',
                    action: 'navigate_edit',
                  });
                }}
              />
            </div>
          }
        />

        {/* Profile */}
        <motion.div
          initial={motionConfig.safeAnimate({ opacity: 0, y: MOTION_DISTANCE.overlay })}
          animate={motionConfig.safeAnimate({ opacity: 1, y: 0 })}
          transition={motionConfig.safeTransition('screen')}
          className="flex flex-col items-center pb-6 pt-2"
        >
          <ContactAvatar name={contact.name} color={getRelationshipColor(contact.relationship)} size={72} />
          <h2 className="mt-3 text-toss-grey-900" style={{ fontSize: 22, fontWeight: 700 }}>{contact.name}</h2>
          <div className="flex items-center gap-2 mt-1">
            <span
              className="px-2 py-0.5 rounded-full"
              style={{
                fontSize: 12,
                fontWeight: 600,
                backgroundColor: getRelationshipColor(contact.relationship) + '18',
                color: getRelationshipColor(contact.relationship),
              }}
            >
              {contact.relationship}
            </span>
            <span className="text-toss-grey-500" style={{ fontSize: 13 }}>{contact.closeness}</span>
          </div>

          {/* ═══════ 전화 · 문자 · 복사 퀵 액션 ═══════ */}
          {contact.phone && (
            <div className="flex items-center gap-3 mt-4">
              <button
                onClick={() => {
                  window.open(`tel:${contact.phone}`, '_self');
                  analytics.trackEvent('click', {
                    screen_name: 'ContactDetail',
                    component_name: 'quickAction',
                    action: 'call',
                  });
                }}
                className="flex flex-col items-center gap-1.5 active:bg-toss-grey-100 rounded-xl transition-colors"
                style={{ padding: '10px 20px', minWidth: 72 }}
                aria-label={`${contact.name}에게 전화`}
              >
                <div
                  className="flex items-center justify-center rounded-full bg-toss-blue-50"
                  style={{ width: 44, height: 44 }}
                >
                  <Phone size={20} className="text-toss-blue" />
                </div>
                <span className="text-toss-grey-700" style={{ fontSize: 11, fontWeight: 600 }}>전화</span>
              </button>
              <button
                onClick={() => {
                  window.open(`sms:${contact.phone}`, '_self');
                  analytics.trackEvent('click', {
                    screen_name: 'ContactDetail',
                    component_name: 'quickAction',
                    action: 'sms',
                  });
                }}
                className="flex flex-col items-center gap-1.5 active:bg-toss-grey-100 rounded-xl transition-colors"
                style={{ padding: '10px 20px', minWidth: 72 }}
                aria-label={`${contact.name}에게 문자`}
              >
                <div
                  className="flex items-center justify-center rounded-full bg-toss-green/10"
                  style={{ width: 44, height: 44 }}
                >
                  <MessageCircle size={20} className="text-toss-green" />
                </div>
                <span className="text-toss-grey-700" style={{ fontSize: 11, fontWeight: 600 }}>문자</span>
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(contact.phone || '').then(() => {
                    toast.openToast('전화번호를 복사했어요');
                  });
                  analytics.trackEvent('click', {
                    screen_name: 'ContactDetail',
                    component_name: 'quickAction',
                    action: 'copy_phone',
                  });
                }}
                className="flex flex-col items-center gap-1.5 active:bg-toss-grey-100 rounded-xl transition-colors"
                style={{ padding: '10px 20px', minWidth: 72 }}
                aria-label="전화번호 복사"
              >
                <div
                  className="flex items-center justify-center rounded-full bg-toss-grey-100"
                  style={{ width: 44, height: 44 }}
                >
                  <Copy size={20} className="text-toss-grey-600" />
                </div>
                <span className="text-toss-grey-700" style={{ fontSize: 11, fontWeight: 600 }}>복사</span>
              </button>
            </div>
          )}
        </motion.div>
      </div>

      {/* ═══════ 자동 메시지 섹션 — 프로필 바로 아래 ═══════ */}
      <AutoMessageSection
        contact={contact}
        lang={lang}
        autoMsgRefresh={autoMsgRefresh}
        onRefresh={() => setAutoMsgRefresh((n) => n + 1)}
        onEditTemplate={(oKey) => {
          const pref = getAutoMessagePref(contact.id);
          const templates = lang === 'ko' ? DEFAULT_TEMPLATES_KO : DEFAULT_TEMPLATES_EN;
          setEditingOccasion(oKey);
          setEditingTemplate(pref.customMessages[oKey] || templates[oKey]);
          setTemplateEditOpen(true);
        }}
        onOpenTimePicker={() => setTimePickerOpen(true)}
        motionConfig={motionConfig}
      />

      {/* Info Section */}
      <motion.div
        initial={motionConfig.safeAnimate({ opacity: 0, y: MOTION_DISTANCE.overlay })}
        animate={motionConfig.safeAnimate({ opacity: 1, y: 0 })}
        transition={{ ...motionConfig.safeTransition('screen'), delay: 0.1 }}
        className="mt-2 bg-[var(--toss-card-bg)]"
      >
        <div className="py-3" style={{ paddingLeft: 24, paddingRight: 24 }}>
          <h3 className="text-toss-grey-900" style={{ fontSize: 15, fontWeight: 700 }}>기본 정보</h3>
        </div>
        <TableRow
          align="space-between" leftRatio={30}
          left={<span className="flex items-center gap-2"><Calendar size={16} className="text-toss-grey-400" aria-hidden="true" /><span className="text-toss-grey-500" style={{ fontSize: 14 }}>생일</span></span>}
          right={bdayFormatted}
          style={{ height: 48 }}
        />
        <TableRow
          align="space-between" leftRatio={30}
          left={<span className="text-toss-grey-500" style={{ fontSize: 14 }}>D-day</span>}
          right={
            <span className={`px-2 py-0.5 rounded-full ${contact.birthdayDday <= 7 ? 'bg-toss-red-light text-toss-red' : contact.birthdayDday <= 30 ? 'bg-toss-orange-light text-toss-orange' : 'bg-toss-grey-100 text-toss-grey-600'}`} style={{ fontSize: 13, fontWeight: 600 }}>
              {contact.birthdayDday === 0 ? 'D-DAY!' : `D-${contact.birthdayDday}`}
            </span>
          }
          style={{ height: 48, paddingLeft: 52 }}
        />
        <TableRow
          align="space-between" leftRatio={30}
          left={<span className="text-toss-grey-500" style={{ fontSize: 14 }}>나이</span>}
          right={`${contact.age}세 (${contact.birthday.slice(0, 4)}년생)`}
          style={{ height: 48, paddingLeft: 52 }}
        />
        <TableRow
          align="space-between" leftRatio={30}
          left={<span className="text-toss-grey-500" style={{ fontSize: 14 }}>가족 상태</span>}
          right={contact.familyStatus}
          style={{ height: 48, paddingLeft: 52 }}
        />
        {contact.phone && (
          <TableRow
            align="space-between" leftRatio={30}
            left={<span className="flex items-center gap-2"><Phone size={16} className="text-toss-grey-400" aria-hidden="true" /><span className="text-toss-grey-500" style={{ fontSize: 14 }}>전화번호</span></span>}
            right={
              <button onClick={() => setPhoneVisible(!phoneVisible)} className="text-toss-blue" style={{ fontSize: 14 }} aria-label={phoneVisible ? '전화번호 숨기기' : '전화번호 보기'}>
                {displayPhone}
                <span className="text-toss-grey-400 ml-1" style={{ fontSize: 11 }}>{phoneVisible ? '숨기기' : '보기'}</span>
              </button>
            }
            style={{ height: 48 }}
          />
        )}
        <TableRow
          align="space-between" leftRatio={30}
          left={<span className="flex items-center gap-2"><CheckCircle size={16} className="text-toss-grey-400" aria-hidden="true" /><span className="text-toss-grey-500" style={{ fontSize: 14 }}>선물</span></span>}
          right={<span className={contact.birthdayGiftDone ? 'text-toss-green' : 'text-toss-grey-400'} style={{ fontSize: 14, fontWeight: 500 }}>{contact.birthdayGiftDone ? '완료' : '미완료'}</span>}
          style={{ height: 48 }}
        />
      </motion.div>

      {/* Contact History — 마지막 연락 수정 가능 */}
      <motion.div
        initial={motionConfig.safeAnimate({ opacity: 0, y: MOTION_DISTANCE.overlay })}
        animate={motionConfig.safeAnimate({ opacity: 1, y: 0 })}
        transition={{ ...motionConfig.safeTransition('screen'), delay: 0.15 }}
        className="mt-2 bg-[var(--toss-card-bg)]"
      >
        <div className="py-3" style={{ paddingLeft: 24, paddingRight: 24 }}>
          <h3 className="text-toss-grey-900" style={{ fontSize: 15, fontWeight: 700 }}>연락 기록</h3>
        </div>
        <TableRow
          align="space-between" leftRatio={35}
          left={<span className="flex items-center gap-2"><Clock size={16} className="text-toss-grey-400" aria-hidden="true" /><span className="text-toss-grey-500" style={{ fontSize: 14 }}>마지막 연락</span></span>}
          right={
            <button
              onClick={() => setCalendarOpen(true)}
              className="flex items-center gap-1.5 text-toss-blue active:text-toss-blue-600 transition-colors"
              style={{ fontSize: 14, minHeight: 44 }}
              aria-label="마지막 연락일 수정"
            >
              <span>{lastContactFormatted}</span>
              {contact.contactGap >= 7 && (
                <span className="text-toss-grey-400" style={{ fontSize: 11 }}>({formatDate(contact.lastContact)})</span>
              )}
              <Edit2 size={13} className="text-toss-blue ml-0.5" />
            </button>
          }
          style={{ height: 48 }}
        />
        <TableRow
          align="space-between" leftRatio={35}
          left={<span className="text-toss-grey-500" style={{ fontSize: 14, paddingLeft: 24 }}>연락 공백</span>}
          right={
            <span className={`${contact.contactGap >= 30 ? 'text-toss-red' : contact.contactGap >= 14 ? 'text-toss-orange' : 'text-toss-grey-700'}`} style={{ fontSize: 14, fontWeight: 600 }}>
              {contact.contactGap === 0 ? '오늘 연락함' : `연락 안 한지 ${contact.contactGap}일`}
            </span>
          }
          style={{ height: 48 }}
        />

        {/* ProgressBar — 친밀도 + 연락 빈도 */}
        <div style={{ padding: '8px 24px 16px 24px' }} className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-toss-grey-500" style={{ fontSize: 12 }}>친밀도</span>
              <span className="text-toss-grey-700" style={{ fontSize: 12, fontWeight: 600 }}>{contact.closeness}</span>
            </div>
            <ProgressBar progress={closenessValue} size="light" animate aria-label={`친밀도: ${contact.closeness}`} />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-toss-grey-500" style={{ fontSize: 12 }}>연락 빈도</span>
              <span className="text-toss-grey-700" style={{ fontSize: 12, fontWeight: 600 }}>
                {contact.contactGap <= 7 ? '활발' : contact.contactGap <= 14 ? '양호' : contact.contactGap <= 30 ? '보통' : '부족'}
              </span>
            </div>
            <ProgressBar
              progress={contactGapProgress}
              size="light"
              color={contact.contactGap >= 30 ? 'var(--toss-red)' : contact.contactGap >= 14 ? 'var(--toss-orange)' : undefined}
              animate
              aria-label={`연락 빈도: ${contact.contactGap}일 공백`}
            />
          </div>
        </div>
      </motion.div>

      {/* ═══════ 연락 이력 (Interaction Log) ═══════ */}
      <InteractionLogSection contactId={contact.id} lang={lang} motionConfig={motionConfig} />

      {/* ═══════ 태그 섹션 ═══════ */}
      <motion.div
        initial={motionConfig.safeAnimate({ opacity: 0, y: MOTION_DISTANCE.overlay })}
        animate={motionConfig.safeAnimate({ opacity: 1, y: 0 })}
        transition={{ ...motionConfig.safeTransition('screen'), delay: 0.22 }}
        className="mt-2 bg-[var(--toss-card-bg)]"
      >
        <div className="flex items-center justify-between py-3" style={{ paddingLeft: 24, paddingRight: 24 }}>
          <div className="flex items-center gap-2">
            <TagIcon size={15} className="text-toss-grey-400" />
            <h3 className="text-toss-grey-900" style={{ fontSize: 15, fontWeight: 700 }}>태그</h3>
          </div>
          <button
            onClick={() => setTagSheetOpen(true)}
            className="text-toss-blue active:text-toss-blue-600 transition-colors"
            style={{ fontSize: 13, fontWeight: 600, minHeight: 36, padding: '4px 8px' }}
          >
            편집
          </button>
        </div>
        <div style={{ padding: '0 24px 16px' }}>
          {(contact.tags ?? []).length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {(contact.tags ?? []).map((tagId) => {
                const tag = getTagById(tagId);
                if (!tag) return null;
                return (
                  <span
                    key={tagId}
                    className="flex items-center gap-1.5 rounded-full"
                    style={{
                      fontSize: 13,
                      fontWeight: 500,
                      padding: '5px 12px',
                      backgroundColor: tag.color + '18',
                      color: tag.color,
                    }}
                  >
                    <span className="rounded-full" style={{ width: 6, height: 6, backgroundColor: tag.color }} />
                    {tag.label}
                  </span>
                );
              })}
            </div>
          ) : (
            <p className="text-toss-grey-400" style={{ fontSize: 13 }}>
              태그를 추가하여 연락처를 분류해보세요
            </p>
          )}
        </div>
      </motion.div>

      {/* Memo */}
      {contact.memo && (
        <motion.div
          initial={motionConfig.safeAnimate({ opacity: 0, y: MOTION_DISTANCE.overlay })}
          animate={motionConfig.safeAnimate({ opacity: 1, y: 0 })}
          transition={{ ...motionConfig.safeTransition('screen'), delay: 0.25 }}
          className="mt-2 bg-[var(--toss-card-bg)]"
          style={{ padding: '16px 24px' }}
        >
          <h3 className="text-toss-grey-900 mb-2" style={{ fontSize: 15, fontWeight: 700 }}>메모</h3>
          <p className="text-toss-grey-600" style={{ fontSize: 14, lineHeight: 1.6 }}>{contact.memo}</p>
        </motion.div>
      )}

      {/* Delete */}
      <div className="mt-2 bg-[var(--toss-card-bg)] px-6 py-2">
        <button
          onClick={() => setDeleteOpen(true)}
          className="w-full flex items-center gap-3 py-3 text-toss-red"
          style={{ fontSize: 15, minHeight: 44 }}
          aria-label="연락처 삭제"
        >
          <Trash2 size={18} aria-hidden="true" />
          <span>연락처 삭제</span>
        </button>
      </div>

      {/* Bottom CTA */}
      <FixedBottomCTA>
        <TossButton variant="fill" color="primary" size="xlarge" display="full" onClick={() => navigate(`/app/contact/${id}/edit`)}>
          수정하기
        </TossButton>
      </FixedBottomCTA>

      {/* 마지막 연락일 캘린더 바텀시트 */}
      <BottomSheet
        isOpen={calendarOpen}
        onClose={() => setCalendarOpen(false)}
        title="마지막 연락일 수정"
        closeOnDimmerClick
      >
        <div style={{ padding: '0 0 16px' }}>
          <CalendarPicker selectedDate={selectedLastContact} onSelect={handleDateSelect} />
        </div>
      </BottomSheet>

      {/* 메시지 템플릿 편집 바텀시트 */}
      <BottomSheet
        isOpen={templateEditOpen}
        onClose={() => setTemplateEditOpen(false)}
        title={editingOccasion ? `${lang === 'ko' ? OCCASION_META[editingOccasion].labelKo : OCCASION_META[editingOccasion].labelEn} 메시지 편집` : '메시지 편집'}
        closeOnDimmerClick
        footer={
          <TossButton
            variant="fill"
            color="primary"
            size="xlarge"
            display="full"
            onClick={() => {
              if (editingOccasion && contact) {
                setCustomMessage(contact.id, editingOccasion, editingTemplate);
                setAutoMsgRefresh((n) => n + 1);
                toast.openToast('메시지 템플릿을 저장했어요');
              }
              setTemplateEditOpen(false);
            }}
          >
            저장하기
          </TossButton>
        }
      >
        <div style={{ paddingBottom: 8 }}>
          <p className="text-toss-grey-500 mb-3" style={{ fontSize: 12 }}>
            {'{name}을(를) 쓰면 상대방 이름으로 자동 치환돼요'}
          </p>
          <textarea
            value={editingTemplate}
            onChange={(e) => setEditingTemplate(e.target.value)}
            className="w-full bg-toss-grey-50 text-toss-grey-900 rounded-xl outline-none resize-none"
            style={{
              fontSize: 14,
              lineHeight: 1.6,
              padding: 16,
              minHeight: 100,
              border: '1px solid var(--toss-grey-200)',
            }}
            maxLength={200}
            placeholder="메시지를 입력하세요"
          />
          <div className="flex items-center justify-between mt-2">
            <span className="text-toss-grey-400" style={{ fontSize: 11 }}>
              {editingTemplate.length}/200
            </span>
            <button
              onClick={() => {
                if (editingOccasion) {
                  const templates = lang === 'ko' ? DEFAULT_TEMPLATES_KO : DEFAULT_TEMPLATES_EN;
                  setEditingTemplate(templates[editingOccasion]);
                }
              }}
              className="text-toss-blue"
              style={{ fontSize: 12, fontWeight: 600 }}
            >
              기본 템플릿으로 복원
            </button>
          </div>
          {/* 미리보기 */}
          {contact && editingTemplate && (
            <div className="mt-4">
              <p className="text-toss-grey-500 mb-1.5" style={{ fontSize: 12, fontWeight: 600 }}>미리보기</p>
              <div
                className="bg-toss-blue-50 text-toss-grey-800 rounded-xl"
                style={{ fontSize: 14, lineHeight: 1.6, padding: 14 }}
              >
                {renderMessage(editingTemplate, contact.name)}
              </div>
            </div>
          )}
        </div>
      </BottomSheet>

      {/* 발송 시간 선택 바텀시트 */}
      <BottomSheet
        isOpen={timePickerOpen}
        onClose={() => setTimePickerOpen(false)}
        title="발송 시간 설정"
        closeOnDimmerClick
      >
        <div style={{ paddingBottom: 16 }}>
          <p className="text-toss-grey-500 mb-4" style={{ fontSize: 12 }}>
            기념일 당일, 선택한 시간에 메시지를 알려드려요.
          </p>
          <div className="space-y-1">
            {SEND_TIME_OPTIONS.map((opt) => {
              const pref = getAutoMessagePref(contact.id);
              const isSelected = pref.sendTime === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => {
                    setSendTime(contact.id, opt.value);
                    setAutoMsgRefresh((n) => n + 1);
                    setTimePickerOpen(false);
                    toast.openToast(`발송 시간을 ${opt.labelKo}로 설정했어요`);
                  }}
                  className={`w-full flex items-center justify-between transition-colors ${
                    isSelected
                      ? 'bg-toss-blue-50'
                      : 'active:bg-toss-grey-50'
                  }`}
                  style={{
                    padding: '14px 16px',
                    borderRadius: 12,
                    minHeight: 48,
                  }}
                >
                  <span
                    className={isSelected ? 'text-toss-blue' : 'text-toss-grey-800'}
                    style={{ fontSize: 15, fontWeight: isSelected ? 600 : 400 }}
                  >
                    {lang === 'ko' ? opt.labelKo : opt.labelEn}
                  </span>
                  {isSelected && (
                    <CheckCircle size={18} className="text-toss-blue" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </BottomSheet>

      {/* Delete Popup */}
      <Popup
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="연락처를 삭제할까요?"
        description={`${contact.name}님의 연락처를 삭제하면 되돌릴 수 없어요.`}
        confirmText="삭제하기"
        cancelText="취소"
        destructive
        closeOnDimmerClick={false}
        onConfirm={() => {
          removeContact(contact.id);
          navigate('/app/contacts', { replace: true });
        }}
      />

      {/* 태그 편집 바텀시트 */}
      <BottomSheet
        isOpen={tagSheetOpen}
        onClose={() => { setTagSheetOpen(false); setNewTagInput(''); }}
        title="태그 편집"
        closeOnDimmerClick
      >
        <div style={{ paddingBottom: 16 }}>
          {/* 새 태그 추가 */}
          <div className="flex items-center gap-2 mb-4">
            <input
              type="text"
              value={newTagInput}
              onChange={(e) => setNewTagInput(e.target.value.slice(0, 20))}
              className="flex-1 bg-toss-grey-50 text-toss-grey-900 rounded-xl outline-none"
              style={{
                fontSize: 14,
                padding: '10px 16px',
                border: '1px solid var(--toss-grey-200)',
                height: 44,
              }}
              placeholder="새 태그 이름 입력"
              maxLength={20}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newTagInput.trim()) {
                  const newTag = addTag(newTagInput.trim());
                  if (newTag) {
                    const currentTags = contact.tags ?? [];
                    if (!currentTags.includes(newTag.id)) {
                      setContactTags(contact.id, [...currentTags, newTag.id]);
                    }
                  }
                  setNewTagInput('');
                }
              }}
            />
            <button
              onClick={() => {
                if (newTagInput.trim()) {
                  const newTag = addTag(newTagInput.trim());
                  if (newTag) {
                    const currentTags = contact.tags ?? [];
                    if (!currentTags.includes(newTag.id)) {
                      setContactTags(contact.id, [...currentTags, newTag.id]);
                    }
                  }
                  setNewTagInput('');
                }
              }}
              disabled={!newTagInput.trim()}
              className="flex items-center justify-center bg-toss-blue text-white rounded-xl disabled:opacity-40 transition-colors"
              style={{ width: 44, height: 44 }}
              aria-label="태그 추가"
            >
              <Plus size={18} />
            </button>
          </div>

          {/* 기존 태그 선택/해제 */}
          {allTags.length > 0 && (
            <>
              <p className="text-toss-grey-500 mb-2" style={{ fontSize: 12, fontWeight: 600 }}>
                기존 태그
              </p>
              <div className="flex flex-wrap gap-2">
                {allTags.map((tag) => {
                  const isAssigned = (contact.tags ?? []).includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      onClick={() => {
                        const currentTags = contact.tags ?? [];
                        if (isAssigned) {
                          setContactTags(contact.id, currentTags.filter(t => t !== tag.id));
                        } else {
                          setContactTags(contact.id, [...currentTags, tag.id]);
                        }
                      }}
                      className={`flex items-center gap-1.5 transition-all ${
                        isAssigned ? 'border-toss-blue bg-toss-blue-50' : 'border-toss-grey-200'
                      }`}
                      style={{
                        fontSize: 13,
                        fontWeight: isAssigned ? 600 : 400,
                        padding: '7px 14px',
                        borderRadius: 20,
                        borderWidth: 1,
                        borderStyle: 'solid',
                        color: isAssigned ? 'var(--toss-blue-500)' : 'var(--toss-grey-600)',
                      }}
                    >
                      <span
                        className="rounded-full"
                        style={{ width: 8, height: 8, backgroundColor: tag.color }}
                      />
                      {tag.label}
                      {isAssigned && <X size={12} />}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {allTags.length === 0 && !newTagInput && (
            <p className="text-toss-grey-400 text-center py-4" style={{ fontSize: 13 }}>
              위에 태그 이름을 입력하여 첫 태그를 만들어보세요
            </p>
          )}
        </div>
      </BottomSheet>
    </div>
  );
}