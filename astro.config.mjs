// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';

// https://astro.build/config
export default defineConfig({
  integrations: [
    react(),
    tailwind({
      // 配置选项
      applyBaseStyles: true,
    }),
  ],
  vite: {
    // Vite 配置
    envPrefix: ['VITE_', 'MAOYAN_', 'WEBSOCKET_'],
    // 确保环境变量在客户端可用
    define: {
      'import.meta.env.VITE_FIREBASE_API_KEY': JSON.stringify(process.env.VITE_FIREBASE_API_KEY),
      'import.meta.env.VITE_FIREBASE_AUTH_DOMAIN': JSON.stringify(process.env.VITE_FIREBASE_AUTH_DOMAIN),
      'import.meta.env.VITE_FIREBASE_DATABASE_URL': JSON.stringify(process.env.VITE_FIREBASE_DATABASE_URL),
      'import.meta.env.VITE_FIREBASE_PROJECT_ID': JSON.stringify(process.env.VITE_FIREBASE_PROJECT_ID),
      'import.meta.env.VITE_FIREBASE_STORAGE_BUCKET': JSON.stringify(process.env.VITE_FIREBASE_STORAGE_BUCKET),
      'import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID': JSON.stringify(process.env.VITE_FIREBASE_MESSAGING_SENDER_ID),
      'import.meta.env.VITE_FIREBASE_APP_ID': JSON.stringify(process.env.VITE_FIREBASE_APP_ID),
      'import.meta.env.VITE_FIREBASE_MEASUREMENT_ID': JSON.stringify(process.env.VITE_FIREBASE_MEASUREMENT_ID)
    }
  }
});
