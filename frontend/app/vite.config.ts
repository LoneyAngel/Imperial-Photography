import path from 'path';

import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import { defineConfig } from 'vite';
import viteCompression from 'vite-plugin-compression';

// https://vitejs.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [
    react(),
    // 1. 体积分析工具（打包后生成 report.html）
    visualizer({ open: true, filename: 'bundle-report.html' }),
    // 2. 开启 Gzip 压缩，生成 .gz 文件
    viteCompression({ threshold: 10240, algorithm: 'gzip', ext: '.gz' }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
  build: {
    // 生产环境关闭 sourcemap
    sourcemap: false,
    // 关闭打包后文件大小计算报告，加快打包速度
    reportCompressedSize: false,

    rollupOptions: {
      output: {
        // 优化分包策略
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // 将 React 核心库单独打包，因为它们几乎从不改变，方便浏览器强缓存
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'react-core';
            }
            // 剩下的其他第三方依赖打包到 vendor 中
            return 'vendor';
          }
        },
        // 输出目录结构配置
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
    },
  },
  // 生产环境打包时，把 console.log和 console.info 替换为空函数
  define:
    command === 'build'
      ? {
          'console.log': '(() => {})',
          'console.info': '(() => {})',
        }
      : {},
}));
