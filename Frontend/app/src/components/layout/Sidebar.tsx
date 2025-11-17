import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
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
} from "lucide-react";
import { cn } from "@/lib/utils";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: Briefcase, label: "Job Postings", path: "/jobs" },
  { icon: Users, label: "Candidates", path: "/candidates" },
  { icon: Calendar, label: "Interview Scheduling", path: "/schedule" },
  { icon: FileText, label: "Offer Letters", path: "/offers" },
  { icon: Building2, label: "Internal Hiring", path: "/internal" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

export const Sidebar = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const handleNavClick = () => {
    // Close sidebar on mobile after clicking a link
    if (window.innerWidth < 768) {
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed md:hidden top-4 left-4 z-50 p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors duration-200 shadow-lg"
        aria-label="Toggle menu"
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <Menu className="h-6 w-6" />
        )}
      </button>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed md:relative w-64 min-h-screen bg-gradient-to-b from-sidebar via-sidebar to-sidebar/95 border-r border-sidebar-border flex flex-col transition-all duration-300 ease-in-out z-40",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="p-6 border-b border-sidebar-border/50 bg-gradient-to-r from-primary/10 to-transparent">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
              <span className="text-lg font-bold text-white">RP</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-primary">RecruitPro</h1>
              <p className="text-xs text-muted-foreground">Smart Hiring</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={handleNavClick}
                className={cn(
                  "group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 relative",
                  isActive
                    ? "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/30 scale-105"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-foreground"
                )}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-primary-foreground to-transparent rounded-r-full" />
                )}
                <item.icon className={cn(
                  "h-5 w-5 transition-all duration-200",
                  isActive ? "scale-110" : "group-hover:scale-110"
                )} />
                <span className="font-semibold text-sm flex-1">{item.label}</span>
                {isActive && (
                  <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-sidebar-border/50 bg-gradient-to-t from-sidebar/50 to-transparent space-y-2">
          <button
            onClick={() => {
              localStorage.removeItem("authToken");
              localStorage.removeItem("auth_token");
              window.location.href = "/auth";
            }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sidebar-foreground hover:bg-destructive/10 hover:text-destructive w-full transition-all duration-200 group"
          >
            <LogOut className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" />
            <span className="font-semibold text-sm">Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};
