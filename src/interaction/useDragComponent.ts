import { useCallback, useRef } from 'react';
import { ThreeEvent, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../store/useStore';
import { interactionState, pickDragPlane } from '../core/cameraState';

/** 注视点 */
const TARGET = new THREE.Vector3(0, 0, 0);

/**
 * 组件拖拽移动
 * 在编辑模式下，按在选中组件上开始拖拽。
 * 使用 DOM 级别事件跟踪指针，根据相机视角自动选择拖拽平面。
 */
export function useDragComponent(componentId: string) {
  const editMode = useStore(s => s.editMode);
  const selectedId = useStore(s => s.selectedId);
  const dragComponent = useStore(s => s.dragComponent);
  const finalizeDrag = useStore(s => s.finalizeDrag);
  const setDragging = useStore(s => s.setDragging);

  const isDragging = useRef(false);
  const dragPlane = useRef({ normal: new THREE.Vector3(0, 1, 0), constant: 0, fixedAxis: 1 });
  /** 指针世界位置与组件质心的偏移 */
  const grabOffset = useRef(new THREE.Vector3());
  const { camera, gl, raycaster } = useThree();
  const mouse = useRef(new THREE.Vector2());

  const dragComponentRef = useRef(dragComponent);
  dragComponentRef.current = dragComponent;
  const finalizeDragRef = useRef(finalizeDrag);
  finalizeDragRef.current = finalizeDrag;
  const setDraggingRef = useRef(setDragging);
  setDraggingRef.current = setDragging;

  const onPointerDown = useCallback((e: ThreeEvent<PointerEvent>) => {
    if (editMode !== 'edit' || selectedId !== componentId) return;
    e.stopPropagation();

    const comp = useStore.getState().components.find(c => c.id === componentId);
    if (!comp) return;

    isDragging.current = true;
    setDraggingRef.current(true);

    // 根据相机视角选择拖拽平面
    const plane = pickDragPlane(
      (camera as THREE.Camera).position,
      TARGET,
      comp.position,
    );
    dragPlane.current = plane;

    // 计算按下时指针在拖拽平面的位置，记录与组件质心的偏移
    const hitPoint = intersectPlane(e.point, e.ray, plane.normal, plane.constant);
    if (hitPoint) {
      grabOffset.current.set(
        comp.position[0] - hitPoint.x,
        comp.position[1] - hitPoint.y,
        comp.position[2] - hitPoint.z,
      );
    } else {
      grabOffset.current.set(0, 0, 0);
    }

    const canvas = gl.domElement;
    canvas.setPointerCapture(e.nativeEvent.pointerId);

    const onMove = (ev: PointerEvent) => {
      if (!isDragging.current) return;

      const rect = canvas.getBoundingClientRect();
      mouse.current.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.current.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse.current, camera as THREE.Camera);

      const { normal, constant, fixedAxis } = dragPlane.current;
      const plane3 = new THREE.Plane(normal, constant);
      const intersection = new THREE.Vector3();
      if (raycaster.ray.intersectPlane(plane3, intersection)) {
        const newPos: [number, number, number] = [
          intersection.x + grabOffset.current.x,
          intersection.y + grabOffset.current.y,
          intersection.z + grabOffset.current.z,
        ];
        // 保持固定轴不变（只在与平面垂直的轴上移动）
        newPos[fixedAxis] = comp.position[fixedAxis];
        dragComponentRef.current(componentId, newPos);
      }
    };

    const onUp = () => {
      if (!isDragging.current) return;
      isDragging.current = false;
      setDraggingRef.current(false);
      interactionState.justDragged = true;
      finalizeDragRef.current(componentId);

      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
    };

    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerup', onUp);
  }, [editMode, selectedId, componentId, camera, gl, raycaster]);

  return { onPointerDown };
}

/** 射线与指定平面求交 */
function intersectPlane(
  _point: THREE.Vector3,
  ray: THREE.Ray,
  normal: THREE.Vector3,
  constant: number,
): THREE.Vector3 | null {
  const plane = new THREE.Plane(normal, constant);
  const intersection = new THREE.Vector3();
  if (ray.intersectPlane(plane, intersection)) {
    return intersection;
  }
  return null;
}
