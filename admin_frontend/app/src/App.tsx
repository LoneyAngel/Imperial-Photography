import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { TokenProvider, useToken } from './context/token';
import { AdminFunctionProvider } from './context/function';
import AdminLogin from './sections/AdminLogin';
import UserManage from './sections/UserManage';
import PhotoManage from './sections/PhotoManage';
import AdminManage from './sections/AdminManage';
import NoticeManage from './sections/NoticeManage';
import AdminNavbar from './components/AdminNavbar';
import { Toaster } from 'react-hot-toast';

function AppRoutes() {
  const { auth_token, role, isLoading } = useToken();
  const isAuthenticated = auth_token !== null;
  const isSuperAdmin = role === 3;

  // 初始化加载时显示加载指示器
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-500">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        {isAuthenticated && <AdminNavbar />}
        <main className="container mx-auto px-4 py-6">
          <Routes>
            <Route
              path="/login"
              element={isAuthenticated ? <Navigate to="/users" replace /> : <AdminLogin />}
            />
            <Route
              path="/users"
              element={isAuthenticated ? <UserManage /> : <Navigate to="/login" replace />}
            />
            <Route
              path="/photos"
              element={isAuthenticated ? <PhotoManage /> : <Navigate to="/login" replace />}
            />
            <Route
              path="/notices"
              element={isAuthenticated ? <NoticeManage /> : <Navigate to="/login" replace />}
            />
            <Route
              path="/admins"
              element={isSuperAdmin ? <AdminManage /> : <Navigate to="/users" replace />}
            />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

function App() {
  return (
    <TokenProvider>
      <AdminFunctionProvider>
        <Toaster position="top-center" reverseOrder={false} />
        <AppRoutes />
      </AdminFunctionProvider>
    </TokenProvider>
  );
}

export default App;