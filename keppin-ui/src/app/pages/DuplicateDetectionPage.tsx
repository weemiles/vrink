import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search, ChevronRight, GitMerge, Check, AlertTriangle,
  Phone, Calendar, Users, ArrowRight, Sparkles,
} from 'lucide-react';
import { useContacts, mergeContacts } from '../data/contactsStore';
import {
  detectDuplicates,
  createDefaultMergeChoice,
  reasonLabel,
  confidenceLabel,
  type DuplicateGroup,
  type MergeFieldChoice,
} from '../data/duplicateDetector';
import type { Contact } from '../data/contacts';
import { ContactAvatar } from '../components/ContactAvatar';
import { NavigationBar } from '../components/NavigationBar';
import { TossButton } from '../components/TossButton';
import { BottomSheet } from '../components/BottomSheet';
import { Popup } from '../components/Popup';
import { useToast } from '../components/useToast';
import { useLanguage } from '../components/useLanguage';
import { useDocumentTitle } from '../components/useDocumentTitle';
import { useMotionConfig, MOTION_DISTANCE } from '../components/useMotionConfig';

/* ─── TDS Typography ─── */
const T = {
  t4: { fontSize: 'var(--typo-4-size)', lineHeight: 'var(--typo-4-lh)' } as const,
  t5: { fontSize: 'var(--typo-5-size)', lineHeight: 'var(--typo-5-lh)' } as const,
  t6: { fontSize: 'var(--typo-6-size)', lineHeight: 'var(--typo-6-lh)' } as const,
  t7: { fontSize: 'var(--typo-7-size)', lineHeight: 'var(--typo-7-lh)' } as const,
  s12: { fontSize: 'var(--typo-sub12-size)', lineHeight: 'var(--typo-sub12-lh)' } as const,
};
const W = { medium: 500, semibold: 600, bold: 700 };
const PX = 24;

/* ═══════════════════════════════════════════════
   필드 정의 — 병합 시 선택할 수 있는 필드
   ═══════════════════════════════════════════════ */

interface MergeField {
  key: keyof MergeFieldChoice;
  label: string;
  labelEn: string;
  format: (val: unknown, contact: Contact) => string;
}

const MERGE_FIELDS: MergeField[] = [
  {
    key: 'name',
    label: '이름',
    labelEn: 'Name',
    format: (v) => String(v || ''),
  },
  {
    key: 'phone',
    label: '전화번호',
    labelEn: 'Phone',
    format: (v) => (v ? String(v) : '-'),
  },
  {
    key: 'birthday',
    label: '생년월일',
    labelEn: 'Birthday',
    format: (v, c) => (c.birthdayUnknown ? '모름' : String(v || '-')),
  },
  {
    key: 'relationship',
    label: '관계',
    labelEn: 'Relationship',
    format: (v) => String(v || '-'),
  },
  {
    key: 'closeness',
    label: '친밀도',
    labelEn: 'Closeness',
    format: (v) => String(v || '-'),
  },
  {
    key: 'familyStatus',
    label: '가족상태',
    labelEn: 'Family Status',
    format: (v) => String(v || '-'),
  },
  {
    key: 'memo',
    label: '메모',
    labelEn: 'Memo',
    format: (v) => (v ? String(v).slice(0, 40) + (String(v).length > 40 ? '…' : '') : '-'),
  },
  {
    key: 'lastContact',
    label: '마지막 연락',
    labelEn: 'Last Contact',
    format: (v) => String(v || '-'),
  },
];

/* ═══════════════════════════════════════════════
   메인 컴포넌트
   ═══════════════════════════════════════════════ */

export function DuplicateDetectionPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { lang } = useLanguage();
  const mc = useMotionConfig();
  useDocumentTitle(lang === 'ko' ? '중복 연락처 관리' : 'Duplicate Contacts');

  const contacts = useContacts();
  const duplicateGroups = useMemo(() => detectDuplicates(contacts), [contacts]);

  /* ── 병합 상태 ── */
  const [selectedGroup, setSelectedGroup] = useState<DuplicateGroup | null>(null);
  const [mergeSheet, setMergeSheet] = useState(false);

  // 병합 시 primary(유지)와 secondary(삭제) 선택
  const [primaryId, setPrimaryId] = useState<string>('');
  const [secondaryId, setSecondaryId] = useState<string>('');

  // 각 필드별 선택: 'primary' | 'secondary'
  const [fieldChoices, setFieldChoices] = useState<Record<string, 'primary' | 'secondary'>>({});

  // 병합 확인 팝업
  const [confirmOpen, setConfirmOpen] = useState(false);

  /* ── 그룹 선택 → 병합 시트 열기 ── */
  const openMerge = useCallback((group: DuplicateGroup) => {
    if (group.contacts.length < 2) return;
    setSelectedGroup(group);
    setPrimaryId(group.contacts[0].id);
    setSecondaryId(group.contacts[1].id);

    // 기본값: 모든 필드 primary
    const defaults: Record<string, 'primary' | 'secondary'> = {};
    const p = group.contacts[0];
    const s = group.contacts[1];
    MERGE_FIELDS.forEach((f) => {
      // 기본적으로 primary, 단 primary에 값이 없고 secondary에 있으면 secondary
      const pVal = p[f.key as keyof Contact];
      const sVal = s[f.key as keyof Contact];
      if (!pVal && sVal) {
        defaults[f.key] = 'secondary';
      } else {
        defaults[f.key] = 'primary';
      }
    });
    setFieldChoices(defaults);
    setMergeSheet(true);
  }, []);

  /* ── 병합 실행 ── */
  const handleMerge = useCallback(() => {
    if (!selectedGroup) return;
    const primary = selectedGroup.contacts.find((c) => c.id === primaryId);
    const secondary = selectedGroup.contacts.find((c) => c.id === secondaryId);
    if (!primary || !secondary) return;

    // 필드별 선택 결과 조합
    const mergedFields: Partial<MergeFieldChoice> = {};
    MERGE_FIELDS.forEach((f) => {
      const source = fieldChoices[f.key] === 'secondary' ? secondary : primary;
      (mergedFields as any)[f.key] = source[f.key as keyof Contact];
    });

    // isFavorite 병합 (둘 중 하나라도 즐겨찾기면 유지)
    mergedFields.isFavorite = (primary.isFavorite ?? false) || (secondary.isFavorite ?? false);

    const result = mergeContacts(primaryId, secondaryId, mergedFields);

    if (result) {
      toast.openToast(
        lang === 'ko'
          ? `"${result.name}"(으)로 병합 완료`
          : `Merged into "${result.name}"`,
      );
    } else {
      toast.openToast(lang === 'ko' ? '병합에 실패했습니다' : 'Merge failed');
    }

    setConfirmOpen(false);
    setMergeSheet(false);
    setSelectedGroup(null);
  }, [selectedGroup, primaryId, secondaryId, fieldChoices, lang, toast]);

  /* ── primary / secondary 교체 ── */
  const swapPrimarySecondary = useCallback(() => {
    setPrimaryId((prev) => {
      setSecondaryId(prev);
      return secondaryId;
    });
    // 필드 선택도 반전
    setFieldChoices((prev) => {
      const swapped: Record<string, 'primary' | 'secondary'> = {};
      Object.entries(prev).forEach(([k, v]) => {
        swapped[k] = v === 'primary' ? 'secondary' : 'primary';
      });
      return swapped;
    });
  }, [secondaryId]);

  /* 렌더용: primary/secondary Contact */
  const primaryContact = selectedGroup?.contacts.find((c) => c.id === primaryId);
  const secondaryContact = selectedGroup?.contacts.find((c) => c.id === secondaryId);

  return (
    <div className="min-h-dvh bg-[var(--toss-bg)]">
      <NavigationBar
        title={lang === 'ko' ? '중복 연락처 관리' : 'Duplicate Contacts'}
        onBack={() => navigate(-1)}
      />

      {/* 헤더 설명 */}
      <motion.div
        initial={mc.safeAnimate({ opacity: 0, y: MOTION_DISTANCE.card })}
        animate={mc.safeAnimate({ opacity: 1, y: 0 })}
        style={{ padding: `16px ${PX}px` }}
      >
        <div className="flex items-center gap-2 mb-2">
          <Search size={16} className="text-toss-grey-500" />
          <span className="text-toss-grey-500" style={T.s12}>
            {lang === 'ko'
              ? `전화번호·이름·생년월일 기반으로 ${contacts.length}명의 연락처를 분석했어요`
              : `Analyzed ${contacts.length} contacts by phone, name, and birthday`}
          </span>
        </div>

        {duplicateGroups.length > 0 ? (
          <div
            className="flex items-center gap-3 bg-[var(--toss-card-bg)] rounded-2xl"
            style={{ padding: '16px 20px' }}
          >
            <div
              className="flex items-center justify-center rounded-full shrink-0"
              style={{
                width: 40,
                height: 40,
                backgroundColor: 'var(--toss-orange-50, #FFF7ED)',
              }}
            >
              <AlertTriangle size={20} style={{ color: 'var(--toss-orange-500, #F97316)' }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-toss-grey-900" style={{ ...T.t6, fontWeight: W.bold }}>
                {lang === 'ko'
                  ? `${duplicateGroups.length}건의 중복 의심 항목`
                  : `${duplicateGroups.length} potential duplicate${duplicateGroups.length > 1 ? 's' : ''}`}
              </p>
              <p className="text-toss-grey-500" style={T.s12}>
                {lang === 'ko'
                  ? '연락처를 비교하고 병합할 수 있어요'
                  : 'Compare and merge contacts'}
              </p>
            </div>
          </div>
        ) : (
          <div
            className="flex flex-col items-center py-16"
          >
            <motion.div
              initial={mc.safeAnimate({ opacity: 0, scale: 0.9 })}
              animate={mc.safeAnimate({ opacity: 1, scale: 1 })}
              transition={{ delay: 0.1 }}
              className="flex items-center justify-center rounded-full mb-4"
              style={{
                width: 72,
                height: 72,
                backgroundColor: 'var(--toss-green-50, #F0FDF4)',
              }}
            >
              <Sparkles size={32} style={{ color: 'var(--toss-green-500, #10B981)' }} />
            </motion.div>
            <p className="text-toss-grey-900 text-center" style={{ ...T.t5, fontWeight: W.bold }}>
              {lang === 'ko' ? '중복 연락처가 없어요' : 'No duplicates found'}
            </p>
            <p className="text-toss-grey-500 text-center mt-1" style={T.s12}>
              {lang === 'ko'
                ? '모든 연락처가 깔끔하게 정리되어 있어요'
                : 'All your contacts are clean and organized'}
            </p>
          </div>
        )}
      </motion.div>

      {/* 중복 그룹 리스트 */}
      <AnimatePresence>
        {duplicateGroups.map((group, idx) => (
          <DuplicateGroupCard
            key={group.id}
            group={group}
            index={idx}
            lang={lang}
            mc={mc}
            onMerge={() => openMerge(group)}
          />
        ))}
      </AnimatePresence>

      {/* 하단 여백 */}
      {duplicateGroups.length > 0 && <div style={{ height: 80 }} />}

      {/* ═══════ 병합 상세 바텀시트 ═══════ */}
      <BottomSheet
        isOpen={mergeSheet}
        onClose={() => { setMergeSheet(false); setSelectedGroup(null); }}
        title={lang === 'ko' ? '연락처 병합' : 'Merge Contacts'}
        closeOnDimmerClick
        footer={
          <TossButton
            variant="fill"
            color="primary"
            size="xlarge"
            display="full"
            onClick={() => setConfirmOpen(true)}
          >
            <GitMerge size={16} />
            {lang === 'ko' ? '병합하기' : 'Merge'}
          </TossButton>
        }
      >
        {primaryContact && secondaryContact && (
          <div style={{ paddingBottom: 8 }}>
            {/* 상단: 두 연락처 아바타 + 화살표 */}
            <div className="flex items-center justify-center gap-4 mb-5">
              <div className="flex flex-col items-center">
                <ContactAvatar name={primaryContact.name} color={primaryContact.avatarColor} size={48} />
                <span
                  className="text-toss-grey-900 mt-1 text-center max-w-20 truncate"
                  style={{ ...T.t7, fontWeight: W.semibold }}
                >
                  {primaryContact.name}
                </span>
                <span
                  className="text-toss-blue rounded-full mt-1"
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    padding: '2px 8px',
                    backgroundColor: 'var(--toss-blue-50, #EFF6FF)',
                  }}
                >
                  {lang === 'ko' ? '유지' : 'Keep'}
                </span>
              </div>

              <button
                onClick={swapPrimarySecondary}
                className="flex items-center justify-center rounded-full bg-toss-grey-100 active:bg-toss-grey-200 transition-colors"
                style={{ width: 36, height: 36 }}
                aria-label={lang === 'ko' ? '주/부 교체' : 'Swap'}
              >
                <ArrowRight size={16} className="text-toss-grey-500" />
              </button>

              <div className="flex flex-col items-center">
                <ContactAvatar name={secondaryContact.name} color={secondaryContact.avatarColor} size={48} />
                <span
                  className="text-toss-grey-900 mt-1 text-center max-w-20 truncate"
                  style={{ ...T.t7, fontWeight: W.semibold }}
                >
                  {secondaryContact.name}
                </span>
                <span
                  className="text-toss-red rounded-full mt-1"
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    padding: '2px 8px',
                    backgroundColor: 'var(--toss-red-50, #FEF2F2)',
                  }}
                >
                  {lang === 'ko' ? '삭제' : 'Remove'}
                </span>
              </div>
            </div>

            {/* 필드별 선택 */}
            <p className="text-toss-grey-500 mb-3" style={{ fontSize: 12, fontWeight: 600 }}>
              {lang === 'ko' ? '각 필드에서 유지할 값을 선택하세요' : 'Choose which value to keep for each field'}
            </p>

            <div className="space-y-1">
              {MERGE_FIELDS.map((field) => {
                const pVal = field.format(primaryContact[field.key as keyof Contact], primaryContact);
                const sVal = field.format(secondaryContact[field.key as keyof Contact], secondaryContact);
                const same = pVal === sVal;
                const choice = fieldChoices[field.key] ?? 'primary';

                return (
                  <div
                    key={field.key}
                    className="rounded-xl overflow-hidden"
                    style={{ border: '1px solid var(--toss-grey-100)' }}
                  >
                    <div
                      className="text-toss-grey-500 bg-toss-grey-50"
                      style={{ fontSize: 11, fontWeight: 600, padding: '6px 14px' }}
                    >
                      {lang === 'ko' ? field.label : field.labelEn}
                      {same && (
                        <span className="ml-2 text-toss-grey-400" style={{ fontWeight: 400 }}>
                          ({lang === 'ko' ? '동일' : 'Same'})
                        </span>
                      )}
                    </div>

                    {same ? (
                      <div
                        className="text-toss-grey-800"
                        style={{ fontSize: 14, padding: '10px 14px' }}
                      >
                        {pVal || '-'}
                      </div>
                    ) : (
                      <div className="flex">
                        <FieldOption
                          value={pVal}
                          selected={choice === 'primary'}
                          side="primary"
                          onSelect={() =>
                            setFieldChoices((prev) => ({ ...prev, [field.key]: 'primary' }))
                          }
                        />
                        <div style={{ width: 1, backgroundColor: 'var(--toss-grey-100)' }} />
                        <FieldOption
                          value={sVal}
                          selected={choice === 'secondary'}
                          side="secondary"
                          onSelect={() =>
                            setFieldChoices((prev) => ({ ...prev, [field.key]: 'secondary' }))
                          }
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* 그룹/태그 합집합 안내 */}
            <div
              className="mt-4 flex items-start gap-2 text-toss-grey-500"
              style={{ fontSize: 12 }}
            >
              <Users size={14} className="mt-0.5 shrink-0" />
              <span>
                {lang === 'ko'
                  ? '그룹과 태그는 양쪽 연락처의 합집합으로 자동 병합됩니다.'
                  : 'Groups and tags will be merged as a union from both contacts.'}
              </span>
            </div>
          </div>
        )}
      </BottomSheet>

      {/* 병합 확인 팝업 */}
      <Popup
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title={lang === 'ko' ? '연락처 병합' : 'Merge Contacts'}
        description={
          primaryContact && secondaryContact
            ? lang === 'ko'
              ? `"${secondaryContact.name}" 연락처가 삭제되고 "${primaryContact.name}"에 병합됩니다. 이 작업은 되돌릴 수 없어요.`
              : `"${secondaryContact.name}" will be deleted and merged into "${primaryContact.name}". This cannot be undone.`
            : ''
        }
        confirmText={lang === 'ko' ? '병합' : 'Merge'}
        cancelText={lang === 'ko' ? '취소' : 'Cancel'}
        destructive
        closeOnDimmerClick={false}
        onConfirm={handleMerge}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════
   서브 컴포넌트 — 중복 그룹 카드
   ═══════════════════════════════════════════════ */

function DuplicateGroupCard({
  group,
  index,
  lang,
  mc,
  onMerge,
}: {
  group: DuplicateGroup;
  index: number;
  lang: 'ko' | 'en';
  mc: ReturnType<typeof useMotionConfig>;
  onMerge: () => void;
}) {
  const [a, b] = group.contacts;

  return (
    <motion.div
      initial={mc.safeAnimate({ opacity: 0, y: 12 })}
      animate={mc.safeAnimate({ opacity: 1, y: 0 })}
      exit={mc.safeAnimate({ opacity: 0, x: -30 })}
      transition={{ delay: index * 0.04 }}
      className="bg-[var(--toss-card-bg)] mx-4 mb-3 rounded-2xl overflow-hidden"
      style={{
        border: '1px solid var(--toss-grey-100)',
      }}
    >
      {/* 상단: 이유 + 신뢰도 */}
      <div
        className="flex items-center justify-between"
        style={{ padding: '12px 16px 8px' }}
      >
        <div className="flex flex-wrap gap-1.5">
          {group.reasons.map((r) => (
            <span
              key={r}
              className="rounded-full text-toss-grey-600"
              style={{
                fontSize: 11,
                fontWeight: 500,
                padding: '3px 10px',
                backgroundColor: 'var(--toss-grey-50)',
              }}
            >
              {reasonLabel(r, lang)}
            </span>
          ))}
        </div>
        <span
          className="text-toss-grey-400 shrink-0"
          style={{ fontSize: 11, fontWeight: 600 }}
        >
          {lang === 'ko' ? '일치 ' : ''}{confidenceLabel(group.confidence)}
        </span>
      </div>

      {/* 두 연락처 비교 */}
      <div className="flex items-center" style={{ padding: '8px 16px 12px' }}>
        <MiniContactCard contact={a} lang={lang} />
        <div className="flex items-center justify-center mx-2 shrink-0">
          <div
            className="flex items-center justify-center rounded-full"
            style={{
              width: 28,
              height: 28,
              backgroundColor: 'var(--toss-grey-100)',
            }}
          >
            <GitMerge size={14} className="text-toss-grey-500" />
          </div>
        </div>
        <MiniContactCard contact={b} lang={lang} />
      </div>

      {/* 병합 버튼 */}
      <button
        onClick={onMerge}
        className="w-full flex items-center justify-center gap-2 bg-toss-grey-50 active:bg-toss-grey-100 transition-colors"
        style={{
          padding: '12px 16px',
          fontSize: 14,
          fontWeight: 600,
          color: 'var(--toss-blue-500)',
          borderTop: '1px solid var(--toss-grey-100)',
        }}
      >
        <GitMerge size={15} />
        {lang === 'ko' ? '비교 및 병합' : 'Compare & Merge'}
        <ChevronRight size={14} />
      </button>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════
   서브 컴포넌트 — 미니 연락처 카드
   ═══════════════════════════════════════════════ */

function MiniContactCard({ contact, lang }: { contact: Contact; lang: 'ko' | 'en' }) {
  return (
    <div className="flex-1 min-w-0 flex items-center gap-2.5">
      <ContactAvatar name={contact.name} color={contact.avatarColor} size={36} />
      <div className="min-w-0 flex-1">
        <p
          className="text-toss-grey-900 truncate"
          style={{ fontSize: 14, fontWeight: 600 }}
        >
          {contact.name}
        </p>
        <div className="flex items-center gap-1.5 text-toss-grey-500" style={{ fontSize: 11 }}>
          {contact.phone && (
            <span className="flex items-center gap-0.5 truncate">
              <Phone size={10} />
              {contact.phone}
            </span>
          )}
          {!contact.birthdayUnknown && (
            <span className="flex items-center gap-0.5">
              <Calendar size={10} />
              {contact.birthday.slice(5)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   서브 컴포넌트 — 필드 옵션 버튼
   ═══════════════════════════════════════════════ */

function FieldOption({
  value,
  selected,
  side,
  onSelect,
}: {
  value: string;
  selected: boolean;
  side: 'primary' | 'secondary';
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={`flex-1 flex items-center gap-2 transition-colors ${
        selected
          ? side === 'primary'
            ? 'bg-[var(--toss-blue-50,#EFF6FF)]'
            : 'bg-[var(--toss-blue-50,#EFF6FF)]'
          : 'bg-white active:bg-toss-grey-50'
      }`}
      style={{ padding: '10px 14px', fontSize: 13, minHeight: 44 }}
    >
      <div
        className={`flex items-center justify-center rounded-full shrink-0 transition-colors ${
          selected
            ? 'bg-toss-blue text-white'
            : 'bg-toss-grey-100 text-toss-grey-400'
        }`}
        style={{ width: 20, height: 20 }}
      >
        {selected && <Check size={12} />}
      </div>
      <span
        className={`truncate ${
          selected ? 'text-toss-blue font-semibold' : 'text-toss-grey-600'
        }`}
      >
        {value || '-'}
      </span>
    </button>
  );
}
