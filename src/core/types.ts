/** 一个小方块：组件的最小组成单位 */
export interface Cube {
  id: string;
  /** 相对于组件原点的整数坐标 */
  localPos: [number, number, number];
}

/** 一个组件：由多个小方块组成的有色半透明体 */
export interface ComponentData {
  id: string;
  name: string;
  cubes: Cube[];
  color: string;
  opacity: number;
  /** 世界坐标位置 */
  position: [number, number, number];
  /** 四元数旋转 [x, y, z, w] */
  rotation: [number, number, number, number];
}

/** 编辑模式 */
export type EditMode = 'view' | 'edit';

/** 应用全局状态 */
export interface AppState {
  components: ComponentData[];
  selectedId: string | null;
  editMode: EditMode;
  snapEnabled: boolean;
  alignAxisEnabled: boolean;
  gridSize: number;
  showShapeEditor: boolean;
  showComponentList: boolean;
  /** 碰撞反馈 — 哪个组件需要短暂红色闪烁 */
  collisionFlashId: string | null;
}

/** 碰撞检测结果 */
export interface CollisionResult {
  collides: boolean;
  conflicts: string[];
}

/** 旋转轴 */
export type Axis = 'x' | 'y' | 'z';

/** 预设形状 */
export interface PresetDef {
  id: string;
  name: string;
  cubes: [number, number, number][];
  builtin: boolean;  // 内置预设不可删除/重命名
}

/** 内置预设定义 */
const BUILTIN_PRESETS: Omit<PresetDef, 'builtin'>[] = [
  { id: 'L', name: 'L形', cubes: [[0,0,0],[0,1,0],[1,0,0]] },
  { id: 'T', name: 'T形', cubes: [[0,0,0],[0,1,0],[1,0,0],[-1,0,0]] },
  { id: 'Z', name: 'Z形', cubes: [[0,0,0],[1,0,0],[1,1,0],[2,1,0]] },
  { id: 'line3', name: '一字3', cubes: [[0,0,0],[0,1,0],[0,2,0]] },
  { id: 'line2', name: '一字2', cubes: [[0,0,0],[0,1,0]] },
  { id: 'cube2', name: '2×2方块', cubes: [[0,0,0],[1,0,0],[0,1,0],[1,1,0]] },
  { id: 'cube3', name: '3×3方块', cubes: [[0,0,0],[1,0,0],[2,0,0],[0,1,0],[1,1,0],[2,1,0],[0,2,0],[1,2,0],[2,2,0]] },
];

const STORAGE_KEY = 'picpush_user_presets';

/** 获取所有预设（内置 + 用户自定义） */
export function getAllPresets(): PresetDef[] {
  const builtins: PresetDef[] = BUILTIN_PRESETS.map(p => ({ ...p, builtin: true }));
  const userPresets = loadUserPresets();
  return [...builtins, ...userPresets];
}

/** 新增用户预设 */
export function addUserPreset(name: string, cubes: [number, number, number][]): PresetDef {
  const presets = loadUserPresets();
  const def: PresetDef = {
    id: `user_${Date.now()}`,
    name,
    cubes,
    builtin: false,
  };
  presets.push(def);
  saveUserPresets(presets);
  return def;
}

/** 删除用户预设 */
export function deleteUserPreset(id: string): void {
  const presets = loadUserPresets().filter(p => p.id !== id);
  saveUserPresets(presets);
}

/** 重命名用户预设 */
export function renameUserPreset(id: string, newName: string): void {
  const presets = loadUserPresets();
  const p = presets.find(p => p.id === id);
  if (p) p.name = newName;
  saveUserPresets(presets);
}

function loadUserPresets(): PresetDef[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveUserPresets(presets: PresetDef[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
}

/** 兼容旧代码：通过 id 获取预设的方块列表 */
export function getPresetCubes(id: string): [number, number, number][] | null {
  return getAllPresets().find(p => p.id === id)?.cubes ?? null;
}

/** 维持旧 PRESET_SHAPES 向后兼容 */
export const PRESET_SHAPES: Record<string, [number, number, number][]> = {};
for (const p of BUILTIN_PRESETS) {
  PRESET_SHAPES[p.id] = p.cubes;
}

/** 预设颜色列表（柔色，适合半透明渲染） */
export const PRESET_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#FFEAA7', '#DDA0DD', '#FF8C69', '#87CEEB',
];
