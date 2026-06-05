import { useState, useMemo, useCallback } from 'react';
import { useStore } from '../store/useStore';
import { getAllPresets, addUserPreset, deleteUserPreset, renameUserPreset } from '../core/types';

const GRID_SIZE = 5;
const MAX_LAYERS = 5;

/** 形状编辑器 — 分层的2D网格编辑器，支持预设和自定义 */
export function ShapeEditor() {
  const showShapeEditor = useStore(s => s.showShapeEditor);
  const toggleShapeEditor = useStore(s => s.toggleShapeEditor);
  const selectedId = useStore(s => s.selectedId);
  const components = useStore(s => s.components);
  const updateComponent = useStore(s => s.updateComponent);
  const addComponent = useStore(s => s.addComponent);
  const addPresetComponent = useStore(s => s.addPresetComponent);

  const comp = components.find(c => c.id === selectedId);
  const [mode, setMode] = useState<'custom' | 'preset'>(comp ? 'custom' : 'preset');
  const [layer, setLayer] = useState(0);
  const [saveName, setSaveName] = useState('');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameInput, setRenameInput] = useState('');
  const [presets, setPresets] = useState(getAllPresets);

  // 刷新预设列表
  const refreshPresets = () => setPresets(getAllPresets());

  // 从当前组件读取已占用的格子
  const initialGrid = useMemo(() => {
    const grid: boolean[][][] = Array.from({ length: MAX_LAYERS }, () =>
      Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(false)),
    );
    if (comp) {
      for (const cube of comp.cubes) {
        const [x, y, z] = cube.localPos;
        if (y >= 0 && y < MAX_LAYERS && x >= 0 && x < GRID_SIZE && z >= 0 && z < GRID_SIZE) {
          grid[y][x][z] = true;
        }
      }
    }
    return grid;
  }, [comp]);

  const [grid, setGrid] = useState<boolean[][][]>(initialGrid);

  // 切换格子
  const toggleCell = useCallback((x: number, z: number) => {
    setGrid(prev => {
      const next = prev.map(layer => layer.map(row => [...row]));
      next[layer][x][z] = !next[layer][x][z];
      return next;
    });
  }, [layer]);

  // 计数
  const cubeCount = useMemo(() => {
    let n = 0;
    for (const layerGrid of grid) {
      for (const row of layerGrid) {
        for (const cell of row) {
          if (cell) n++;
        }
      }
    }
    return n;
  }, [grid]);

  // 收集所有方块坐标
  const collectCubes = useCallback((): [number, number, number][] => {
    const result: [number, number, number][] = [];
    for (let y = 0; y < MAX_LAYERS; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        for (let z = 0; z < GRID_SIZE; z++) {
          if (grid[y][x][z]) {
            result.push([x, y, z]);
          }
        }
      }
    }
    return result;
  }, [grid]);

  // 应用自定义形状
  const applyCustom = () => {
    const cubes = collectCubes();
    if (cubes.length === 0) return;
    if (comp) {
      updateComponent(comp.id, {
        cubes: cubes.map((p, i) => ({ id: `c_cust_${Date.now()}_${i}`, localPos: p })),
      });
    } else {
      addComponent('自定义', cubes);
    }
    toggleShapeEditor();
  };

  // 保存为预设
  const handleSavePreset = () => {
    const cubes = collectCubes();
    if (cubes.length === 0 || !saveName.trim()) return;
    addUserPreset(saveName.trim(), cubes);
    setSaveName('');
    refreshPresets();
  };

  // 删除预设
  const handleDeletePreset = (id: string) => {
    deleteUserPreset(id);
    refreshPresets();
  };

  // 重命名
  const handleRename = (id: string) => {
    if (!renameInput.trim()) return;
    renameUserPreset(id, renameInput.trim());
    setRenamingId(null);
    setRenameInput('');
    refreshPresets();
  };

  // 清空当前层
  const clearLayer = () => {
    setGrid(prev => {
      const next = prev.map(l => l.map(r => [...r]));
      for (let x = 0; x < GRID_SIZE; x++) {
        for (let z = 0; z < GRID_SIZE; z++) {
          next[layer][x][z] = false;
        }
      }
      return next;
    });
  };

  // 清空全部
  const clearAll = () => {
    setGrid(Array.from({ length: MAX_LAYERS }, () =>
      Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(false)),
    ));
  };

  // 选预设
  const selectPreset = (presetId: string) => {
    const preset = presets.find(p => p.id === presetId);
    if (!preset) return;
    if (comp) {
      updateComponent(comp.id, {
        cubes: preset.cubes.map((p, i) => ({
          id: `c_p_${Date.now()}_${i}`,
          localPos: p as [number, number, number],
        })),
      });
    } else {
      addPresetComponent(presetId);
    }
    toggleShapeEditor();
  };

  if (!showShapeEditor) return null;

  return (
    <div className="drawer-backdrop" onPointerDown={toggleShapeEditor}>
      <div className="drawer editor-drawer" onPointerDown={(e) => e.stopPropagation()}>
        <div className="drawer__header">
          <span>形状编辑器 {comp ? `— 编辑「${comp.name}」` : '— 新建组件'}</span>
          <button className="drawer__close" onPointerDown={toggleShapeEditor}>✕</button>
        </div>

        {/* 模式切换 */}
        <div className="editor__tabs">
          <button
            className={`editor__tab ${mode === 'custom' ? 'editor__tab--active' : ''}`}
            onPointerDown={() => setMode('custom')}
          >
            自定义
          </button>
          <button
            className={`editor__tab ${mode === 'preset' ? 'editor__tab--active' : ''}`}
            onPointerDown={() => setMode('preset')}
          >
            预设
          </button>
        </div>

        {mode === 'preset' && (
          <div className="drawer__list">
            {presets.length === 0 && (
              <div className="drawer__empty">暂无预设</div>
            )}
            {presets.map(p => (
              <div key={p.id} className={`drawer__item ${comp ? 'drawer__item--selected' : ''}`}>
                {renamingId === p.id ? (
                  <>
                    <input
                      className="preset-name-input"
                      value={renameInput}
                      onChange={(e) => setRenameInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRename(p.id);
                        if (e.key === 'Escape') { setRenamingId(null); setRenameInput(''); }
                      }}
                      autoFocus
                      style={{ flex: 1, height: 32, padding: '0 8px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.08)', color: '#e0e0e0', fontSize: 13 }}
                    />
                    <button
                      className="drawer__delete"
                      onPointerDown={(e) => { e.preventDefault(); handleRename(p.id); }}
                    >✓</button>
                  </>
                ) : (
                  <>
                    <div
                      className="drawer__name"
                      onPointerDown={() => selectPreset(p.id)}
                    >
                      {p.name}
                      <span className="drawer__count"> ({p.cubes.length}块)</span>
                    </div>
                    {!p.builtin && (
                      <>
                        <button
                          className="drawer__delete"
                          onPointerDown={(e) => {
                            e.preventDefault();
                            setRenamingId(p.id);
                            setRenameInput(p.name);
                          }}
                        >✎</button>
                        <button
                          className="drawer__delete"
                          onPointerDown={(e) => {
                            e.preventDefault();
                            handleDeletePreset(p.id);
                          }}
                        >🗑</button>
                      </>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {mode === 'custom' && (
          <div className="editor__custom">
            {/* 层选择 */}
            <div className="layer-controls">
              <button
                className="layer-btn"
                disabled={layer <= 0}
                onPointerDown={(e) => { e.preventDefault(); setLayer(l => l - 1); }}
              >
                ▼
              </button>
              <span className="layer-label">第 {layer + 1} 层 (Y={layer})</span>
              <button
                className="layer-btn"
                disabled={layer >= MAX_LAYERS - 1}
                onPointerDown={(e) => { e.preventDefault(); setLayer(l => l + 1); }}
              >
                ▲
              </button>
            </div>

            {/* 编辑网格 */}
            <div className="edit-grid">
              {Array.from({ length: GRID_SIZE }, (_, z) => (
                <div key={z} className="edit-grid__row">
                  {Array.from({ length: GRID_SIZE }, (_, x) => (
                    <button
                      key={x}
                      className={`edit-grid__cell ${grid[layer][x][z] ? 'edit-grid__cell--on' : ''}`}
                      onPointerDown={(e) => { e.preventDefault(); toggleCell(x, z); }}
                    />
                  ))}
                </div>
              ))}
            </div>

            {/* 信息栏 */}
            <div className="editor__info">
              <span>共 {cubeCount} 个方块</span>
            </div>

            {/* 保存为预设 */}
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                className="preset-name-input"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                placeholder="预设名称..."
                style={{
                  flex: 1, height: 36, padding: '0 10px', borderRadius: 8,
                  border: '1px solid rgba(255,255,255,0.15)',
                  background: 'rgba(255,255,255,0.06)', color: '#e0e0e0', fontSize: 13,
                }}
              />
              <button
                className="ctrl-btn ctrl-btn--apply"
                disabled={cubeCount === 0 || !saveName.trim()}
                onPointerDown={(e) => { e.preventDefault(); handleSavePreset(); }}
              >
                保存预设
              </button>
            </div>

            {/* 操作按钮 */}
            <div className="editor__actions">
              <button className="ctrl-btn" onPointerDown={(e) => { e.preventDefault(); clearLayer(); }}>
                清空当前层
              </button>
              <button className="ctrl-btn" onPointerDown={(e) => { e.preventDefault(); clearAll(); }}>
                全部清空
              </button>
              <button
                className="ctrl-btn ctrl-btn--apply"
                disabled={cubeCount === 0}
                onPointerDown={(e) => { e.preventDefault(); applyCustom(); }}
              >
                应用
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
