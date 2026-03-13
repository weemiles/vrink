/**
 * networkLayout.ts
 * ────────────────────────────────────────────────
 * 인맥 지도용 Force-Directed Graph 레이아웃 엔진.
 *
 * 물리 시뮬레이션:
 *  - 중심 인력 (centering force)
 *  - 노드 간 척력 (Coulomb repulsion)
 *  - 간선 인력 (Hooke's spring)
 *  - 감쇠 (velocity damping)
 *
 * 렌더링은 하지 않고, 노드 위치만 계산합니다.
 */
import type { Contact, Relationship } from './contacts';

/* ═══════════════════════════════════════════════
   타입 정의
   ═══════════════════════════════════════════════ */

export interface GraphNode {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  name: string;
  avatarColor: string;
  relationship: string;
  closeness: string;
  phone?: string;
  contactGap: number;
  isFavorite: boolean;
  isCenter?: boolean; // "나" 노드
  groupIds: string[];
  tags: string[];
}

export interface GraphEdge {
  source: string;
  target: string;
  type: 'relationship' | 'group' | 'tag';
  label: string;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

/* ═══════════════════════════════════════════════
   무채색 관계 색상 매핑 (Keepin Mono)
   ═══════════════════════════════════════════════ */

export const RELATIONSHIP_SHADES: Record<string, string> = {
  '가족':     '#2D2D2D',
  '친구':     '#525252',
  '직장 동료': '#6B6B6B',
  '학교':     '#8A8A8A',
  '군대':     '#737373',
};

export function getRelationshipShade(rel: string): string {
  return RELATIONSHIP_SHADES[rel] ?? '#999999';
}

/* ═══════════════════════════════════════════════
   친밀도 → 노드 크기 매핑
   ═══════════════════════════════════════════════ */

const CLOSENESS_RADIUS: Record<string, number> = {
  '가족':     28,
  '매우 친함': 26,
  '친함':     22,
  '보통':     18,
  '가끔':     15,
  '거의 모름': 13,
};

function getNodeRadius(closeness: string): number {
  return CLOSENESS_RADIUS[closeness] ?? 18;
}

/* ═══════════════════════════════════════════════
   그래프 데이터 생성
   ═══════════════════════════════════════════════ */

export function buildGraphData(
  contacts: Contact[],
  centerX: number,
  centerY: number,
): GraphData {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  // "나" 노드 (중심)
  const meNode: GraphNode = {
    id: '__me__',
    x: centerX,
    y: centerY,
    vx: 0,
    vy: 0,
    radius: 34,
    name: '나',
    avatarColor: '#171717',
    relationship: '',
    closeness: '',
    contactGap: 0,
    isFavorite: false,
    isCenter: true,
    groupIds: [],
    tags: [],
  };
  nodes.push(meNode);

  // 연락처 노드
  const angle0 = (Math.PI * 2) / Math.max(contacts.length, 1);
  contacts.forEach((c, i) => {
    // 초기 위치: 원형 배치 + 약간의 랜덤 편차
    const baseRadius = 120 + Math.random() * 80;
    const a = angle0 * i + (Math.random() - 0.5) * 0.3;
    nodes.push({
      id: c.id,
      x: centerX + Math.cos(a) * baseRadius,
      y: centerY + Math.sin(a) * baseRadius,
      vx: 0,
      vy: 0,
      radius: getNodeRadius(c.closeness),
      name: c.name,
      avatarColor: c.avatarColor,
      relationship: c.relationship,
      closeness: c.closeness,
      phone: c.phone,
      contactGap: c.contactGap,
      isFavorite: c.isFavorite ?? false,
      groupIds: c.groupIds ?? [],
      tags: c.tags ?? [],
    });

    // 나 ↔ 연락처 간선
    edges.push({
      source: '__me__',
      target: c.id,
      type: 'relationship',
      label: c.relationship,
    });
  });

  // 같은 관계 유형 간 간선
  const relMap = new Map<string, string[]>();
  contacts.forEach((c) => {
    const arr = relMap.get(c.relationship) || [];
    arr.push(c.id);
    relMap.set(c.relationship, arr);
  });
  for (const [rel, ids] of relMap) {
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        edges.push({
          source: ids[i],
          target: ids[j],
          type: 'relationship',
          label: rel,
        });
      }
    }
  }

  // 같은 그룹 간 간선
  const groupMap = new Map<string, string[]>();
  contacts.forEach((c) => {
    (c.groupIds ?? []).forEach((gid) => {
      const arr = groupMap.get(gid) || [];
      arr.push(c.id);
      groupMap.set(gid, arr);
    });
  });
  for (const [, ids] of groupMap) {
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        if (!edges.some((e) =>
          (e.source === ids[i] && e.target === ids[j]) ||
          (e.source === ids[j] && e.target === ids[i])
        )) {
          edges.push({
            source: ids[i],
            target: ids[j],
            type: 'group',
            label: 'group',
          });
        }
      }
    }
  }

  return { nodes, edges };
}

/* ═══════════════════════════════════════════════
   물리 시뮬레이션
   ═══════════════════════════════════════════════ */

const REPULSION = 3000;
const ATTRACTION = 0.004;
const CENTER_PULL = 0.01;
const DAMPING = 0.85;
const MAX_VELOCITY = 8;
const MIN_DISTANCE = 10;

export function simulateStep(
  nodes: GraphNode[],
  edges: GraphEdge[],
  centerX: number,
  centerY: number,
): void {
  // 1) 척력 (모든 노드 쌍)
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i];
      const b = nodes[j];
      let dx = b.x - a.x;
      let dy = b.y - a.y;
      let dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < MIN_DISTANCE) dist = MIN_DISTANCE;

      const force = REPULSION / (dist * dist);
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;

      if (!a.isCenter) { a.vx -= fx; a.vy -= fy; }
      if (!b.isCenter) { b.vx += fx; b.vy += fy; }
    }
  }

  // 2) 인력 (간선)
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  for (const edge of edges) {
    const a = nodeMap.get(edge.source);
    const b = nodeMap.get(edge.target);
    if (!a || !b) continue;

    const dx = b.x - a.x;
    const dy = b.y - a.y;
    let dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < MIN_DISTANCE) dist = MIN_DISTANCE;

    const force = dist * ATTRACTION;
    const fx = (dx / dist) * force;
    const fy = (dy / dist) * force;

    if (!a.isCenter) { a.vx += fx; a.vy += fy; }
    if (!b.isCenter) { b.vx -= fx; b.vy -= fy; }
  }

  // 3) 중심 인력
  for (const node of nodes) {
    if (node.isCenter) continue;
    const dx = centerX - node.x;
    const dy = centerY - node.y;
    node.vx += dx * CENTER_PULL;
    node.vy += dy * CENTER_PULL;
  }

  // 4) 감쇠 + 위치 갱신
  for (const node of nodes) {
    if (node.isCenter) continue;
    node.vx *= DAMPING;
    node.vy *= DAMPING;

    // 최대 속도 제한
    const speed = Math.sqrt(node.vx * node.vx + node.vy * node.vy);
    if (speed > MAX_VELOCITY) {
      node.vx = (node.vx / speed) * MAX_VELOCITY;
      node.vy = (node.vy / speed) * MAX_VELOCITY;
    }

    node.x += node.vx;
    node.y += node.vy;
  }
}

/** 전체 에너지 (시뮬레이션 수렴 판단용) */
export function totalEnergy(nodes: GraphNode[]): number {
  let energy = 0;
  for (const n of nodes) {
    energy += n.vx * n.vx + n.vy * n.vy;
  }
  return energy;
}
