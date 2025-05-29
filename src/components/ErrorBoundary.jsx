import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    
    // 在生产环境中，你可能想要将错误发送到错误报告服务
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex-shrink-0">
                <svg 
                  className="w-8 h-8 text-red-500" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth="2" 
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                应用程序出错
              </h2>
            </div>
            
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              抱歉，应用程序遇到了一个错误。请刷新页面重试，如果问题持续存在，请联系管理员。
            </p>
            
            {import.meta.env.DEV && this.state.error && (
              <details className="mb-4">
                <summary className="text-sm text-gray-500 cursor-pointer mb-2">
                  错误详情（开发模式）
                </summary>
                <pre className="text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded overflow-auto text-red-600 dark:text-red-400">
                  {this.state.error.toString()}
                  <br />
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
            
            <div className="flex space-x-3">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 bg-primary-500 hover:bg-primary-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
              >
                刷新页面
              </button>
              <button
                onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
                className="flex-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-medium py-2 px-4 rounded-lg transition-colors duration-200"
              >
                重试
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;