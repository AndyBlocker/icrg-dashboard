import { useState, useEffect } from 'react';

const THEME_KEY = 'theme';
const DARK_THEME = 'dark';
const LIGHT_THEME = 'light';

export const useTheme = () => {
  const [theme, setTheme] = useState(() => {
    // 检查 localStorage 中保存的主题
    const savedTheme = localStorage.getItem(THEME_KEY);
    if (savedTheme && [DARK_THEME, LIGHT_THEME].includes(savedTheme)) {
      return savedTheme;
    }
    
    // 检查系统偏好
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return DARK_THEME;
    }
    
    return LIGHT_THEME;
  });

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === DARK_THEME ? LIGHT_THEME : DARK_THEME);
  };

  const setLightTheme = () => setTheme(LIGHT_THEME);
  const setDarkTheme = () => setTheme(DARK_THEME);

  useEffect(() => {
    const root = window.document.documentElement;
    
    if (theme === DARK_THEME) {
      root.classList.add(DARK_THEME);
    } else {
      root.classList.remove(DARK_THEME);
    }
    
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  // 监听系统主题变化
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e) => {
      // 只有当用户没有手动设置主题时才自动切换
      const savedTheme = localStorage.getItem(THEME_KEY);
      if (!savedTheme) {
        setTheme(e.matches ? DARK_THEME : LIGHT_THEME);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  return {
    theme,
    isDark: theme === DARK_THEME,
    isLight: theme === LIGHT_THEME,
    toggleTheme,
    setLightTheme,
    setDarkTheme
  };
};