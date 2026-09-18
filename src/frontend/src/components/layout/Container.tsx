import type * as React from "react";

import { cn } from "@/lib/utils";

/** The single site container: max-w-[1400px] with responsive gutters. */
export function Container({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("mx-auto w-full max-w-[1400px] px-6 md:px-10", className)}
      {...props}
    />
  );
}
