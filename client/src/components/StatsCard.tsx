import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface StatsCardProps {
  title: string;
  value: string | number | ReactNode;
  subtitle?: string;
  icon?: ReactNode;
  className?: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  delay?: number;
}

export function StatsCard({ 
  title, 
  value, 
  subtitle, 
  icon, 
  className,
  trend,
  trendValue,
  delay = 0 
}: StatsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: delay * 0.1 }}
      className={cn(
        "glass-panel rounded-2xl p-5 relative overflow-hidden",
        className
      )}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        {icon && <div className="text-primary/80">{icon}</div>}
      </div>
      
      <div className="flex items-baseline gap-2">
        <div className="text-2xl font-bold font-display tracking-tight text-foreground">
          {value}
        </div>
        {trendValue && (
          <div className={cn(
            "text-xs font-medium px-1.5 py-0.5 rounded-full bg-opacity-10",
            trend === "down" ? "text-emerald-400 bg-emerald-400" : 
            trend === "up" ? "text-rose-400 bg-rose-400" : 
            "text-muted-foreground bg-muted"
          )}>
            {trendValue}
          </div>
        )}
      </div>
      
      {subtitle && (
        <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
      )}

      {/* Decorative gradient blob */}
      <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
    </motion.div>
  );
}
