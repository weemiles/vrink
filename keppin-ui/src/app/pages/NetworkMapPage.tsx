import {
  useState, useRef, useEffect, useCallback, useMemo,
} from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronLeft, ZoomIn, ZoomOut, Maximize2,
  Phone, Star, X, ExternalLink,
} from 'lucide-react';
import { useContacts } from '../data/contactsStore';
import {
  buildGraphData,
  simulateStep,
  totalEnergy,
  getRelationshipShade,
  type GraphNode,
  type GraphData,
} from '../data/networkLayout';
import { useLanguage } from '../components/useLanguage';
import { useDocumentTitle } from '../components/useDocumentTitle';

/* ─── 관계 필터 칩 ─── */
const REL_FILTERS = [
  { key: 'all', ko: '전체', en: 'All' },
  { key: '가족', ko: '가족', en: 'Family' },
  { key: '친구', ko: '친구', en: 'Friends' },
  { key: '직장 동료', ko: '직장', en: 'Work' },
  { key: '학교', ko: '학교', en: 'School' },
  { key: '군대', ko: '군대', en: 'Military' },
] as const;

/* ─── 상수 ─── */
const SIMULATION_STEPS = 200; // 초기 안정화 스텝
const DPR = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1;
const INITIAL_ZOOM = 1;
const ZOOM_MIN = 0.3;
const ZOOM_MAX = 3;
const ZOOM_STEP = 0.2;

/* ═══════════════════════════════════════════════
   메인 컴포넌트
   ═══════════════════════════════════════════════ */

export function NetworkMapPage() {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  useDocumentTitle(lang === 'ko' ? '인맥 지도' : 'Network Map');
  const contacts = useContacts();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<GraphData | null>(null);
  const rafRef = useRef<number>(0);

  /* ── 뷰 상태 ── */
  const [zoom, setZoom] = useState(INITIAL_ZOOM);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [relFilter, setRelFilter] = useState('all');
  const [canvasSize, setCanvasSize] = useState({ w: 400, h: 600 });

  /* ── 필터 적용된 연락처 ── */
  const filteredContacts = useMemo(() => {
    if (relFilter === 'all') return contacts;
    return contacts.filter((c) => c.relationship === relFilter);
  }, [contacts, relFilter]);

  /* ── 시뮬레이션 수렴 여부 ── */
  const [settled, setSettled] = useState(false);

  /* ── 드래그 상태 ── */
  const dragRef = useRef<{
    dragging: boolean;
    nodeId: string | null;
    startX: number;
    startY: number;
    startPanX: number;
    startPanY: number;
  }>({
    dragging: false,
    nodeId: null,
    startX: 0,
    startY: 0,
    startPanX: 0,
    startPanY: 0,
  });

  /* ═══════════════════════════════════════════════
     캔버스 크기 측정
     ═══════════════════════════════════════════════ */
  useEffect(() => {
    const measure = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setCanvasSize({ w: rect.width, h: rect.height });
      }
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  /* ═══════════════════════════════════════════════
     그래프 빌드 + 초기 시뮬레이션
     ═══════════════════════════════════════════════ */
  useEffect(() => {
    const cx = canvasSize.w / 2;
    const cy = canvasSize.h / 2;
    const data = buildGraphData(filteredContacts, cx, cy);

    // 초기 안정화
    for (let i = 0; i < SIMULATION_STEPS; i++) {
      simulateStep(data.nodes, data.edges, cx, cy);
    }

    graphRef.current = data;
    setSettled(false);
    setPanX(0);
    setPanY(0);
    setSelectedNode(null);
  }, [filteredContacts, canvasSize]);

  /* ═══════════════════════════════════════════════
     렌더 루프
     ═══════════════════════════════════════════════ */
  const renderFrame = useCallback(() => {
    const canvas = canvasRef.current;
    const graph = graphRef.current;
    if (!canvas || !graph) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { w, h } = canvasSize;
    const cx = w / 2;
    const cy = h / 2;

    // 시뮬레이션 스텝 (아직 안정화 안 됐으면)
    if (!settled) {
      simulateStep(graph.nodes, graph.edges, cx, cy);
      if (totalEnergy(graph.nodes) < 0.1) {
        setSettled(true);
      }
    }

    // 캔버스 클리어
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctx.clearRect(0, 0, w, h);

    // 줌 + 팬 변환
    ctx.save();
    ctx.translate(cx + panX, cy + panY);
    ctx.scale(zoom, zoom);
    ctx.translate(-cx, -cy);

    // 간선 그리기
    const nodeMap = new Map(graph.nodes.map((n) => [n.id, n]));
    for (const edge of graph.edges) {
      const a = nodeMap.get(edge.source);
      const b = nodeMap.get(edge.target);
      if (!a || !b) continue;

      // "나"와 연결된 간선은 약간 더 진하게
      const isMeEdge = a.isCenter || b.isCenter;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.strokeStyle = isMeEdge ? 'rgba(100,100,100,0.18)' : 'rgba(160,160,160,0.10)';
      ctx.lineWidth = isMeEdge ? 1.5 : 0.8;
      ctx.stroke();
    }

    // 노드 그리기
    for (const node of graph.nodes) {
      drawNode(ctx, node, node.id === selectedNode?.id);
    }

    ctx.restore();

    rafRef.current = requestAnimationFrame(renderFrame);
  }, [canvasSize, zoom, panX, panY, selectedNode, settled]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(renderFrame);
    return () => cancelAnimationFrame(rafRef.current);
  }, [renderFrame]);

  /* ═══════════════════════════════════════════════
     노드 그리기
     ═══════════════════════════════════════════════ */
  function drawNode(ctx: CanvasRenderingContext2D, node: GraphNode, isSelected: boolean) {
    const { x, y, radius, name, isCenter } = node;

    // 연락 공백에 따른 투명도 (최근 연락 = 불투명, 오래됨 = 반투명)
    const opacity = isCenter ? 1 : Math.max(0.35, 1 - node.contactGap / 180);

    ctx.globalAlpha = opacity;

    // 선택된 노드 하이라이트
    if (isSelected) {
      ctx.beginPath();
      ctx.arc(x, y, radius + 5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(59, 130, 246, 0.2)';
      ctx.fill();
      ctx.strokeStyle = '#3B82F6';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // 즐겨찾기 표시
    if (node.isFavorite && !isCenter) {
      ctx.beginPath();
      ctx.arc(x, y, radius + 3, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(100,100,100,0.3)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 3]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 메인 원
    const shade = isCenter ? '#171717' : getRelationshipShade(node.relationship);
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = shade + (isCenter ? '' : '25');
    ctx.fill();
    ctx.strokeStyle = shade;
    ctx.lineWidth = isCenter ? 2.5 : 1.5;
    ctx.stroke();

    // 이름 텍스트
    ctx.fillStyle = isCenter ? '#FFFFFF' : shade;
    ctx.font = `${isCenter ? 'bold' : '600'} ${isCenter ? 14 : Math.max(9, radius * 0.55)}px -apple-system, BlinkMacSystemFont, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // 긴 이름은 첫 글자만
    const displayName = isCenter ? '나' : (name.length > 3 ? name.slice(0, 2) : name);
    ctx.fillText(displayName, x, y);

    // 이름이 긴 경우 아래에 작게 전체 이름
    if (!isCenter && name.length > 3) {
      ctx.font = `500 ${Math.max(8, radius * 0.35)}px -apple-system, sans-serif`;
      ctx.fillStyle = 'rgba(80,80,80,0.6)';
      ctx.fillText(name, x, y + radius + 10);
    }

    ctx.globalAlpha = 1;
  }

  /* ═══════════════════════════════════════════════
     터치/마우스 이벤트
     ═══════════════════════════════════════════════ */

  /** 캔버스 좌표 → 그래프 좌표 변환 */
  const canvasToGraph = useCallback(
    (clientX: number, clientY: number): { gx: number; gy: number } => {
      const canvas = canvasRef.current;
      if (!canvas) return { gx: 0, gy: 0 };
      const rect = canvas.getBoundingClientRect();
      const px = clientX - rect.left;
      const py = clientY - rect.top;
      const cx = canvasSize.w / 2;
      const cy = canvasSize.h / 2;
      const gx = (px - cx - panX) / zoom + cx;
      const gy = (py - cy - panY) / zoom + cy;
      return { gx, gy };
    },
    [canvasSize, zoom, panX, panY],
  );

  /** 해당 좌표의 노드 찾기 */
  const findNodeAt = useCallback(
    (gx: number, gy: number): GraphNode | null => {
      const graph = graphRef.current;
      if (!graph) return null;
      // 역순 탐색 (위에 그려진 노드부터)
      for (let i = graph.nodes.length - 1; i >= 0; i--) {
        const n = graph.nodes[i];
        const dx = gx - n.x;
        const dy = gy - n.y;
        if (dx * dx + dy * dy <= (n.radius + 8) * (n.radius + 8)) {
          return n;
        }
      }
      return null;
    },
    [],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const { gx, gy } = canvasToGraph(e.clientX, e.clientY);
      const node = findNodeAt(gx, gy);

      if (node && !node.isCenter) {
        dragRef.current = {
          dragging: true,
          nodeId: node.id,
          startX: e.clientX,
          startY: e.clientY,
          startPanX: panX,
          startPanY: panY,
        };
        e.currentTarget.setPointerCapture(e.pointerId);
      } else {
        // 빈 공간 드래그 → 팬
        dragRef.current = {
          dragging: true,
          nodeId: null,
          startX: e.clientX,
          startY: e.clientY,
          startPanX: panX,
          startPanY: panY,
        };
        e.currentTarget.setPointerCapture(e.pointerId);
      }
    },
    [canvasToGraph, findNodeAt, panX, panY],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const d = dragRef.current;
      if (!d.dragging) return;

      const dx = e.clientX - d.startX;
      const dy = e.clientY - d.startY;

      if (d.nodeId) {
        // 노드 드래그
        const graph = graphRef.current;
        if (!graph) return;
        const node = graph.nodes.find((n) => n.id === d.nodeId);
        if (!node) return;
        node.x += dx / zoom;
        node.y += dy / zoom;
        node.vx = 0;
        node.vy = 0;
        d.startX = e.clientX;
        d.startY = e.clientY;
        setSettled(false); // 다시 시뮬레이션
      } else {
        // 팬
        setPanX(d.startPanX + dx);
        setPanY(d.startPanY + dy);
      }
    },
    [zoom],
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const d = dragRef.current;
      const dx = Math.abs(e.clientX - d.startX);
      const dy = Math.abs(e.clientY - d.startY);

      // 클릭(이동 거리 작음) → 노드 선택
      if (dx < 5 && dy < 5) {
        const { gx, gy } = canvasToGraph(e.clientX, e.clientY);
        const node = findNodeAt(gx, gy);
        if (node && !node.isCenter) {
          setSelectedNode((prev) => (prev?.id === node.id ? null : node));
        } else {
          setSelectedNode(null);
        }
      }

      dragRef.current.dragging = false;
      dragRef.current.nodeId = null;
    },
    [canvasToGraph, findNodeAt],
  );

  /* ── 줌 ── */
  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
      setZoom((z) => Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, z + delta)));
    },
    [],
  );

  const zoomIn = useCallback(() => {
    setZoom((z) => Math.min(ZOOM_MAX, z + ZOOM_STEP));
  }, []);

  const zoomOut = useCallback(() => {
    setZoom((z) => Math.max(ZOOM_MIN, z - ZOOM_STEP));
  }, []);

  const resetView = useCallback(() => {
    setZoom(INITIAL_ZOOM);
    setPanX(0);
    setPanY(0);
  }, []);

  /* ── 노드 수 통계 ── */
  const stats = useMemo(() => {
    const relCounts: Record<string, number> = {};
    filteredContacts.forEach((c) => {
      relCounts[c.relationship] = (relCounts[c.relationship] || 0) + 1;
    });
    return { total: filteredContacts.length, relCounts };
  }, [filteredContacts]);

  return (
    <div className="fixed inset-0 flex flex-col bg-[var(--toss-bg)]">
      {/* 상단 바 */}
      <div
        className="flex items-center justify-between shrink-0 bg-[var(--toss-bg)]/95 backdrop-blur-lg z-10"
        style={{
          padding: '12px 16px',
          paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)',
        }}
      >
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-toss-grey-900 active:text-toss-grey-500 transition-colors"
          style={{ fontSize: 15, fontWeight: 600, minHeight: 44, minWidth: 44, padding: '4px 8px' }}
        >
          <ChevronLeft size={20} />
          <span>{lang === 'ko' ? '뒤로' : 'Back'}</span>
        </button>

        <h1 className="text-toss-grey-900 text-center" style={{ fontSize: 16, fontWeight: 700 }}>
          {lang === 'ko' ? '인맥 지도' : 'Network Map'}
        </h1>

        <div className="flex items-center gap-1" style={{ minWidth: 80, justifyContent: 'flex-end' }}>
          <button
            onClick={zoomOut}
            className="flex items-center justify-center text-toss-grey-600 active:text-toss-grey-400 transition-colors"
            style={{ width: 36, height: 36 }}
            aria-label="Zoom out"
          >
            <ZoomOut size={18} />
          </button>
          <span className="text-toss-grey-500" style={{ fontSize: 11, fontWeight: 600, width: 32, textAlign: 'center' }}>
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={zoomIn}
            className="flex items-center justify-center text-toss-grey-600 active:text-toss-grey-400 transition-colors"
            style={{ width: 36, height: 36 }}
            aria-label="Zoom in"
          >
            <ZoomIn size={18} />
          </button>
          <button
            onClick={resetView}
            className="flex items-center justify-center text-toss-grey-600 active:text-toss-grey-400 transition-colors"
            style={{ width: 36, height: 36 }}
            aria-label="Reset view"
          >
            <Maximize2 size={16} />
          </button>
        </div>
      </div>

      {/* 관계 필터 칩 */}
      <div
        className="shrink-0 flex gap-2 overflow-x-auto z-10"
        style={{ padding: '4px 16px 12px', scrollbarWidth: 'none' }}
      >
        {REL_FILTERS.map((f) => {
          const active = relFilter === f.key;
          const count = f.key === 'all' ? stats.total : (stats.relCounts[f.key] ?? 0);
          return (
            <button
              key={f.key}
              onClick={() => setRelFilter(f.key)}
              className={`shrink-0 flex items-center gap-1.5 rounded-full transition-colors ${
                active
                  ? 'bg-toss-grey-900 text-white'
                  : 'bg-toss-grey-100 text-toss-grey-600 active:bg-toss-grey-200'
              }`}
              style={{
                fontSize: 13,
                fontWeight: active ? 700 : 500,
                padding: '7px 14px',
              }}
            >
              {f.key !== 'all' && (
                <span
                  className="rounded-full"
                  style={{
                    width: 8,
                    height: 8,
                    backgroundColor: active ? '#FFFFFF' : getRelationshipShade(f.key),
                    opacity: active ? 0.7 : 0.5,
                  }}
                />
              )}
              {lang === 'ko' ? f.ko : f.en}
              {f.key === 'all' && (
                <span style={{ fontWeight: 400, opacity: 0.7 }}>{stats.total}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* 캔버스 */}
      <div ref={containerRef} className="flex-1 relative overflow-hidden">
        <canvas
          ref={canvasRef}
          width={canvasSize.w * DPR}
          height={canvasSize.h * DPR}
          style={{
            width: canvasSize.w,
            height: canvasSize.h,
            touchAction: 'none',
            cursor: dragRef.current.dragging ? 'grabbing' : 'grab',
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onWheel={handleWheel}
        />

        {/* 범례 */}
        <div
          className="absolute bottom-4 left-4 bg-[var(--toss-card-bg)]/90 backdrop-blur-md rounded-xl z-10"
          style={{
            padding: '10px 14px',
            border: '1px solid var(--toss-grey-100)',
          }}
        >
          <p className="text-toss-grey-500 mb-1.5" style={{ fontSize: 10, fontWeight: 600, letterSpacing: 0.5 }}>
            {lang === 'ko' ? '범례' : 'LEGEND'}
          </p>
          <div className="space-y-1">
            {[
              { label: lang === 'ko' ? '가족' : 'Family', shade: '#2D2D2D' },
              { label: lang === 'ko' ? '친구' : 'Friends', shade: '#525252' },
              { label: lang === 'ko' ? '직장' : 'Work', shade: '#6B6B6B' },
              { label: lang === 'ko' ? '학교' : 'School', shade: '#8A8A8A' },
              { label: lang === 'ko' ? '군대' : 'Military', shade: '#737373' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <span
                  className="rounded-full shrink-0"
                  style={{ width: 8, height: 8, backgroundColor: item.shade }}
                />
                <span className="text-toss-grey-600" style={{ fontSize: 11 }}>
                  {item.label}
                </span>
              </div>
            ))}
            <div className="flex items-center gap-2 mt-1 pt-1 border-t border-toss-grey-100">
              <span className="text-toss-grey-400" style={{ fontSize: 10 }}>
                {lang === 'ko' ? '노드 크기 = 친밀도' : 'Node size = closeness'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-toss-grey-400" style={{ fontSize: 10 }}>
                {lang === 'ko' ? '투명도 = 최근 연락' : 'Opacity = recent contact'}
              </span>
            </div>
          </div>
        </div>

        {/* 통계 뱃지 */}
        <div
          className="absolute top-3 right-4 bg-[var(--toss-card-bg)]/90 backdrop-blur-md rounded-xl z-10"
          style={{
            padding: '8px 12px',
            border: '1px solid var(--toss-grey-100)',
          }}
        >
          <span className="text-toss-grey-500" style={{ fontSize: 11, fontWeight: 600 }}>
            {lang === 'ko' ? `${stats.total}명` : `${stats.total} people`}
          </span>
        </div>
      </div>

      {/* ═══════ 선택된 노드 상세 카드 ═══════ */}
      <AnimatePresence>
        {selectedNode && !selectedNode.isCenter && (
          <motion.div
            key={selectedNode.id}
            initial={{ y: 120, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 120, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="absolute bottom-0 left-0 right-0 bg-[var(--toss-card-bg)] rounded-t-2xl z-20"
            style={{
              padding: '20px 24px',
              paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 20px)',
              borderTop: '1px solid var(--toss-grey-100)',
              boxShadow: '0 -4px 20px rgba(0,0,0,0.08)',
            }}
          >
            {/* 닫기 */}
            <button
              onClick={() => setSelectedNode(null)}
              className="absolute top-4 right-4 flex items-center justify-center text-toss-grey-400 active:text-toss-grey-600"
              style={{ width: 32, height: 32 }}
              aria-label="Close"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-4 mb-3">
              {/* 아바타 */}
              <div
                className="flex items-center justify-center rounded-full shrink-0"
                style={{
                  width: 52,
                  height: 52,
                  backgroundColor: getRelationshipShade(selectedNode.relationship) + '20',
                  border: `2px solid ${getRelationshipShade(selectedNode.relationship)}`,
                }}
              >
                <span
                  style={{
                    fontSize: 20,
                    fontWeight: 700,
                    color: getRelationshipShade(selectedNode.relationship),
                  }}
                >
                  {selectedNode.name.charAt(0)}
                </span>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-toss-grey-900 truncate" style={{ fontSize: 17, fontWeight: 700 }}>
                    {selectedNode.name}
                  </h3>
                  {selectedNode.isFavorite && (
                    <Star size={14} className="text-toss-grey-500 fill-toss-grey-500 shrink-0" />
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span
                    className="rounded-full"
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      padding: '2px 8px',
                      backgroundColor: getRelationshipShade(selectedNode.relationship) + '15',
                      color: getRelationshipShade(selectedNode.relationship),
                    }}
                  >
                    {selectedNode.relationship}
                  </span>
                  <span className="text-toss-grey-400" style={{ fontSize: 12 }}>
                    {selectedNode.closeness}
                  </span>
                </div>
              </div>
            </div>

            {/* 하단 정보 */}
            <div className="flex items-center gap-4 text-toss-grey-500" style={{ fontSize: 12 }}>
              {selectedNode.phone && (
                <div className="flex items-center gap-1">
                  <Phone size={12} />
                  <span>{selectedNode.phone}</span>
                </div>
              )}
              <span>
                {selectedNode.contactGap === 0
                  ? (lang === 'ko' ? '오늘 연락함' : 'Contacted today')
                  : lang === 'ko'
                    ? `${selectedNode.contactGap}일 전 연락`
                    : `${selectedNode.contactGap}d ago`}
              </span>
            </div>

            {/* 상세 보기 버튼 */}
            <button
              onClick={() => navigate(`/app/contact/${selectedNode.id}`)}
              className="w-full flex items-center justify-center gap-2 bg-toss-grey-900 text-white active:bg-toss-grey-700 transition-colors mt-4"
              style={{ height: 48, borderRadius: 12, fontSize: 14, fontWeight: 600 }}
            >
              <ExternalLink size={15} />
              {lang === 'ko' ? '상세 보기' : 'View Details'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
