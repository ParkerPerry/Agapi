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
  // Add more verbose logging for API requests
  console.log(`[API Request] ${method} ${url} starting`);
  
  // Add special logging for metrics analysis
  if (url === '/api/analyze-metric') {
    console.log(`[API Request] Metrics analysis request detected`);
    console.log(`[API Request] Request body size: ${data ? JSON.stringify(data).length : 0} bytes`);
    
    // Add lab ID logging if available
    const labId = data && typeof data === 'object' && 'labId' in data ? (data as any).labId : 'unknown';
    console.log(`[API Request] Lab ID: ${labId}`);
    
    // Stringify with special error handling due to possible circular references
    try {
      const jsonString = JSON.stringify(data);
      console.log(`[API Request] Successfully serialized request body`);
    } catch (err) {
      console.error(`[API Request] Failed to stringify request body:`, err);
    }
  }
  
  // Time the request
  const startTime = performance.now();
  
  try {
    const res = await fetch(url, {
      method: method,
      headers: data ? { "Content-Type": "application/json" } : {},
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include", // Add credentials inclusion to match the queryFn approach
    });
    
    const endTime = performance.now();
    console.log(`[API Request] ${method} ${url} completed in ${(endTime - startTime).toFixed(2)}ms with status ${res.status}`);

    if (!res.ok) {
      try {
        const error = await res.json();
        console.error(`[API Request] Error response:`, error);
        throw new Error(error.message || "An error occurred");
      } catch (e) {
        console.error(`[API Request] Failed to parse error response`);
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
      console.error(`[API Request] Failed to parse JSON response:`, error);
      return {};
    }
  } catch (fetchError) {
    // Handle fetch errors (network issues, etc.)
    console.error(`[API Request] Fetch error for ${method} ${url}:`, fetchError);
    throw fetchError;
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