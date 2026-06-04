import { ThreeEvent } from '@react-three/fiber';
import { useStore } from '../store/useStore';

/** 判定"点击"的距离阈值（像素），小于此值视为点击而非拖拽 */
const TAP_THRESHOLD_PX = 8;

/**
 * 组件选中交互
 * 点击组件 → 选中 + 切换到编辑模式
 * 点击空白（地板） → 取消选中 + 回到观察模式
 */
export function useSelection() {
  const selectComponent = useStore(s => s.selectComponent);
  const deselectComponent = useStore(s => s.deselectComponent);

  /** 处理组件 mesh 上的 pointer 事件 */
  const onComponentPointerDown = (componentId: string) => (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    // 记录按下位置，用于判断是否为点击（非拖拽）
    const target = e.nativeEvent.target as HTMLElement;
    target.setPointerCapture(e.nativeEvent.pointerId);

    const startX = (e.nativeEvent as PointerEvent).clientX;
    const startY = (e.nativeEvent as PointerEvent).clientY;

    const onUp = (ev: PointerEvent) => {
      target.removeEventListener('pointerup', onUp);
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      if (Math.sqrt(dx * dx + dy * dy) < TAP_THRESHOLD_PX) {
        selectComponent(componentId);
      }
    };
    target.addEventListener('pointerup', onUp);
  };

  /** 点击地板空白处 → 取消选中 */
  const onFloorClick = () => {
    deselectComponent();
  };

  return { onComponentPointerDown, onFloorClick };
}
