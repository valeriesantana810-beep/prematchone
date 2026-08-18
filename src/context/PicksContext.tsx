import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { PickItem } from '@/lib/supabase';

interface PicksContextValue {
  items: PickItem[];
  stake: string;
  isOpen: boolean;
  addItem: (item: PickItem) => void;
  removeItem: (index: number) => void;
  clearItems: () => void;
  setStake: (stake: string) => void;
  openPanel: () => void;
  closePanel: () => void;
  togglePanel: () => void;
  count: number;
}

const PicksContext = createContext<PicksContextValue | undefined>(undefined);

export function PicksProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<PickItem[]>([]);
  const [stake, setStake] = useState<string>('');
  const [isOpen, setIsOpen] = useState(false);

  const addItem = useCallback((item: PickItem) => {
    setItems((prev) => {
      const exists = prev.some(
        (p) => p.match === item.match && p.selection === item.selection && p.market === item.market,
      );
      if (exists) return prev;
      return [...prev, item];
    });
    setIsOpen(true);
  }, []);

  const removeItem = useCallback((index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const clearItems = useCallback(() => {
    setItems([]);
    setStake('');
  }, []);

  const openPanel = useCallback(() => setIsOpen(true), []);
  const closePanel = useCallback(() => setIsOpen(false), []);
  const togglePanel = useCallback(() => setIsOpen((v) => !v), []);

  return (
    <PicksContext.Provider
      value={{
        items,
        stake,
        isOpen,
        addItem,
        removeItem,
        clearItems,
        setStake,
        openPanel,
        closePanel,
        togglePanel,
        count: items.length,
      }}
    >
      {children}
    </PicksContext.Provider>
  );
}

export function usePicks(): PicksContextValue {
  const ctx = useContext(PicksContext);
  if (!ctx) throw new Error('usePicks must be used within PicksProvider');
  return ctx;
}
