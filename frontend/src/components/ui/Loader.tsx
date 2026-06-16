import { cn } from "@/utils/cn";

interface LoaderProps { className?: string; size?: "sm" | "md" | "lg"; }

export function Loader({ className, size = "md" }: LoaderProps) {
  const s = { sm: "h-4 w-4", md: "h-8 w-8", lg: "h-10 w-10" }[size];
  return (
    <div
      className={cn("rounded-full animate-spin", s, className)}
      style={{ border: "2px solid rgba(0,0,0,0.08)", borderTopColor: "#1D1D1F" }}
    />
  );
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader size="lg" />
    </div>
  );
}
