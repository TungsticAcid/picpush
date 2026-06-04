import { Quaternion, Euler, MathUtils, Vector3 } from 'three';

/** 将值 snap 到最近的步进倍数 */
function roundTo(value: number, step: number): number {
  return Math.round(value / step) * step;
}

/**
 * 将四元数对齐到最近的轴对齐朝向（每个轴 snap 到 90° 倍数）
 * 用于正交坐标轴方向对齐模式
 */
export function snapQuatToAxis(quat: [number, number, number, number]): [number, number, number, number] {
  const q = new Quaternion(quat[0], quat[1], quat[2], quat[3]);
  const euler = new Euler().setFromQuaternion(q);

  const halfPi = Math.PI / 2;
  euler.x = roundTo(euler.x, halfPi);
  euler.y = roundTo(euler.y, halfPi);
  euler.z = roundTo(euler.z, halfPi);

  const snapped = new Quaternion().setFromEuler(euler);
  return [snapped.x, snapped.y, snapped.z, snapped.w];
}

/**
 * 绕指定轴旋转四元数
 * @param quat 当前四元数
 * @param axis 'x' | 'y' | 'z'
 * @param angleDeg 旋转角度（度数）
 * @returns 新的四元数
 */
export function rotateByAxis(
  quat: [number, number, number, number],
  axis: 'x' | 'y' | 'z',
  angleDeg: number,
): [number, number, number, number] {
  const q = new Quaternion(quat[0], quat[1], quat[2], quat[3]);
  const angleRad = MathUtils.degToRad(angleDeg);

  const axisVec = { x: new Vector3(1, 0, 0), y: new Vector3(0, 1, 0), z: new Vector3(0, 0, 1) }[axis];
  const delta = new Quaternion().setFromAxisAngle(axisVec, angleRad);

  q.multiplyQuaternions(delta, q);
  return [q.x, q.y, q.z, q.w];
}

/** 创建单位四元数 */
export function identityQuat(): [number, number, number, number] {
  return [0, 0, 0, 1];
}

/** 四元数转换为易读的欧拉角字符串（度数） */
export function quatToEulerDeg(quat: [number, number, number, number]): [number, number, number] {
  const q = new Quaternion(quat[0], quat[1], quat[2], quat[3]);
  const euler = new Euler().setFromQuaternion(q);
  return [
    MathUtils.radToDeg(euler.x),
    MathUtils.radToDeg(euler.y),
    MathUtils.radToDeg(euler.z),
  ];
}
