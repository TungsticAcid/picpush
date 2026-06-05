import { create } from 'zustand';
import type { ComponentData, EditMode, Axis, CollisionResult } from '../core/types';
import { getAllPresets, PRESET_SHAPES, PRESET_COLORS } from '../core/types';
import { CubeRegistry } from '../utils/collision';
import { snapPosition } from '../core/SnapSystem';
import { getWorldPositions } from '../core/TransformHelper';
import { rotateByAxis, snapQuatToAxis, identityQuat } from '../utils/quaternion';

let _nextId = 1;
function nextId(): string {
  return `comp_${_nextId++}`;
}

function randomColor(): string {
  return PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)];
}

interface Store {
  // --- 数据 ---
  components: ComponentData[];
  selectedId: string | null;
  editMode: EditMode;
  snapEnabled: boolean;
  alignAxisEnabled: boolean;
  gridSize: number;
  showShapeEditor: boolean;
  showComponentList: boolean;
  collisionFlashId: string | null;
  showGrid: boolean;
  showAxes: boolean;
  panelCollapsed: boolean;

  // --- 组件操作 ---
  addComponent: (name: string, cubes: [number, number, number][]) => void;
  addPresetComponent: (presetId: string) => void;
  removeComponent: (id: string) => void;
  duplicateComponent: (id: string) => void;
  updateComponent: (id: string, patch: Partial<Pick<ComponentData, 'name' | 'color' | 'opacity' | 'cubes'>>) => void;

  // --- 选择 & 模式 ---
  selectComponent: (id: string) => void;
  deselectComponent: () => void;
  setEditMode: (mode: EditMode) => void;

  // --- 变换操作 ---
  moveComponent: (id: string, delta: [number, number, number]) => CollisionResult;
  rotateComponent: (id: string, axis: Axis) => CollisionResult;
  dragComponent: (id: string, newPos: [number, number, number]) => CollisionResult;
  finalizeDrag: (id: string) => void;

  // --- 全局操作 ---
  clearAll: () => void;
  moveAll: (delta: [number, number, number]) => void;
  rotateAll: (axis: Axis) => void;

  // --- UI 状态 ---
  toggleSnap: () => void;
  toggleAlignAxis: () => void;
  toggleShapeEditor: () => void;
  toggleComponentList: () => void;
  toggleGrid: () => void;
  toggleAxes: () => void;
  togglePanelCollapsed: () => void;
  clearCollisionFlash: () => void;

  // --- 内部 ---
  _rebuildRegistry: () => void;
}

// 全局碰撞注册表单例
const registry = new CubeRegistry();

// 初始演示组件
function createDemoComponents(): ComponentData[] {
  return [
    {
      id: nextId(),
      name: 'L形',
      cubes: PRESET_SHAPES.L.map((p, i) => ({ id: `c_l_${i}`, localPos: p })),
      color: PRESET_COLORS[0],
      opacity: 0.6,
      position: [0, 0, 0],
      rotation: identityQuat(),
    },
    {
      id: nextId(),
      name: 'T形',
      cubes: PRESET_SHAPES.T.map((p, i) => ({ id: `c_t_${i}`, localPos: p })),
      color: PRESET_COLORS[1],
      opacity: 0.6,
      position: [3, 0, 0],
      rotation: identityQuat(),
    },
    {
      id: nextId(),
      name: 'Z形',
      cubes: PRESET_SHAPES.Z.map((p, i) => ({ id: `c_z_${i}`, localPos: p })),
      color: PRESET_COLORS[2],
      opacity: 0.6,
      position: [-3, 0, 0],
      rotation: identityQuat(),
    },
  ];
}

export const useStore = create<Store>((set, get) => ({
  // --- 初始状态 ---
  components: createDemoComponents(),
  selectedId: null,
  editMode: 'view' as EditMode,
  snapEnabled: true,
  alignAxisEnabled: true,
  gridSize: 1,
  showShapeEditor: false,
  showComponentList: false,
  collisionFlashId: null,
  showGrid: true,
  showAxes: true,
  panelCollapsed: false,

  // --- 组件操作 ---
  addComponent: (name, cubes) => {
    const comp: ComponentData = {
      id: nextId(),
      name,
      cubes: cubes.map((p, i) => ({ id: `c_${_nextId}_${i}`, localPos: p })),
      color: randomColor(),
      opacity: 0.6,
      position: [0, 0, 0],
      rotation: identityQuat(),
    };
    set(s => ({ components: [...s.components, comp] }));
    get()._rebuildRegistry();
  },

  addPresetComponent: (presetId) => {
    const preset = getAllPresets().find(p => p.id === presetId);
    if (!preset) return;
    const comp: ComponentData = {
      id: nextId(),
      name: preset.name,
      cubes: preset.cubes.map((p, i) => ({ id: `c_p_${_nextId}_${i}`, localPos: p })),
      color: randomColor(),
      opacity: 0.6,
      position: [0, 0, 0],
      rotation: identityQuat(),
    };
    set(s => ({ components: [...s.components, comp] }));
    get()._rebuildRegistry();
  },

  removeComponent: (id) => {
    set(s => ({
      components: s.components.filter(c => c.id !== id),
      selectedId: s.selectedId === id ? null : s.selectedId,
      editMode: s.selectedId === id ? 'view' : s.editMode,
    }));
    get()._rebuildRegistry();
  },

  duplicateComponent: (id) => {
    const src = get().components.find(c => c.id === id);
    if (!src) return;
    const comp: ComponentData = {
      ...src,
      id: nextId(),
      name: `${src.name}_副本`,
      cubes: src.cubes.map((c, i) => ({ ...c, id: `c_dup_${i}` })),
      position: [src.position[0] + 1, src.position[1], src.position[2] + 1],
      rotation: [...src.rotation],
    };
    set(s => ({ components: [...s.components, comp] }));
    get()._rebuildRegistry();
  },

  updateComponent: (id, patch) => {
    set(s => ({
      components: s.components.map(c => c.id === id ? { ...c, ...patch } : c),
    }));
  },

  // --- 选择 & 模式 ---
  selectComponent: (id) => {
    set({ selectedId: id, editMode: 'edit' });
  },

  deselectComponent: () => {
    set({ selectedId: null, editMode: 'view' });
  },

  setEditMode: (mode) => set({ editMode: mode }),

  // --- 变换操作 ---
  moveComponent: (id, delta) => {
    const { components, snapEnabled } = get();
    const comp = components.find(c => c.id === id);
    if (!comp) return { collides: false, conflicts: [] };

    let newPos: [number, number, number] = [
      comp.position[0] + delta[0],
      comp.position[1] + delta[1],
      comp.position[2] + delta[2],
    ];
    if (snapEnabled) {
      newPos = snapPosition(newPos);
    }

    const worldPositions = getWorldPositions(comp.cubes, newPos, comp.rotation);
    const result = registry.checkCollision(id, worldPositions);

    if (!result.collides) {
      set(s => ({
        components: s.components.map(c =>
          c.id === id ? { ...c, position: newPos } : c,
        ),
      }));
      get()._rebuildRegistry();
    } else {
      set({ collisionFlashId: id });
      setTimeout(() => set({ collisionFlashId: null }), 300);
    }

    return result;
  },

  rotateComponent: (id, axis) => {
    const { components, alignAxisEnabled } = get();
    const comp = components.find(c => c.id === id);
    if (!comp) return { collides: false, conflicts: [] };

    let newQuat = rotateByAxis(comp.rotation, axis, 90);
    if (alignAxisEnabled) {
      newQuat = snapQuatToAxis(newQuat);
    }

    const worldPositions = getWorldPositions(comp.cubes, comp.position, newQuat);
    const result = registry.checkCollision(id, worldPositions);

    if (!result.collides) {
      set(s => ({
        components: s.components.map(c =>
          c.id === id ? { ...c, rotation: newQuat } : c,
        ),
      }));
      get()._rebuildRegistry();
    } else {
      set({ collisionFlashId: id });
      setTimeout(() => set({ collisionFlashId: null }), 300);
    }

    return result;
  },

  dragComponent: (id, newPos) => {
    const { components } = get();
    const comp = components.find(c => c.id === id);
    if (!comp) return { collides: false, conflicts: [] };

    const worldPositions = getWorldPositions(comp.cubes, newPos, comp.rotation);
    const result = registry.checkCollision(id, worldPositions);

    if (!result.collides) {
      set(s => ({
        components: s.components.map(c =>
          c.id === id ? { ...c, position: newPos } : c,
        ),
      }));
      // 拖拽中不重建注册表，只在 finalize 时重建
    }

    return result;
  },

  finalizeDrag: (id) => {
    const { components, snapEnabled } = get();
    const comp = components.find(c => c.id === id);
    if (!comp) return;

    let pos = comp.position;
    if (snapEnabled) {
      pos = snapPosition(pos);
      set(s => ({
        components: s.components.map(c =>
          c.id === id ? { ...c, position: pos } : c,
        ),
      }));
    }
    get()._rebuildRegistry();
  },

  // --- 全局操作 ---
  clearAll: () => {
    set({ components: [], selectedId: null, editMode: 'view' });
    registry.rebuildAll([]);
  },

  moveAll: (delta) => {
    const { components } = get();
    const moved = components.map(comp => ({
      ...comp,
      position: [
        comp.position[0] + delta[0],
        comp.position[1] + delta[1],
        comp.position[2] + delta[2],
      ] as [number, number, number],
    }));
    set({ components: moved });
    get()._rebuildRegistry();
  },

  rotateAll: (axis) => {
    const { components, alignAxisEnabled } = get();
    const moved = components.map(comp => {
      let newQuat = rotateByAxis(comp.rotation, axis, 90);
      if (alignAxisEnabled) {
        newQuat = snapQuatToAxis(newQuat);
      }
      return { ...comp, rotation: newQuat };
    });
    set({ components: moved });
    get()._rebuildRegistry();
  },

  // --- UI 状态 ---
  toggleSnap: () => set(s => ({ snapEnabled: !s.snapEnabled })),
  toggleAlignAxis: () => set(s => ({ alignAxisEnabled: !s.alignAxisEnabled })),
  toggleShapeEditor: () => set(s => ({ showShapeEditor: !s.showShapeEditor })),
  toggleComponentList: () => set(s => ({ showComponentList: !s.showComponentList })),
  toggleGrid: () => set(s => ({ showGrid: !s.showGrid })),
  toggleAxes: () => set(s => ({ showAxes: !s.showAxes })),
  togglePanelCollapsed: () => set(s => ({ panelCollapsed: !s.panelCollapsed })),
  clearCollisionFlash: () => set({ collisionFlashId: null }),

  // --- 内部 ---
  _rebuildRegistry: () => {
    const { components } = get();
    const data = components.map(comp => ({
      id: comp.id,
      worldPositions: getWorldPositions(comp.cubes, comp.position, comp.rotation),
    }));
    registry.rebuildAll(data);
  },
}));
