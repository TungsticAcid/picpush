import { Scene } from './scene/Scene';
import { TopBar } from './ui/TopBar';
import { BottomPanel } from './ui/BottomPanel';
import { ComponentList } from './ui/ComponentList';
import { ShapeEditor } from './ui/ShapeEditor';

/** 应用根组件 — 3D 全屏场景 + UI 浮层 */
export function App() {
  return (
    <div className="app-root">
      {/* 3D 场景全屏 */}
      <Scene />

      {/* UI 浮层（pointer-events: none 容器，子元素各自开启 pointer-events） */}
      <div className="ui-overlay">
        <TopBar />
        <BottomPanel />
      </div>

      {/* 弹窗 / 抽屉层 */}
      <ComponentList />
      <ShapeEditor />
    </div>
  );
}
