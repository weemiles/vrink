import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import {
  Plus, Trash2, Edit2, Send, Copy, Check, Clock, Tag, Users,
  ChevronDown, ChevronUp, MessageCircle, Phone, Sparkles, Power,
} from 'lucide-react';
import { useContacts, getRelationshipColor, getAllRelationshipOptions } from '../data/contactsStore';
import {
  useTaggedTemplates,
  useAutoMessagePrefs,
  addTaggedTemplate,
  updateTaggedTemplate,
  removeTaggedTemplate,
  markMessageSent,
  unmarkMessageSent,
  renderMessage,
  getScheduledMessagesFromTemplates,
  OCCASION_META,
  ALL_OCCASION_KEYS,
  DEFAULT_TEMPLATES_KO,
  SEND_TIME_OPTIONS,
  getSendTimeLabel,
  type OccasionKey,
  type TaggedTemplate,
  type ScheduledMessage,
} from '../data/autoMessageStore';
import { ContactAvatar } from '../components/ContactAvatar';
import { NavigationBar } from '../components/NavigationBar';
import { BottomSheet } from '../components/BottomSheet';
import { TossButton } from '../components/TossButton';
import { Switch } from '../components/Switch';
import { Result } from '../components/Result';
import { useToast } from '../components/useToast';
import { useLanguage } from '../components/useLanguage';
import { useMotionConfig, MOTION_DISTANCE } from '../components/useMotionConfig';

/* ─── TDS Typography ─── */
const T = {
  t4: { fontSize: 'var(--typo-4-size)', lineHeight: 'var(--typo-4-lh)' } as const,
  t5: { fontSize: 'var(--typo-5-size)', lineHeight: 'var(--typo-5-lh)' } as const,
  t6: { fontSize: 'var(--typo-6-size)', lineHeight: 'var(--typo-6-lh)' } as const,
  s11: { fontSize: 'var(--typo-sub11-size)', lineHeight: 'var(--typo-sub11-lh)' } as const,
  s12: { fontSize: 'var(--typo-sub12-size)', lineHeight: 'var(--typo-sub12-lh)' } as const,
  s13: { fontSize: 'var(--typo-sub13-size)', lineHeight: 'var(--typo-sub13-lh)' } as const,
};
const W = { medium: 500, semibold: 600, bold: 700 } as const;

/* ═══════════════════════════════════════
   관계 태그 칩 (선택 가능)
   ═══════════════════════════════════════ */
function TagChip({
  label,
  selected,
  onToggle,
  color,
}: {
  label: string;
  selected: boolean;
  onToggle: () => void;
  color: string;
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
        ...T.s12,
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
   템플릿 카드
   ═══════════════════════════════════════ */
function TemplateCard({
  tpl,
  matchCount,
  onEdit,
  onDelete,
  onToggle,
  onExpand,
  expanded,
  contacts,
  lang,
}: {
  tpl: TaggedTemplate;
  matchCount: number;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
  onExpand: () => void;
  expanded: boolean;
  contacts: import('../data/contacts').Contact[];
  lang: string;
}) {
  const toast = useToast();
  const navigate = useNavigate();

  const meta = OCCASION_META[tpl.occasion];
  const matchingContacts = contacts.filter((c) => tpl.targetTags.includes(c.relationship));

  const handleCopyAll = () => {
    const text = matchingContacts
      .map((c) => `[${c.name}] ${renderMessage(tpl.message, c.name)}`)
      .join('\n\n');
    navigator.clipboard.writeText(text).then(() => {
      toast.openToast(`${matchingContacts.length}명 메시지를 복사했어요`);
    }).catch(() => toast.openToast('복사에 실패했어요'));
  };

  const handleSendSMS = (contact: import('../data/contacts').Contact) => {
    if (!contact.phone) {
      toast.openToast('전화번호가 등록되지 않았어요');
      return;
    }
    const msg = renderMessage(tpl.message, contact.name);
    const encoded = encodeURIComponent(msg);
    window.open(`sms:${contact.phone}?body=${encoded}`, '_self');
  };

  const handleCall = (contact: import('../data/contacts').Contact) => {
    if (!contact.phone) {
      toast.openToast('전화번호가 등록되지 않았어요');
      return;
    }
    window.open(`tel:${contact.phone}`, '_self');
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="bg-[var(--toss-card-bg)] border border-toss-border-default"
      style={{ borderRadius: 16, overflow: 'hidden' }}
    >
      {/* 헤더 */}
      <div className="flex items-start justify-between" style={{ padding: '16px 16px 0' }}>
        <button onClick={onExpand} className="flex-1 text-left">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="inline-block rounded-full"
              style={{ width: 8, height: 8, backgroundColor: meta.color }}
            />
            <span className="text-toss-grey-900" style={{ ...T.t6, fontWeight: W.bold }}>
              {meta.labelKo}
            </span>
            {!tpl.enabled && (
              <span className="text-toss-grey-400" style={{ ...T.s11, fontWeight: W.medium }}>OFF</span>
            )}
          </div>
        </button>
        <Switch checked={tpl.enabled} onChange={onToggle} aria-label="메시지 활성화" />
      </div>

      {/* 태그 목록 */}
      <div
        className="flex items-center gap-1.5 flex-wrap"
        style={{ padding: '8px 16px' }}
      >
        <Tag size={12} className="text-toss-grey-400 shrink-0" />
        {tpl.targetTags.map((tag) => (
          <span
            key={tag}
            className="bg-toss-grey-100 text-toss-grey-700"
            style={{
              ...T.s11,
              fontWeight: W.semibold,
              padding: '3px 10px',
              borderRadius: 10,
            }}
          >
            {tag}
          </span>
        ))}
        <span className="text-toss-grey-400 ml-1" style={T.s11}>
          {matchCount}명 대상
        </span>
      </div>

      {/* 메시지 미리보기 */}
      <div style={{ padding: '4px 16px 12px' }}>
        <div
          className="bg-toss-grey-50 text-toss-grey-700"
          style={{ ...T.s13, padding: '10px 14px', borderRadius: 12, lineHeight: 1.5 }}
        >
          {tpl.message}
        </div>
      </div>

      {/* 액션 바 */}
      <div
        className="flex items-center justify-between border-t border-toss-grey-100"
        style={{ padding: '8px 12px' }}
      >
        <div className="flex items-center gap-1">
          <button
            onClick={onEdit}
            className="flex items-center gap-1 text-toss-grey-500 active:text-toss-grey-700 transition-colors"
            style={{ ...T.s12, padding: '6px 10px', borderRadius: 8, minHeight: 32 }}
          >
            <Edit2 size={13} /> 편집
          </button>
          <button
            onClick={onDelete}
            className="flex items-center gap-1 text-toss-red active:text-toss-red-600 transition-colors"
            style={{ ...T.s12, padding: '6px 10px', borderRadius: 8, minHeight: 32 }}
          >
            <Trash2 size={13} /> 삭제
          </button>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleCopyAll}
            className="flex items-center gap-1 text-toss-grey-500 active:text-toss-grey-700 transition-colors"
            style={{ ...T.s12, fontWeight: W.semibold, padding: '6px 10px', borderRadius: 8, minHeight: 32 }}
          >
            <Copy size={13} /> 전체 복사
          </button>
          <button
            onClick={onExpand}
            className="flex items-center gap-1 text-toss-blue active:text-toss-blue-600 transition-colors"
            style={{ ...T.s12, fontWeight: W.semibold, padding: '6px 10px', borderRadius: 8, minHeight: 32 }}
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {expanded ? '접기' : `${matchCount}명`}
          </button>
        </div>
      </div>

      {/* 확장: 대상 연락처 리스트 + 개별 전화/문자 */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden' }}
          >
            <div className="border-t border-toss-grey-100" style={{ padding: '8px 8px 12px' }}>
              {matchingContacts.length === 0 ? (
                <p className="text-toss-grey-400 text-center py-4" style={T.s12}>
                  선택한 관계 태그에 해당하는 연락처가 없어요
                </p>
              ) : (
                matchingContacts.map((c) => {
                  const relColor = getRelationshipColor(c.relationship);
                  return (
                    <div
                      key={c.id}
                      className="flex items-center justify-between rounded-xl"
                      style={{ padding: '8px 8px', minHeight: 52 }}
                    >
                      <button
                        onClick={() => navigate(`/app/contact/${c.id}`)}
                        className="flex items-center gap-3 flex-1 min-w-0 active:bg-toss-grey-50 rounded-lg transition-colors"
                        style={{ padding: '4px 0' }}
                      >
                        <ContactAvatar name={c.name} color={relColor} size={36} />
                        <div className="text-left min-w-0">
                          <span className="text-toss-grey-900 truncate block" style={{ ...T.s13, fontWeight: W.semibold }}>
                            {c.name}
                          </span>
                          {c.phone && (
                            <span className="text-toss-grey-400" style={T.s11}>{c.phone}</span>
                          )}
                        </div>
                      </button>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleCall(c)}
                          disabled={!c.phone}
                          className={`flex items-center justify-center rounded-full transition-colors ${
                            c.phone ? 'text-toss-blue active:bg-toss-blue-50' : 'text-toss-grey-300'
                          }`}
                          style={{ width: 36, height: 36 }}
                          aria-label={`${c.name}에게 전화`}
                        >
                          <Phone size={16} />
                        </button>
                        <button
                          onClick={() => handleSendSMS(c)}
                          disabled={!c.phone}
                          className={`flex items-center justify-center rounded-full transition-colors ${
                            c.phone ? 'text-toss-green active:bg-toss-green/10' : 'text-toss-grey-300'
                          }`}
                          style={{ width: 36, height: 36 }}
                          aria-label={`${c.name}에게 문자`}
                        >
                          <MessageCircle size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ═══════════════════════════════════════
   새 템플릿 만들기 / 편집 바텀시트
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
  editingTemplate: TaggedTemplate | null; // null = 새로 만들기
  contacts: import('../data/contacts').Contact[];
  lang: string;
}) {
  const toast = useToast();
  const allRelOptions = getAllRelationshipOptions();

  const [occasion, setOccasion] = useState<OccasionKey>(editingTemplate?.occasion || 'birthday');
  const [message, setMessage] = useState(editingTemplate?.message || DEFAULT_TEMPLATES_KO.birthday);
  const [selectedTags, setSelectedTags] = useState<string[]>(editingTemplate?.targetTags || []);
  const [sendTime, setSendTime] = useState(editingTemplate?.sendTime || '09:00');
  const [timePickerOpen, setTimePickerOpen] = useState(false);

  const matchCount = contacts.filter((c) => selectedTags.includes(c.relationship)).length;

  // editingTemplate 변경 시 동기화
  const resetForm = useCallback((tpl: TaggedTemplate | null) => {
    setOccasion(tpl?.occasion || 'birthday');
    setMessage(tpl?.message || DEFAULT_TEMPLATES_KO.birthday);
    setSelectedTags(tpl?.targetTags || []);
    setSendTime(tpl?.sendTime || '09:00');
  }, []);

  // isOpen이 변할 때 폼 초기화
  useState(() => { resetForm(editingTemplate); });

  const handleToggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const handleOccasionChange = (oKey: OccasionKey) => {
    setOccasion(oKey);
    // 메시지가 기본 템플릿이면 자동 교체
    const isDefault = ALL_OCCASION_KEYS.some((k) => message === DEFAULT_TEMPLATES_KO[k]);
    if (isDefault || !message) {
      setMessage(DEFAULT_TEMPLATES_KO[oKey]);
    }
  };

  const handleSave = () => {
    if (selectedTags.length === 0) {
      toast.openToast('관계 태그를 1개 이상 선택해주세요');
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
      toast.openToast('메시지 템플릿을 수정했어요');
    } else {
      addTaggedTemplate({
        occasion,
        message: message.trim(),
        targetTags: selectedTags,
        sendTime,
        enabled: true,
      });
      toast.openToast(`${matchCount}명 대상으로 메시지를 만들었어요`);
    }
    onClose();
  };

  return (
    <>
      <BottomSheet
        isOpen={isOpen}
        onClose={onClose}
        title={editingTemplate ? '메시지 편집' : '새 메시지 만들기'}
        closeOnDimmerClick
        footer={
          <TossButton variant="fill" color="primary" size="xlarge" display="full" onClick={handleSave}>
            {editingTemplate ? '저장하기' : `${matchCount}명에게 메시지 만들기`}
          </TossButton>
        }
      >
        <div style={{ paddingBottom: 8 }}>
          {/* 1) 기념일 선택 */}
          <div className="mb-4">
            <p className="text-toss-grey-700 mb-2" style={{ ...T.s13, fontWeight: W.semibold }}>기념일</p>
            <div className="flex flex-wrap gap-2">
              {ALL_OCCASION_KEYS.map((oKey) => {
                const meta = OCCASION_META[oKey];
                const active = occasion === oKey;
                return (
                  <button
                    key={oKey}
                    onClick={() => handleOccasionChange(oKey)}
                    className={`transition-all ${
                      active ? 'border-toss-grey-900 bg-toss-grey-900' : 'border-toss-grey-200 bg-toss-grey-50'
                    }`}
                    style={{
                      ...T.s12,
                      fontWeight: active ? W.semibold : W.medium,
                      padding: '7px 14px',
                      borderRadius: 20,
                      borderWidth: 1,
                      borderStyle: 'solid',
                      color: active ? 'var(--primary-foreground)' : 'var(--toss-grey-600)',
                    }}
                  >
                    {meta.labelKo}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2) 관계 태그 선택 */}
          <div className="mb-4">
            <p className="text-toss-grey-700 mb-2" style={{ ...T.s13, fontWeight: W.semibold }}>
              보낼 대상 — 관계 태그
            </p>
            <div className="flex flex-wrap gap-2">
              {allRelOptions.map((opt) => (
                <TagChip
                  key={opt.value}
                  label={opt.value}
                  selected={selectedTags.includes(opt.value)}
                  onToggle={() => handleToggleTag(opt.value)}
                  color={opt.color}
                />
              ))}
            </div>
            {selectedTags.length > 0 && (
              <p className="text-toss-blue mt-2" style={{ ...T.s11, fontWeight: W.semibold }}>
                {matchCount}명의 연락처에 적용돼요
              </p>
            )}
          </div>

          {/* 3) 메시지 입력 */}
          <div className="mb-4">
            <p className="text-toss-grey-700 mb-2" style={{ ...T.s13, fontWeight: W.semibold }}>메시지</p>
            <p className="text-toss-grey-400 mb-2" style={T.s11}>
              {'{name}'}을 쓰면 각 연락처 이름으로 치환돼요
            </p>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full bg-toss-grey-50 text-toss-grey-900 rounded-xl outline-none resize-none"
              style={{
                fontSize: 14,
                lineHeight: 1.6,
                padding: 16,
                minHeight: 80,
                border: '1px solid var(--toss-grey-200)',
              }}
              maxLength={200}
              placeholder="메시지를 입력하세요"
            />
            <div className="flex items-center justify-between mt-1">
              <span className="text-toss-grey-400" style={T.s11}>{message.length}/200</span>
              <button
                onClick={() => setMessage(DEFAULT_TEMPLATES_KO[occasion])}
                className="text-toss-blue"
                style={{ ...T.s11, fontWeight: W.semibold }}
              >
                기본 템플릿
              </button>
            </div>
          </div>

          {/* 4) 발송 시간 */}
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
              <span className="text-toss-grey-700" style={T.s13}>발송 시간</span>
            </div>
            <span className="text-toss-blue" style={{ ...T.s13, fontWeight: W.semibold }}>
              {getSendTimeLabel(sendTime, lang as 'ko' | 'en')}
            </span>
          </button>

          {/* 미리보기 */}
          {message && selectedTags.length > 0 && (
            <div>
              <p className="text-toss-grey-500 mb-2" style={{ ...T.s12, fontWeight: W.semibold }}>미리보기</p>
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {contacts
                  .filter((c) => selectedTags.includes(c.relationship))
                  .slice(0, 3)
                  .map((c) => (
                    <div
                      key={c.id}
                      className="bg-toss-grey-50 rounded-xl flex items-start gap-2"
                      style={{ padding: '8px 12px' }}
                    >
                      <span className="text-toss-grey-500 shrink-0" style={{ ...T.s11, fontWeight: W.semibold }}>
                        {c.name}
                      </span>
                      <span className="text-toss-grey-700" style={{ ...T.s11, lineHeight: 1.4 }}>
                        {renderMessage(message, c.name)}
                      </span>
                    </div>
                  ))}
                {matchCount > 3 && (
                  <p className="text-toss-grey-400 text-center" style={T.s11}>
                    +{matchCount - 3}명 더
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </BottomSheet>

      {/* 발송 시간 서브시트 */}
      <BottomSheet
        isOpen={timePickerOpen}
        onClose={() => setTimePickerOpen(false)}
        title="발송 시간"
        closeOnDimmerClick
      >
        <div className="space-y-1" style={{ paddingBottom: 16 }}>
          {SEND_TIME_OPTIONS.map((opt) => {
            const isSelected = sendTime === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => { setSendTime(opt.value); setTimePickerOpen(false); }}
                className={`w-full flex items-center justify-between rounded-xl transition-colors ${
                  isSelected ? 'bg-toss-grey-900' : 'active:bg-toss-grey-50'
                }`}
                style={{ padding: '14px 16px', minHeight: 48 }}
              >
                <span
                  style={{
                    ...T.s13,
                    fontWeight: isSelected ? W.semibold : W.medium,
                    color: isSelected ? 'var(--primary-foreground)' : 'var(--toss-grey-700)',
                  }}
                >
                  {lang === 'ko' ? opt.labelKo : opt.labelEn}
                </span>
                {isSelected && <Check size={18} style={{ color: 'var(--primary-foreground)' }} />}
              </button>
            );
          })}
        </div>
      </BottomSheet>
    </>
  );
}

/* ═══════════════════════════════════════
   GroupMessagePage — 메인
   ═══════════════════════════════════════ */
export function GroupMessagePage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { lang } = useLanguage();
  const mc = useMotionConfig();
  const contacts = useContacts();
  const templates = useTaggedTemplates();
  useAutoMessagePrefs(); // 반응성 구독

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingTpl, setEditingTpl] = useState<TaggedTemplate | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const matchCounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const tpl of templates) {
      map[tpl.id] = contacts.filter((c) => tpl.targetTags.includes(c.relationship)).length;
    }
    return map;
  }, [templates, contacts]);

  const totalMessages = useMemo(() => {
    return getScheduledMessagesFromTemplates(contacts, lang as 'ko' | 'en', 365);
  }, [contacts, templates, lang]);

  const pendingCount = totalMessages.filter((m) => !m.sent).length;

  const handleNew = () => {
    setEditingTpl(null);
    setEditorOpen(true);
  };

  const handleEdit = (tpl: TaggedTemplate) => {
    setEditingTpl(tpl);
    setEditorOpen(true);
  };

  const handleDelete = (id: string) => {
    removeTaggedTemplate(id);
    toast.openToast('메시지 템플릿을 삭제했어요');
    setDeleteConfirm(null);
  };

  const handleToggle = (tpl: TaggedTemplate) => {
    updateTaggedTemplate(tpl.id, { enabled: !tpl.enabled });
    toast.openToast(tpl.enabled ? '메시지를 비활성화했어요' : '메시지를 활성화했어요');
  };

  return (
    <div className="min-h-dvh pb-20 bg-toss-grey-50">
      <NavigationBar
        title="그룹 메시지"
        showBack
        rightAction={
          <button
            onClick={() => navigate('/app/messages')}
            className="text-toss-blue active:text-toss-blue-600 transition-colors"
            style={{ ...T.s13, fontWeight: W.semibold, padding: '8px 4px', minHeight: 44 }}
          >
            전체 보기
          </button>
        }
      />

      {/* 헤더 */}
      <motion.div
        initial={mc.safeAnimate({ opacity: 0, y: MOTION_DISTANCE.overlay })}
        animate={mc.safeAnimate({ opacity: 1, y: 0 })}
        transition={mc.safeTransition('screen')}
        className="bg-[var(--toss-bg)]"
        style={{ padding: '8px 24px 20px' }}
      >
        <div className="flex items-center gap-3 mb-1">
          <Tag size={20} className="text-toss-blue" />
          <h2 className="text-toss-grey-900" style={{ ...T.t4, fontWeight: W.bold }}>
            관계 태그로 묶어 보내요
          </h2>
        </div>
        <p className="text-toss-grey-500" style={{ ...T.s12, paddingLeft: 32 }}>
          메시지마다 관계 태그를 지정하면, 해당 태그의 모든 연락처에 적용돼요
        </p>
        {pendingCount > 0 && (
          <div
            className="mt-3 flex items-center gap-2 bg-toss-grey-100 rounded-xl"
            style={{ padding: '10px 14px', marginLeft: 32 }}
          >
            <Sparkles size={14} className="text-toss-grey-700" />
            <span className="text-toss-grey-700" style={{ ...T.s12, fontWeight: W.semibold }}>
              태그 메시지에서 {pendingCount}건 발송 대기
            </span>
          </div>
        )}
      </motion.div>

      {/* 새 메시지 만들기 버튼 */}
      <div style={{ padding: '16px 20px 8px' }}>
        <TossButton
          variant="weak"
          color="grey"
          size="large"
          display="full"
          onClick={handleNew}
        >
          <Plus size={18} className="mr-2" />
          새 메시지 만들기
        </TossButton>
      </div>

      {/* 템플릿 목록 */}
      {templates.length === 0 ? (
        <div style={{ padding: '40px 24px' }}>
          <Result
            figure={<Tag size={48} className="text-toss-grey-300" />}
            title="아직 만든 메시지가 없어요"
            description="위 버튼을 눌러 관계 태그별 메시지를 만들어보세요"
          />
        </div>
      ) : (
        <div className="space-y-3" style={{ padding: '8px 20px' }}>
          <AnimatePresence>
            {templates.map((tpl) => (
              <TemplateCard
                key={tpl.id}
                tpl={tpl}
                matchCount={matchCounts[tpl.id] || 0}
                onEdit={() => handleEdit(tpl)}
                onDelete={() => setDeleteConfirm(tpl.id)}
                onToggle={() => handleToggle(tpl)}
                onExpand={() => setExpandedId(expandedId === tpl.id ? null : tpl.id)}
                expanded={expandedId === tpl.id}
                contacts={contacts}
                lang={lang}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* 에디터 시트 */}
      {editorOpen && (
        <TemplateEditorSheet
          isOpen={editorOpen}
          onClose={() => { setEditorOpen(false); setEditingTpl(null); }}
          editingTemplate={editingTpl}
          contacts={contacts}
          lang={lang}
        />
      )}

      {/* 삭제 확인 */}
      {deleteConfirm && (
        <BottomSheet
          isOpen={!!deleteConfirm}
          onClose={() => setDeleteConfirm(null)}
          title="메시지 삭제"
          closeOnDimmerClick
        >
          <div style={{ paddingBottom: 16 }}>
            <p className="text-toss-grey-600 mb-4" style={T.s13}>
              이 메시지 템플릿을 삭제할까요? 관련 예약 메시지도 함께 사라져요.
            </p>
            <div className="space-y-2">
              <TossButton
                variant="fill"
                color="primary"
                size="xlarge"
                display="full"
                onClick={() => handleDelete(deleteConfirm)}
              >
                삭제하기
              </TossButton>
              <TossButton
                variant="weak"
                color="grey"
                size="xlarge"
                display="full"
                onClick={() => setDeleteConfirm(null)}
              >
                취소
              </TossButton>
            </div>
          </div>
        </BottomSheet>
      )}
    </div>
  );
}