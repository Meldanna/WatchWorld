import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary label="应用">
    <App />
  </ErrorBoundary>
);

// PWA：只在生产环境注册 Service Worker。
// dev 下注册会干扰 Vite HMR（缓存住了旧模块，改代码不生效），所以显式排除。
// 注意 SW 需要 HTTPS 或 localhost —— 手机访问必须走 HTTPS，否则注册直接失败。
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .catch((err) => console.error('[PWA] Service Worker 注册失败:', err));
  });
}
