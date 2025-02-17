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
    console.error('环境变量检查失败:', {
      missing,
      available: Object.keys(import.meta.env).filter(key => key.startsWith('VITE_FIREBASE_'))
    });
    throw new Error(`Missing required Firebase configuration: ${missing.join(', ')}`);
  }
};

// 确保所有必要的环境变量都存在
checkRequiredEnvVars();

// 使用默认值作为后备
const getEnvVar = (key, defaultValue = '') => {
  const value = import.meta.env[key];
  return value && value !== 'undefined' && value !== 'null' ? value : defaultValue;
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

// 开发环境下打印配置信息（不包含敏感信息）
if (import.meta.env.DEV) {
  console.log('Firebase Config:', {
    ...firebaseConfig,
    apiKey: '***',
    appId: '***',
    messagingSenderId: '***'
  });
}

// 初始化 Firebase
let app;
let db;

try {
  if (!firebaseConfig.databaseURL) {
    throw new Error('Firebase Database URL is required but not provided');
  }
  
  app = initializeApp(firebaseConfig);
  db = getDatabase(app);
  console.log('Firebase 初始化成功');
} catch (error) {
  console.error('Firebase 初始化失败:', error);
  throw error;
}

export { db };
export default app; 