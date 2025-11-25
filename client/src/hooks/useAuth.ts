import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import type { User } from "@shared/schema";

export function useAuth() {
  // In development, allow test user ID from URL parameter (no default fallback)
  const isDev = import.meta.env.DEV;
  const urlParams = new URLSearchParams(window.location.search);
  const testUserId = urlParams.get('testUserId');
  const [authReady, setAuthReady] = useState(!isDev || !testUserId);
  
  // Store test user ID in localStorage for requests (if provided)
  useEffect(() => {
    if (isDev && testUserId) {
      localStorage.setItem('test-user-id', testUserId);
      setAuthReady(true);
    }
  }, [isDev, testUserId]);
  
  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: ["/api/auth/user"],
    retry: false,
    enabled: authReady, // Only query after localStorage is set
  });

  return {
    user,
    isLoading: isLoading || !authReady,
    isAuthenticated: !!user,
  };
}
