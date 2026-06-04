import { useStore } from '../store/useStore';

type DirKey = [string, [number, number, number]];

const DIRECTIONS: DirKey[] = [
  ['← 左', [-1, 0, 0]],
  ['→ 右', [1, 0, 0]],
  ['↑ 上', [0, 1, 0]],
  ['↓ 下', [0, -1, 0]],
  ['↖ 前', [0, 0, 1]],
  ['↘ 后', [0, 0, -1]],
];

/** 方向移动按钮组 — 每个按钮移动 1 格 */
export function MoveButtons() {
  const selectedId = useStore(s => s.selectedId);
  const moveComponent = useStore(s => s.moveComponent);

  const handleMove = (delta: [number, number, number]) => {
    if (!selectedId) return;
    moveComponent(selectedId, delta);
  };

  return (
    <div className="btn-group">
      <span className="btn-group__label">移动</span>
      <div className="btn-group__grid">
        {DIRECTIONS.map(([label, delta]) => (
          <button
            key={label}
            className="ctrl-btn"
            onPointerDown={(e) => {
              e.preventDefault();
              handleMove(delta);
            }}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
