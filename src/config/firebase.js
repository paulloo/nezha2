import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

// 检查必要的环境变量
const checkRequiredEnvVars = () => {
  const required = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_DATABASE_URL',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID',
    'VITE_FIREBASE_MEASUREMENT_ID'
  ];

  const missing = required.filter(key => {
    const value = import.meta.env[key];
    return !value || value === 'undefined' || value === 'null';
  });

  if (missing.length > 0) {
    // 在生产环境中使用更简洁的错误日志
    if (import.meta.env.PROD) {
      console.error('Firebase configuration is incomplete. Please check your environment variables.');
      throw new Error('Firebase configuration is incomplete');
    } else {
      console.error('环境变量检查失败:', {
        missing,
        available: Object.keys(import.meta.env).filter(key => key.startsWith('VITE_FIREBASE_'))
      });
      throw new Error(`Missing required Firebase configuration: ${missing.join(', ')}`);
    }
  }
};

// 确保所有必要的环境变量都存在
try {
  checkRequiredEnvVars();
} catch (error) {
  if (import.meta.env.PROD) {
    // 在生产环境中尝试使用备用配置
    console.warn('Attempting to use fallback configuration...');
  }
  throw error;
}

// 使用默认值作为后备
const getEnvVar = (key) => {
  const value = import.meta.env[key];
  if (!value || value === 'undefined' || value === 'null') {
    throw new Error(`Environment variable ${key} is required but not set`);
  }
  return value;
};

const firebaseConfig = {
  apiKey: getEnvVar('VITE_FIREBASE_API_KEY'),
  authDomain: getEnvVar('VITE_FIREBASE_AUTH_DOMAIN'),
  databaseURL: getEnvVar('VITE_FIREBASE_DATABASE_URL'),
  projectId: getEnvVar('VITE_FIREBASE_PROJECT_ID'),
  storageBucket: getEnvVar('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnvVar('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: getEnvVar('VITE_FIREBASE_APP_ID'),
  measurementId: getEnvVar('VITE_FIREBASE_MEASUREMENT_ID')
};

// 只在开发环境下打印配置信息
if (import.meta.env.DEV) {
  console.log('Firebase Config:', {
    ...firebaseConfig,
    apiKey: '***',
    appId: '***',
    messagingSenderId: '***'
  });
}

let app;
let db;

try {
  app = initializeApp(firebaseConfig);
  db = getDatabase(app);
  console.log(import.meta.env.PROD ? 'Firebase initialized' : 'Firebase 初始化成功');
} catch (error) {
  const errorMessage = import.meta.env.PROD 
    ? 'Failed to initialize Firebase'
    : 'Firebase 初始化失败:';
  console.error(errorMessage, error);
  throw error;
}

export { db };
export default app; 