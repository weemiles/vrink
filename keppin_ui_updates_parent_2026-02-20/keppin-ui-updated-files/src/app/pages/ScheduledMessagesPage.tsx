import { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import {
  Check, Copy, Send, MessageSquare, MessageCircle,
  Phone, ChevronRight, Sparkles, Plus, Trash2, Edit2, Clock,
} from 'lucide-react';
import {
  getAllScheduledMessagesWithTemplates,
  useAutoMessagePrefs,
  useTaggedTemplates,
  addTaggedTemplate,
  updateTaggedTemplate,
  removeTaggedTemplate,
  markMessageSent,
  unmarkMessageSent,
  renderMessage,
  OCCASION_META,
  ALL_OCCASION_KEYS,
  DEFAULT_TEMPLATES_KO,
  SEND_TIME_OPTIONS,
  getSendTimeLabel,
  type ScheduledMessage,
  type OccasionKey,
  type TaggedTemplate,
} from '../data/autoMessageStore';
import { useContacts, getRelationshipColor, getAllRelationshipOptions } from '../data/contactsStore';
import { ContactAvatar } from '../components/ContactAvatar';
import { NavigationBar } from '../components/NavigationBar';
import { BottomSheet } from '../components/BottomSheet';
import { TossButton } from '../components/TossButton';
import { Switch } from '../components/Switch';
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
   관계 태그 선택 칩
   ═══════════════════════════════════════ */
function RelationTagChip({
  label,
  selected,
  onToggle,
}: {
  label: string;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className={`shrink-0 flex items-center gap-1.5 transition-all ${
        selected
          ? 'border-toss-grey-900 bg-toss-grey-900'
          : 'border-toss-grey-200 bg-[var(--toss-bg)]'
      }`}
      style={{
        ...TYPO.s12,
        fontWeight: selected ? W.semibold : W.medium,
        padding: '7px 14px',
        borderRadius: 20,
        borderWidth: 1,
        borderStyle: 'solid',
        color: selected ? 'var(--primary-foreground)' : 'var(--toss-grey-700)',
      }}
    >
      {selected && <Check size={12} />}
      {label}
    </button>
  );
}

/* ═══════════════════════════════════════
   관계그룹 메시지 카드
   ═══════════════════════════════════════ */
function TemplateMessageCard({
  tpl,
  matchCount,
  onEdit,
  onDelete,
  onToggle,
}: {
  tpl: TaggedTemplate;
  matchCount: number;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
}) {
  const meta = OCCASION_META[tpl.occasion];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[var(--toss-bg)] border border-toss-border-default"
      style={{ borderRadius: 16, overflow: 'hidden' }}
    >
      <div className="flex items-start justify-between" style={{ padding: '14px 14px 8px' }}>
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="inline-block rounded-full"
              style={{ width: 8, height: 8, backgroundColor: meta.color }}
            />
            <span className="text-toss-grey-900" style={{ ...TYPO.t6, fontWeight: W.bold }}>
              {meta.labelKo}
            </span>
            {!tpl.enabled && (
              <span className="text-toss-grey-400" style={{ ...TYPO.s11, fontWeight: W.medium }}>
                OFF
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {tpl.targetTags.map((tag) => (
              <span
                key={tag}
                className="bg-toss-grey-100 text-toss-grey-700"
                style={{ ...TYPO.s11, fontWeight: W.semibold, padding: '3px 10px', borderRadius: 10 }}
              >
                {tag}
              </span>
            ))}
            <span className="text-toss-grey-400" style={TYPO.s11}>{matchCount}명 대상</span>
          </div>
        </div>
        <Switch checked={tpl.enabled} onChange={onToggle} aria-label="메시지 활성화" />
      </div>

      <div style={{ padding: '0 14px 12px' }}>
        <div
          className="bg-toss-grey-50 text-toss-grey-700"
          style={{
            ...TYPO.s13,
            padding: '10px 12px',
            borderRadius: 12,
            lineHeight: 1.5,
          }}
        >
          {tpl.message}
        </div>
      </div>

      <div
        className="flex items-center justify-between border-t border-toss-grey-100"
        style={{ padding: '8px 10px' }}
      >
        <span className="text-toss-grey-400 flex items-center gap-1.5" style={TYPO.s11}>
          <Clock size={12} />
          {tpl.sendTime}
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={onEdit}
            className="flex items-center gap-1 text-toss-grey-500 active:text-toss-grey-700 transition-colors"
            style={{ ...TYPO.s12, padding: '6px 10px', borderRadius: 8, minHeight: 32 }}
          >
            <Edit2 size={13} />
            편집
          </button>
          <button
            onClick={onDelete}
            className="flex items-center gap-1 text-toss-red active:text-toss-red-600 transition-colors"
            style={{ ...TYPO.s12, padding: '6px 10px', borderRadius: 8, minHeight: 32 }}
          >
            <Trash2 size={13} />
            삭제
          </button>
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════
   관계그룹 메시지 편집 시트
   ═══════════════════════════════════════ */
function TemplateEditorSheet({
  isOpen,
  onClose,
  editingTemplate,
  contacts,
  lang,
}: {
  isOpen: boolean;
  onClose: () => void;
  editingTemplate: TaggedTemplate | null;
  contacts: import('../data/contacts').Contact[];
  lang: string;
}) {
  const toast = useToast();
  const allRelOptions = getAllRelationshipOptions();

  const [occasion, setOccasion] = useState<OccasionKey>('birthday');
  const [message, setMessage] = useState(DEFAULT_TEMPLATES_KO.birthday);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sendTime, setSendTime] = useState('09:00');
  const [timePickerOpen, setTimePickerOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setOccasion(editingTemplate?.occasion || 'birthday');
    setMessage(editingTemplate?.message || DEFAULT_TEMPLATES_KO.birthday);
    setSelectedTags(editingTemplate?.targetTags || []);
    setSendTime(editingTemplate?.sendTime || '09:00');
  }, [isOpen, editingTemplate]);

  const matchContacts = useMemo(
    () => contacts.filter((c) => selectedTags.includes(c.relationship)),
    [contacts, selectedTags],
  );

  const handleToggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const handleOccasionChange = (oKey: OccasionKey) => {
    setOccasion(oKey);
    const isDefaultMessage = ALL_OCCASION_KEYS.some((key) => message === DEFAULT_TEMPLATES_KO[key]);
    if (!message.trim() || isDefaultMessage) {
      setMessage(DEFAULT_TEMPLATES_KO[oKey]);
    }
  };

  const handleSave = () => {
    if (selectedTags.length === 0) {
      toast.openToast('관계그룹을 1개 이상 선택해주세요');
      return;
    }
    if (!message.trim()) {
      toast.openToast('메시지를 입력해주세요');
      return;
    }

    if (editingTemplate) {
      updateTaggedTemplate(editingTemplate.id, {
        occasion,
        message: message.trim(),
        targetTags: selectedTags,
        sendTime,
      });
      toast.openToast('관계그룹 메시지를 수정했어요');
    } else {
      addTaggedTemplate({
        occasion,
        message: message.trim(),
        targetTags: selectedTags,
        sendTime,
        enabled: true,
      });
      toast.openToast('관계그룹 메시지를 추가했어요');
    }
    onClose();
  };

  return (
    <>
      <BottomSheet
        isOpen={isOpen}
        onClose={onClose}
        title={editingTemplate ? '관계그룹 메시지 편집' : '관계그룹 메시지 추가'}
        closeOnDimmerClick
        footer={(
          <TossButton variant="fill" color="primary" size="xlarge" display="full" onClick={handleSave}>
            {editingTemplate ? '저장하기' : `${matchContacts.length}명에게 메시지 만들기`}
          </TossButton>
        )}
      >
        <div style={{ paddingBottom: 8 }}>
          <div className="mb-4">
            <p className="text-toss-grey-700 mb-2" style={{ ...TYPO.s13, fontWeight: W.semibold }}>기준 기념일</p>
            <div className="flex flex-wrap gap-2">
              {ALL_OCCASION_KEYS.map((oKey) => {
                const active = occasion === oKey;
                return (
                  <button
                    key={oKey}
                    onClick={() => handleOccasionChange(oKey)}
                    className={`transition-all ${
                      active ? 'border-toss-grey-900 bg-toss-grey-900' : 'border-toss-grey-200 bg-toss-grey-50'
                    }`}
                    style={{
                      ...TYPO.s12,
                      fontWeight: active ? W.semibold : W.medium,
                      padding: '7px 12px',
                      borderRadius: 20,
                      borderWidth: 1,
                      borderStyle: 'solid',
                      color: active ? 'var(--primary-foreground)' : 'var(--toss-grey-600)',
                    }}
                  >
                    {OCCASION_META[oKey].labelKo}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mb-4">
            <p className="text-toss-grey-700 mb-2" style={{ ...TYPO.s13, fontWeight: W.semibold }}>
              관계그룹
            </p>
            <div className="flex flex-wrap gap-2">
              {allRelOptions.map((opt) => (
                <RelationTagChip
                  key={opt.value}
                  label={opt.value}
                  selected={selectedTags.includes(opt.value)}
                  onToggle={() => handleToggleTag(opt.value)}
                />
              ))}
            </div>
            {selectedTags.length > 0 && (
              <p className="text-toss-blue mt-2" style={{ ...TYPO.s11, fontWeight: W.semibold }}>
                {matchContacts.length}명에게 적용돼요
              </p>
            )}
          </div>

          <div className="mb-4">
            <p className="text-toss-grey-700 mb-2" style={{ ...TYPO.s13, fontWeight: W.semibold }}>메시지</p>
            <p className="text-toss-grey-400 mb-2" style={TYPO.s11}>
              {'{name}'}을 쓰면 각 연락처 이름으로 바뀌어요
            </p>
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              className="w-full bg-toss-grey-50 text-toss-grey-900 rounded-xl outline-none resize-none"
              style={{
                fontSize: 14,
                lineHeight: 1.6,
                padding: 16,
                minHeight: 88,
                border: '1px solid var(--toss-grey-200)',
              }}
              maxLength={200}
              placeholder="메시지를 입력하세요"
            />
            <div className="flex items-center justify-between mt-1">
              <span className="text-toss-grey-400" style={TYPO.s11}>{message.length}/200</span>
              <button
                onClick={() => setMessage(DEFAULT_TEMPLATES_KO[occasion])}
                className="text-toss-blue"
                style={{ ...TYPO.s11, fontWeight: W.semibold }}
              >
                기본 템플릿
              </button>
            </div>
          </div>

          <button
            onClick={() => setTimePickerOpen(true)}
            className="w-full flex items-center justify-between active:bg-toss-grey-50 transition-colors"
            style={{
              padding: '12px 14px',
              borderRadius: 12,
              border: '1px solid var(--toss-grey-100)',
              marginBottom: 16,
            }}
          >
            <div className="flex items-center gap-2">
              <Clock size={15} className="text-toss-grey-400" />
              <span className="text-toss-grey-700" style={TYPO.s13}>발송 시간</span>
            </div>
            <span className="text-toss-blue" style={{ ...TYPO.s13, fontWeight: W.semibold }}>
              {getSendTimeLabel(sendTime, lang as 'ko' | 'en')}
            </span>
          </button>

          {message && selectedTags.length > 0 && (
            <div>
              <p className="text-toss-grey-500 mb-2" style={{ ...TYPO.s12, fontWeight: W.semibold }}>미리보기</p>
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {matchContacts.slice(0, 3).map((contact) => (
                  <div
                    key={contact.id}
                    className="bg-toss-grey-50 rounded-xl flex items-start gap-2"
                    style={{ padding: '8px 12px' }}
                  >
                    <span className="text-toss-grey-500 shrink-0" style={{ ...TYPO.s11, fontWeight: W.semibold }}>
                      {contact.name}
                    </span>
                    <span className="text-toss-grey-700" style={{ ...TYPO.s11, lineHeight: 1.4 }}>
                      {renderMessage(message, contact.name)}
                    </span>
                  </div>
                ))}
                {matchContacts.length > 3 && (
                  <p className="text-toss-grey-400 text-center" style={TYPO.s11}>+{matchContacts.length - 3}명 더</p>
                )}
              </div>
            </div>
          )}
        </div>
      </BottomSheet>

      <BottomSheet
        isOpen={timePickerOpen}
        onClose={() => setTimePickerOpen(false)}
        title="발송 시간"
        closeOnDimmerClick
      >
        <div className="space-y-1" style={{ paddingBottom: 16 }}>
          {SEND_TIME_OPTIONS.map((option) => {
            const selected = sendTime === option.value;
            return (
              <button
                key={option.value}
                onClick={() => {
                  setSendTime(option.value);
                  setTimePickerOpen(false);
                }}
                className={`w-full flex items-center justify-between rounded-xl transition-colors ${
                  selected ? 'bg-toss-grey-900' : 'active:bg-toss-grey-50'
                }`}
                style={{ padding: '14px 16px', minHeight: 48 }}
              >
                <span
                  style={{
                    ...TYPO.s13,
                    fontWeight: selected ? W.semibold : W.medium,
                    color: selected ? 'var(--primary-foreground)' : 'var(--toss-grey-700)',
                  }}
                >
                  {lang === 'ko' ? option.labelKo : option.labelEn}
                </span>
                {selected && <Check size={18} style={{ color: 'var(--primary-foreground)' }} />}
              </button>
            );
          })}
        </div>
      </BottomSheet>
    </>
  );
}

/* ═══════════════════════════════════════
   메인: 예약 메시지 대시보드
   ═══════════════════════════════════════ */
export function ScheduledMessagesPage() {
  const toast = useToast();
  const { lang } = useLanguage();
  const mc = useMotionConfig();
  useDocumentTitle('예약 메시지');
  useAutoMessagePrefs(); // 반응성 구독
  const templates = useTaggedTemplates(); // 태그 템플릿 반응성 구독

  const [filter, setFilter] = useState<'all' | OccasionKey>('all');
  const [detailMsg, setDetailMsg] = useState<ScheduledMessage | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [templateEditorOpen, setTemplateEditorOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TaggedTemplate | null>(null);
  const [deleteTemplateId, setDeleteTemplateId] = useState<string | null>(null);

  const contacts = useContacts();
  const templateMatchCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const tpl of templates) {
      counts[tpl.id] = contacts.filter((contact) => tpl.targetTags.includes(contact.relationship)).length;
    }
    return counts;
  }, [templates, contacts]);

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

  const handleTemplateToggle = (tpl: TaggedTemplate) => {
    updateTaggedTemplate(tpl.id, { enabled: !tpl.enabled });
    toast.openToast(tpl.enabled ? '관계그룹 메시지를 비활성화했어요' : '관계그룹 메시지를 활성화했어요');
  };

  const handleTemplateDelete = (id: string) => {
    removeTaggedTemplate(id);
    setDeleteTemplateId(null);
    toast.openToast('관계그룹 메시지를 삭제했어요');
  };

  const handleTemplateNew = () => {
    setEditingTemplate(null);
    setTemplateEditorOpen(true);
  };

  const handleTemplateEdit = (tpl: TaggedTemplate) => {
    setEditingTemplate(tpl);
    setTemplateEditorOpen(true);
  };

  return (
    <div className="min-h-dvh pb-20 bg-toss-grey-50">
      <NavigationBar title="예약 메시지" showBack />

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

      <div style={{ padding: '16px 24px 8px' }}>
        <div
          className="bg-[var(--toss-bg)] border border-toss-border-default"
          style={{ borderRadius: 16, padding: 16 }}
        >
          <div className="flex items-center justify-between gap-3" style={{ marginBottom: 12 }}>
            <div className="min-w-0">
              <h3 className="text-toss-grey-900" style={{ ...TYPO.t6, fontWeight: W.bold }}>
                관계그룹 메시지
              </h3>
              <p className="text-toss-grey-500 mt-1" style={TYPO.s12}>
                메시지 기준으로 관계그룹을 추가/삭제하고 내용을 직접 수정할 수 있어요
              </p>
            </div>
            <button
              onClick={handleTemplateNew}
              className="shrink-0 flex items-center gap-1.5 text-toss-blue active:text-toss-blue-600 transition-colors"
              style={{ ...TYPO.s13, fontWeight: W.semibold, minHeight: 36, padding: '0 4px' }}
            >
              <Plus size={16} />
              추가
            </button>
          </div>

          {templates.length === 0 ? (
            <div className="bg-toss-grey-50 text-toss-grey-500 text-center" style={{ ...TYPO.s12, padding: 12, borderRadius: 12 }}>
              아직 설정된 관계그룹 메시지가 없어요
            </div>
          ) : (
            <div className="space-y-3">
              {templates.map((tpl) => (
                <TemplateMessageCard
                  key={tpl.id}
                  tpl={tpl}
                  matchCount={templateMatchCounts[tpl.id] || 0}
                  onToggle={() => handleTemplateToggle(tpl)}
                  onEdit={() => handleTemplateEdit(tpl)}
                  onDelete={() => setDeleteTemplateId(tpl.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

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

      {templateEditorOpen && (
        <TemplateEditorSheet
          isOpen={templateEditorOpen}
          onClose={() => {
            setTemplateEditorOpen(false);
            setEditingTemplate(null);
          }}
          editingTemplate={editingTemplate}
          contacts={contacts}
          lang={lang}
        />
      )}

      {deleteTemplateId && (
        <BottomSheet
          isOpen={!!deleteTemplateId}
          onClose={() => setDeleteTemplateId(null)}
          title="관계그룹 메시지 삭제"
          closeOnDimmerClick
        >
          <div style={{ paddingBottom: 16 }}>
            <p className="text-toss-grey-600 mb-4" style={TYPO.s13}>
              이 메시지를 삭제할까요? 해당 관계그룹의 예약 메시지에도 반영돼요.
            </p>
            <div className="space-y-2">
              <TossButton
                variant="fill"
                color="primary"
                size="xlarge"
                display="full"
                onClick={() => handleTemplateDelete(deleteTemplateId)}
              >
                삭제하기
              </TossButton>
              <TossButton
                variant="weak"
                color="grey"
                size="xlarge"
                display="full"
                onClick={() => setDeleteTemplateId(null)}
              >
                취소
              </TossButton>
            </div>
          </div>
        </BottomSheet>
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
