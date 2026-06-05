import * as THREE from 'three';

/**
 * 模块级可变相机状态，由 Scene 内组件通过 useFrame 更新，
 * 由 UI 组件（MoveButtons 等）读取，避免跨 Canvas 边界的 re-render。
 */
export const cameraState = {
  /** 相机到注视点的方向在 XZ 平面的投影（单位向量） */
  forwardXZ: new THREE.Vector3(0, 0, 1),
  /** 相机右方向在 XZ 平面的投影（单位向量） */
  rightXZ: new THREE.Vector3(1, 0, 0),
};

/**
 * 模块级交互状态标记
 * 拖拽结束时标记，防止后续 onPointerMissed 误触发取消选中。
 */
export const interactionState = {
  justDragged: false,
};

export type ScreenDir = 'left' | 'right' | 'up' | 'down' | 'forward' | 'back';

/** 将相机相对方向 snap 到最近的世界 XZ 轴，确保网格对齐 */
export function snapToWorldAxis(dir: THREE.Vector3): [number, number, number] {
  const absX = Math.abs(dir.x);
  const absZ = Math.abs(dir.z);
  if (absX >= absZ) return [Math.sign(dir.x) || 1, 0, 0];
  return [0, 0, Math.sign(dir.z) || 1];
}

/** 根据屏幕方向计算世界坐标移动增量 */
export function getWorldDelta(screenDir: ScreenDir): [number, number, number] {
  const fwd = cameraState.forwardXZ;
  const right = cameraState.rightXZ;

  switch (screenDir) {
    case 'left':
      return snapToWorldAxis(right.clone().multiplyScalar(-1));
    case 'right':
      return snapToWorldAxis(right.clone());
    case 'up':
      return [0, 1, 0];
    case 'down':
      return [0, -1, 0];
    case 'forward':
      return snapToWorldAxis(fwd.clone());
    case 'back':
      return snapToWorldAxis(fwd.clone().multiplyScalar(-1));
  }
}

/**
 * 选择拖拽平面 — 根据相机前向选择最合适的轴对齐平面，
 * 避免射线与平面近乎平行导致的精度问题。
 * 返回 [平面法线, 平面常量值, 固定轴索引(0=x,1=y,2=z)]
 */
export function pickDragPlane(
  cameraPos: THREE.Vector3,
  target: THREE.Vector3,
  compPos: [number, number, number],
): { normal: THREE.Vector3; constant: number; fixedAxis: number } {
  const forward = new THREE.Vector3().subVectors(target, cameraPos);
  const absX = Math.abs(forward.x);
  const absY = Math.abs(forward.y);
  const absZ = Math.abs(forward.z);

  let normal: THREE.Vector3;
  let constant: number;
  let fixedAxis: number;

  if (absY >= absX && absY >= absZ) {
    // 相机以垂直方向为主 → 用 Y 平面（XZ 移动）
    normal = new THREE.Vector3(0, 1, 0);
    constant = -compPos[1];
    fixedAxis = 1;
  } else if (absX >= absY && absX >= absZ) {
    // 相机以 X 方向为主 → 用 X 平面（YZ 移动）
    normal = new THREE.Vector3(1, 0, 0);
    constant = -compPos[0];
    fixedAxis = 0;
  } else {
    // 相机以 Z 方向为主 → 用 Z 平面（XY 移动）
    normal = new THREE.Vector3(0, 0, 1);
    constant = -compPos[2];
    fixedAxis = 2;
  }

  return { normal, constant, fixedAxis };
}
