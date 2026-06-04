import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useStore } from '../store/useStore';
import { Grid } from './Grid';
import { ComponentMesh } from './ComponentMesh';
import { SelectionHighlight } from './SelectionHighlight';

/** 相机初始位置（斜45°俯视） */
const CAMERA_POS: [number, number, number] = [8, 6, 8];
const CAMERA_TARGET: [number, number, number] = [0, 0, 0];

/**
 * 3D 场景主容器
 * Canvas 占满全屏，内部放置灯光、网格、所有组件
 */
export function Scene() {
  const editMode = useStore(s => s.editMode);

  return (
    <Canvas
      camera={{
        position: CAMERA_POS,
        fov: 50,
        near: 0.1,
        far: 100,
      }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        touchAction: 'none',
      }}
      gl={{ preserveDrawingBuffer: false, antialias: true }}
      onCreated={({ camera }) => {
        camera.lookAt(CAMERA_TARGET[0], CAMERA_TARGET[1], CAMERA_TARGET[2]);
      }}
    >
      {/* 灯光 */}
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 15, 10]} intensity={0.8} />
      <hemisphereLight args={['#ffffff', '#888888', 0.3]} />

      {/* 参考网格 & 坐标轴 */}
      <Grid />

      {/* 透明地板 — 点击空白取消选中 */}
      <FloorPlane />

      {/* 所有组件 */}
      <Components />

      {/* 选中高亮 */}
      <SelectionHighlight />

      {/* 视角控制 — 编辑模式下禁用，防止拖拽时误触 */}
      <OrbitControls
        enabled={editMode === 'view'}
        target={CAMERA_TARGET}
        enableDamping
        dampingFactor={0.1}
        minDistance={3}
        maxDistance={20}
      />
    </Canvas>
  );
}

/** 渲染所有组件 */
function Components() {
  const components = useStore(s => s.components);
  return (
    <>
      {components.map(comp => (
        <ComponentMesh key={comp.id} component={comp} />
      ))}
    </>
  );
}

/** 透明地板平面 — 用于捕获"点击空白区域"事件来取消选中
 *  注意：必须设置 depthWrite=false depthTest=false，否则透明面会写入
 *  深度缓冲，遮挡 Y<0 处方块的面导致渲染缺失 */
function FloorPlane() {
  const deselect = useStore(s => s.deselectComponent);
  return (
    <mesh
      position={[0, -0.01, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
      onPointerDown={(e) => {
        e.stopPropagation();
        deselect();
      }}
      renderOrder={999}
    >
      <planeGeometry args={[20, 20]} />
      <meshBasicMaterial
        transparent
        opacity={0}
        side={THREE.DoubleSide}
        depthWrite={false}
        depthTest={false}
      />
    </mesh>
  );
}
