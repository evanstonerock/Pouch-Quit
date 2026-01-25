import { Link, useLocation } from "wouter";
import { LayoutDashboard, Wallet, History, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

export function Navigation() {
  const [location] = useLocation();

  const navItems = [
    { href: "/", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/money", icon: Wallet, label: "Money" },
    { href: "/history", icon: History, label: "Log" },
    { href: "/settings", icon: Settings, label: "Settings" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-t border-white/5 safe-bottom">
      <div className="max-w-md mx-auto px-4 h-16 flex items-center justify-between">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = location === href;
          return (
            <Link key={href} href={href}>
              <div
                className={cn(
                  "flex flex-col items-center justify-center w-16 py-1 cursor-pointer transition-colors duration-200",
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon
                  className={cn(
                    "w-6 h-6 mb-1 transition-transform duration-200",
                    isActive && "scale-110"
                  )}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span className="text-[10px] font-medium tracking-wide">
                  {label}
                </span>
                {isActive && (
                  <span className="absolute bottom-1 w-1 h-1 bg-primary rounded-full shadow-[0_0_8px_rgba(56,189,248,0.8)]" />
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
