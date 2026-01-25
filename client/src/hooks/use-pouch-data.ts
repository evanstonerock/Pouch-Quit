import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import { type InsertAppSettings, type UpdateAppSettingsRequest } from "@shared/schema";

// ============================================
// SETTINGS HOOKS
// ============================================

export function useSettings() {
  return useQuery({
    queryKey: [api.settings.get.path],
    queryFn: async () => {
      const res = await fetch(api.settings.get.path);
      // If 404, we return null to signal no settings yet
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch settings");
      return api.settings.get.responses[200].parse(await res.json());
    },
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (updates: UpdateAppSettingsRequest) => {
      // Ensure numeric fields are numbers (coercion handled in backend usually, but good to be safe)
      const res = await fetch(api.settings.update.path, {
        method: api.settings.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (!res.ok) {
        if (res.status === 400) {
          const err = await res.json();
          throw new Error(err.message || "Validation failed");
        }
        throw new Error("Failed to update settings");
      }
      return api.settings.update.responses[200].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.settings.get.path] });
      toast({ title: "Settings saved", description: "Your preferences have been updated." });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });
}

export function useResetSettings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => {
      const res = await fetch(api.settings.reset.path, {
        method: api.settings.reset.method,
      });
      if (!res.ok) throw new Error("Failed to reset");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.settings.get.path] });
      queryClient.invalidateQueries({ queryKey: [api.logs.list.path] });
      toast({ title: "Reset Complete", description: "All data has been cleared." });
    },
  });
}

// ============================================
// LOGS HOOKS
// ============================================

export function useLogs() {
  return useQuery({
    queryKey: [api.logs.list.path],
    queryFn: async () => {
      const res = await fetch(api.logs.list.path);
      if (!res.ok) throw new Error("Failed to fetch logs");
      // Logs are usually sorted by DB, but we ensure descending sort here if needed
      const logs = api.logs.list.responses[200].parse(await res.json());
      return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    },
  });
}

export function useAddLog() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => {
      // Empty body is fine as per schema (optional input)
      const res = await fetch(api.logs.create.path, {
        method: api.logs.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}), 
      });

      if (!res.ok) throw new Error("Failed to log pouch");
      return api.logs.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.logs.list.path] });
      toast({ 
        title: "Pouch logged", 
        description: "Time to reset the clock.",
        duration: 2000 
      });
    },
  });
}

export function useDeleteLog() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.logs.delete.path, { id });
      const res = await fetch(url, { method: api.logs.delete.method });
      if (!res.ok) throw new Error("Failed to delete log");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.logs.list.path] });
      toast({ title: "Entry deleted", description: "Log removed from history." });
    },
  });
}

export function useDeleteLastLog() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => {
      const res = await fetch(api.logs.deleteLast.path, { method: api.logs.deleteLast.method });
      if (!res.ok) throw new Error("Failed to undo");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.logs.list.path] });
      toast({ title: "Undone", description: "Last entry removed." });
    },
  });
}
