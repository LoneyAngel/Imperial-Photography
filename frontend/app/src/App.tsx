import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/navbar';
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
import { TokenProvider } from './context/token';
import { FunctionProvider } from './context/function';
import Notice from './sections/Notice';
import MemberPublicProfile from './sections/MemberPublicProfile';
import ErrorBoundary from './components/error-boundary';
import { Toaster } from 'react-hot-toast';
import LittleNavbar from './components/little-navbar';
import AchievementPage from './sections/Honors';
import { ThemeProvider } from './context/theme';
import Setting from './sections/Setting';
import { useEffect } from 'react';
import { useTheme } from 'next-themes';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
    },
  },
});

function AppContent() {
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    // 检查是否是'自动模式'或初次访问
    const savedTheme = localStorage.getItem('theme');

    if (savedTheme === 'system' || !savedTheme) {
      const hour = new Date().getHours();
      // 你设置的逻辑：10点后或6点前为深色
      const targetTheme = hour >= 19 || hour <= 6 ? 'dark' : 'light';

      // 关键优化：只有在主题不符合预期时才 setTheme
      // 避免每次组件渲染都去触发 setTheme
      if (theme !== targetTheme) {
        setTheme(targetTheme);
      }
    }
  }, [theme, setTheme]); // 加上依赖项，保证规范
  return (
    <BrowserRouter>
      <div className="app-container">
        <LittleNavbar />
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
            <Route path="/card" element={<AchievementPage />} />
            <Route path="/setting" element={<Setting />} />
            <Route path="*" element={<Navigate to="/gallery" replace />} />
          </Routes>
        </main>
        <footer className="border-t py-6 mt-auto">
          <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
            <p>Imperial © 2024 - All rights reserved</p>
          </div>
        </footer>
      </div>
    </BrowserRouter>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Toaster position="top-center" reverseOrder={false} />
        <TokenProvider>
          <FunctionProvider>
            <UserProvider>
              <ThemeProvider>
                <AppContent />
              </ThemeProvider>
            </UserProvider>
          </FunctionProvider>
        </TokenProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
