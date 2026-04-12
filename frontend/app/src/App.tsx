import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './sections/Home';
import Gallery from './sections/Gallery';
import Upload from './sections/Upload';
import MemberAuth from './sections/MemberAuth';
import MemberRegister from './sections/MemberRegister';
import MemberProfile from './sections/MemberProfile';
import SetPassword from './sections/SetPassword';
import ForgotPassword from './sections/ForgotPassword';
import ResetPassword from './sections/ResetPassword';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { UserProvider } from './context/user';
import { TokenProvider, useToken } from './context/token';
import { FunctionProvider } from './context/function';
import Notice from './sections/Notice';
import MemberPublicProfile from './sections/MemberPublicProfile';
import ErrorBoundary from './components/ErrorBoundary';
import { Toaster } from 'react-hot-toast';

export const queryClient = new QueryClient();

// 应用内容组件（在 TokenProvider 内部）
function AppContent() {
  const { isLoading } = useToken();

  // 初始化加载时显示加载指示器
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-500">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="app-container">
        <div className="h-[50px] flex items-center justify-center bg-slate-300">
          <p className="text-center text-sm">
            Welcome to join us and become our exclusive photographer！
          </p>
        </div>
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/register" element={<MemberRegister />} />
            <Route path="/upload" element={<Upload />} />
            <Route path="/member-auth" element={<MemberAuth />} />
            <Route path="/member-profile" element={<MemberProfile />} />
            <Route path="/set-password" element={<SetPassword />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/notice" element={<Notice />} />
            <Route path="/member/:id" element={<MemberPublicProfile />} />
            <Route path="*" element={<Navigate to="/gallery" replace />} />
          </Routes>
        </main>
        <footer className="border-t py-6 mt-auto">
          <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
            <p>Imperial © 2024 - All rights reserved</p>
          </div>
        </footer>
      </div>
    </Router>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Toaster position="top-center" reverseOrder={false} />
        <TokenProvider>
          <FunctionProvider>
            <UserProvider queryClient={queryClient}>
              <AppContent />
            </UserProvider>
          </FunctionProvider>
        </TokenProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
