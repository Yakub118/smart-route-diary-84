import { Link, useLocation } from "react-router-dom";
import { Home, Plus, History, BarChart3, User } from "lucide-react";
import { cn } from "@/lib/utils";

const BottomNavigation = () => {
  const location = useLocation();

  const navItems = [
    { icon: Home, label: "Home", path: "/" },
    { icon: History, label: "History", path: "/history" },
    { icon: Plus, label: "Add Trip", path: "/add-trip", isAccent: true },
    { icon: BarChart3, label: "Stats", path: "/stats" },
    { icon: User, label: "Profile", path: "/profile" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-medium z-50">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all",
                item.isAccent && "relative"
              )}
            >
              {item.isAccent ? (
                <div className="absolute -top-6 bg-gradient-ocean p-3 rounded-full shadow-glow">
                  <Icon className="h-6 w-6 text-white" />
                </div>
              ) : (
                <>
                  <Icon
                    className={cn(
                      "h-5 w-5 transition-colors",
                      isActive ? "text-primary" : "text-muted-foreground"
                    )}
                  />
                  <span
                    className={cn(
                      "text-xs transition-colors",
                      isActive ? "text-primary font-medium" : "text-muted-foreground"
                    )}
                  >
                    {item.label}
                  </span>
                </>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNavigation;