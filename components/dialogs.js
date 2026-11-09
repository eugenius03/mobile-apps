import { useSyncExternalStore } from 'react';

let current = null;
const listeners = new Set();

function set(next) {
  current = next;
  listeners.forEach((l) => l());
}

export function confirm(title, message, confirmText) {
  return new Promise((resolve) => {
    set({
      title,
      message,
      confirmText,
      close(value) {
        set(null);
        resolve(value);
      },
    });
  });
}

export function useDialog() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => current
  );
}
