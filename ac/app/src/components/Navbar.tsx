import { Link, useLocation } from 'react-router-dom';
import { Upload, UserCheck, LayoutGrid, UserCircle2 } from 'lucide-react';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Member } from '@/types';

interface NavbarProps {
  currentMember: Member | null;
  onMemberLogout: () => void;
}

export default function Navbar({
  currentMember,
  onMemberLogout,
}: NavbarProps) {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container px-4 flex justify-between items-center h-16">
        <div>
          <Link to="/" className="text-lg font-semibold text-foreground">Imperial use</Link>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Link to="/gallery">
            <Button
              variant={isActive('/gallery') ? 'default' : 'ghost'}
              size="sm"
              className="nav-link"
            >
              <LayoutGrid className="h-4 w-4 mr-2" />
              浏览作品
            </Button>
          </Link>
          {currentMember ? (
            <Link to="/upload">
              <Button
                variant={isActive('/upload') ? 'default' : 'ghost'}
                size="sm"
                className="nav-link"
              >
                <Upload className="h-4 w-4 mr-2" />
                上传作品
              </Button>
            </Link>
          ) : (
            <Link to="/register">
              <Button
                variant={isActive('/register') ? 'default' : 'ghost'}
                size="sm"
                className="nav-link"
              >
                <UserCheck className="h-4 w-4 mr-2" />
                摄影师注册
              </Button>
            </Link>
          )}
          {currentMember ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 w-9 p-0 outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
                  aria-label="用户菜单"
                >
                  <UserCircle2 className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel className="max-w-[220px]">
                  {currentMember.displayName || currentMember.email.split('@')[0] || currentMember.email}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/member-profile">个人资料</Link>
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={onMemberLogout}>退出登录</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex gap-2">
              <Link to="/member-auth">
                <Button
                  variant="outline"
                  size="sm"
                  className="nav-link"
                >
                  登录
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}