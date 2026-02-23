import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { Search, SlidersHorizontal, Plus, Phone, Star, Tag as TagIcon } from 'lucide-react';
import { RELATIONSHIP_COLORS, type Relationship, type Closeness, CLOSENESS_ORDER } from '../data/contacts';
import { useContacts, getRelationshipColor, getAllRelationshipTypes, useCustomRelationships, toggleFavorite } from '../data/contactsStore';
import { useGroups, type ContactGroup } from '../data/groupStore';
import { useTags, getTagById } from '../data/tagStore';
import { ContactAvatar } from '../components/ContactAvatar';
import { BottomSheet } from '../components/BottomSheet';
import { TossButton } from '../components/TossButton';
import { ContactSkeleton } from '../components/LoadingSpinner';
import { SegmentedControl } from '../components/SegmentedControl';
import { useToast } from '../components/useToast';
import { TextButton } from '../components/TextButton';
import { IconButton } from '../components/IconButton';
import { Result } from '../components/Result';
import { ListFooter } from '../components/ListFooter';
import { useDebounce, useDelayedLoading } from '../components/useDebounce';
import { useAnalytics } from '../components/useAnalytics';
import { formatContactGap } from '../components/useFormatters';
import { useReducedMotionContext } from '../components/useReducedMotionContext';
import { getMotionSafeTransition } from '../components/usePerformanceUX';
import {
  SEARCH_RESULT_GUARD,
} from '../components/useConsumerAppGuard';
import {
  searchContact,
  matchRangesToHighlightRanges,
  matchKorean,
  isAllChosung,
  type SearchResult,
} from '../components/useKoreanSearch';
import { useDocumentTitle } from '../components/useDocumentTitle';
import { Menu, type MenuItem } from '../components/Menu';

/* 3D 아이콘 이미지 */
import networkIcon3D from "../../assets/figma/07544c11520718b7c584d0532129557f3870e4e5.png";

type SortKey = 'name' | 'birthday' | 'lastContact' | 'closeness';

export function ContactListPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const analytics = useAnalytics();
  useDocumentTitle('인연 목록');
  const contacts = useContacts();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedRelationship, setSelectedRelationship] = useState<Relationship | 'all'>('all');
  const [selectedCloseness, setSelectedCloseness] = useState<Closeness | 'all'>('all');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortKey>('birthday');
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [displayCount, setDisplayCount] = useState(10);
  const [loadingMore, setLoadingMore] = useState(false);

  // §5.3 (확장30) 검색 디바운스 300ms
  // 초성 검색은 1글자(ㅎ)부터 유효 — 자음이면 1자, 그 외 2자 최소
  const debouncedSearch = useDebounce(searchQuery, 300);
  const effectiveSearch = useMemo(() => {
    const q = debouncedSearch.trim();
    if (!q) return '';
    // 자음만으로 구성된 쿼리는 1글자부터 허용 (초성 검색)
    if (isAllChosung(q) && q.length >= 1) return q;
    // 숫자(전화번호 검색)는 2자리부터
    if (/^\d+$/.test(q)) return q.length >= 2 ? q : '';
    // 일반 텍스트는 1글자부터 (한글 완성형 1자도 검색 가능)
    return q.length >= 1 ? q : '';
  }, [debouncedSearch]);

  // §3.1 로딩 표시 200ms 지연 (깜빡임 방지)
  const showLoading = useDelayedLoading(isInitialLoading, 200);

  useEffect(() => {
    const timer = setTimeout(() => setIsInitialLoading(false), 400);
    return () => clearTimeout(timer);
  }, []);

  // §5.1 screen_view
  useEffect(() => {
    analytics.trackScreenView('ContactList');
  }, []);

  /* ── 초성/혼합/전화번호 통합 검색 결과 캐싱 ── */
  const searchResultMap = useMemo(() => {
    const map = new Map<string, SearchResult>();
    if (!effectiveSearch) return map;
    for (const c of contacts) {
      const sr = searchContact(c.name, c.memo, c.phone, effectiveSearch);
      if (sr.matched) map.set(c.id, sr);
    }
    return map;
  }, [contacts, effectiveSearch]);

  const filteredContacts = useMemo(() => {
    let result = [...contacts];

    if (effectiveSearch) {
      result = result.filter(c => searchResultMap.has(c.id));
    }

    if (selectedRelationship !== 'all') {
      result = result.filter(c => c.relationship === selectedRelationship);
    }

    if (selectedCloseness !== 'all') {
      result = result.filter(c => c.closeness === selectedCloseness);
    }

    if (showFavoritesOnly) {
      result = result.filter(c => c.isFavorite);
    }

    if (selectedGroupId) {
      result = result.filter(c => (c.groupIds ?? []).includes(selectedGroupId));
    }

    if (selectedTagId) {
      result = result.filter(c => (c.tags ?? []).includes(selectedTagId));
    }

    switch (sortBy) {
      case 'name':
        result.sort((a, b) => a.name.localeCompare(b.name, 'ko'));
        break;
      case 'birthday':
        result.sort((a, b) => a.birthdayDday - b.birthdayDday);
        break;
      case 'lastContact':
        result.sort((a, b) => b.contactGap - a.contactGap);
        break;
      case 'closeness':
        result.sort((a, b) => CLOSENESS_ORDER.indexOf(a.closeness) - CLOSENESS_ORDER.indexOf(b.closeness));
        break;
    }

    return result;
  }, [contacts, effectiveSearch, selectedRelationship, selectedCloseness, showFavoritesOnly, selectedGroupId, selectedTagId, sortBy]);

  const visibleContacts = filteredContacts.slice(0, displayCount);
  const hasMore = displayCount < filteredContacts.length;

  const loadMore = () => {
    setLoadingMore(true);
    setTimeout(() => {
      setDisplayCount(prev => Math.min(prev + 10, filteredContacts.length));
      setLoadingMore(false);
    }, 400);
  };

  const activeFilterCount = [
    selectedRelationship !== 'all',
    selectedCloseness !== 'all',
    showFavoritesOnly,
    selectedGroupId !== null,
    selectedTagId !== null,
  ].filter(Boolean).length;

  // 동적 관계 탭 목록 (기본 + 커스텀)
  const customRelationships = useCustomRelationships();
  const allRelationshipTypes = useMemo(() => getAllRelationshipTypes(), [customRelationships]);

  const reducedMotion = useReducedMotionContext();
  const groups = useGroups();
  const allTags = useTags();
  const favoriteCount = useMemo(() => contacts.filter(c => c.isFavorite).length, [contacts]);

  /* ─── 즐겨찾기 토글 핸들러 (이벤트 전파 차단) ─── */
  const handleToggleFavorite = useCallback((e: React.MouseEvent, contactId: string, contactName: string) => {
    e.stopPropagation();
    e.preventDefault();
    const isFav = toggleFavorite(contactId);
    toast.openToast(isFav ? `${contactName}님을 즐겨찾기에 추가했어요` : `${contactName}님을 즐겨찾기에서 제거했어요`);
  }, [toast]);

  /* ─── 관계 탭 스크롤 인디케이터 ─── */
  const tabsScrollRef = useRef<HTMLDivElement>(null);
  const [showLeftFade, setShowLeftFade] = useState(false);
  const [showRightFade, setShowRightFade] = useState(false);

  const updateScrollIndicators = useCallback(() => {
    const el = tabsScrollRef.current;
    if (!el) return;
    setShowLeftFade(el.scrollLeft > 4);
    setShowRightFade(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = tabsScrollRef.current;
    if (!el) return;
    updateScrollIndicators();
    el.addEventListener('scroll', updateScrollIndicators, { passive: true });
    window.addEventListener('resize', updateScrollIndicators);
    return () => {
      el.removeEventListener('scroll', updateScrollIndicators);
      window.removeEventListener('resize', updateScrollIndicators);
    };
  }, [updateScrollIndicators, allRelationshipTypes]);

  return (
    <div className="pb-20">
      {/* Header — 24px horizontal margin */}
      <div style={{ padding: '24px 24px 8px 24px' }}>
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-toss-grey-900" style={{ fontSize: 24, fontWeight: 800 }}>인연</h1>
          <IconButton
            icon={<Plus size={20} className="text-[var(--primary-foreground)]" strokeWidth={2.5} />}
            aria-label="새 연락처 추가"
            variant="fill"
            iconSize={20}
            bgColor="var(--toss-blue-500)"
            onClick={() => {
              navigate('/app/contacts/add');
            }}
            style={{ width: 36, height: 36 }}
          />
        </div>

        {/* Search — TDS: search bar height 44px */}
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center bg-toss-grey-100 rounded-xl" style={{ height: 44 }}>
            <Search size={18} className="text-toss-grey-400 ml-3" aria-hidden="true" />
            <input
              className="flex-1 bg-transparent px-3 outline-none text-toss-grey-900 placeholder-toss-grey-400"
              style={{ fontSize: 15 }}
              placeholder="이름, 메모, 초성, 전화번호 검색"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="인연 검색"
            />
          </div>
          <button
            onClick={() => setFilterOpen(true)}
            className="flex items-center justify-center bg-toss-grey-100 rounded-xl relative"
            style={{ width: 44, height: 44 }}
            aria-label={`필터${activeFilterCount > 0 ? ` (${activeFilterCount}개 적용 중)` : ''}`}
          >
            <SlidersHorizontal size={18} className="text-toss-grey-700" aria-hidden="true" />
            {activeFilterCount > 0 && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-toss-blue rounded-full flex items-center justify-center" aria-hidden="true">
                <span className="text-[var(--primary-foreground)]" style={{ fontSize: 10, fontWeight: 700 }}>{activeFilterCount}</span>
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Relationship Tabs — chip style, horizontal scroll + 스크롤 인디케이터 */}
      <div className="relative">
        {/* Left fade indicator */}
        {showLeftFade && (
          <div
            className="absolute left-0 top-0 bottom-0 z-10 pointer-events-none"
            style={{ width: 32, background: 'linear-gradient(to right, var(--toss-bg), transparent)' }}
            aria-hidden="true"
          />
        )}
        {/* Right fade indicator */}
        {showRightFade && (
          <div
            className="absolute right-0 top-0 bottom-0 z-10 pointer-events-none"
            style={{ width: 32, background: 'linear-gradient(to left, var(--toss-bg), transparent)' }}
            aria-hidden="true"
          />
        )}
      <div
        ref={tabsScrollRef}
        className="flex gap-2 py-3 overflow-x-auto no-scrollbar"
        style={{ paddingLeft: 24, paddingRight: 24, WebkitOverflowScrolling: 'touch' }}
        role="tablist"
        aria-label="관계 필터"
      >
        <button
          key="all"
          onClick={() => setSelectedRelationship('all')}
          role="tab"
          aria-selected={selectedRelationship === 'all'}
          className={`shrink-0 px-3.5 py-1.5 rounded-full transition-colors ${
            selectedRelationship === 'all' ? 'bg-toss-blue text-[var(--primary-foreground)]' : 'bg-toss-grey-100 text-toss-grey-600'
          }`}
          style={{ fontSize: 13, fontWeight: selectedRelationship === 'all' ? 600 : 400, minHeight: 32 }}
        >
          전체
        </button>
        {/* ★ 즐겨찾기 필터 탭 */}
        <button
          key="favorites"
          onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
          role="tab"
          aria-selected={showFavoritesOnly}
          className={`shrink-0 px-3.5 py-1.5 rounded-full transition-colors flex items-center gap-1 ${
            showFavoritesOnly ? 'bg-toss-blue text-[var(--primary-foreground)]' : 'bg-toss-grey-100 text-toss-grey-600'
          }`}
          style={{ fontSize: 13, fontWeight: showFavoritesOnly ? 600 : 400, minHeight: 32 }}
        >
          <Star size={12} fill={showFavoritesOnly ? 'currentColor' : 'none'} />
          즐겨찾기
          {favoriteCount > 0 && (
            <span style={{ opacity: 0.7 }}>{favoriteCount}</span>
          )}
        </button>
        {/* 그룹 필터 탭 */}
        {groups.map((grp) => {
          const isActive = selectedGroupId === grp.id;
          const count = contacts.filter(c => (c.groupIds ?? []).includes(grp.id)).length;
          return (
            <button
              key={`grp-${grp.id}`}
              onClick={() => setSelectedGroupId(isActive ? null : grp.id)}
              role="tab"
              aria-selected={isActive}
              className={`shrink-0 px-3.5 py-1.5 rounded-full transition-colors ${
                isActive ? 'bg-toss-blue text-[var(--primary-foreground)]' : 'bg-toss-grey-100 text-toss-grey-600'
              }`}
              style={{ fontSize: 13, fontWeight: isActive ? 600 : 400, minHeight: 32 }}
            >
              {grp.emoji && <span className="mr-0.5">{grp.emoji}</span>}
              {grp.name}
              {count > 0 && (
                <span className="ml-1" style={{ opacity: 0.7 }}>{count}</span>
              )}
            </button>
          );
        })}
        {/* 태그 필터 탭 */}
        {allTags.map((tag) => {
          const isActive = selectedTagId === tag.id;
          const count = contacts.filter(c => (c.tags ?? []).includes(tag.id)).length;
          if (count === 0) return null;
          return (
            <button
              key={`tag-${tag.id}`}
              onClick={() => setSelectedTagId(isActive ? null : tag.id)}
              role="tab"
              aria-selected={isActive}
              className={`shrink-0 px-3.5 py-1.5 rounded-full transition-colors flex items-center gap-1 ${
                isActive ? 'bg-toss-blue text-[var(--primary-foreground)]' : 'bg-toss-grey-100 text-toss-grey-600'
              }`}
              style={{ fontSize: 13, fontWeight: isActive ? 600 : 400, minHeight: 32 }}
            >
              <span
                className="rounded-full"
                style={{
                  width: 6,
                  height: 6,
                  backgroundColor: isActive ? 'currentColor' : tag.color,
                }}
              />
              {tag.label}
              <span style={{ opacity: 0.7 }}>{count}</span>
            </button>
          );
        })}
        {allRelationshipTypes.map((rel) => {
          const isActive = selectedRelationship === rel.value;
          const count = contacts.filter(c => c.relationship === rel.value).length;
          return (
            <button
              key={rel.value}
              onClick={() => setSelectedRelationship(rel.value as Relationship)}
              role="tab"
              aria-selected={isActive}
              className={`shrink-0 px-3.5 py-1.5 rounded-full transition-colors ${
                isActive ? 'bg-toss-blue text-[var(--primary-foreground)]' : 'bg-toss-grey-100 text-toss-grey-600'
              }`}
              style={{
                fontSize: 13,
                fontWeight: isActive ? 600 : 400,
                minHeight: 32,
              }}
            >
              {rel.value}
              {count > 0 && (
                <span className="ml-1" style={{ opacity: 0.7 }}>{count}</span>
              )}
            </button>
          );
        })}
      </div>
      </div>

      {/* Sort info */}
      <div className="flex items-center justify-between px-6 py-2">
        <span className="text-toss-grey-500" style={{ fontSize: 13 }}>
          {filteredContacts.length}명
        </span>
        {/* §1.1 TDS Menu: 정렬 옵션 4개 → BottomSheet 대신 트리거 위치 Menu로 시선 이동 최소화 */}
        <Menu
          items={[
            { value: 'name', label: '이름순' },
            { value: 'birthday', label: '생일순' },
            { value: 'lastContact', label: '연락순' },
            { value: 'closeness', label: '친함순' },
          ]}
          value={sortBy}
          onSelect={(v) => setSortBy(v as SortKey)}
          placement="bottom-end"
          aria-label="정렬 기준 선택"
          trigger={({ ref, onClick, isOpen }) => (
            <TextButton
              ref={ref}
              size="small"
              variant="arrow"
              onClick={onClick}
              aria-label="정렬 변경"
              aria-expanded={isOpen}
              style={{ color: 'var(--toss-grey-500)' }}
            >
              {sortBy === 'name' ? '이름순' : sortBy === 'birthday' ? '생일순' : sortBy === 'lastContact' ? '연락순' : '친함순'}
            </TextButton>
          )}
        />
      </div>

      {/* Contact List — TDS: cell height 56px, 24px horizontal margin */}
      <div className="px-6" role="list" aria-label="인연 목록">
        {showLoading ? (
          <div>
            {Array.from({ length: 6 }).map((_, i) => (
              <ContactSkeleton key={i} />
            ))}
          </div>
        ) : (
          <AnimatePresence>
            {filteredContacts.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <Result
                  figure={
                    <div className="flex items-center justify-center" style={{ width: 80, height: 80 }}>
                      <img
                        src={networkIcon3D}
                        alt=""
                        style={{ width: 80, height: 80, objectFit: 'contain' }}
                        aria-hidden="true"
                      />
                    </div>
                  }
                  title="검색 결과가 없습니다"
                  description="다른 검색어나 필터를 시도해보세요."
                />
                {/* §2.3 (확장6): 0건 → "검색어 지우기" CTA 항상 노출 + 필터 초기화 + 새 연락처 추가 */}
                <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
                  {searchQuery && (
                    <TossButton
                      variant="weak"
                      color="light"
                      size="small"
                      onClick={() => setSearchQuery('')}
                    >
                      검색어 지우기
                    </TossButton>
                  )}
                  {activeFilterCount > 0 && (
                    <TossButton
                      variant="weak"
                      color="light"
                      size="small"
                      onClick={() => {
                        setSelectedRelationship('all');
                        setSelectedCloseness('all');
                        setShowFavoritesOnly(false);
                        setSelectedGroupId(null);
                        setSelectedTagId(null);
                      }}
                    >
                      필터 초기화
                    </TossButton>
                  )}
                  {/* §5.1 최소 2개 대체 행동 보장 — 새 연락처 추가 CTA 항상 노출 */}
                  <TossButton
                    variant="weak"
                    color="primary"
                    size="small"
                    onClick={() => navigate('/app/contacts/add')}
                  >
                    새 연락처 추가
                  </TossButton>
                </div>
              </motion.div>
            ) : (
              visibleContacts.map((contact, i) => (
                <motion.button
                  key={contact.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={getMotionSafeTransition(reducedMotion, { delay: i * 0.02 })}
                  onClick={() => navigate(`/app/contact/${contact.id}`)}
                  className="w-full flex items-center gap-3 py-3 border-b border-toss-grey-100 active:bg-toss-grey-50 transition-colors"
                  style={{ minHeight: 56 }}
                  role="listitem"
                  aria-label={`${contact.name}, ${contact.relationship}, ${contact.closeness}`}
                >
                  <ContactAvatar name={contact.name} color={getRelationshipColor(contact.relationship)} size={44} />
                  <div className="flex-1 text-left min-w-0">
                    {/* §4.1 (확장31) 결과 아이템: 제목 1줄 + 메타 1줄 = 최대 4줄 상한 */}
                    <div className="flex items-center gap-2">
                      {/* §4.2 (확장31) 하이라이트: bold만 사용, 최대 3개 단어 */}
                      <span className="text-toss-grey-900 truncate" style={{ fontSize: 15, fontWeight: 600 }}>
                        <HighlightedText text={contact.name} query={effectiveSearch} />
                      </span>
                      <span
                        className="shrink-0 text-toss-grey-500"
                        style={{
                          fontSize: 11,
                        }}
                      >
                        {contact.relationship}
                      </span>
                    </div>
                    {/* §4.1 (확장31) 보조 정보(메타): 최대 1줄, truncate 적용 */}
                    <p className="text-toss-grey-500 truncate" style={{ fontSize: 12 }}>
                      {contact.closeness} · {contact.age}세
                      {contact.memo && ` · `}
                      {contact.memo && <HighlightedText text={contact.memo} query={effectiveSearch} />}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    {contact.birthdayDday <= 30 && (
                      <span className="text-toss-red" style={{ fontSize: 11, fontWeight: 600 }}>
                        D-{contact.birthdayDday}
                      </span>
                    )}
                    <p className="text-toss-grey-400" style={{ fontSize: 11 }}>
                      {formatContactGap(contact.contactGap)}
                    </p>
                  </div>
                </motion.button>
              ))
            )}
          </AnimatePresence>
        )}

        {/* TDS ListFooter (심화4, 3) — 더 보기 */}
        {!showLoading && hasMore && (
          <ListFooter
            aria-label={`나머지 ${filteredContacts.length - displayCount}명 더 보기`}
            border="indented"
            icon={<Plus size={14} />}
            onClick={loadMore}
            loading={loadingMore}
          >
            더 보기 ({filteredContacts.length - displayCount}명)
          </ListFooter>
        )}
      </div>

      {/* Filter Bottom Sheet — SegmentedControl for sort */}
      <BottomSheet
        isOpen={filterOpen}
        onClose={() => setFilterOpen(false)}
        title="필터 & 정렬"
        closeOnDimmerClick={true}
        footer={
          <div className="flex gap-2">
            <TossButton
              variant="weak"
              color="light"
              size="large"
              display="full"
              onClick={() => {
                setSelectedRelationship('all');
                setSelectedCloseness('all');
                setShowFavoritesOnly(false);
                setSelectedGroupId(null);
                setSelectedTagId(null);
                setSortBy('name');
              }}
            >
              초기화
            </TossButton>
            <TossButton
              variant="fill"
              color="primary"
              size="large"
              display="full"
              onClick={() => setFilterOpen(false)}
            >
              적용
            </TossButton>
          </div>
        }
      >
        <div className="space-y-6 pb-2">
          {/* Sort — TDS SegmentedControl */}
          <div>
            <h4 className="text-toss-grey-800 mb-3" style={{ fontSize: 15, fontWeight: 700 }}>정렬</h4>
            <SegmentedControl
              size="small"
              alignment="fixed"
              value={sortBy}
              onChange={(v) => setSortBy(v as SortKey)}
            >
              <SegmentedControl.Item value="name">이름순</SegmentedControl.Item>
              <SegmentedControl.Item value="birthday">생일순</SegmentedControl.Item>
              <SegmentedControl.Item value="lastContact">연락순</SegmentedControl.Item>
              <SegmentedControl.Item value="closeness">친함순</SegmentedControl.Item>
            </SegmentedControl>
          </div>

          {/* Closeness Filter */}
          <div>
            <h4 className="text-toss-grey-800 mb-3" style={{ fontSize: 15, fontWeight: 700 }}>친함 정도</h4>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="친함 정도 필터">
              {CLOSENESS_ORDER.map((cl) => (
                <button
                  key={cl}
                  onClick={() => setSelectedCloseness(selectedCloseness === cl ? 'all' : cl)}
                  role="radio"
                  aria-checked={selectedCloseness === cl}
                  className={`px-4 py-2 rounded-xl transition-colors ${
                    selectedCloseness === cl ? 'bg-toss-blue text-[var(--primary-foreground)]' : 'bg-toss-grey-100 text-toss-grey-700'
                  }`}
                  style={{ fontSize: 14, fontWeight: selectedCloseness === cl ? 600 : 400, minHeight: 40 }}
                >
                  {cl}
                </button>
              ))}
            </div>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}

/**
 * §4.2 (확장31) 검색어 하이라이트 컴포넌트
 * - bold만 사용 (bold+color 동시 적용 금지 — 과강조 방지)
 * - 최대 3개 단어만 하이라이트 (SEARCH_RESULT_GUARD.MAX_HIGHLIGHT_WORDS)
 * - 한글 초성/혼합 검색도 하이라이트 지원
 */
function HighlightedText({ text, query }: { text: string; query: string }) {
  if (!query || !text) return <>{text}</>;

  const ranges = matchRangesToHighlightRanges(
    matchKorean(text, query),
    SEARCH_RESULT_GUARD.MAX_HIGHLIGHT_WORDS,
  );
  if (ranges.length === 0) return <>{text}</>;

  const chars = Array.from(text);
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;

  ranges.forEach((range, i) => {
    if (range.start > lastIndex) {
      parts.push(chars.slice(lastIndex, range.start).join(''));
    }
    parts.push(
      <span key={i} style={{ fontWeight: 800 }}>
        {chars.slice(range.start, range.end).join('')}
      </span>,
    );
    lastIndex = range.end;
  });

  if (lastIndex < chars.length) {
    parts.push(chars.slice(lastIndex).join(''));
  }

  return <>{parts}</>;
}