import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/navbar';
import Home from './pages/Home';
import Gallery from './pages/Gallery';
import Upload from './pages/Upload';
import MemberAuth from './pages/MemberAuth';
import MemberRegister from './pages/MemberRegister';
import MemberProfile from './pages/MemberProfile';
import SetPassword from './pages/SetPassword';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import { QueryClientProvider } from '@tanstack/react-query';
import { UserProvider } from './context/user';
import { TokenProvider } from './context/token';
import { FunctionProvider } from './context/function';
import Notice from './pages/Notice';
import MemberPublicProfile from './pages/MemberPublicProfile';
import ErrorBoundary from './components/error-boundary';
import { Toaster } from 'react-hot-toast';
import LittleNavbar from './components/little-navbar';
import AchievementPage from './pages/Honors';
import { ThemeProvider } from './context/theme';
import Setting from './pages/Setting';
import { ArrowRight } from 'lucide-react';
import { queryClient } from './utils/client';
// import { useEffect } from 'react';
// import { useTheme } from 'next-themes';

function AppContent() {
  // const { setTheme } = useTheme();

  // 根据时间实现主题变更
  // useEffect(() => {
  //   // 仅在初次访问且没有保存的主题时，根据时间自动设置
  //   const savedTheme = localStorage.getItem('theme');

  //   if (!savedTheme) {
  //     const hour = new Date().getHours();
  //     const targetTheme = hour >= 19 || hour <= 6 ? 'dark' : 'light';
  //     setTheme(targetTheme);
  //   }
  // }, [setTheme]);

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
          <div className="container flex flex-col justify-center items-center gap-4 text-center text-sm text-muted-foreground">
            <a
              href="https://github.com/LoneyAngel"
              className="text-green-600 hover:scale-105 duration-200 flex items-center"
              target="_blank"
            >
              <span className="font-mono">前往 github 主页 </span>
              <ArrowRight className="h-4 w-4" />
            </a>
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
