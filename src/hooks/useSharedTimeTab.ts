import { TimeTab } from "@/components/charts/TimeTabs";
import { useState, useCallback } from "react";

// Global shared state for time tabs
const globalTimeState = { current: TimeTab.Week };
const chartOverrides = new Map<string, TimeTab>();
const listeners = new Set<() => void>();

// Notify all components when state changes
const notifyListeners = () => {
  listeners.forEach(listener => listener());
};

export const useSharedTimeTab = (chartId?: string) => {
  const [, forceUpdate] = useState({});
  
  // Subscribe to global state changes
  const updateListener = useCallback(() => {
    forceUpdate({});
  }, []);
  
  // Add listener on mount, remove on unmount
  useState(() => {
    listeners.add(updateListener);
    return () => {
      listeners.delete(updateListener);
    };
  });
  
  // Get current tab - check for chart-specific override first, then global
  const currentTab = chartId && chartOverrides.has(chartId) 
    ? chartOverrides.get(chartId)! 
    : globalTimeState.current;
    
  const setTab = useCallback((tab: TimeTab) => {
    if (chartId) {
      // Individual chart override
      chartOverrides.set(chartId, tab);
    } else {
      // Global change - update global state and clear all overrides
      globalTimeState.current = tab;
      chartOverrides.clear();
    }
    notifyListeners();
  }, [chartId]);
  
  return [currentTab, setTab] as const;
};