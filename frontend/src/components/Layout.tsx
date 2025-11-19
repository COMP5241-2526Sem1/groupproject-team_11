import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Mail, Menu, X, LogOut } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { getUserProfile, userLogout, type UserInfo } from "@/services/api";

// 自定义书本图标组件
const BookIcon = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 1024 1024" 
    className={className}
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M940.8 166.4v179.2h32c19.2 0 38.4 19.2 38.4 38.4s-19.2 38.4-38.4 38.4h-96c32 51.2 32 121.6 0 179.2h96c19.2 0 38.4 19.2 38.4 38.4s-19.2 38.4-38.4 38.4h-32v179.2h32c19.2 0 38.4 19.2 38.4 38.4s-19.2 38.4-38.4 38.4H281.6c-128 0-198.4-153.6-134.4-256H51.2c-19.2 0-38.4-19.2-38.4-38.4s19.2-38.4 38.4-38.4h32V422.4H51.2C32 422.4 12.8 403.2 12.8 384s19.2-38.4 38.4-38.4h96c-64-102.4 6.4-256 134.4-256h691.2c19.2 0 38.4 19.2 38.4 38.4s-19.2 38.4-38.4 38.4h-32z m-198.4 256H128v179.2h614.4c19.2 0 44.8-12.8 57.6-25.6 32-38.4 32-96 0-128-19.2-12.8-38.4-25.6-57.6-25.6z m153.6 256H281.6c-19.2 0-44.8 12.8-57.6 25.6-51.2 51.2-19.2 153.6 57.6 153.6H896v-179.2z m0-332.8V166.4H281.6c-76.8 0-102.4 102.4-57.6 153.6 12.8 12.8 32 25.6 57.6 25.6H896z" />
  </svg>
);

interface LayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { name: "Homepage", path: "/" },
  { name: "Courses", path: "/courses" },
  { name: "Activities", path: "/activities" },
  { name: "Discussion", path: "/discussion" },
  { name: "Tools", path: "/tools" },
  { name: "AI Assistant", path: "/ai-assistant" },
];

export const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo>({
    id: "guest",
    name: "Guest User",
    email: "guest@example.com"
  });
  const userMenuRef = useRef<HTMLDivElement>(null);

  // 加载用户信息
  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const profile = await getUserProfile();
        setUserInfo(profile);
      } catch (error) {
        console.error("Failed to load user profile:", error);
        // 保持默认的 Guest User 信息
      }
    };
    
    loadUserProfile();
  }, []);

  // 检测屏幕尺寸 - 只在首次加载和实际尺寸变化时执行
  useEffect(() => {
    // 首次加载时设置初始状态
    const initialMobile = window.innerWidth < 768;
    setIsMobile(initialMobile);
    setIsSidebarOpen(!initialMobile);

    let previousMobile = initialMobile;

    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      
      // 只在移动/桌面状态真正切换时自动调整侧边栏
      if (previousMobile !== mobile) {
        setIsMobile(mobile);
        setIsSidebarOpen(!mobile);
        previousMobile = mobile;
      }
    };

    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []); // 空依赖数组，只在首次加载时运行

  // 点击外部关闭用户菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUserMenuOpen]);

  // 移动端点击导航项后自动关闭侧边栏
  const handleNavClick = () => {
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  };

  // 处理登出
  const handleLogout = async () => {
    try {
      await userLogout();
      // 清除本地存储
      localStorage.clear();
      sessionStorage.clear();
      // 跳转到登录页
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout failed:', error);
      setIsUserMenuOpen(false);
    }
  };
  return (
    <div className="flex min-h-screen relative">
      {/* Overlay for mobile */}
      {isMobile && isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    
      {/* Sidebar */}
      <aside 
        className={cn(
          "bg-sidebar text-sidebar-foreground flex flex-col transition-all duration-300 ease-in-out z-50 shadow-lg",
          isMobile ? "fixed left-0 top-0 h-full" : "relative",
          isSidebarOpen ? "w-40" : isMobile ? "-translate-x-full w-40" : "w-0 overflow-hidden"
        )}
      >
        <div className="p-4 border-b-2 border-sidebar-foreground/30 flex items-center justify-center gap-3 relative">
          <div className="flex items-center gap-2">
            <BookIcon className="h-10 w-10 text-white" />
            <div className="flex flex-col leading-tight">
              <span className={cn("text-base font-bold transition-opacity", isSidebarOpen ? "opacity-100" : "opacity-0")}>
                Teaching
              </span>
              <span className={cn("text-base font-bold transition-opacity", isSidebarOpen ? "opacity-100" : "opacity-0")}>
                Platform
              </span>
            </div>
          </div>
          {isMobile && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarOpen(false)}
              className="text-sidebar-foreground hover:bg-sidebar-active absolute top-2 right-2"
            >
              <X className="h-5 w-5" />
            </Button>
          )}

        </div>
        <nav className="flex-1 py-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={handleNavClick}
              className={cn(
                "block px-4 py-3 text-sm font-medium transition-colors",
                location.pathname === item.path
                  ? "bg-sidebar-active border-l-4 border-sidebar-foreground"
                  : "hover:bg-sidebar-active/50"
              )}
            >
              {item.name}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="text-sidebar-foreground p-4 flex justify-between items-center shadow-md" style={{ backgroundColor: 'hsl(355 60% 40%)' }}>
          {/* Left side - Menu toggle button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="text-sidebar-foreground hover:bg-sidebar-active"
            title={isSidebarOpen ? "Hide Sidebar" : "Show Sidebar"}
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Right side - User actions */}
          <div className="flex items-center gap-3">
            <div className="relative" ref={userMenuRef}>
              <div 
                className="cursor-pointer"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              >
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-white text-sidebar border-2 border-sidebar-foreground font-semibold">
                    U
                  </AvatarFallback>
                </Avatar>
              </div>

              {/* User Menu Dropdown */}
              {isUserMenuOpen && (
                <div className="absolute right-0 top-12 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                  <div className="px-4 py-3 border-b border-gray-200">
                    <p className="text-sm font-semibold text-gray-900">{userInfo.name}</p>
                    <p className="text-xs text-gray-500 mt-1">ID: {userInfo.id}</p>
                    <p className="text-xs text-gray-500 mt-1">{userInfo.email}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              )}
            </div>
            <div 
              className="cursor-pointer hover:opacity-80 transition-opacity" 
              onClick={() => window.open('https://outlook.office.com/mail/', '_blank')}
              title="Open Outlook Mail"
            >
              <Mail className="h-5 w-5" />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 bg-background overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
