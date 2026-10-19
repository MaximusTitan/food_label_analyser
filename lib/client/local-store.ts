import { useSyncExternalStore } from "react";

/**
 * A localStorage-backed value usable with useSyncExternalStore. Falls back to
 * memory when storage is unavailable (private mode, blocked site data).
 */
export function createLocalStore<T>(key: string, parse: (raw: string | null) => T, initial: T) {
  const listeners = new Set<() => void>();
  let cachedRaw: string | null | undefined;
  let cached = initial;
  let memoryOnly = false;

  function get(): T {
    if (memoryOnly) return cached;
    let raw: string | null = null;
    try {
      raw = window.localStorage.getItem(key);
    } catch {
      memoryOnly = true;
      return cached;
    }
    if (raw !== cachedRaw) {
      cachedRaw = raw;
      cached = parse(raw);
    }
    return cached;
  }

  function set(value: T) {
    cached = value;
    try {
      const raw = JSON.stringify(value);
      window.localStorage.setItem(key, raw);
      cachedRaw = raw;
    } catch {
      memoryOnly = true;
    }
    listeners.forEach((listener) => listener());
  }

  function subscribe(listener: () => void) {
    listeners.add(listener);
    const onStorage = (event: StorageEvent) => {
      if (event.key === key) listener();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(listener);
      window.removeEventListener("storage", onStorage);
    };
  }

  function useValue(): T {
    return useSyncExternalStore(subscribe, get, () => initial);
  }

  return { get, set, useValue };
}
