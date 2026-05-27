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
      // 转发所有本地上传的静态资源请求
      // 部署时换成配置nginx的location
      '/uploads': {
        target: 'http://localhost:4000', // 指向你的后端服务端口
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
          // 1. 把 react, react-dom 相关的核心库聚合到一个名叫 react-vendor 的 chunk 中
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'react-vendor';
          }

          // 2. 把体积巨大的整个动画库单独切出来，命名为 motion-vendor
          if (id.includes('node_modules/framer-motion/')) {
            return 'motion-vendor';
          }

          // 3. 把网络请求、状态管理、数据缓存相关的库（如 axios, @tanstack/react-query）聚在一起
          if (id.includes('node_modules/axios/') || id.includes('node_modules/@tanstack/')) {
            return 'utils-vendor';
          }
        },
        // 输出目录结构配置
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
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
