import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import {
  Check, Copy, Send, MessageSquare, MessageCircle,
  Phone, ChevronRight, Users, Sparkles,
} from 'lucide-react';
import {
  getAllScheduledMessages,
  getAllScheduledMessagesWithTemplates,
  useAutoMessagePrefs,
  useTaggedTemplates,
  markMessageSent,
  unmarkMessageSent,
  OCCASION_META,
  type ScheduledMessage,
  type OccasionKey,
} from '../data/autoMessageStore';
import { useContacts, getRelationshipColor } from '../data/contactsStore';
import { ContactAvatar } from '../components/ContactAvatar';
import { NavigationBar } from '../components/NavigationBar';
import { BottomSheet } from '../components/BottomSheet';
import { TossButton } from '../components/TossButton';
import { Result } from '../components/Result';
import { useToast } from '../components/useToast';
import { useLanguage } from '../components/useLanguage';
import { useMotionConfig, MOTION_DISTANCE } from '../components/useMotionConfig';
import { useDocumentTitle } from '../components/useDocumentTitle';

/* ─── TDS Typography ─── */
const TYPO = {
  t4: { fontSize: 'var(--typo-4-size)', lineHeight: 'var(--typo-4-lh)' },
  t5: { fontSize: 'var(--typo-5-size)', lineHeight: 'var(--typo-5-lh)' },
  t6: { fontSize: 'var(--typo-6-size)', lineHeight: 'var(--typo-6-lh)' },
  t7: { fontSize: 'var(--typo-7-size)', lineHeight: 'var(--typo-7-lh)' },
  s11: { fontSize: 'var(--typo-sub11-size)', lineHeight: 'var(--typo-sub11-lh)' },
  s12: { fontSize: 'var(--typo-sub12-size)', lineHeight: 'var(--typo-sub12-lh)' },
  s13: { fontSize: 'var(--typo-sub13-size)', lineHeight: 'var(--typo-sub13-lh)' },
} as const;
const W = { medium: 500, semibold: 600, bold: 700 } as const;

/* ═══════════════════════════════════════
   D-Day 뱃지 (작은 버전)
   ═══════════════════════════════════════ */
function DdayBadge({ dday }: { dday: number }) {
  const urgent = dday <= 7;
  return (
    <span
      className={`shrink-0 ${urgent ? 'bg-toss-red-50 text-toss-red' : 'bg-toss-grey-100 text-toss-grey-600'}`}
      style={{ ...TYPO.s11, fontWeight: W.semibold, padding: '3px 8px', borderRadius: 10 }}
    >
      {dday === 0 ? 'D-DAY' : `D-${dday}`}
    </span>
  );
}

/* ═══════════════════════════════════════
   기념일 이모지 뱃지
   ═══════════════════════════════════════ */
function OccasionBadge({ occasion }: { occasion: OccasionKey }) {
  const meta = OCCASION_META[occasion];
  return (
    <span
      className="shrink-0"
      style={{
        ...TYPO.s11,
        fontWeight: W.semibold,
        padding: '3px 8px',
        borderRadius: 10,
        backgroundColor: meta.color + '14',
        color: meta.color,
      }}
    >
      {meta.labelKo}
    </span>
  );
}

/* ═══════════════════════════════════════
   메시지 카드
   ═══════════════════════════════════════ */
function MessageCard({
  msg,
  onTap,
  onSend,
}: {
  msg: ScheduledMessage;
  onTap: () => void;
  onSend: () => void;
}) {
  const contact = useContacts().find((c) => c.id === msg.contactId);
  const relColor = contact ? getRelationshipColor(contact.relationship) : 'var(--toss-grey-900)';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[var(--toss-bg)] border border-toss-border-default"
      style={{ borderRadius: 16, overflow: 'hidden' }}
    >
      {/* 헤더: 받는 사람 + D-day */}
      <button
        onClick={onTap}
        className="w-full flex items-center gap-3 active:bg-toss-grey-50 transition-colors text-left"
        style={{ padding: '16px 16px 8px' }}
      >
        <ContactAvatar name={msg.contactName} color={relColor} size={40} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-toss-grey-900 truncate" style={{ ...TYPO.t6, fontWeight: W.bold }}>
              {msg.contactName}
            </span>
            <OccasionBadge occasion={msg.occasion} />
          </div>
          <span className="text-toss-grey-500" style={TYPO.s12}>
            {msg.scheduledDate.replace(/-/g, '.')}
          </span>
        </div>
        <DdayBadge dday={msg.daysUntil} />
      </button>

      {/* 메시지 미리보기 */}
      <div style={{ padding: '8px 16px 12px' }}>
        <div
          className="bg-toss-grey-50 text-toss-grey-700"
          style={{
            ...TYPO.s13,
            padding: '12px 14px',
            borderRadius: 12,
            lineHeight: 1.5,
          }}
        >
          {msg.message}
        </div>
      </div>

      {/* 액션 바 */}
      <div
        className="flex items-center justify-between border-t border-toss-grey-100"
        style={{ padding: '8px 16px' }}
      >
        {msg.sent ? (
          <div className="flex items-center gap-1.5 text-toss-green" style={TYPO.s12}>
            <Check size={14} />
            <span style={{ fontWeight: W.semibold }}>발송 완료</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-toss-grey-400" style={TYPO.s12}>
            <MessageSquare size={14} />
            <span>예약됨</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <CopyButton text={msg.message} />
          {!msg.sent && (
            <button
              onClick={onSend}
              className="flex items-center gap-1.5 text-toss-blue active:text-toss-blue-600 transition-colors"
              style={{ ...TYPO.s12, fontWeight: W.semibold, padding: '6px 12px', borderRadius: 8, minHeight: 32 }}
            >
              <Send size={13} />
              보내기
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════
   복사 버튼
   ═══════════════════════════════════════ */
function CopyButton({ text }: { text: string }) {
  const toast = useToast();
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      toast.openToast('메시지를 복사했어요');
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      toast.openToast('복사에 실패했어요');
    });
  }, [text, toast]);

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 text-toss-grey-500 active:text-toss-grey-700 transition-colors"
      style={{ ...TYPO.s12, padding: '6px 12px', borderRadius: 8, minHeight: 32 }}
      aria-label="메시지 복사"
    >
      {copied ? <Check size={13} /> : <Copy size={13} />}
      {copied ? '복사됨' : '복사'}
    </button>
  );
}

/* ═══════════════════════════════════════
   메시지 상세 바텀시트
   ═══════════════════════════════════════ */
function MessageDetailSheet({
  msg,
  isOpen,
  onClose,
}: {
  msg: ScheduledMessage | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const toast = useToast();
  const contacts = useContacts();

  if (!msg) return null;

  const meta = OCCASION_META[msg.occasion];
  const contact = contacts.find((c) => c.id === msg.contactId);

  const handleCopy = () => {
    navigator.clipboard.writeText(msg.message).then(() => {
      toast.openToast('메시지를 복사했어요');
    }).catch(() => {
      toast.openToast('복사에 실패했어요');
    });
  };

  const handleSendSMS = () => {
    if (!contact?.phone) {
      toast.openToast('전화번호가 등록되지 않았어요');
      return;
    }
    const encoded = encodeURIComponent(msg.message);
    window.open(`sms:${contact.phone}?body=${encoded}`, '_self');
    markMessageSent(msg.id);
    onClose();
  };

  const handleCall = () => {
    if (!contact?.phone) {
      toast.openToast('전화번호가 등록되지 않았어요');
      return;
    }
    window.open(`tel:${contact.phone}`, '_self');
  };

  const handleMarkSent = () => {
    if (msg.sent) {
      unmarkMessageSent(msg.id);
      toast.openToast('발송 완료를 취소했어요');
    } else {
      markMessageSent(msg.id);
      toast.openToast('메시지를 발송 완료로 표시했어요');
    }
    onClose();
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="메시지 상세" closeOnDimmerClick>
      <div style={{ paddingBottom: 16 }}>
        {/* 받는 사람 */}
        <div className="flex items-center gap-3" style={{ marginBottom: 16 }}>
          <div
            className="flex items-center justify-center"
            style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              backgroundColor: meta.color + '14',
            }}
          >
            <span
              className="inline-block rounded-full"
              style={{ width: 18, height: 18, backgroundColor: meta.color }}
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-toss-grey-900" style={{ ...TYPO.t5, fontWeight: W.bold }}>
                {msg.contactName}
              </span>
              <DdayBadge dday={msg.daysUntil} />
            </div>
            <span className="text-toss-grey-500" style={TYPO.s12}>
              {msg.occasionLabel} · {msg.scheduledDate.replace(/-/g, '.')}
            </span>
          </div>
        </div>

        {/* 메시지 내용 */}
        <div
          className="bg-toss-grey-50 text-toss-grey-800"
          style={{
            fontSize: 15,
            lineHeight: 1.6,
            padding: 16,
            borderRadius: 14,
            marginBottom: 16,
          }}
        >
          {msg.message}
        </div>

        {/* 액션 버튼들 */}
        <div className="space-y-2">
          <TossButton
            variant="fill"
            color="primary"
            size="xlarge"
            display="full"
            onClick={handleCopy}
          >
            <Copy size={16} className="mr-2" />
            메시지 복사하기
          </TossButton>
          <TossButton
            variant={msg.sent ? 'weak' : 'fill'}
            color={msg.sent ? 'grey' : 'secondary'}
            size="xlarge"
            display="full"
            onClick={handleMarkSent}
          >
            <Check size={16} className="mr-2" />
            {msg.sent ? '발송 완료 취소' : '발송 완료로 표시'}
          </TossButton>
          <TossButton
            variant="weak"
            color="grey"
            size="xlarge"
            display="full"
            onClick={handleSendSMS}
          >
            <MessageCircle size={16} className="mr-2" />
            SMS 보내기
          </TossButton>
          <TossButton
            variant="weak"
            color="grey"
            size="xlarge"
            display="full"
            onClick={handleCall}
          >
            <Phone size={16} className="mr-2" />
            전화 걸기
          </TossButton>
          <TossButton
            variant="weak"
            color="grey"
            size="xlarge"
            display="full"
            onClick={() => {
              onClose();
              navigate(`/app/contact/${msg.contactId}`);
            }}
          >
            연락처 상세 보기
            <ChevronRight size={14} className="ml-1" />
          </TossButton>
        </div>
      </div>
    </BottomSheet>
  );
}

/* ═══════════════════════════════════════
   필터 칩
   ═══════════════════════════════════════ */
function FilterChip({
  label,
  active,
  count,
  onTap,
}: {
  label: string;
  active: boolean;
  count: number;
  onTap: () => void;
}) {
  return (
    <button
      onClick={onTap}
      className={`shrink-0 transition-colors ${
        active
          ? 'bg-toss-blue text-[var(--primary-foreground)]'
          : 'bg-toss-grey-100 text-toss-grey-600 active:bg-toss-grey-200'
      }`}
      style={{
        ...TYPO.s12,
        fontWeight: W.semibold,
        padding: '6px 14px',
        borderRadius: 20,
        whiteSpace: 'nowrap',
      }}
    >
      {label}
      {count > 0 && (
        <span
          className={active ? 'opacity-70 text-[var(--primary-foreground)]' : 'text-toss-grey-400'}
          style={{ marginLeft: 4 }}
        >
          {count}
        </span>
      )}
    </button>
  );
}

/* ═══════════════════════════════════════
   메인: 예약 메시지 대시보드
   ═══════════════════════════════════════ */
export function ScheduledMessagesPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { lang } = useLanguage();
  const mc = useMotionConfig();
  useDocumentTitle('예약 메시지');
  useAutoMessagePrefs(); // 반응성 구독
  useTaggedTemplates(); // 태그 템플릿 반응성 구독

  const [filter, setFilter] = useState<'all' | OccasionKey>('all');
  const [detailMsg, setDetailMsg] = useState<ScheduledMessage | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const contacts = useContacts();

  const allMessages = useMemo(
    () => getAllScheduledMessagesWithTemplates(contacts, lang as 'ko' | 'en', 365),
    [contacts, lang],
  );

  const filteredMessages = useMemo(() => {
    if (filter === 'all') return allMessages;
    return allMessages.filter((m) => m.occasion === filter);
  }, [allMessages, filter]);

  // 필터별 카운트
  const countByOccasion = useMemo(() => {
    const counts: Record<string, number> = { all: allMessages.length };
    for (const m of allMessages) {
      counts[m.occasion] = (counts[m.occasion] || 0) + 1;
    }
    return counts;
  }, [allMessages]);

  // 월별 그루핑
  const grouped = useMemo(() => {
    const map = new Map<string, ScheduledMessage[]>();
    for (const m of filteredMessages) {
      const [y, mo] = m.scheduledDate.split('-');
      const key = `${y}-${mo}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(m);
    }
    return [...map.entries()].map(([key, msgs]) => {
      const [y, mo] = key.split('-');
      return {
        key,
        label: `${y}년 ${parseInt(mo)}월`,
        messages: msgs,
      };
    });
  }, [filteredMessages]);

  const handleSend = (msg: ScheduledMessage) => {
    // 메시지를 클립보드에 복사하고 발송 완료로 표시
    navigator.clipboard.writeText(msg.message).then(() => {
      markMessageSent(msg.id);
      toast.openToast('메시지를 복사하고 발송 완료로 표시했어요', {
        button: {
          text: '취소',
          onClick: () => unmarkMessageSent(msg.id),
        },
      });
    }).catch(() => {
      markMessageSent(msg.id);
      toast.openToast('발송 완료로 표시했어요');
    });
  };

  return (
    <div className="min-h-dvh pb-20 bg-toss-grey-50">
      <NavigationBar
        title="예약 메시지"
        showBack
        rightAction={
          <button
            onClick={() => navigate('/app/messages/group')}
            className="flex items-center gap-1.5 text-toss-blue active:text-toss-blue-600 transition-colors"
            style={{ ...TYPO.s13, fontWeight: W.semibold, padding: '8px 4px', minHeight: 44 }}
          >
            <Users size={16} />
            그룹
          </button>
        }
      />

      {/* 헤더 요약 */}
      <motion.div
        initial={mc.safeAnimate({ opacity: 0, y: MOTION_DISTANCE.overlay })}
        animate={mc.safeAnimate({ opacity: 1, y: 0 })}
        transition={mc.safeTransition('screen')}
        className="bg-[var(--toss-bg)]"
        style={{ padding: '8px 24px 20px' }}
      >
        <div className="flex items-center gap-3" style={{ marginBottom: 4 }}>
          <Sparkles size={20} className="text-toss-blue" />
          <h2 className="text-toss-grey-900" style={{ ...TYPO.t4, fontWeight: W.bold }}>
            {allMessages.filter(m => !m.sent).length}개의 메시지가 준비됐어요
          </h2>
        </div>
        <p className="text-toss-grey-500" style={{ ...TYPO.s12, paddingLeft: 32 }}>
          기념일이 되면 알려드릴게요. 메시지를 복사해서 보내세요.
        </p>
      </motion.div>

      {/* 필터 칩 */}
      <div
        className="flex items-center gap-2 overflow-x-auto no-scrollbar"
        style={{ padding: '12px 24px' }}
      >
        <FilterChip
          label="전체"
          active={filter === 'all'}
          count={countByOccasion.all || 0}
          onTap={() => setFilter('all')}
        />
        {ALL_OCCASION_KEYS_FOR_FILTER.map((oKey) => {
          const meta = OCCASION_META[oKey];
          return (
            <FilterChip
              key={oKey}
              label={meta.labelKo}
              active={filter === oKey}
              count={countByOccasion[oKey] || 0}
              onTap={() => setFilter(oKey)}
            />
          );
        })}
      </div>

      {/* 메시지 목록 */}
      {filteredMessages.length === 0 ? (
        <div style={{ padding: '40px 24px' }}>
          <Result
            figure={<span style={{ fontSize: 48 }}>📭</span>}
            title="예약된 메시지가 없어요"
            description="연락처 상세에서 자동 메시지를 켜보세요"
          />
        </div>
      ) : (
        <div style={{ padding: '0 24px' }}>
          <AnimatePresence mode="wait">
            {grouped.map((group) => (
              <div key={group.key} style={{ marginBottom: 24 }}>
                <div
                  className="flex items-center justify-between"
                  style={{ marginBottom: 8, paddingLeft: 4 }}
                >
                  <span className="text-toss-grey-500" style={{ ...TYPO.s12, fontWeight: W.semibold }}>
                    {group.label}
                  </span>
                  <span className="text-toss-grey-400" style={TYPO.s11}>
                    {group.messages.length}건
                  </span>
                </div>
                <div className="space-y-3">
                  {group.messages.map((msg) => (
                    <MessageCard
                      key={msg.id}
                      msg={msg}
                      onTap={() => {
                        setDetailMsg(msg);
                        setDetailOpen(true);
                      }}
                      onSend={() => handleSend(msg)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* 상세 바텀시트 */}
      <MessageDetailSheet
        msg={detailMsg}
        isOpen={detailOpen}
        onClose={() => setDetailOpen(false)}
      />
    </div>
  );
}

/* 필터에서 보여줄 기념일 키 목록 */
const ALL_OCCASION_KEYS_FOR_FILTER: OccasionKey[] = [
  'birthday', 'seollal', 'chuseok', 'christmas', 'newYear', 'parentsDay', 'teachersDay',
];