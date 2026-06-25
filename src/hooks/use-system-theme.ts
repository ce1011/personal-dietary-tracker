import { useSyncExternalStore } from "react"

type Theme = "light" | "dark"

function subscribe(callback: () => void) {
  const media = window.matchMedia("(prefers-color-scheme: dark)")
  media.addEventListener("change", callback)
  return () => media.removeEventListener("change", callback)
}

function getSnapshot(): Theme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light"
}

function getServerSnapshot(): Theme {
  return "light"
}

export function useSystemTheme(): Theme {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
