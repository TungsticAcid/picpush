import { useMemo } from 'react';
import * as THREE from 'three';
import { useStore } from '../store/useStore';

/** 底面参考网格 + 三色坐标轴指示线（支持显隐开关） */
export function Grid() {
  const showGrid = useStore(s => s.showGrid);
  const showAxes = useStore(s => s.showAxes);

  const axes = useMemo(() => {
    const length = 5;
    return {
      x: { start: [0, 0, 0] as [number, number, number], end: [length, 0, 0] as [number, number, number], color: '#ff4444' },
      y: { start: [0, 0, 0] as [number, number, number], end: [0, length, 0] as [number, number, number], color: '#44ff44' },
      z: { start: [0, 0, 0] as [number, number, number], end: [0, 0, length] as [number, number, number], color: '#4444ff' },
    };
  }, []);

  return (
    <group>
      {/* 底面网格 */}
      {showGrid && (
        <gridHelper args={[10, 10, '#888888', '#444444']} position={[0, 0.01, 0]} />
      )}

      {/* 三色坐标轴 */}
      {showAxes && Object.entries(axes).map(([_, axis]) => (
        <line key={axis.color}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={2}
              array={new Float32Array([
                axis.start[0], axis.start[1], axis.start[2],
                axis.end[0], axis.end[1], axis.end[2],
              ])}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial color={axis.color} linewidth={1} />
        </line>
      ))}
    </group>
  );
}
