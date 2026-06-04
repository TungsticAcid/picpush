import { useMemo } from 'react';
import { useStore } from '../store/useStore';
import { PRESET_COLORS } from '../core/types';

/** hex 颜色转 RGB 分量 */
function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

/** RGB 分量转 hex */
function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(c => c.toString(16).padStart(2, '0')).join('');
}

/** 选中组件的属性编辑：颜色预设 + RGB滑块 + 透明度 + 删除/复制 */
export function PropertyPanel() {
  const selectedId = useStore(s => s.selectedId);
  const components = useStore(s => s.components);
  const updateComponent = useStore(s => s.updateComponent);
  const removeComponent = useStore(s => s.removeComponent);
  const duplicateComponent = useStore(s => s.duplicateComponent);

  const comp = components.find(c => c.id === selectedId);
  const [r, g, b] = useMemo(() => comp ? hexToRgb(comp.color) : [128, 128, 128], [comp?.color]);

  if (!comp) return null;

  const handleRgbChange = (channel: 'r' | 'g' | 'b', value: number) => {
    const rgb = hexToRgb(comp.color);
    if (channel === 'r') rgb[0] = value;
    if (channel === 'g') rgb[1] = value;
    if (channel === 'b') rgb[2] = value;
    updateComponent(comp.id, { color: rgbToHex(rgb[0], rgb[1], rgb[2]) });
  };

  return (
    <div className="property-panel">
      {/* 颜色预设 */}
      <div className="color-row">
        {PRESET_COLORS.map(color => (
          <button
            key={color}
            className={`color-swatch ${comp.color === color ? 'color-swatch--active' : ''}`}
            style={{ backgroundColor: color }}
            onPointerDown={(e) => {
              e.preventDefault();
              updateComponent(comp.id, { color });
            }}
          />
        ))}
      </div>

      {/* RGB 滑块 */}
      <div className="rgb-sliders">
        {(['r', 'g', 'b'] as const).map((ch, i) => (
          <div className="rgb-row" key={ch}>
            <span className="rgb-label" style={{ color: ch === 'r' ? '#ff4444' : ch === 'g' ? '#44ff44' : '#4488ff' }}>
              {ch.toUpperCase()}
            </span>
            <input
              type="range"
              className="rgb-slider"
              min="0"
              max="255"
              step="1"
              value={[r, g, b][i]}
              onChange={(e) => handleRgbChange(ch, parseInt(e.target.value))}
            />
            <span className="rgb-value">{[r, g, b][i]}</span>
          </div>
        ))}
      </div>

      {/* 透明度滑块 */}
      <div className="opacity-row">
        <span className="opacity-label">透明度</span>
        <input
          type="range"
          className="opacity-slider"
          min="0.1"
          max="1.0"
          step="0.05"
          value={comp.opacity}
          onChange={(e) => {
            updateComponent(comp.id, { opacity: parseFloat(e.target.value) });
          }}
        />
        <span className="opacity-value">{Math.round(comp.opacity * 100)}%</span>
      </div>

      {/* 操作按钮 */}
      <div className="action-row">
        <button
          className="ctrl-btn ctrl-btn--danger"
          onPointerDown={(e) => { e.preventDefault(); removeComponent(comp.id); }}
        >
          🗑 删除
        </button>
        <button
          className="ctrl-btn"
          onPointerDown={(e) => { e.preventDefault(); duplicateComponent(comp.id); }}
        >
          ⧉ 复制
        </button>
      </div>
    </div>
  );
}
