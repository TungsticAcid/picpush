import { useStore } from '../store/useStore';

/** 吸附 & 轴对齐开关按钮 */
export function SnapToggle() {
  const snapEnabled = useStore(s => s.snapEnabled);
  const alignAxisEnabled = useStore(s => s.alignAxisEnabled);
  const toggleSnap = useStore(s => s.toggleSnap);
  const toggleAlignAxis = useStore(s => s.toggleAlignAxis);

  return (
    <div className="btn-group btn-group--full">
      <button
        className={`toggle-btn ${snapEnabled ? 'toggle-btn--on' : 'toggle-btn--off'}`}
        onPointerDown={(e) => { e.preventDefault(); toggleSnap(); }}
      >
        吸附: {snapEnabled ? 'ON' : 'OFF'}
      </button>
      <button
        className={`toggle-btn ${alignAxisEnabled ? 'toggle-btn--on' : 'toggle-btn--off'}`}
        onPointerDown={(e) => { e.preventDefault(); toggleAlignAxis(); }}
      >
        轴对齐: {alignAxisEnabled ? 'ON' : 'OFF'}
      </button>
    </div>
  );
}
