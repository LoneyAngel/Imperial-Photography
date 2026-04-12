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
import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const queryClient = new QueryClient();

function AppContent() {
  const { isLoading } = useToken();
  const [navbarClicked, setNavbarClicked] = useState(localStorage.getItem("navbarClicked") === "true");
  useEffect (() => {
    if (!navbarClicked) {
      const timer = setTimeout(() => {
        localStorage.setItem("navbarClicked", "true");
        setNavbarClicked(true);
      }, 10000); // 10秒后自动设置为已点击
      return () => clearTimeout(timer);
    }
  }, [])

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

  function handleClick(){
    localStorage.setItem("navbarClicked","true")
    setNavbarClicked(true);
  }



  return (
    <Router>
      <div className="app-container">
        <AnimatePresence>
          {(!navbarClicked) && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="h-[50px] flex items-center justify-center bg-slate-300 relative"
            >
              <p className="text-center text-sm underline decoration-sky-500 decoration-2 underline-offset-4 decoration-dashed">
                Welcome to join us and become our exclusive photographer！
              </p>
              <button onClick={handleClick} className="absolute right-4">
                <X className="h-4 w-4 " />
              </button>
            </motion.div>
          )
        }
        </AnimatePresence>
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
