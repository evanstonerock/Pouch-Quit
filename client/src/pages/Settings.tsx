import { useSettings, useUpdateSettings, useResetSettings } from "@/hooks/use-pouch-data";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertSettingsSchema, type InsertAppSettings } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Settings as SettingsIcon, Save, RefreshCw, AlertOctagon } from "lucide-react";
import { useEffect } from "react";
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

export default function Settings() {
  const { data: settings, isLoading } = useSettings();
  const { mutate: updateSettings, isPending: isSaving } = useUpdateSettings();
  const { mutate: resetSettings, isPending: isResetting } = useResetSettings();

  const form = useForm<InsertAppSettings>({
    resolver: zodResolver(insertSettingsSchema),
    defaultValues: {
      baselinePouchesPerDay: 8,
      pouchesPerCan: 15,
      costPerCan: "6.00",
      // Keep these in the payload for backend compatibility,
      // just hide them from the UI.
      wakeHourStart: 8,
      wakeHourEnd: 22,
    },
  });

  // Load settings into form when fetched
  useEffect(() => {
    if (settings) {
      form.reset({
        baselinePouchesPerDay: settings.baselinePouchesPerDay,
        pouchesPerCan: settings.pouchesPerCan,
        costPerCan: String(settings.costPerCan),
        // Keep these synced even though hidden
        wakeHourStart: settings.wakeHourStart,
        wakeHourEnd: settings.wakeHourEnd,
      });
    }
  }, [settings, form]);

  const onSubmit = (data: InsertAppSettings) => {
    // Safety: ensure hidden fields always exist
    updateSettings({
      ...data,
      wakeHourStart: Number.isFinite(data.wakeHourStart) ? data.wakeHourStart : 8,
      wakeHourEnd: Number.isFinite(data.wakeHourEnd) ? data.wakeHourEnd : 22,
    });
  };

  if (isLoading) return <div className="p-8 text-center">Loading settings...</div>;

  return (
    <div className="pb-24 pt-8 px-4 max-w-md mx-auto min-h-screen">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-purple-500/10 rounded-xl">
          <SettingsIcon className="w-6 h-6 text-purple-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold font-display">Settings</h1>
          <p className="text-sm text-muted-foreground">Customize your goals</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="glass-panel p-6 rounded-2xl space-y-6">
            <h2 className="text-lg font-semibold text-white/90">Goals & Limits</h2>

            <FormField
              control={form.control}
              name="baselinePouchesPerDay"
              render={({ field }) => (
                <FormItem>
                  <div className="flex justify-between items-center mb-2">
                    <FormLabel>Baseline (Pouches/Day)</FormLabel>
                    <span className="text-xl font-bold font-display text-primary">{field.value}</span>
                  </div>
                  <FormControl>
                    <Slider
                      min={1}
                      max={30}
                      step={1}
                      value={[field.value]}
                      onValueChange={(val) => field.onChange(val[0])}
                      className="py-4"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Hidden fields kept for backend compatibility */}
            <FormField
              control={form.control}
              name="wakeHourStart"
              render={({ field }) => (
                <input type="hidden" value={field.value} readOnly />
              )}
            />
            <FormField
              control={form.control}
              name="wakeHourEnd"
              render={({ field }) => (
                <input type="hidden" value={field.value} readOnly />
              )}
            />
          </div>

          <div className="glass-panel p-6 rounded-2xl space-y-6">
            <h2 className="text-lg font-semibold text-white/90">Costs</h2>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="costPerCan"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cost per Can ($)</FormLabel>
                    <FormControl>
                      <Input {...field} className="bg-background/50" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="pouchesPerCan"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pouches per Can</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                        className="bg-background/50"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-12 text-lg font-semibold shadow-lg shadow-primary/20"
            disabled={isSaving}
          >
            {isSaving ? (
              <RefreshCw className="w-5 h-5 animate-spin mr-2" />
            ) : (
              <Save className="w-5 h-5 mr-2" />
            )}
            Save Changes
          </Button>
        </form>
      </Form>

      <div className="mt-12 pt-8 border-t border-white/5">
        <h3 className="text-destructive font-semibold mb-4 flex items-center gap-2">
          <AlertOctagon className="w-5 h-5" />
          Danger Zone
        </h3>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              className="w-full border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              Reset All Data
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-card border-white/10">
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete your logs and reset your settings.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => resetSettings()}
                className="bg-destructive hover:bg-destructive/90 text-white"
              >
                {isResetting ? "Resetting..." : "Yes, Delete Everything"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
