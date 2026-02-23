import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, X, Tag as TagIcon, Trash2, Check } from 'lucide-react';
import {
  useTags, addTag, removeTag, updateTag,
  TAG_COLORS, type Tag,
} from '../data/tagStore';
import { useContacts, removeTagFromAllContacts } from '../data/contactsStore';
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

export function TagManagementPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { lang } = useLanguage();
  const mc = useMotionConfig();
  useDocumentTitle(lang === 'ko' ? '태그 관리' : 'Tag Management');

  const tags = useTags();
  const contacts = useContacts();

  /* 태그별 사용 횟수 */
  const tagUsageMap = useMemo(() => {
    const map = new Map<string, number>();
    contacts.forEach(c => {
      (c.tags ?? []).forEach(tid => {
        map.set(tid, (map.get(tid) || 0) + 1);
      });
    });
    return map;
  }, [contacts]);

  /* ── 새 태그 추가 ── */
  const [addOpen, setAddOpen] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newColor, setNewColor] = useState(TAG_COLORS[0]);

  const handleAdd = useCallback(() => {
    if (!newLabel.trim()) return;
    const tag = addTag(newLabel.trim(), newColor);
    if (tag) {
      toast.openToast(lang === 'ko' ? `"${tag.label}" 태그를 추가했어요` : `Added "${tag.label}" tag`);
    }
    setNewLabel('');
    setNewColor(TAG_COLORS[0]);
    setAddOpen(false);
  }, [newLabel, newColor, lang, toast]);

  /* ── 태그 삭제 ── */
  const [deleteTarget, setDeleteTarget] = useState<Tag | null>(null);

  const handleDelete = useCallback(() => {
    if (!deleteTarget) return;
    removeTagFromAllContacts(deleteTarget.id);
    removeTag(deleteTarget.id);
    toast.openToast(lang === 'ko' ? `"${deleteTarget.label}" 태그를 삭제했어요` : `Deleted "${deleteTarget.label}" tag`);
    setDeleteTarget(null);
  }, [deleteTarget, lang, toast]);

  /* ── 태그 편집 ── */
  const [editTarget, setEditTarget] = useState<Tag | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editColor, setEditColor] = useState('');

  const openEdit = (tag: Tag) => {
    setEditTarget(tag);
    setEditLabel(tag.label);
    setEditColor(tag.color);
  };

  const handleEdit = useCallback(() => {
    if (!editTarget || !editLabel.trim()) return;
    updateTag(editTarget.id, { label: editLabel.trim(), color: editColor });
    toast.openToast(lang === 'ko' ? '태그를 수정했어요' : 'Tag updated');
    setEditTarget(null);
  }, [editTarget, editLabel, editColor, lang, toast]);

  return (
    <div className="min-h-dvh bg-[var(--toss-bg)]">
      <NavigationBar
        title={lang === 'ko' ? '태그 관리' : 'Tag Management'}
        onBack={() => navigate(-1)}
        right={
          <button
            onClick={() => setAddOpen(true)}
            className="flex items-center justify-center text-toss-blue active:bg-toss-blue-50 rounded-lg transition-colors"
            style={{ width: 36, height: 36 }}
            aria-label={lang === 'ko' ? '태그 추가' : 'Add tag'}
          >
            <Plus size={20} />
          </button>
        }
      />

      <div style={{ padding: `16px ${PX}px` }}>
        {/* 태그 수 표시 */}
        <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
          <span className="text-toss-grey-500" style={T.s12}>
            {lang === 'ko' ? `총 ${tags.length}개` : `${tags.length} tags`}
          </span>
        </div>

        {/* 태그 리스트 */}
        {tags.length === 0 ? (
          <motion.div
            initial={mc.safeAnimate({ opacity: 0, y: MOTION_DISTANCE.card })}
            animate={mc.safeAnimate({ opacity: 1, y: 0 })}
            className="flex flex-col items-center py-16"
          >
            <TagIcon size={40} className="text-toss-grey-300 mb-3" />
            <p className="text-toss-grey-500 text-center" style={T.t6}>
              {lang === 'ko' ? '아직 태그가 없어요' : 'No tags yet'}
            </p>
            <p className="text-toss-grey-400 text-center mt-1" style={T.s12}>
              {lang === 'ko' ? '태그를 만들어 연락처를 분류해보세요' : 'Create tags to organize your contacts'}
            </p>
            <TossButton
              variant="fill"
              color="primary"
              size="medium"
              onClick={() => setAddOpen(true)}
              className="mt-4"
            >
              <Plus size={16} />
              {lang === 'ko' ? '첫 태그 만들기' : 'Create first tag'}
            </TossButton>
          </motion.div>
        ) : (
          <AnimatePresence>
            {tags.map((tag, idx) => {
              const usage = tagUsageMap.get(tag.id) || 0;
              return (
                <motion.div
                  key={tag.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -40 }}
                  transition={{ delay: idx * 0.02 }}
                  className="flex items-center gap-3 py-3 border-b border-toss-grey-100"
                  style={{ minHeight: 56 }}
                >
                  {/* 색상 점 */}
                  <div
                    className="rounded-full shrink-0"
                    style={{ width: 12, height: 12, backgroundColor: tag.color }}
                  />
                  {/* 라벨 */}
                  <button
                    onClick={() => openEdit(tag)}
                    className="flex-1 text-left min-w-0 active:bg-toss-grey-50 rounded-lg transition-colors -mx-1 px-1"
                    style={{ minHeight: 40 }}
                  >
                    <span className="text-toss-grey-900 block truncate" style={{ ...T.t6, fontWeight: W.semibold }}>
                      {tag.label}
                    </span>
                    <span className="text-toss-grey-500" style={T.s12}>
                      {lang === 'ko' ? `${usage}명 사용 중` : `Used by ${usage}`}
                    </span>
                  </button>
                  {/* 삭제 */}
                  <button
                    onClick={() => setDeleteTarget(tag)}
                    className="text-toss-grey-300 active:text-toss-red transition-colors shrink-0 flex items-center justify-center"
                    style={{ width: 36, height: 36 }}
                    aria-label={`${tag.label} 삭제`}
                  >
                    <Trash2 size={16} />
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {/* ── 새 태그 추가 바텀시트 ── */}
      <BottomSheet
        isOpen={addOpen}
        onClose={() => { setAddOpen(false); setNewLabel(''); }}
        title={lang === 'ko' ? '새 태그 추가' : 'Add New Tag'}
        closeOnDimmerClick
        footer={
          <TossButton
            variant="fill"
            color="primary"
            size="xlarge"
            display="full"
            onClick={handleAdd}
            disabled={!newLabel.trim()}
          >
            {lang === 'ko' ? '추가' : 'Add'}
          </TossButton>
        }
      >
        <div style={{ paddingBottom: 8 }}>
          <p className="text-toss-grey-500 mb-2" style={{ fontSize: 12, fontWeight: 600 }}>
            {lang === 'ko' ? '태그 이름' : 'Tag name'}
          </p>
          <input
            type="text"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value.slice(0, 20))}
            className="w-full bg-toss-grey-50 text-toss-grey-900 rounded-xl outline-none mb-1"
            style={{
              fontSize: 15,
              padding: '12px 16px',
              border: '1px solid var(--toss-grey-200)',
              height: 48,
            }}
            placeholder={lang === 'ko' ? '예: 투자모임, 대학동기' : 'e.g. Gym buddies'}
            maxLength={20}
            autoFocus
          />
          <span className="text-toss-grey-400" style={{ fontSize: 11 }}>{newLabel.length}/20</span>

          <p className="text-toss-grey-500 mb-2 mt-4" style={{ fontSize: 12, fontWeight: 600 }}>
            {lang === 'ko' ? '색상' : 'Color'}
          </p>
          <div className="flex flex-wrap gap-2">
            {TAG_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => setNewColor(color)}
                className="relative rounded-full transition-all"
                style={{
                  width: 32,
                  height: 32,
                  backgroundColor: color,
                  outline: newColor === color ? '2px solid var(--toss-blue-500)' : 'none',
                  outlineOffset: 2,
                }}
                aria-label={color}
              >
                {newColor === color && (
                  <Check size={14} className="absolute inset-0 m-auto text-white" />
                )}
              </button>
            ))}
          </div>
        </div>
      </BottomSheet>

      {/* ── 태그 편집 바텀시트 ── */}
      <BottomSheet
        isOpen={!!editTarget}
        onClose={() => setEditTarget(null)}
        title={lang === 'ko' ? '태그 수정' : 'Edit Tag'}
        closeOnDimmerClick
        footer={
          <TossButton
            variant="fill"
            color="primary"
            size="xlarge"
            display="full"
            onClick={handleEdit}
            disabled={!editLabel.trim()}
          >
            {lang === 'ko' ? '저장' : 'Save'}
          </TossButton>
        }
      >
        <div style={{ paddingBottom: 8 }}>
          <p className="text-toss-grey-500 mb-2" style={{ fontSize: 12, fontWeight: 600 }}>
            {lang === 'ko' ? '태그 이름' : 'Tag name'}
          </p>
          <input
            type="text"
            value={editLabel}
            onChange={(e) => setEditLabel(e.target.value.slice(0, 20))}
            className="w-full bg-toss-grey-50 text-toss-grey-900 rounded-xl outline-none mb-1"
            style={{
              fontSize: 15,
              padding: '12px 16px',
              border: '1px solid var(--toss-grey-200)',
              height: 48,
            }}
            maxLength={20}
            autoFocus
          />
          <span className="text-toss-grey-400" style={{ fontSize: 11 }}>{editLabel.length}/20</span>

          <p className="text-toss-grey-500 mb-2 mt-4" style={{ fontSize: 12, fontWeight: 600 }}>
            {lang === 'ko' ? '색상' : 'Color'}
          </p>
          <div className="flex flex-wrap gap-2">
            {TAG_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => setEditColor(color)}
                className="relative rounded-full transition-all"
                style={{
                  width: 32,
                  height: 32,
                  backgroundColor: color,
                  outline: editColor === color ? '2px solid var(--toss-blue-500)' : 'none',
                  outlineOffset: 2,
                }}
                aria-label={color}
              >
                {editColor === color && (
                  <Check size={14} className="absolute inset-0 m-auto text-white" />
                )}
              </button>
            ))}
          </div>
        </div>
      </BottomSheet>

      {/* ── 삭제 확인 팝업 ── */}
      <Popup
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title={lang === 'ko' ? '태그 삭제' : 'Delete Tag'}
        description={
          deleteTarget
            ? lang === 'ko'
              ? `"${deleteTarget.label}" 태그를 삭제하면 모든 연락처에서도 제거됩니다.`
              : `Deleting "${deleteTarget.label}" will remove it from all contacts.`
            : ''
        }
        confirmText={lang === 'ko' ? '삭제' : 'Delete'}
        cancelText={lang === 'ko' ? '취소' : 'Cancel'}
        destructive
        closeOnDimmerClick={false}
        onConfirm={handleDelete}
      />
    </div>
  );
}
