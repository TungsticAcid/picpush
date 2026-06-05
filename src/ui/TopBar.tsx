import { useState } from 'react';
import { useStore } from '../store/useStore';
import type { Axis } from '../core/types';
import { getAllPresets } from '../core/types';
import { getWorldDelta, type ScreenDir } from '../core/cameraState';

/** 顶部工具栏 */
export function TopBar() {
  const editMode = useStore(s => s.editMode);
  const selectedId = useStore(s => s.selectedId);
  const showGrid = useStore(s => s.showGrid);
  const showAxes = useStore(s => s.showAxes);
  const components = useStore(s => s.components);
  const toggleComponentList = useStore(s => s.toggleComponentList);
  const toggleShapeEditor = useStore(s => s.toggleShapeEditor);
  const toggleGrid = useStore(s => s.toggleGrid);
  const toggleAxes = useStore(s => s.toggleAxes);
  const panelCollapsed = useStore(s => s.panelCollapsed);
  const overlapEnabled = useStore(s => s.overlapEnabled);
  const toggleOverlap = useStore(s => s.toggleOverlap);
  const togglePanelCollapsed = useStore(s => s.togglePanelCollapsed);
  const addPresetComponent = useStore(s => s.addPresetComponent);
  const deselectComponent = useStore(s => s.deselectComponent);
  const clearAll = useStore(s => s.clearAll);
  const moveAll = useStore(s => s.moveAll);
  const rotateAll = useStore(s => s.rotateAll);

  const [showMore, setShowMore] = useState(false);

  const handleClearAll = () => {
    if (components.length === 0) return;
    if (window.confirm('确定要清空所有组件吗？')) {
      clearAll();
    }
  };

  const handleMoveAll = (dir: ScreenDir) => {
    moveAll(getWorldDelta(dir));
  };

  const handleRotateAll = (axis: Axis) => {
    rotateAll(axis);
  };

  return (
    <>
      <div className="top-bar">
        <button className="top-btn" onClick={toggleComponentList}>
          ≡
        </button>

        <span className="top-title">立体拼合</span>

        {/* 网格/坐标轴/重叠模式 */}
        <button
          className={`top-btn top-btn--sm ${showGrid ? 'top-btn--active' : ''}`}
          onPointerDown={(e) => { e.preventDefault(); toggleGrid(); }}
        >▦</button>
        <button
          className={`top-btn top-btn--sm ${showAxes ? 'top-btn--active' : ''}`}
          onPointerDown={(e) => { e.preventDefault(); toggleAxes(); }}
        >⇱</button>
        <button
          className={`top-btn top-btn--sm ${overlapEnabled ? 'top-btn--active' : ''}`}
          title={overlapEnabled ? '重叠模式：开' : '重叠模式：关'}
          onPointerDown={(e) => { e.preventDefault(); toggleOverlap(); }}
        >⊠</button>

        {/* 更多菜单 */}
        <button
          className={`top-btn top-btn--sm ${showMore ? 'top-btn--active' : ''}`}
          onPointerDown={(e) => { e.preventDefault(); setShowMore(v => !v); }}
        >⋯</button>

        {/* 添加预设 */}
        <select
          className="preset-select"
          onChange={(e) => {
            if (e.target.value) {
              addPresetComponent(e.target.value);
              e.target.value = '';
            }
          }}
        >
          <option value="">+添加</option>
          {getAllPresets().map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>

        {/* 自定义形状 */}
        <button
          className="top-btn top-btn--sm"
          onPointerDown={(e) => { e.preventDefault(); toggleShapeEditor(); }}
        >✎</button>

        {editMode === 'edit' && selectedId && (
          <>
            <button
              className={`top-btn top-btn--sm ${panelCollapsed ? 'top-btn--active' : ''}`}
              onPointerDown={(e) => { e.preventDefault(); togglePanelCollapsed(); }}
            >{panelCollapsed ? '⊞' : '⊟'}</button>
            <button className="top-btn" onClick={deselectComponent}>✓</button>
          </>
        )}

        <button className="top-btn" onClick={() => window.location.reload()}>⟲</button>
      </div>

      {/* 更多菜单浮层 */}
      {showMore && (
        <div className="more-menu-backdrop" onPointerDown={() => setShowMore(false)}>
          <div className="more-menu" onPointerDown={(e) => e.stopPropagation()}>
            <div className="more-menu__title">全局操作</div>

            <button className="more-menu__btn more-menu__btn--danger" onPointerDown={(e) => { e.preventDefault(); handleClearAll(); setShowMore(false); }}>
              清空全部 ({components.length}个组件)
            </button>

            <div className="more-menu__divider">整体移动</div>
            <div className="more-menu__row">
              {([
                ['←左', 'left'], ['→右', 'right'],
                ['↑上', 'up'], ['↓下', 'down'],
                ['↖前', 'forward'], ['↘后', 'back'],
              ] as [string, ScreenDir][]).map(([label, dir]) => (
                <button key={label}
                  className="more-menu__btn"
                  onPointerDown={(e) => { e.preventDefault(); handleMoveAll(dir); }}
                >{label}</button>
              ))}
            </div>

            <div className="more-menu__divider">整体旋转90°</div>
            <div className="more-menu__row">
              {(['x', 'y', 'z'] as Axis[]).map(axis => (
                <button key={axis}
                  className="more-menu__btn"
                  onPointerDown={(e) => { e.preventDefault(); handleRotateAll(axis); }}
                >↻{axis.toUpperCase()}</button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
