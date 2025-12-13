import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Briefcase,
  Users,
  Calendar,
  FileText,
  Building2,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  HelpCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { hrManagerApi } from "@/services/hrApi";


const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: Briefcase, label: "Job Postings", path: "/jobs" },
  { icon: Users, label: "Candidates", path: "/candidates" },
  { icon: Calendar, label: "Interview Scheduling", path: "/schedule" },
  { icon: FileText, label: "Offer Letters", path: "/offers" },
  { icon: Building2, label: "Internal Hiring", path: "/internal" },
];

const bottomItems = [
  { icon: Settings, label: "Settings", path: "/settings" },
  { icon: HelpCircle, label: "Help Center", path: "/help" },
];

export const Sidebar = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [currHR, setCurrHr] = useState(null);

  // Handle window resize to reset state
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setIsOpen(false);
      }
    };
    checkMobile();
    fetchCurrHr();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const fetchCurrHr = async() => {
    const data = await hrManagerApi.getCurrentHR();
    setCurrHr(data);
  }
  const handleNavClick = () => {
    if (isMobile) setIsOpen(false);
  };

  const NavItem = ({ item }: { item: typeof menuItems[0] }) => {
    const isActive = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
    
    return (
      <Link
        to={item.path}
        onClick={handleNavClick}
        className={cn(
          "group flex items-center justify-between px-3 py-2.5 rounded-lg mx-3 transition-all duration-200 ease-in-out",
          isActive
            ? "bg-blue-50 text-blue-700 shadow-sm"
            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
        )}
      >
        <div className="flex items-center gap-3">
          <item.icon
            className={cn(
              "h-5 w-5 transition-colors",
              isActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"
            )}
          />
          <span className="font-medium text-sm">{item.label}</span>
        </div>
        {isActive && (
          <ChevronRight className="h-4 w-4 text-blue-600 " />
        )}
      </Link>
    );
  };

  return (
    <>
      {/* Mobile Trigger Button */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 z-40">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">R</span>
          </div>
          <span className="font-bold text-lg text-slate-900">RecruitPro</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle Menu"
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          "fixed md:sticky top-0 left-0 z-50 h-screen w-72 bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 ease-in-out shadow-xl md:shadow-none",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          "md:top-0" // Ensure sticky positioning on desktop
        )}
      >
        {/* Brand Header */}
        <div className="hidden md:flex p-6 border-b border-slate-100 items-center gap-3">
          <div className="h-9 w-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-blue-200 shadow-md">
            <span className="text-white font-bold text-xl">R</span>
          </div>
          <div className="flex flex-col">
            <h1 className="font-bold text-lg text-slate-900 leading-none">RecruitPro</h1>
            <span className="text-xs text-slate-500 mt-1 font-medium">HR Management System</span>
          </div>
        </div>

        {/* Main Navigation */}
        <div className="flex-1 overflow-y-auto py-6 space-y-1 scrollbar-thin scrollbar-thumb-slate-200">
          <div className="px-6 mb-2">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Main Menu
            </p>
          </div>
          <nav className="space-y-0.5">
            {menuItems.map((item) => (
              <NavItem key={item.path} item={item} />
            ))}
          </nav>

          <div className="px-6 mt-8 mb-2">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Support
            </p>
          </div>
          <nav className="space-y-0.5">
            {bottomItems.map((item) => (
              <NavItem key={item.path} item={item} />
            ))}
          </nav>
        </div>

        {/* User Profile & Logout Section */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-white hover:shadow-sm transition-all duration-200 cursor-pointer group">
            <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
              <AvatarImage src="https://github.com/shadcn.png" />
              <AvatarFallback>HR</AvatarFallback>
            </Avatar>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-semibold text-slate-900 truncate">{currHR?.name}</p>
              <p className="text-xs text-slate-500 truncate">{currHR?.role}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all duration-200"
              onClick={() => {
                localStorage.removeItem("authToken");
                window.location.href = "/auth";
              }}
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
};