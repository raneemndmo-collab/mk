import { useEffect } from "react";
import { useLocation } from "wouter";

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

/**
 * Tracks page views via Google Analytics on every route change.
 * Only fires when gtag is loaded (i.e., VITE_GA_MEASUREMENT_ID is set).
 */
export function usePageTracking() {
  const [location] = useLocation();

  useEffect(() => {
    if (typeof window.gtag === "function") {
      window.gtag("event", "page_view", {
        page_path: location,
        page_title: document.title,
      });
    }
  }, [location]);
}
