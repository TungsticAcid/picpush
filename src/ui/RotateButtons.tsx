import { useStore } from '../store/useStore';
import type { Axis } from '../core/types';

const AXES: { label: string; axis: Axis }[] = [
  { label: '↻X', axis: 'x' },
  { label: '↻Y', axis: 'y' },
  { label: '↻Z', axis: 'z' },
];

/** 旋转按钮组 — 绕各轴旋转 90° */
export function RotateButtons() {
  const selectedId = useStore(s => s.selectedId);
  const rotateComponent = useStore(s => s.rotateComponent);

  const handleRotate = (axis: Axis) => {
    if (!selectedId) return;
    rotateComponent(selectedId, axis);
  };

  return (
    <div className="btn-group">
      <span className="btn-group__label">旋转90°</span>
      <div className="btn-group__row">
        {AXES.map(({ label, axis }) => (
          <button
            key={axis}
            className="ctrl-btn ctrl-btn--rotate"
            onPointerDown={(e) => {
              e.preventDefault();
              handleRotate(axis);
            }}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
