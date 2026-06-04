import { useStore } from '../store/useStore';

/** 组件列表 — 底部抽屉弹出 */
export function ComponentList() {
  const showComponentList = useStore(s => s.showComponentList);
  const components = useStore(s => s.components);
  const selectedId = useStore(s => s.selectedId);
  const toggleComponentList = useStore(s => s.toggleComponentList);
  const selectComponent = useStore(s => s.selectComponent);
  const removeComponent = useStore(s => s.removeComponent);

  if (!showComponentList) return null;

  return (
    <div className="drawer-backdrop" onPointerDown={toggleComponentList}>
      <div className="drawer" onPointerDown={(e) => e.stopPropagation()}>
        <div className="drawer__header">
          <span>组件列表 ({components.length})</span>
          <button className="drawer__close" onPointerDown={toggleComponentList}>✕</button>
        </div>
        <div className="drawer__list">
          {components.length === 0 && (
            <div className="drawer__empty">暂无组件，点击顶部 + 添加</div>
          )}
          {components.map(comp => (
            <div
              key={comp.id}
              className={`drawer__item ${selectedId === comp.id ? 'drawer__item--selected' : ''}`}
              onPointerDown={() => {
                selectComponent(comp.id);
                toggleComponentList();
              }}
            >
              <span
                className="drawer__color-dot"
                style={{ backgroundColor: comp.color }}
              />
              <span className="drawer__name">{comp.name}</span>
              <span className="drawer__count">{comp.cubes.length}块</span>
              <button
                className="drawer__delete"
                onPointerDown={(e) => {
                  e.stopPropagation();
                  removeComponent(comp.id);
                }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
