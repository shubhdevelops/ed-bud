"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

const publicRoutes = ['/login', '/register'];

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const user = localStorage.getItem('user');
      
      if (!user && !publicRoutes.includes(pathname)) {
        router.push('/login');
      } else if (user && publicRoutes.includes(pathname)) {
        router.push('/');
      }
      setIsLoading(false);
    };

    // Add a small delay to ensure smooth transition
    const timer = setTimeout(checkAuth, 100);
    return () => clearTimeout(timer);
  }, [pathname, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
} 