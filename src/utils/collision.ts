import type { CollisionResult } from '../core/types';

/**
 * 空间哈希注册表 — 记录每个整数网格坐标被哪个组件占用
 * key: "x,y,z" 字符串
 * value: componentId
 */
export class CubeRegistry {
  private map = new Map<string, string>();

  /** 标记一个格子被占用 */
  occupy(x: number, y: number, z: number, componentId: string): void {
    this.map.set(key(x, y, z), componentId);
  }

  /** 清空某个组件的所有占用 */
  vacate(componentId: string): void {
    for (const [k, v] of this.map) {
      if (v === componentId) this.map.delete(k);
    }
  }

  /** 查询某格是否被占用（返回占用者id，null表示空闲） */
  isOccupied(x: number, y: number, z: number): string | null {
    return this.map.get(key(x, y, z)) ?? null;
  }

  /** 全量重建注册表 */
  rebuildAll(
    components: {
      id: string;
      worldPositions: [number, number, number][];
    }[],
  ): void {
    this.map.clear();
    for (const comp of components) {
      for (const [wx, wy, wz] of comp.worldPositions) {
        // 四舍五入到整数坐标
        const ix = Math.floor(wx);
        const iy = Math.floor(wy);
        const iz = Math.floor(wz);
        this.map.set(key(ix, iy, iz), comp.id);
      }
    }
  }

  /**
   * 检测组件在新位置是否与其他组件重叠
   * @param componentId 自身id（用于排除自身）
   * @param worldPositions 组件所有方块在新位置的世界坐标
   * @returns 碰撞检测结果
   */
  checkCollision(
    componentId: string,
    worldPositions: [number, number, number][],
  ): CollisionResult {
    const conflicts: string[] = [];
    for (const [wx, wy, wz] of worldPositions) {
      const ix = Math.floor(wx);
      const iy = Math.floor(wy);
      const iz = Math.floor(wz);
      const occupant = this.map.get(key(ix, iy, iz));
      if (occupant !== undefined && occupant !== componentId) {
        if (!conflicts.includes(occupant)) {
          conflicts.push(occupant);
        }
      }
    }
    return { collides: conflicts.length > 0, conflicts };
  }
}

function key(x: number, y: number, z: number): string {
  return `${x},${y},${z}`;
}
