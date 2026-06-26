"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

interface SavedScholarshipIdsContextValue {
  ids: Set<string>;
  isLoaded: boolean;
  isSaved: (scholarshipId: string) => boolean;
  setSaved: (scholarshipId: string, saved: boolean) => void;
  refresh: () => Promise<void>;
}

const SavedScholarshipIdsContext =
  createContext<SavedScholarshipIdsContextValue | null>(null);

export function SavedScholarshipIdsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [ids, setIds] = useState<Set<string>>(new Set());
  const [isLoaded, setIsLoaded] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/bookmarks/ids", { credentials: "include" });
      if (!res.ok) {
        setIds(new Set());
        return;
      }
      const data = (await res.json()) as { ids: string[] };
      setIds(new Set(data.ids));
    } catch {
      setIds(new Set());
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo<SavedScholarshipIdsContextValue>(
    () => ({
      ids,
      isLoaded,
      isSaved: (scholarshipId) => ids.has(scholarshipId),
      setSaved: (scholarshipId, saved) => {
        setIds((prev) => {
          const next = new Set(prev);
          if (saved) next.add(scholarshipId);
          else next.delete(scholarshipId);
          return next;
        });
      },
      refresh,
    }),
    [ids, isLoaded, refresh]
  );

  return (
    <SavedScholarshipIdsContext.Provider value={value}>
      {children}
    </SavedScholarshipIdsContext.Provider>
  );
}

export function useSavedScholarshipIds() {
  const ctx = useContext(SavedScholarshipIdsContext);
  return ctx;
}
