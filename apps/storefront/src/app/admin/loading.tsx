import { Skeleton } from "@/components/ui/skeleton";

export default function AdminLoading() {
    return (
        <div className="space-y-8 p-8 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-2">
                    <Skeleton className="h-10 w-64 rounded-xl" />
                    <Skeleton className="h-4 w-48 rounded-lg" />
                </div>
                <div className="flex gap-3">
                    <Skeleton className="h-12 w-32 rounded-2xl" />
                    <Skeleton className="h-12 w-32 rounded-2xl" />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-32 rounded-[2rem] border border-border/50" />
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Skeleton className="lg:col-span-2 h-[400px] rounded-[2.5rem] border border-border/50" />
                <Skeleton className="h-[400px] rounded-[2.5rem] border border-border/50" />
            </div>
        </div>
    );
}
