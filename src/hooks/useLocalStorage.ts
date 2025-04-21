import { isFunction } from "@/utils/utils";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export interface UseLocalStorageOptions<T> {
  /** Custom storage backend (defaults to window.localStorage) */
  storage?: StorageLike;
  serialize?: (value: T) => string;
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
    serialize,
    deserialize,
  }: UseLocalStorageOptions<T> = {},
): readonly [T, (v: T | ((p: T) => T)) => void, () => void] {
  /* ------------------------------------ init ----------------------------------- */
  const initial = useMemo(() => (isFunction(initialValue) ? initialValue() : initialValue), []);
  const read = () => (storage ? safeDeserialize<T>(storage.getItem(key), initial, { deserialize }) : initial);

  const [state, setState] = useState<T>(read);

  // Keep a stable ref to external (de)serialisers to avoid them in dep arrays
  const serializeRef = useRef(serialize);
  const deserializeRef = useRef(deserialize);
  serializeRef.current = serialize;
  deserializeRef.current = deserialize;

  /* ---------------------------- write‑through setter --------------------------- */
  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      setState((prev) => {
        const value = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
        if (storage) {
          try {
            storage.setItem(key, serializeRef.current ? serializeRef.current(value) : JSON.stringify(value));
            window.dispatchEvent(new CustomEvent("local-storage", { detail: { key, value } }));
          } catch {
            /* quota or serialisation errors are swallowed */
          }
        }
        return value;
      });
    },
    [key, storage],
  );

  /* ---------------------------------- remover ---------------------------------- */
  const remove = useCallback(() => {
    if (!storage) return;

    try {
      storage.removeItem(key);
      window.dispatchEvent(new CustomEvent("local-storage", { detail: { key, value: initial } }));
    } finally {
      setState(initial);
    }
  }, [key, storage, initial]);

  /* ------------------------ react to external or key change -------------------- */
  // biome-ignore lint/correctness/useExhaustiveDependencies: exclude (de)serialise refs
  useEffect(() => {
    // Key change: sync immediately
    setState(read());

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

  /* ----------------------------------- output ---------------------------------- */
  return useMemo(() => [state, set, remove] as const, [state, set, remove]);
}
