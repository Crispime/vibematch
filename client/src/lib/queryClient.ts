import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
  customHeaders?: Record<string, string>,
): Promise<Response> {
  const defaultHeaders: Record<string, string> = {};
  if (data) {
    defaultHeaders["Content-Type"] = "application/json";
  }
  
  // Include test user ID for development authentication
  const testUserId = localStorage.getItem('test-user-id');
  if (testUserId) {
    defaultHeaders['x-user-id'] = testUserId;
  }
  
  const headers = { ...defaultHeaders, ...customHeaders };
  
  const res = await fetch(url, {
    method,
    headers: Object.keys(headers).length > 0 ? headers : undefined,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Get user ID from localStorage for testing (set by OIDC test integration)
    const testUserId = localStorage.getItem('test-user-id');
    const headers: Record<string, string> = {};
    if (testUserId) {
      headers['x-user-id'] = testUserId;
    }
    
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
      headers: Object.keys(headers).length > 0 ? headers : undefined,
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
