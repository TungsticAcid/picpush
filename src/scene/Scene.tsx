import { useRef, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { TrackballControls } from '@react-three/drei';
import { useStore } from '../store/useStore';
import { cameraState, interactionState } from '../core/cameraState';
import { Grid } from './Grid';
import { ComponentMesh } from './ComponentMesh';
import { SelectionHighlight } from './SelectionHighlight';

/** 相机初始位置（斜45°俯视） */
const CAMERA_POS: [number, number, number] = [8, 6, 8];
const CAMERA_TARGET: [number, number, number] = [0, 0, 0];

/**
 * 3D 场景主容器
 */
export function Scene() {
  const isDragging = useStore(s => s.isDragging);
  const deselect = useStore(s => s.deselectComponent);
  const controlsRef = useRef<any>(null);

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
      onPointerMissed={() => {
        if (interactionState.justDragged) {
          interactionState.justDragged = false;
          return;
        }
        deselect();
      }}
    >
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 15, 10]} intensity={0.8} />
      <hemisphereLight args={['#ffffff', '#888888', 0.3]} />

      <Grid />
      <FloorPlane />
      <Components />
      <SelectionHighlight />

      {/* 视角控制 — TrackballControls 基于四元数，无万向节死锁 */}
      <TrackballControls
        ref={controlsRef}
        enabled={!isDragging}
        target={CAMERA_TARGET}
        minDistance={3}
        maxDistance={20}
        dynamicDampingFactor={0.1}
        noZoom={false}
        noPan={false}
      />

      <CameraTracker />
      <TwoFingerRotator controlsRef={controlsRef} />
    </Canvas>
  );
}

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

/** 透明地板 — 仅视觉参考，不参与射线检测 */
function FloorPlane() {
  return (
    <mesh
      position={[0, -0.01, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
      raycast={() => {}}
      renderOrder={999}
    >
      <planeGeometry args={[50, 50]} />
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

/** 每帧更新模块级相机状态 */
function CameraTracker() {
  const { camera } = useThree();
  const target = useMemo(() => new THREE.Vector3(...CAMERA_TARGET), []);

  useFrame(() => {
    cameraState.forwardXZ.copy(target).sub(camera.position);
    cameraState.forwardXZ.y = 0;
    const len = cameraState.forwardXZ.length();
    if (len > 0.001) cameraState.forwardXZ.divideScalar(len);

    cameraState.rightXZ.crossVectors(
      cameraState.forwardXZ,
      new THREE.Vector3(0, 1, 0),
    );
    cameraState.rightXZ.normalize();
  });

  return null;
}

/**
 * 双指沿屏幕法线旋转视角
 * 旋转中心为所有组件方块的质心（无组件时退回原点）。
 */
function TwoFingerRotator({ controlsRef }: { controlsRef: { current: any } }) {
  const { camera, gl } = useThree();
  const fallbackTarget = useMemo(() => new THREE.Vector3(0, 0, 0), []);

  useEffect(() => {
    const canvas = gl.domElement;
    let lastAngle: number | null = null;

    const getAngle = (touches: TouchList): number => {
      const dx = touches[1].clientX - touches[0].clientX;
      const dy = touches[1].clientY - touches[0].clientY;
      return Math.atan2(dy, dx);
    };

    /** 计算所有组件方块的质心 */
    const getCentroid = (): THREE.Vector3 => {
      const comps = useStore.getState().components;
      if (comps.length === 0) return fallbackTarget;

      let cx = 0, cy = 0, cz = 0, count = 0;
      for (const comp of comps) {
        for (const cube of comp.cubes) {
          // 方块世界坐标 = 组件位置 + 方块本地坐标 + 0.5（方块中心偏移）
          cx += comp.position[0] + cube.localPos[0] + 0.5;
          cy += comp.position[1] + cube.localPos[1] + 0.5;
          cz += comp.position[2] + cube.localPos[2] + 0.5;
          count++;
        }
      }
      if (count === 0) return fallbackTarget;
      return new THREE.Vector3(cx / count, cy / count, cz / count);
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        lastAngle = getAngle(e.touches);
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 2 || lastAngle === null) return;
      e.preventDefault();

      const currentAngle = getAngle(e.touches);
      const delta = currentAngle - lastAngle;
      lastAngle = currentAngle;

      if (Math.abs(delta) < 0.001) return;

      const t = getCentroid();

      const forward = new THREE.Vector3().subVectors(t, camera.position).normalize();
      const offset = new THREE.Vector3().subVectors(camera.position, t);
      const quat = new THREE.Quaternion().setFromAxisAngle(forward, delta);
      offset.applyQuaternion(quat);
      camera.up.applyQuaternion(quat);
      camera.position.copy(t.clone().add(offset));
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) {
        lastAngle = null;
      }
    };

    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    canvas.addEventListener('touchend', onTouchEnd);

    return () => {
      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchmove', onTouchMove);
      canvas.removeEventListener('touchend', onTouchEnd);
    };
  }, [camera, gl, fallbackTarget]);

  return null;
}
