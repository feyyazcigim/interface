import { isFunction } from "@/utils/utils";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export interface UseLocalStorageOptions<T> {
  /** Custom storage backend (defaults to window.localStorage) */
  storage?: StorageLike;
  /**
   * If the key is **missing** write `initialValue` into storage right away.
   * Default: false (opt‑in so we don’t surprise anyone)
   */
  initializeIfEmpty?: boolean;
  /** Serialize → string (defaults to JSON.stringify) */
  serialize?: (value: T) => string;
  /** Deserialize ← string (defaults to JSON.parse) */
  deserialize?: (raw: string) => T;
}

function safeDeserialize<T>(
  raw: string | null,
  fallback: T,
  { deserialize }: Pick<UseLocalStorageOptions<T>, "deserialize">,
): T {
  if (raw == null) return fallback;
  try {
    return deserialize?.(raw) ?? (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

export default function useLocalStorage<T = unknown>(
  key: string,
  initialValue: T | (() => T),
  {
    storage = typeof window !== "undefined" ? window.localStorage : undefined,
    initializeIfEmpty = false,
    serialize,
    deserialize,
  }: UseLocalStorageOptions<T> = {},
): readonly [T, (v: T | ((p: T) => T)) => void, () => void] {
  /* ------------------------------------ init ----------------------------------- */
  const initial = useMemo(() => (isFunction(initialValue) ? initialValue() : initialValue), []);

  const writeInitialIfNeeded = (value: T) => {
    if (!storage) return;
    try {
      storage.setItem(key, serialize ? serialize(value) : JSON.stringify(value));
      window.dispatchEvent(new CustomEvent("local-storage", { detail: { key, value } }));
    } catch {
      /* swallow quota / serialisation errors */
    }
  };

  const read = () => {
    if (!storage) return initial;

    const raw = storage.getItem(key);

    // Populate storage if empty and user asked for it
    if (raw === null && initializeIfEmpty) {
      writeInitialIfNeeded(initial);
      return initial;
    }

    return safeDeserialize<T>(raw, initial, { deserialize });
  };

  const [state, setState] = useState<T>(read);

  /* -------------------------------------------------------------------------- */
  /*                         keep serializers on a stable ref                   */
  /* -------------------------------------------------------------------------- */

  const serializeRef = useRef(serialize);
  const deserializeRef = useRef(deserialize);
  serializeRef.current = serialize;
  deserializeRef.current = deserialize;

  /* -------------------------------------------------------------------------- */
  /*                    setter — sync React state  &  storage                   */
  /* -------------------------------------------------------------------------- */

  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      setState((prev) => {
        const value = typeof next === "function" ? (next as (p: T) => T)(prev) : next;

        if (storage) {
          try {
            storage.setItem(key, serializeRef.current ? serializeRef.current(value) : JSON.stringify(value));
            window.dispatchEvent(new CustomEvent("local-storage", { detail: { key, value } }));
          } catch {
            /* ignore */
          }
        }
        return value;
      });
    },
    [key, storage],
  );

  /* -------------------------------------------------------------------------- */
  /*                              remover helper                                */
  /* -------------------------------------------------------------------------- */

  const remove = useCallback(() => {
    if (!storage) return;
    try {
      storage.removeItem(key);
      window.dispatchEvent(new CustomEvent("local-storage", { detail: { key, value: initial } }));
    } finally {
      setState(initial);
    }
  }, [key, storage, initial]);

  /* -------------------------------------------------------------------------- */
  /*                resubscribe when key / storage backend changes              */
  /* -------------------------------------------------------------------------- */

  // biome-ignore lint/correctness/useExhaustiveDependencies: custom refs intentionally excluded
  useEffect(() => {
    setState(read()); // sync immediately on key change

    if (!storage) return;

    const handleStorage = (e: StorageEvent) => {
      if (e.key === key) setState(read());
    };
    const handleCustom = (e: Event) => {
      const { key: changed, value } = (e as CustomEvent).detail ?? {};
      if (changed === key) setState(value);
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener("local-storage", handleCustom);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("local-storage", handleCustom);
    };
  }, [key, storage]);

  /* -------------------------------------------------------------------------- */
  /*                              public API tuple                              */
  /* -------------------------------------------------------------------------- */

  return useMemo(() => [state, set, remove] as const, [state, set, remove]);
}
