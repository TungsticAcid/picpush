import { Quaternion, Vector3 } from 'three';
import type { Cube } from './types';

const HALF = 0.5;

/**
 * 根据组件位置和旋转，计算所有方块的世界中心坐标
 * 方块中心 = cellIndex + 0.5（居于网格单元中心）
 */
export function getWorldPositions(
  cubes: Cube[],
  worldPos: [number, number, number],
  worldQuat: [number, number, number, number],
): [number, number, number][] {
  const quat = new Quaternion(worldQuat[0], worldQuat[1], worldQuat[2], worldQuat[3]);
  const origin = new Vector3(worldPos[0], worldPos[1], worldPos[2]);
  const result: [number, number, number][] = [];

  for (const cube of cubes) {
    const local = new Vector3(
      cube.localPos[0] + HALF,
      cube.localPos[1] + HALF,
      cube.localPos[2] + HALF,
    );
    local.applyQuaternion(quat);
    local.add(origin);
    result.push([local.x, local.y, local.z]);
  }

  return result;
}

/** 计算两个三元组的分量差 */
export function posDelta(
  a: [number, number, number],
  b: [number, number, number],
): [number, number, number] {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

/** 分量加 */
export function posAdd(
  a: [number, number, number],
  delta: [number, number, number],
): [number, number, number] {
  return [a[0] + delta[0], a[1] + delta[1], a[2] + delta[2]];
}
