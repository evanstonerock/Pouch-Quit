import { useMemo } from "react";
import { useSettings, useLogs } from "@/hooks/use-pouch-data";
import { isSameDay, subDays, startOfDay, isAfter, addDays } from "date-fns";
import { PiggyBank, TrendingUp, Coins } from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function Money() {
  const { data: settings } = useSettings();
  const { data: logs } = useLogs();

  if (!settings || !logs) return null;

  // Always treat settings as numbers
  const costPerCan = Number(settings.costPerCan);
  const pouchesPerCan = Number(settings.pouchesPerCan);
  const baseline = Number(settings.baselinePouchesPerDay);

  // Safety
  const safePouchesPerCan = pouchesPerCan > 0 ? pouchesPerCan : 15;
  const safeCostPerCan = costPerCan > 0 ? costPerCan : 6;

  const costPerPouch = safeCostPerCan / safePouchesPerCan; // e.g., 6/15 = 0.40

  // Oldest log timestamp for "all time"
  const oldestLogDate = useMemo(() => {
    if (logs.length === 0) return startOfDay(new Date());
    // Find min timestamp robustly (doesn't assume sort)
    const minTs = logs.reduce((min, l) => {
      const t = new Date(l.timestamp).getTime();
      return t < min ? t : min;
    }, new Date(logs[0].timestamp).getTime());
    return startOfDay(new Date(minTs));
  }, [logs]);

  const countLogsForDay = (day: Date) =>
    logs.filter((l) => isSameDay(new Date(l.timestamp), day)).length;

  const calculateRange = (startDate: Date) => {
    let savedMoney = 0;
    let avoidedPouches = 0;
    let usedPouches = 0;

    let current = startOfDay(startDate);
    const today = startOfDay(new Date());

    while (!isAfter(current, today)) {
      const usedToday = countLogsForDay(current);
      const avoidedToday = Math.max(0, baseline - usedToday);

      usedPouches += usedToday;
      avoidedPouches += avoidedToday;
      savedMoney += avoidedToday * costPerPouch;

      current = addDays(current, 1);
    }

    const spentMoney = usedPouches * costPerPouch;

    // Cans math:
    const cansConsumedDecimal = usedPouches / safePouchesPerCan; // e.g., 22/15 = 1.47 cans
    const cansToBuyCeil = Math.ceil(usedPouches / safePouchesPerCan); // e.g., 16 pouches => 2 cans

    return {
      savedMoney,
      spentMoney,
      avoidedPouches,
      usedPouches,
      cansConsumedDecimal,
      cansToBuyCeil,
    };
  };

  const allTime = calculateRange(oldestLogDate);
  const last7Days = calculateRange(subDays(new Date(), 6));

  // Chart Data (Last 7 Days)
  const chartData = Array.from({ length: 7 }).map((_, i) => {
    const date = subDays(new Date(), 6 - i);
    const used = countLogsForDay(date);
    const spent = used * costPerPouch;
    const saved = Math.max(0, (baseline - used) * costPerPouch);

    return {
      name: date.toLocaleDateString(undefined, { weekday: "short" }),
      spent: Number(spent.toFixed(2)),
      saved: Number(saved.toFixed(2)),
    };
  });

  return (
    <div className="pb-24 pt-8 px-4 max-w-md mx-auto min-h-screen">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-emerald-500/10 rounded-xl">
          <PiggyBank className="w-6 h-6 text-emerald-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold font-display">Money</h1>
          <p className="text-sm text-muted-foreground">
            $ {safeCostPerCan.toFixed(2)} per can • {safePouchesPerCan} pouches • $
            {costPerPouch.toFixed(2)} per pouch
          </p>
        </div>
      </div>

      {/* Hero Stats */}
      <div className="grid gap-4 mb-8">
        <div className="glass-panel p-6 rounded-2xl bg-gradient-to-br from-emerald-900/20 to-transparent border-emerald-500/20">
          <p className="text-sm text-emerald-400 font-medium mb-1">Total Saved (vs baseline)</p>
          <div className="text-4xl font-bold font-display text-white mb-4">
            ${allTime.savedMoney.toFixed(2)}
          </div>
          <div className="flex flex-col gap-2 text-sm text-muted-foreground bg-black/20 p-3 rounded-lg">
            <div className="flex items-center gap-2">
              <Coins className="w-4 h-4 text-yellow-500" />
              <span>{allTime.avoidedPouches} pouches avoided</span>
            </div>
            <div>Spent (from logs): ${allTime.spentMoney.toFixed(2)}</div>
            <div>
              Cans used (est): {allTime.cansConsumedDecimal.toFixed(2)} • Cans to buy:{" "}
              {allTime.usedPouches === 0 ? 0 : allTime.cansToBuyCeil}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-card p-4 rounded-xl border border-border">
            <p className="text-xs text-muted-foreground mb-1">7 Day Saved</p>
            <p className="text-xl font-bold text-emerald-400">${last7Days.savedMoney.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Spent: ${last7Days.spentMoney.toFixed(2)}
            </p>
          </div>

          <div className="bg-card p-4 rounded-xl border border-border">
            <p className="text-xs text-muted-foreground mb-1">7 Day Cans</p>
            <p className="text-xl font-bold">
              {last7Days.cansConsumedDecimal.toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Buy: {last7Days.usedPouches === 0 ? 0 : last7Days.cansToBuyCeil}
            </p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-card/50 border border-white/5 rounded-2xl p-4 mb-8">
        <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          Last 7 Days (Saved vs Spent)
        </h3>
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorSaved" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#34d399" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorSpent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
              <XAxis dataKey="name" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis
                stroke="#666"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `$${val}`}
              />
              <Tooltip
                contentStyle={{ backgroundColor: "#1e293b", border: "none", borderRadius: "8px" }}
                itemStyle={{ color: "#fff" }}
              />
              <Area type="monotone" dataKey="saved" stroke="#34d399" fillOpacity={1} fill="url(#colorSaved)" />
              <Area type="monotone" dataKey="spent" stroke="#ef4444" fillOpacity={1} fill="url(#colorSpent)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
