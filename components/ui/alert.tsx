import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "info" | "success" | "warning" | "error";

const variantClasses: Record<Variant, string> = {
  info: "bg-blue-50 border-blue-200 text-blue-800",
  success: "bg-green-50 border-green-200 text-green-800",
  warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
  error: "bg-red-50 border-red-200 text-red-800",
};

export function Alert({
  variant = "info",
  title,
  children,
  className,
}: {
  variant?: Variant;
  title?: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-md border px-4 py-3 text-sm",
        variantClasses[variant],
        className,
      )}
    >
      {title && <p className="font-semibold mb-0.5">{title}</p>}
      {children && <div>{children}</div>}
    </div>
  );
}
