import { Link, useLocation } from 'react-router-dom';
import { Upload, LayoutGrid, UserCircle2 } from 'lucide-react';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { useUser } from '@/context/user';
import { useToken } from '@/context/token';

export default function Navbar() {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;
  const { user} = useUser();
  const { logout } = useToken();

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-30">
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
          {user && (
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
          )}
          {user ? (
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
                  {user.name || user.email.split('@')[0] || user.email}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/member-profile">个人资料</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild >
                  <Link to="/notice" className="flex items-center">
                    <svg className="h-4 w-4 mr-2 shrink-0" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
                      <path d="M283.648 369.408h451.2768a32.0512 32.0512 0 1 0 0-64.0512H283.648a32.0512 32.0512 0 1 0 0 64.0512zM654.1312 534.8352a32.0512 32.0512 0 0 0-32.0512-32.0512H283.648a32.0512 32.0512 0 1 0 0 64.0512h338.432a32.0512 32.0512 0 0 0 32.0512-32z" fill="currentColor"/>
                      <path d="M819.5072 100.864H199.0656A88.576 88.576 0 0 0 110.592 189.44v535.7568a88.576 88.576 0 0 0 88.4736 88.4224h50.688v111.3088l200.448-111.3088h369.3056a88.576 88.576 0 0 0 88.4736-88.4224V189.44a88.576 88.576 0 0 0-88.4736-88.576zM313.856 816.0256v-6.2464a60.3136 60.3136 0 0 0-60.2624-60.2112H199.0656a24.3712 24.3712 0 0 1-24.3712-24.3712V189.44a24.3712 24.3712 0 0 1 24.3712-24.3712h620.4416a24.3712 24.3712 0 0 1 24.3712 24.3712v535.7568a24.3712 24.3712 0 0 1-24.3712 24.3712H449.2288a60.3136 60.3136 0 0 0-29.3888 7.5776z" fill="currentColor"/>
                    </svg>
                    消息
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={logout}>退出登录</DropdownMenuItem>
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