import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/20">
      <div className="max-w-md w-full text-center space-y-4 rounded-3xl border border-border/80 bg-card p-8 shadow-sm">
        <div className="h-16 w-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black text-2xl">
          404
        </div>
        <h1 className="text-xl font-bold text-foreground">Page Not Found</h1>
        <p className="text-sm text-muted-foreground">
          The page or appointment reference you are looking for does not exist or has been moved.
        </p>
        <div className="pt-2 flex justify-center gap-3">
          <Button asChild className="rounded-xl">
            <Link href="/" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              <span>Back to Home</span>
            </Link>
          </Button>
          <Button asChild variant="outline" className="rounded-xl">
            <Link href="/book" className="flex items-center gap-2">
              <span>Book Appointment</span>
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
