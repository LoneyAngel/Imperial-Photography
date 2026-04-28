import { Link, useLocation } from 'react-router-dom';
import { Upload, LayoutGrid } from 'lucide-react';
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
  const { user } = useUser();
  const { logout } = useToken();

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-30">
      <div className="container px-4 flex justify-between items-center h-16">
        <div>
          <Link to="/" className="text-lg font-semibold text-foreground">
            Imperial
          </Link>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Link to="/gallery">
            <Button
              variant="ghost"
              size="sm"
              className={`nav-link nav-link-underline hover:bg-inherit hover:text-black relative ${isActive('/gallery') ? 'shadow-[0_2px_0_0_rgba(0,0,0,1)]' : ''}`}
            >
              <LayoutGrid className="h-4 w-4 mr-2" />
              浏览作品
            </Button>
          </Link>
          {user && (
            <Link to="/upload">
              <Button
                variant="ghost"
                size="sm"
                className={`nav-link nav-link-underline hover:bg-inherit hover:text-black relative ${isActive('/upload') ? 'shadow-[0_2px_0_0_rgba(0,0,0,1)]' : ''}`}
              >
                <Upload className="h-4 w-4 mr-2" />
                上传作品
              </Button>
            </Link>
          )}
          {user ? (
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 w-9 p-0 outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
                  aria-label="用户菜单"
                >
                  <img
                    src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${user?.id || user.email.split('@')[0] || 'user'}`}
                    alt={user.name}
                    className="transition-transform duration-300 hover:[transform:rotate(360deg)]"
                  />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel className="max-w-[220px] text-muted-foreground font-normal">
                  {user.name || user.email.split('@')[0] || user.email}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/member-profile">
                    <svg
                      className="h-4 w-4 mr-2 shrink-0 transition-transform duration-300 hover:[transform:rotate(360deg)]"
                      viewBox="0 0 1024 1024"
                      version="1.1"
                      xmlns="http://www.w3.org/2000/svg"
                      p-id="18416"
                      width="200"
                      height="200"
                    >
                      <path
                        d="M579.5 564.5m-336.5 0a336.5 336.5 0 1 0 673 0 336.5 336.5 0 1 0-673 0Z"
                        fill="#C1E6DE"
                        p-id="18417"
                      ></path>
                      <path
                        d="M463.5 709C293.672 709 156 571.328 156 401.5S293.672 94 463.5 94 771 231.672 771 401.5 633.328 709 463.5 709z m0-81.226c124.967 0 226.274-101.307 226.274-226.274S588.467 175.226 463.5 175.226 237.226 276.533 237.226 401.5 338.533 627.774 463.5 627.774zM163.985 926.97c-20.773 8.5-44.485-1.494-52.963-22.323-8.477-20.83 1.49-44.606 22.262-53.106C241.574 807.226 351.52 785 462.854 785c111.193 0 223.044 22.167 335.344 66.333 20.887 8.215 31.178 31.852 22.986 52.795-8.192 20.944-31.765 31.263-52.652 23.049-103.051-40.529-204.874-60.709-305.678-60.709-100.661 0-200.197 20.122-298.87 60.501z"
                        fill="#0A0B0C"
                        p-id="18418"
                      ></path>
                    </svg>
                    个人资料
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/notice" className="flex items-center">
                    <svg
                      className="h-4 w-4 mr-2 shrink-0 transition-transform duration-300 hover:[transform:rotate(360deg)]"
                      viewBox="0 0 1024 1024"
                      version="1.1"
                      xmlns="http://www.w3.org/2000/svg"
                      p-id="16570"
                      width="200"
                      height="200"
                    >
                      <path
                        d="M704.064 637.44h-1.856a30.016 30.016 0 1 1 0-60.032h1.92c54.016 0 98.048-44.032 98.048-98.112S758.144 381.184 704 381.184h-1.856a30.016 30.016 0 1 1 0-59.968h1.92a158.272 158.272 0 0 1 158.08 158.08 158.272 158.272 0 0 1-158.08 158.08z"
                        fill="#FF1F49"
                        p-id="16571"
                      ></path>
                      <path
                        d="M352.256 637.44H137.984c-38.592 0-70.016-31.424-70.016-70.08V391.232c0-38.592 31.424-70.016 70.016-70.016h214.272a30.016 30.016 0 1 1 0 59.968H137.984A10.048 10.048 0 0 0 128 391.232v176.128c0 5.568 4.48 10.048 9.984 10.048h214.272a30.016 30.016 0 1 1 0 59.968z"
                        fill="#9FA8B5"
                        p-id="16572"
                      ></path>
                      <path
                        d="M662.08 877.44c-15.744 0-31.296-5.44-44.16-15.872l-284.608-232.32a30.016 30.016 0 0 1 37.888-46.464l284.672 232.32a9.6 9.6 0 0 0 10.624 1.28 9.6 9.6 0 0 0 5.76-9.088V149.888a9.6 9.6 0 0 0-5.76-8.96 9.6 9.6 0 0 0-10.624 1.28L371.2 374.4a30.016 30.016 0 0 1-37.888-46.528l284.608-232.256c21.12-17.28 49.664-20.736 74.24-8.96 24.704 11.648 40.064 35.84 40.064 63.168v657.408c0 27.328-15.36 51.52-40 63.232a70.208 70.208 0 0 1-30.144 6.912z"
                        fill="#9FA8B5"
                        p-id="16573"
                      ></path>
                      <path
                        d="M366.464 925.632H321.92c-32.896 0-60.928-22.4-68.224-54.4l-58.752-257.152a30.016 30.016 0 0 1 58.432-13.44l58.752 257.28c1.024 4.48 5.12 7.68 9.792 7.68h44.48a9.856 9.856 0 0 0 7.808-3.712 9.856 9.856 0 0 0 1.92-8.448l-53.248-239.552a30.016 30.016 0 1 1 58.56-12.992l53.248 239.552c4.672 20.864-0.384 42.368-13.696 59.008-13.376 16.64-33.28 26.24-54.592 26.24z"
                        fill="#9FA8B5"
                        p-id="16574"
                      ></path>
                      <path
                        d="M352.256 637.44a30.016 30.016 0 0 1-30.016-30.08V351.232a30.016 30.016 0 1 1 60.032 0V607.36c0 16.64-13.44 30.08-30.08 30.08z"
                        fill="#9FA8B5"
                        p-id="16575"
                      ></path>
                      <path
                        d="M866.88 253.376a30.016 30.016 0 0 1-21.12-51.328l32.32-32.064a30.016 30.016 0 0 1 42.24 42.624l-32.32 32.064a29.888 29.888 0 0 1-21.12 8.704z m32.32 543.936a29.888 29.888 0 0 1-21.12-8.704l-32.32-32.064a30.016 30.016 0 1 1 42.24-42.624l32.32 32.064a30.016 30.016 0 0 1-21.12 51.328z m61.312-287.68h-32.32a30.016 30.016 0 1 1 0-59.968h32.32a30.016 30.016 0 1 1 0 59.968z"
                        fill="#FF9668"
                        p-id="16576"
                      ></path>
                    </svg>
                    消息
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/card" className="flex items-center">
                    <svg
                      className="h-4 w-4 mr-2 shrink-0 transition-transform duration-300 hover:[transform:rotate(360deg)]"
                      viewBox="0 0 1024 1024"
                      version="1.1"
                      xmlns="http://www.w3.org/2000/svg"
                      p-id="5069"
                      width="200"
                      height="200"
                    >
                      <path
                        d="M257.173 722.61l-44.777 77.556 66.108-0.019a32 32 0 0 1 28.43 17.295l0.226 0.444 22.494 45.184 42.7-73.96 55.426 32-72.5 125.574c-12.632 21.88-44.345 21.123-56.012-1.06l-0.348-0.68-40.22-80.792-101.73 0.032c-24.392 0.007-39.733-26.132-28.084-47.358l0.361-0.642 72.5-125.574 55.426 32zM766.827 722.61l44.777 77.556-66.108-0.019a32 32 0 0 0-28.43 17.295l-0.226 0.444-22.494 45.184-42.7-73.96-55.426 32 72.5 125.574c12.632 21.88 44.345 21.123 56.012-1.06l0.348-0.68 40.22-80.792 101.73 0.032c24.392 0.007 39.733-26.132 28.084-47.358l-0.361-0.642-72.5-125.574-55.426 32z"
                        fill="#397AFF"
                        p-id="5070"
                      ></path>
                      <path
                        d="M496 64.287l-336.018 194a32 32 0 0 0-16 27.713v388a32 32 0 0 0 16 27.713l336.018 194a32 32 0 0 0 32 0l336.018-194a32 32 0 0 0 16-27.713V286a32 32 0 0 0-16-27.713L528 64.287a32 32 0 0 0-32 0z m16 64.663l304.017 175.524v351.051L512 831.049 207.982 655.525V304.474L512 128.95z"
                        fill="#3F454B"
                        p-id="5071"
                      ></path>
                      <path
                        d="M437.615 359.428l-103.284 15.009-0.783 0.123c-25.671 4.335-35.755 36.131-16.952 54.46l74.736 72.849-17.642 102.867-0.125 0.783c-3.81 25.754 23.314 45.17 46.555 32.95l92.38-48.567 92.38 48.568 0.705 0.36c23.317 11.583 50.164-8.214 45.725-34.094L633.667 501.87l74.737-72.85 0.561-0.56c18.22-18.595 7.689-50.246-18.296-54.022l-103.285-15.009-46.188-93.59c-11.738-23.784-45.654-23.784-57.392 0l-46.189 93.59z m74.885-7.122l24.94 50.533 0.218 0.434a32 32 0 0 0 23.876 17.072l55.767 8.102-40.353 39.336-0.357 0.353a32 32 0 0 0-8.847 27.971l9.526 55.542-49.88-26.223-0.459-0.237a32 32 0 0 0-29.322 0.237l-49.88 26.223 9.527-55.542 0.08-0.494a32 32 0 0 0-9.284-27.83l-40.354-39.336 55.768-8.102a32 32 0 0 0 24.094-17.506l24.94-50.533z"
                        fill="#397AFF"
                        p-id="5072"
                      ></path>
                    </svg>
                    成就
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => void logout()}>退出登录</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex gap-2">
              <Link to="/member-auth">
                <Button variant="outline" size="sm" className="nav-link">
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
