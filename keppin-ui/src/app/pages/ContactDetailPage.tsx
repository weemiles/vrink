import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { Calendar, Clock, Trash2, CheckCircle, Phone, MessageCircle, Copy, Star } from 'lucide-react';
import { getContactByIdFromStore, getRelationshipColor, removeContact, toggleFavorite } from '../data/contactsStore';
import { ContactAvatar } from '../components/ContactAvatar';
import { NavigationBar } from '../components/NavigationBar';
import { Popup } from '../components/Popup';
import { TossButton } from '../components/TossButton';
import { TableRow } from '../components/TableRow';
import { Skeleton } from '../components/Skeleton';
import { FixedBottomCTA } from '../components/FixedBottomCTA';
import { useToast } from '../components/useToast';
import { IconButton } from '../components/IconButton';
import { useDelayedLoading } from '../components/useDebounce';
import { useAnalytics } from '../components/useAnalytics';
import { maskPhone, formatBirthday } from '../components/useFormatters';
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

  /* ── 자동 메시지 상태 ── */
  const [autoMsgRefresh, setAutoMsgRefresh] = useState(0);
  const [templateEditOpen, setTemplateEditOpen] = useState(false);
  const [editingOccasion, setEditingOccasion] = useState<OccasionKey | null>(null);
  const [editingTemplate, setEditingTemplate] = useState('');
  const [timePickerOpen, setTimePickerOpen] = useState(false);

  const { lang } = useLanguage();
  const motionConfig = useMotionConfig();
  const showLoading = useDelayedLoading(isInitialLoading, 200);

  const contact = getContactByIdFromStore(id || '');
  useDocumentTitle(contact ? `${contact.name} 상세` : '연락처 상세');

  /* ── 연락처 데이터가 동기적으로 사용 가능하므로 즉시 로딩 해제 ── */
  useEffect(() => {
    setIsInitialLoading(false);
  }, []);

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

  const bdayFormatted = contact.birthday
    ? `${contact.birthday.slice(0, 4)}년 ${formatBirthday(contact.birthday)}`
    : '';
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
              <button
                className="text-toss-blue active:text-toss-blue-600 transition-colors"
                style={{ fontSize: 14, fontWeight: 600, minHeight: 44, padding: '0 8px' }}
                aria-label="연락처 수정"
                onClick={() => {
                  navigate(`/app/contact/${id}/edit`);
                  analytics.trackEvent('click', {
                    screen_name: 'ContactDetail',
                    component_name: 'editButton',
                    action: 'navigate_edit',
                  });
                }}
              >
                수정
              </button>
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
          right={<span className={contact.birthdayGiftDone ? 'text-toss-green' : 'text-toss-grey-400'} style={{ fontSize: 14, fontWeight: 500 }}>{contact.birthdayGiftDone ? '체크' : '미체크'}</span>}
          style={{ height: 48 }}
        />
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
    </div>
  );
}
