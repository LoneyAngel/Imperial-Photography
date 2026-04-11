import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode; // 允许自定义错误显示内容
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  // 当子组件抛出错误时触发
  static getDerivedStateFromError(error: Error): State {
    // 更新 state，下次渲染将展示降级 UI
    return { hasError: true, error };
  }

  // 记录错误信息，通常用于发送到日志服务器（如 Sentry）
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    // 这里可以调用你后端的日志接口：api.post('/logs/error', { error, info: errorInfo });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/'; // 或者刷新当前页面
  };

  render() {
    if (this.state.hasError) {
      // 如果提供了自定义 fallback 则使用，否则使用默认的错误页面
      return this.props.fallback || (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6 text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">糟糕，页面出错了</h2>
          <p className="text-gray-600 mb-6">
            {this.state.error?.message || "发生了未知错误，请尝试刷新页面。"}
          </p>
          <button
            onClick={this.handleRetry}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            返回首页
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;