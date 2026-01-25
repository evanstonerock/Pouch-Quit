import { useState, useEffect } from "react";
import { useSettings, useLogs, useAddLog, useDeleteLastLog } from "@/hooks/use-pouch-data";
import { StatsCard } from "@/components/StatsCard";
import { Button } from "@/components/ui/button";
import { Plus, Undo2, Timer, Flame, Trophy, AlertTriangle } from "lucide-react";
import { formatDistanceToNowStrict, differenceInHours, isToday } from "date-fns";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

export default function Dashboard() {
  const { data: settings, isLoading: loadingSettings } = useSettings();
  const { data: logs, isLoading: loadingLogs } = useLogs();
  const { mutate: addLog, isPending: isAdding } = useAddLog();
  const { mutate: undoLog, isPending: isUndoing } = useDeleteLastLog();

  const [timeSince, setTimeSince] = useState<string>("0m");
  const [progress, setProgress] = useState(0);

  // Derived State
  const lastLog = logs?.[0];
  const todayLogs = logs?.filter(log => isToday(new Date(log.timestamp))) || [];
  const pouchesToday = todayLogs.length;
  const baseline = settings?.baselinePouchesPerDay || 8;
  const remaining = Math.max(0, baseline - pouchesToday);
  const overLimit = pouchesToday > baseline;

  // Effects
  useEffect(() => {
    if (!lastLog) return;

    const interval = setInterval(() => {
      const date = new Date(lastLog.timestamp);
      setTimeSince(formatDistanceToNowStrict(date));
      
      // Calculate progress for "Next Hour Challenge" (circular progress logic could go here)
      const diffMinutes = (new Date().getTime() - date.getTime()) / 60000;
      const progressPercent = Math.min(100, (diffMinutes / 60) * 100);
      setProgress(progressPercent);
    }, 1000);

    return () => clearInterval(interval);
  }, [lastLog]);

  // Check milestones
  useEffect(() => {
    if (!lastLog) return;
    const hours = differenceInHours(new Date(), new Date(lastLog.timestamp));
    if (hours > 0 && hours % 24 === 0) {
      // Small celebration for 24h intervals
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
    }
  }, [lastLog]);

  const handleAdd = () => {
    addLog(undefined, {
      onSuccess: () => {
        // Trigger haptic feedback if available
        if (navigator.vibrate) navigator.vibrate(50);
      }
    });
  };

  const getEncouragement = () => {
    if (pouchesToday === 0) return "Clean slate today! Keep it up.";
    if (remaining > 3) return "Doing great, plenty of buffer.";
    if (remaining > 0) return "Steady now, approaching limit.";
    return "Over daily limit. Time to slow down.";
  };

  if (loadingSettings || loadingLogs) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-2xl font-bold mb-4 font-display">Welcome to PouchQuit</h1>
        <p className="text-muted-foreground mb-8">Let's set up your baseline to get started.</p>
        <Link href="/settings">
          <Button size="lg" className="w-full max-w-xs">Get Started</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="pb-24 pt-8 px-4 max-w-md mx-auto min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold font-display text-gradient">Dashboard</h1>
          <p className="text-sm text-muted-foreground">{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Flame className={cn("w-5 h-5", remaining > 0 ? "text-primary" : "text-destructive")} />
        </div>
      </div>

      {/* Main Counter */}
      <section className="mb-8 relative">
        <div className="glass-panel rounded-3xl p-8 text-center border-t border-white/10 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-50" />
          
          <h2 className="text-sm uppercase tracking-widest text-muted-foreground font-semibold mb-2 relative z-10">
            Pouches Today
          </h2>
          
          <div className="text-8xl font-bold font-display text-foreground mb-2 tracking-tighter relative z-10">
            {pouchesToday}
          </div>
          
          <p className={cn("text-sm font-medium relative z-10 flex items-center justify-center gap-2", 
            overLimit ? "text-destructive" : "text-emerald-400"
          )}>
            {overLimit && <AlertTriangle className="w-4 h-4" />}
            {overLimit ? `${pouchesToday - baseline} over limit` : `${remaining} remaining`}
          </p>

          <div className="mt-8 flex gap-4 justify-center relative z-10">
             {pouchesToday > 0 && (
              <Button
                variant="outline"
                size="icon"
                className="h-16 w-16 rounded-2xl border-white/10 hover:bg-white/5"
                onClick={() => undoLog()}
                disabled={isUndoing}
              >
                <Undo2 className="w-6 h-6 text-muted-foreground" />
              </Button>
            )}
            
            <Button
              size="lg"
              className="h-16 px-8 rounded-2xl text-lg font-bold shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-1 transition-all"
              onClick={handleAdd}
              disabled={isAdding}
            >
              <Plus className="w-6 h-6 mr-2" />
              Log Pouch
            </Button>
          </div>
        </div>
      </section>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <StatsCard
          title="Time Since"
          value={lastLog ? timeSince : "N/A"}
          icon={<Timer className="w-4 h-4" />}
          delay={1}
          subtitle="Keep extending it!"
        />
        <StatsCard
          title="Baseline"
          value={baseline}
          subtitle="Daily Target"
          icon={<Trophy className="w-4 h-4" />}
          delay={2}
          className="bg-secondary/30"
        />
      </div>

      {/* Coaching Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 }}
        className="p-6 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 mb-20"
      >
        <h3 className="font-display font-semibold text-lg mb-2 text-indigo-300">Daily Insight</h3>
        <p className="text-muted-foreground leading-relaxed">
          {getEncouragement()} Remember, cravings typically last only 15-20 minutes. Take a walk if you feel the urge.
        </p>
      </motion.div>

    </div>
  );
}
