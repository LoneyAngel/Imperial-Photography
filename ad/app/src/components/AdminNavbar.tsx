import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useToken } from '@/context/token';

export default function AdminNavbar() {
  const { logout, role } = useToken();
  const location = useLocation();

  const handleLogout = () => {
    logout();
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-slate-800 text-white px-4 py-3 shadow">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/users" className="font-bold text-lg">
            管理后台
          </Link>
          <Link
            to="/users"
            className={`hover:text-slate-300 ${isActive('/users') ? 'text-white border-b-2 border-white' : 'text-slate-400'}`}
          >
            用户管理
          </Link>
          <Link
            to="/photos"
            className={`hover:text-slate-300 ${isActive('/photos') ? 'text-white border-b-2 border-white' : 'text-slate-400'}`}
          >
            图片管理
          </Link>
          <Link
            to="/notices"
            className={`hover:text-slate-300 ${isActive('/notices') ? 'text-white border-b-2 border-white' : 'text-slate-400'}`}
          >
            通知管理
          </Link>
          {role === 3 && (
            <Link
              to="/admins"
              className={`hover:text-slate-300 ${isActive('/admins') ? 'text-white border-b-2 border-white' : 'text-slate-400'}`}
            >
              管理员管理
            </Link>
          )}
        </div>
        <Button
          variant="outline"
          className="bg-transparent border-white text-white hover:bg-slate-600 hover:text-white"
          size="sm"
          onClick={handleLogout}
        >
          退出登录
        </Button>
      </div>
    </nav>
  );
}