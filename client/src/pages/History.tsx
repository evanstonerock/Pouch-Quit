import { useLogs, useDeleteLog } from "@/hooks/use-pouch-data";
import { format, isToday, isYesterday } from "date-fns";
import { Trash2, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function History() {
  const { data: logs, isLoading } = useLogs();
  const { mutate: deleteLog } = useDeleteLog();

  if (isLoading) return null;

  // Group logs by date
  const groupedLogs = logs?.reduce((acc, log) => {
    const dateKey = format(new Date(log.timestamp), 'yyyy-MM-dd');
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(log);
    return acc;
  }, {} as Record<string, typeof logs>);

  const sortedDates = Object.keys(groupedLogs || {}).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );

  return (
    <div className="pb-24 pt-8 px-4 max-w-md mx-auto min-h-screen">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-blue-500/10 rounded-xl">
          <CalendarDays className="w-6 h-6 text-blue-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold font-display">History</h1>
          <p className="text-sm text-muted-foreground">Detailed log of every pouch</p>
        </div>
      </div>

      <div className="space-y-6">
        {sortedDates.map((dateKey) => {
          const dayLogs = groupedLogs?.[dateKey];
          const dateObj = new Date(dateKey);
          
          let dateTitle = format(dateObj, 'EEEE, MMMM do');
          if (isToday(dateObj)) dateTitle = "Today";
          if (isYesterday(dateObj)) dateTitle = "Yesterday";

          return (
            <div key={dateKey} className="animate-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-between items-baseline mb-3 sticky top-0 bg-background/95 backdrop-blur py-2 z-10">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{dateTitle}</h2>
                <span className="text-xs text-muted-foreground/50 bg-secondary px-2 py-0.5 rounded-full">{dayLogs?.length} pouches</span>
              </div>
              
              <div className="space-y-2">
                {dayLogs?.map((log) => (
                  <div 
                    key={log.id} 
                    className="flex justify-between items-center p-4 bg-card rounded-xl border border-white/5 hover:border-white/10 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-primary/50" />
                      <span className="font-mono text-lg">{format(new Date(log.timestamp), 'h:mm a')}</span>
                    </div>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-card border-white/10">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Log?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will remove the entry from your history and stats.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => deleteLog(log.id)}
                            className="bg-destructive hover:bg-destructive/90 text-white"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {(!logs || logs.length === 0) && (
          <div className="text-center py-20 text-muted-foreground">
            No history yet. Start tracking on the Dashboard!
          </div>
        )}
      </div>
    </div>
  );
}
