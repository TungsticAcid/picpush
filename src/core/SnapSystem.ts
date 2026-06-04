/**
 * 位置吸附：将世界坐标 snap 到最近的整数网格
 */
export function snapPosition(
  pos: [number, number, number],
  gridSize: number = 1,
): [number, number, number] {
  return [
    snapValue(pos[0], gridSize),
    snapValue(pos[1], gridSize),
    snapValue(pos[2], gridSize),
  ];
}

/** 单值吸附到最近的步进倍数 */
export function snapValue(value: number, gridSize: number = 1): number {
  return Math.round(value / gridSize) * gridSize;
}
