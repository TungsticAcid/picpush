import { useCallback, useRef } from 'react';
import { ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../store/useStore';

/**
 * 组件拖拽移动
 * 在编辑模式下，拖拽选中组件的方块将其在水平面上移动
 * 使用射线与固定水平面的交点，而非与组件mesh的交点（避免正反馈越拖越远）
 */
export function useDragComponent(componentId: string) {
  const editMode = useStore(s => s.editMode);
  const selectedId = useStore(s => s.selectedId);
  const dragComponent = useStore(s => s.dragComponent);
  const finalizeDrag = useStore(s => s.finalizeDrag);

  const isDragging = useRef(false);
  const dragPlaneY = useRef(0);

  const onPointerDown = useCallback((e: ThreeEvent<PointerEvent>) => {
    if (editMode !== 'edit' || selectedId !== componentId) return;
    e.stopPropagation();

    isDragging.current = true;

    const comp = useStore.getState().components.find(c => c.id === componentId);
    if (!comp) return;
    // 记录拖拽水平面高度（组件的当前Y坐标）
    dragPlaneY.current = comp.position[1];

    (e.nativeEvent.target as HTMLElement).setPointerCapture(e.nativeEvent.pointerId);
  }, [editMode, selectedId, componentId]);

  const onPointerMove = useCallback((e: ThreeEvent<PointerEvent>) => {
    if (!isDragging.current) return;
    e.stopPropagation();

    // 使用射线与 Y=dragPlaneY 水平面求交，而非使用 e.point（e.point 是射线与
    // 组件自身 mesh 的交点，会随着组件移动产生正反馈，导致越拖越远/越大）
    const ray = e.ray;
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -dragPlaneY.current);
    const intersection = new THREE.Vector3();
    const hit = ray.intersectPlane(plane, intersection);

    if (hit) {
      dragComponent(componentId, [intersection.x, dragPlaneY.current, intersection.z]);
    }
  }, [componentId, dragComponent]);

  const onPointerUp = useCallback((e: ThreeEvent<PointerEvent>) => {
    if (!isDragging.current) return;
    isDragging.current = false;
    e.stopPropagation();
    finalizeDrag(componentId);
  }, [componentId, finalizeDrag]);

  return { onPointerDown, onPointerMove, onPointerUp };
}
