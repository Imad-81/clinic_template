"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCcw, Home } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/20">
      <div className="max-w-md w-full text-center space-y-4 rounded-3xl border border-border/80 bg-card p-8 shadow-sm">
        <div className="h-16 w-16 mx-auto rounded-2xl bg-destructive/10 flex items-center justify-center text-destructive">
          <AlertTriangle className="h-8 w-8" />
        </div>
        <h1 className="text-xl font-bold text-foreground">Something went wrong</h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          We experienced an unexpected issue processing your request. Please try reloading the page.
        </p>
        <div className="pt-2 flex justify-center gap-3">
          <Button onClick={() => reset()} variant="outline" className="rounded-xl flex items-center gap-2">
            <RefreshCcw className="h-4 w-4" />
            <span>Try Again</span>
          </Button>
          <Button asChild className="rounded-xl">
            <Link href="/" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              <span>Back Home</span>
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
