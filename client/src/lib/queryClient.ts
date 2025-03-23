import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  url: string,
  method: string = "GET",
  data?: unknown | undefined,
): Promise<any> {
  const res = await fetch(url, {
    method: method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
  });

  if (!res.ok) {
    try {
      const error = await res.json();
      throw new Error(error.message || "An error occurred");
    } catch (e) {
      throw new Error(`Request failed: ${res.status} ${res.statusText}`);
    }
  }

  // Check if the response has content before trying to parse as JSON
  const contentType = res.headers.get('content-type');
  
  // If response is empty or not JSON, return an empty object
  if (res.status === 204 || !contentType || !contentType.includes('application/json')) {
    return {};
  }
  
  try {
    return await res.json();
  } catch (error) {
    // If JSON parsing fails but the request was successful, return empty object
    return {};
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    
    // Check if the response has content before trying to parse as JSON
    const contentType = res.headers.get('content-type');
    
    // If response is empty or not JSON, return an empty object
    if (res.status === 204 || !contentType || !contentType.includes('application/json')) {
      return null;
    }
    
    try {
      return await res.json();
    } catch (error) {
      // If JSON parsing fails but the request was successful, return null
      return null;
    }
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