import { useStore } from '../store/useStore';

/**
 * 选中组件的高亮指示器
 * 高亮逻辑已内嵌在 ComponentMesh 中（黄色包围盒线框）
 * 此组件预留用于未来扩展（如显示变换 Gizmo）
 */
export function SelectionHighlight() {
  const selectedId = useStore(s => s.selectedId);
  // 目前高亮在 ComponentMesh 内部处理
  // 未来可以在这里添加 TransformControls 或自定义 Gizmo
  return null;
}
