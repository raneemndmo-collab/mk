/**
 * Monthly Key Mobile — tRPC API Client
 *
 * Consumes the backend API at https://monthlykey.com/api/trpc
 */

import * as SecureStore from 'expo-secure-store';

const TRPC_BASE = 'https://monthlykey.com/api/trpc';

async function getAuthHeaders(): Promise<Record<string, string>> {
  const token = await SecureStore.getItemAsync('session_token');
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
}

async function trpcQuery<T>(
  procedure: string,
  input?: Record<string, unknown>
): Promise<T> {
  const headers = await getAuthHeaders();
  const url = new URL(`${TRPC_BASE}/${procedure}`);
  if (input) {
    url.searchParams.set('input', JSON.stringify(input));
  }

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });

  const json = await response.json();

  if (!response.ok || json.error) {
    throw new Error(json.error?.message || `tRPC query failed: ${procedure}`);
  }

  return json.result.data as T;
}

async function trpcMutation<T>(
  procedure: string,
  input?: Record<string, unknown>
): Promise<T> {
  const headers = await getAuthHeaders();

  const response = await fetch(`${TRPC_BASE}/${procedure}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(input),
  });

  const json = await response.json();

  if (!response.ok || json.error) {
    throw new Error(json.error?.message || `tRPC mutation failed: ${procedure}`);
  }

  return json.result.data as T;
}

export const trpc = {
  auth: {
    login: { mutate: (input: Record<string, unknown>) => trpcMutation('auth.login', input) },
    me: { query: () => trpcQuery('auth.me') },
  },
  property: {
    search: {
      query: (input?: Record<string, unknown>) => trpcQuery('property.search', input),
    },
    getById: {
      query: (input: Record<string, unknown>) => trpcQuery('property.getById', input),
    },
  },
  booking: {
    create: {
      mutate: (input: Record<string, unknown>) => trpcMutation('booking.create', input),
    },
    list: {
      query: (input?: Record<string, unknown>) => trpcQuery('booking.list', input),
    },
  },
  notification: {
    subscribe: {
      mutate: (input: Record<string, unknown>) => trpcMutation('notification.subscribe', input),
    },
    unsubscribe: {
      mutate: (input: Record<string, unknown>) => trpcMutation('notification.unsubscribe', input),
    },
  },
  geo: {
    all: { query: () => trpcQuery('geo.all') },
  },
  cms: {
    getAll: { query: () => trpcQuery('cms.getAll') },
  },
};
