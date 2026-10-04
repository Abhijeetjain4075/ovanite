import { Button } from "@/components/ui/button";
import { ArrowUpRight, Home } from "lucide-react";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background px-6">
      <main className="w-full max-w-xl border border-border bg-white px-8 py-10 sm:px-12 sm:py-12">
        <p className="eyebrow mono"><span className="marker" /> ROUTE / 404</p>
        <p className="mono mt-8 text-7xl font-semibold leading-none tracking-[-0.07em] text-foreground">404</p>
        <h1 className="mt-5 text-2xl font-semibold tracking-tight text-foreground">That route isn’t part of this workspace.</h1>
        <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">Check the address, or return to your private Ovanite workspace.</p>
        <Button onClick={() => setLocation("/")} className="button button-primary mt-8">
          <Home className="mr-2 h-4 w-4" /> Return to workspace <ArrowUpRight className="ml-2 h-4 w-4" />
        </Button>
      </main>
    </div>
  );
}
