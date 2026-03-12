"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold text-foreground">
            Oops! Something went wrong
          </h2>
          <p className="text-muted-foreground">
            {error.message || "An unexpected error occurred. Please try again."}
          </p>
        </div>
        
        {error.digest && (
          <p className="text-sm text-muted-foreground font-mono">
            Error ID: {error.digest}
          </p>
        )}
        
        <Button onClick={() => reset()} variant="default">
          Try again
        </Button>
        
        <p className="text-sm text-muted-foreground">
          If the problem persists, please contact support.
        </p>
      </div>
    </div>
  );
}
