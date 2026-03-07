import { useState, useEffect } from 'react';

interface NetworkStatus {
  isConnected: boolean;
}

/**
 * Hook to monitor network connectivity status.
 * Uses a simple polling approach compatible with Expo.
 */
export function useNetworkStatus(): NetworkStatus {
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    let mounted = true;

    const checkConnection = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        await fetch('https://monthlykey.com/api/trpc/health', {
          method: 'HEAD',
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        if (mounted) setIsConnected(true);
      } catch {
        if (mounted) setIsConnected(false);
      }
    };

    checkConnection();
    const interval = setInterval(checkConnection, 30000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return { isConnected };
}
