import { Skeleton } from "@/components/ui/skeleton";

export default function ProductsLoading() {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between mb-8">
                <Skeleton className="h-10 w-48 rounded-xl" />
                <div className="flex gap-3">
                    <Skeleton className="h-10 w-32 rounded-xl" />
                    <Skeleton className="h-10 w-40 rounded-xl" />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                    <div key={i} className="bg-card rounded-[2rem] border border-border/50 overflow-hidden p-6 space-y-4 shadow-sm">
                        <Skeleton className="aspect-square w-full rounded-2xl" />
                        <div className="space-y-2">
                            <Skeleton className="h-5 w-3/4 rounded-lg" />
                            <div className="flex justify-between items-center pt-2">
                                <Skeleton className="h-4 w-1/4 rounded-lg opacity-50" />
                                <Skeleton className="h-4 w-1/4 rounded-lg" />
                            </div>
                        </div>
                        <div className="flex gap-2 pt-2">
                            <Skeleton className="h-9 flex-1 rounded-xl" />
                            <Skeleton className="h-9 w-9 rounded-xl" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
