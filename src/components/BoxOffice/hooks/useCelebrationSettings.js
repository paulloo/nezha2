import { useState, useEffect } from 'react';
import { ref, onValue, set } from 'firebase/database';
import { db } from '../../../config/firebase';

const CELEBRATION_SETTINGS_KEY = 'boxoffice_celebration_settings';

// 检查是否在浏览器环境中
const isBrowser = typeof window !== 'undefined';

// 从 localStorage 安全地获取设置
const getSavedSettings = () => {
  if (!isBrowser) return true;
  try {
    const savedSettings = localStorage.getItem(CELEBRATION_SETTINGS_KEY);
    return savedSettings ? JSON.parse(savedSettings) : true;
  } catch (error) {
    console.warn('读取庆祝设置失败:', error);
    return true;
  }
};

// 安全地保存设置到 localStorage
const saveSettings = (value) => {
  if (!isBrowser) return;
  try {
    localStorage.setItem(CELEBRATION_SETTINGS_KEY, JSON.stringify(value));
  } catch (error) {
    console.warn('保存庆祝设置失败:', error);
  }
};

export const useCelebrationSettings = () => {
  // 使用安全的获取函数初始化状态
  const [receiveCelebrations, setReceiveCelebrations] = useState(getSavedSettings);
  const [isLoading, setIsLoading] = useState(true);

  // 当设置改变时安全地保存到 localStorage
  useEffect(() => {
    saveSettings(receiveCelebrations);
    
    // 同步到 Firebase
    if (!isLoading) {
      const userSettingsRef = ref(db, 'settings/celebrations');
      set(userSettingsRef, {
        receiveCelebrations,
        lastUpdate: Date.now()
      }).catch(error => {
        console.error('同步设置到 Firebase 失败:', error);
      });
    }
  }, [receiveCelebrations, isLoading]);

  // 从 Firebase 加载设置
  useEffect(() => {
    const userSettingsRef = ref(db, 'settings/celebrations');
    
    const unsubscribe = onValue(userSettingsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setReceiveCelebrations(data.receiveCelebrations);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return {
    receiveCelebrations,
    setReceiveCelebrations,
    isLoading
  };
}; 