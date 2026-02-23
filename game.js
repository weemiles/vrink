const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

const statsEl = document.getElementById("playerStats") || { innerHTML: "" };
const inventoryEl = document.getElementById("inventory") || { innerHTML: "" };
const logEl = document.getElementById("log") || { innerHTML: "" };

const WORLD_WIDTH = 2600;
const WORLD_HEIGHT = 1800;
const MAX_LOG = 14;
const MONSTER_SPEED_MULTIPLIER = 0.4;
const LEVEL_UP_REQUIREMENT_MULTIPLIER = 2;
const PLAYER_BASE_W = 18;
const PLAYER_BASE_H = 24;
const PLAYER_PIXEL_SCALE = 2;
const MONSTER_SCALE_MULTIPLIER = 1.6;
const UI_TEXT_COLOR = "#F2F2F2";
const UI_TEXT_SHADOW = "rgba(0,0,0,0.8)";
const UI_TEXT_OUTLINE = "rgba(0,0,0,0.9)";
const UI_MIN_FONT_SIZE = 12;
const UI_LINE_HEIGHT = 1.5;
const UI_LETTER_SPACING = 0.5;

const keyState = Object.create(null);
const justPressed = new Set();
const mouse = { x: 0, y: 0 };

const camera = { x: 0, y: 0 };
const demons = [];
const drops = [];
const herbNodes = [];
const treasureChests = [];
const mapPatches = [];
const natureLayers = {
  waters: [],
  trees: [],
  grasses: [],
  flowers: [],
  rocks: []
};
const logs = [];
let skillButtons = [];
let charStatButtons = [];
let levelCardButtons = [];
let skillAssignButtons = [];
let menuHubButtons = [];
let specialItemSerial = 0;
const INVENTORY_COLS = 10;
const INVENTORY_ROWS = 6;
const STASH_COLS = 12;
const STASH_ROWS = 10;
const INVENTORY_CELL = 28;
const inventoryUiState = {
  areas: null,
  dragging: null,
  selectedUid: null,
  hoverUid: null
};

const uiState = {
  inventory: false,
  character: false,
  skills: false,
  fullMap: false,
  menuHub: false
};

const pauseState = {
  open: false,
  settings: false,
  music: 70,
  sfx: 80,
  buttons: [],
  settingButtons: []
};

const combatEffects = [];

const SPRITE_PATTERNS = {
  dagger: [
    "...1....",
    "...1....",
    "..12....",
    "..12....",
    ".123....",
    "..12....",
    "..2.....",
    "........"
  ],
  sword: [
    "...1....",
    "...1....",
    "..111...",
    "...1....",
    "...1....",
    "..232...",
    "...2....",
    "........"
  ],
  spear: [
    "...3....",
    "..313...",
    "...1....",
    "...1....",
    "...1....",
    "..121...",
    "...2....",
    "........"
  ],
  axe: [
    "..11....",
    ".1331...",
    ".1331...",
    "..11....",
    "...1....",
    "...1....",
    "..22....",
    "........"
  ],
  bow: [
    "..31....",
    ".3..1...",
    "3...1...",
    ".3..1...",
    "..31....",
    "...1....",
    "..22....",
    "........"
  ],
  wand: [
    "...3....",
    "..333...",
    "...3....",
    "...1....",
    "...1....",
    "..121...",
    "..2.2...",
    "........"
  ],
  scythe: [
    ".3331...",
    "3...1...",
    ".3331...",
    "...1....",
    "...1....",
    "..121...",
    "...2....",
    "........"
  ],
  hammer: [
    ".1111...",
    ".1331...",
    ".1111...",
    "...1....",
    "...1....",
    "..121...",
    "..2.2...",
    "........"
  ],
  katana: [
    "..33....",
    "...31...",
    "....31..",
    "...31...",
    "..31....",
    ".121....",
    "..2.....",
    "........"
  ],
  crossbow: [
    ".31113..",
    "...1....",
    "...1....",
    ".31113..",
    "...1....",
    "..121...",
    "..2.2...",
    "........"
  ],
  leather: [
    ".2222...",
    "221122..",
    "211112..",
    "211112..",
    "211112..",
    ".2112...",
    ".2..2...",
    "........"
  ],
  plate: [
    ".3333...",
    "331133..",
    "311113..",
    "311113..",
    "311113..",
    ".3113...",
    ".3..3...",
    "........"
  ],
  robe: [
    ".2222...",
    "221122..",
    "211112..",
    "212212..",
    "212212..",
    ".2112...",
    ".2..2...",
    "........"
  ],
  cloak: [
    ".3333...",
    "322223..",
    "322223..",
    "322223..",
    "322223..",
    ".3223...",
    ".3..3...",
    "........"
  ],
  scale: [
    ".2222...",
    "223322..",
    "233332..",
    "233332..",
    "233332..",
    ".2332...",
    ".2..2...",
    "........"
  ],
  holy: [
    ".3333...",
    "331133..",
    "311113..",
    "313313..",
    "311113..",
    ".3113...",
    ".3..3...",
    "........"
  ]
};

const DEMON_PATTERNS = {
  imp: [
    "..11....",
    ".1221...",
    "122221..",
    "122221..",
    ".2332...",
    "..33....",
    ".2..2...",
    ".2..2..."
  ],
  fiendling: [
    ".1..1...",
    "122221..",
    "1222221.",
    "1233321.",
    ".233332.",
    "..3223..",
    ".2.22.2.",
    ".2....2."
  ],
  horned: [
    "1....1..",
    "1222221.",
    "1222221.",
    "1233321.",
    "1233321.",
    ".233332.",
    ".32..23.",
    ".2....2."
  ],
  berserker: [
    "1....1..",
    "1222221.",
    "1233321.",
    "12333321",
    "12333321",
    ".2333332",
    ".32.23.3",
    ".3....3."
  ],
  winged: [
    "1....1..",
    "11222211",
    "12333221",
    "12333321",
    "12333321",
    ".2333332",
    ".3222233",
    ".3....3."
  ],
  archdemon: [
    "11..11..",
    "11222211",
    "12333221",
    "12333321",
    "12333321",
    "12333321",
    ".2333332",
    ".3.22.3."
  ],
  reaper: [
    "11..11..",
    "1222221.",
    "12333321",
    "12333321",
    ".233332.",
    "..3332..",
    ".32..23.",
    ".3....3."
  ],
  behemoth: [
    "111111..",
    "1222221.",
    "12333321",
    "12333321",
    "12333321",
    ".2333332",
    ".3322233",
    ".3.22.3."
  ],
  voidlord: [
    "11..11..",
    "11222211",
    "12333321",
    "12333321",
    "12333321",
    "12333321",
    "12333321",
    ".333333."
  ]
};

const DEMON_FORMS = [
  { min: 1, max: 3, key: "imp", scale: 2, palette: ["#7da98f", "#315b49", "#cee2a7"] },
  { min: 4, max: 8, key: "fiendling", scale: 2, palette: ["#94a56e", "#4f5128", "#d8cb85"] },
  { min: 9, max: 15, key: "horned", scale: 2, palette: ["#a58363", "#61362a", "#debf8a"] },
  { min: 16, max: 24, key: "berserker", scale: 3, palette: ["#b96e59", "#6a2726", "#e5a36e"] },
  { min: 25, max: 36, key: "winged", scale: 3, palette: ["#c46261", "#5c2035", "#e9aa70"] },
  { min: 37, max: 50, key: "archdemon", scale: 3, palette: ["#c25464", "#451627", "#f2b77a"] },
  { min: 51, max: 70, key: "reaper", scale: 3, palette: ["#8daec9", "#2c3f5b", "#d9e7ff"] },
  { min: 71, max: 95, key: "behemoth", scale: 4, palette: ["#b58473", "#4c2e2a", "#f2d1a0"] },
  { min: 96, max: 9999, key: "voidlord", scale: 4, palette: ["#9e73d9", "#2a1f48", "#dac8ff"] }
];

const WEAPON_PALETTES = [
  ["#dce6f7", "#95aacf", "#f6c56a"],
  ["#f2d3bf", "#c98f63", "#ffe28a"],
  ["#d7f5ff", "#74b9d6", "#ffd86c"],
  ["#f0d8ff", "#a38ec9", "#ffd56a"],
  ["#e5e5e5", "#8d8d8d", "#ffc56b"],
  ["#c8f5da", "#6bb885", "#ffd06f"]
];

const ARMOR_PALETTES = [
  ["#b9d4be", "#6f9576", "#f0dea1"],
  ["#d7d8df", "#8f93a6", "#eacb8f"],
  ["#cbd5f5", "#7488be", "#f7d695"],
  ["#f5d4cb", "#b97869", "#fbe2a2"],
  ["#d7f0ef", "#73a7a5", "#f6d38a"],
  ["#e9ddff", "#9b82c4", "#f8dd99"]
];

function makeItemPalette(type, index) {
  const base = type === "weapon" ? WEAPON_PALETTES : ARMOR_PALETTES;
  const palette = base[index % base.length];
  return [palette[0], palette[1], palette[2]];
}

const WEAPON_NAMES = [
  "녹슨 단검",
  "수련검",
  "청동창",
  "화염 도끼",
  "그림자 활",
  "별빛 완드",
  "흑철 대검",
  "은월 레이피어",
  "폭풍 창",
  "번개 석궁",
  "비취 쌍검",
  "룬 지팡이",
  "용아귀 도",
  "심연 낫",
  "태양 검",
  "월광 단도",
  "피닉스 랜스",
  "혼돈 파쇄기",
  "천공 활",
  "마신 멸도"
];

const ARMOR_NAMES = [
  "낡은 가죽옷",
  "견습 갑옷",
  "청동 흉갑",
  "수호 망토",
  "그림자 로브",
  "강철 비늘갑",
  "은빛 판금",
  "현자 예복",
  "바람 재킷",
  "흑철 중갑",
  "용비늘 갑주",
  "성기사 판금",
  "심연 코트",
  "별수호 로브",
  "황금 성갑",
  "서리 외투",
  "화염 수호복",
  "천공 갑옷",
  "영웅의 갑주",
  "마신 수호갑"
];

const WEAPON_SPRITES = [
  "dagger",
  "sword",
  "spear",
  "axe",
  "bow",
  "wand",
  "sword",
  "katana",
  "spear",
  "crossbow",
  "dagger",
  "wand",
  "katana",
  "scythe",
  "sword",
  "dagger",
  "spear",
  "hammer",
  "bow",
  "scythe"
];

const ARMOR_SPRITES = [
  "leather",
  "leather",
  "plate",
  "cloak",
  "robe",
  "scale",
  "plate",
  "robe",
  "cloak",
  "plate",
  "scale",
  "holy",
  "cloak",
  "robe",
  "holy",
  "cloak",
  "plate",
  "holy",
  "plate",
  "holy"
];

const WEAPON_ICON_BY_SPRITE = {
  dagger: "wpn_dagger",
  sword: "wpn_sword",
  spear: "wpn_spear",
  axe: "wpn_axe",
  bow: "wpn_bow",
  wand: "wpn_wand",
  scythe: "wpn_scythe",
  hammer: "wpn_hammer",
  katana: "wpn_katana",
  crossbow: "wpn_crossbow"
};

const ARMOR_ICON_BY_SPRITE = {
  leather: "arm_leather",
  plate: "arm_plate",
  robe: "arm_robe",
  cloak: "arm_cloak",
  scale: "arm_scale",
  holy: "arm_holy"
};

const ITEM_NAME_PREFIXES = ["고대", "은밀한", "폭풍의", "불멸의", "심연의", "성스러운", "강철", "뇌전", "달빛", "정복자"];
const ITEM_NAME_SUFFIXES = ["파편", "유산", "결의", "증표", "서약", "혼", "핵", "심장", "깃", "정수"];

function getWeaponShape(spriteKey, tier) {
  if (spriteKey === "dagger" || spriteKey === "wand") return { w: 1, h: 2 };
  if (spriteKey === "spear" || spriteKey === "scythe") return { w: 1, h: 3 };
  if (spriteKey === "bow" || spriteKey === "crossbow") return { w: 2, h: 3 };
  if (spriteKey === "hammer") return { w: 2, h: 3 };
  if (tier >= 45) return { w: 2, h: 3 };
  return { w: 2, h: 2 };
}

function getArmorShape(spriteKey, tier) {
  if (spriteKey === "robe" || spriteKey === "cloak") return { w: 2, h: 3 };
  if (spriteKey === "holy" || spriteKey === "plate") return { w: 2, h: 3 };
  if (tier >= 40) return { w: 2, h: 3 };
  return { w: 2, h: 2 };
}

function buildExtendedName(baseName, tier, idx) {
  if (tier <= 20) return baseName;
  const prefix = ITEM_NAME_PREFIXES[idx % ITEM_NAME_PREFIXES.length];
  const suffix = ITEM_NAME_SUFFIXES[Math.floor(idx / 3) % ITEM_NAME_SUFFIXES.length];
  return `${prefix} ${baseName} ${suffix}`;
}

function buildWeaponPool() {
  const pool = [];
  const total = 80;
  for (let i = 0; i < total; i += 1) {
    const tier = i + 1;
    const req = {
      str: Math.max(1, Math.floor(i * 0.9) + (i % 3 === 0 ? 2 : 0)),
      agi: Math.max(1, Math.floor(i * 0.8) + (i % 3 === 1 ? 2 : 0)),
      int: Math.max(0, Math.floor(i * 0.65) + (i % 3 === 2 ? 2 : 0)),
      luk: Math.max(0, Math.floor(i * 0.45) + (i % 4 === 3 ? 1 : 0))
    };
    const bonuses = {
      atk: 6 + tier * 2 + (i % 4),
      def: i % 6 === 0 ? 2 : 0,
      hp: i % 5 === 0 ? 20 + i * 2 : 0,
      mp: i % 3 === 2 ? 12 + i : 0,
      str: i % 4 === 0 ? 2 + Math.floor(i / 8) : i % 7 === 0 ? 1 : 0,
      agi: i % 4 === 1 ? 2 + Math.floor(i / 8) : i % 5 === 0 ? 1 : 0,
      int: i % 4 === 2 ? 2 + Math.floor(i / 8) : i % 6 === 0 ? 1 : 0,
      luk: i % 4 === 3 ? 2 + Math.floor(i / 8) : i % 3 === 0 ? 1 : 0,
      crit: Number((0.01 + (i % 5) * 0.007).toFixed(3)),
      dodge: Number((0.002 + (i % 4) * 0.003).toFixed(3)),
      haste: Number((0.01 + (i % 4) * 0.006).toFixed(3)),
      drop: Number((0.002 * (i % 6)).toFixed(3)),
      mpRegen: Number((0.002 + (i % 3) * 0.002).toFixed(3))
    };
    const spriteKey = WEAPON_SPRITES[i % WEAPON_SPRITES.length];
    const shape = getWeaponShape(spriteKey, tier);
    pool.push({
      id: `W${String(tier).padStart(2, "0")}`,
      type: "weapon",
      name: buildExtendedName(WEAPON_NAMES[i % WEAPON_NAMES.length], tier, i),
      tier,
      spriteKey,
      iconKey: WEAPON_ICON_BY_SPRITE[spriteKey] || "strike",
      gridW: shape.w,
      gridH: shape.h,
      palette: makeItemPalette("weapon", i),
      req,
      bonuses
    });
  }
  return pool;
}

function buildArmorPool() {
  const pool = [];
  const total = 80;
  for (let i = 0; i < total; i += 1) {
    const tier = i + 1;
    const req = {
      str: Math.max(1, Math.floor(i * 0.85) + (i % 2 === 0 ? 2 : 0)),
      agi: Math.max(1, Math.floor(i * 0.75) + (i % 3 === 1 ? 1 : 0)),
      int: Math.max(0, Math.floor(i * 0.7) + (i % 3 === 2 ? 1 : 0)),
      luk: Math.max(0, Math.floor(i * 0.5) + (i % 4 === 0 ? 1 : 0))
    };
    const bonuses = {
      atk: i % 7 === 0 ? 2 + Math.floor(i / 10) : 0,
      def: 5 + tier * 2 + (i % 3),
      hp: 25 + tier * 9 + (i % 4) * 6,
      mp: i % 4 === 2 ? 10 + tier * 2 : i % 4 === 3 ? 8 + tier : 0,
      str: i % 4 === 0 ? 2 + Math.floor(i / 9) : 0,
      agi: i % 4 === 1 ? 2 + Math.floor(i / 9) : 0,
      int: i % 4 === 2 ? 2 + Math.floor(i / 9) : 0,
      luk: i % 4 === 3 ? 2 + Math.floor(i / 9) : 0,
      crit: Number((0.003 + (i % 3) * 0.003).toFixed(3)),
      dodge: Number((0.01 + (i % 5) * 0.004).toFixed(3)),
      haste: Number((0.002 + (i % 4) * 0.002).toFixed(3)),
      drop: Number((0.004 + (i % 4) * 0.003).toFixed(3)),
      mpRegen: Number((0.004 + (i % 3) * 0.003).toFixed(3))
    };
    const spriteKey = ARMOR_SPRITES[i % ARMOR_SPRITES.length];
    const shape = getArmorShape(spriteKey, tier);
    pool.push({
      id: `A${String(tier).padStart(2, "0")}`,
      type: "armor",
      name: buildExtendedName(ARMOR_NAMES[i % ARMOR_NAMES.length], tier, i),
      tier,
      spriteKey,
      iconKey: ARMOR_ICON_BY_SPRITE[spriteKey] || "shield",
      gridW: shape.w,
      gridH: shape.h,
      palette: makeItemPalette("armor", i),
      req,
      bonuses
    });
  }
  return pool;
}

const WEAPON_POOL = buildWeaponPool();
const ARMOR_POOL = buildArmorPool();

const POTION_TYPES = {
  hp_small: { key: "hp_small", name: "체력 물약", heal: 0.34, mp: 0 },
  mp_small: { key: "mp_small", name: "마나 물약", heal: 0, mp: 0.36 },
  hybrid: { key: "hybrid", name: "혼합 물약", heal: 0.24, mp: 0.24 },
  elixir: { key: "elixir", name: "전능 물약", heal: 0.46, mp: 0.46, buff: true }
};

const HIDDEN_CHEST_COUNT = 30;
const HIDDEN_CHEST_SPECIAL_CHANCE = 0.08;

const SPECIAL_ITEM_POOL = [
  {
    id: "storm_core",
    name: "폭풍 코어",
    desc: "공격력 +18%, 공격속도 +8%",
    color: "#ffb18f",
    apply: (p) => {
      p.cardMods.attackPct += 0.18;
      p.cardMods.attackSpeedPct += 0.08;
    }
  },
  {
    id: "thunder_tail",
    name: "천둥 꼬리",
    desc: "멀티공격 +14%, 공격횟수 +1",
    color: "#ffd98a",
    apply: (p) => {
      p.cardMods.multiAttackChance += 0.14;
      p.cardMods.attackCountBonus += 1;
    }
  },
  {
    id: "forest_charm",
    name: "숲의 부적",
    desc: "최대 HP +20%, 회피 +6%",
    color: "#95d9a8",
    apply: (p) => {
      p.cardMods.maxHpPct += 0.2;
      p.cardMods.dodgeFlat += 0.06;
    }
  },
  {
    id: "sage_orb",
    name: "현자의 오브",
    desc: "최대 MP +22%, 스킬피해 +16%",
    color: "#8fc7ff",
    apply: (p) => {
      p.cardMods.maxMpPct += 0.22;
      p.cardMods.skillPowerPct += 0.16;
    }
  },
  {
    id: "predator_eye",
    name: "포식자의 눈",
    desc: "치명타 +12%, 드롭률 +18%",
    color: "#ff9aa2",
    apply: (p) => {
      p.cardMods.critFlat += 0.12;
      p.cardMods.dropRatePct += 0.18;
    }
  },
  {
    id: "wind_boots",
    name: "질풍 장화",
    desc: "이속 +22%, 공격범위 +16%",
    color: "#a3d4ff",
    apply: (p) => {
      p.cardMods.moveSpeedPct += 0.22;
      p.cardMods.attackRangePct += 0.16;
    }
  },
  {
    id: "blood_rune",
    name: "핏빛 룬",
    desc: "흡혈 +12%, 처치실드 +16",
    color: "#ff8f8f",
    apply: (p) => {
      p.cardMods.lifeStealPct += 0.12;
      p.cardMods.killShield += 16;
    }
  },
  {
    id: "arcane_clock",
    name: "비전 시계",
    desc: "쿨다운 -14%, MP소모 -10%",
    color: "#b3b6ff",
    apply: (p) => {
      p.cardMods.skillCooldownReduce += 0.14;
      p.cardMods.skillMpCostReduce += 0.1;
    }
  }
];

const SKILL_LIBRARY = [
  { id: "quick_claw", name: "전광 할퀴기", mpCost: 6, cooldown: 12, color: "#ffd06d", kind: "cone", power: 0.95, range: 50 },
  { id: "thunder_jab", name: "번개 찌르기", mpCost: 8, cooldown: 16, color: "#ffb44f", kind: "cone", power: 1.2, range: 58 },
  { id: "iron_tail", name: "강철 꼬리", mpCost: 12, cooldown: 22, color: "#f6c67b", kind: "cone", power: 1.45, range: 66 },
  { id: "volt_ball", name: "볼트 볼", mpCost: 11, cooldown: 18, color: "#ff9159", kind: "projectile", power: 1.35, targetRange: 170, splash: 26 },
  { id: "electro_web", name: "일렉트릭 웹", mpCost: 13, cooldown: 24, color: "#ffb97f", kind: "projectile", power: 1.1, targetRange: 180, splash: 42, slow: 120 },
  { id: "thunderbolt", name: "썬더볼트", mpCost: 15, cooldown: 28, color: "#f2d66b", kind: "beam", power: 1.55, targetRange: 210 },
  { id: "spark_ring", name: "스파크 링", mpCost: 18, cooldown: 40, color: "#8bd2ff", kind: "nova", power: 1.15, radius: 92, slow: 130 },
  { id: "thunder_storm", name: "썬더 스톰", mpCost: 24, cooldown: 58, color: "#ffd85f", kind: "nova", power: 1.65, radius: 120 },
  { id: "plasma_burst", name: "플라즈마 버스트", mpCost: 21, cooldown: 44, color: "#ff8f8f", kind: "target_aoe", power: 1.5, targetRange: 220, radius: 58 },
  { id: "comet_strike", name: "코멧 스트라이크", mpCost: 30, cooldown: 75, color: "#ff9f5a", kind: "target_aoe", power: 2.05, targetRange: 240, radius: 76 },
  { id: "thunder_chain", name: "체인 라이트닝", mpCost: 20, cooldown: 40, color: "#8ec2ff", kind: "chain", power: 1.15, targetRange: 210, chains: 4, chainRadius: 80 },
  { id: "giga_drain", name: "기가 드레인", mpCost: 18, cooldown: 36, color: "#b992ff", kind: "drain", power: 1.25, targetRange: 200 },
  { id: "healing_song", name: "힐링 송", mpCost: 20, cooldown: 60, color: "#7be6aa", kind: "heal", healPct: 0.26 },
  { id: "mana_stream", name: "마나 스트림", mpCost: 14, cooldown: 44, color: "#74baff", kind: "mana", mpPct: 0.35 },
  { id: "guard_wall", name: "가드 월", mpCost: 16, cooldown: 48, color: "#9ce2df", kind: "shield", shieldPct: 0.22 },
  { id: "quick_charge", name: "퀵 차지", mpCost: 12, cooldown: 46, color: "#ffd36f", kind: "speed_buff", duration: 420, speedPct: 0.26 },
  { id: "rage_mode", name: "레이지 모드", mpCost: 14, cooldown: 52, color: "#ff8a7a", kind: "attack_buff", duration: 420, atkPct: 0.26 },
  { id: "frost_field", name: "프로스트 필드", mpCost: 22, cooldown: 58, color: "#74ccff", kind: "nova", power: 1.05, radius: 140, slow: 190 },
  { id: "shadow_pulse", name: "섀도우 펄스", mpCost: 19, cooldown: 36, color: "#b57cff", kind: "projectile", power: 1.75, targetRange: 220, splash: 36 },
  { id: "final_overload", name: "파이널 오버로드", mpCost: 36, cooldown: 110, color: "#ffe06a", kind: "nova", power: 2.4, radius: 170 },
  { id: "arc_lance", name: "아크 랜스", mpCost: 17, cooldown: 30, color: "#8dd7ff", kind: "beam", power: 1.42, targetRange: 230 },
  { id: "static_trap", name: "스태틱 트랩", mpCost: 16, cooldown: 34, color: "#9dd7ff", kind: "target_aoe", power: 1.2, targetRange: 220, radius: 70, slow: 180 },
  { id: "phoenix_drive", name: "피닉스 드라이브", mpCost: 26, cooldown: 62, color: "#ff9f6a", kind: "projectile", power: 1.95, targetRange: 260, splash: 64 },
  { id: "chain_prison", name: "체인 프리즌", mpCost: 23, cooldown: 48, color: "#8fbcff", kind: "chain", power: 1.22, targetRange: 230, chains: 6, chainRadius: 95 },
  { id: "overcharge_field", name: "오버차지 필드", mpCost: 18, cooldown: 56, color: "#ffd06a", kind: "speed_buff", duration: 520, speedPct: 0.32 },
  { id: "guardian_pulse", name: "가디언 펄스", mpCost: 24, cooldown: 64, color: "#a9efe6", kind: "shield", shieldPct: 0.34 },
  { id: "life_bloom", name: "라이프 블룸", mpCost: 25, cooldown: 74, color: "#7fe3b7", kind: "heal", healPct: 0.38 },
  { id: "mana_fountain", name: "마나 파운틴", mpCost: 22, cooldown: 68, color: "#76bfff", kind: "mana", mpPct: 0.48 }
];

const CARD_FAMILIES = [
  { key: "move_speed", title: "질주", values: [6, 10, 14, 19, 25], desc: (v) => `이동 속도 +${v}%`, apply: (p, v) => { p.cardMods.moveSpeedPct += v / 100; } },
  { key: "range", title: "확장 베기", values: [8, 12, 16, 22, 28], desc: (v) => `근접/스킬 범위 +${v}%`, apply: (p, v) => { p.cardMods.attackRangePct += v / 100; } },
  { key: "atk_pct", title: "강공", values: [6, 10, 14, 19, 25], desc: (v) => `기본/스킬 공격력 +${v}%`, apply: (p, v) => { p.cardMods.attackPct += v / 100; } },
  { key: "atk_speed", title: "속격", values: [5, 8, 12, 16, 22], desc: (v) => `공격 속도 +${v}%`, apply: (p, v) => { p.cardMods.attackSpeedPct += v / 100; } },
  { key: "attack_count", title: "연타", values: [1, 1, 2, 2, 3], desc: (v) => `기본 공격 횟수 +${v}회`, apply: (p, v) => { p.cardMods.attackCountBonus += v; } },
  { key: "multi_attack", title: "멀티 번개", values: [6, 9, 12, 16, 20], desc: (v) => `멀티 공격 발동 확률 +${v}%`, apply: (p, v) => { p.cardMods.multiAttackChance += v / 100; } },
  { key: "max_hp", title: "강인함", values: [5, 8, 12, 16, 21], desc: (v) => `최대 HP +${v}%`, apply: (p, v) => { p.cardMods.maxHpPct += v / 100; } },
  { key: "max_mp", title: "마력샘", values: [6, 10, 14, 19, 24], desc: (v) => `최대 MP +${v}%`, apply: (p, v) => { p.cardMods.maxMpPct += v / 100; } },
  { key: "mp_regen", title: "명상", values: [8, 12, 17, 23, 30], desc: (v) => `MP 재생 +${v}%`, apply: (p, v) => { p.cardMods.mpRegenPct += v / 100; } },
  { key: "skill_power", title: "마도 증폭", values: [7, 11, 15, 20, 26], desc: (v) => `스킬 피해 +${v}%`, apply: (p, v) => { p.cardMods.skillPowerPct += v / 100; } },
  { key: "skill_cdr", title: "신속 주문", values: [4, 7, 10, 14, 18], desc: (v) => `스킬 쿨다운 -${v}%`, apply: (p, v) => { p.cardMods.skillCooldownReduce += v / 100; } },
  { key: "skill_eff", title: "마나 절약", values: [4, 7, 10, 14, 18], desc: (v) => `스킬 MP 소모 -${v}%`, apply: (p, v) => { p.cardMods.skillMpCostReduce += v / 100; } },
  { key: "crit_boost", title: "치명 예감", values: [3, 5, 7, 10, 14], desc: (v) => `치명타 확률 +${v}%`, apply: (p, v) => { p.cardMods.critFlat += v / 100; } },
  { key: "dodge_boost", title: "회피 본능", values: [3, 5, 7, 10, 14], desc: (v) => `회피 +${v}%`, apply: (p, v) => { p.cardMods.dodgeFlat += v / 100; } }
];

const CARD_VARIANTS = ["기초", "숙련", "각성", "초월", "전설"];
const CARD_TIERS = ["I", "II", "III", "IV", "V"];
const CARD_POOL_TARGET = CARD_FAMILIES.length * CARD_TIERS.length * CARD_VARIANTS.length;

function buildLevelUpCards() {
  const cards = [];
  for (const family of CARD_FAMILIES) {
    for (let tierIndex = 0; tierIndex < family.values.length; tierIndex += 1) {
      const tier = tierIndex + 1;
      for (let variant = 0; variant < CARD_VARIANTS.length; variant += 1) {
        const baseValue = family.values[tierIndex];
        let value = baseValue;
        if (family.key === "attack_count") {
          value = Math.max(1, baseValue + (variant >= 2 ? 1 : 0));
        } else if (family.key === "multi_attack") {
          value = baseValue + variant * 2;
        } else {
          value = baseValue + variant * (tier >= 4 ? 3 : 2);
        }

        cards.push({
          id: `${family.key}_${tier}_${variant}`,
          familyKey: family.key,
          title: `${family.title} ${CARD_TIERS[tierIndex]}-${CARD_VARIANTS[variant]}`,
          description: family.desc(value),
          tier,
          value,
          color: tier >= 5 ? "#ffd56a" : tier >= 4 ? "#76d8ff" : variant >= 2 ? "#9ad8ff" : "#dce8df",
          apply: family.apply
        });
      }
    }
  }
  return cards.slice(0, CARD_POOL_TARGET);
}

const LEVEL_UP_CARD_POOL = buildLevelUpCards();
const levelUpState = {
  active: false,
  pendingCount: 0,
  cards: [],
  selectedIndex: 0
};

const player = {
  x: WORLD_WIDTH * 0.5 - Math.round((PLAYER_BASE_W * PLAYER_PIXEL_SCALE) * 0.5),
  y: WORLD_HEIGHT * 0.5 - Math.round((PLAYER_BASE_H * PLAYER_PIXEL_SCALE) * 0.5),
  w: PLAYER_BASE_W * PLAYER_PIXEL_SCALE,
  h: PLAYER_BASE_H * PLAYER_PIXEL_SCALE,
  facingX: 1,
  facingY: 0,
  isMoving: false,
  walkPhase: 0,
  vx: 0,
  vy: 0,

  level: 1,
  exp: 0,
  nextExp: 36,

  statPoints: 0,
  stats: { str: 8, agi: 8, int: 8, luk: 8 },
  effectiveStats: { str: 8, agi: 8, int: 8, luk: 8 },

  attack: 10,
  defense: 5,
  maxHp: 130,
  hp: 130,
  maxMp: 90,
  mp: 90,
  mpRegen: 0.06,
  moveSpeed: 2.1,
  attackInterval: 20,
  critChance: 0.05,
  dodgeChance: 0.03,
  dropBonus: 1,
  potionPower: 1,
  craftBonusChance: 0.05,

  potions: {
    1: { type: "hp_small", count: 4 },
    2: { type: "mp_small", count: 4 },
    3: { type: "hybrid", count: 2 },
    4: { type: "elixir", count: 1 }
  },
  herbs: 0,
  gold: 0,

  buffTimer: 0,
  shield: 0,

  cardMods: {
    attackPct: 0,
    attackSpeedPct: 0,
    moveSpeedPct: 0,
    attackRangePct: 0,
    attackCountBonus: 0,
    multiAttackChance: 0,
    critFlat: 0,
    dodgeFlat: 0,
    maxHpPct: 0,
    maxMpPct: 0,
    mpRegenPct: 0,
    hpRegenFlat: 0,
    skillPowerPct: 0,
    skillMpCostReduce: 0,
    skillCooldownReduce: 0,
    potionPowerPct: 0,
    dropRatePct: 0,
    goldGainPct: 0,
    lifeStealPct: 0,
    killShield: 0,
    killBlastPct: 0
  },

  attackCooldown: 0,
  attackTimer: 0,
  hurtCooldown: 0,
  skillCooldowns: {},
  skillLoadout: {
    KeyQ: "quick_claw",
    KeyW: "volt_ball",
    KeyE: "spark_ring",
    KeyR: "thunderbolt"
  },
  selectedSkillSlot: "KeyQ",
  speedBuffTimer: 0,
  attackBuffTimer: 0,

  equipment: {
    weapon: null,
    armor: null
  },
  specialItems: [],
  inventory: [],
  inventorySize: INVENTORY_COLS * INVENTORY_ROWS,
  inventoryGrid: null,
  inventoryIndex: 0,
  warehouse: [],
  warehouseSize: STASH_COLS * STASH_ROWS,
  warehouseGrid: null,
  warehouseIndex: 0
};
player.inventoryGrid = createItemGrid(INVENTORY_COLS, INVENTORY_ROWS);
player.warehouseGrid = createItemGrid(STASH_COLS, STASH_ROWS);
syncInventoryLists();

const waveState = {
  wave: 0,
  spawned: 0,
  target: 0,
  aliveCap: 0,
  spawnTimer: 0,
  levelMin: 1,
  levelMax: 3
};

let frameCount = 0;
let score = 0;
let gameOver = false;
const FIXED_FRAME_MS = 1000 / 60;
const MAX_TEXT_LIST_SIZE = 18;
let useDeterministicAdvance = false;

function resizeCanvas() {
  const nextW = Math.max(640, Math.floor(window.innerWidth));
  const nextH = Math.max(360, Math.floor(window.innerHeight));
  if (canvas.width !== nextW) canvas.width = nextW;
  if (canvas.height !== nextH) canvas.height = nextH;
  ctx.imageSmoothingEnabled = false;
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function clampColor(v) {
  return clamp(Math.round(v), 0, 255);
}

function hexToRgb(hex) {
  const raw = hex.replace("#", "");
  if (raw.length !== 6) return { r: 255, g: 255, b: 255 };
  return {
    r: parseInt(raw.slice(0, 2), 16),
    g: parseInt(raw.slice(2, 4), 16),
    b: parseInt(raw.slice(4, 6), 16)
  };
}

function rgbToHex(r, g, b) {
  return `#${clampColor(r).toString(16).padStart(2, "0")}${clampColor(g).toString(16).padStart(2, "0")}${clampColor(b).toString(16).padStart(2, "0")}`;
}

function tintHex(hex, dr = 0, dg = 0, db = 0) {
  const c = hexToRgb(hex);
  return rgbToHex(c.r + dr, c.g + dg, c.b + db);
}

function buildDemonPalette(basePalette, appearanceTier) {
  const stage = appearanceTier % 5;
  const darken = Math.min(56, appearanceTier * 2);
  const warm = stage * 5;
  return [
    tintHex(basePalette[0], -darken + warm, -darken + Math.round(warm * 0.4), -darken - 4),
    tintHex(basePalette[1], -darken - 18, -darken - 22, -darken - 16),
    tintHex(basePalette[2], -Math.round(darken * 0.35) + warm, -Math.round(darken * 0.45), -Math.round(darken * 0.55))
  ];
}

function createItemGrid(cols, rows) {
  return {
    cols,
    rows,
    cells: Array.from({ length: rows }, () => Array(cols).fill(null)),
    items: []
  };
}

function ensureItemUid(item) {
  if (!item.uid) {
    item.uid = `${item.id}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
  }
  return item.uid;
}

function getItemFootprint(item) {
  const baseW = Math.max(1, item.gridW || 1);
  const baseH = Math.max(1, item.gridH || 1);
  if (item.rotated) return { w: baseH, h: baseW };
  return { w: baseW, h: baseH };
}

function clearGridCellsForItem(grid, item) {
  for (let y = 0; y < grid.rows; y += 1) {
    for (let x = 0; x < grid.cols; x += 1) {
      if (grid.cells[y][x] === item.uid) grid.cells[y][x] = null;
    }
  }
}

function getItemByUidFromGrid(grid, uid) {
  return grid.items.find((it) => it.uid === uid);
}

function canPlaceItemInGrid(grid, item, gx, gy) {
  const fp = getItemFootprint(item);
  if (gx < 0 || gy < 0 || gx + fp.w > grid.cols || gy + fp.h > grid.rows) return false;
  for (let y = 0; y < fp.h; y += 1) {
    for (let x = 0; x < fp.w; x += 1) {
      const cell = grid.cells[gy + y][gx + x];
      if (cell && cell !== item.uid) return false;
    }
  }
  return true;
}

function placeItemInGrid(grid, item, gx, gy) {
  ensureItemUid(item);
  if (!canPlaceItemInGrid(grid, item, gx, gy)) return false;
  clearGridCellsForItem(grid, item);
  const fp = getItemFootprint(item);
  item.gridX = gx;
  item.gridY = gy;
  for (let y = 0; y < fp.h; y += 1) {
    for (let x = 0; x < fp.w; x += 1) {
      grid.cells[gy + y][gx + x] = item.uid;
    }
  }
  if (!grid.items.some((it) => it.uid === item.uid)) grid.items.push(item);
  return true;
}

function removeItemFromGrid(grid, item) {
  if (!item) return;
  clearGridCellsForItem(grid, item);
  const idx = grid.items.findIndex((it) => it.uid === item.uid);
  if (idx !== -1) grid.items.splice(idx, 1);
}

function getItemAtGridCell(grid, gx, gy) {
  if (gx < 0 || gy < 0 || gx >= grid.cols || gy >= grid.rows) return null;
  const uid = grid.cells[gy][gx];
  if (!uid) return null;
  return getItemByUidFromGrid(grid, uid) || null;
}

function findFirstFitInGrid(grid, item) {
  for (let y = 0; y < grid.rows; y += 1) {
    for (let x = 0; x < grid.cols; x += 1) {
      if (canPlaceItemInGrid(grid, item, x, y)) return { x, y };
    }
  }
  return null;
}

function tryAutoPlaceItem(item, preferredGrid = null) {
  const targets = [];
  if (preferredGrid) targets.push(preferredGrid);
  if (!targets.includes(player.inventoryGrid)) targets.push(player.inventoryGrid);
  if (!targets.includes(player.warehouseGrid)) targets.push(player.warehouseGrid);
  for (const grid of targets) {
    const spot = findFirstFitInGrid(grid, item);
    if (spot) return placeItemInGrid(grid, item, spot.x, spot.y);
  }
  return false;
}

function syncInventoryLists() {
  player.inventory = player.inventoryGrid ? [...player.inventoryGrid.items] : [];
  player.warehouse = player.warehouseGrid ? [...player.warehouseGrid.items] : [];
  player.inventorySize = INVENTORY_COLS * INVENTORY_ROWS;
  player.warehouseSize = STASH_COLS * STASH_ROWS;
  player.inventoryIndex = clamp(player.inventoryIndex, 0, Math.max(0, player.inventory.length - 1));
  player.warehouseIndex = clamp(player.warehouseIndex, 0, Math.max(0, player.warehouse.length - 1));
}

function getGridUsedCells(grid) {
  if (!grid) return 0;
  let used = 0;
  for (let y = 0; y < grid.rows; y += 1) {
    for (let x = 0; x < grid.cols; x += 1) {
      if (grid.cells[y][x]) used += 1;
    }
  }
  return used;
}

function uiFont(size = 14, weight = 400) {
  const px = Math.max(UI_MIN_FONT_SIZE, Math.round(size));
  return `${weight} ${px}px "Press Start 2P", monospace`;
}

function uiLineHeight(size = 14) {
  return Math.round(Math.max(UI_MIN_FONT_SIZE, size) * UI_LINE_HEIGHT);
}

function drawUIText(text, x, y, options = {}) {
  const size = Math.max(UI_MIN_FONT_SIZE, options.size || 14);
  const weight = options.weight || 400;
  const color = options.color || UI_TEXT_COLOR;
  const align = options.align || "left";
  const maxWidth = options.maxWidth;

  ctx.save();
  ctx.font = uiFont(size, weight);
  ctx.textAlign = align;
  ctx.textBaseline = "top";
  if ("letterSpacing" in ctx) ctx.letterSpacing = `${UI_LETTER_SPACING}px`;
  ctx.lineWidth = 1;
  ctx.strokeStyle = UI_TEXT_OUTLINE;
  ctx.fillStyle = color;
  ctx.shadowColor = UI_TEXT_SHADOW;
  ctx.shadowBlur = 4;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  if (typeof maxWidth === "number") {
    ctx.strokeText(String(text), x, y, maxWidth);
    ctx.fillText(String(text), x, y, maxWidth);
  } else {
    ctx.strokeText(String(text), x, y);
    ctx.fillText(String(text), x, y);
  }
  ctx.restore();
  return uiLineHeight(size);
}

function intersects(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

function centerOf(entity) {
  return { x: entity.x + entity.w * 0.5, y: entity.y + entity.h * 0.5 };
}

function pushLog(text) {
  logs.unshift(`[${waveState.wave}W] ${text}`);
  if (logs.length > MAX_LOG) {
    logs.length = MAX_LOG;
  }
}

function getMonsterLevelRange(wave) {
  const preset = [
    { min: 1, max: 3 },
    { min: 3, max: 8 },
    { min: 8, max: 15 },
    { min: 15, max: 24 },
    { min: 24, max: 36 }
  ];

  if (wave <= preset.length) {
    return { min: preset[wave - 1].min, max: preset[wave - 1].max };
  }

  let min = preset[preset.length - 1].min;
  let max = preset[preset.length - 1].max;
  for (let w = 6; w <= wave; w += 1) {
    const span = Math.round(12 + (w - 5) * 2.6);
    min = max;
    max += span;
  }
  return { min, max };
}

function getDemonForm(level) {
  const appearanceTier = Math.max(0, Math.floor((level - 1) / 5));
  const base =
    DEMON_FORMS.find((form) => level >= form.min && level <= form.max) || DEMON_FORMS[DEMON_FORMS.length - 1];
  const variant = appearanceTier % 5;
  return {
    key: base.key,
    scale: base.scale + Math.floor(appearanceTier / 8),
    palette: buildDemonPalette(base.palette, appearanceTier),
    appearanceTier,
    variant
  };
}

function closeSideWindows() {
  uiState.inventory = false;
  uiState.character = false;
  uiState.skills = false;
  uiState.menuHub = false;
}

function toggleWindow(name) {
  const wasOpen = uiState[name];
  closeSideWindows();
  uiState.fullMap = false;
  uiState[name] = !wasOpen;
}

function spawnSlashEffect(power = 1, color = "#ffe3aa") {
  const p = centerOf(player);
  combatEffects.push({
    type: "slash",
    x: p.x + player.facingX * 10,
    y: p.y + player.facingY * 10,
    angle: Math.atan2(player.facingY, player.facingX),
    radius: 24 * power,
    maxLife: 12,
    life: 12,
    color
  });
}

function spawnBurstEffect(x, y, color = "#ffcf8c", radius = 30, life = 16) {
  combatEffects.push({
    type: "burst",
    x,
    y,
    color,
    radius,
    maxLife: life,
    life
  });
}

function spawnBeamEffect(x1, y1, x2, y2, color = "#b58dff", life = 10) {
  combatEffects.push({
    type: "beam",
    x1,
    y1,
    x2,
    y2,
    color,
    maxLife: life,
    life
  });
}

function spawnProjectileEffect(x1, y1, x2, y2, color = "#ff8e5a", size = 6, life = 20) {
  combatEffects.push({
    type: "projectile",
    x1,
    y1,
    x2,
    y2,
    color,
    size,
    t: 0,
    maxLife: life,
    life
  });
}

function buildLightningPoints(x1, y1, x2, y2, segments = 7, amplitude = 8) {
  const points = [{ x: x1, y: y1 }];
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  for (let i = 1; i < segments; i += 1) {
    const t = i / segments;
    const taper = 1 - Math.abs(0.5 - t) * 1.4;
    const jitter = (Math.random() * 2 - 1) * amplitude * taper;
    points.push({
      x: x1 + dx * t + nx * jitter,
      y: y1 + dy * t + ny * jitter
    });
  }
  points.push({ x: x2, y: y2 });
  return points;
}

function spawnLightningEffect(
  x1,
  y1,
  x2,
  y2,
  color = "#8fd8ff",
  life = 9,
  width = 2.2,
  segments = 7,
  amplitude = 8
) {
  combatEffects.push({
    type: "lightning",
    points: buildLightningPoints(x1, y1, x2, y2, segments, amplitude),
    color,
    width,
    maxLife: life,
    life
  });
}

function updateCombatEffects(dt) {
  for (let i = combatEffects.length - 1; i >= 0; i -= 1) {
    const fx = combatEffects[i];
    fx.life -= dt;
    if (fx.type === "projectile") {
      const step = dt / (fx.maxLife || 1);
      fx.t = clamp(fx.t + step, 0, 1);
      if (fx.t >= 1 && fx.life > 0) {
        fx.life = 0;
      }
    }
    if (fx.life <= 0) {
      combatEffects.splice(i, 1);
    }
  }
}

function drawCombatEffects() {
  for (const fx of combatEffects) {
    const alpha = clamp(fx.life / fx.maxLife, 0, 1);
    ctx.save();
    ctx.globalAlpha = alpha;

    if (fx.type === "slash") {
      ctx.strokeStyle = fx.color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(fx.x, fx.y, fx.radius * (1.1 - alpha * 0.2), fx.angle - 0.9, fx.angle + 0.9);
      ctx.stroke();
    } else if (fx.type === "burst") {
      const r = fx.radius * (1 - alpha * 0.25);
      ctx.strokeStyle = fx.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(fx.x, fx.y, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = alpha * 0.5;
      ctx.fillStyle = fx.color;
      ctx.beginPath();
      ctx.arc(fx.x, fx.y, r * 0.45, 0, Math.PI * 2);
      ctx.fill();
    } else if (fx.type === "beam") {
      ctx.strokeStyle = fx.color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(fx.x1, fx.y1);
      ctx.lineTo(fx.x2, fx.y2);
      ctx.stroke();
    } else if (fx.type === "projectile") {
      const px = fx.x1 + (fx.x2 - fx.x1) * fx.t;
      const py = fx.y1 + (fx.y2 - fx.y1) * fx.t;
      ctx.fillStyle = fx.color;
      ctx.beginPath();
      ctx.arc(px, py, fx.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = alpha * 0.35;
      ctx.beginPath();
      ctx.arc(px, py, fx.size * 1.8, 0, Math.PI * 2);
      ctx.fill();
    } else if (fx.type === "lightning") {
      ctx.strokeStyle = fx.color;
      ctx.lineWidth = fx.width;
      ctx.beginPath();
      ctx.moveTo(fx.points[0].x, fx.points[0].y);
      for (let i = 1; i < fx.points.length; i += 1) {
        ctx.lineTo(fx.points[i].x, fx.points[i].y);
      }
      ctx.stroke();
      ctx.globalAlpha = alpha * 0.45;
      ctx.strokeStyle = "#e9fbff";
      ctx.lineWidth = Math.max(1, fx.width - 1);
      ctx.stroke();
    }

    ctx.restore();
  }
}

function drawPixelSprite(pattern, palette, x, y, scale = 1) {
  for (let row = 0; row < pattern.length; row += 1) {
    const line = pattern[row];
    for (let col = 0; col < line.length; col += 1) {
      const ch = line[col];
      if (ch === ".") continue;
      const idx = Number(ch) - 1;
      const color = palette[idx] || palette[0];
      ctx.fillStyle = color;
      ctx.fillRect(Math.round(x + col * scale), Math.round(y + row * scale), scale, scale);
    }
  }
}

const SKILL_ICON_BY_KIND = {
  cone: "slash",
  projectile: "orb",
  beam: "beam",
  nova: "nova",
  target_aoe: "target",
  chain: "chain",
  drain: "drain",
  heal: "heal",
  mana: "mana",
  shield: "shield",
  speed_buff: "move",
  attack_buff: "strike"
};

const SKILL_ICON_BY_ID = {
  quick_claw: "claw",
  thunder_jab: "jab",
  iron_tail: "tail",
  volt_ball: "orb",
  electro_web: "web",
  thunderbolt: "thunder",
  spark_ring: "ring",
  thunder_storm: "storm",
  plasma_burst: "burst",
  comet_strike: "comet",
  thunder_chain: "chain",
  giga_drain: "drain",
  healing_song: "heal",
  mana_stream: "mana",
  guard_wall: "shield",
  quick_charge: "charge",
  rage_mode: "rage",
  frost_field: "frost",
  shadow_pulse: "shadow",
  final_overload: "overload",
  arc_lance: "jab",
  static_trap: "target",
  phoenix_drive: "comet",
  chain_prison: "chain",
  overcharge_field: "charge",
  guardian_pulse: "shield",
  life_bloom: "heal",
  mana_fountain: "mana"
};

const CARD_ICON_BY_FAMILY = {
  move_speed: "move",
  range: "range",
  atk_pct: "strike",
  atk_speed: "speed",
  attack_count: "count",
  multi_attack: "chain",
  max_hp: "shield",
  max_mp: "mana",
  mp_regen: "mana",
  skill_power: "overload",
  skill_cdr: "charge",
  skill_eff: "orb",
  crit_boost: "burst",
  dodge_boost: "move"
};

function drawGameIcon(icon, x, y, size = 20, color = "#f2f2f2") {
  const s = Math.max(1, Math.floor(size / 12));
  const px = Math.round(x);
  const py = Math.round(y);
  const rect = (rx, ry, rw, rh, fill = color) => {
    ctx.fillStyle = fill;
    ctx.fillRect(px + rx * s, py + ry * s, Math.max(1, rw * s), Math.max(1, rh * s));
  };

  ctx.fillStyle = "rgba(7,12,16,0.9)";
  ctx.fillRect(px - 2, py - 2, size + 4, size + 4);
  ctx.strokeStyle = "rgba(146, 192, 175, 0.78)";
  ctx.strokeRect(px - 2, py - 2, size + 4, size + 4);
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  ctx.fillRect(px - 1, py - 1, size + 2, Math.max(2, Math.floor(size * 0.22)));

  const accent = tintHex(color, 30, 30, 30);
  if (icon === "move") {
    rect(5, 1, 2, 10, accent);
    rect(1, 5, 10, 2, accent);
    rect(4, 0, 4, 2, color);
    rect(4, 10, 4, 2, color);
    rect(0, 4, 2, 4, color);
    rect(10, 4, 2, 4, color);
  } else if (icon === "range") {
    rect(2, 2, 8, 1, accent);
    rect(2, 9, 8, 1, accent);
    rect(2, 3, 1, 6, accent);
    rect(9, 3, 1, 6, accent);
    rect(5, 5, 2, 2, color);
  } else if (icon === "strike") {
    rect(6, 0, 1, 8, accent);
    rect(5, 8, 3, 2, accent);
    rect(5, 2, 3, 1, color);
    rect(6, 10, 1, 2, color);
  } else if (icon === "speed") {
    rect(1, 3, 5, 1, accent);
    rect(3, 5, 5, 1, accent);
    rect(5, 7, 5, 1, accent);
    rect(8, 2, 2, 2, color);
    rect(9, 6, 2, 2, color);
  } else if (icon === "count") {
    rect(1, 2, 2, 8, accent);
    rect(5, 2, 2, 8, accent);
    rect(9, 2, 2, 8, accent);
    rect(2, 3, 1, 6, color);
    rect(6, 3, 1, 6, color);
    rect(10, 3, 1, 6, color);
  } else if (icon === "chain") {
    rect(0, 5, 3, 2, accent);
    rect(3, 3, 3, 2, accent);
    rect(6, 5, 3, 2, accent);
    rect(4, 7, 3, 2, color);
    rect(7, 9, 3, 2, color);
  } else if (icon === "orb") {
    rect(3, 3, 6, 6, accent);
    rect(4, 4, 4, 4, color);
    rect(5, 2, 2, 1, "#ffffff");
  } else if (icon === "beam") {
    rect(0, 5, 12, 2, accent);
    rect(2, 4, 8, 1, color);
    rect(2, 7, 8, 1, color);
  } else if (icon === "nova") {
    rect(5, 5, 2, 2, color);
    rect(0, 5, 3, 2, accent);
    rect(9, 5, 3, 2, accent);
    rect(5, 0, 2, 3, accent);
    rect(5, 9, 2, 3, accent);
  } else if (icon === "target") {
    rect(2, 2, 8, 1, accent);
    rect(2, 9, 8, 1, accent);
    rect(2, 3, 1, 6, accent);
    rect(9, 3, 1, 6, accent);
    rect(5, 5, 2, 2, color);
  } else if (icon === "drain") {
    rect(2, 2, 3, 8, accent);
    rect(6, 2, 3, 8, color);
    rect(4, 9, 4, 2, accent);
  } else if (icon === "heal") {
    rect(5, 2, 2, 8, accent);
    rect(2, 5, 8, 2, accent);
    rect(4, 4, 4, 4, color);
  } else if (icon === "mana") {
    rect(5, 1, 2, 2, accent);
    rect(4, 3, 4, 5, accent);
    rect(5, 8, 2, 3, color);
  } else if (icon === "shield") {
    rect(3, 2, 6, 1, accent);
    rect(2, 3, 8, 1, accent);
    rect(3, 4, 6, 5, color);
    rect(5, 9, 2, 2, accent);
  } else if (icon === "claw") {
    rect(2, 2, 1, 8, accent);
    rect(5, 2, 1, 8, accent);
    rect(8, 2, 1, 8, accent);
    rect(1, 7, 9, 2, color);
  } else if (icon === "jab") {
    rect(6, 1, 1, 10, accent);
    rect(4, 3, 2, 2, color);
    rect(7, 3, 2, 2, color);
    rect(5, 10, 3, 1, color);
  } else if (icon === "tail") {
    rect(1, 8, 4, 2, accent);
    rect(4, 6, 3, 2, accent);
    rect(6, 4, 3, 2, accent);
    rect(8, 2, 3, 2, color);
  } else if (icon === "web") {
    rect(1, 1, 10, 1, accent);
    rect(1, 10, 10, 1, accent);
    rect(1, 1, 1, 10, accent);
    rect(10, 1, 1, 10, accent);
    rect(3, 3, 6, 1, color);
    rect(3, 8, 6, 1, color);
  } else if (icon === "thunder") {
    rect(6, 0, 2, 3, accent);
    rect(4, 3, 3, 3, accent);
    rect(6, 6, 2, 3, color);
    rect(5, 9, 2, 3, color);
  } else if (icon === "ring") {
    rect(2, 2, 8, 1, accent);
    rect(2, 9, 8, 1, accent);
    rect(2, 3, 1, 6, accent);
    rect(9, 3, 1, 6, accent);
    rect(5, 5, 2, 2, color);
  } else if (icon === "storm") {
    rect(1, 2, 10, 3, accent);
    rect(2, 5, 8, 2, color);
    rect(4, 7, 2, 3, accent);
    rect(7, 7, 2, 3, accent);
  } else if (icon === "burst") {
    rect(5, 5, 2, 2, color);
    rect(1, 5, 3, 2, accent);
    rect(8, 5, 3, 2, accent);
    rect(5, 1, 2, 3, accent);
    rect(5, 8, 2, 3, accent);
    rect(3, 3, 2, 2, accent);
    rect(7, 7, 2, 2, accent);
  } else if (icon === "comet") {
    rect(1, 8, 6, 2, accent);
    rect(4, 6, 4, 2, accent);
    rect(7, 4, 3, 2, color);
    rect(9, 2, 2, 2, color);
  } else if (icon === "charge") {
    rect(1, 6, 4, 2, accent);
    rect(5, 4, 4, 2, accent);
    rect(8, 2, 3, 2, color);
    rect(2, 8, 4, 2, color);
  } else if (icon === "rage") {
    rect(2, 1, 2, 4, accent);
    rect(8, 1, 2, 4, accent);
    rect(3, 5, 6, 5, color);
    rect(4, 9, 4, 2, accent);
  } else if (icon === "frost") {
    rect(5, 1, 2, 10, accent);
    rect(1, 5, 10, 2, accent);
    rect(3, 3, 2, 2, color);
    rect(7, 3, 2, 2, color);
    rect(3, 7, 2, 2, color);
    rect(7, 7, 2, 2, color);
  } else if (icon === "shadow") {
    rect(2, 2, 8, 8, accent);
    rect(4, 4, 4, 4, "#1f1634");
    rect(5, 5, 2, 2, color);
  } else if (icon === "overload") {
    rect(0, 5, 12, 2, accent);
    rect(2, 3, 8, 1, color);
    rect(2, 8, 8, 1, color);
    rect(5, 0, 2, 3, accent);
    rect(5, 9, 2, 3, accent);
  } else if (icon === "wpn_dagger") {
    rect(6, 1, 1, 8, accent);
    rect(5, 8, 3, 2, accent);
    rect(6, 10, 1, 1, color);
    rect(5, 0, 3, 2, color);
  } else if (icon === "wpn_sword") {
    rect(5, 0, 2, 8, accent);
    rect(4, 8, 4, 2, accent);
    rect(3, 9, 6, 1, color);
    rect(5, 10, 2, 2, color);
  } else if (icon === "wpn_spear") {
    rect(6, 0, 1, 10, accent);
    rect(5, 0, 3, 2, color);
    rect(4, 10, 5, 1, accent);
    rect(5, 11, 3, 1, color);
  } else if (icon === "wpn_axe") {
    rect(6, 2, 1, 8, accent);
    rect(2, 1, 4, 4, color);
    rect(3, 2, 4, 3, accent);
    rect(5, 10, 2, 2, color);
  } else if (icon === "wpn_bow") {
    rect(3, 1, 1, 10, accent);
    rect(8, 1, 1, 10, accent);
    rect(4, 2, 4, 1, color);
    rect(4, 9, 4, 1, color);
    rect(5, 5, 2, 2, accent);
  } else if (icon === "wpn_wand") {
    rect(5, 3, 2, 7, accent);
    rect(4, 1, 4, 3, color);
    rect(6, 10, 1, 2, color);
    rect(3, 0, 1, 1, "#ffffff");
  } else if (icon === "wpn_scythe") {
    rect(6, 1, 1, 10, accent);
    rect(2, 1, 5, 2, color);
    rect(1, 3, 4, 1, accent);
    rect(5, 10, 2, 2, color);
  } else if (icon === "wpn_hammer") {
    rect(4, 1, 4, 4, color);
    rect(5, 2, 2, 2, accent);
    rect(6, 5, 1, 6, accent);
    rect(5, 11, 3, 1, color);
  } else if (icon === "wpn_katana") {
    rect(4, 1, 1, 9, accent);
    rect(5, 2, 1, 8, accent);
    rect(6, 3, 1, 7, accent);
    rect(3, 10, 4, 1, color);
    rect(4, 0, 2, 2, color);
  } else if (icon === "wpn_crossbow") {
    rect(1, 4, 10, 1, color);
    rect(1, 7, 10, 1, color);
    rect(5, 2, 2, 8, accent);
    rect(7, 5, 4, 2, accent);
  } else if (icon === "arm_leather") {
    rect(3, 2, 6, 1, accent);
    rect(2, 3, 8, 6, "#8f6d49");
    rect(4, 4, 4, 4, color);
    rect(5, 9, 2, 2, accent);
  } else if (icon === "arm_plate") {
    rect(3, 2, 6, 2, accent);
    rect(2, 4, 8, 5, "#90a5b9");
    rect(4, 5, 4, 3, color);
    rect(5, 9, 2, 2, accent);
  } else if (icon === "arm_robe") {
    rect(3, 2, 6, 1, accent);
    rect(2, 3, 8, 5, "#6f79a8");
    rect(3, 8, 6, 3, color);
    rect(5, 4, 2, 2, "#ffffff");
  } else if (icon === "arm_cloak") {
    rect(2, 2, 8, 1, accent);
    rect(1, 3, 10, 6, "#556d66");
    rect(3, 4, 6, 4, color);
    rect(4, 9, 4, 2, accent);
  } else if (icon === "arm_scale") {
    rect(3, 2, 6, 1, accent);
    rect(2, 3, 8, 6, "#5f8f79");
    rect(3, 4, 2, 2, color);
    rect(6, 4, 2, 2, color);
    rect(4, 7, 4, 2, color);
  } else if (icon === "arm_holy") {
    rect(3, 2, 6, 1, accent);
    rect(2, 3, 8, 6, "#8f8bd0");
    rect(5, 4, 2, 4, "#ffedb0");
    rect(4, 5, 4, 2, "#ffedb0");
    rect(5, 9, 2, 2, accent);
  } else {
    rect(2, 2, 8, 8, accent);
    rect(4, 4, 4, 4, color);
  }
}

function cloneItem(item) {
  const cloned = {
    id: item.id,
    type: item.type,
    name: item.name,
    tier: item.tier,
    spriteKey: item.spriteKey,
    iconKey: item.iconKey || (item.type === "weapon" ? "strike" : "shield"),
    gridW: item.gridW || 1,
    gridH: item.gridH || 1,
    rotated: false,
    palette: [...item.palette],
    req: { ...item.req },
    bonuses: { ...item.bonuses }
  };
  ensureItemUid(cloned);
  return cloned;
}

function getEquipmentBonuses() {
  const total = {
    atk: 0,
    def: 0,
    hp: 0,
    mp: 0,
    str: 0,
    agi: 0,
    int: 0,
    luk: 0,
    crit: 0,
    dodge: 0,
    haste: 0,
    drop: 0,
    mpRegen: 0
  };
  const equipped = [player.equipment.weapon, player.equipment.armor];
  for (const item of equipped) {
    if (!item) continue;
    for (const key of Object.keys(total)) {
      total[key] += item.bonuses[key] || 0;
    }
  }
  return total;
}

function recalcPlayerDerivedStats(preserveHpMpRatio = true) {
  const hpRatio = player.maxHp > 0 ? player.hp / player.maxHp : 1;
  const mpRatio = player.maxMp > 0 ? player.mp / player.maxMp : 1;

  const eq = getEquipmentBonuses();
  const effective = {
    str: player.stats.str + eq.str,
    agi: player.stats.agi + eq.agi,
    int: player.stats.int + eq.int,
    luk: player.stats.luk + eq.luk
  };
  const m = player.cardMods;

  player.effectiveStats = effective;
  player.attack = Math.round(
    (6 + player.level * 1.5 + effective.str * 1.45 + effective.agi * 0.35 + effective.int * 0.4 + eq.atk) *
      (1 + m.attackPct)
  );
  player.defense = Math.round(2 + player.level * 0.8 + effective.agi * 0.5 + effective.str * 0.3 + eq.def);
  player.maxHp = Math.round((80 + player.level * 9 + effective.str * 6 + effective.int * 2 + eq.hp) * (1 + m.maxHpPct));
  player.maxMp = Math.round((42 + player.level * 6 + effective.int * 5 + effective.luk * 1.2 + eq.mp) * (1 + m.maxMpPct));
  player.moveSpeed = (1.8 + effective.agi * 0.055) * (1 + m.moveSpeedPct);
  player.attackInterval = clamp((24 - effective.agi * 0.42 - eq.haste * 100) * (1 - m.attackSpeedPct), 5, 24);
  player.critChance = clamp(0.03 + effective.luk * 0.012 + eq.crit + m.critFlat, 0, 0.75);
  player.dodgeChance = clamp(0.01 + effective.agi * 0.009 + eq.dodge + m.dodgeFlat, 0, 0.55);
  player.dropBonus = 1 + effective.luk * 0.018 + eq.drop + m.dropRatePct;
  player.mpRegen = (0.04 + effective.int * 0.0035 + eq.mpRegen) * (1 + m.mpRegenPct);
  player.potionPower = (1 + effective.int * 0.02) * (1 + m.potionPowerPct);
  player.craftBonusChance = clamp(0.02 + effective.int * 0.01 + effective.luk * 0.005, 0, 0.55);

  if (preserveHpMpRatio) {
    player.hp = clamp(Math.round(player.maxHp * hpRatio), 1, player.maxHp);
    player.mp = clamp(Math.round(player.maxMp * mpRatio), 0, player.maxMp);
  } else {
    player.hp = clamp(player.hp, 1, player.maxHp);
    player.mp = clamp(player.mp, 0, player.maxMp);
  }
}

function requirementText(req) {
  return `요구 S${req.str} A${req.agi} I${req.int} L${req.luk}`;
}

function meetsRequirement(item) {
  return (
    player.stats.str >= item.req.str &&
    player.stats.agi >= item.req.agi &&
    player.stats.int >= item.req.int &&
    player.stats.luk >= item.req.luk
  );
}

function bonusText(item) {
  const map = {
    atk: "ATK",
    def: "DEF",
    hp: "HP",
    mp: "MP",
    str: "STR",
    agi: "AGI",
    int: "INT",
    luk: "LUK",
    crit: "CRIT",
    dodge: "DODGE",
    haste: "HASTE",
    drop: "DROP",
    mpRegen: "MPREG"
  };
  const lines = [];
  for (const key of Object.keys(item.bonuses)) {
    const val = item.bonuses[key];
    if (!val) continue;
    if (key === "crit" || key === "dodge" || key === "haste" || key === "drop" || key === "mpRegen") {
      lines.push(`${map[key]} +${Math.round(val * 100)}%`);
    } else {
      lines.push(`${map[key]} +${val}`);
    }
  }
  return lines.join(" / ");
}

function addItemToInventory(item, options = {}) {
  const silent = Boolean(options.silent);
  const spot = findFirstFitInGrid(player.inventoryGrid, item);
  if (!spot) {
    if (!silent) pushLog("인벤토리가 가득 찼습니다.");
    return false;
  }
  placeItemInGrid(player.inventoryGrid, item, spot.x, spot.y);
  inventoryUiState.selectedUid = item.uid;
  syncInventoryLists();
  return true;
}

function normalizeSelectionIndices() {
  syncInventoryLists();
}

function getSelectedGridItemFromInventory() {
  if (inventoryUiState.selectedUid) {
    const selected = getItemByUidFromGrid(player.inventoryGrid, inventoryUiState.selectedUid);
    if (selected) return selected;
  }
  if (player.inventory.length > 0) return player.inventory[player.inventoryIndex];
  return null;
}

function equipSelectedInventoryItem() {
  const item = getSelectedGridItemFromInventory();
  if (!item) {
    pushLog("장착할 아이템이 없습니다.");
    return;
  }
  if (!meetsRequirement(item)) {
    pushLog(`${item.name} 착용 불가. ${requirementText(item.req)}`);
    return;
  }

  removeItemFromGrid(player.inventoryGrid, item);
  if (item.type === "weapon") {
    const previous = player.equipment.weapon;
    player.equipment.weapon = item;
    if (previous && !tryAutoPlaceItem(previous, player.inventoryGrid)) {
      player.equipment.weapon = previous;
      placeItemInGrid(player.inventoryGrid, item, item.gridX || 0, item.gridY || 0);
      pushLog("이전 무기를 보관할 칸이 없습니다.");
      return;
    }
  } else {
    const previous = player.equipment.armor;
    player.equipment.armor = item;
    if (previous && !tryAutoPlaceItem(previous, player.inventoryGrid)) {
      player.equipment.armor = previous;
      placeItemInGrid(player.inventoryGrid, item, item.gridX || 0, item.gridY || 0);
      pushLog("이전 방어구를 보관할 칸이 없습니다.");
      return;
    }
  }

  recalcPlayerDerivedStats(false);
  syncInventoryLists();
  pushLog(`장착 완료: ${item.name}`);
}

function moveSelectedInventoryToWarehouse() {
  const item = getSelectedGridItemFromInventory();
  if (!item) {
    pushLog("인벤토리가 비어 있습니다.");
    return;
  }
  const spot = findFirstFitInGrid(player.warehouseGrid, item);
  if (!spot) {
    pushLog("창고가 가득 찼습니다.");
    return;
  }

  removeItemFromGrid(player.inventoryGrid, item);
  placeItemInGrid(player.warehouseGrid, item, spot.x, spot.y);
  syncInventoryLists();
  pushLog(`창고 보관: ${item.name}`);
}

function withdrawSelectedWarehouseItem() {
  let item = null;
  if (inventoryUiState.selectedUid) item = getItemByUidFromGrid(player.warehouseGrid, inventoryUiState.selectedUid);
  if (!item && player.warehouse.length > 0) item = player.warehouse[player.warehouseIndex];
  if (!item) {
    pushLog("창고가 비어 있습니다.");
    return;
  }
  const spot = findFirstFitInGrid(player.inventoryGrid, item);
  if (!spot) {
    pushLog("인벤토리가 가득 찼습니다.");
    return;
  }

  removeItemFromGrid(player.warehouseGrid, item);
  placeItemInGrid(player.inventoryGrid, item, spot.x, spot.y);
  syncInventoryLists();
  pushLog(`창고 인출: ${item.name}`);
}

function getSkillById(id) {
  return SKILL_LIBRARY.find((s) => s.id === id);
}

function spendMp(cost) {
  const reducedCost = Math.max(1, Math.ceil(cost * (1 - clamp(player.cardMods.skillMpCostReduce, 0, 0.65))));
  if (player.mp < reducedCost) {
    pushLog("MP가 부족합니다.");
    return false;
  }
  player.mp -= reducedCost;
  return true;
}

function damageDemon(demon, amount) {
  demon.hp -= amount;
  demon.hurtCooldown = 8;
  if (player.cardMods.lifeStealPct > 0 && amount > 0) {
    player.hp = Math.min(player.maxHp, player.hp + amount * player.cardMods.lifeStealPct * 0.35);
  }
}

function killDemon(index) {
  const demon = demons[index];
  if (!demon) return;

  if (player.cardMods.killBlastPct > 0) {
    const blastRadius = 56;
    const blastDamage = Math.round(player.attack * (0.16 + player.cardMods.killBlastPct));
    const cx = demon.x + demon.w * 0.5;
    const cy = demon.y + demon.h * 0.5;
    spawnBurstEffect(cx, cy, "#ffb178", blastRadius, 14);
    for (let i = demons.length - 1; i >= 0; i -= 1) {
      if (i === index) continue;
      const other = demons[i];
      const oc = centerOf(other);
      if (Math.hypot(oc.x - cx, oc.y - cy) <= blastRadius) {
        damageDemon(other, blastDamage);
        if (other.hp <= 0) {
          dropLoot(other.x + other.w * 0.5, other.y + other.h * 0.5, other.exp);
          demons.splice(i, 1);
          score += 10;
        }
      }
    }
  }

  if (player.cardMods.killShield > 0) {
    player.shield = Math.min(player.maxHp * 0.9, player.shield + player.cardMods.killShield);
  }

  dropLoot(demon.x + demon.w * 0.5, demon.y + demon.h * 0.5, demon.exp);
  demons.splice(index, 1);
  score += 15;
  pushLog(`Lv.${demon.level} 악마 처치! 경험치 구슬 생성`);
}

function findNearestDemonTo(x, y, maxDist = Infinity, exclude = null) {
  let bestIndex = -1;
  let bestDist = Infinity;
  for (let i = 0; i < demons.length; i += 1) {
    const d = demons[i];
    if (exclude && d === exclude) continue;
    const dc = centerOf(d);
    const dist = Math.hypot(dc.x - x, dc.y - y);
    if (dist < bestDist && dist <= maxDist) {
      bestDist = dist;
      bestIndex = i;
    }
  }
  return { index: bestIndex, dist: bestDist };
}

function castSkill(skillId, targetX, targetY) {
  const skill = getSkillById(skillId);
  if (!skill) return;

  const cd = player.skillCooldowns[skill.id] || 0;
  if (cd > 0) {
    pushLog(`${skill.name} 쿨다운 중`);
    return;
  }
  if (!spendMp(skill.mpCost)) return;

  const pCenter = centerOf(player);
  const rangeMul = 1 + player.cardMods.attackRangePct * 0.75;
  const cardSkillBonus =
    1 +
    player.cardMods.attackPct * 0.45 +
    player.cardMods.multiAttackChance * 0.28 +
    Math.min(0.35, player.cardMods.attackCountBonus * 0.07);
  const atkMul = (player.buffTimer > 0 ? 1.2 : 1) * (player.attackBuffTimer > 0 ? 1.26 : 1);
  const skillMul = (1 + player.cardMods.skillPowerPct) * cardSkillBonus;
  const baseSkillDamage = player.attack * atkMul * skillMul + player.effectiveStats.int * 0.9;

  if (skill.kind === "cone") {
    spawnSlashEffect(1.1 + (skill.range || 50) / 120, skill.color);
    let hit = 0;
    const range = (skill.range || 50) * rangeMul;
    for (let i = demons.length - 1; i >= 0; i -= 1) {
      const d = demons[i];
      const dc = centerOf(d);
      const dx = dc.x - pCenter.x;
      const dy = dc.y - pCenter.y;
      const dist = Math.hypot(dx, dy);
      if (dist > range) continue;
      const dirX = dx / (dist || 1);
      const dirY = dy / (dist || 1);
      const dot = dirX * player.facingX + dirY * player.facingY;
      if (dot < -0.25) continue;
      const damage = Math.round(baseSkillDamage * (skill.power || 1));
      damageDemon(d, damage);
      spawnBurstEffect(dc.x, dc.y, skill.color, 18, 10);
      hit += 1;
      if (d.hp <= 0) killDemon(i);
    }
    if (hit === 0) pushLog(`${skill.name} 빗나감`);
  } else if (skill.kind === "projectile") {
    const nearest = findNearestDemonTo(targetX, targetY, (skill.targetRange || 180) * rangeMul);
    if (nearest.index === -1) {
      pushLog(`${skill.name} 목표가 없습니다.`);
    } else {
      const target = demons[nearest.index];
      const tc = centerOf(target);
      spawnProjectileEffect(pCenter.x, pCenter.y, tc.x, tc.y, skill.color, 5, 16);
      const mainDamage = Math.round(baseSkillDamage * (skill.power || 1));
      damageDemon(target, mainDamage);
      if (target.hp <= 0) killDemon(nearest.index);
      const splash = Math.round((skill.splash || 0) * rangeMul);
      if (splash > 0) {
        spawnBurstEffect(tc.x, tc.y, skill.color, splash, 14);
        for (let i = demons.length - 1; i >= 0; i -= 1) {
          const d = demons[i];
          if (d === target) continue;
          const dc = centerOf(d);
          if (Math.hypot(dc.x - tc.x, dc.y - tc.y) <= splash) {
            damageDemon(d, Math.round(mainDamage * 0.45));
            if (skill.slow) d.slowTimer = Math.max(d.slowTimer || 0, skill.slow);
            if (d.hp <= 0) killDemon(i);
          }
        }
      }
      if (skill.slow && target) target.slowTimer = Math.max(target.slowTimer || 0, skill.slow);
    }
  } else if (skill.kind === "beam") {
    const nearest = findNearestDemonTo(targetX, targetY, (skill.targetRange || 200) * rangeMul);
    if (nearest.index === -1) {
      pushLog(`${skill.name} 목표가 없습니다.`);
    } else {
      const target = demons[nearest.index];
      const tc = centerOf(target);
      spawnBeamEffect(pCenter.x, pCenter.y, tc.x, tc.y, skill.color, 14);
      damageDemon(target, Math.round(baseSkillDamage * (skill.power || 1)));
      if (target.hp <= 0) killDemon(nearest.index);
    }
  } else if (skill.kind === "nova") {
    const radius = Math.round((skill.radius || 90) * rangeMul);
    spawnBurstEffect(pCenter.x, pCenter.y, skill.color, radius, 18);
    let hit = 0;
    for (let i = demons.length - 1; i >= 0; i -= 1) {
      const d = demons[i];
      const dc = centerOf(d);
      if (Math.hypot(dc.x - pCenter.x, dc.y - pCenter.y) <= radius) {
        damageDemon(d, Math.round(baseSkillDamage * (skill.power || 1)));
        if (skill.slow) d.slowTimer = Math.max(d.slowTimer || 0, skill.slow);
        hit += 1;
        if (d.hp <= 0) killDemon(i);
      }
    }
    if (hit === 0) pushLog(`${skill.name} 범위 내 적 없음`);
  } else if (skill.kind === "target_aoe") {
    const nearest = findNearestDemonTo(targetX, targetY, (skill.targetRange || 210) * rangeMul);
    if (nearest.index === -1) {
      pushLog(`${skill.name} 목표가 없습니다.`);
    } else {
      const tc = centerOf(demons[nearest.index]);
      const radius = Math.round((skill.radius || 56) * rangeMul);
      spawnProjectileEffect(pCenter.x, pCenter.y, tc.x, tc.y, skill.color, 5, 18);
      spawnBurstEffect(tc.x, tc.y, skill.color, radius, 20);
      for (let i = demons.length - 1; i >= 0; i -= 1) {
        const d = demons[i];
        const dc = centerOf(d);
        if (Math.hypot(dc.x - tc.x, dc.y - tc.y) <= radius) {
          damageDemon(d, Math.round(baseSkillDamage * (skill.power || 1)));
          if (d.hp <= 0) killDemon(i);
        }
      }
    }
  } else if (skill.kind === "chain") {
    const nearest = findNearestDemonTo(targetX, targetY, (skill.targetRange || 210) * rangeMul);
    if (nearest.index === -1) {
      pushLog(`${skill.name} 목표가 없습니다.`);
    } else {
      const visited = new Set();
      let current = demons[nearest.index];
      let currentDamage = Math.round(baseSkillDamage * (skill.power || 1));
      const chains = skill.chains || 3;
      for (let c = 0; c < chains && current; c += 1) {
        if (visited.has(current)) break;
        visited.add(current);
        const cc = centerOf(current);
        const from = c === 0 ? pCenter : centerOf([...visited][visited.size - 2]);
        spawnBeamEffect(from.x, from.y, cc.x, cc.y, skill.color, 10);
        damageDemon(current, currentDamage);
        if (current.hp <= 0) {
          const idx = demons.indexOf(current);
          if (idx !== -1) killDemon(idx);
        }
        currentDamage = Math.round(currentDamage * 0.78);
        let next = null;
        let nextDist = Infinity;
        for (const d of demons) {
          if (visited.has(d)) continue;
          const dc = centerOf(d);
          const dist = Math.hypot(dc.x - cc.x, dc.y - cc.y);
          if (dist < nextDist && dist <= (skill.chainRadius || 70) * rangeMul) {
            next = d;
            nextDist = dist;
          }
        }
        current = next;
      }
    }
  } else if (skill.kind === "drain") {
    const nearest = findNearestDemonTo(targetX, targetY, (skill.targetRange || 200) * rangeMul);
    if (nearest.index === -1) {
      pushLog(`${skill.name} 목표가 없습니다.`);
    } else {
      const target = demons[nearest.index];
      const tc = centerOf(target);
      spawnBeamEffect(pCenter.x, pCenter.y, tc.x, tc.y, skill.color, 14);
      const damage = Math.round(baseSkillDamage * (skill.power || 1));
      damageDemon(target, damage);
      player.hp = Math.min(player.maxHp, player.hp + Math.round(damage * 0.18));
      player.mp = Math.min(player.maxMp, player.mp + Math.round(damage * 0.12));
      if (target.hp <= 0) killDemon(nearest.index);
    }
  } else if (skill.kind === "heal") {
    const supportMul = 1 + player.cardMods.skillPowerPct * 0.6 + player.cardMods.attackPct * 0.15;
    const heal = Math.round(player.maxHp * ((skill.healPct || 0.2) + player.effectiveStats.int * 0.0015) * supportMul);
    player.hp = Math.min(player.maxHp, player.hp + heal);
    spawnBurstEffect(pCenter.x, pCenter.y, skill.color, 58, 20);
    pushLog(`${skill.name} +${heal} HP`);
  } else if (skill.kind === "mana") {
    const supportMul = 1 + player.cardMods.skillPowerPct * 0.6 + player.cardMods.attackPct * 0.15;
    const regen = Math.round(player.maxMp * ((skill.mpPct || 0.3) + player.effectiveStats.int * 0.001) * supportMul);
    player.mp = Math.min(player.maxMp, player.mp + regen);
    spawnBurstEffect(pCenter.x, pCenter.y, skill.color, 54, 16);
    pushLog(`${skill.name} +${regen} MP`);
  } else if (skill.kind === "shield") {
    const supportMul = 1 + player.cardMods.skillPowerPct * 0.5 + player.cardMods.attackPct * 0.12;
    const gain = Math.round(player.maxHp * (skill.shieldPct || 0.2) * supportMul);
    player.shield = Math.min(player.maxHp, player.shield + gain);
    spawnBurstEffect(pCenter.x, pCenter.y, skill.color, 62, 18);
    pushLog(`${skill.name} 실드 +${gain}`);
  } else if (skill.kind === "speed_buff") {
    player.speedBuffTimer = Math.max(player.speedBuffTimer, skill.duration || 360);
    spawnBurstEffect(pCenter.x, pCenter.y, skill.color, 56, 14);
    pushLog(`${skill.name} 이동 가속`);
  } else if (skill.kind === "attack_buff") {
    player.attackBuffTimer = Math.max(player.attackBuffTimer, skill.duration || 360);
    spawnBurstEffect(pCenter.x, pCenter.y, skill.color, 56, 14);
    pushLog(`${skill.name} 공격 강화`);
  }

  const cooldownMul = 1 - clamp(player.cardMods.skillCooldownReduce + player.cardMods.attackSpeedPct * 0.2, 0, 0.75);
  player.skillCooldowns[skill.id] = Math.max(4, Math.round(skill.cooldown * cooldownMul));
}

function pointInRect(x, y, rect) {
  if (!rect) return false;
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}

function getGridCellFromPoint(x, y, area) {
  if (!area) return null;
  if (!pointInRect(x, y, area)) return null;
  const gx = Math.floor((x - area.x) / area.cell);
  const gy = Math.floor((y - area.y) / area.cell);
  if (gx < 0 || gy < 0 || gx >= area.cols || gy >= area.rows) return null;
  return { gx, gy };
}

function getItemAtInventoryPoint(screenX, screenY) {
  const areas = inventoryUiState.areas;
  if (!areas) return null;

  if (pointInRect(screenX, screenY, areas.equip.weapon) && player.equipment.weapon) {
    return { item: player.equipment.weapon, source: "equip_weapon" };
  }
  if (pointInRect(screenX, screenY, areas.equip.armor) && player.equipment.armor) {
    return { item: player.equipment.armor, source: "equip_armor" };
  }

  const invCell = getGridCellFromPoint(screenX, screenY, areas.inventory);
  if (invCell) {
    const item = getItemAtGridCell(player.inventoryGrid, invCell.gx, invCell.gy);
    if (item) return { item, source: "inventory" };
  }

  const stashCell = getGridCellFromPoint(screenX, screenY, areas.stash);
  if (stashCell) {
    const item = getItemAtGridCell(player.warehouseGrid, stashCell.gx, stashCell.gy);
    if (item) return { item, source: "stash" };
  }

  return null;
}

function returnDraggedItemToOrigin() {
  const drag = inventoryUiState.dragging;
  if (!drag) return;
  const { item, origin } = drag;
  let touchedEquip = false;
  if (origin.source === "inventory") {
    if (!placeItemInGrid(player.inventoryGrid, item, origin.gx, origin.gy)) {
      item.rotated = !item.rotated;
      if (!placeItemInGrid(player.inventoryGrid, item, origin.gx, origin.gy)) {
        tryAutoPlaceItem(item, player.inventoryGrid);
      }
    }
  } else if (origin.source === "stash") {
    if (!placeItemInGrid(player.warehouseGrid, item, origin.gx, origin.gy)) {
      item.rotated = !item.rotated;
      if (!placeItemInGrid(player.warehouseGrid, item, origin.gx, origin.gy)) {
        tryAutoPlaceItem(item, player.warehouseGrid);
      }
    }
  } else if (origin.source === "equip_weapon") {
    player.equipment.weapon = item;
    touchedEquip = true;
  } else if (origin.source === "equip_armor") {
    player.equipment.armor = item;
    touchedEquip = true;
  }
  if (touchedEquip) recalcPlayerDerivedStats(false);
  inventoryUiState.dragging = null;
  syncInventoryLists();
}

function tryDropDraggedItem(screenX, screenY) {
  const drag = inventoryUiState.dragging;
  if (!drag || !inventoryUiState.areas) return false;

  const { item, origin } = drag;
  const areas = inventoryUiState.areas;

  const dropToEquip = (slotKey, requiredType) => {
    if (!pointInRect(screenX, screenY, areas.equip[slotKey])) return false;
    if (item.type !== requiredType) return false;
    if (!meetsRequirement(item)) {
      pushLog(`${item.name} 착용 불가. ${requirementText(item.req)}`);
      return false;
    }

    const prev = player.equipment[slotKey];
    player.equipment[slotKey] = item;
    if (prev) {
      if (!tryAutoPlaceItem(prev, origin.source === "stash" ? player.warehouseGrid : player.inventoryGrid)) {
        player.equipment[slotKey] = prev;
        pushLog("장착 교체 실패: 빈 칸이 부족합니다.");
        return false;
      }
    }
    recalcPlayerDerivedStats(false);
    inventoryUiState.dragging = null;
    inventoryUiState.selectedUid = item.uid;
    syncInventoryLists();
    return true;
  };

  if (dropToEquip("weapon", "weapon")) return true;
  if (dropToEquip("armor", "armor")) return true;

  const invCell = getGridCellFromPoint(screenX, screenY, areas.inventory);
  if (invCell && placeItemInGrid(player.inventoryGrid, item, invCell.gx, invCell.gy)) {
    inventoryUiState.dragging = null;
    inventoryUiState.selectedUid = item.uid;
    syncInventoryLists();
    return true;
  }

  const stashCell = getGridCellFromPoint(screenX, screenY, areas.stash);
  if (stashCell && placeItemInGrid(player.warehouseGrid, item, stashCell.gx, stashCell.gy)) {
    inventoryUiState.dragging = null;
    inventoryUiState.selectedUid = item.uid;
    syncInventoryLists();
    return true;
  }

  return false;
}

function handleInventoryMouse(screenX, screenY) {
  if (!inventoryUiState.areas) return;

  if (inventoryUiState.dragging) {
    if (!tryDropDraggedItem(screenX, screenY)) {
      returnDraggedItemToOrigin();
    }
    return;
  }

  const picked = getItemAtInventoryPoint(screenX, screenY);
  if (!picked) {
    inventoryUiState.selectedUid = null;
    return;
  }

  const { item, source } = picked;
  inventoryUiState.selectedUid = item.uid;
  const origin = { source, gx: item.gridX ?? 0, gy: item.gridY ?? 0 };
  if (source === "inventory") removeItemFromGrid(player.inventoryGrid, item);
  if (source === "stash") removeItemFromGrid(player.warehouseGrid, item);
  if (source === "equip_weapon") {
    player.equipment.weapon = null;
    recalcPlayerDerivedStats(false);
  }
  if (source === "equip_armor") {
    player.equipment.armor = null;
    recalcPlayerDerivedStats(false);
  }

  inventoryUiState.dragging = {
    item,
    origin,
    offsetX: 12,
    offsetY: 12
  };
  syncInventoryLists();
}

function handleMouseAction(button, screenX, screenY) {
  if (gameOver) return;
  if (pauseState.open) {
    const clickedPause = pauseState.buttons.find(
      (b) => screenX >= b.x && screenX <= b.x + b.w && screenY >= b.y && screenY <= b.y + b.h
    );
    if (clickedPause && button === "left") {
      if (clickedPause.id === "resume") {
        pauseState.open = false;
      } else if (clickedPause.id === "settings") {
        pauseState.settings = !pauseState.settings;
      } else if (clickedPause.id === "restart") {
        pauseState.open = false;
        resetGame();
      } else if (clickedPause.id === "exit") {
        pushLog("게임 종료");
        try {
          window.close();
        } catch {
          /* no-op */
        }
        window.location.href = "about:blank";
      }
      return;
    }

    const clickedSetting = pauseState.settingButtons.find(
      (b) => screenX >= b.x && screenX <= b.x + b.w && screenY >= b.y && screenY <= b.y + b.h
    );
    if (clickedSetting && button === "left") {
      if (clickedSetting.id === "music_minus") pauseState.music = clamp(pauseState.music - 5, 0, 100);
      if (clickedSetting.id === "music_plus") pauseState.music = clamp(pauseState.music + 5, 0, 100);
      if (clickedSetting.id === "sfx_minus") pauseState.sfx = clamp(pauseState.sfx - 5, 0, 100);
      if (clickedSetting.id === "sfx_plus") pauseState.sfx = clamp(pauseState.sfx + 5, 0, 100);
      return;
    }
    return;
  }

  if (levelUpState.active && button === "left") {
    const card = levelCardButtons.find(
      (b) => screenX >= b.x && screenX <= b.x + b.w && screenY >= b.y && screenY <= b.y + b.h
    );
    if (card) {
      levelUpState.selectedIndex = card.index;
      selectLevelUpCard(card.index);
    }
    return;
  }

  if (uiState.menuHub && button === "left") {
    const clickedMenu = menuHubButtons.find(
      (b) => screenX >= b.x && screenX <= b.x + b.w && screenY >= b.y && screenY <= b.y + b.h
    );
    if (clickedMenu) {
      closeSideWindows();
      uiState.fullMap = false;
      uiState.menuHub = false;
      if (clickedMenu.id === "inventory") uiState.inventory = true;
      if (clickedMenu.id === "character") uiState.character = true;
      if (clickedMenu.id === "skills") uiState.skills = true;
      if (clickedMenu.id === "map") uiState.fullMap = true;
      if (clickedMenu.id === "close") {
        closeSideWindows();
        uiState.fullMap = false;
      }
    }
    return;
  }

  if (uiState.character && button === "left") {
    const clickedStat = charStatButtons.find(
      (b) => screenX >= b.x && screenX <= b.x + b.w && screenY >= b.y && screenY <= b.y + b.h
    );
    if (clickedStat) {
      if (player.statPoints <= 0) {
        pushLog("스탯 포인트가 부족합니다.");
        return;
      }
      player.stats[clickedStat.key] += 1;
      player.statPoints -= 1;
      recalcPlayerDerivedStats(false);
      pushLog(`${clickedStat.label} +1`);
      return;
    }
  }

  if (uiState.skills) {
    const clickedSlot = skillAssignButtons.find(
      (b) => screenX >= b.x && screenX <= b.x + b.w && screenY >= b.y && screenY <= b.y + b.h
    );
    if (clickedSlot) {
      player.selectedSkillSlot = clickedSlot.key;
      return;
    }

    const clickedSkill = skillButtons.find(
      (b) => screenX >= b.x && screenX <= b.x + b.w && screenY >= b.y && screenY <= b.y + b.h
    );
    if (clickedSkill) {
      player.skillLoadout[player.selectedSkillSlot] = clickedSkill.id;
      const label = player.selectedSkillSlot.replace("Key", "");
      pushLog(`${label} 슬롯 지정: ${clickedSkill.name}`);
      return;
    }
  }

  if (uiState.inventory && button === "left") {
    handleInventoryMouse(screenX, screenY);
    return;
  }

  if (uiState.inventory || uiState.character || uiState.skills || uiState.fullMap || uiState.menuHub) {
    return;
  }
}

function rollItemDrop() {
  const maxTier = Math.max(WEAPON_POOL.length, ARMOR_POOL.length);
  const cap = clamp(3 + waveState.wave * 2 + Math.floor(player.effectiveStats.luk * 0.4), 1, maxTier);
  const floor = Math.max(1, cap - 7);
  const tier = randomInt(floor, cap);
  const pool = Math.random() < 0.5 ? WEAPON_POOL : ARMOR_POOL;
  const idx = clamp(tier - 1, 0, pool.length - 1);
  return cloneItem(pool[idx]);
}

function createMapPatches() {
  mapPatches.length = 0;
  for (let i = 0; i < 64; i += 1) {
    mapPatches.push({
      x: randomInt(40, WORLD_WIDTH - 260),
      y: randomInt(40, WORLD_HEIGHT - 240),
      w: randomInt(130, 280),
      h: randomInt(100, 230),
      hue: randomInt(0, 4)
    });
  }
}

function createNatureLayers() {
  natureLayers.waters.length = 0;
  natureLayers.trees.length = 0;
  natureLayers.grasses.length = 0;
  natureLayers.flowers.length = 0;
  natureLayers.rocks.length = 0;

  for (let i = 0; i < 16; i += 1) {
    const w = randomInt(200, 420);
    const h = randomInt(120, 280);
    const x = randomInt(40, WORLD_WIDTH - w - 40);
    const y = randomInt(40, WORLD_HEIGHT - h - 40);
    natureLayers.waters.push({
      x,
      y,
      w,
      h,
      depth: randomInt(2, 5),
      phase: Math.random() * Math.PI * 2
    });
  }

  for (let i = 0; i < 250; i += 1) {
    const size = randomInt(2, 4);
    natureLayers.trees.push({
      x: randomInt(22, WORLD_WIDTH - 22),
      y: randomInt(22, WORLD_HEIGHT - 22),
      size,
      hue: randomInt(0, 2)
    });
  }

  for (let i = 0; i < 420; i += 1) {
    natureLayers.grasses.push({
      x: randomInt(10, WORLD_WIDTH - 10),
      y: randomInt(10, WORLD_HEIGHT - 10),
      h: randomInt(8, 18),
      hue: randomInt(0, 2)
    });
  }

  for (let i = 0; i < 160; i += 1) {
    natureLayers.flowers.push({
      x: randomInt(14, WORLD_WIDTH - 14),
      y: randomInt(14, WORLD_HEIGHT - 14),
      kind: randomInt(0, 2)
    });
  }

  for (let i = 0; i < 130; i += 1) {
    natureLayers.rocks.push({
      x: randomInt(16, WORLD_WIDTH - 16),
      y: randomInt(16, WORLD_HEIGHT - 16),
      w: randomInt(8, 16),
      h: randomInt(6, 12)
    });
  }
}

function createTreasureChests() {
  treasureChests.length = 0;
  for (let i = 0; i < HIDDEN_CHEST_COUNT; i += 1) {
    const w = 22;
    const h = 18;
    treasureChests.push({
      x: randomInt(70, WORLD_WIDTH - w - 70),
      y: randomInt(70, WORLD_HEIGHT - h - 70),
      w,
      h,
      opened: false,
      revealed: false,
      pulse: Math.random() * Math.PI * 2
    });
  }
}

function grantSpecialItem(template) {
  const item = {
    id: `${template.id}_${specialItemSerial}`,
    name: template.name,
    desc: template.desc,
    color: template.color
  };
  specialItemSerial += 1;
  player.specialItems.push(item);
  template.apply(player);
  recalcPlayerDerivedStats(false);
  pushLog(`스페셜 아이템: ${item.name} (${item.desc})`);
}

function openTreasureChest(chest) {
  if (!chest || chest.opened) return;
  chest.opened = true;
  chest.revealed = true;

  const goldGain = randomInt(28, 90) + Math.floor(waveState.wave * 2.2);
  const herbGain = randomInt(0, 3);
  player.gold += goldGain;
  player.herbs += herbGain;

  if (Math.random() < 0.42) {
    const item = rollItemDrop();
    if (addItemToInventory(item)) {
      pushLog(`보물상자 획득: ${item.name}`);
    }
  }

  if (Math.random() < HIDDEN_CHEST_SPECIAL_CHANCE) {
    const special = SPECIAL_ITEM_POOL[randomInt(0, SPECIAL_ITEM_POOL.length - 1)];
    grantSpecialItem(special);
  }

  if (Math.random() < 0.28) {
    const potionSlot = randomInt(1, 4);
    player.potions[potionSlot].count += 1;
    pushLog(`보물상자 획득: ${potionSlot}번 물약 +1`);
  }

  pushLog(`히든 보물상자 발견! GOLD +${goldGain} / HERB +${herbGain}`);
}

function updateTreasureChests(dt) {
  const pc = centerOf(player);
  for (const chest of treasureChests) {
    if (chest.opened) continue;
    chest.pulse += dt * 0.06;
    const cx = chest.x + chest.w * 0.5;
    const cy = chest.y + chest.h * 0.5;
    const dist = Math.hypot(cx - pc.x, cy - pc.y);
    if (dist <= 170) chest.revealed = true;
    if (dist <= 24) openTreasureChest(chest);
  }
}

function createHerbNodes() {
  herbNodes.length = 0;
  for (let i = 0; i < 90; i += 1) {
    herbNodes.push({
      x: randomInt(24, WORLD_WIDTH - 24),
      y: randomInt(24, WORLD_HEIGHT - 24),
      w: 12,
      h: 12,
      active: true,
      respawn: 0
    });
  }
}

function startWave() {
  waveState.wave += 1;
  const range = getMonsterLevelRange(waveState.wave);
  waveState.levelMin = range.min;
  waveState.levelMax = range.max;

  const avgLevel = Math.floor((range.min + range.max) * 0.5);
  waveState.spawned = 0;
  waveState.target = 12 + waveState.wave * 6 + Math.floor(avgLevel * 0.2);
  waveState.aliveCap = Math.min(38, 6 + waveState.wave * 2 + Math.floor(avgLevel * 0.08));
  waveState.spawnTimer = 8;
  pushLog(`웨이브 ${waveState.wave} 시작. Lv.${range.min}~${range.max} 악마 러시.`);
}

function spawnDemon(side) {
  const distance = randomInt(260, 430);
  const c = centerOf(player);
  let sx = c.x;
  let sy = c.y;

  if (side === 0) {
    sx -= distance;
    sy += randomInt(-180, 180);
  } else if (side === 1) {
    sx += distance;
    sy += randomInt(-180, 180);
  } else if (side === 2) {
    sx += randomInt(-220, 220);
    sy -= distance;
  } else {
    sx += randomInt(-220, 220);
    sy += distance;
  }

  const monsterLevel = randomInt(waveState.levelMin, waveState.levelMax);
  const form = getDemonForm(monsterLevel);
  const pattern = DEMON_PATTERNS[form.key];
  const spriteScale = Math.max(3, Math.round(form.scale * MONSTER_SCALE_MULTIPLIER));
  const spriteW = pattern[0].length * spriteScale;
  const spriteH = pattern.length * spriteScale;
  sx = clamp(sx, 14, WORLD_WIDTH - spriteW - 14);
  sy = clamp(sy, 14, WORLD_HEIGHT - spriteH - 14);
  const hp = 24 + monsterLevel * 6 + randomInt(monsterLevel, monsterLevel * 2);
  const atk = 3.8 + monsterLevel * 0.78 + Math.random() * 1.4;
  const speed = (0.66 + Math.min(monsterLevel * 0.02, 1.12)) * MONSTER_SPEED_MULTIPLIER;
  const rank =
    form.key === "archdemon" || form.key === "winged" || form.key === "behemoth" || form.key === "voidlord"
      ? "elite"
      : form.key === "berserker" || form.key === "horned" || form.key === "reaper"
        ? "veteran"
        : "normal";

  demons.push({
    x: sx,
    y: sy,
    w: spriteW,
    h: spriteH,
    vx: 0,
    vy: 0,
    hp,
    maxHp: hp,
    level: monsterLevel,
    rank,
    formKey: form.key,
    palette: [...form.palette],
    spriteScale,
    appearanceTier: form.appearanceTier,
    mutationVariant: form.variant,
    attack: atk,
    speed,
    exp: 6 + Math.round(monsterLevel * 2.2),
    hurtCooldown: 0,
    attackCooldown: randomInt(12, 22),
    slowTimer: 0
  });
}

function updateWave(dt) {
  waveState.spawnTimer -= dt;
  if (waveState.spawned < waveState.target && waveState.spawnTimer <= 0) {
    const packSize = randomInt(1, Math.min(4, 1 + Math.floor(waveState.wave / 3)));
    for (let i = 0; i < packSize; i += 1) {
      if (waveState.spawned >= waveState.target) break;
      if (demons.length >= waveState.aliveCap) break;
      spawnDemon(randomInt(0, 3));
      waveState.spawned += 1;
    }
    waveState.spawnTimer = Math.max(6, 28 - waveState.wave * 1.4);
  }

  if (waveState.spawned >= waveState.target && demons.length === 0) {
    startWave();
  }
}

function sampleLevelUpCards() {
  const result = [];
  const picked = new Set();
  while (result.length < 3 && picked.size < LEVEL_UP_CARD_POOL.length) {
    const idx = randomInt(0, LEVEL_UP_CARD_POOL.length - 1);
    if (picked.has(idx)) continue;
    picked.add(idx);
    result.push(LEVEL_UP_CARD_POOL[idx]);
  }
  return result;
}

function openNextLevelUpCards() {
  if (levelUpState.pendingCount <= 0) {
    levelUpState.active = false;
    levelUpState.cards = [];
    return;
  }
  closeSideWindows();
  uiState.fullMap = false;
  levelUpState.pendingCount -= 1;
  levelUpState.cards = sampleLevelUpCards();
  levelUpState.selectedIndex = 0;
  levelUpState.active = true;
}

function applyLevelUpCard(card) {
  card.apply(player, card.value);
  recalcPlayerDerivedStats(false);
  pushLog(`카드 획득: ${card.title} (${card.description})`);
}

function selectLevelUpCard(index) {
  if (!levelUpState.active) return;
  const card = levelUpState.cards[index];
  if (!card) return;
  applyLevelUpCard(card);
  if (levelUpState.pendingCount > 0) {
    openNextLevelUpCards();
  } else {
    levelUpState.active = false;
    levelUpState.cards = [];
  }
}

function gainExp(amount) {
  player.exp += amount;
  while (player.exp >= player.nextExp * LEVEL_UP_REQUIREMENT_MULTIPLIER) {
    player.exp -= player.nextExp * LEVEL_UP_REQUIREMENT_MULTIPLIER;
    player.level += 1;
    player.statPoints += 5;
    player.nextExp = Math.floor(player.nextExp * 1.34 + 16);
    recalcPlayerDerivedStats(false);
    player.hp = player.maxHp;
    player.mp = player.maxMp;
    pushLog(`레벨 업! Lv.${player.level} / 스탯 포인트 +5`);
    levelUpState.pendingCount += 1;
  }
  if (!levelUpState.active && levelUpState.pendingCount > 0) {
    openNextLevelUpCards();
  }
}

function dropLoot(x, y, expAmount = 0) {
  if (expAmount > 0) {
    const orbCount = Math.min(5, 1 + Math.floor(expAmount / 22));
    let remaining = expAmount;
    for (let i = 0; i < orbCount; i += 1) {
      const chunk =
        i === orbCount - 1
          ? remaining
          : Math.max(1, Math.floor(expAmount / orbCount + randomInt(-2, 2)));
      remaining -= chunk;
      drops.push({
        type: "exp",
        amount: Math.max(1, chunk),
        x: x + randomInt(-8, 8),
        y: y + randomInt(-8, 8),
        w: 8,
        h: 8,
        vx: (Math.random() - 0.5) * 1.35,
        vy: (Math.random() - 0.5) * 1.35,
        ttl: 2800,
        magnetized: false
      });
    }
  }

  drops.push({
    type: "gold",
    amount: randomInt(6, 14 + waveState.wave),
    x,
    y,
    w: 8,
    h: 8,
    vx: (Math.random() - 0.5) * 1.4,
    vy: (Math.random() - 0.5) * 1.4,
    ttl: 2300,
    magnetized: false
  });

  if (Math.random() < 0.76) {
    drops.push({
      type: "herb",
      amount: randomInt(1, 2),
      x: x + randomInt(-5, 5),
      y: y + randomInt(-5, 5),
      w: 8,
      h: 8,
      vx: (Math.random() - 0.5) * 1.1,
      vy: (Math.random() - 0.5) * 1.1,
      ttl: 2200,
      magnetized: false
    });
  }

  if (Math.random() < 0.36) {
    const potionTypes = ["hp_small", "mp_small", "hybrid", "elixir"];
    const typeRoll = Math.random();
    let potionType = potionTypes[0];
    if (typeRoll < 0.45) potionType = "hp_small";
    else if (typeRoll < 0.75) potionType = "mp_small";
    else if (typeRoll < 0.95) potionType = "hybrid";
    else potionType = "elixir";

    drops.push({
      type: "potion",
      potionType,
      amount: 1,
      x: x + randomInt(-6, 6),
      y: y + randomInt(-6, 6),
      w: 9,
      h: 10,
      vx: (Math.random() - 0.5) * 1.15,
      vy: (Math.random() - 0.5) * 1.15,
      ttl: 2400,
      magnetized: false
    });
  }

  const itemChance = clamp(0.2 + waveState.wave * 0.01 + (player.dropBonus - 1) * 0.18, 0.2, 0.58);
  if (Math.random() < itemChance) {
    drops.push({
      type: "item",
      item: rollItemDrop(),
      x: x + randomInt(-7, 7),
      y: y + randomInt(-7, 7),
      w: 10,
      h: 10,
      vx: (Math.random() - 0.5) * 1.2,
      vy: (Math.random() - 0.5) * 1.2,
      ttl: 3000,
      magnetized: false
    });
  }
}

function addPotionByType(potionType, amount = 1) {
  if (potionType === "hp_small") player.potions[1].count += amount;
  if (potionType === "mp_small") player.potions[2].count += amount;
  if (potionType === "hybrid") player.potions[3].count += amount;
  if (potionType === "elixir") player.potions[4].count += amount;
}

function pickupDrop(drop) {
  if (drop.type === "exp") {
    gainExp(drop.amount);
    return true;
  }
  if (drop.type === "gold") {
    const gain = Math.max(1, Math.round(drop.amount * (1 + player.cardMods.goldGainPct)));
    player.gold += gain;
    score += gain;
    return true;
  }
  if (drop.type === "herb") {
    player.herbs += drop.amount;
    return true;
  }
  if (drop.type === "potion") {
    addPotionByType(drop.potionType, drop.amount);
    pushLog(`${POTION_TYPES[drop.potionType].name} +${drop.amount}`);
    return true;
  }
  if (drop.type === "item") {
    if (addItemToInventory(drop.item, { silent: true })) {
      pushLog(`획득: ${drop.item.name}`);
      return true;
    }
    const stashSpot = findFirstFitInGrid(player.warehouseGrid, drop.item);
    if (stashSpot) {
      placeItemInGrid(player.warehouseGrid, drop.item, stashSpot.x, stashSpot.y);
      syncInventoryLists();
      pushLog(`창고 자동보관: ${drop.item.name}`);
      return true;
    }
    pushLog("가방/창고가 가득 찼습니다.");
    return false;
  }
  return false;
}

function usePotionSlot(slot) {
  const entry = player.potions[slot];
  if (!entry || entry.count <= 0) {
    pushLog(`${slot}번 슬롯 물약 없음`);
    return;
  }

  const potion = POTION_TYPES[entry.type];
  entry.count -= 1;

  if (potion.heal > 0) {
    const heal = Math.round(player.maxHp * potion.heal * player.potionPower);
    player.hp = Math.min(player.maxHp, player.hp + heal);
  }
  if (potion.mp > 0) {
    const regen = Math.round(player.maxMp * potion.mp * (1 + player.effectiveStats.int * 0.01));
    player.mp = Math.min(player.maxMp, player.mp + regen);
  }
  if (potion.buff) {
    player.buffTimer = 580;
  }
  pushLog(`${slot}번 사용: ${potion.name}`);
}

function updatePlayer(dt) {
  const inputX =
    (keyState.ArrowRight ? 1 : 0) -
    (keyState.ArrowLeft ? 1 : 0) +
    (keyState.KeyD ? 1 : 0) -
    (keyState.KeyA ? 1 : 0);
  const inputY =
    (keyState.ArrowDown ? 1 : 0) -
    (keyState.ArrowUp ? 1 : 0) +
    (keyState.KeyS ? 1 : 0);

  let mvx = inputX;
  let mvy = inputY;
  const menuOpen = uiState.inventory || uiState.character || uiState.skills || uiState.fullMap || uiState.menuHub || levelUpState.active;
  if (menuOpen) {
    mvx = 0;
    mvy = 0;
  }
  const len = Math.hypot(mvx, mvy);
  if (len > 0) {
    mvx /= len;
    mvy /= len;
    player.facingX = mvx;
    player.facingY = mvy;
  }
  player.isMoving = len > 0 && !menuOpen;
  if (player.isMoving) {
    player.walkPhase += dt * (0.42 + Math.min(0.28, player.moveSpeed * 0.08));
  }

  const speedMul = player.speedBuffTimer > 0 ? 1.26 : 1;
  const frameSpeed = player.moveSpeed * speedMul;
  player.vx = mvx * frameSpeed;
  player.vy = mvy * frameSpeed;
  player.x += player.vx * dt;
  player.y += player.vy * dt;
  player.x = clamp(player.x, 0, WORLD_WIDTH - player.w);
  player.y = clamp(player.y, 0, WORLD_HEIGHT - player.h);

  if (player.attackCooldown > 0) player.attackCooldown -= dt;
  if (player.attackTimer > 0) player.attackTimer -= dt;
  if (player.hurtCooldown > 0) player.hurtCooldown -= dt;
  if (player.buffTimer > 0) player.buffTimer -= dt;
  if (player.speedBuffTimer > 0) player.speedBuffTimer -= dt;
  if (player.attackBuffTimer > 0) player.attackBuffTimer -= dt;
  player.mp = Math.min(player.maxMp, player.mp + player.mpRegen * dt);

  for (const key of Object.keys(player.skillCooldowns)) {
    if (player.skillCooldowns[key] > 0) player.skillCooldowns[key] -= dt;
  }

  if (player.cardMods.hpRegenFlat > 0) {
    player.hp = Math.min(player.maxHp, player.hp + (player.cardMods.hpRegenFlat * dt) / 60);
  }

  if (justPressed.has("Tab")) {
    const next = !uiState.menuHub;
    closeSideWindows();
    uiState.fullMap = false;
    uiState.menuHub = next;
  }

  if (justPressed.has("KeyI")) toggleWindow("inventory");
  if (justPressed.has("KeyC")) toggleWindow("character");
  if (justPressed.has("KeyK")) toggleWindow("skills");
  if (justPressed.has("KeyM")) {
    closeSideWindows();
    uiState.fullMap = !uiState.fullMap;
  }

  if (justPressed.has("Digit1")) usePotionSlot(1);
  if (justPressed.has("Digit2")) usePotionSlot(2);
  if (justPressed.has("Digit3")) usePotionSlot(3);
  if (justPressed.has("Digit4")) usePotionSlot(4);

  const canCastSkill = !(uiState.inventory || uiState.character || uiState.skills || uiState.fullMap || uiState.menuHub || pauseState.open);
  const targetX = mouse.x + camera.x;
  const targetY = mouse.y + camera.y;
  if (canCastSkill && justPressed.has("KeyQ")) castSkill(player.skillLoadout.KeyQ, targetX, targetY);
  if (canCastSkill && justPressed.has("KeyW")) castSkill(player.skillLoadout.KeyW, targetX, targetY);
  if (canCastSkill && justPressed.has("KeyE")) castSkill(player.skillLoadout.KeyE, targetX, targetY);
  if (canCastSkill && justPressed.has("KeyR")) castSkill(player.skillLoadout.KeyR, targetX, targetY);

  if (justPressed.has("KeyB")) {
    if (player.herbs >= 3) {
      player.herbs -= 3;
      const bonus = Math.random() < player.craftBonusChance ? 1 : 0;
      player.potions[1].count += 1 + bonus;
      pushLog(`허브 제작: 체력 물약 ${1 + bonus}개`);
    } else {
      pushLog("허브가 부족합니다. (3개 필요)");
    }
  }

  if (uiState.character && justPressed.has("KeyY") && player.statPoints > 0) {
    player.stats.str += 1;
    player.statPoints -= 1;
    recalcPlayerDerivedStats(false);
    pushLog("STR +1");
  }
  if (uiState.character && justPressed.has("KeyU") && player.statPoints > 0) {
    player.stats.agi += 1;
    player.statPoints -= 1;
    recalcPlayerDerivedStats(false);
    pushLog("AGI +1");
  }
  if (uiState.character && justPressed.has("KeyO") && player.statPoints > 0) {
    player.stats.int += 1;
    player.statPoints -= 1;
    recalcPlayerDerivedStats(false);
    pushLog("INT +1");
  }
  if (uiState.character && justPressed.has("KeyP") && player.statPoints > 0) {
    player.stats.luk += 1;
    player.statPoints -= 1;
    recalcPlayerDerivedStats(false);
    pushLog("LUK +1");
  }

  if (uiState.inventory && justPressed.has("KeyR") && inventoryUiState.dragging) {
    const item = inventoryUiState.dragging.item;
    item.rotated = !item.rotated;
  }
  if (uiState.inventory && justPressed.has("KeyF")) equipSelectedInventoryItem();
  if (uiState.inventory && justPressed.has("KeyG")) moveSelectedInventoryToWarehouse();
  if (uiState.inventory && justPressed.has("KeyH")) withdrawSelectedWarehouseItem();

  if ((justPressed.has("Space") || justPressed.has("KeyZ")) && player.attackCooldown <= 0) {
    player.attackCooldown = player.attackInterval;
    player.attackTimer = 7;

    const pCenter = centerOf(player);
    const range = 42 * (1 + player.cardMods.attackRangePct);
    const atkMul = (player.buffTimer > 0 ? 1.2 : 1) * (player.attackBuffTimer > 0 ? 1.26 : 1);
    spawnSlashEffect(1 + player.cardMods.attackRangePct * 0.6, "#ffe3aa");
    spawnLightningEffect(
      pCenter.x,
      pCenter.y,
      pCenter.x + player.facingX * (range + 14),
      pCenter.y + player.facingY * (range + 14),
      "#95dbff",
      9,
      2.4,
      8,
      8
    );

    const doMeleeStrike = (damageMul = 1, lightningColor = "#95dbff") => {
      let localHit = 0;
      let lightningLinks = 0;
      for (let i = demons.length - 1; i >= 0; i -= 1) {
        const d = demons[i];
        const dc = centerOf(d);
        const dx = dc.x - pCenter.x;
        const dy = dc.y - pCenter.y;
        const dist = Math.hypot(dx, dy);
        if (dist > range) continue;
        const dirX = dx / (dist || 1);
        const dirY = dy / (dist || 1);
        const dot = dirX * player.facingX + dirY * player.facingY;
        if (dot < 0.15) continue;

        const crit = Math.random() < player.critChance ? 1.45 : 1;
        const damage = Math.round(player.attack * (0.85 + Math.random() * 0.35) * crit * atkMul * damageMul);
        damageDemon(d, damage);
        spawnBurstEffect(dc.x, dc.y, crit > 1 ? "#ffd06a" : "#ffb99e", 14, 8);
        if (lightningLinks < 4) {
          spawnLightningEffect(pCenter.x, pCenter.y, dc.x, dc.y, lightningColor, 8, 1.8, 6, 6);
          lightningLinks += 1;
        }
        localHit += 1;
        if (d.hp <= 0) killDemon(i);
      }
      return localHit;
    };

    let hitCount = doMeleeStrike(1, "#95dbff");
    const bonusAttackCount = Math.max(0, Math.floor(player.cardMods.attackCountBonus));
    for (let n = 0; n < bonusAttackCount; n += 1) {
      spawnSlashEffect(1.1 + player.cardMods.attackRangePct * 0.55, "#ffd79a");
      spawnLightningEffect(
        pCenter.x,
        pCenter.y,
        pCenter.x + player.facingX * (range + 20 + n * 4),
        pCenter.y + player.facingY * (range + 20 + n * 4),
        "#7fcfff",
        8,
        2.1,
        7,
        7
      );
      hitCount += doMeleeStrike(Math.max(0.52, 0.86 - n * 0.08), "#80cfff");
    }

    if (Math.random() < clamp(player.cardMods.multiAttackChance, 0, 0.9)) {
      spawnSlashEffect(1.22 + player.cardMods.attackRangePct * 0.6, "#a8f0ff");
      spawnLightningEffect(
        pCenter.x,
        pCenter.y,
        pCenter.x + player.facingX * (range + 28),
        pCenter.y + player.facingY * (range + 28),
        "#c8f6ff",
        10,
        2.8,
        9,
        10
      );
      hitCount += doMeleeStrike(0.76, "#b8edff");
      if (hitCount > 0) pushLog("멀티 번개 발동!");
    }

    for (const node of herbNodes) {
      if (!node.active) continue;
      const dx = node.x + node.w * 0.5 - pCenter.x;
      const dy = node.y + node.h * 0.5 - pCenter.y;
      if (Math.hypot(dx, dy) <= range - 4) {
        node.active = false;
        node.respawn = 560;
        const herbGain = randomInt(1, 2);
        player.herbs += herbGain;
        pushLog(`허브 채집 +${herbGain}`);
      }
    }

    if (hitCount === 0) {
      score = Math.max(0, score - 1);
    }
  }
}

function updateDemons(dt) {
  const pCenter = centerOf(player);
  for (let i = demons.length - 1; i >= 0; i -= 1) {
    const demon = demons[i];
    const dCenter = centerOf(demon);
    const dx = pCenter.x - dCenter.x;
    const dy = pCenter.y - dCenter.y;
    const dist = Math.hypot(dx, dy) || 1;
    const dirX = dx / dist;
    const dirY = dy / dist;
    const slowMul = demon.slowTimer > 0 ? 0.45 : 1;

    demon.vx += dirX * demon.speed * 0.34 * dt * slowMul;
    demon.vy += dirY * demon.speed * 0.34 * dt * slowMul;
    demon.vx = clamp(demon.vx * 0.9, -demon.speed * slowMul, demon.speed * slowMul);
    demon.vy = clamp(demon.vy * 0.9, -demon.speed * slowMul, demon.speed * slowMul);
    demon.x += demon.vx * dt;
    demon.y += demon.vy * dt;
    demon.x = clamp(demon.x, 0, WORLD_WIDTH - demon.w);
    demon.y = clamp(demon.y, 0, WORLD_HEIGHT - demon.h);

    if (demon.hurtCooldown > 0) demon.hurtCooldown -= dt;
    if (demon.attackCooldown > 0) demon.attackCooldown -= dt;
    if (demon.slowTimer > 0) demon.slowTimer -= dt;

    if (intersects(player, demon) && demon.attackCooldown <= 0 && player.hurtCooldown <= 0) {
      demon.attackCooldown = randomInt(16, 26);
      if (Math.random() < player.dodgeChance) {
        pushLog("회피 성공!");
      } else {
        const incoming = Math.round(demon.attack * (0.9 + Math.random() * 0.28));
        const damage = Math.max(1, incoming - Math.floor(player.defense * 0.45));
        let finalDamage = damage;
        if (player.shield > 0) {
          const absorbed = Math.min(player.shield, finalDamage);
          player.shield -= absorbed;
          finalDamage -= absorbed;
        }
        if (finalDamage > 0) {
          player.hp -= finalDamage;
        }
        player.hurtCooldown = 22;
        pushLog(`피격! HP -${finalDamage}${player.shield > 0 ? " (실드 유지)" : ""}`);
      }
    }
  }
}

function updateDrops(dt) {
  const pCenter = centerOf(player);
  for (let i = drops.length - 1; i >= 0; i -= 1) {
    const drop = drops[i];
    drop.x += drop.vx * dt;
    drop.y += drop.vy * dt;
    drop.vx *= 0.95;
    drop.vy *= 0.95;
    drop.ttl -= dt;

    const dx = pCenter.x - (drop.x + drop.w * 0.5);
    const dy = pCenter.y - (drop.y + drop.h * 0.5);
    const dist = Math.hypot(dx, dy) || 1;
    const magnetRange = drop.type === "exp" ? 280 : drop.type === "item" ? 220 : 170;
    const pickupRange = drop.type === "exp" ? 28 : drop.type === "item" ? 28 : 20;

    if (dist <= magnetRange) {
      const force = drop.type === "exp" ? 1.1 : drop.type === "item" ? 0.9 : 0.72;
      drop.vx += (dx / dist) * force * dt;
      drop.vy += (dy / dist) * force * dt;
      drop.magnetized = true;
    }

    if (dist <= pickupRange) {
      const picked = pickupDrop(drop);
      if (picked) {
        drops.splice(i, 1);
      }
      continue;
    }

    if (drop.ttl <= 0) {
      drops.splice(i, 1);
    }
  }
}

function updateHerbNodes(dt) {
  for (const node of herbNodes) {
    if (node.active) continue;
    node.respawn -= dt;
    if (node.respawn <= 0) node.active = true;
  }
}

function updateCamera() {
  const targetX = clamp(player.x + player.w * 0.5 - canvas.width * 0.5, 0, WORLD_WIDTH - canvas.width);
  const targetY = clamp(player.y + player.h * 0.5 - canvas.height * 0.5, 0, WORLD_HEIGHT - canvas.height);
  camera.x += (targetX - camera.x) * 0.14;
  camera.y += (targetY - camera.y) * 0.14;
}

function updateUI() {
  const hpRatio = clamp(player.hp / player.maxHp, 0, 1);
  const mpRatio = clamp(player.mp / player.maxMp, 0, 1);
  const expRequired = player.nextExp * LEVEL_UP_REQUIREMENT_MULTIPLIER;
  const expRatio = clamp(player.exp / expRequired, 0, 1);
  const weapon = player.equipment.weapon ? player.equipment.weapon.name : "없음";
  const armor = player.equipment.armor ? player.equipment.armor.name : "없음";

  statsEl.innerHTML = `
    <div>레벨: ${player.level} / 웨이브: ${waveState.wave}</div>
    <div>몬스터 레벨 구간: ${waveState.levelMin} ~ ${waveState.levelMax}</div>
    <div>HP: ${Math.max(0, Math.round(player.hp))} / ${player.maxHp}</div>
    <div>MP: ${Math.round(player.mp)} / ${player.maxMp}</div>
    <div>공격력: ${player.attack} / 방어력: ${player.defense}</div>
    <div>스탯: STR ${player.stats.str}, AGI ${player.stats.agi}, INT ${player.stats.int}, LUK ${player.stats.luk}</div>
    <div>보정: STR ${player.effectiveStats.str}, AGI ${player.effectiveStats.agi}, INT ${player.effectiveStats.int}, LUK ${player.effectiveStats.luk}</div>
    <div>EXP: ${player.exp} / ${expRequired}</div>
    <div>스페셜 아이템: ${player.specialItems.length}</div>
    <div>포인트: ${player.statPoints} (C 창에서 배분)</div>
    <div>실드: ${Math.round(player.shield)}</div>
    <div class="meter-wrap"><div class="meter hp" style="width:${hpRatio * 100}%"></div></div>
    <div class="meter-wrap"><div class="meter exp" style="width:${expRatio * 100}%"></div></div>
    <div class="meter-wrap"><div class="meter exp" style="width:${mpRatio * 100}%;background:linear-gradient(90deg,#4f84ff,#79ccff)"></div></div>
    <div>점수: ${score}</div>
  `;

  const invSelected = player.inventory[player.inventoryIndex];
  const whSelected = player.warehouse[player.warehouseIndex];

  const invWindowStart = Math.max(0, player.inventoryIndex - 3);
  const invWindow = player.inventory.slice(invWindowStart, invWindowStart + 7);
  const invHtml =
    invWindow.length > 0
      ? invWindow
          .map((item, i) => {
            const idx = invWindowStart + i;
            const mark = idx === player.inventoryIndex ? "▶" : " ";
            return `<div>${mark} ${idx + 1}. ${item.name}</div>`;
          })
          .join("")
      : "<div>인벤토리 비어 있음</div>";

  const whWindowStart = Math.max(0, player.warehouseIndex - 2);
  const whWindow = player.warehouse.slice(whWindowStart, whWindowStart + 5);
  const whHtml =
    whWindow.length > 0
      ? whWindow
          .map((item, i) => {
            const idx = whWindowStart + i;
            const mark = idx === player.warehouseIndex ? "▶" : " ";
            return `<div>${mark} ${idx + 1}. ${item.name}</div>`;
          })
          .join("")
      : "<div>창고 비어 있음</div>";

  inventoryEl.innerHTML = `
    <div>골드: ${player.gold} / 허브: ${player.herbs}</div>
    <div>물약(1~4): ${player.potions[1].count} / ${player.potions[2].count} / ${player.potions[3].count} / ${player.potions[4].count}</div>
    <div>장착 무기: ${weapon}</div>
    <div>장착 방어구: ${armor}</div>
    <div style="margin-top:8px;color:#9cb3a5;">인벤토리 ${player.inventory.length}/${player.inventorySize} (I 창, F장착, G창고)</div>
    ${invHtml}
    <div style="margin-top:8px;color:#9cb3a5;">창고 ${player.warehouse.length}/${player.warehouseSize} (H인출)</div>
    ${whHtml}
    <div style="margin-top:8px;color:#9cb3a5;">선택 인벤토리 상세</div>
    <div>${invSelected ? `${invSelected.name}` : "없음"}</div>
    <div>${invSelected ? requirementText(invSelected.req) : ""}</div>
    <div>${invSelected ? bonusText(invSelected) : ""}</div>
    <div style="margin-top:8px;color:#9cb3a5;">선택 창고 상세</div>
    <div>${whSelected ? `${whSelected.name}` : "없음"}</div>
  `;

  logEl.innerHTML = logs.map((line) => `<div>${line}</div>`).join("");
}

function drawMapBackground() {
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, "#081414");
  grad.addColorStop(0.55, "#0d2324");
  grad.addColorStop(1, "#113132");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const canopyShift = (camera.x * 0.16) % 90;
  ctx.fillStyle = "rgba(8,26,24,0.74)";
  for (let x = -120; x < canvas.width + 140; x += 44) {
    const canopyH = 36 + ((Math.floor((x + camera.x * 0.04) / 44) % 5 + 5) % 5) * 9;
    ctx.fillRect(x - canopyShift, 0, 30, canopyH);
  }

  ctx.fillStyle = "rgba(123,209,178,0.09)";
  const beamShift = (camera.x * 0.08) % 160;
  for (let i = 0; i < 9; i += 1) {
    const bx = i * 160 - beamShift;
    ctx.fillRect(bx, 0, 12, canvas.height);
  }
}

function drawWorldGround() {
  ctx.fillStyle = "#173936";
  ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

  for (const patch of mapPatches) {
    if (patch.hue === 0) ctx.fillStyle = "rgba(35, 86, 72, 0.56)";
    if (patch.hue === 1) ctx.fillStyle = "rgba(43, 98, 76, 0.5)";
    if (patch.hue === 2) ctx.fillStyle = "rgba(58, 96, 59, 0.44)";
    if (patch.hue === 3) ctx.fillStyle = "rgba(70, 90, 51, 0.42)";
    if (patch.hue === 4) ctx.fillStyle = "rgba(44, 66, 58, 0.5)";
    ctx.fillRect(patch.x, patch.y, patch.w, patch.h);
  }

  const waterAnim = frameCount * 0.06;
  for (const water of natureLayers.waters) {
    ctx.fillStyle = "#0d2f39";
    ctx.fillRect(water.x - 8, water.y - 6, water.w + 16, water.h + 12);

    ctx.fillStyle = "#16606e";
    for (let oy = 0; oy < water.h; oy += 14) {
      const t = oy / Math.max(1, water.h);
      const shift = Math.round(Math.sin((t * 9 + water.phase) + waterAnim * 0.4) * 8);
      const w = Math.max(24, water.w - Math.abs(shift) * 2);
      ctx.fillRect(water.x + shift, water.y + oy, w, 14);
    }

    ctx.fillStyle = "#2e9ca3";
    ctx.fillRect(water.x + 10, water.y + 10, water.w - 20, water.h - 20);
    ctx.fillStyle = "rgba(152, 234, 223, 0.26)";
    ctx.fillRect(water.x + 14, water.y + 14, water.w - 28, 8);

    ctx.fillStyle = "rgba(188, 255, 244, 0.3)";
    const rippleSpan = Math.max(28, water.h - 24);
    for (let r = 0; r < 5; r += 1) {
      const ry = water.y + 12 + ((r * 27 + Math.floor(waterAnim * 8) + Math.floor(water.phase * 12)) % rippleSpan);
      ctx.fillRect(water.x + 12, ry, water.w - 24, 2);
    }

    for (let n = 0; n < 6; n += 1) {
      const lx = water.x + 18 + ((n * 47 + Math.floor(water.phase * 101)) % Math.max(12, water.w - 34));
      const ly = water.y + 16 + ((n * 29 + Math.floor(water.phase * 71)) % Math.max(12, water.h - 30));
      ctx.fillStyle = "#5e8d55";
      ctx.fillRect(lx, ly, 10, 6);
      ctx.fillStyle = "#98bf74";
      ctx.fillRect(lx + 2, ly + 1, 4, 3);
    }
  }

  for (const rock of natureLayers.rocks) {
    ctx.fillStyle = "rgba(2,6,8,0.32)";
    ctx.fillRect(rock.x - 1, rock.y + rock.h - 1, rock.w + 2, 3);
    ctx.fillStyle = "#4c6763";
    ctx.fillRect(rock.x, rock.y, rock.w, rock.h);
    ctx.fillStyle = "#7b9a91";
    ctx.fillRect(rock.x + 1, rock.y + 1, Math.max(3, rock.w - 4), Math.max(2, rock.h - 4));
  }

  for (const tree of natureLayers.trees) {
    const s = tree.size;
    const trunkW = 3 * s;
    const trunkH = 6 * s;
    const crownW = 11 * s;
    const crownH = 8 * s;
    const tx = tree.x - Math.floor(trunkW * 0.5);
    const ty = tree.y - trunkH;
    const cx = tree.x - Math.floor(crownW * 0.5);
    const cy = ty - Math.floor(crownH * 0.75);

    ctx.fillStyle = "rgba(3,8,9,0.35)";
    ctx.fillRect(tree.x - trunkW, tree.y + 1, trunkW * 2, 4);
    ctx.fillStyle = "#4f3a2b";
    ctx.fillRect(tx, ty, trunkW, trunkH);
    ctx.fillStyle = "#71533d";
    ctx.fillRect(tx + 1, ty + 2, Math.max(1, trunkW - 2), Math.max(2, trunkH - 4));

    if (tree.hue === 0) ctx.fillStyle = "#2e6f52";
    if (tree.hue === 1) ctx.fillStyle = "#3b7d56";
    if (tree.hue === 2) ctx.fillStyle = "#4b7540";
    ctx.fillRect(cx, cy + 3, crownW, crownH);
    ctx.fillRect(cx + 3, cy - 2, crownW - 6, crownH);

    ctx.fillStyle = tree.hue === 2 ? "#7fa35d" : "#6fb08a";
    ctx.fillRect(cx + 2, cy + 1, Math.max(6, crownW - 7), 4);
    ctx.fillRect(cx + 5, cy + 7, Math.max(4, crownW - 12), 3);
  }

  for (const grass of natureLayers.grasses) {
    if (grass.hue === 0) ctx.fillStyle = "#2f7d58";
    if (grass.hue === 1) ctx.fillStyle = "#3f8e64";
    if (grass.hue === 2) ctx.fillStyle = "#5a9357";
    ctx.fillRect(grass.x, grass.y - grass.h, 2, grass.h);
    ctx.fillRect(grass.x + 3, grass.y - grass.h + 3, 2, grass.h - 2);
    ctx.fillRect(grass.x - 3, grass.y - grass.h + 4, 2, grass.h - 3);
    ctx.fillStyle = "rgba(190, 255, 212, 0.35)";
    ctx.fillRect(grass.x, grass.y - grass.h, 1, Math.max(3, Math.floor(grass.h * 0.4)));
  }

  for (const flower of natureLayers.flowers) {
    ctx.fillStyle = "#3f6f43";
    ctx.fillRect(flower.x, flower.y, 1, 4);
    if (flower.kind === 0) ctx.fillStyle = "#f4f0d9";
    if (flower.kind === 1) ctx.fillStyle = "#7ec3ff";
    if (flower.kind === 2) ctx.fillStyle = "#f9b0b8";
    ctx.fillRect(flower.x - 1, flower.y - 1, 3, 3);
  }

  ctx.fillStyle = "rgba(154, 233, 212, 0.08)";
  for (let y = 0; y < WORLD_HEIGHT; y += 34) ctx.fillRect(0, y, WORLD_WIDTH, 1);
  ctx.fillStyle = "rgba(0, 0, 0, 0.15)";
  for (let x = 0; x < WORLD_WIDTH; x += 52) ctx.fillRect(x, 0, 1, WORLD_HEIGHT);

  ctx.strokeStyle = "#78b79d";
  ctx.lineWidth = 3;
  ctx.strokeRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
}

function drawHerbNodes() {
  for (const node of herbNodes) {
    if (node.active) {
      ctx.fillStyle = "#32785b";
      ctx.fillRect(node.x + 1, node.y + 4, 10, 8);
      ctx.fillStyle = "#67bf96";
      ctx.fillRect(node.x + 3, node.y + 2, 6, 5);
      ctx.fillStyle = "#e8f9dc";
      ctx.fillRect(node.x + 2, node.y + 1, 1, 1);
      ctx.fillRect(node.x + 8, node.y + 1, 1, 1);
    } else {
      ctx.fillStyle = "#3f5f54";
      ctx.fillRect(node.x + 2, node.y + 7, 8, 4);
    }
  }
}

function drawTreasureChests() {
  for (const chest of treasureChests) {
    const bob = Math.sin(chest.pulse + frameCount * 0.05) * 1.2;
    const x = chest.x;
    const y = Math.round(chest.y + bob);

    if (!chest.revealed && !chest.opened) {
      ctx.fillStyle = "rgba(9,16,14,0.33)";
      ctx.fillRect(x + 2, y + 6, chest.w - 4, chest.h - 6);
      continue;
    }

    ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
    ctx.fillRect(x + 1, y + chest.h - 1, chest.w, 3);

    if (chest.opened) {
      ctx.fillStyle = "#5f4a31";
      ctx.fillRect(x, y + 7, chest.w, chest.h - 7);
      ctx.fillStyle = "#8e6b46";
      ctx.fillRect(x + 2, y + 9, chest.w - 4, chest.h - 10);
      ctx.fillStyle = "#c8aa66";
      ctx.fillRect(x + Math.floor(chest.w * 0.5) - 1, y + 11, 2, 2);
      continue;
    }

    ctx.fillStyle = "#6b4f35";
    ctx.fillRect(x, y + 6, chest.w, chest.h - 6);
    ctx.fillStyle = "#a17748";
    ctx.fillRect(x + 1, y + 7, chest.w - 2, chest.h - 8);
    ctx.fillStyle = "#ccb16a";
    ctx.fillRect(x + 1, y, chest.w - 2, 8);
    ctx.fillStyle = "#f8df8f";
    ctx.fillRect(x + Math.floor(chest.w * 0.5) - 1, y + 8, 2, 3);

    if (chest.revealed) {
      ctx.fillStyle = "rgba(255, 230, 154, 0.25)";
      ctx.fillRect(x - 2, y - 2, chest.w + 4, chest.h + 4);
    }
  }
}

function drawDrops() {
  for (const drop of drops) {
    if (drop.type === "exp") {
      ctx.fillStyle = drop.magnetized ? "#9affb9" : "#76e49e";
      ctx.beginPath();
      ctx.arc(drop.x + drop.w * 0.5, drop.y + drop.h * 0.5, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#dfffe8";
      ctx.fillRect(drop.x + 3, drop.y + 3, 2, 2);
      continue;
    }
    if (drop.type === "gold") {
      ctx.fillStyle = "#f8c34d";
      ctx.fillRect(drop.x, drop.y, drop.w, drop.h);
      continue;
    }
    if (drop.type === "herb") {
      ctx.fillStyle = "#6de685";
      ctx.fillRect(drop.x, drop.y, drop.w, drop.h);
      continue;
    }
    if (drop.type === "potion") {
      ctx.fillStyle = drop.potionType === "mp_small" ? "#86b2ff" : drop.potionType === "hybrid" ? "#b787ff" : "#ff9f9f";
      if (drop.potionType === "elixir") ctx.fillStyle = "#ffd56c";
      ctx.fillRect(drop.x, drop.y, drop.w, drop.h);
      ctx.fillStyle = "#e7f0ff";
      ctx.fillRect(drop.x + 2, drop.y + 1, 4, 2);
      continue;
    }
    if (drop.type === "item") {
      const pattern = SPRITE_PATTERNS[drop.item.spriteKey];
      drawPixelSprite(pattern, drop.item.palette, drop.x, drop.y, 1);
    }
  }
}

function drawDemons() {
  for (const demon of demons) {
    const pattern = DEMON_PATTERNS[demon.formKey] || DEMON_PATTERNS.imp;
    const scale = demon.spriteScale || 2;
    const shadowW = Math.max(6, demon.w - 4);
    ctx.fillStyle = "rgba(4, 10, 11, 0.35)";
    ctx.fillRect(demon.x + 2, demon.y + demon.h - 2, shadowW, 4);

    ctx.save();
    if (demon.hurtCooldown > 0 && Math.floor(frameCount / 3) % 2 === 0) {
      ctx.globalAlpha = 0.45;
    }
    drawPixelSprite(pattern, ["#0f1b1d"], demon.x + 1, demon.y + 1, scale);
    drawPixelSprite(pattern, demon.palette, demon.x, demon.y, scale);
    const mutation = demon.appearanceTier || 0;
    if (mutation >= 1) {
      ctx.fillStyle = demon.palette[2];
      ctx.fillRect(demon.x + Math.floor(demon.w * 0.22), demon.y + 1, Math.max(2, Math.floor(scale * 0.6)), Math.max(2, Math.floor(scale * 0.9)));
      ctx.fillRect(demon.x + Math.floor(demon.w * 0.72), demon.y + 1, Math.max(2, Math.floor(scale * 0.6)), Math.max(2, Math.floor(scale * 0.9)));
    }
    if (mutation >= 2) {
      ctx.fillStyle = "rgba(188, 240, 255, 0.55)";
      ctx.fillRect(demon.x - 2, demon.y + Math.floor(demon.h * 0.45), 2, Math.max(6, Math.floor(scale * 2)));
      ctx.fillRect(demon.x + demon.w, demon.y + Math.floor(demon.h * 0.4), 2, Math.max(6, Math.floor(scale * 2)));
    }
    if (mutation >= 3) {
      ctx.fillStyle = demon.mutationVariant % 2 === 0 ? "#7ec8ff" : "#ff9da4";
      ctx.fillRect(demon.x + Math.floor(demon.w * 0.5) - 1, demon.y - 3, 2, 3);
      ctx.fillRect(demon.x + Math.floor(demon.w * 0.5) - 6, demon.y + Math.floor(demon.h * 0.28), 2, 2);
      ctx.fillRect(demon.x + Math.floor(demon.w * 0.5) + 4, demon.y + Math.floor(demon.h * 0.28), 2, 2);
    }
    if (mutation >= 4) {
      ctx.fillStyle = "rgba(255, 215, 128, 0.6)";
      ctx.fillRect(demon.x - 1, demon.y + Math.floor(demon.h * 0.66), demon.w + 2, 2);
    }
    if (demon.rank === "elite") {
      const eyeX = demon.x + Math.max(2, Math.floor(demon.w * 0.46));
      const eyeY = demon.y + Math.max(3, Math.floor(demon.h * 0.3));
      ctx.fillStyle = "#ffd19c";
      ctx.fillRect(eyeX, eyeY, 2, 2);
    }
    ctx.restore();

    const hpRate = clamp(demon.hp / demon.maxHp, 0, 1);
    ctx.fillStyle = "#1a2322";
    ctx.fillRect(demon.x, demon.y - 5, demon.w, 3);
    ctx.fillStyle = demon.slowTimer > 0 ? "#8cc6ff" : demon.rank === "elite" ? "#cf6f86" : "#dd8a6f";
    ctx.fillRect(demon.x, demon.y - 5, demon.w * hpRate, 3);

    drawUIText(`L${demon.level}`, demon.x - 2, demon.y - 18, { size: 12, color: "#e5ddbd" });
  }
}

function drawPlayerHuman() {
  ctx.save();
  if (player.hurtCooldown > 0 && Math.floor(frameCount / 4) % 2 === 0) {
    ctx.globalAlpha = 0.35;
  }

  const walkWave = player.isMoving ? Math.sin(player.walkPhase * 3.2) : 0;
  const walkWave2 = player.isMoving ? Math.cos(player.walkPhase * 3.2) : 0;
  const step = Math.round(walkWave * 1.4);
  const bob = player.isMoving ? Math.round(Math.sin(player.walkPhase * 6.4) * 0.8) : 0;
  const attackPhase = player.attackTimer > 0 ? clamp(1 - player.attackTimer / 7, 0, 1) : 0;
  const attackSwing = player.attackTimer > 0 ? Math.sin(attackPhase * Math.PI) : 0;
  const x = player.x;
  const y = player.y + bob;
  const s = PLAYER_PIXEL_SCALE;
  const px = (dx, dy, dw, dh) => {
    ctx.fillRect(
      Math.round(x + dx * s),
      Math.round(y + dy * s),
      Math.max(1, Math.round(dw * s)),
      Math.max(1, Math.round(dh * s))
    );
  };

  const bodyMain = "#f7d85f";
  const bodyShade = "#cf9e33";
  const bodyLight = "#ffeaa2";
  const outline = "#2c2117";
  const cheek = "#e06a68";
  const lookRight = player.facingX >= 0;
  const earTilt = Math.round(walkWave * 0.8);
  const leftLegShift = step;
  const rightLegShift = -step;
  const armShift = Math.round(attackSwing * 2);
  const tailShift = Math.round(walkWave2 * 1.5 + attackSwing * 2);

  ctx.fillStyle = "rgba(4, 8, 9, 0.35)";
  px(2, PLAYER_BASE_H - 1, 14, 3);

  ctx.fillStyle = bodyShade;
  px(0, 2 + earTilt, 4, 5);
  px(14, 2 - earTilt, 4, 5);
  px(3, 6, 12, 14);
  px(4, 20 + leftLegShift, 4, 4);
  px(10, 20 + rightLegShift, 4, 4);

  ctx.fillStyle = bodyMain;
  px(1, 4 + earTilt, 3, 2);
  px(14, 4 - earTilt, 3, 2);
  px(4, 7, 10, 11);
  px(5, 20 + leftLegShift, 3, 3);
  px(10, 20 + rightLegShift, 3, 3);

  ctx.fillStyle = bodyLight;
  px(6, 8, 6, 5);
  px(7, 13, 4, 2);

  ctx.fillStyle = outline;
  px(1, 2 + earTilt, 3, 1);
  px(14, 2 - earTilt, 3, 1);
  px(2, 2 + earTilt, 2, 2);
  px(14, 2 - earTilt, 2, 2);

  ctx.fillStyle = "#101010";
  px(2, 2 + earTilt, 1, 1);
  px(14, 2 - earTilt, 1, 1);

  ctx.fillStyle = "#2f2118";
  if (Math.abs(player.facingX) > Math.abs(player.facingY)) {
    if (lookRight) {
      px(10, 10, 1, 1);
      px(10, 12, 1, 1);
      px(7, 11, 1, 1);
    } else {
      px(7, 10, 1, 1);
      px(7, 12, 1, 1);
      px(10, 11, 1, 1);
    }
  } else {
    px(7, 10, 1, 1);
    px(10, 10, 1, 1);
    px(8, 12, 2, 1);
  }

  ctx.fillStyle = "#ffffff";
  px(7, 9, 1, 1);
  px(10, 9, 1, 1);

  ctx.fillStyle = cheek;
  px(4, 12, 2, 2);
  px(12, 12, 2, 2);

  ctx.fillStyle = bodyShade;
  if (lookRight) {
    px(15 + tailShift, 14, 3, 2);
    px(17 + tailShift, 12, 2, 3);
    px(16 + tailShift, 17, 3, 2);
  } else {
    px(0 - tailShift, 14, 3, 2);
    px(-1 - tailShift, 12, 2, 3);
    px(-1 - tailShift, 17, 3, 2);
  }

  ctx.fillStyle = "#8e5532";
  px(6, 16 + leftLegShift, 2, 3);
  px(10, 16 + rightLegShift, 2, 3);

  ctx.fillStyle = "#b06b41";
  if (lookRight) {
    px(13 + armShift, 14, 2, 3);
  } else {
    px(3 - armShift, 14, 2, 3);
  }

  if (player.equipment.weapon) {
    const wx = Math.round(x + (player.facingX >= 0 ? 17 + armShift : -7 - armShift) * s);
    const wy = Math.round(y + (14 - Math.round(attackSwing * 2)) * s);
    drawPixelSprite(SPRITE_PATTERNS[player.equipment.weapon.spriteKey], player.equipment.weapon.palette, wx, wy, Math.max(1, s));
  }

  if (player.equipment.armor) {
    drawPixelSprite(
      SPRITE_PATTERNS[player.equipment.armor.spriteKey],
      player.equipment.armor.palette,
      Math.round(x + 5 * s),
      Math.round(y + (10 + Math.round(walkWave * 0.4)) * s),
      Math.max(1, s)
    );
  }
  ctx.restore();

  if (player.attackTimer > 0) {
    const cx = player.x + player.w * 0.5 + player.facingX * (14 * s + attackSwing * 8);
    const cy = player.y + player.h * 0.5 + player.facingY * (14 * s) - attackSwing * 3;
    ctx.fillStyle = "#bdefff";
    ctx.fillRect(cx - 8, cy - 8, 16, 16);
    ctx.fillStyle = "#f1feff";
    ctx.fillRect(cx - 3, cy - 3, 6, 6);
    ctx.strokeStyle = "rgba(190,241,255,0.8)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, 12 + attackSwing * 6, -0.8, 0.8);
    ctx.stroke();
  }
}

function drawMiniMap() {
  const miniW = 208;
  const miniH = 126;
  const miniX = canvas.width - miniW - 14;
  const miniY = 10;
  ctx.fillStyle = "rgba(0,0,0,0.7)";
  ctx.fillRect(miniX, miniY, miniW, miniH);
  ctx.strokeStyle = "#77b89c";
  ctx.lineWidth = 2;
  ctx.strokeRect(miniX, miniY, miniW, miniH);
  drawUIText("MINIMAP", miniX + 8, miniY + 6, { size: 14, color: "#cce6d8" });

  for (const water of natureLayers.waters) {
    ctx.fillStyle = "rgba(48, 157, 170, 0.6)";
    const x = miniX + (water.x / WORLD_WIDTH) * miniW;
    const y = miniY + (water.y / WORLD_HEIGHT) * miniH;
    const w = Math.max(4, (water.w / WORLD_WIDTH) * miniW);
    const h = Math.max(4, (water.h / WORLD_HEIGHT) * miniH);
    ctx.fillRect(x, y, w, h);
  }

  const dot = 4;
  const px = miniX + (player.x / WORLD_WIDTH) * miniW;
  const py = miniY + (player.y / WORLD_HEIGHT) * miniH;
  ctx.fillStyle = "#6abfff";
  ctx.fillRect(px - dot * 0.5, py - dot * 0.5, dot + 1, dot + 1);

  ctx.fillStyle = "#e07777";
  const limit = Math.min(demons.length, 80);
  for (let i = 0; i < limit; i += 1) {
    const d = demons[i];
    const dx = miniX + (d.x / WORLD_WIDTH) * miniW;
    const dy = miniY + (d.y / WORLD_HEIGHT) * miniH;
    ctx.fillRect(dx, dy, dot, dot);
  }
}

function drawBottomPanel() {
  const panelW = Math.min(1020, canvas.width - 24);
  const panelH = 148;
  const panelX = Math.round((canvas.width - panelW) * 0.5);
  const panelY = canvas.height - panelH - 10;

  ctx.fillStyle = "rgba(7, 10, 12, 0.76)";
  ctx.fillRect(panelX, panelY, panelW, panelH);
  ctx.strokeStyle = "#78b89d";
  ctx.lineWidth = 2;
  ctx.strokeRect(panelX, panelY, panelW, panelH);

  const hpRatio = clamp(player.hp / player.maxHp, 0, 1);
  const mpRatio = clamp(player.mp / player.maxMp, 0, 1);
  const expRequired = player.nextExp * LEVEL_UP_REQUIREMENT_MULTIPLIER;
  const expRatio = clamp(player.exp / expRequired, 0, 1);
  const barX = panelX + 90;
  const barW = 300;

  drawUIText("HP", panelX + 16, panelY + 12, { size: 16, color: "#ffd8d8" });
  drawUIText("MP", panelX + 16, panelY + 46, { size: 16, color: "#d4e4ff" });
  drawUIText("EXP", panelX + 16, panelY + 80, { size: 16, color: "#d6ffe6" });
  drawUIText(`LV ${player.level}`, panelX + 16, panelY + 112, { size: 16, color: "#c6f0dc" });
  drawUIText(`SHIELD ${Math.round(player.shield)}`, panelX + 190, panelY + 112, { size: 16, color: "#ffe1b0" });

  ctx.fillStyle = "#273137";
  ctx.fillRect(barX, panelY + 14, barW, 16);
  ctx.fillRect(barX, panelY + 48, barW, 16);
  ctx.fillRect(barX, panelY + 82, barW, 16);
  ctx.fillStyle = "#d76b67";
  ctx.fillRect(barX, panelY + 14, barW * hpRatio, 16);
  ctx.fillStyle = "#6f99eb";
  ctx.fillRect(barX, panelY + 48, barW * mpRatio, 16);
  ctx.fillStyle = "#78c89c";
  ctx.fillRect(barX, panelY + 82, barW * expRatio, 16);

  drawUIText(`${Math.round(player.hp)} / ${player.maxHp}`, barX + 10, panelY + 14, { size: 16 });
  drawUIText(`${Math.round(player.mp)} / ${player.maxMp}`, barX + 10, panelY + 48, { size: 16 });
  drawUIText(`${player.exp} / ${expRequired}`, barX + 10, panelY + 82, { size: 16 });

  const potionText = `POTION 1:${player.potions[1].count} 2:${player.potions[2].count} 3:${player.potions[3].count} 4:${player.potions[4].count}`;
  drawUIText(potionText, panelX + 410, panelY + 10, { size: 12, color: "#d5e5dd" });
  drawUIText("TAB 메뉴  I 인벤토리  C 캐릭터  K 스킬  M 맵", panelX + 410, panelY + 28, { size: 12, color: "#c7d8cf" });
  drawUIText("기본공격: SPACE  |  스킬: Q/W/E/R", panelX + 410, panelY + 46, { size: 12, color: "#cbe4ff" });

  const slotStartX = panelX + 410;
  const slotY = panelY + 66;
  const slotW = 145;
  const slotH = 62;
  const keys = ["KeyQ", "KeyW", "KeyE", "KeyR"];
  for (let i = 0; i < keys.length; i += 1) {
    const key = keys[i];
    const skill = getSkillById(player.skillLoadout[key]);
    const sx = slotStartX + i * (slotW + 10);
    const cd = Math.max(0, Math.ceil(player.skillCooldowns[skill?.id] || 0));
    ctx.fillStyle = "rgba(18, 26, 31, 0.94)";
    ctx.fillRect(sx, slotY, slotW, slotH);
    ctx.strokeStyle = skill ? skill.color : "#6d7f7a";
    ctx.strokeRect(sx, slotY, slotW, slotH);
    drawUIText(key.replace("Key", ""), sx + 8, slotY + 6, { size: 14, color: "#f2f2f2" });
    if (skill) {
      drawGameIcon(SKILL_ICON_BY_ID[skill.id] || SKILL_ICON_BY_KIND[skill.kind] || "orb", sx + slotW - 34, slotY + 8, 24, skill.color);
      drawUIText(skill.name.slice(0, 12), sx + 34, slotY + 6, { size: 14, color: "#f2f2f2" });
      drawUIText(`MP ${skill.mpCost}`, sx + 8, slotY + 34, { size: 12, color: "#d6e9ff" });
      drawUIText(`CD ${skill.cooldown}`, sx + 82, slotY + 34, { size: 12, color: "#d8f0e4" });
      if (cd > 0) drawUIText(`NOW ${cd}`, sx + 112, slotY + 4, { size: 12, color: "#ffb4a1" });
    }
  }
}

function drawWindowBase(title, w = 640, h = 360) {
  const x = Math.round((canvas.width - w) * 0.5);
  const y = Math.round((canvas.height - h) * 0.5);
  ctx.fillStyle = "rgba(5, 8, 10, 0.82)";
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = "#6fb58f";
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);
  drawUIText(title, x + 14, y + 10, { size: 18, color: "#f7c96a" });
  return { x, y, w, h };
}

function drawMenuHub() {
  if (!uiState.menuHub) {
    menuHubButtons = [];
    return;
  }

  const w = Math.min(360, canvas.width - 40);
  const h = 330;
  const x = Math.round((canvas.width - w) * 0.5);
  const y = Math.round((canvas.height - h) * 0.5);
  ctx.fillStyle = "rgba(6,10,14,0.9)";
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = "#81bfa2";
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);
  drawUIText("MENU HUB", x + 18, y + 14, { size: 18, color: "#f4ce7c" });
  drawUIText("TAB 또는 ESC로 닫기", x + 18, y + 42, { size: 14, color: "#d6e7df" });

  const entries = [
    { id: "inventory", label: "Inventory (I)", color: "#9fd7b7" },
    { id: "character", label: "Character (C)", color: "#b6d8f0" },
    { id: "skills", label: "Skills (K)", color: "#d0c5ff" },
    { id: "map", label: "Full Map (M)", color: "#9ec6ff" },
    { id: "close", label: "Close", color: "#f0b8a6" }
  ];

  menuHubButtons = [];
  for (let i = 0; i < entries.length; i += 1) {
    const b = entries[i];
    const bx = x + 18;
    const by = y + 72 + i * 50;
    const bw = w - 36;
    const bh = 38;
    menuHubButtons.push({ id: b.id, x: bx, y: by, w: bw, h: bh });
    ctx.fillStyle = "rgba(26,39,43,0.92)";
    ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = b.color;
    ctx.strokeRect(bx, by, bw, bh);
    drawUIText(b.label, bx + 14, by + 10, { size: 14, color: "#e6efe9" });
  }
}

function drawInventoryWindow() {
  const box = drawWindowBase("INVENTORY & STASH (DIABLO STYLE)", Math.min(980, canvas.width - 54), Math.min(620, canvas.height - 70));
  const cell = INVENTORY_CELL;
  const invX = box.x + 22;
  const invY = box.y + 76;
  const invW = INVENTORY_COLS * cell;
  const invH = INVENTORY_ROWS * cell;
  const stashX = invX + invW + 24;
  const stashY = invY;
  const stashW = STASH_COLS * cell;
  const stashH = STASH_ROWS * cell;
  const equipX = stashX + stashW + 24;
  const equipY = invY;
  const equipW = box.x + box.w - equipX - 20;
  const invCellsUsed = getGridUsedCells(player.inventoryGrid);
  const stashCellsUsed = getGridUsedCells(player.warehouseGrid);

  inventoryUiState.areas = {
    inventory: { x: invX, y: invY, w: invW, h: invH, cols: INVENTORY_COLS, rows: INVENTORY_ROWS, cell },
    stash: { x: stashX, y: stashY, w: stashW, h: stashH, cols: STASH_COLS, rows: STASH_ROWS, cell },
    equip: {
      weapon: { x: equipX + 16, y: equipY + 54, w: cell * 3, h: cell * 4 },
      armor: { x: equipX + 16, y: equipY + 206, w: cell * 3, h: cell * 4 }
    }
  };
  const hovered = getItemAtInventoryPoint(mouse.x, mouse.y);
  inventoryUiState.hoverUid = hovered ? hovered.item.uid : null;

  const drawGridPanel = (area, title, color) => {
    ctx.fillStyle = "rgba(20,30,33,0.84)";
    ctx.fillRect(area.x - 6, area.y - 30, area.w + 12, area.h + 36);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.strokeRect(area.x - 6, area.y - 30, area.w + 12, area.h + 36);
    drawUIText(title, area.x, area.y - 26, { size: 14, color });

    for (let gy = 0; gy < area.rows; gy += 1) {
      for (let gx = 0; gx < area.cols; gx += 1) {
        const cx = area.x + gx * area.cell;
        const cy = area.y + gy * area.cell;
        ctx.fillStyle = "rgba(8,12,14,0.86)";
        ctx.fillRect(cx, cy, area.cell - 1, area.cell - 1);
        ctx.strokeStyle = "rgba(96,124,116,0.55)";
        ctx.strokeRect(cx, cy, area.cell - 1, area.cell - 1);
      }
    }
  };

  drawGridPanel(
    inventoryUiState.areas.inventory,
    `INVENTORY ${invCellsUsed}/${player.inventorySize} CELLS (${player.inventory.length} ITEMS)`,
    "#9fd7b7"
  );
  drawGridPanel(
    inventoryUiState.areas.stash,
    `STASH ${stashCellsUsed}/${player.warehouseSize} CELLS (${player.warehouse.length} ITEMS)`,
    "#8fc5df"
  );

  const drawGridItems = (grid, area) => {
    for (const item of grid.items) {
      if (inventoryUiState.dragging && inventoryUiState.dragging.item.uid === item.uid) continue;
      const fp = getItemFootprint(item);
      const x = area.x + item.gridX * area.cell;
      const y = area.y + item.gridY * area.cell;
      const w = fp.w * area.cell;
      const h = fp.h * area.cell;
      const selected = inventoryUiState.selectedUid === item.uid;
      const hover = inventoryUiState.hoverUid === item.uid;

      ctx.globalAlpha = selected ? 1 : hover ? 0.82 : 0.62;
      ctx.fillStyle = item.type === "weapon" ? "rgba(112,77,45,0.9)" : "rgba(62,84,102,0.9)";
      ctx.fillRect(x + 1, y + 1, w - 2, h - 2);
      ctx.strokeStyle = selected ? "#ffe08e" : hover ? "#9fd8ff" : "rgba(133,161,150,0.55)";
      ctx.lineWidth = selected ? 3 : hover ? 2 : 1;
      ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
      if (selected) {
        ctx.strokeStyle = "#fff5cc";
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 4, y + 4, w - 8, h - 8);
      }
      ctx.globalAlpha = 1;

      const pattern = SPRITE_PATTERNS[item.spriteKey];
      const iconScale = Math.max(1, Math.floor(Math.min(w, h) / 12));
      const px = x + 5;
      const py = y + 5;
      drawPixelSprite(pattern, item.palette, px, py, iconScale);
      drawGameIcon(item.iconKey || (item.type === "weapon" ? "strike" : "shield"), x + w - 24, y + 4, 20, item.palette[0]);
    }
  };

  drawGridItems(player.inventoryGrid, inventoryUiState.areas.inventory);
  drawGridItems(player.warehouseGrid, inventoryUiState.areas.stash);

  ctx.fillStyle = "rgba(20,30,33,0.84)";
  ctx.fillRect(equipX, equipY - 30, equipW, 344);
  ctx.strokeStyle = "#d2b373";
  ctx.strokeRect(equipX, equipY - 30, equipW, 344);
  drawUIText("EQUIP", equipX + 10, equipY - 26, { size: 14, color: "#f0d18b" });

  const mannequinX = equipX + cell * 4;
  const mannequinY = equipY + 72;
  ctx.fillStyle = "rgba(8,12,15,0.55)";
  ctx.fillRect(mannequinX - 18, mannequinY - 32, 54, 180);
  ctx.strokeStyle = "rgba(182,162,112,0.6)";
  ctx.strokeRect(mannequinX - 18, mannequinY - 32, 54, 180);
  ctx.fillStyle = "#3b4b4f";
  ctx.fillRect(mannequinX, mannequinY - 18, 18, 26);
  ctx.fillRect(mannequinX - 6, mannequinY + 10, 30, 50);
  ctx.fillRect(mannequinX - 2, mannequinY + 60, 12, 50);
  ctx.fillRect(mannequinX + 12, mannequinY + 60, 12, 50);

  const drawEquipSlot = (rect, label, item, color) => {
    ctx.fillStyle = "rgba(10,14,17,0.88)";
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
    drawUIText(label, rect.x + 4, rect.y - 20, { size: 12, color });
    if (!item) return;
    const selected = inventoryUiState.selectedUid === item.uid;
    if (selected) {
      ctx.strokeStyle = "#ffe08e";
      ctx.lineWidth = 3;
      ctx.strokeRect(rect.x + 1, rect.y + 1, rect.w - 2, rect.h - 2);
    }
    const pattern = SPRITE_PATTERNS[item.spriteKey];
    const scale = Math.max(2, Math.floor(rect.w / 16));
    const ox = rect.x + 8;
    const oy = rect.y + 10;
    drawPixelSprite(pattern, item.palette, ox, oy, scale);
    drawGameIcon(item.iconKey || (item.type === "weapon" ? "strike" : "shield"), rect.x + rect.w - 24, rect.y + 4, 20, item.palette[0]);
  };

  drawEquipSlot(inventoryUiState.areas.equip.weapon, "WEAPON", player.equipment.weapon, "#e9ba7f");
  drawEquipSlot(inventoryUiState.areas.equip.armor, "ARMOR", player.equipment.armor, "#9fc8e5");

  const selectedItem =
    (inventoryUiState.selectedUid && (getItemByUidFromGrid(player.inventoryGrid, inventoryUiState.selectedUid) || getItemByUidFromGrid(player.warehouseGrid, inventoryUiState.selectedUid))) ||
    (player.equipment.weapon && player.equipment.weapon.uid === inventoryUiState.selectedUid ? player.equipment.weapon : null) ||
    (player.equipment.armor && player.equipment.armor.uid === inventoryUiState.selectedUid ? player.equipment.armor : null) ||
    (inventoryUiState.dragging ? inventoryUiState.dragging.item : null);

  drawUIText("드래그로 배치/장착, R 회전, TAB 메뉴 허브", box.x + 20, box.y + box.h - 58, { size: 12, color: "#c3d7cd" });
  if (selectedItem) {
    drawUIText(selectedItem.name, box.x + 20, box.y + box.h - 36, { size: 14, color: "#f2e0bc" });
    drawUIText(`${requirementText(selectedItem.req)}  |  ${bonusText(selectedItem)}`, box.x + 260, box.y + box.h - 36, { size: 12, color: "#d1e5db" });
  }

  if (inventoryUiState.dragging) {
    const drag = inventoryUiState.dragging;
    const item = drag.item;
    const fp = getItemFootprint(item);
    const w = fp.w * cell;
    const h = fp.h * cell;
    const x = mouse.x - drag.offsetX;
    const y = mouse.y - drag.offsetY;
    ctx.globalAlpha = 0.92;
    ctx.fillStyle = item.type === "weapon" ? "rgba(112,77,45,0.92)" : "rgba(62,84,102,0.92)";
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = "#fff1c2";
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);
    const pattern = SPRITE_PATTERNS[item.spriteKey];
    const iconScale = Math.max(1, Math.floor(Math.min(w, h) / 12));
    drawPixelSprite(pattern, item.palette, x + 5, y + 5, iconScale);
    ctx.globalAlpha = 1;
  }
}

function drawCharacterWindow() {
  const box = drawWindowBase("CHARACTER & SETTINGS", Math.min(760, canvas.width - 50), Math.min(420, canvas.height - 90));
  charStatButtons = [];
  const sx = box.x + 24;
  const sy = box.y + 62;

  drawUIText(`LEVEL ${player.level}   POINT ${player.statPoints}`, sx, sy, { size: 16, color: "#dfeee8" });
  drawUIText(`HP ${Math.round(player.hp)}/${player.maxHp}   MP ${Math.round(player.mp)}/${player.maxMp}`, sx, sy + 30, { size: 14 });
  drawUIText(`ATK ${player.attack}   DEF ${player.defense}`, sx, sy + 56, { size: 14 });
  drawUIText(`CARD POOL ${LEVEL_UP_CARD_POOL.length}`, sx, sy + 82, { size: 14, color: "#d0e4d8" });
  drawUIText(`SPECIAL ITEM ${player.specialItems.length}`, sx + 270, sy + 82, { size: 14, color: "#ffd9a6" });
  if (player.specialItems.length > 0) {
    const names = player.specialItems.slice(-2).map((it) => it.name).join(" / ");
    drawUIText(names, sx, sy + 108, { size: 12, color: "#f0d7a8" });
  }

  const rows = [
    { key: "str", label: "STR", hotkey: "Y" },
    { key: "agi", label: "AGI", hotkey: "U" },
    { key: "int", label: "INT", hotkey: "O" },
    { key: "luk", label: "LUK", hotkey: "P" }
  ];
  for (let i = 0; i < rows.length; i += 1) {
    const r = rows[i];
    const y = sy + 144 + i * 56;
    ctx.fillStyle = "rgba(26,40,39,0.74)";
    ctx.fillRect(sx, y - 8, box.w - 56, 40);
    drawUIText(`${r.label}: ${player.stats[r.key]} (보정 ${player.effectiveStats[r.key]})`, sx + 10, y, { size: 14, color: "#d9ece1" });
    drawUIText(`키 ${r.hotkey}`, sx + 330, y, { size: 14, color: "#d0ddda" });

    const bx = sx + box.w - 120;
    const by = y - 6;
    ctx.fillStyle = "rgba(65,101,83,0.8)";
    ctx.fillRect(bx, by, 28, 28);
    ctx.strokeStyle = "#8ad3aa";
    ctx.strokeRect(bx, by, 28, 28);
    drawUIText("+", bx + 9, by + 6, { size: 16, color: "#e5f7ed" });
    charStatButtons.push({ x: bx, y: by, w: 28, h: 28, key: r.key, label: r.label });
  }

  drawUIText("클릭 또는 Y/U/O/P로 스탯 업", sx, box.y + box.h - 28, { size: 14, color: "#b8d3c3" });
}

function drawSkillWindow() {
  const box = drawWindowBase(`SKILL LOADOUT (${SKILL_LIBRARY.length})`, Math.min(920, canvas.width - 40), Math.min(560, canvas.height - 70));
  const sx = box.x + 22;
  const sy = box.y + 98;
  skillButtons = [];
  skillAssignButtons = [];

  drawUIText("슬롯(Q/W/E/R) 선택 후 아이콘 클릭", sx, sy - 34, { size: 14, color: "#d4e8dc" });

  const hotkeys = ["KeyQ", "KeyW", "KeyE", "KeyR"];
  for (let i = 0; i < hotkeys.length; i += 1) {
    const key = hotkeys[i];
    const bx = sx + i * 110;
    const by = sy - 56;
    const selected = player.selectedSkillSlot === key;
    skillAssignButtons.push({ key, x: bx, y: by, w: 102, h: 34 });
    ctx.fillStyle = selected ? "rgba(119,197,255,0.35)" : "rgba(26,40,45,0.9)";
    ctx.fillRect(bx, by, 102, 34);
    ctx.strokeStyle = selected ? "#7bc5ff" : "#6f8b82";
    ctx.strokeRect(bx, by, 102, 34);
    drawUIText(`${key.replace("Key", "")} 슬롯`, bx + 10, by + 8, { size: 14, color: "#e2efe8" });
  }

  const iconSize = 70;
  const gap = 10;
  const cols = Math.max(5, Math.floor((box.w - 44) / (iconSize + gap)));
  const baseY = sy;

  for (let i = 0; i < SKILL_LIBRARY.length; i += 1) {
    const s = SKILL_LIBRARY[i];
    const bx = sx + (i % cols) * (iconSize + gap);
    const by = baseY + Math.floor(i / cols) * (iconSize + gap);
    skillButtons.push({ id: s.id, name: s.name, x: bx, y: by, w: iconSize, h: iconSize });

    const isQ = player.skillLoadout.KeyQ === s.id;
    const isW = player.skillLoadout.KeyW === s.id;
    const isE = player.skillLoadout.KeyE === s.id;
    const isR = player.skillLoadout.KeyR === s.id;
    const selectedAny = isQ || isW || isE || isR;
    ctx.globalAlpha = selectedAny ? 1 : 0.66;
    ctx.fillStyle = "rgba(24,33,37,0.94)";
    ctx.fillRect(bx, by, iconSize, iconSize);
    ctx.strokeStyle = s.color;
    ctx.lineWidth = selectedAny ? 2 : 1;
    ctx.strokeRect(bx, by, iconSize, iconSize);
    if (isQ) { ctx.strokeStyle = "#ffb55c"; ctx.strokeRect(bx + 2, by + 2, iconSize - 4, iconSize - 4); }
    if (isW) { ctx.strokeStyle = "#6fd2ff"; ctx.strokeRect(bx + 5, by + 5, iconSize - 10, iconSize - 10); }
    if (isE) { ctx.strokeStyle = "#7be6aa"; ctx.strokeRect(bx + 8, by + 8, iconSize - 16, iconSize - 16); }
    if (isR) { ctx.strokeStyle = "#ffd36f"; ctx.strokeRect(bx + 11, by + 11, iconSize - 22, iconSize - 22); }
    const cd = Math.max(0, Math.ceil(player.skillCooldowns[s.id] || 0));
    drawGameIcon(SKILL_ICON_BY_ID[s.id] || SKILL_ICON_BY_KIND[s.kind] || "orb", bx + 14, by + 14, 42, s.color);

    const marker = [];
    if (isQ) marker.push("Q");
    if (isW) marker.push("W");
    if (isE) marker.push("E");
    if (isR) marker.push("R");
    if (marker.length > 0) {
      drawUIText(marker.join(""), bx + 8, by + 48, { size: 12, color: "#f2f2f2" });
    }
    if (cd > 0) {
      ctx.fillStyle = "rgba(0,0,0,0.52)";
      ctx.fillRect(bx + 1, by + 1, iconSize - 2, iconSize - 2);
      drawUIText(`${cd}`, bx + Math.floor(iconSize * 0.5) - 8, by + Math.floor(iconSize * 0.5) - 10, { size: 16, color: "#ffe0b0" });
    }
    ctx.globalAlpha = 1;
  }
}

function drawFullMapOverlay() {
  ctx.fillStyle = "rgba(0,0,0,0.74)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const mapW = Math.min(canvas.width - 80, 980);
  const mapH = Math.min(canvas.height - 100, 580);
  const mapX = Math.round((canvas.width - mapW) * 0.5);
  const mapY = Math.round((canvas.height - mapH) * 0.5);
  ctx.fillStyle = "rgba(30,44,40,0.94)";
  ctx.fillRect(mapX, mapY, mapW, mapH);
  ctx.strokeStyle = "#79c39a";
  ctx.lineWidth = 2;
  ctx.strokeRect(mapX, mapY, mapW, mapH);
  drawUIText("FULL MAP (M TO CLOSE)", mapX + 18, mapY + 10, { size: 16, color: "#f7c96a" });

  for (const patch of mapPatches) {
    if (patch.hue === 0) ctx.fillStyle = "#3d7b6a";
    if (patch.hue === 1) ctx.fillStyle = "#4e8d71";
    if (patch.hue === 2) ctx.fillStyle = "#5a815b";
    if (patch.hue === 3) ctx.fillStyle = "#6b7d53";
    if (patch.hue === 4) ctx.fillStyle = "#48665f";
    const x = mapX + (patch.x / WORLD_WIDTH) * mapW;
    const y = mapY + (patch.y / WORLD_HEIGHT) * mapH;
    const w = (patch.w / WORLD_WIDTH) * mapW;
    const h = (patch.h / WORLD_HEIGHT) * mapH;
    ctx.fillRect(x, y, w, h);
  }

  ctx.fillStyle = "#2f9daa";
  for (const water of natureLayers.waters) {
    const x = mapX + (water.x / WORLD_WIDTH) * mapW;
    const y = mapY + (water.y / WORLD_HEIGHT) * mapH;
    const w = Math.max(4, (water.w / WORLD_WIDTH) * mapW);
    const h = Math.max(4, (water.h / WORLD_HEIGHT) * mapH);
    ctx.fillRect(x, y, w, h);
  }

  ctx.fillStyle = "#2b6d4f";
  for (const tree of natureLayers.trees) {
    const x = mapX + (tree.x / WORLD_WIDTH) * mapW;
    const y = mapY + (tree.y / WORLD_HEIGHT) * mapH;
    ctx.fillRect(x, y, 2, 2);
  }

  ctx.fillStyle = "#5fe98c";
  for (const herb of herbNodes) {
    if (!herb.active) continue;
    const x = mapX + (herb.x / WORLD_WIDTH) * mapW;
    const y = mapY + (herb.y / WORLD_HEIGHT) * mapH;
    ctx.fillRect(x, y, 3, 3);
  }

  ctx.fillStyle = "#e26666";
  for (const d of demons) {
    const x = mapX + (d.x / WORLD_WIDTH) * mapW;
    const y = mapY + (d.y / WORLD_HEIGHT) * mapH;
    ctx.fillRect(x, y, 3, 3);
  }

  ctx.fillStyle = "#f5c86b";
  for (const chest of treasureChests) {
    if (!chest.revealed || chest.opened) continue;
    const x = mapX + (chest.x / WORLD_WIDTH) * mapW;
    const y = mapY + (chest.y / WORLD_HEIGHT) * mapH;
    ctx.fillRect(x, y, 3, 3);
  }

  ctx.fillStyle = "#66b5ff";
  const px = mapX + (player.x / WORLD_WIDTH) * mapW;
  const py = mapY + (player.y / WORLD_HEIGHT) * mapH;
  ctx.fillRect(px - 4, py - 4, 8, 8);
}

function drawLevelUpCards() {
  if (!levelUpState.active) {
    levelCardButtons = [];
    return;
  }
  ctx.fillStyle = "rgba(0,0,0,0.8)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawUIText("LEVEL UP - CARD CHOICE", Math.max(24, canvas.width * 0.5 - 240), 54, { size: 20, color: "#ffd47b" });
  drawUIText("1/2/3, ←/→, Enter 또는 카드 클릭으로 선택", Math.max(24, canvas.width * 0.5 - 300), 90, { size: 14, color: "#dce9df" });

  levelCardButtons = [];
  const cardW = Math.min(320, Math.floor((canvas.width - 90) / 3));
  const cardH = Math.min(250, canvas.height - 170);
  const totalW = cardW * 3 + 20 * 2;
  const startX = Math.round((canvas.width - totalW) * 0.5);
  const y = Math.round((canvas.height - cardH) * 0.5) + 20;

  for (let i = 0; i < levelUpState.cards.length; i += 1) {
    const card = levelUpState.cards[i];
    const x = startX + i * (cardW + 20);
    levelCardButtons.push({ x, y, w: cardW, h: cardH, index: i });
    const selected = levelUpState.selectedIndex === i;
    if (!selected) ctx.globalAlpha = 0.52;
    ctx.fillStyle = "rgba(22,30,36,0.96)";
    ctx.fillRect(x, y, cardW, cardH);
    ctx.strokeStyle = card.color;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, cardW, cardH);
    if (selected) {
      ctx.globalAlpha = 1;
      ctx.strokeStyle = "#fff2b8";
      ctx.lineWidth = 3;
      ctx.strokeRect(x + 3, y + 3, cardW - 6, cardH - 6);
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 8, y + 8, cardW - 16, cardH - 16);
      drawUIText("SELECTED", x + cardW - 112, y + 8, { size: 12, color: "#ffdba3" });
      drawUIText("ENTER", x + cardW - 84, y + 28, { size: 12, color: "#f2f2f2" });
    } else {
      ctx.fillStyle = "rgba(0,0,0,0.2)";
      ctx.fillRect(x + 1, y + 1, cardW - 2, cardH - 2);
    }

    drawUIText(`${i + 1}`, x + 10, y + 8, { size: 16, color: "#8fc1ff" });
    drawUIText(card.title, x + 42, y + 8, { size: 16, color: card.color });
    drawUIText(card.description, x + 14, y + 44, { size: 14, color: "#deeee6" });

    ctx.fillStyle = "rgba(110,181,143,0.15)";
    ctx.fillRect(x + 12, y + 70, cardW - 24, cardH - 84);
    drawGameIcon(CARD_ICON_BY_FAMILY[card.familyKey] || "strike", x + 18, y + 90, 28, card.color);
    drawUIText("랜덤 강화 카드", x + 58, y + 90, { size: 14, color: "#c7d8ce" });
    drawUIText(`등급 ${card.tier}`, x + 58, y + 116, { size: 14, color: "#c7d8ce" });
    drawUIText("지금 선택하면 즉시 적용", x + 20, y + 146, { size: 14, color: "#c7d8ce" });
    drawUIText("다음 레벨업 때 다시 3장 제시", x + 20, y + 172, { size: 14, color: "#c7d8ce" });
    ctx.globalAlpha = 1;
  }
}

function drawTopHud() {
  const panelX = 10;
  const panelY = 10;
  const panelW = 440;
  const panelH = 166;
  ctx.fillStyle = "rgba(7,12,14,0.74)";
  ctx.fillRect(panelX, panelY, panelW, panelH);
  ctx.strokeStyle = "#6fb58f";
  ctx.lineWidth = 2;
  ctx.strokeRect(panelX, panelY, panelW, panelH);

  drawUIText("CHARACTER", panelX + 12, panelY + 8, { size: 18, color: "#f6c96a" });
  drawUIText(`LV ${player.level}`, panelX + 12, panelY + 36, { size: 16, color: "#d5f0e4" });
  drawUIText(`WAVE ${waveState.wave}`, panelX + 120, panelY + 36, { size: 16, color: "#d5f0e4" });
  drawUIText(`MON L${waveState.levelMin}-${waveState.levelMax}`, panelX + 216, panelY + 36, { size: 16, color: "#d5f0e4" });
  drawUIText(`HP ${Math.round(player.hp)}/${player.maxHp}`, panelX + 12, panelY + 62, { size: 16, color: "#ffd9d9" });
  drawUIText(`MP ${Math.round(player.mp)}/${player.maxMp}`, panelX + 216, panelY + 62, { size: 16, color: "#d4e2ff" });

  const expRequired = player.nextExp * LEVEL_UP_REQUIREMENT_MULTIPLIER;
  const expRatio = clamp(player.exp / expRequired, 0, 1);
  ctx.fillStyle = "#1f2a2f";
  ctx.fillRect(panelX + 12, panelY + 90, panelW - 24, 16);
  ctx.fillStyle = "#77d39f";
  ctx.fillRect(panelX + 12, panelY + 90, (panelW - 24) * expRatio, 16);
  drawUIText(`EXP ${player.exp}/${expRequired}`, panelX + 14, panelY + 110, { size: 14, color: "#dcebe3" });

  drawUIText("RESOURCE", panelX + 12, panelY + 130, { size: 14, color: "#f6c96a" });
  drawUIText(`GOLD ${player.gold}  HERB ${player.herbs}  POINT ${player.statPoints}`, panelX + 112, panelY + 130, { size: 14, color: "#c5dece" });

  if (player.buffTimer > 0 || player.speedBuffTimer > 0 || player.attackBuffTimer > 0) {
    const buffs = [];
    if (player.buffTimer > 0) buffs.push("ELIXIR");
    if (player.speedBuffTimer > 0) buffs.push("SPEED");
    if (player.attackBuffTimer > 0) buffs.push("ATK");
    drawUIText(`BUFF ${buffs.join("/")}`, panelX + 12, panelY + 146, { size: 12, color: "#ffd06a" });
  }
}

function drawPauseMenu() {
  if (!pauseState.open) {
    pauseState.buttons = [];
    pauseState.settingButtons = [];
    return;
  }

  ctx.fillStyle = "rgba(0,0,0,0.68)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const w = Math.min(520, canvas.width - 80);
  const h = Math.min(420, canvas.height - 120);
  const x = Math.round((canvas.width - w) * 0.5);
  const y = Math.round((canvas.height - h) * 0.5);
  ctx.fillStyle = "rgba(14,20,24,0.95)";
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = "#7bc89e";
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);

  drawUIText("PAUSE MENU", x + 30, y + 22, { size: 20, color: "#ffd07a" });
  drawUIText("ESC로 닫기", x + 30, y + 54, { size: 14, color: "#d8ece1" });

  pauseState.buttons = [];
  const btns = [
    { id: "resume", label: "게임 계속", y: y + 88 },
    { id: "settings", label: pauseState.settings ? "설정 닫기" : "설정 열기", y: y + 132 },
    { id: "restart", label: "다시 시작", y: y + 176 },
    { id: "exit", label: "게임 종료", y: y + 220 }
  ];
  for (const btn of btns) {
    const bx = x + 30;
    const by = btn.y;
    const bw = 180;
    const bh = 30;
    pauseState.buttons.push({ id: btn.id, x: bx, y: by, w: bw, h: bh });
    ctx.fillStyle = "rgba(26,44,40,0.9)";
    ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = "#7bc89e";
    ctx.strokeRect(bx, by, bw, bh);
    drawUIText(btn.label, bx + 14, by + 6, { size: 14, color: "#dcefe5" });
  }

  pauseState.settingButtons = [];
  if (pauseState.settings) {
    const sx = x + 240;
    const sy = y + 88;
    ctx.fillStyle = "rgba(20,32,36,0.9)";
    ctx.fillRect(sx, sy, w - 270, h - 120);
    ctx.strokeStyle = "#7bb3c8";
    ctx.strokeRect(sx, sy, w - 270, h - 120);
    drawUIText("설정", sx + 14, sy + 8, { size: 16, color: "#dff1ea" });

    const rows = [
      { key: "music", label: "음악" },
      { key: "sfx", label: "효과음" }
    ];
    for (let i = 0; i < rows.length; i += 1) {
      const row = rows[i];
      const ry = sy + 56 + i * 74;
      drawUIText(`${row.label} ${pauseState[row.key]}%`, sx + 14, ry - 8, { size: 14, color: "#d3e8de" });
      const bx1 = sx + 14;
      const bx2 = sx + 140;
      const by = ry + 10;
      const bw = 32;
      const bh = 24;
      pauseState.settingButtons.push({ id: `${row.key}_minus`, x: bx1, y: by, w: bw, h: bh });
      pauseState.settingButtons.push({ id: `${row.key}_plus`, x: bx2, y: by, w: bw, h: bh });
      ctx.fillStyle = "rgba(51,71,79,0.95)";
      ctx.fillRect(bx1, by, bw, bh);
      ctx.fillRect(bx2, by, bw, bh);
      ctx.strokeStyle = "#8ac1d3";
      ctx.strokeRect(bx1, by, bw, bh);
      ctx.strokeRect(bx2, by, bw, bh);
      drawUIText("-", bx1 + 12, by + 4, { size: 16, color: "#e2f2ec" });
      drawUIText("+", bx2 + 12, by + 4, { size: 16, color: "#e2f2ec" });
    }
  }
}

function drawGameOver() {
  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawUIText("GAME OVER", canvas.width * 0.5 - 120, canvas.height * 0.5 - 24, { size: 20, color: "#ffcf66" });
  drawUIText("R KEY TO RESTART", canvas.width * 0.5 - 160, canvas.height * 0.5 + 18, { size: 14, color: "#f5e9cc" });
}

function render() {
  drawMapBackground();
  ctx.save();
  ctx.translate(-camera.x, -camera.y);
  drawWorldGround();
  drawTreasureChests();
  drawHerbNodes();
  drawDrops();
  drawDemons();
  drawPlayerHuman();
  drawCombatEffects();
  ctx.restore();

  drawTopHud();
  drawMiniMap();
  drawBottomPanel();
  drawMenuHub();

  if (uiState.fullMap) drawFullMapOverlay();
  if (uiState.inventory) drawInventoryWindow();
  else {
    inventoryUiState.areas = null;
    inventoryUiState.hoverUid = null;
    if (inventoryUiState.dragging) {
      returnDraggedItemToOrigin();
    }
  }
  if (uiState.character) drawCharacterWindow();
  if (uiState.skills) drawSkillWindow();
  if (!uiState.skills) skillButtons = [];
  if (!uiState.character) charStatButtons = [];
  drawLevelUpCards();
  drawPauseMenu();

  if (gameOver) drawGameOver();
}

function update(dt) {
  if (gameOver) {
    if (justPressed.has("KeyR")) resetGame();
    justPressed.clear();
    return;
  }

  if (justPressed.has("Escape")) {
    if (uiState.menuHub) {
      uiState.menuHub = false;
    } else {
      pauseState.open = !pauseState.open;
      pauseState.settings = false;
    }
  }

  if (pauseState.open) {
    if (frameCount % 3 === 0) updateUI();
    justPressed.clear();
    return;
  }

  if (levelUpState.active) {
    if (justPressed.has("ArrowLeft")) {
      levelUpState.selectedIndex = (levelUpState.selectedIndex + 2) % 3;
    }
    if (justPressed.has("ArrowRight")) {
      levelUpState.selectedIndex = (levelUpState.selectedIndex + 1) % 3;
    }
    if (justPressed.has("Digit1")) selectLevelUpCard(0);
    if (justPressed.has("Digit2")) selectLevelUpCard(1);
    if (justPressed.has("Digit3")) selectLevelUpCard(2);
    if (justPressed.has("Enter") || justPressed.has("NumpadEnter")) {
      selectLevelUpCard(levelUpState.selectedIndex);
    }
    updateCombatEffects(dt);
    if (frameCount % 3 === 0) updateUI();
    justPressed.clear();
    return;
  }

  updatePlayer(dt);
  updateWave(dt);
  updateDemons(dt);
  updateDrops(dt);
  updateHerbNodes(dt);
  updateTreasureChests(dt);
  updateCombatEffects(dt);
  updateCamera();

  if (player.hp <= 0) {
    gameOver = true;
    pushLog("사망. R 키로 재시작.");
  }

  if (frameCount % 3 === 0) updateUI();
  justPressed.clear();
}

function resetGame() {
  demons.length = 0;
  drops.length = 0;
  herbNodes.length = 0;
  treasureChests.length = 0;
  mapPatches.length = 0;
  logs.length = 0;

  player.w = PLAYER_BASE_W * PLAYER_PIXEL_SCALE;
  player.h = PLAYER_BASE_H * PLAYER_PIXEL_SCALE;
  player.x = WORLD_WIDTH * 0.5 - Math.round(player.w * 0.5);
  player.y = WORLD_HEIGHT * 0.5 - Math.round(player.h * 0.5);
  player.facingX = 1;
  player.facingY = 0;
  player.isMoving = false;
  player.walkPhase = 0;
  player.vx = 0;
  player.vy = 0;
  player.level = 1;
  player.exp = 0;
  player.nextExp = 36;
  player.statPoints = 0;
  player.stats = { str: 8, agi: 8, int: 8, luk: 8 };
  player.effectiveStats = { str: 8, agi: 8, int: 8, luk: 8 };
  player.attackCooldown = 0;
  player.attackTimer = 0;
  player.hurtCooldown = 0;
  player.skillCooldowns = {};
  player.buffTimer = 0;
  player.shield = 0;
  player.cardMods = {
    attackPct: 0,
    attackSpeedPct: 0,
    moveSpeedPct: 0,
    attackRangePct: 0,
    attackCountBonus: 0,
    multiAttackChance: 0,
    critFlat: 0,
    dodgeFlat: 0,
    maxHpPct: 0,
    maxMpPct: 0,
    mpRegenPct: 0,
    hpRegenFlat: 0,
    skillPowerPct: 0,
    skillMpCostReduce: 0,
    skillCooldownReduce: 0,
    potionPowerPct: 0,
    dropRatePct: 0,
    goldGainPct: 0,
    lifeStealPct: 0,
    killShield: 0,
    killBlastPct: 0
  };
  player.herbs = 0;
  player.gold = 0;
  player.potions[1].count = 4;
  player.potions[2].count = 4;
  player.potions[3].count = 2;
  player.potions[4].count = 1;
  player.equipment.weapon = null;
  player.equipment.armor = null;
  player.specialItems = [];
  player.inventoryGrid = createItemGrid(INVENTORY_COLS, INVENTORY_ROWS);
  player.warehouseGrid = createItemGrid(STASH_COLS, STASH_ROWS);
  player.inventory = [];
  player.warehouse = [];
  player.inventoryIndex = 0;
  player.warehouseIndex = 0;
  inventoryUiState.dragging = null;
  inventoryUiState.selectedUid = null;
  inventoryUiState.hoverUid = null;
  inventoryUiState.areas = null;
  syncInventoryLists();

  recalcPlayerDerivedStats(false);
  player.hp = player.maxHp;
  player.mp = player.maxMp;

  waveState.wave = 0;
  waveState.spawned = 0;
  waveState.target = 0;
  waveState.aliveCap = 0;
  waveState.spawnTimer = 0;
  waveState.levelMin = 1;
  waveState.levelMax = 3;

  levelUpState.active = false;
  levelUpState.pendingCount = 0;
  levelUpState.cards = [];
  levelUpState.selectedIndex = 0;
  player.isMoving = false;
  player.walkPhase = 0;
  closeSideWindows();
  uiState.fullMap = false;
  pauseState.open = false;
  pauseState.settings = false;
  pauseState.buttons = [];
  pauseState.settingButtons = [];
  combatEffects.length = 0;
  skillButtons = [];
  skillAssignButtons = [];
  charStatButtons = [];
  levelCardButtons = [];
  menuHubButtons = [];

  score = 0;
  frameCount = 0;
  gameOver = false;
  specialItemSerial = 0;

  createMapPatches();
  createNatureLayers();
  createTreasureChests();
  createHerbNodes();
  startWave();
  updateCamera();
  updateUI();
  pushLog("새로운 사냥 시작.");
}

function init() {
  resizeCanvas();
  closeSideWindows();
  uiState.fullMap = false;
  pauseState.open = false;
  pauseState.settings = false;
  pauseState.buttons = [];
  pauseState.settingButtons = [];
  levelUpState.active = false;
  levelUpState.pendingCount = 0;
  levelUpState.cards = [];
  levelUpState.selectedIndex = 0;
  menuHubButtons = [];
  player.inventoryGrid = createItemGrid(INVENTORY_COLS, INVENTORY_ROWS);
  player.warehouseGrid = createItemGrid(STASH_COLS, STASH_ROWS);
  inventoryUiState.dragging = null;
  inventoryUiState.selectedUid = null;
  inventoryUiState.hoverUid = null;
  inventoryUiState.areas = null;
  syncInventoryLists();
  recalcPlayerDerivedStats(false);
  player.hp = player.maxHp;
  player.mp = player.maxMp;
  player.vx = 0;
  player.vy = 0;
  createMapPatches();
  createNatureLayers();
  createTreasureChests();
  createHerbNodes();
  startWave();
  updateCamera();
  updateUI();
  pushLog("탑뷰 악마 러시 시작. 맵 전체를 돌며 파밍하세요.");
  requestAnimationFrame(loop);
}

let lastTime = performance.now();
function stepGame(dt) {
  frameCount += 1;
  update(dt);
  render();
}

function loop(now) {
  if (useDeterministicAdvance) {
    lastTime = now;
    requestAnimationFrame(loop);
    return;
  }
  const dt = Math.min(2.2, (now - lastTime) / 16.6667);
  lastTime = now;
  stepGame(dt);
  requestAnimationFrame(loop);
}

function getModeLabel() {
  if (gameOver) return "game_over";
  if (pauseState.open) return "pause";
  if (levelUpState.active) return "level_up";
  if (uiState.inventory) return "inventory";
  if (uiState.character) return "character";
  if (uiState.skills) return "skills";
  if (uiState.fullMap) return "map";
  if (uiState.menuHub) return "menu";
  return "combat";
}

function roundValue(value, digits = 1) {
  if (!Number.isFinite(value)) return 0;
  const base = 10 ** digits;
  return Math.round(value * base) / base;
}

function nearestEntities(entities, pointOfEntity, limit, mapper) {
  const center = centerOf(player);
  return entities
    .map((entity) => {
      const point = pointOfEntity(entity);
      return {
        entity,
        dist: Math.hypot(point.x - center.x, point.y - center.y)
      };
    })
    .sort((a, b) => a.dist - b.dist)
    .slice(0, limit)
    .map(({ entity }) => mapper(entity));
}

function renderGameToText() {
  const activeSkillCooldowns = Object.fromEntries(
    Object.entries(player.skillCooldowns)
      .filter(([, timeLeft]) => timeLeft > 0)
      .map(([key, timeLeft]) => [key, roundValue(Math.max(0, timeLeft), 1)])
  );
  const payload = {
    coordinateSystem: "origin: top-left, +x: right, +y: down, units: world pixels",
    mode: getModeLabel(),
    player: {
      x: roundValue(player.x, 1),
      y: roundValue(player.y, 1),
      vx: roundValue(player.vx, 2),
      vy: roundValue(player.vy, 2),
      w: player.w,
      h: player.h,
      facing: { x: roundValue(player.facingX, 2), y: roundValue(player.facingY, 2) },
      hp: Math.round(player.hp),
      maxHp: Math.round(player.maxHp),
      mp: Math.round(player.mp),
      maxMp: Math.round(player.maxMp),
      shield: Math.round(player.shield),
      level: player.level,
      exp: Math.round(player.exp),
      nextExp: Math.round(player.nextExp)
    },
    camera: {
      x: roundValue(camera.x, 1),
      y: roundValue(camera.y, 1),
      width: canvas.width,
      height: canvas.height
    },
    wave: {
      wave: waveState.wave,
      spawned: waveState.spawned,
      target: waveState.target,
      alive: demons.length,
      aliveCap: waveState.aliveCap,
      levelMin: waveState.levelMin,
      levelMax: waveState.levelMax,
      spawnTimer: roundValue(Math.max(0, waveState.spawnTimer), 1)
    },
    resources: {
      score,
      gold: player.gold,
      herbs: player.herbs,
      potions: {
        "1": player.potions[1].count,
        "2": player.potions[2].count,
        "3": player.potions[3].count,
        "4": player.potions[4].count
      }
    },
    cooldowns: {
      attack: roundValue(Math.max(0, player.attackCooldown), 1),
      skills: activeSkillCooldowns,
      buffs: {
        potionBuff: roundValue(Math.max(0, player.buffTimer), 1),
        speedBuff: roundValue(Math.max(0, player.speedBuffTimer), 1),
        attackBuff: roundValue(Math.max(0, player.attackBuffTimer), 1)
      }
    },
    ui: {
      pause: pauseState.open,
      inventory: uiState.inventory,
      character: uiState.character,
      skills: uiState.skills,
      map: uiState.fullMap,
      menu: uiState.menuHub,
      levelUp: levelUpState.active,
      gameOver
    },
    enemies: nearestEntities(
      demons,
      (d) => ({ x: d.x + d.w * 0.5, y: d.y + d.h * 0.5 }),
      MAX_TEXT_LIST_SIZE,
      (d) => ({
        form: d.formKey,
        level: d.level,
        rank: d.rank,
        x: roundValue(d.x + d.w * 0.5, 1),
        y: roundValue(d.y + d.h * 0.5, 1),
        vx: roundValue(d.vx || 0, 2),
        vy: roundValue(d.vy || 0, 2),
        hp: Math.round(d.hp),
        maxHp: Math.round(d.maxHp)
      })
    ),
    drops: nearestEntities(
      drops,
      (drop) => ({ x: drop.x, y: drop.y }),
      MAX_TEXT_LIST_SIZE,
      (drop) => ({
        type: drop.type,
        x: roundValue(drop.x, 1),
        y: roundValue(drop.y, 1),
        amount: drop.amount || 1,
        ttl: Math.round(drop.ttl || 0)
      })
    ),
    herbs: nearestEntities(
      herbNodes.filter((node) => node.active),
      (node) => ({ x: node.x, y: node.y }),
      MAX_TEXT_LIST_SIZE,
      (node) => ({
        x: roundValue(node.x, 1),
        y: roundValue(node.y, 1)
      })
    ),
    chests: nearestEntities(
      treasureChests.filter((chest) => !chest.opened && chest.revealed),
      (chest) => ({ x: chest.x + chest.w * 0.5, y: chest.y + chest.h * 0.5 }),
      MAX_TEXT_LIST_SIZE,
      (chest) => ({
        x: roundValue(chest.x + chest.w * 0.5, 1),
        y: roundValue(chest.y + chest.h * 0.5, 1)
      })
    )
  };

  return JSON.stringify(payload);
}

function toggleFullscreen() {
  const target = canvas;
  const root = document.documentElement;
  const active = document.fullscreenElement;

  if (active) {
    return document.exitFullscreen().catch(() => {});
  }
  if (target.requestFullscreen) {
    return target.requestFullscreen().catch(() => {});
  }
  if (root.requestFullscreen) {
    return root.requestFullscreen().catch(() => {});
  }
  return Promise.resolve();
}

window.render_game_to_text = renderGameToText;
window.advanceTime = (ms = FIXED_FRAME_MS) => {
  useDeterministicAdvance = true;
  const safeMs = Math.max(FIXED_FRAME_MS, Number.isFinite(ms) ? ms : FIXED_FRAME_MS);
  const steps = Math.max(1, Math.round(safeMs / FIXED_FRAME_MS));
  const dt = clamp(safeMs / (FIXED_FRAME_MS * steps), 0.1, 2.2);
  for (let i = 0; i < steps; i += 1) {
    stepGame(dt);
  }
  return Promise.resolve();
};

window.addEventListener("keydown", (e) => {
  if (e.code === "Escape" && document.fullscreenElement) {
    void document.exitFullscreen().catch(() => {});
    return;
  }
  if (!keyState[e.code]) justPressed.add(e.code);
  keyState[e.code] = true;

  if (
    [
      "ArrowLeft",
      "ArrowRight",
      "ArrowUp",
      "ArrowDown",
      "KeyW",
      "KeyA",
      "KeyS",
      "KeyD",
      "KeyZ",
      "KeyE",
      "KeyB",
      "KeyC",
      "KeyK",
      "KeyM",
      "KeyQ",
      "KeyR",
      "Digit1",
      "Digit2",
      "Digit3",
      "Digit4",
      "KeyY",
      "KeyU",
      "KeyI",
      "KeyO",
      "KeyP",
      "KeyF",
      "KeyG",
      "KeyH",
      "Escape",
      "Tab",
      "Enter",
      "NumpadEnter",
      "Space"
    ].includes(e.code)
  ) {
    e.preventDefault();
  }

  if (e.code === "KeyF" && !uiState.inventory) {
    void toggleFullscreen();
  }
});

window.addEventListener("keyup", (e) => {
  keyState[e.code] = false;
});

canvas.addEventListener("mousemove", (e) => {
  const rect = canvas.getBoundingClientRect();
  mouse.x = e.clientX - rect.left;
  mouse.y = e.clientY - rect.top;
});

canvas.addEventListener("contextmenu", (e) => {
  e.preventDefault();
});

canvas.addEventListener("mousedown", (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  if (e.button === 2) handleMouseAction("right", x, y);
  if (e.button === 0) handleMouseAction("left", x, y);
});

window.addEventListener("resize", () => {
  resizeCanvas();
  updateCamera();
});

window.addEventListener("fullscreenchange", () => {
  resizeCanvas();
  updateCamera();
});

init();
