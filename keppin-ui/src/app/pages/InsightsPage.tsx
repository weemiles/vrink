import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import {
  BarChart3, Users, Phone, Heart, Calendar, TrendingUp,
  Flame, MessageSquare, ArrowRight, RefreshCw,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid,
} from 'recharts';
import { useStats, fetchStats, type UserStats } from '../data/statsStore';
import { INTERACTION_TYPE_META, type InteractionType } from '../data/interactionLogStore';
import { ContactAvatar } from '../components/ContactAvatar';
import { Skeleton } from '../components/Skeleton';
import { NavigationBar } from '../components/NavigationBar';
import { useLanguage } from '../components/useLanguage';
import { useMotionConfig, MOTION_DISTANCE } from '../components/useMotionConfig';
import { useDocumentTitle } from '../components/useDocumentTitle';

/* ─── TDS Typography ─── */
const T = {
  t3: { fontSize: 'var(--typo-3-size)', lineHeight: 'var(--typo-3-lh)' } as const,
  t4: { fontSize: 'var(--typo-4-size)', lineHeight: 'var(--typo-4-lh)' } as const,
  t5: { fontSize: 'var(--typo-5-size)', lineHeight: 'var(--typo-5-lh)' } as const,
  t6: { fontSize: 'var(--typo-6-size)', lineHeight: 'var(--typo-6-lh)' } as const,
  t7: { fontSize: 'var(--typo-7-size)', lineHeight: 'var(--typo-7-lh)' } as const,
  s11: { fontSize: 'var(--typo-sub11-size)', lineHeight: 'var(--typo-sub11-lh)' } as const,
  s12: { fontSize: 'var(--typo-sub12-size)', lineHeight: 'var(--typo-sub12-lh)' } as const,
  s13: { fontSize: 'var(--typo-sub13-size)', lineHeight: 'var(--typo-sub13-lh)' } as const,
};
const W = { medium: 500, semibold: 600, bold: 700 };
const PX = 24;
const CARD_R = 16;

/* ─── Mono palette for charts ─── */
const MONO_PALETTE = [
  '#171717', '#333333', '#525252', '#737373', '#8A8A8A',
  '#A3A3A3', '#B0B0B0', '#C4C4C4', '#D9D9D9', '#EBEBEB',
];

/* ═══════════════════════════════════════════════
   숫자 카운트업 컴포넌트
   ═══════════════════════════════════════════════ */
function StatNumber({ value, label, icon, suffix = '' }: {
  value: number;
  label: string;
  icon: React.ReactNode;
  suffix?: string;
}) {
  return (
    <div
      className="flex flex-col items-center justify-center bg-[var(--toss-card-bg)] border border-toss-grey-100"
      style={{ borderRadius: CARD_R, padding: '20px 12px', minHeight: 100 }}
    >
      <div className="text-toss-grey-400 mb-2">{icon}</div>
      <div className="text-toss-grey-900" style={{ ...T.t4, fontWeight: W.bold }}>
        {value.toLocaleString()}{suffix}
      </div>
      <div className="text-toss-grey-500 mt-1" style={{ ...T.s12 }}>{label}</div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   카드 래퍼
   ═══════════════════════════════════════════════ */
function Card({ title, children, delay = 0 }: {
  title: string;
  children: React.ReactNode;
  delay?: number;
}) {
  const mc = useMotionConfig();
  return (
    <motion.div
      initial={mc.safeAnimate({ opacity: 0, y: MOTION_DISTANCE.card })}
      animate={mc.safeAnimate({ opacity: 1, y: 0 })}
      transition={{ ...mc.safeTransition('screen'), delay }}
      className="bg-[var(--toss-card-bg)] border border-toss-grey-100"
      style={{ borderRadius: CARD_R, padding: PX, marginBottom: 12 }}
    >
      <h3 className="text-toss-grey-900 mb-4" style={{ ...T.t6, fontWeight: W.bold }}>
        {title}
      </h3>
      {children}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════
   InsightsPage
   ═══════════════════════════════════════════════ */
export function InsightsPage() {
  const navigate = useNavigate();
  const { t, lang } = useLanguage();
  const mc = useMotionConfig();
  useDocumentTitle(lang === 'ko' ? '인사이트' : 'Insights');

  const { stats, loading, error } = useStats();

  useEffect(() => {
    fetchStats(true);
  }, []);

  const [refreshing, setRefreshing] = useState(false);
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchStats(true);
    setRefreshing(false);
  };

  /* ─── 파이 차트 데이터 ─── */
  const relPieData = useMemo(() => {
    if (!stats) return [];
    return Object.entries(stats.relationshipDistribution)
      .sort(([, a], [, b]) => b - a)
      .map(([name, value], i) => ({
        name,
        value,
        color: MONO_PALETTE[i % MONO_PALETTE.length],
      }));
  }, [stats]);

  const closenessPieData = useMemo(() => {
    if (!stats) return [];
    return Object.entries(stats.closenessDistribution)
      .sort(([, a], [, b]) => b - a)
      .map(([name, value], i) => ({
        name,
        value,
        color: MONO_PALETTE[i % MONO_PALETTE.length],
      }));
  }, [stats]);

  const logTypePieData = useMemo(() => {
    if (!stats) return [];
    return Object.entries(stats.logTypeDistribution)
      .sort(([, a], [, b]) => b - a)
      .map(([key, value], i) => ({
        name: INTERACTION_TYPE_META[key as InteractionType]?.labelKo || key,
        emoji: INTERACTION_TYPE_META[key as InteractionType]?.emoji || '',
        value,
        color: MONO_PALETTE[i % MONO_PALETTE.length],
      }));
  }, [stats]);

  /* ─── 스켈레톤 로딩 ─── */
  if (loading && !stats) {
    return (
      <div className="min-h-dvh bg-[var(--toss-bg)]">
        <NavigationBar title={lang === 'ko' ? '인사이트' : 'Insights'} onBack={() => navigate(-1)} />
        <div style={{ padding: PX }}>
          <Skeleton width="100%" height={120} borderRadius={CARD_R} />
          <div className="mt-3" />
          <Skeleton width="100%" height={200} borderRadius={CARD_R} />
          <div className="mt-3" />
          <Skeleton width="100%" height={200} borderRadius={CARD_R} />
        </div>
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="min-h-dvh bg-[var(--toss-bg)]">
        <NavigationBar title={lang === 'ko' ? '인사이트' : 'Insights'} onBack={() => navigate(-1)} />
        <div className="flex flex-col items-center justify-center" style={{ padding: PX, paddingTop: 80 }}>
          <BarChart3 size={48} className="text-toss-grey-300 mb-4" />
          <p className="text-toss-grey-500 text-center" style={{ ...T.t6 }}>{error}</p>
          <button
            onClick={handleRefresh}
            className="mt-4 text-toss-blue active:bg-toss-blue-50 rounded-xl transition-colors"
            style={{ ...T.t6, fontWeight: W.semibold, padding: '12px 24px' }}
          >
            {lang === 'ko' ? '다시 시도' : 'Retry'}
          </button>
        </div>
      </div>
    );
  }

  const s = stats!;

  return (
    <div className="min-h-dvh bg-[var(--toss-bg)] pb-20">
      <NavigationBar
        title={lang === 'ko' ? '인사이트' : 'Insights'}
        onBack={() => navigate(-1)}
        right={
          <button
            onClick={handleRefresh}
            className="flex items-center justify-center text-toss-grey-500 active:bg-toss-grey-100 rounded-lg transition-colors"
            style={{ width: 36, height: 36 }}
            aria-label="새로고침"
          >
            <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
          </button>
        }
      />

      <div style={{ padding: `16px ${PX}px ${PX}px` }}>

        {/* ─── 핵심 지표 그리드 ─── */}
        <motion.div
          initial={mc.safeAnimate({ opacity: 0, y: MOTION_DISTANCE.card })}
          animate={mc.safeAnimate({ opacity: 1, y: 0 })}
          transition={mc.safeTransition('screen')}
          className="grid grid-cols-2 gap-3"
          style={{ marginBottom: 16 }}
        >
          <StatNumber value={s.totalContacts} label={lang === 'ko' ? '총 인연' : 'Contacts'} icon={<Users size={20} />} suffix={lang === 'ko' ? '명' : ''} />
          <StatNumber value={s.streak} label={lang === 'ko' ? '연속 연락' : 'Streak'} icon={<Flame size={20} />} suffix={lang === 'ko' ? '일' : 'd'} />
          <StatNumber value={s.recentLogCount} label={lang === 'ko' ? '최근 30일' : 'Last 30d'} icon={<Phone size={20} />} suffix={lang === 'ko' ? '회' : ''} />
          <StatNumber value={s.autoMessageEnabledCount} label={lang === 'ko' ? '자동 메시지' : 'Auto Msgs'} icon={<MessageSquare size={20} />} suffix={lang === 'ko' ? '명' : ''} />
        </motion.div>

        {/* ─── 주간 활동 추이 ─── */}
        {s.weeklyActivity.length > 0 && (
          <Card title={lang === 'ko' ? '주간 연락 활동' : 'Weekly Activity'} delay={0.05}>
            <div style={{ width: '100%', height: 180 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={s.weeklyActivity} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--toss-grey-100)" vertical={false} />
                  <XAxis
                    dataKey="week"
                    tick={{ fontSize: 11, fill: 'var(--toss-grey-400)' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: 'var(--toss-grey-400)' }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--toss-card-bg)',
                      border: '1px solid var(--toss-grey-200)',
                      borderRadius: 12,
                      fontSize: 13,
                    }}
                    formatter={(value: number) => [`${value}회`, lang === 'ko' ? '연락' : 'Contacts']}
                  />
                  <Bar dataKey="count" fill="#171717" radius={[4, 4, 0, 0]} maxBarSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        )}

        {/* ─── 연락 타입 분포 ─── */}
        {logTypePieData.length > 0 && (
          <Card title={lang === 'ko' ? '연락 방법 분포' : 'Contact Methods'} delay={0.1}>
            <div className="flex items-center gap-4">
              <div style={{ width: 120, height: 120 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={logTypePieData}
                      dataKey="value"
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={55}
                      paddingAngle={2}
                      stroke="none"
                    >
                      {logTypePieData.map((d, i) => (
                        <Cell key={i} fill={d.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 flex flex-col gap-2">
                {logTypePieData.map((d) => (
                  <div key={d.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span style={{ fontSize: 14 }}>{d.emoji}</span>
                      <span className="text-toss-grey-700" style={{ ...T.s12 }}>{d.name}</span>
                    </div>
                    <span className="text-toss-grey-900" style={{ ...T.s12, fontWeight: W.semibold }}>{d.value}회</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* ─── 관계 분포 ─── */}
        {relPieData.length > 0 && (
          <Card title={lang === 'ko' ? '관계 분포' : 'Relationship Dist.'} delay={0.15}>
            <div className="flex items-center gap-4">
              <div style={{ width: 120, height: 120 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={relPieData}
                      dataKey="value"
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={55}
                      paddingAngle={2}
                      stroke="none"
                    >
                      {relPieData.map((d, i) => (
                        <Cell key={i} fill={d.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 flex flex-col gap-2">
                {relPieData.map((d) => (
                  <div key={d.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="rounded-full" style={{ width: 10, height: 10, backgroundColor: d.color }} />
                      <span className="text-toss-grey-700" style={{ ...T.s12 }}>{d.name}</span>
                    </div>
                    <span className="text-toss-grey-900" style={{ ...T.s12, fontWeight: W.semibold }}>{d.value}명</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* ─── 친밀도 분포 ─── */}
        {closenessPieData.length > 0 && (
          <Card title={lang === 'ko' ? '친밀도 분포' : 'Closeness Dist.'} delay={0.2}>
            <div className="flex flex-wrap gap-2">
              {closenessPieData.map((d) => {
                const total = Object.values(s.closenessDistribution).reduce((a, b) => a + b, 0);
                const pct = total > 0 ? Math.round((d.value / total) * 100) : 0;
                return (
                  <div
                    key={d.name}
                    className="flex items-center gap-2 border border-toss-grey-100"
                    style={{ borderRadius: 20, padding: '8px 14px' }}
                  >
                    <span className="text-toss-grey-800" style={{ ...T.s12, fontWeight: W.semibold }}>{d.name}</span>
                    <span className="text-toss-grey-400" style={{ ...T.s13 }}>{d.value}명 ({pct}%)</span>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* ─── 자주 연락하는 인연 TOP 5 ─── */}
        {s.topContacted.length > 0 && (
          <Card title={lang === 'ko' ? '자주 연락하는 인연' : 'Most Contacted'} delay={0.25}>
            <div className="flex flex-col gap-1">
              {s.topContacted.map((ct, idx) => (
                <button
                  key={ct.contactId}
                  onClick={() => navigate(`/app/contact/${ct.contactId}`)}
                  className="flex items-center gap-3 w-full text-left active:bg-toss-grey-50 rounded-xl transition-colors"
                  style={{ padding: '10px 8px' }}
                >
                  <span className="text-toss-grey-400 shrink-0" style={{ ...T.s12, fontWeight: W.bold, width: 20, textAlign: 'center' }}>
                    {idx + 1}
                  </span>
                  <ContactAvatar name={ct.name} size={36} />
                  <div className="flex-1 min-w-0">
                    <div className="text-toss-grey-900 truncate" style={{ ...T.t6, fontWeight: W.semibold }}>{ct.name}</div>
                    <div className="text-toss-grey-500" style={{ ...T.s12 }}>{ct.relationship}</div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <TrendingUp size={14} className="text-toss-grey-400" />
                    <span className="text-toss-grey-700" style={{ ...T.s12, fontWeight: W.semibold }}>{ct.count}회</span>
                  </div>
                </button>
              ))}
            </div>
          </Card>
        )}

        {/* ─── 연락 공백 주의 ─── */}
        {s.needsAttention.length > 0 && (
          <Card title={lang === 'ko' ? '연락 공백 주의' : 'Needs Attention'} delay={0.3}>
            <div className="flex flex-col gap-1">
              {s.needsAttention.slice(0, 5).map((ct) => (
                <button
                  key={ct.contactId}
                  onClick={() => navigate(`/app/contact/${ct.contactId}`)}
                  className="flex items-center gap-3 w-full text-left active:bg-toss-grey-50 rounded-xl transition-colors"
                  style={{ padding: '10px 8px' }}
                >
                  <ContactAvatar name={ct.name} size={36} />
                  <div className="flex-1 min-w-0">
                    <div className="text-toss-grey-900 truncate" style={{ ...T.t6, fontWeight: W.semibold }}>{ct.name}</div>
                    <div className="text-toss-grey-500" style={{ ...T.s12 }}>{ct.relationship}</div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-toss-red" style={{ ...T.s12, fontWeight: W.bold }}>{ct.contactGap}일</span>
                    <ArrowRight size={14} className="text-toss-grey-300" />
                  </div>
                </button>
              ))}
            </div>
          </Card>
        )}

        {/* ─── 다가오는 생일 ─── */}
        {s.upcomingBirthdays.length > 0 && (
          <Card title={lang === 'ko' ? '다가오는 생일' : 'Upcoming Birthdays'} delay={0.35}>
            <div className="flex flex-col gap-1">
              {s.upcomingBirthdays.map((ct) => (
                <button
                  key={ct.contactId}
                  onClick={() => navigate(`/app/contact/${ct.contactId}`)}
                  className="flex items-center gap-3 w-full text-left active:bg-toss-grey-50 rounded-xl transition-colors"
                  style={{ padding: '10px 8px' }}
                >
                  <ContactAvatar name={ct.name} size={36} />
                  <div className="flex-1 min-w-0">
                    <div className="text-toss-grey-900 truncate" style={{ ...T.t6, fontWeight: W.semibold }}>{ct.name}</div>
                    <div className="text-toss-grey-500" style={{ ...T.s12 }}>
                      {ct.birthday?.slice(5).replace('-', '/')} · {ct.relationship}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Calendar size={14} className="text-toss-grey-400" />
                    <span className="text-toss-blue" style={{ ...T.s12, fontWeight: W.bold }}>D-{ct.dday}</span>
                  </div>
                </button>
              ))}
            </div>
          </Card>
        )}

        {/* ─── 빈 상태 ─── */}
        {s.totalLogs === 0 && (
          <Card title="" delay={0.1}>
            <div className="flex flex-col items-center py-8">
              <BarChart3 size={40} className="text-toss-grey-300 mb-3" />
              <p className="text-toss-grey-500 text-center" style={{ ...T.t6 }}>
                {lang === 'ko' ? '아직 연락 기록이 없어요' : 'No interaction logs yet'}
              </p>
              <p className="text-toss-grey-400 text-center mt-1" style={{ ...T.s12 }}>
                {lang === 'ko' ? '연락처 상세에서 연락 기록을 남겨보세요' : 'Start logging from contact details'}
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
