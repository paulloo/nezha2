/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface ImportMetaEnv {
  // WebSocket 配置
  readonly WEBSOCKET_HOST: string;
  readonly WEBSOCKET_PROTOCOL: string;

  // 缓存配置
  readonly CACHE_TTL: string;
  readonly HEARTBEAT_INTERVAL: string;
  readonly MAX_RECONNECT_ATTEMPTS: string;
  readonly RECONNECT_INTERVAL: string;
  readonly BATCH_INTERVAL: string;
  readonly METRICS_CLEANUP_INTERVAL: string;

  // 限流配置
  readonly RATE_LIMIT_MAX_REQUESTS_PER_IP: string;
  readonly RATE_LIMIT_MAX_CONNECTIONS_PER_IP: string;
  readonly RATE_LIMIT_MAX_TOTAL_CONNECTIONS: string;
  readonly RATE_LIMIT_CELEBRATION_COOLDOWN: string;
  readonly RATE_LIMIT_BROADCAST_BATCH_SIZE: string;
  readonly RATE_LIMIT_BROADCAST_INTERVAL: string;

  // 缓存配置
  readonly CACHE_MAX_ITEMS: string;
  readonly CACHE_CLEANUP_INTERVAL: string;

  // Firebase 配置
  readonly FIREBASE_API_KEY: string;
  readonly FIREBASE_AUTH_DOMAIN: string;
  readonly FIREBASE_DATABASE_URL: string;
  readonly FIREBASE_PROJECT_ID: string;
  readonly FIREBASE_STORAGE_BUCKET: string;
  readonly FIREBASE_MESSAGING_SENDER_ID: string;
  readonly FIREBASE_APP_ID: string;
  readonly FIREBASE_MEASUREMENT_ID: string;

  // 猫眼API配置
  readonly MAOYAN_API_BASE_URL: string;
  readonly MAOYAN_DEFAULT_MOVIE_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}