import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';
import { STYLES } from '../constants';

const Layout = ({ children }) => {
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { path: '/', label: '仪表板' },
    { path: '/downtime', label: '停机历史' }
  ];

  const getNavLinkClasses = (isActive) => {
    return `inline-flex items-center px-1 pt-1 text-sm font-medium transition-colors duration-200 ${
      isActive
        ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
    }`;
  };

  const getMobileNavLinkClasses = (isActive) => {
    return `block pl-3 pr-4 py-2 text-base font-medium transition-colors duration-200 ${
      isActive
        ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900 border-r-4 border-primary-600 dark:border-primary-400'
        : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
    }`;
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-all duration-300">
      {/* 顶部导航栏 */}
      <nav className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md shadow-lg border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo和导航链接 */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center group">
                <div className="flex-shrink-0 flex items-center">
                  <div className="relative">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary-600 dark:text-primary-400 mr-3 transition-transform duration-300 group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <div className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
                  </div>
                  <div>
                    <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-primary-600 dark:from-white dark:to-primary-400 bg-clip-text text-transparent">
                      ICRG 监控
                    </h1>
                    <p className="text-xs text-gray-500 dark:text-gray-400 -mt-1">
                      服务器管理
                    </p>
                  </div>
                </div>
              </Link>
              
              {/* 桌面端导航链接 */}
              <div className="hidden md:ml-6 md:flex md:space-x-8">
                {navLinks.map(({ path, label }) => (
                  <Link
                    key={path}
                    to={path}
                    className={getNavLinkClasses(location.pathname === path)}
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </div>

            {/* 桌面端：主题切换按钮 | 移动端：菜单按钮 + 主题切换 */}
            <div className="flex items-center space-x-2">
              {/* 主题切换按钮 */}
              <button
                onClick={toggleTheme}
                className="relative p-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all duration-200 group min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label={isDark ? '切换到亮色主题' : '切换到暗色主题'}
              >
                <div className="relative overflow-hidden">
                  {isDark ? (
                    <svg className="h-5 w-5 transition-transform duration-300 group-hover:rotate-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 transition-transform duration-300 group-hover:-rotate-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                  )}
                </div>
              </button>

              {/* 移动端菜单按钮 */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all duration-200 min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="菜单"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* 移动端导航菜单 */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md">
            <div className="pt-2 pb-3 space-y-1">
              {navLinks.map(({ path, label }) => (
                <Link
                  key={path}
                  to={path}
                  className={`${getMobileNavLinkClasses(location.pathname === path)} min-h-[44px] flex items-center`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* 主要内容区域 */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {children}
        </div>
      </main>
      
      {/* 页脚 */}
      <footer className="bg-white dark:bg-gray-800 shadow-inner py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-600 dark:text-gray-400">
          <p>© {new Date().getFullYear()} ICRG 服务器监控系统.</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;