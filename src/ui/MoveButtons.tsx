import { useStore } from '../store/useStore';
import { getWorldDelta, type ScreenDir } from '../core/cameraState';

const DIRECTION_LABELS: [string, ScreenDir][] = [
  ['← 左', 'left'],
  ['→ 右', 'right'],
  ['↑ 上', 'up'],
  ['↓ 下', 'down'],
  ['↖ 前', 'forward'],
  ['↘ 后', 'back'],
];

/** 方向移动按钮组 — 每个按钮沿屏幕相对方向移动 1 格 */
export function MoveButtons() {
  const selectedId = useStore(s => s.selectedId);
  const moveComponent = useStore(s => s.moveComponent);

  const handleMove = (screenDir: ScreenDir) => {
    if (!selectedId) return;
    const delta = getWorldDelta(screenDir);
    moveComponent(selectedId, delta);
  };

  return (
    <div className="btn-group">
      <span className="btn-group__label">移动</span>
      <div className="btn-group__grid">
        {DIRECTION_LABELS.map(([label, dir]) => (
          <button
            key={label}
            className="ctrl-btn"
            onPointerDown={(e) => {
              e.preventDefault();
              handleMove(dir);
            }}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
