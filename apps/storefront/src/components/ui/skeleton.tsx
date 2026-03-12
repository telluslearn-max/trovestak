import { cn } from "@/lib/utils";

function Skeleton({
    className,
    variant = "default",
    ...props
}: React.HTMLAttributes<HTMLDivElement> & { variant?: "default" | "card" | "text" | "avatar" }) {
    const variantClasses = {
        default: "animate-pulse rounded-md bg-muted",
        card: "animate-pulse rounded-2xl bg-muted/50",
        text: "animate-pulse rounded-md bg-muted h-4 w-full",
        avatar: "animate-pulse rounded-full bg-muted",
    };

    return (
        <div
            className={cn(variantClasses[variant], className)}
            {...props}
        />
    );
}

export { Skeleton };
