import { useStore } from '../store/useStore';
import { MoveButtons } from './MoveButtons';
import { RotateButtons } from './RotateButtons';
import { SnapToggle } from './SnapToggle';
import { PropertyPanel } from './PropertyPanel';

/** 底部操作面板 — 编辑模式下滑入显示 */
export function BottomPanel() {
  const editMode = useStore(s => s.editMode);
  const selectedId = useStore(s => s.selectedId);
  const visible = editMode === 'edit' && selectedId !== null;

  return (
    <div className={`bottom-panel ${visible ? 'bottom-panel--visible' : ''}`}>
      <div className="bottom-panel__inner">
        <div className="bottom-panel__row">
          <MoveButtons />
          <RotateButtons />
        </div>
        <div className="bottom-panel__row">
          <SnapToggle />
        </div>
        <div className="bottom-panel__row">
          <PropertyPanel />
        </div>
      </div>
    </div>
  );
}
