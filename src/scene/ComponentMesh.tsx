import { useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { ThreeEvent } from '@react-three/fiber';
import { useStore } from '../store/useStore';
import type { ComponentData } from '../core/types';
import { useDragComponent } from '../interaction/useDragComponent';

/** 判定"点击"的距离阈值（像素），小于此值视为点击而非拖拽 */
const TAP_THRESHOLD_PX = 8;

/** 单个组件在3D场景中的渲染，包含交互事件处理 */
export function ComponentMesh({ component }: { component: ComponentData }) {
  const selectedId = useStore(s => s.selectedId);
  const collisionFlashId = useStore(s => s.collisionFlashId);
  const selectComponent = useStore(s => s.selectComponent);
  const isSelected = selectedId === component.id;
  const isFlashing = collisionFlashId === component.id;

  const { onPointerDown: onDragDown, onPointerMove: onDragMove, onPointerUp: onDragUp } =
    useDragComponent(component.id);

  // 方块几何体（复用）
  const geo = useMemo(() => new THREE.BoxGeometry(0.9, 0.9, 0.9), []);
  // 边缘几何体
  const edgeGeo = useMemo(() => new THREE.EdgesGeometry(geo), [geo]);

  /** 点击组件 → 选中，区分点击和拖拽 */
  const handlePointerDown = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    const startX = (e.nativeEvent as PointerEvent).clientX;
    const startY = (e.nativeEvent as PointerEvent).clientY;

    const onUp = (ev: PointerEvent) => {
      document.removeEventListener('pointerup', onUp);
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      if (Math.sqrt(dx * dx + dy * dy) < TAP_THRESHOLD_PX) {
        // 是点击：选中组件
        selectComponent(component.id);
      }
    };
    document.addEventListener('pointerup', onUp, { once: true });
  }, [component.id, selectComponent]);

  /** 拖拽阶段的事件处理 */
  const handleDragDown = useCallback((e: ThreeEvent<PointerEvent>) => {
    onDragDown(e);
  }, [onDragDown]);

  const handleDragMove = useCallback((e: ThreeEvent<PointerEvent>) => {
    onDragMove(e);
  }, [onDragMove]);

  const handleDragUp = useCallback((e: ThreeEvent<PointerEvent>) => {
    onDragUp(e);
  }, [onDragUp]);

  return (
    <group
      position={new THREE.Vector3(...component.position)}
      quaternion={new THREE.Quaternion(...component.rotation)}
    >
      {component.cubes.map(cube => {
        const pos = new THREE.Vector3(cube.localPos[0] + 0.5, cube.localPos[1] + 0.5, cube.localPos[2] + 0.5);
        const isDragTarget = isSelected;
        return (
          <group key={cube.id} position={pos}>
            {/* 主体 */}
            <mesh
              geometry={geo}
              onPointerDown={isDragTarget ? handleDragDown : handlePointerDown}
              onPointerMove={isDragTarget ? handleDragMove : undefined}
              onPointerUp={isDragTarget ? handleDragUp : undefined}
            >
              <meshPhongMaterial
                color={isFlashing ? '#ff0000' : component.color}
                transparent
                opacity={component.opacity}
                depthWrite={component.opacity < 0.8}
                side={THREE.DoubleSide}
              />
            </mesh>
            {/* 黑色细边 */}
            <lineSegments geometry={edgeGeo}>
              <lineBasicMaterial color="#000000" transparent opacity={0.3} />
            </lineSegments>
          </group>
        );
      })}

      {/* 选中时的高亮包裹框 */}
      {isSelected && (
        <lineSegments>
          <edgesGeometry args={[computeBoundingBox(component.cubes)]} />
          <lineBasicMaterial color="#ffff00" linewidth={1} />
        </lineSegments>
      )}
    </group>
  );
}

/** 根据方块局部坐标计算包围盒几何体 */
function computeBoundingBox(cubes: ComponentData['cubes']): THREE.BoxGeometry {
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (const c of cubes) {
    for (let i = 0; i < 3; i++) {
      // 方块中心在 localPos + 0.5，半边长 0.45（几何体 0.9×0.9×0.9）
      min[i] = Math.min(min[i], c.localPos[i] + 0.05);
      max[i] = Math.max(max[i], c.localPos[i] + 0.95);
    }
  }
  const size: [number, number, number] = [
    max[0] - min[0],
    max[1] - min[1],
    max[2] - min[2],
  ];
  const center: [number, number, number] = [
    (min[0] + max[0]) / 2,
    (min[1] + max[1]) / 2,
    (min[2] + max[2]) / 2,
  ];
  const geo = new THREE.BoxGeometry(...size);
  geo.translate(...center);
  return geo;
}
