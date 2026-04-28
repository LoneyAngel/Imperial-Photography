import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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
import { TokenProvider } from './context/token';
import { FunctionProvider } from './context/function';
import Notice from './sections/Notice';
import MemberPublicProfile from './sections/MemberPublicProfile';
import ErrorBoundary from './components/ErrorBoundary';
import { Toaster } from 'react-hot-toast';
import LittleNavbar from './components/LittleNavbar';
import AchievementPage from './sections/Postcard';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
    },
  },
});

function AppContent() {
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
              <AppContent />
            </UserProvider>
          </FunctionProvider>
        </TokenProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
