import { useState, useEffect, useMemo } from "react";
import { useSettings, useLogs, useAddLog, useDeleteLog } from "@/hooks/use-pouch-data";
import { StatsCard } from "@/components/StatsCard";
import { Button } from "@/components/ui/button";
import { Plus, Timer, Flame, AlertTriangle, Minus, TrendingDown } from "lucide-react";
import {
  formatDistanceToNowStrict,
  differenceInHours,
  isToday,
  isSameDay,
  subDays,
} from "date-fns";
import confetti from "canvas-confetti";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

export default function Dashboard() {
  const { data: settings, isLoading: loadingSettings } = useSettings();
  const { data: logs, isLoading: loadingLogs } = useLogs();
  const { mutate: addLog, isPending: isAdding } = useAddLog();
  const { mutate: deleteLog, isPending: isDeleting } = useDeleteLog();

  const [timeSince, setTimeSince] = useState<string>("N/A");

  // Quotes (non-annoying, no notifications)
  const quotes = useMemo(
    () => [
      "Cravings peak and fade—delay 10 minutes first.",
      "You don’t need to win today. Just win this hour.",
      "Drink water, move a little, wait it out.",
      "Progress isn’t perfect. It’s consistent.",
      "If you slip, log it and get right back on track.",
      "Make the next decision the good one.",
      "Urges are temporary. Habits are built.",
    ],
    []
  );

  const quoteOfTheDay = useMemo(() => {
    const d = new Date();
    const seed = Number(`${d.getFullYear()}${d.getMonth() + 1}${d.getDate()}`);
    return quotes[seed % quotes.length];
  }, [quotes]);

  // Derived State
  const lastLog = logs?.[0];

  const todayLogs = useMemo(() => {
    return logs?.filter((log) => isToday(new Date(log.timestamp))) || [];
  }, [logs]);

  const pouchesToday = todayLogs.length;
  const baseline = settings?.baselinePouchesPerDay || 8;
  const remaining = Math.max(0, baseline - pouchesToday);
  const overLimit = pouchesToday > baseline;

  // Yesterday + 7-day average
  const yesterdayCount = useMemo(() => {
    if (!logs) return 0;
    const y = subDays(new Date(), 1);
    return logs.filter((l) => isSameDay(new Date(l.timestamp), y)).length;
  }, [logs]);

  const avg7 = useMemo(() => {
    if (!logs) return 0;
    let total = 0;
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const d = subDays(today, i);
      total += logs.filter((l) => isSameDay(new Date(l.timestamp), d)).length;
    }
    return total / 7;
  }, [logs]);

  // Effects
  useEffect(() => {
    if (!lastLog) {
      setTimeSince("N/A");
      return;
    }

    const interval = setInterval(() => {
      const date = new Date(lastLog.timestamp);
      setTimeSince(formatDistanceToNowStrict(date));
    }, 1000);

    return () => clearInterval(interval);
  }, [lastLog]);

  // Milestones
  useEffect(() => {
    if (!lastLog) return;
    const hours = differenceInHours(new Date(), new Date(lastLog.timestamp));
    if (hours > 0 && hours % 24 === 0) {
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
    }
  }, [lastLog]);

  const handleAdd = () => {
    addLog(undefined, {
      onSuccess: () => {
        if (navigator.vibrate) navigator.vibrate(50);
      },
    });
  };

  // Subtract TODAY
  const handleSubtractToday = () => {
    if (todayLogs.length === 0) return;

    const newestToday = todayLogs[0] as any;
    const id = newestToday.id as number | undefined;

    if (typeof id !== "number") {
      console.error("Subtract failed: log has no numeric id", newestToday);
      return;
    }

    deleteLog(id, {
      onSuccess: () => {
        if (navigator.vibrate) navigator.vibrate(30);
      },
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
          <Button size="lg" className="w-full max-w-xs">
            Get Started
          </Button>
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
          <p className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString(undefined, {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Flame className={cn("w-5 h-5", remaining > 0 ? "text-primary" : "text-destructive")} />
        </div>
      </div>

      {/* Counter */}
      <section className="mb-8">
        <div className="glass-panel rounded-3xl p-8 text-center border-t border-white/10">
          <h2 className="text-sm uppercase tracking-widest text-muted-foreground font-semibold mb-2">
            Pouches Today
          </h2>

          <div className="text-8xl font-bold font-display mb-2">{pouchesToday}</div>

          <p
            className={cn(
              "text-sm font-medium flex justify-center gap-2",
              overLimit ? "text-destructive" : "text-emerald-400"
            )}
          >
            {overLimit && <AlertTriangle className="w-4 h-4" />}
            {overLimit ? `${pouchesToday - baseline} over limit` : `${remaining} remaining`}
          </p>

          <div className="mt-8 flex gap-4 justify-center">
            <Button
              variant="outline"
              size="icon"
              className="h-16 w-16 rounded-2xl"
              onClick={handleSubtractToday}
              disabled={pouchesToday === 0 || isDeleting}
              title="Subtract one (today)"
            >
              <Minus className="w-6 h-6" />
            </Button>

            <Button
              size="lg"
              className="h-16 px-8 rounded-2xl text-lg font-bold"
              onClick={handleAdd}
              disabled={isAdding}
            >
              <Plus className="w-6 h-6 mr-2" />
              Log Pouch
            </Button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <StatsCard
          title="Time Since"
          value={lastLog ? timeSince : "N/A"}
          icon={<Timer className="w-4 h-4" />}
          subtitle="Keep extending it"
        />
        <StatsCard
          title="Yesterday"
          value={String(yesterdayCount)}
          subtitle={`7-day avg: ${avg7.toFixed(1)}`}
          icon={<TrendingDown className="w-4 h-4" />}
        />
      </div>

      {/* Insight */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="p-6 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border mb-4"
      >
        <h3 className="font-semibold text-lg mb-2">Daily Insight</h3>
        <p className="text-muted-foreground">{getEncouragement()} Delay cravings — they pass.</p>
      </motion.div>

      {/* Quote BELOW Daily Insight */}
      <div className="p-5 rounded-2xl bg-card/50 border border-white/5 mb-20">
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
          Quote of the day
        </p>
        <p className="text-sm leading-relaxed">{quoteOfTheDay}</p>
      </div>
    </div>
  );
}
